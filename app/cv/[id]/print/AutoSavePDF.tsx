"use client";

import { useEffect } from "react";

interface AutoSavePDFProps {
  filename?: string;
}

/**
 * Mounts invisibly and triggers an automatic client-side PDF download 
 * of the #cv-container element once fonts and assets are loaded.
 */
export function AutoSavePDF({ filename = "CV.pdf" }: AutoSavePDFProps) {
  useEffect(() => {
    const triggerDownload = async () => {
      // Ensure custom Arabic/Google fonts are rendered before capturing
      await document.fonts.ready;

      const element = document.getElementById("cv-container");
      if (!element) return;

      // Dynamically import html2pdf to prevent SSR build issues
      const html2pdf = (await import("html2pdf.js")).default;

      const options = {
        margin: 0,
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(options).from(element).save();
    };

    const timer = setTimeout(triggerDownload, 500);
    return () => clearTimeout(timer);
  }, [filename]);

  return null;
}