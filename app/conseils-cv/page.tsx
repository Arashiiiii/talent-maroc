import Link from "next/link";
import SeoShell, { C, CVCta } from "@/components/seo/SeoShell";
import { CV_GUIDES } from "@/lib/cv-guides";
import { SITE_URL, jsonLd, breadcrumb } from "@/lib/seo";

const TITLE = "Conseils CV Maroc : guides et exemples de CV";
const DESC  = "Guides pratiques pour réussir votre CV au Maroc : modèle de CV, stage PFE, CV sans expérience, centre d'appel, CV en anglais, ATS. Créez le vôtre gratuitement.";

export const metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/conseils-cv` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/conseils-cv`, type: "website", locale: "fr_MA" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function GuidesIndex() {
  const schema = [
    breadcrumb([{ name: "Accueil", url: SITE_URL }, { name: "Conseils CV", url: `${SITE_URL}/conseils-cv` }]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: CV_GUIDES.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/conseils-cv/${g.slug}`, name: g.h1 })),
    },
  ];
  return (
    <SeoShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 16px 0" }}>
        <h1 style={{ fontSize: "clamp(28px,4.4vw,42px)", fontWeight: 800, color: C.ink, letterSpacing: "-.03em", margin: "0 0 12px" }}>
          Conseils CV pour trouver un emploi au Maroc
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.7, maxWidth: 680, margin: "0 0 28px" }}>
          Des guides courts et concrets, écrits pour le marché de l&apos;emploi marocain : ce que les recruteurs regardent, les erreurs qui éliminent, et des exemples à reprendre.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {CV_GUIDES.map(g => (
            <Link key={g.slug} href={`/conseils-cv/${g.slug}`} className="seo-card" style={{ padding: "20px 20px" }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: C.ink, margin: "0 0 6px", lineHeight: 1.3 }}>{g.h1}</h2>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.55, margin: 0 }}>{g.description}</p>
            </Link>
          ))}
        </div>
        <CVCta
          title="Passez de la lecture à l'action"
          text="Dix modèles compatibles ATS, réécriture par IA en français, anglais et arabe, export PDF. Commencez sans créer de compte."
        />
      </div>
    </SeoShell>
  );
}
