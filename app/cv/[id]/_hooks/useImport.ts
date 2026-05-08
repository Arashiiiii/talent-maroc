"use client";
import { useRef, useState, useCallback } from "react";
import { useCVStore } from "../../_store/cv-store";

export function useImport() {
  const fileRef    = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const loadCV     = useCVStore((s) => s.loadCV);

  const trigger = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = ""; // allow re-selecting same file

      setImporting(true);
      try {
        const body = new FormData();
        body.append("file", file);

        const res = await fetch("/api/cv/import", { method: "POST", body });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error((json as { error?: string }).error ?? `Erreur ${res.status}`);
        }

        const { cv } = await res.json();
        loadCV(cv);
      } catch (err) {
        alert(`Importation échouée : ${(err as Error).message}`);
      } finally {
        setImporting(false);
      }
    },
    [loadCV],
  );

  return { fileRef, trigger, handleFile, importing };
}
