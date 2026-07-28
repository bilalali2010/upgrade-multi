import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Fallback chain: if one free model is down or rate-limited upstream, try the next.
// Model availability on OpenRouter's free tier changes over time — verify these are
// still live at https://openrouter.ai/models before relying on them in production.
const MODELS = [
  "poolside/laguna-s-2.1:free",
  "inclusionai/ling-3.0-flash:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
];

const MAX_PROMPT_LENGTH = 6000;

// Best-effort, in-memory, per-instance rate limiter. It resets on redeploy/restart
// and is NOT shared across serverless instances. For real production traffic, swap
// this for a persistent store (e.g. Upstash Redis, Vercel KV).
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const requestLog = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(req) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided." }, { status: 400 });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt too long (max ${MAX_PROMPT_LENGTH} characters).` },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Server is missing the OPENROUTER_API_KEY environment variable." },
        { status: 500 }
      );
    }

    let lastErrorMessage = "All models failed to respond.";

    for (const model of MODELS) {
      try {
        const upstream = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
              max_tokens: 1200,
              stream: true,
            }),
          }
        );

        // A previous version of this route assumed any response with a body was a
        // valid stream. That let error payloads (401/429/etc.) get streamed back
        // to the client as if they were model output. We now check status first.
        if (!upstream.ok || !upstream.body) {
          const errText = await safeReadText(upstream);
          lastErrorMessage = `Model "${model}" responded with ${upstream.status}: ${errText.slice(
            0,
            200
          )}`;
          continue;
        }

        return new Response(toPlainTextStream(upstream.body), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      } catch (err) {
        lastErrorMessage = `Model "${model}" threw an error: ${err?.message || err}`;
        continue;
      }
    }

    return NextResponse.json({ error: lastErrorMessage }, { status: 502 });
  } catch (err) {
    console.error("Unhandled error in /api/generate:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

async function safeReadText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

/**
 * Converts an OpenRouter SSE stream into a plain-text stream of just the
 * generated content. The previous version split each raw chunk on "\n"
 * independently, so a "data: {...}" line that happened to straddle two
 * chunk boundaries would fail to parse and silently drop tokens. This
 * version keeps a carry-over buffer between reads so lines are only
 * processed once they're complete.
 */
function toPlainTextStream(upstreamBody) {
  const reader = upstreamBody.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.close();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep the possibly-incomplete last line for next pull

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;

        const payload = line.slice(5).trim();
        if (payload === "[DONE]") {
          controller.close();
          return;
        }

        try {
          const parsed = JSON.parse(payload);
          const content = parsed?.choices?.[0]?.delta?.content;
          if (content) controller.enqueue(encoder.encode(content));
        } catch {
          // Malformed/partial JSON fragment; buffering above minimizes how often
          // this happens, and a dropped fragment here just skips one token.
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}
