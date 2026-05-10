"use client";
import { useEffect } from "react";

/**
 * Mounts invisibly and calls window.print() once all fonts are ready.
 * Used when the print page is opened with ?autoprint=1.
 */
export function AutoPrint() {
  useEffect(() => {
    document.fonts.ready.then(() => {
      setTimeout(() => window.print(), 300);
    });
  }, []);
  return null;
}
