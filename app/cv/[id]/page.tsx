"use client";
/**
 * CV Builder — /cv/[id]
 *
 * 1. Reads the CV row from Supabase on mount
 * 2. Initialises the Zustand store
 * 3. Mounts useAutosave (800 ms debounce → Supabase)
 * 4. Renders Topbar / CVForm (left) / CVPreview (right)
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useCVStore } from "../_store/cv-store";
import { CVDataSchema, DEFAULT_SECTION_ORDER, DEFAULT_SECTIONS_ENABLED } from "../_lib/schema";
import type { TemplateId, Lang, SectionId } from "../_lib/schema";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function CVBuilderPage() {
  const params  = useParams<{ id: string }>();
  const id      = params.id;
  const init    = useCVStore((s) => s.init);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from("cvs")
        .select("*")
        .eq("id", id)
        .single();

      if (err || !data) {
        setError(err?.message ?? "CV introuvable");
        return;
      }

      const parsed = CVDataSchema.safeParse(data.data);
      init(id, {
        cv:      parsed.success ? parsed.data : undefined,
        template: (data.template as TemplateId) ?? "corso",
        accent:   data.accent   ?? "#7c3aed",
        lang:     (data.lang    as Lang)       ?? "fr",
        order:    (data.section_order as SectionId[]) ?? DEFAULT_SECTION_ORDER,
        enabled:  (data.sections_enabled as Record<SectionId, boolean>) ?? { ...DEFAULT_SECTIONS_ENABLED },
        cvName:   data.name ?? "Mon CV",
      });
      setReady(true);
    }
    load();
  }, [id, init]);

  if (error) return (
    <div className="flex h-screen items-center justify-center text-sm text-red-600">
      {error}
    </div>
  );

  if (!ready) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-violet border-t-transparent" />
    </div>
  );

  return <BuilderShell cvId={id} />;
}

import { CVForm }      from "./_components/CVForm";
import { CVPreview }   from "./_components/CVPreview";
import { Topbar }      from "./_components/Topbar";
import { useAutosave } from "./_hooks/useAutosave";

// ─────────────────────────────────────────────────────────────────────────────
// BuilderShell — rendered once data is loaded
// ─────────────────────────────────────────────────────────────────────────────
function BuilderShell({ cvId }: { cvId: string }) {
  useAutosave(cvId);

  const [isMobile,  setIsMobile]  = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#fafbfc", fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif", color: "#0f172a" }}>
      <Topbar
        cvId={cvId}
        mobileTab={isMobile ? mobileTab : undefined}
        onToggleMobile={isMobile ? () => setMobileTab((t) => t === "form" ? "preview" : "form") : undefined}
      />

      {/* Desktop: side-by-side grid */}
      {!isMobile && (
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "minmax(380px, 480px) 1fr", minHeight: 0 }}>
          <CVForm />
          <CVPreview />
        </div>
      )}

      {/* Mobile: single tab */}
      {isMobile && (
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          {mobileTab === "form"    && <CVForm />}
          {mobileTab === "preview" && <CVPreview />}
        </div>
      )}
    </div>
  );
}

