"use client";
import { useCVStore } from "../../_store/cv-store";
import type { Lang } from "../../_lib/schema";

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "Fr" },
  { key: "en", label: "En" },
  { key: "ar", label: "ع"  },
];

export function LangToggle() {
  const lang    = useCVStore((s) => s.lang);
  const setLang = useCVStore((s) => s.setLang);

  return (
    <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 7, padding: 2, background: "#fff", gap: 0 }}>
      {LANGS.map(({ key, label }) => {
        const active = lang === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setLang(key)}
            style={{
              padding:      "4px 9px",
              borderRadius: 5,
              border:       "none",
              fontSize:     11,
              fontWeight:   active ? 700 : 500,
              fontFamily:   "inherit",
              color:        active ? "#7c3aed" : "#64748b",
              background:   active ? "#f5f3ff" : "transparent",
              cursor:       "pointer",
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
