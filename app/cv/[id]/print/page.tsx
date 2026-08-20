/**
 * Print & Save Route — /cv/[id]/print
 *
 * Server component using service-role key to query Supabase securely.
 *
 * Query Params:
 * ?autoprint=1  — Opens browser print/PDF dialog
 * ?autosave=1   — Automatically generates & downloads a .pdf file directly
 */

import { createClient } from "@supabase/supabase-js";
import { notFound }     from "next/navigation";
import { CVDataSchema, DEFAULT_SECTION_ORDER, DEFAULT_SECTIONS_ENABLED } from "../../_lib/schema";
import type { TemplateId, Lang, SectionId } from "../../_lib/schema";
import { CVRender }    from "../_components/templates";
import { AutoPrint }   from "./AutoPrint";
import { AutoSavePDF } from "./AutoSavePDF";

interface Props {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string; autosave?: string }>;
}

export default async function PrintPage({ params, searchParams }: Props) {
  const { id }        = await params;
  const { autoprint, autosave } = await searchParams;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from("cvs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const parsed = CVDataSchema.safeParse(data.data);
  if (!parsed.success) notFound();

  const cv       = parsed.data;
  const template = (data.template as TemplateId)                          ?? "corso";
  const accent   = data.accent                                             ?? "#7c3aed";
  const lang     = (data.lang   as Lang)                                   ?? "fr";
  const order    = (data.section_order    as SectionId[])                 ?? DEFAULT_SECTION_ORDER;
  const enabled  = (data.sections_enabled as Record<SectionId, boolean>)  ?? { ...DEFAULT_SECTIONS_ENABLED };

  const fontImport = lang === "ar"
    ? "@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');\n"
    : "";

  // Dynamic file name based on candidate name
  const pdfFilename = `${cv.personal?.fullName?.replace(/\s+/g, "_") || "CV"}.pdf`;

  return (
    <>
      {autoprint === "1" && <AutoPrint />}
      {autosave === "1"  && <AutoSavePDF filename={pdfFilename} />}

      <style>{`${fontImport}@page  { size: 210mm 297mm; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media screen { body { padding: 0; } }
        @media print  { .no-print { display: none !important; } }
      `}</style>

      <div id="cv-container">
        <CVRender
          template={template}
          cv={cv}
          accent={accent}
          lang={lang}
          order={order}
          enabled={enabled}
          readOnly
        />
      </div>
    </>
  );
}