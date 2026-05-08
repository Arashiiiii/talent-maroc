"use client";
/**
 * TemplateStrip — horizontal strip of 5 template thumbnails + accent picker.
 *
 * Each thumbnail renders a real CVRender at ~8.6% scale so the user sees
 * what their CV will look like in each template. We use `useDeferredValue`
 * so keystrokes update the main preview immediately while thumbnails catch up.
 */

import { useDeferredValue } from "react";
import { useCVStore } from "../../_store/cv-store";
import { TEMPLATE_REGISTRY } from "../../_lib/schema";
import { CVRender, A4_W, A4_H } from "./templates";
import { AccentPicker } from "./AccentPicker";

const THUMB_W     = 68;
const THUMB_H     = Math.round(THUMB_W * A4_H / A4_W); // ≈ 96
const THUMB_SCALE = THUMB_W / A4_W;                     // ≈ 0.0856

export function TemplateStrip() {
  const template    = useCVStore((s) => s.template);
  const setTemplate = useCVStore((s) => s.setTemplate);
  const setAccent   = useCVStore((s) => s.setAccent);
  const lang        = useCVStore((s) => s.lang);
  const order       = useCVStore((s) => s.order);
  const enabled     = useCVStore((s) => s.enabled);

  // Defer CV data so thumbnails don't block the main preview on every keystroke
  const rawCV = useCVStore((s) => s.cv);
  const cv    = useDeferredValue(rawCV);

  return (
    <div style={{
      display:       "flex",
      gap:           10,
      padding:       "12px 20px",
      borderBottom:  "1px solid #e5e7eb",
      background:    "#fff",
      overflowX:     "auto",
      alignItems:    "center",
      flexShrink:    0,
    }}>
      {/* "Modèles" label */}
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", color: "#94a3b8", textTransform: "uppercase", marginRight: 4, whiteSpace: "nowrap" }}>
        Modèles
      </span>

      {/* Thumbnails */}
      {TEMPLATE_REGISTRY.map((tpl) => {
        const selected = tpl.id === template;
        return (
          <div
            key={tpl.id}
            onClick={() => { setTemplate(tpl.id); setAccent(tpl.accent); }}
            title={tpl.name}
            style={{
              flexShrink:   0,
              width:        THUMB_W + 4,
              padding:      3,
              borderRadius: 10,
              border:       selected ? "1.5px solid #7c3aed" : "1px solid #e5e7eb",
              background:   selected ? "#f5f3ff" : "#fff",
              cursor:       "pointer",
              transition:   "all .15s",
              position:     "relative",
            }}
          >
            {/* Thumbnail canvas */}
            <div style={{ width: THUMB_W, height: THUMB_H, overflow: "hidden", borderRadius: 6, border: "1px solid #f0f0f0", background: "#fff" }}>
              <div style={{ width: A4_W, transform: `scale(${THUMB_SCALE})`, transformOrigin: "top left", pointerEvents: "none", userSelect: "none" }}>
                <CVRender
                  template={tpl.id}
                  cv={cv}
                  accent={tpl.accent}   // show each template in its own default colour
                  lang={lang}
                  order={order}
                  enabled={enabled}
                  onUpdate={() => {}}
                  readOnly
                />
              </div>
            </div>

            {/* Name */}
            <div style={{ fontSize: 10, fontWeight: 600, color: selected ? "#7c3aed" : "#0f172a", textAlign: "center", marginTop: 4, lineHeight: 1.2 }}>
              {tpl.name}
            </div>

            {/* PRO badge */}
            {tpl.tag === "Pro" && (
              <div style={{
                position:     "absolute", top: 5, right: 5,
                fontSize:     8, fontWeight: 700, letterSpacing: ".06em",
                padding:      "2px 5px", borderRadius: 100,
                background:   "#fef3c7", color: "#92400e",
                textTransform: "uppercase",
              }}>
                PRO
              </div>
            )}

            {/* Selected check */}
            {selected && (
              <div style={{
                position:       "absolute", top: 5, left: 5,
                width:          16, height: 16, borderRadius: "50%",
                background:     "#7c3aed", color: "#fff",
                fontSize:       9, fontWeight: 800,
                display:        "flex", alignItems: "center", justifyContent: "center",
              }}>
                ✓
              </div>
            )}
          </div>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Accent colour picker */}
      <div style={{ display: "flex", gap: 5, alignItems: "center", borderLeft: "1px solid #e5e7eb", paddingLeft: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", color: "#94a3b8", textTransform: "uppercase", marginRight: 4 }}>
          Couleur
        </span>
        <AccentPicker />
      </div>
    </div>
  );
}
