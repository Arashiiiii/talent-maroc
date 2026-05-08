"use client";
import { useCVStore } from "../../_store/cv-store";
import { ACCENT_OPTIONS } from "../../_lib/schema";

export function AccentPicker() {
  const accent    = useCVStore((s) => s.accent);
  const setAccent = useCVStore((s) => s.setAccent);

  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {ACCENT_OPTIONS.map((hex) => (
        <button
          key={hex}
          type="button"
          onClick={() => setAccent(hex)}
          title={hex}
          aria-label={`Couleur ${hex}`}
          style={{
            width:        18,
            height:       18,
            borderRadius: "50%",
            background:   hex,
            border:       hex === accent ? "2.5px solid #0f172a" : "1.5px solid rgba(0,0,0,.12)",
            cursor:       "pointer",
            padding:      0,
            transition:   "transform .12s",
            flexShrink:   0,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.15)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
        />
      ))}
    </div>
  );
}
