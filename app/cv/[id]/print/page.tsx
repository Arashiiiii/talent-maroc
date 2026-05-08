/**
 * Print-only route — /cv/[id]/print
 *
 * Server component. Fetches the CV, renders the template at 1:1 scale with no
 * chrome. Only accessible with a valid short-lived HMAC token issued by the
 * PDF API route — prevents public scraping of other users' CVs.
 */

import { createClient } from "@supabase/supabase-js";
import { notFound }     from "next/navigation";
import { CVDataSchema, DEFAULT_SECTION_ORDER, DEFAULT_SECTIONS_ENABLED } from "../../_lib/schema";
import { verifyToken }  from "../../_lib/pdf-token";
import type { TemplateId, Lang, SectionId } from "../../_lib/schema";
import { CVRender }     from "../_components/templates";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface Props {
  params:       { id: string };
  searchParams: { token?: string };
}

export default async function PrintPage({ params, searchParams }: Props) {
  // Reject requests without a valid token
  const token = searchParams.token ?? "";
  if (!token || !(await verifyToken(token, params.id))) {
    notFound();
  }

  const { data, error } = await supabase
    .from("cvs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  const parsed = CVDataSchema.safeParse(data.data);
  if (!parsed.success) notFound();

  const cv       = parsed.data;
  const template = (data.template as TemplateId)                         ?? "corso";
  const accent   = data.accent                                            ?? "#7c3aed";
  const lang     = (data.lang as Lang)                                    ?? "fr";
  const order    = (data.section_order   as SectionId[])                 ?? DEFAULT_SECTION_ORDER;
  const enabled  = (data.sections_enabled as Record<SectionId, boolean>) ?? { ...DEFAULT_SECTIONS_ENABLED };

  // Cairo must be @imported BEFORE other rules for CSS parsing correctness.
  // Playwright's networkidle wait ensures the font is loaded before PDF export.
  const fontImport = lang === "ar"
    ? "@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');\n"
    : "";

  return (
    <>
      <style>{`${fontImport}@page  { size: 210mm 297mm; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media screen { body { padding: 0; } }
      `}</style>

      <CVRender
        template={template}
        cv={cv}
        accent={accent}
        lang={lang}
        order={order}
        enabled={enabled}
        onUpdate={() => {}}
        readOnly
      />
    </>
  );
}
