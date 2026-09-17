"use client";
/**
 * CVPreview — the right column of the builder.
 *
 * Layout (flex column):
 *   ┌─────────────────────────────────────────────┐
 *   │  TemplateStrip  (fixed height, never scrolls) │
 *   ├─────────────────────────────────────────────┤
 *   │  Stage (flex-1, overflowY: auto)              │
 *   │    ZoomControls  ← top-right, sticky          │
 *   │    A4 page                                    │
 *   │    Page metadata                              │
 *   └─────────────────────────────────────────────┘
 *
 * Fit-zoom: a ResizeObserver on the stage measures available width and
 * computes the largest scale that fits without horizontal overflow.
 * Manual zoom overrides fit; clicking "Ajuster" returns to fit mode.
 */

import { useState, useLayoutEffect, useEffect, useRef } from "react";
import { useCVStore } from "../../_store/cv-store";
import { CVRender, A4_W, A4_H } from "./templates";
import { TemplateStrip } from "./TemplateStrip";
import { ZoomControls }  from "./ZoomControls";
import { useTemplateEntitlements } from "../../_hooks/useTemplateEntitlements";

type ZoomState = number | "fit";

// Note on scope: no web page can actually block a screenshot (OS/phone
// level, always possible) or a determined person reading devtools/view-
// source — don't rely on this for hard security. What it does do: make an
// idle screenshot/copy-paste unusable as a real CV (watermark baked into
// the rendered page itself) and raise the bar against a casual "select-all,
// copy the finished CV" without breaking the ability to actually edit it.
function LockedPreviewWatermark() {
  const rows = Array.from({ length: 14 });
  const cols = Array.from({ length: 6 });
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 50 }}>
      <div style={{ position: "absolute", inset: "-50%", transform: "rotate(-32deg)", display: "flex", flexDirection: "column", gap: 46, justifyContent: "center", alignItems: "center" }}>
        {rows.map((_, row) => (
          <div key={row} style={{ display: "flex", gap: 60, whiteSpace: "nowrap" }}>
            {cols.map((_, col) => (
              <span key={col} style={{ fontSize: 22, fontWeight: 800, color: "rgba(124,58,237,.10)", letterSpacing: 2 }}>
                APERÇU — NON DÉBLOQUÉ
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CVPreview() {
  const template   = useCVStore((s) => s.template);
  const accent     = useCVStore((s) => s.accent);
  const lang       = useCVStore((s) => s.lang);
  const order      = useCVStore((s) => s.order);
  const enabled    = useCVStore((s) => s.enabled);
  const cv         = useCVStore((s) => s.cv);
  const updatePath = useCVStore((s) => s.updatePath);

  // The template is free to edit with — the download is the paid unlock.
  // Until it's unlocked, deter casual copy/screenshot of the finished
  // design (see LockedPreviewWatermark for what this can and can't do).
  const { owned } = useTemplateEntitlements();
  const templateOwned = owned?.has(template) ?? false;

  const [zoom, setZoom]           = useState<ZoomState>("fit");
  const [fittedZoom, setFittedZoom] = useState(0.75);
  const stageRef   = useRef<HTMLDivElement>(null);
  const pageRef    = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Overflow detection: watch the page's natural (unscaled) height ───────
  // A CSS transform doesn't affect layout size, so the observed box height
  // is the true content height regardless of zoom — compare it to A4_H to
  // warn the user before they end up with a 2-page PDF.
  //
  // Measured element must be `contentRef` (CVRender only), NOT `pageRef`
  // (the outer positioned box): pageRef also hosts the page-break marker
  // overlay below, and since that marker is only rendered while
  // `overflowing` is true, observing pageRef would include the marker's
  // own box in the measurement — pinning the height above the threshold
  // forever once triggered, so it could never clear back to "fits".
  const [contentH, setContentH] = useState(0);
  const measureRef = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setContentH(el.scrollHeight);
    measureRef.current = measure;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [template]);

  // Belt-and-braces re-measure: edits can land via the left-hand form (which
  // updates `cv` without ever focusing the previewed contentEditable node),
  // so force a fresh read after every commit instead of relying solely on
  // the ResizeObserver picking up the resulting DOM change.
  useEffect(() => {
    const raf = requestAnimationFrame(() => measureRef.current());
    return () => cancelAnimationFrame(raf);
  }, [cv, order, enabled, lang, template]);

  const pageCount   = Math.max(1, Math.ceil(contentH / A4_H));
  const overflowing = contentH > A4_H + 4; // small tolerance to avoid boundary flicker
  const fits        = contentH > 0 && !overflowing;

  // ── Fit-zoom: recompute whenever the stage is resized ────────────────────
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const compute = () => {
      const avail = el.clientWidth - 40; // 20 px padding each side
      setFittedZoom(Math.min(1.0, Math.max(0.35, avail / A4_W)));
    };

    compute();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", compute);
      return () => window.removeEventListener("resize", compute);
    }
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isAutoFit = zoom === "fit";
  const effective = isAutoFit ? fittedZoom : (zoom as number);

  const adjustZoom = (delta: number) => {
    const current = isAutoFit ? fittedZoom : (zoom as number);
    setZoom(Math.min(1.5, Math.max(0.3, parseFloat((current + delta).toFixed(2)))));
  };

  const toggleFit = () => setZoom(isAutoFit ? fittedZoom : "fit");

  // The CSS transform-based approach for A4 scaling:
  // - The page occupies A4_W × A4_H in the DOM (normal layout)
  // - transform:scale(effective) scales it visually
  // - marginBottom pulls the *next* element up by the freed space, so the
  //   scroll container's scrollable height matches the visual page size.
  const pageMarginBottom = -(A4_H * (1 - effective));

  return (
    <div style={{ flex: 1, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", background: "#f3f4f6" }}>

      {/* ── Template strip + accent + zoom ───────────────────────────────── */}
      {/* On narrow screens the strip needs its own full-width row — sharing
          one row with the zoom controls left only ~1 template thumbnail
          visible before the next one got cut off mid-name. */}
      <div className="cv-preview-toprow" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <TemplateStrip />
        </div>
        {/* Zoom controls live next to the strip so they're always visible */}
        <div className="cv-preview-zoomcell" style={{ padding: "0 14px", borderLeft: "1px solid #e5e7eb", background: "#fff", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #e5e7eb" }}>
          <ZoomControls zoom={effective} isAutoFit={isAutoFit} onAdjust={adjustZoom} onToggleFit={toggleFit} />
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .cv-preview-toprow { flex-direction: column; align-items: stretch; }
          .cv-preview-toprow > div:first-child { flex: none !important; width: 100%; }
          .cv-preview-zoomcell { border-left: none !important; border-top: 1px solid #e5e7eb; padding: 6px 14px !important; }
        }
      `}</style>

      {/* ── Stage ────────────────────────────────────────────────────────── */}
      <div
        ref={stageRef}
        style={{
          flex:            1,
          overflowY:       "auto",
          overflowX:       "hidden",
          display:         "flex",
          flexDirection:   "column",
          alignItems:      "center",
          padding:         "28px 16px 60px",
          direction:       lang === "ar" ? "rtl" : "ltr",
        }}
      >
        {/* A4 page */}
        <div
          ref={pageRef}
          className={!templateOwned ? "cv-locked-preview" : undefined}
          onContextMenu={!templateOwned ? (e) => e.preventDefault() : undefined}
          style={{
            background:      "#fff",
            boxShadow:       overflowing ? "0 0 0 2px #ef4444, 0 4px 16px rgba(15,23,42,.08)" : "0 4px 16px rgba(15,23,42,.08), 0 1px 4px rgba(15,23,42,.04)",
            transformOrigin: "top center",
            transform:       `scale(${effective})`,
            width:           A4_W,
            marginBottom:    pageMarginBottom,
            borderRadius:    2,
            flexShrink:      0,
            direction:       "ltr", // template content is always LTR until Step 11 RTL pass
            position:        "relative",
          }}>
          <div ref={contentRef}>
            <CVRender
              template={template}
              cv={cv}
              accent={accent}
              lang={lang}
              order={order}
              enabled={enabled}
              onUpdate={updatePath}
            />
          </div>

          {/* Page-break marker — shows exactly where content spills onto page 2.
              Rendered outside contentRef so it never contributes to its own
              measurement (see comment above the ResizeObserver setup). */}
          {overflowing && (
            <div style={{ position: "absolute", left: 0, right: 0, top: A4_H, zIndex: 5, pointerEvents: "none" }}>
              <div style={{ borderTop: "2px dashed #ef4444" }}/>
              <span style={{ position: "absolute", top: 6, right: 10, fontSize: 11, fontWeight: 700, color: "#dc2626", background: "#fff", padding: "3px 8px", borderRadius: 5, border: "1px solid #fecaca", whiteSpace: "nowrap" }}>
                Fin de la page 1 — le reste passe en page 2
              </span>
            </div>
          )}

          {!templateOwned && <LockedPreviewWatermark />}
        </div>

        {!templateOwned && (
          <style>{`
            /* Scoped to this page only: text stays selectable/editable while
               a field is focused (typing must keep working), but you can't
               drag-select the whole finished CV at once while just browsing. */
            .cv-locked-preview [contenteditable]:not(:focus) {
              user-select: none;
              -webkit-user-select: none;
            }
          `}</style>
        )}

        {/* Page metadata pill */}
        <div style={{
          marginTop:      `${Math.max(16, 28 * effective)}px`,
          fontSize:       10.5,
          color:          overflowing ? "#dc2626" : fits ? "#16a34a" : "#94a3b8",
          display:        "flex",
          gap:            10,
          alignItems:     "center",
          background:     overflowing ? "#fef2f2" : fits ? "#f0fdf4" : "rgba(255,255,255,.92)",
          backdropFilter: "blur(8px)",
          padding:        "5px 14px",
          borderRadius:   100,
          border:         overflowing ? "1px solid #fecaca" : fits ? "1px solid #bbf7d0" : "1px solid #e5e7eb",
          fontWeight:     overflowing || fits ? 700 : 400,
        }}>
          {overflowing ? (
            <>
              <span>⚠ Contenu trop long — {pageCount} pages au lieu d'1</span>
              <span>·</span>
              <span>Raccourcissez le texte pour tenir sur une page</span>
            </>
          ) : fits ? (
            <>
              <span>✓ Tient sur une page A4</span>
              <span>·</span>
              <span>Compatible ATS</span>
            </>
          ) : (
            <>
              <span>A4 — 21 × 29,7 cm</span>
              <span>·</span>
              <span style={{ color: "#16a34a" }}>✓ Compatible ATS</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
