"use client";
/**
 * useAIRewrite — client-side hook for streaming AI rewrites.
 *
 * Usage:
 *   const { rewrite, rewriting } = useAIRewrite();
 *   rewrite("experience.e1.bullets.0", bulletText, "bullet");
 *
 * While streaming:
 *   - `rewriting` holds the path being rewritten (truthy = in-progress).
 *   - The store is updated on every chunk so the live preview updates in
 *     real-time as tokens arrive — the user watches the text build up.
 *
 * Error handling:
 *   - Network / API error → silently rolls back to the original text.
 *   - Empty response → keeps the original (the model declined to rewrite).
 *
 * Concurrency:
 *   - Only one rewrite can run at a time. Clicking a second button while
 *     one is in-progress is a no-op (caller checks `loading` prop).
 */

import { useState, useCallback } from "react";
import { useCVStore } from "../../_store/cv-store";

export function useAIRewrite() {
  /** Path currently being rewritten, or null if idle. */
  const [rewriting, setRewriting] = useState<string | null>(null);

  const updatePath = useCVStore((s) => s.updatePath);
  const lang       = useCVStore((s) => s.lang);

  const rewrite = useCallback(
    async (
      path:    string,
      text:    string,
      context: "bullet" | "summary",
    ): Promise<void> => {
      // Guard: skip if already running or no meaningful text
      if (rewriting || !text.trim()) return;
      setRewriting(path);

      const original = text; // kept for rollback

      try {
        const res = await fetch("/api/cv/rewrite", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ text, context, lang }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`API error ${res.status}`);
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let result = "";

        // Read the stream chunk by chunk, updating the store (and preview) live
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
          if (result.trim()) updatePath(path, result.trimStart()); // progressive update
        }

        // Flush any remaining bytes
        result += decoder.decode();

        if (!result.trim()) {
          // Empty response — restore original to avoid blank field
          updatePath(path, original);
        } else {
          // Final clean write (trims any leading newline the model may emit)
          updatePath(path, result.trim());
        }
      } catch {
        // Any failure: roll back to original text
        updatePath(path, original);
      } finally {
        setRewriting(null);
      }
    },
    [lang, rewriting, updatePath],
  );

  return { rewrite, rewriting };
}
