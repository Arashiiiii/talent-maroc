"use client";
/**
 * ScorePopover — drill-down panel that lists what's done and what's missing.
 * Dismisses when the user clicks outside.
 */
import { useEffect, useRef, useMemo } from "react";
import { useMemo as useMemo2 } from "react"; // satisfy linter for the single import
import { useCVStore } from "../../_store/cv-store";
import { computeScore } from "../../_lib/score";
import { ScoreRing } from "./ScoreRing";

interface Props {
  onClose: () => void;
}

export function ScorePopover({ onClose }: Props) {
  const ref    = useRef<HTMLDivElement>(null);
  const cv      = useCVStore((s) => s.cv);
  const order   = useCVStore((s) => s.order);
  const enabled = useCVStore((s) => s.enabled);

  const { value, items } = useMemo(
    () => computeScore(cv, order, enabled),
    [cv, order, enabled],
  );

  // Dismiss on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler, { capture: true });
    return () => document.removeEventListener("mousedown", handler, { capture: true });
  }, [onClose]);

  const done    = items.filter((i) => i.done);
  const missing = items.filter((i) => !i.done);

  return (
    <div
      ref={ref}
      style={{
        position:     "absolute",
        top:          44,
        right:        0,
        width:        300,
        background:   "#fff",
        border:       "1px solid #e5e7eb",
        borderRadius: 12,
        padding:      16,
        boxShadow:    "0 8px 32px rgba(15,23,42,.12)",
        zIndex:       50,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <ScoreRing value={value} size={36} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{value}%</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Complétude du CV</div>
        </div>
      </div>

      {/* Missing items */}
      {missing.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
            Pour progresser
          </div>
          {missing.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12, marginBottom: 6, color: "#374151" }}>
              <span>· {item.label}</span>
              <span style={{ color: "#16a34a", fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>+{item.delta}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Done items */}
      {done.length > 0 && (
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
            Complété
          </div>
          {done.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginBottom: 5, color: "#64748b" }}>
              <span style={{ color: "#16a34a", fontSize: 11 }}>✓</span>
              <span style={{ textDecoration: "line-through" }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Gate hint */}
      {value < 30 && (
        <div style={{ marginTop: 12, padding: "9px 11px", background: "#fef3c7", borderRadius: 8, fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>
          Le téléchargement PDF est activé à partir de 30 % de complétion.
        </div>
      )}
    </div>
  );
}
