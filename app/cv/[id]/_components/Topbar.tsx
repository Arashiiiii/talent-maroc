"use client";
/**
 * Topbar — 56 px chrome bar at the top of the builder.
 *
 * Left:   brand logo · back crumb · "/" · editable CV name · autosave dot
 * Right:  LangToggle · Score pill · Importer · Aperçu · Télécharger PDF
 *
 * Editable name: contentEditable span — calls setCVName on blur.
 * Autosave:      reading from store.saving / store.lastSaved.
 * Score pill:    click to open ScorePopover.
 * Download:      opens /cv/[id]/print in a new tab (real PDF in Step 8).
 */

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useCVStore } from "../../_store/cv-store";
import { computeScore } from "../../_lib/score";
import { ScoreRing }    from "./ScoreRing";
import { ScorePopover } from "./ScorePopover";
import { LangToggle }   from "./LangToggle";
import { useImport }    from "../_hooks/useImport";

interface Props {
  cvId: string;
}

export function Topbar({ cvId }: Props) {
  const cvName    = useCVStore((s) => s.cvName);
  const setCVName = useCVStore((s) => s.setCVName);
  const saving    = useCVStore((s) => s.saving);
  const lastSaved = useCVStore((s) => s.lastSaved);
  const cv        = useCVStore((s) => s.cv);
  const order     = useCVStore((s) => s.order);
  const enabled   = useCVStore((s) => s.enabled);

  const [scoreOpen,    setScoreOpen]    = useState(false);
  const [downloading,  setDownloading]  = useState(false);
  const { fileRef, trigger, handleFile, importing } = useImport();

  const downloadPDF = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/cv/${cvId}/pdf`);
      if (!res.ok) throw new Error(`PDF error ${res.status}`);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = href;
      a.download = `${cvName.replace(/[^a-zA-Z0-9\-_]/g, "_") || "cv"}.pdf`;
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      alert("Erreur lors de la génération du PDF. Veuillez réessayer.");
    } finally {
      setDownloading(false);
    }
  }, [cvId, cvName, downloading]);

  const { value: score } = useMemo(
    () => computeScore(cv, order, enabled),
    [cv, order, enabled],
  );

  // ── Autosave status text ─────────────────────────────────────────────────
  const saveLabel = saving
    ? "Enregistrement…"
    : lastSaved
    ? "Enregistré"
    : "Non enregistré";

  const dotColor = saving ? "#f97316" : lastSaved ? "#16a34a" : "#94a3b8";

  // ── Shared button styles ─────────────────────────────────────────────────
  const ghost = {
    padding:    "7px 12px",
    borderRadius: 7,
    border:     "1px solid #e5e7eb",
    background: "#fff",
    color:      "#475569",
    fontSize:   12,
    fontWeight: 600,
    cursor:     "pointer",
    fontFamily: "inherit",
    display:    "inline-flex",
    alignItems: "center",
    gap:        5,
    whiteSpace: "nowrap" as const,
  } as const;

  const primary = {
    ...ghost,
    border:     "none",
    background: "#0f172a",
    color:      "#fff",
    boxShadow:  "0 1px 3px rgba(0,0,0,.15)",
  } as const;

  return (
    <div style={{
      display:       "flex",
      alignItems:    "center",
      gap:           12,
      padding:       "0 20px",
      height:        56,
      background:    "#fff",
      borderBottom:  "1px solid #e5e7eb",
      flexShrink:    0,
      position:      "relative",
    }}>

      {/* ── Brand ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 14, borderRight: "1px solid #e5e7eb", height: "100%", flexShrink: 0 }}>
        {/* Logo square */}
        <div style={{
          width:        26, height:    26,
          borderRadius: 6,
          background:   "linear-gradient(135deg, #7c3aed 0%, #7c3aed 50%, #f97316 50%, #f97316 100%)",
          flexShrink:   0,
        }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
          Talent <span style={{ color: "#f97316" }}>Maroc</span>
        </span>
      </div>

      {/* ── Back crumb ──────────────────────────────────────────────────────── */}
      <Link href="/cv" style={{ fontSize: 12, color: "#64748b", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        ← CV
      </Link>

      <span style={{ color: "#cbd5e1", fontWeight: 300, fontSize: 18, flexShrink: 0 }}>/</span>

      {/* ── Editable CV name ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <span
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const next = e.currentTarget.innerText.trim();
            if (next) setCVName(next);
            else e.currentTarget.innerText = cvName; // revert if cleared
          }}
          style={{
            fontSize:   13,
            fontWeight: 600,
            color:      "#0f172a",
            outline:    "none",
            cursor:     "text",
            minWidth:   60,
            maxWidth:   240,
            overflow:   "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            borderRadius: 4,
            padding:    "2px 4px",
          }}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f3ff"; }}
          onBlurCapture={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          {cvName}
        </span>
        <span style={{ color: "#cbd5e1", fontSize: 10, flexShrink: 0 }}>✏</span>
      </div>

      {/* ── Autosave indicator ───────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
        <span style={{
          width:        6, height:     6,
          borderRadius: "50%",
          background:   dotColor,
          animation:    saving ? "pulse 1.2s infinite" : "none",
          flexShrink:   0,
        }} />
        {saveLabel}
      </div>

      {/* ── Spacer ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Lang toggle ──────────────────────────────────────────────────── */}
      <LangToggle />

      {/* ── Score pill ───────────────────────────────────────────────────── */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setScoreOpen((o) => !o)}
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          8,
            padding:      "4px 10px 4px 8px",
            border:       "1px solid #e5e7eb",
            borderRadius: 100,
            background:   scoreOpen ? "#f5f3ff" : "#fff",
            cursor:       "pointer",
            fontFamily:   "inherit",
            fontSize:     11.5,
            fontWeight:   500,
            color:        "#475569",
          }}
        >
          <ScoreRing value={score} />
          <span><b style={{ color: "#0f172a" }}>{score}%</b> complet</span>
        </button>

        {scoreOpen && <ScorePopover onClose={() => setScoreOpen(false)} />}
      </div>

      {/* ── Importer ─────────────────────────────────────────────────────── */}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={trigger}
        disabled={importing}
        style={{
          ...ghost,
          opacity: importing ? 0.6 : 1,
          cursor:  importing ? "wait" : "pointer",
        }}
        title="Importer un CV existant (PDF ou DOCX)"
      >
        {importing
          ? <span style={{ display: "inline-block", animation: "ai-spin .65s linear infinite" }}>⟳</span>
          : "↑"
        }
        {" "}{importing ? "Analyse…" : "Importer"}
      </button>

      {/* ── Aperçu ───────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => window.open(`/cv/${cvId}/print`, "_blank")}
        style={ghost}
      >
        👁 Aperçu
      </button>

      {/* ── Télécharger PDF ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={downloadPDF}
        style={{
          ...primary,
          opacity:  (score < 30 || downloading) ? 0.6 : 1,
          cursor:   (score < 30 || downloading) ? "not-allowed" : "pointer",
        }}
        disabled={score < 30 || downloading}
        title={score < 30 ? "Atteignez 30% pour télécharger" : "Télécharger en PDF"}
      >
        {downloading
          ? <span style={{ display: "inline-block", animation: "ai-spin .65s linear infinite" }}>⟳</span>
          : "↓"
        }
        {" "}{downloading ? "Génération…" : "Télécharger PDF"}
      </button>

    </div>
  );
}
