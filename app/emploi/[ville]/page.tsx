import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import SeoShell, { C, CVCta } from "@/components/seo/SeoShell";
import { CITY_PAGES, getCity, cityOrFilter, SITE_URL, jsonLd, breadcrumb, faqPage } from "@/lib/seo";

export const revalidate = 3600;      // refresh job lists hourly
export const dynamicParams = false;

export function generateStaticParams() {
  return CITY_PAGES.map(c => ({ ville: c.slug }));
}

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

async function loadJobs(slug: string) {
  const city = getCity(slug)!;
  const since = new Date(Date.now() - 60 * 864e5).toISOString();
  const { data, count } = await db()
    .from("jobs")
    .select("id, title, company, city, created_at, posted_at, contract_type", { count: "exact" })
    .or(cityOrFilter(city))
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(40);
  return { jobs: data ?? [], count: count ?? 0 };
}

const monthYear = () => new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const city = getCity(ville);
  if (!city) return {};
  const { count } = await loadJobs(ville);
  const url = `${SITE_URL}/emploi/${city.slug}`;
  const title = `Emploi ${city.name} : ${count > 0 ? `${count} offres` : "offres"} récentes (${monthYear()})`;
  const description = `Offres d'emploi à ${city.name} mises à jour chaque jour : CDI, CDD, stages PFE dans ${city.sectors.slice(0, 3).join(", ").toLowerCase()}. Postulez avec un CV optimisé en quelques minutes.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    // Thin pages (almost no live jobs) stay out of the index until they fill up.
    robots: count < 3 ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url, type: "website", locale: "fr_MA" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CityJobsPage({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const city = getCity(ville);
  if (!city) notFound();
  const { jobs, count } = await loadJobs(ville);
  const url = `${SITE_URL}/emploi/${city.slug}`;

  const faq = [
    { q: `Comment trouver un emploi à ${city.name} ?`, a: `Consultez les offres récentes à ${city.name} sur cette page, mise à jour chaque jour, et postulez avec un CV adapté à chaque annonce. Les secteurs qui recrutent le plus : ${city.sectors.join(", ").toLowerCase()}.` },
    { q: `Quel CV envoyer pour un emploi à ${city.name} ?`, a: "Un CV d'une page (deux au maximum avec de l'expérience), en PDF, en français, avec un titre qui reprend le poste visé et des résultats chiffrés. Le générateur Talent Maroc propose des modèles compatibles avec les logiciels de tri des recruteurs." },
  ];

  const schema = [
    breadcrumb([
      { name: "Accueil", url: SITE_URL },
      { name: "Emploi par ville", url: `${SITE_URL}/emploi` },
      { name: `Emploi ${city.name}`, url },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Offres d'emploi à ${city.name}`,
      itemListElement: jobs.slice(0, 20).map((j, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/jobs/${j.id}` })),
    },
    faqPage(faq),
  ];

  const others = CITY_PAGES.filter(c => c.slug !== city.slug);

  return (
    <SeoShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 16px 0" }}>
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
          <Link href="/" style={{ color: C.muted }}>Accueil</Link> › <Link href="/emploi" style={{ color: C.muted }}>Emploi par ville</Link> › {city.name}
        </nav>

        <h1 style={{ fontSize: "clamp(28px,4.4vw,42px)", fontWeight: 800, color: C.ink, letterSpacing: "-.03em", margin: "0 0 10px" }}>
          Offres d&apos;emploi à {city.name}
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.7, maxWidth: 760, margin: "0 0 14px" }}>{city.intro}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          <span style={{ background: C.soft, color: C.violet, fontWeight: 700, fontSize: 13, padding: "6px 12px", borderRadius: 100 }}>
            {count} offre{count > 1 ? "s" : ""} active{count > 1 ? "s" : ""}
          </span>
          {city.sectors.map(s => (
            <span key={s} style={{ background: "#fff", border: `1px solid ${C.line}`, fontSize: 13, padding: "6px 12px", borderRadius: 100 }}>{s}</span>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 10 }}>
          {jobs.length === 0 && (
            <p>Aucune offre active à {city.name} pour le moment. <Link href="/" style={{ color: C.violet, fontWeight: 700 }}>Voir toutes les offres au Maroc →</Link></p>
          )}
          {jobs.map((j, i) => (
            <div key={j.id}>
              <Link href={`/jobs/${j.id}`} className="seo-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: "0 0 4px", lineHeight: 1.35 }}>{j.title}</h2>
                  <div style={{ fontSize: 13, color: C.muted }}>
                    {j.company}{j.city ? ` · ${j.city.replace(/, Maroc$/, "")}` : ""}{j.contract_type ? ` · ${j.contract_type}` : ""}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>
                  {j.posted_at || new Date(j.created_at).toLocaleDateString("fr-FR")}
                </span>
              </Link>
              {i === 7 && (
                <CVCta
                  title={`Postulez à ${city.name} avec un CV qui sort du lot`}
                  text="Les recruteurs lisent un CV en moins d'une minute. Créez une version claire et ciblée en quelques minutes, puis postulez."
                />
              )}
            </div>
          ))}
        </div>

        {jobs.length > 0 && jobs.length <= 7 && (
          <CVCta title={`Postulez à ${city.name} avec un CV qui sort du lot`} text="Créez une version claire et ciblée en quelques minutes, puis postulez." />
        )}

        <p style={{ marginTop: 18 }}>
          <Link href={`/?l=${encodeURIComponent(city.name)}`} style={{ color: C.violet, fontWeight: 700 }}>Rechercher et filtrer les offres à {city.name} →</Link>
        </p>

        <section className="seo-prose" style={{ marginTop: 20 }}>
          <h2>Questions fréquentes</h2>
          {faq.map(f => (
            <details key={f.q} style={{ background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
              <summary style={{ fontWeight: 700, color: C.ink, cursor: "pointer" }}>{f.q}</summary>
              <p style={{ margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
          <p>
            Pour préparer votre candidature : <Link href="/conseils-cv/modele-cv-maroc" style={{ color: C.violet }}>modèle de CV au Maroc</Link>,{" "}
            <Link href="/conseils-cv/cv-stage-pfe" style={{ color: C.violet }}>CV pour stage PFE</Link>,{" "}
            <Link href="/conseils-cv/cv-sans-experience" style={{ color: C.violet }}>CV sans expérience</Link>.
          </p>
        </section>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: "32px 0 12px" }}>Emploi dans d&apos;autres villes</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {others.map(o => (
            <Link key={o.slug} href={`/emploi/${o.slug}`} className="seo-card" style={{ padding: "8px 14px", fontSize: 14, fontWeight: 600 }}>Emploi {o.name}</Link>
          ))}
        </div>
      </div>
    </SeoShell>
  );
}
