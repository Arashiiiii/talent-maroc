"use client";
/**
 * useAutosave — subscribes to the CV store and persists to Supabase
 * 800 ms after the last change. Completely decoupled from the store itself.
 *
 * Call once from BuilderShell (which owns the cvId from the URL).
 */

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useCVStore } from "../../_store/cv-store";
import type { Json } from "../../_lib/db-types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function useAutosave(cvId: string) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = useCVStore.subscribe((state, prev) => {
      // Only fire if something that needs persisting actually changed
      if (
        state.cv       === prev.cv       &&
        state.template === prev.template &&
        state.accent   === prev.accent   &&
        state.lang     === prev.lang     &&
        state.order    === prev.order    &&
        state.enabled  === prev.enabled  &&
        state.cvName   === prev.cvName
      ) return;

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => doPersist(cvId), 800);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [cvId]);
}

async function doPersist(cvId: string) {
  const s = useCVStore.getState();
  s.markSaving();
  try {
    await supabase
      .from("cvs")
      .update({
        name:             s.cvName,
        data:             s.cv        as unknown as Json,
        template:         s.template,
        accent:           s.accent,
        lang:             s.lang,
        section_order:    s.order     as unknown as Json,
        sections_enabled: s.enabled   as unknown as Json,
      })
      .eq("id", cvId);
  } catch {
    // Non-fatal: the user hasn't lost data, just this save attempt failed.
    // A toast in a future step can surface this.
  }
  s.markSaved();
}
