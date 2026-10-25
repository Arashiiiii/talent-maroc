import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SeoShell, { C, CVCta } from "@/components/seo/SeoShell";
import { CITY_PAGES, cityOrFilter, SITE_URL, jsonLd, breadcrumb } from "@/lib/seo";

export const revalidate = 3600;

const TITLE = "Emploi par ville au Maroc : Casablanca, Rabat, Tanger…";
const DESC  = "Toutes les offres d'emploi au Maroc classées par ville : Casablanca, Rabat, Tanger, Marrakech, Agadir, Fès, Kénitra et plus. Mises à jour chaque jour.";

export const metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/emploi` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/emploi`, type: "website", locale: "fr_MA" },
};

export default async function CitiesIndex() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const since = new Date(Date.now() - 60 * 864e5).toISOString();
  const counts = await Promise.all(CITY_PAGES.map(async c => {
    const { count } = await db.from("jobs").select("id", { count: "exact", head: true }).or(cityOrFilter(c)).gte("created_at", since);
    return count ?? 0;
  }));

  return (
    <SeoShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb([{ name: "Accueil", url: SITE_URL }, { name: "Emploi par ville", url: `${SITE_URL}/emploi` }])) }} />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 16px 0" }}>
        <h1 style={{ fontSize: "clamp(28px,4.4vw,42px)", fontWeight: 800, color: C.ink, letterSpacing: "-.03em", margin: "0 0 12px" }}>Emploi par ville au Maroc</h1>
        <p style={{ fontSize: 17, lineHeight: 1.7, maxWidth: 680, margin: "0 0 26px" }}>
          Choisissez une ville pour voir les offres actives des 60 derniers jours, les secteurs qui recrutent et des conseils pour postuler.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
          {CITY_PAGES.map((c, i) => (
            <Link key={c.slug} href={`/emploi/${c.slug}`} className="seo-card" style={{ padding: "18px 18px" }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: C.ink, margin: "0 0 4px" }}>Emploi {c.name}</h2>
              <div style={{ fontSize: 13, color: C.violet, fontWeight: 700 }}>{counts[i]} offre{counts[i] > 1 ? "s" : ""} active{counts[i] > 1 ? "s" : ""}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{c.sectors.slice(0, 3).join(" · ")}</div>
            </Link>
          ))}
        </div>
        <CVCta title="Un CV prêt pour toutes ces offres" text="Créez un CV professionnel compatible ATS en quelques minutes, sans compte requis." />
      </div>
    </SeoShell>
  );
}
