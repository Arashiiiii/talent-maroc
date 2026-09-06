/**
 * Shared decorative sample CV — used anywhere a real (not schematic) template
 * preview is needed: the landing page hero/gallery, and the "Choisissez un
 * modèle" template picker in the new-CV modal. Fictional data, shaped exactly
 * like CVData so the real CVRender/InlineEditable stack renders it as-is.
 */

import type { CVData, SectionId } from "./schema";

export const SAMPLE_CV: CVData = {
  profile: {
    firstName: "Yasmine", lastName: "El Amrani", title: "Product Designer Senior",
    email: "yasmine.elamrani@gmail.com", phone: "+212 6 61 24 18 90", city: "Casablanca, Maroc",
    website: "yasmineelamrani.com", linkedin: "linkedin.com/in/yelamrani",
  },
  summary: "Product Designer avec 7 ans d'expérience à concevoir des produits SaaS B2B utilisés par des équipes en EMEA. J'aime traduire des besoins complexes en interfaces simples, animer des design systems, et livrer vite avec l'ingénierie et le produit.",
  experience: [
    { id: "e1", role: "Lead Product Designer", company: "BMCE Capital", city: "Casablanca", start: "Mars 2023", end: "Présent", current: true,
      bullets: [
        "Pilote la refonte du portail de banque privée — engagement +38%, NPS de 24 à 51 en 9 mois.",
        "Anime un design system de 120+ composants avec 3 équipes ingénierie.",
        "Recrute et accompagne 2 designers juniors ; rituel de critique hebdomadaire.",
      ] },
    { id: "e2", role: "Product Designer", company: "Atlas Tech", city: "Casablanca", start: "Sept 2020", end: "Févr 2023", current: false,
      bullets: [
        "Conception de bout en bout de la suite e-commerce pour 1 200 marchands au Maghreb.",
        "Lancement du checkout multi-devise (MAD, EUR, USD) — conversion +14%.",
      ] },
  ],
  education: [
    { id: "ed1", degree: "Master en Design Interactif", school: "ENSA Casablanca", city: "Casablanca", start: "2016", end: "2018", detail: "Mention Très Bien" },
  ],
  skills: [
    { id: "s1", group: "Design", items: ["Figma", "Design Systems", "Prototypage", "Recherche utilisateur"] },
    { id: "s2", group: "Outils", items: ["Notion", "Linear", "Webflow", "Framer"] },
  ],
  languages: [
    { id: "l1", name: "Arabe", level: "Langue maternelle", dots: 5 },
    { id: "l2", name: "Français", level: "Bilingue", dots: 5 },
    { id: "l3", name: "Anglais", level: "Courant — C1", dots: 4 },
  ],
  certifications: [
    { id: "c1", name: "Nielsen Norman UX Master", issuer: "NN/g", year: "2024" },
  ],
  projects: [
    { id: "p1", name: "Atlas Pay", role: "Lead Designer", detail: "App de paiement P2P pour le marché marocain — 80K utilisateurs actifs." },
  ],
  interests: ["Photographie argentique", "Course longue distance", "Typographie arabe"],
};

export const SHOWCASE_ORDER: SectionId[] = ["summary", "experience", "education", "skills", "languages", "certifications", "projects", "interests"];
export const SHOWCASE_ENABLED = Object.fromEntries(SHOWCASE_ORDER.map((k) => [k, true])) as Record<SectionId, boolean>;
