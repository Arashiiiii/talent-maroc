import type { Metadata } from "next";

const TITLE = "CV Professionnel pour Ouvriers au Maroc — Prêt en 2 Minutes | Talent Maroc";
const DESC  =
  "Créez un CV professionnel pour chauffeur, mécanicien, agent de sécurité, maçon, opérateur et tout métier au Maroc. Remplissez 5 champs, téléchargez votre PDF. 29 DH seulement.";

export const metadata: Metadata = {
  title:       TITLE,
  description: DESC,
  keywords: [
    "CV ouvrier maroc", "CV professionnel maroc", "créer CV maroc",
    "CV chauffeur maroc", "CV mécanicien maroc", "CV agent sécurité maroc",
    "CV maçon maroc", "CV électricien maroc", "CV plombier maroc",
    "modèle CV ouvrier", "CV gratuit maroc", "faire son CV maroc",
    "CV en ligne maroc", "CV PDF maroc", "CV prêt à imprimer maroc",
    "CV opérateur maroc", "CV logistique maroc", "CV transport maroc",
  ],
  alternates: {
    canonical: "https://talentmaroc.shop/cv-ouvrier",
  },
  openGraph: {
    title:       TITLE,
    description: DESC,
    url:         "https://talentmaroc.shop/cv-ouvrier",
    type:        "website",
    images: [
      {
        url:    "/og-cv-ouvrier.jpg",
        width:  1200,
        height: 630,
        alt:    "CV Professionnel pour Ouvriers — Talent Maroc",
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       TITLE,
    description: DESC,
    images:      ["/og-cv-ouvrier.jpg"],
  },
};

// JSON-LD for the CV service page
const SERVICE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "CV Professionnel Prêt à l'Emploi — Talent Maroc",
  "description": DESC,
  "provider": {
    "@type": "Organization",
    "name": "Talent Maroc",
    "url": "https://talentmaroc.shop",
  },
  "areaServed": { "@type": "Country", "name": "Morocco" },
  "serviceType": "CV Writing",
  "offers": {
    "@type": "Offer",
    "price": "29",
    "priceCurrency": "MAD",
    "availability": "https://schema.org/InStock",
    "description": "CV professionnel personnalisé, téléchargement PDF immédiat",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Combien coûte un CV professionnel sur Talent Maroc ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Un CV professionnel prêt à l'emploi coûte 29 DH, paiement unique sans abonnement." },
    },
    {
      "@type": "Question",
      "name": "Comment créer un CV en arabe au Maroc ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Sélectionnez votre métier, choisissez la langue arabe, remplissez vos informations et téléchargez votre CV en PDF." },
    },
    {
      "@type": "Question",
      "name": "Puis-je modifier mon CV après l'avoir téléchargé ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui, votre CV est accessible dans l'éditeur Talent Maroc à tout moment pour modification." },
    },
    {
      "@type": "Question",
      "name": "Quels métiers sont disponibles pour un CV prêt à l'emploi ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Chauffeur, mécanicien, agent de sécurité, maçon, électricien, plombier, opérateur, cariste, serveur, cuisinier, agent de call center et plus de 30 métiers." },
    },
  ],
};

const HOWTO_JSONLD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Comment créer un CV professionnel en 2 minutes au Maroc",
  "description": "Créez un CV professionnel pour votre métier en 3 étapes simples",
  "totalTime": "PT2M",
  "estimatedCost": { "@type": "MonetaryAmount", "currency": "MAD", "value": "29" },
  "step": [
    { "@type": "HowToStep", "name": "Choisissez votre métier", "text": "Parcourez notre catalogue de plus de 30 métiers et sélectionnez le vôtre." },
    { "@type": "HowToStep", "name": "Entrez vos informations", "text": "Remplissez uniquement 5 champs : prénom, nom, téléphone, ville et années d'expérience." },
    { "@type": "HowToStep", "name": "Payez et téléchargez", "text": "Payez 29 DH et téléchargez immédiatement votre CV en format PDF A4 professionnel." },
  ],
};

export default function CvOuvrierLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOWTO_JSONLD) }} />
      {children}
    </>
  );
}
