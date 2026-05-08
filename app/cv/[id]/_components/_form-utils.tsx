"use client";
/**
 * Shared primitives for the CV form column.
 * All style lives here so section components stay focused on data.
 */

import type { CSSProperties } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Style tokens
// ─────────────────────────────────────────────────────────────────────────────

export const LABEL_STYLE: CSSProperties = {
  fontSize:      10.5,
  fontWeight:    600,
  color:         "#475569",
  textTransform: "uppercase",
  letterSpacing: ".08em",
  marginBottom:  4,
  display:       "block",
};

export const ITEM_CARD: CSSProperties = {
  border:       "1px solid #e5e7eb",
  borderRadius: 10,
  padding:      12,
  marginBottom: 10,
  background:   "#fafbfc",
  position:     "relative",
};

export const TWO_COL: CSSProperties = {
  display:             "grid",
  gridTemplateColumns: "1fr 1fr",
  gap:                 8,
};

const BASE_INPUT: CSSProperties = {
  width:       "100%",
  padding:     "8px 10px",
  border:      "1px solid #e5e7eb",
  borderRadius: 8,
  fontSize:    13,
  fontFamily:  "inherit",
  color:       "#0f172a",
  background:  "#fff",
  outline:     "none",
  boxSizing:   "border-box",
  transition:  "border-color .15s, box-shadow .15s",
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared focus/blur ring (violet, matches brand)
// ─────────────────────────────────────────────────────────────────────────────

type FocusEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const onFocus = (e: React.FocusEvent<FocusEl>) => {
  e.currentTarget.style.borderColor = "#7c3aed";
  e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(124,58,237,.12)";
};
const onBlur = (e: React.FocusEvent<FocusEl>) => {
  e.currentTarget.style.borderColor = "#e5e7eb";
  e.currentTarget.style.boxShadow   = "none";
};

// ─────────────────────────────────────────────────────────────────────────────
// Field — single-line labelled input
// ─────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  label?:       string;
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  type?:        string;
  disabled?:    boolean;
}

export function Field({ label, value, onChange, placeholder, type = "text", disabled }: FieldProps) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <label style={LABEL_STYLE}>{label}</label>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{ ...BASE_INPUT, opacity: disabled ? 0.5 : 1 }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Area — resizable labelled textarea
// ─────────────────────────────────────────────────────────────────────────────

interface AreaProps {
  label?:       string;
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  rows?:        number;
}

export function Area({ label, value, onChange, placeholder, rows = 3 }: AreaProps) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <label style={LABEL_STYLE}>{label}</label>}
      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{ ...BASE_INPUT, resize: "vertical", lineHeight: 1.55 }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AddBtn — dashed "+" button at the bottom of a section
// ─────────────────────────────────────────────────────────────────────────────

export function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width:        "100%",
        padding:      "9px",
        borderRadius: 8,
        border:       "1px dashed #c4b5fd",
        background:   "#f5f3ff",
        color:        "#7c3aed",
        fontSize:     12,
        fontWeight:   600,
        cursor:       "pointer",
        fontFamily:   "inherit",
        marginTop:    6,
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AIBtn — "✦ Reformuler avec l'IA" call-to-action.
// loading=true: shows spinning ⟳ and disables the button.
// The ai-spin keyframe lives in globals.css.
// ─────────────────────────────────────────────────────────────────────────────

export function AIBtn({
  onClick,
  label,
  loading = false,
}: {
  onClick:  () => void;
  label?:   string;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={label ?? "Reformuler avec l'IA"}
      style={{
        padding:     label ? "5px 10px" : "4px 8px",
        borderRadius: 6,
        border:      "1px solid #ddd6fe",
        background:  loading ? "#ede9fe" : "#f5f3ff",
        color:       "#6d28d9",
        fontSize:    label ? 11 : 10.5,
        fontWeight:  600,
        cursor:      loading ? "wait" : "pointer",
        fontFamily:  "inherit",
        display:     "inline-flex",
        alignItems:  "center",
        gap:         4,
        flexShrink:  0,
        whiteSpace:  "nowrap",
        opacity:     loading ? 0.75 : 1,
        transition:  "background .15s, opacity .15s",
      }}
    >
      {loading
        ? <span style={{ display: "inline-block", animation: "ai-spin .65s linear infinite" }}>⟳</span>
        : "✦"
      }
      {label ? ` ${label}` : ""}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RemoveBtn — ghost "×" next to item headers
// ─────────────────────────────────────────────────────────────────────────────

export function RemoveBtn({ onClick, label = "Supprimer" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding:     "3px 8px",
        borderRadius: 5,
        border:      "none",
        background:  "transparent",
        color:       "#94a3b8",
        fontSize:    11,
        cursor:      "pointer",
        fontFamily:  "inherit",
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ItemCard + ItemHead — wrapper + title row used by every repeating item
// ─────────────────────────────────────────────────────────────────────────────

export function ItemCard({ children }: { children: React.ReactNode }) {
  return <div style={ITEM_CARD}>{children}</div>;
}

export function ItemHead({ title, onRemove }: { title: string; onRemove: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", flex: 1 }}>{title || "—"}</span>
      <RemoveBtn onClick={onRemove} />
    </div>
  );
}
