# AI Multi Tool Suite

A single Next.js app that bundles 16 AI content-generation tools (blog posts,
emails, ad copy, SEO keywords, resumes, code, social captions, and more)
behind one shared UI, streaming responses from [OpenRouter](https://openrouter.ai).

## Requirements

- Node.js 18.17+
- An [OpenRouter](https://openrouter.ai/keys) API key

## Setup

```bash
npm install
cp .env.example .env.local
# then edit .env.local and set OPENROUTER_API_KEY=sk-or-...
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

- **`app/providers.jsx`** — a client component wrapping the app in Chakra's
  `CacheProvider` (from `@chakra-ui/next-js`) + `ChakraProvider`. This is
  Chakra's official App Router integration; skipping `CacheProvider` and
  using `ChakraProvider` directly in a server-component `layout.jsx` can
  break static generation of Next's auto-generated routes.
- **`app/page.jsx`** — defines the 16 tools and their prompt templates, the
  "Type / Tone / Length / Style" controls, and a searchable tool picker modal.
- **`app/components/ToolUI.jsx`** — renders the form for whichever tool is
  selected, builds the final prompt, calls the API, and streams the result
  into view as it arrives (with Generate / Copy / Clear actions and inline
  error handling).
- **`app/api/generate/route.js`** — the only server route. It forwards the
  prompt to OpenRouter, tries a short fallback list of free models in order,
  and re-streams the model's output back to the browser as plain text.

## Notes on the API route

- It checks the upstream response status before streaming, so an auth/rate
  limit error from OpenRouter comes back as a clear JSON error instead of
  being streamed to the user as if it were generated text.
- It buffers partial SSE lines across chunk boundaries so tokens aren't
  silently dropped when a line is split across two reads.
- It includes a **basic, in-memory, per-instance rate limiter** (20
  requests/minute per IP) as a minimal safety net. This resets on redeploy
  and isn't shared across serverless instances — swap in a persistent store
  (Upstash Redis, Vercel KV, etc.) before relying on it in production.
- Free-tier model availability on OpenRouter changes over time. If a
  generation request fails, check the model IDs in `MODELS` at the top of
  `route.js` against [openrouter.ai/models](https://openrouter.ai/models)
  and update them if needed.

## Deploying

Works out of the box on [Vercel](https://vercel.com/new): import the repo,
set the `OPENROUTER_API_KEY` environment variable in the project settings,
and deploy. No other configuration is required.

## Tech stack

Next.js 14 (App Router) · React 18 · Chakra UI (with light/dark mode) ·
lucide-react icons
