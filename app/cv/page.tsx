import Link from "next/link";
import CVListPageClient from "./CVListPageClient";
import { CV_GUIDES } from "@/lib/cv-guides";
import { SITE_URL, SITE_NAME, jsonLd, faqPage } from "@/lib/seo";

// Server Component wrapper so this route can carry its own metadata and
// server-rendered SEO content. The interactive page (auth check, CV list,
// landing, new-CV modal) lives in CVListPageClient.

const TITLE = "Créer un CV en ligne gratuitement — modèles CV Maroc";
const DESC  = "Créez un CV professionnel compatible ATS en quelques minutes, sans compte. 10 modèles, réécriture par IA en français, anglais et arabe, export PDF.";

export const metadata = {
  title: TITLE,
  description: DESC,
  keywords: [
    "créer CV en ligne", "CV maroc", "modèle CV gratuit", "CV professionnel maroc",
    "CV compatible ATS", "générateur de CV", "CV PDF gratuit", "faire un CV",
  ],
  alternates: { canonical: `${SITE_URL}/cv` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/cv`, type: "website", locale: "fr_MA" },
  twitter:   { card: "summary_large_image", title: TITLE, description: DESC },
};

const FAQ = [
  { q: "Le générateur de CV est-il gratuit ?", a: "Vous pouvez créer et modifier votre CV gratuitement, sans créer de compte. Le téléchargement en PDF d'un modèle se fait par un achat unique, sans abonnement." },
  { q: "Mon CV sera-t-il lu par les logiciels de recrutement (ATS) ?", a: "Oui. Les modèles génèrent un PDF en texte, avec des rubriques standard, lisible par les ATS utilisés par les multinationales et grands groupes au Maroc." },
  { q: "Puis-je importer mon ancien CV ?", a: "Oui. Importez un CV existant en PDF ou Word : les rubriques sont remplies automatiquement, vous n'avez plus qu'à corriger et choisir un modèle." },
  { q: "Dans quelles langues puis-je créer mon CV ?", a: "En français, en anglais et en arabe. L'IA peut reformuler votre profil et vos expériences dans la langue choisie." },
  { q: "Puis-je adapter mon CV à une offre précise ?", a: "Oui. Depuis chaque offre d'emploi Talent Maroc, le bouton « Créer mon CV pour ce poste » vous amène au générateur avec l'offre visée en rappel, pour reprendre ses mots-clés." },
];

const SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Générateur de CV Talent Maroc",
    url: `${SITE_URL}/cv`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: ["fr", "en", "ar"],
    description: DESC,
    offers: { "@type": "Offer", price: "0", priceCurrency: "MAD", description: "Création et édition gratuites" },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  },
  faqPage(FAQ),
];

function CVSeoContent() {
  return (
    <section style={{ background: "#fff", padding: "64px 24px", borderTop: "1px solid #eceef2" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(SCHEMA) }} />
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(24px,3vw,32px)", fontWeight: 800, letterSpacing: "-.025em", color: "#0f172a", margin: "0 0 20px" }}>
          Questions fréquentes sur le générateur de CV
        </h2>
        {FAQ.map(f => (
          <details key={f.q} style={{ border: "1.5px solid #eceef2", borderRadius: 12, padding: "14px 18px", marginBottom: 10, background: "#fafbfc" }}>
            <summary style={{ fontWeight: 700, color: "#0f172a", cursor: "pointer", fontSize: 15.5 }}>{f.q}</summary>
            <p style={{ margin: "10px 0 0", color: "#374151", lineHeight: 1.7, fontSize: 15 }}>{f.a}</p>
          </details>
        ))}

        <h2 style={{ fontSize: "clamp(20px,2.6vw,26px)", fontWeight: 800, letterSpacing: "-.02em", color: "#0f172a", margin: "44px 0 16px" }}>
          Conseils pour réussir votre CV
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
          {CV_GUIDES.map(g => (
            <Link key={g.slug} href={`/conseils-cv/${g.slug}`} style={{ display: "block", border: "1.5px solid #eceef2", borderRadius: 12, padding: "14px 16px", textDecoration: "none" }}>
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, marginBottom: 4 }}>{g.h1.split(":")[0]}</div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{g.description.slice(0, 85)}…</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CVPage() {
  return <CVListPageClient seo={<CVSeoContent />} />;
}
