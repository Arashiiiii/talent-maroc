"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { CVDataSchema, DEFAULT_SECTION_ORDER, DEFAULT_SECTIONS_ENABLED } from "../../_lib/schema";
import type { TemplateId, Lang, SectionId, CVData } from "../../_lib/schema";
import { CVRender } from "../_components/templates";
import { AutoPrint } from "./AutoPrint";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string }>;
}

export default function PrintPage({ params, searchParams }: Props) {
  const { id } = use(params);
  const { autoprint } = use(searchParams);

  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState<{
    cv: CVData;
    template: TemplateId;
    accent: string;
    lang: Lang;
    order: SectionId[];
    enabled: Record<SectionId, boolean>;
  } | null>(null);

  useEffect(() => {
    async function fetchCV() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        setLoading(false);
        return;
      }

      const supabase = createClient(supabaseUrl, anonKey);
      const { data, error } = await supabase
        .from("cvs")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      const parsed = CVDataSchema.safeParse(data.data);
      if (!parsed.success) {
        setLoading(false);
        return;
      }

      setCvData({
        cv: parsed.data,
        template: (data.template as TemplateId) ?? "corso",
        accent: data.accent ?? "#7c3aed",
        lang: (data.lang as Lang) ?? "fr",
        order: (data.section_order as SectionId[]) ?? DEFAULT_SECTION_ORDER,
        enabled: (data.sections_enabled as Record<SectionId, boolean>) ?? { ...DEFAULT_SECTIONS_ENABLED },
      });
      setLoading(false);
    }

    fetchCV();
  }, [id]);

  if (loading) return null;
  if (!cvData) notFound();

  const fontImport = cvData.lang === "ar"
    ? "@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');\n"
    : "";

  return (
    <>
      {autoprint === "1" && <AutoPrint />}

      <style>{`${fontImport}@page  { size: 210mm 297mm; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media screen { body { padding: 0; } }
        @media print  { .no-print { display: none !important; } }
      `}</style>

      <CVRender
        template={cvData.template}
        cv={cvData.cv}
        accent={cvData.accent}
        lang={cvData.lang}
        order={cvData.order}
        enabled={cvData.enabled}
        onUpdate={() => {}}
        readOnly
      />
    </>
  );
}