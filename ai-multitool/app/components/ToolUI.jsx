"use client";

import { useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { Copy, Sparkles, Trash2 } from "lucide-react";

export default function ToolUI({ tool, controls }) {
  const { fields, basePrompt } = tool;

  const [form, setForm] = useState({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requiredFilled = fields.every(
    (field) => (form[field.name] || "").trim().length > 0
  );

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPrompt = () => {
    let prompt = `Type: ${controls.type}
Tone: ${controls.tone}
Length: ${controls.length}
Style: ${controls.style}

TASK:
${basePrompt}`;

    fields.forEach((field) => {
      prompt = prompt.split(`{{${field.name}}}`).join(form[field.name] || "");
    });

    return prompt;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult("");

    // Safety net on top of the server's own per-model timeouts: if the
    // request itself never gets a response (network issue, cold start, etc.),
    // don't let the button spin forever with no feedback.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 65_000);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt() }),
        signal: controller.signal,
      });

      const contentType = res.headers.get("content-type") || "";

      // The API returns JSON on any error path and a plain-text stream on success.
      if (!res.ok || contentType.includes("application/json")) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response stream received from the server.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResult((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setError(
        err?.name === "AbortError"
          ? "The request took too long and was cancelled. Please try again."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleClear = () => {
    setForm({});
    setResult("");
    setError("");
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
    } catch {
      // Clipboard API can fail in insecure contexts; nothing critical to recover.
    }
  };

  return (
    <VStack align="stretch" spacing={4}>
      {fields.map((field) =>
        field.type === "textarea" ? (
          <Textarea
            key={field.name}
            placeholder={field.label}
            value={form[field.name] || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            rows={5}
          />
        ) : (
          <Input
            key={field.name}
            placeholder={field.label}
            value={form[field.name] || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        )
      )}

      <HStack>
        <Button
          leftIcon={<Sparkles size={16} />}
          colorScheme="teal"
          onClick={handleGenerate}
          isLoading={loading}
          isDisabled={!requiredFilled}
        >
          Generate
        </Button>

        <Tooltip label="Copy output">
          <IconButton
            aria-label="Copy output"
            icon={<Copy size={16} />}
            onClick={handleCopy}
            isDisabled={!result}
            variant="outline"
          />
        </Tooltip>

        <Tooltip label="Clear">
          <IconButton
            aria-label="Clear"
            icon={<Trash2 size={16} />}
            onClick={handleClear}
            variant="outline"
          />
        </Tooltip>
      </HStack>

      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Box
        bg="gray.50"
        _dark={{ bg: "gray.700" }}
        p={4}
        borderRadius="md"
        minH="160px"
        whiteSpace="pre-wrap"
      >
        {loading && !result ? (
          "Generating..."
        ) : result ? (
          result
        ) : (
          <Text color="gray.400">Your result will appear here.</Text>
        )}
      </Box>
    </VStack>
  );
}
