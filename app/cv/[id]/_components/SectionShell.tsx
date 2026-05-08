"use client";
/**
 * SectionShell — draggable, collapsible accordion card for one CV section.
 *
 * dnd-kit integration:
 *   - `useSortable` provides the transform CSS + drag-state booleans.
 *   - Only the grip handle receives `listeners`, so clicking the title/chevron
 *     anywhere on the card does NOT accidentally start a drag.
 *   - `setActivatorNodeRef` pins the keyboard-activation point to the grip.
 *
 * Collapse: each shell manages its own `open` boolean (no lifted state needed).
 * Eye toggle: calls `onToggleEnabled` from the store via CVForm.
 */

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SectionId } from "../../_lib/schema";
import { SECTION_META } from "../../_lib/schema";

// ── Tiny SVG icons ────────────────────────────────────────────────────────────

const GripIcon = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden>
    <circle cx="2"  cy="2"  r="1.2" />
    <circle cx="8"  cy="2"  r="1.2" />
    <circle cx="2"  cy="7"  r="1.2" />
    <circle cx="8"  cy="7"  r="1.2" />
    <circle cx="2"  cy="12" r="1.2" />
    <circle cx="8"  cy="12" r="1.2" />
  </svg>
);

const EyeOnIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────

interface SectionShellProps {
  id:              SectionId;
  count?:          number | null;
  enabled:         boolean;
  onToggleEnabled: () => void;
  children:        React.ReactNode;
  defaultOpen?:    boolean;
}

export function SectionShell({
  id,
  count,
  enabled,
  onToggleEnabled,
  children,
  defaultOpen = false,
}: SectionShellProps) {
  const [open, setOpen] = useState(defaultOpen);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const dragStyle = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.35 : 1,
    position:   "relative" as const,
    zIndex:     isDragging ? 10 : undefined,
  };

  const meta = SECTION_META[id];

  return (
    <div ref={setNodeRef} style={dragStyle}>
      <div style={{
        border:       "1px solid #e5e7eb",
        borderRadius: 12,
        marginBottom: 10,
        background:   "#fff",
        opacity:      enabled ? 1 : 0.55,
      }}>
        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div style={{
          display:    "flex",
          alignItems: "center",
          gap:        10,
          padding:    "12px 14px",
          userSelect: "none",
        }}>
          {/* Grip — only element that activates the drag */}
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Glisser pour réordonner"
            style={{
              appearance:  "none",
              border:      "none",
              background:  "transparent",
              padding:     0,
              width:       18,
              height:      18,
              color:       "#cbd5e1",
              cursor:      isDragging ? "grabbing" : "grab",
              display:     "flex",
              alignItems:  "center",
              justifyContent: "center",
              flexShrink:  0,
              touchAction: "none",
            }}
          >
            <GripIcon />
          </button>

          {/* Title — click to expand/collapse */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={{
              appearance:     "none",
              border:         "none",
              background:     "transparent",
              padding:        0,
              flex:           1,
              textAlign:      "left",
              fontSize:       13,
              fontWeight:     600,
              color:          "#0f172a",
              cursor:         "pointer",
              fontFamily:     "inherit",
              textDecoration: enabled ? "none" : "line-through",
            }}
          >
            {meta.label}
          </button>

          {/* Count badge */}
          {count != null && (
            <span style={{ fontSize: 11, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
              {count}
            </span>
          )}

          {/* Eye toggle */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleEnabled(); }}
            title={enabled ? "Masquer la section" : "Afficher la section"}
            aria-label={enabled ? "Masquer" : "Afficher"}
            style={{
              appearance: "none",
              width:      24,
              height:     24,
              borderRadius: 6,
              border:     `1px solid ${enabled ? "#ddd6fe" : "#e5e7eb"}`,
              background: "#fff",
              color:      enabled ? "#7c3aed" : "#94a3b8",
              cursor:     "pointer",
              display:    "flex",
              alignItems: "center",
              justifyContent: "center",
              padding:    0,
              flexShrink: 0,
            }}
          >
            {enabled ? <EyeOnIcon /> : <EyeOffIcon />}
          </button>

          {/* Chevron */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={{
              appearance: "none",
              border:     "none",
              background: "transparent",
              padding:    0,
              fontSize:   10,
              color:      "#94a3b8",
              cursor:     "pointer",
              transform:  open ? "rotate(180deg)" : "none",
              transition: "transform .18s",
              flexShrink: 0,
            }}
          >
            ▾
          </button>
        </div>

        {/* ── Body — only rendered when open AND enabled ─────────────────── */}
        {open && enabled && (
          <div style={{ padding: "4px 14px 16px" }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
