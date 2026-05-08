/**
 * POST /api/cv/rewrite
 *
 * Body: { text: string, context: "bullet" | "summary", lang: "fr" | "en" | "ar" }
 *
 * Streams the rewritten text back as plain UTF-8 so the client can update
 * the form field (and live preview) incrementally as tokens arrive.
 *
 * Model: claude-haiku-4-5-20251001 — fast and cheap for short rewrites.
 * Hard constraints enforced in the system prompt:
 *   - Action-verb-led (past tense)
 *   - Preserves all numbers, tools, names — never fabricates
 *   - Language matches the CV lang setting
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Request validation ────────────────────────────────────────────────────────

const BodySchema = z.object({
  text:    z.string().min(1).max(2000).trim(),
  context: z.enum(["bullet", "summary"]),
  lang:    z.enum(["fr", "en", "ar"]).default("fr"),
});

// ── System prompts ────────────────────────────────────────────────────────────

const LANG_LABEL: Record<string, string> = {
  fr: "French (français)",
  en: "English",
  ar: "Arabic (العربية) — use RTL conventions",
};

function bulletPrompt(lang: string): string {
  return `You are a professional CV writer specialising in the Moroccan and French-speaking job market.

Rewrite the given CV bullet point strictly following these rules:
1. Start with a strong PAST-TENSE action verb (examples for FR: Piloté, Développé, Réduit, Animé, Déployé, Conçu, Négocié; for EN: Led, Built, Reduced, Designed, Delivered)
2. Preserve EVERY factual detail — numbers, percentages, tools, company names, time periods. Do not invent anything.
3. If a concrete measurable outcome is already implied in the text, make it explicit. If not implied, do not add one.
4. Target: 15–25 words, one punchy sentence.
5. Output ONLY the rewritten bullet — no quotes, no preamble, no explanation.
6. Language: ${LANG_LABEL[lang] ?? LANG_LABEL.fr}`;
}

function summaryPrompt(lang: string): string {
  return `You are a professional CV writer specialising in the Moroccan and French-speaking job market.

Rewrite the given professional profile summary strictly following these rules:
1. Open with the candidate's domain and seniority (e.g. "Ingénieur Full Stack avec 5 ans d'expérience…")
2. Highlight 2–3 specific strengths that are visible in the original text
3. Close with a forward-looking sentence about what they bring to a new team
4. Target: 2–4 sentences, confident, direct, no clichés
5. Preserve ALL factual details — never fabricate anything not in the original
6. Output ONLY the rewritten summary — no quotes, no preamble, no explanation
7. Language: ${LANG_LABEL[lang] ?? LANG_LABEL.fr}`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  // Validate input
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { text, context, lang } = body;
  const systemPrompt = context === "bullet" ? bulletPrompt(lang) : summaryPrompt(lang);

  // Create a streaming Anthropic request
  const anthropicStream = client.messages.stream({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: context === "summary" ? 350 : 130,
    system:     systemPrompt,
    messages:   [{ role: "user", content: text }],
  });

  // Pipe Anthropic's text deltas into a Web ReadableStream
  const encoder = new TextEncoder();
  const webStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
    cancel() {
      anthropicStream.abort();
    },
  });

  return new Response(webStream, {
    headers: {
      "Content-Type":            "text/plain; charset=utf-8",
      "Cache-Control":           "no-store",
      "X-Content-Type-Options":  "nosniff",
      // Allow the client to read this header for progress indication
      "Transfer-Encoding":       "chunked",
    },
  });
}
