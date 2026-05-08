"use client";
/**
 * InlineEditable (IE) — contentEditable wrapper for template text.
 *
 * Why not a controlled input?
 *   contentEditable lets text sit inside arbitrary styled elements (h1, li, p)
 *   without breaking the template's layout. A hidden <input> overlay would
 *   shift spacing and lose the inline-flow context.
 *
 * Sync strategy:
 *   We keep a `focused` flag and only sync `value → DOM` when the element
 *   is NOT focused. While focused the user owns the content; on blur we
 *   fire onChange with the final innerText and cede control back.
 *
 * readOnly:
 *   When true (used in the print route), no contentEditable attr is set
 *   and no hooks affect rendering — the element is pure static HTML.
 */

import { useRef, useState, useEffect, type CSSProperties } from "react";

export interface IEProps {
  value:       string;
  onChange:    (v: string) => void;
  /** Render as block (div) instead of inline (span). */
  block?:      boolean;
  style?:      CSSProperties;
  placeholder?: string;
  readOnly?:   boolean;
}

export function IE({ value, onChange, block, style, placeholder, readOnly }: IEProps) {
  const ref     = useRef<HTMLElement>(null);
  const focused = useRef(false);

  // Sync external value changes into the DOM while not focused
  useEffect(() => {
    if (readOnly || !ref.current || focused.current) return;
    if (ref.current.innerText !== (value ?? "")) {
      ref.current.innerText = value ?? "";
    }
  }, [value, readOnly]);

  const Tag = block ? "div" : "span";

  if (readOnly) {
    // Static render — used in print route, no hooks side-effects beyond above
    return (
      <Tag style={style}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement & HTMLDivElement>}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onFocus={() => { focused.current = true; }}
      onBlur={(e) => {
        focused.current = false;
        onChange(e.currentTarget.innerText);
      }}
      style={{
        outline:   "none",
        cursor:    "text",
        minHeight: block ? "1em" : undefined,
        ...style,
      }}
    />
  );
}
