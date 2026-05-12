import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cv/$id/print")({
  component: PrintCV,
  validateSearch: (s: Record<string, unknown>) => ({
    autoprint: s.autoprint === "1" || s.autoprint === 1,
  }),
});

interface CVData {
  profile: {
    firstName: string;
    lastName: string;
    title: string;
    email: string;
    phone: string;
    city: string;
  };
  summary: string;
  experience: Array<{
    id: string;
    role: string;
    company: string;
    city?: string;
    start: string;
    end?: string;
    bullets: string[];
  }>;
  education: Array<{ id: string; degree: string; school: string; start: string; end: string }>;
  skills: Array<{ id: string; group: string; items: string[] }>;
  languages: Array<{ id: string; name: string; level: string; dots: number }>;
  interests: string[];
}

function PrintCV() {
  const { id } = Route.useParams();
  const { autoprint } = Route.useSearch();
  const [cv, setCv] = useState<{ data: CVData; accent: string } | null>(null);

  useEffect(() => {
    supabase
      .from("cvs")
      .select("data, accent")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) setCv(data as any);
      });
  }, [id]);

  useEffect(() => {
    if (cv && autoprint) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [cv, autoprint]);

  if (!cv) return <div className="p-12 text-center text-slate-500">Chargement…</div>;

  const d = cv.data;
  const accent = cv.accent || "#7c3aed";

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print { body { margin: 0; } .no-print { display: none !important; } }
        body { background: #e2e8f0; }
      `}</style>
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="bg-violet-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg"
        >
          Imprimer / Enregistrer en PDF
        </button>
      </div>
      <div
        className="mx-auto bg-white shadow-xl print:shadow-none"
        style={{ width: "210mm", minHeight: "297mm", padding: "16mm" }}
      >
        <header
          style={{ borderBottom: `4px solid ${accent}` }}
          className="pb-4 mb-6"
        >
          <h1 className="text-3xl font-bold text-slate-900">
            {d.profile.firstName} {d.profile.lastName}
          </h1>
          <p className="text-lg mt-1" style={{ color: accent }}>
            {d.profile.title}
          </p>
          <div className="text-sm text-slate-600 mt-2 flex flex-wrap gap-x-4">
            {d.profile.phone && <span>📞 {d.profile.phone}</span>}
            {d.profile.email && <span>✉ {d.profile.email}</span>}
            {d.profile.city && <span>📍 {d.profile.city}</span>}
          </div>
        </header>

        {d.summary && (
          <Section title="Profil" accent={accent}>
            <p className="text-sm text-slate-700 leading-relaxed">{d.summary}</p>
          </Section>
        )}

        {d.experience?.length > 0 && (
          <Section title="Expérience professionnelle" accent={accent}>
            {d.experience.map((e) => (
              <div key={e.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-slate-900">{e.role}</h3>
                  <span className="text-xs text-slate-500">
                    {e.start} – {e.end || "Présent"}
                  </span>
                </div>
                <p className="text-sm text-slate-600 italic">
                  {e.company}
                  {e.city ? ` · ${e.city}` : ""}
                </p>
                <ul className="list-disc ml-5 mt-1 text-sm text-slate-700 space-y-0.5">
                  {e.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        )}

        {d.education?.length > 0 && (
          <Section title="Formation" accent={accent}>
            {d.education.map((ed) => (
              <div key={ed.id} className="mb-2">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm">{ed.degree}</h3>
                  <span className="text-xs text-slate-500">
                    {ed.start} – {ed.end}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{ed.school}</p>
              </div>
            ))}
          </Section>
        )}

        {d.skills?.length > 0 && (
          <Section title="Compétences" accent={accent}>
            {d.skills.map((s) => (
              <div key={s.id} className="mb-2">
                <p className="text-sm font-semibold text-slate-800">{s.group}</p>
                <p className="text-sm text-slate-700">{s.items.join(" · ")}</p>
              </div>
            ))}
          </Section>
        )}

        {d.languages?.length > 0 && (
          <Section title="Langues" accent={accent}>
            <div className="flex flex-wrap gap-4">
              {d.languages.map((l) => (
                <div key={l.id} className="text-sm">
                  <span className="font-semibold text-slate-800">{l.name}</span>{" "}
                  <span className="text-slate-600">— {l.level}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {d.interests?.length > 0 && (
          <Section title="Centres d'intérêt" accent={accent}>
            <p className="text-sm text-slate-700">{d.interests.join(" · ")}</p>
          </Section>
        )}
      </div>
    </>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <h2
        className="text-sm font-bold uppercase tracking-wider mb-2"
        style={{ color: accent }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
