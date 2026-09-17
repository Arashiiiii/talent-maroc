import CVListPageClient from "./CVListPageClient";

// Server Component wrapper so this route can carry its own metadata — the
// actual page (auth check, CV list, landing page, new-CV modal) is entirely
// client-side logic, which can't export `metadata` itself in the App Router.
export const metadata = {
  title: "Créez votre CV en ligne gratuitement",
  description:
    "Construisez un CV professionnel compatible ATS en quelques minutes, sans compte requis. Dix modèles, réécriture par IA en français/anglais/arabe, export PDF. Un achat unique par modèle, aucun abonnement.",
  keywords: [
    "créer CV en ligne", "CV maroc", "modèle CV gratuit", "CV professionnel maroc",
    "CV compatible ATS", "générateur de CV", "CV PDF gratuit",
  ],
  alternates: { canonical: "https://talentmaroc.shop/cv" },
  openGraph: {
    title:       "Créez votre CV en ligne — Talent Maroc",
    description: "Dix modèles de CV professionnels compatibles ATS. Commencez sans créer de compte, payez une seule fois pour télécharger.",
    url:         "https://talentmaroc.shop/cv",
    type:        "website",
  },
};

export default function CVPage() {
  return <CVListPageClient />;
}
