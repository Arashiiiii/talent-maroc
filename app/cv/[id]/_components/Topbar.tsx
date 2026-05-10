"use client";
import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useCVStore } from "../../_store/cv-store";
import { computeScore } from "../../_lib/score";
import { ScoreRing }    from "./ScoreRing";
import { ScorePopover } from "./ScorePopover";
import { LangToggle }   from "./LangToggle";
import { useImport }    from "../_hooks/useImport";

interface Props {
  cvId:            string;
  mobileTab?:      "form" | "preview";
  onToggleMobile?: () => void;
}

export function Topbar({ cvId, mobileTab, onToggleMobile }: Props) {
  const cvName    = useCVStore((s) => s.cvName);
  const setCVName = useCVStore((s) => s.setCVName);
  const saving    = useCVStore((s) => s.saving);
  const lastSaved = useCVStore((s) => s.lastSaved);
  const cv        = useCVStore((s) => s.cv);
  const order     = useCVStore((s) => s.order);
  const enabled   = useCVStore((s) => s.enabled);

  const [scoreOpen,   setScoreOpen]   = useState(false);
  const { fileRef, trigger, handleFile, importing } = useImport();

  // Opens the print page with ?autoprint=1 — the browser's Save-as-PDF dialog
  // fires automatically once fonts are ready. No server-side Playwright needed.
  const downloadPDF = useCallback(() => {
    window.open(`/cv/${cvId}/print?autoprint=1`, "_blank");
  }, [cvId]);

  const { value: score } = useMemo(
    () => computeScore(cv, order, enabled),
    [cv, order, enabled],
  );

  const dotColor = saving ? "#f97316" : lastSaved ? "#16a34a" : "#94a3b8";

  const ghost = {
    padding:      "7px 12px",
    borderRadius: 7,
    border:       "1px solid #e5e7eb",
    background:   "#fff",
    color:        "#475569",
    fontSize:     12,
    fontWeight:   600,
    cursor:       "pointer",
    fontFamily:   "inherit",
    display:      "inline-flex",
    alignItems:   "center",
    gap:          5,
    whiteSpace:   "nowrap" as const,
  } as const;

  const primary = {
    ...ghost,
    border:     "none",
    background: "#0f172a",
    color:      "#fff",
    boxShadow:  "0 1px 3px rgba(0,0,0,.15)",
  } as const;

  const isMobile = mobileTab !== undefined;

  return (
    <div style={{
      display:      "flex",
      alignItems:   "center",
      gap:          isMobile ? 8 : 12,
      padding:      `0 ${isMobile ? 12 : 20}px`,
      height:       56,
      background:   "#fff",
      borderBottom: "1px solid #e5e7eb",
      flexShrink:   0,
      position:     "relative",
      overflow:     "hidden",
    }}>

      {/* ── Brand (links to home) ───────────────────────────────────────────── */}
      <Link
        href="/"
        style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: isMobile ? 8 : 14, borderRight: "1px solid #e5e7eb", height: "100%", flexShrink: 0, textDecoration: "none" }}
      >
        <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg, #7c3aed 0%, #7c3aed 50%, #f97316 50%, #f97316 100%)", flexShrink: 0 }} />
        {!isMobile && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            Talent <span style={{ color: "#f97316" }}>Maroc</span>
          </span>
        )}
      </Link>

      {/* ── Back crumb (hidden on mobile) ───────────────────────────────────── */}
      {!isMobile && (
        <Link href="/cv" style={{ fontSize: 12, color: "#64748b", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          ← CVs
        </Link>
      )}
      {!isMobile && <span style={{ color: "#cbd5e1", fontWeight: 300, fontSize: 18, flexShrink: 0 }}>/</span>}

      {/* ── Editable CV name ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, flex: isMobile ? 1 : undefined }}>
        <span
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const next = e.currentTarget.innerText.trim();
            if (next) setCVName(next);
            else e.currentTarget.innerText = cvName;
          }}
          style={{
            fontSize:     13,
            fontWeight:   600,
            color:        "#0f172a",
            outline:      "none",
            cursor:       "text",
            minWidth:     60,
            maxWidth:     isMobile ? "100%" : 200,
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
            borderRadius: 4,
            padding:      "2px 4px",
          }}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f3ff"; }}
          onBlurCapture={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          {cvName}
        </span>
        {!isMobile && <span style={{ color: "#cbd5e1", fontSize: 10, flexShrink: 0 }}>✏</span>}
      </div>

      {/* ── Autosave dot (desktop only) ──────────────────────────────────── */}
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, animation: saving ? "pulse 1.2s infinite" : "none", flexShrink: 0 }} />
          {saving ? "Enregistrement…" : lastSaved ? "Enregistré" : ""}
        </div>
      )}

      {/* ── Spacer ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Mobile: Form / Preview toggle ───────────────────────────────── */}
      {isMobile && onToggleMobile && (
        <button
          type="button"
          onClick={onToggleMobile}
          style={{
            padding:      "6px 12px",
            borderRadius: 7,
            border:       "1px solid #e5e7eb",
            background:   "#fff",
            color:        "#475569",
            fontSize:     12,
            fontWeight:   600,
            cursor:       "pointer",
            fontFamily:   "inherit",
            display:      "inline-flex",
            alignItems:   "center",
            gap:          5,
            flexShrink:   0,
          }}
        >
          {mobileTab === "form" ? "👁 Aperçu" : "✎ Formulaire"}
        </button>
      )}

      {/* ── Desktop controls ─────────────────────────────────────────────── */}
      {!isMobile && (
        <>
          <LangToggle />

          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setScoreOpen((o) => !o)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 8px", border: "1px solid #e5e7eb", borderRadius: 100, background: scoreOpen ? "#f5f3ff" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 500, color: "#475569" }}
            >
              <ScoreRing value={score} />
              <span><b style={{ color: "#0f172a" }}>{score}%</b> complet</span>
            </button>
            {scoreOpen && <ScorePopover onClose={() => setScoreOpen(false)} />}
          </div>

          <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: "none" }} onChange={handleFile} />
          <button type="button" onClick={trigger} disabled={importing} style={{ ...ghost, opacity: importing ? 0.6 : 1, cursor: importing ? "wait" : "pointer" }} title="Importer un CV (PDF ou DOCX)">
            {importing ? <span style={{ display: "inline-block", animation: "ai-spin .65s linear infinite" }}>⟳</span> : "↑"}
            {" "}{importing ? "Analyse…" : "Importer"}
          </button>
        </>
      )}

      {/* ── Download PDF (always visible) ────────────────────────────────── */}
      <button
        type="button"
        onClick={downloadPDF}
        style={{ ...primary, opacity: score < 30 ? 0.6 : 1, cursor: score < 30 ? "not-allowed" : "pointer", padding: isMobile ? "6px 10px" : "7px 12px" }}
        disabled={score < 30}
        title={score < 30 ? "Atteignez 30% pour télécharger" : "Télécharger en PDF"}
      >
        ↓
        {!isMobile && <> Télécharger PDF</>}
      </button>

    </div>
  );
}
