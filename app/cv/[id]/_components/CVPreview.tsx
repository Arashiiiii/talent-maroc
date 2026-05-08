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

import { useState, useLayoutEffect, useRef } from "react";
import { useCVStore } from "../../_store/cv-store";
import { CVRender, A4_W, A4_H } from "./templates";
import { TemplateStrip } from "./TemplateStrip";
import { ZoomControls }  from "./ZoomControls";

type ZoomState = number | "fit";

export function CVPreview() {
  const template   = useCVStore((s) => s.template);
  const accent     = useCVStore((s) => s.accent);
  const lang       = useCVStore((s) => s.lang);
  const order      = useCVStore((s) => s.order);
  const enabled    = useCVStore((s) => s.enabled);
  const cv         = useCVStore((s) => s.cv);
  const updatePath = useCVStore((s) => s.updatePath);

  const [zoom, setZoom]           = useState<ZoomState>("fit");
  const [fittedZoom, setFittedZoom] = useState(0.75);
  const stageRef = useRef<HTMLDivElement>(null);

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
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <TemplateStrip />
        </div>
        {/* Zoom controls live next to the strip so they're always visible */}
        <div style={{ padding: "0 14px", borderLeft: "1px solid #e5e7eb", background: "#fff", height: "100%", display: "flex", alignItems: "center", borderBottom: "1px solid #e5e7eb" }}>
          <ZoomControls zoom={effective} isAutoFit={isAutoFit} onAdjust={adjustZoom} onToggleFit={toggleFit} />
        </div>
      </div>

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
        <div style={{
          background:      "#fff",
          boxShadow:       "0 4px 16px rgba(15,23,42,.08), 0 1px 4px rgba(15,23,42,.04)",
          transformOrigin: "top center",
          transform:       `scale(${effective})`,
          width:           A4_W,
          marginBottom:    pageMarginBottom,
          borderRadius:    2,
          flexShrink:      0,
          direction:       "ltr", // template content is always LTR until Step 11 RTL pass
        }}>
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

        {/* Page metadata pill */}
        <div style={{
          marginTop:      `${Math.max(16, 28 * effective)}px`,
          fontSize:       10.5,
          color:          "#94a3b8",
          display:        "flex",
          gap:            10,
          alignItems:     "center",
          background:     "rgba(255,255,255,.92)",
          backdropFilter: "blur(8px)",
          padding:        "5px 14px",
          borderRadius:   100,
          border:         "1px solid #e5e7eb",
        }}>
          <span>A4 — 21 × 29,7 cm</span>
          <span>·</span>
          <span style={{ color: "#16a34a" }}>✓ Compatible ATS</span>
        </div>
      </div>
    </div>
  );
}
