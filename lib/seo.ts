// Shared SEO helpers: site constants, city landing-page config, JSON-LD builders.

export const SITE_URL  = "https://talentmaroc.shop";
export const SITE_NAME = "Talent Maroc";

/** Serialise JSON-LD safely for a <script> tag (prevents `</script>` breakouts). */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// ── Cities ────────────────────────────────────────────────────────────────
// `patterns` are ILIKE fragments matched against jobs.city, which is stored
// inconsistently by the scraper ("Casablanca", "Casablanca, Maroc", …).
export interface CityPage {
  slug:     string;
  name:     string;
  patterns: string[];
  intro:    string;
  sectors:  string[];
}

export const CITY_PAGES: CityPage[] = [
  {
    slug: "casablanca", name: "Casablanca", patterns: ["casablanca"],
    intro: "Capitale économique du Royaume, Casablanca concentre la majorité des sièges sociaux, des banques, des assurances et des centres de relation client. C'est aussi le premier bassin d'emploi pour les profils tech, finance et commerciaux.",
    sectors: ["Banque & assurance", "Centres d'appel", "Informatique", "Commercial", "Industrie"],
  },
  {
    slug: "rabat", name: "Rabat", patterns: ["rabat"],
    intro: "Capitale administrative, Rabat recrute dans le secteur public, les institutions internationales, le conseil et l'IT, notamment autour de Technopolis et des zones offshore de Rabat-Salé.",
    sectors: ["Administration & ONG", "Informatique", "Conseil", "Offshoring", "Enseignement"],
  },
  {
    slug: "tanger", name: "Tanger", patterns: ["tanger", "tangier"],
    intro: "Porté par le port Tanger Med et ses zones franches, Tanger est le pôle industriel du Nord : automobile, logistique, câblage et export. Les profils techniques et bilingues y sont très demandés.",
    sectors: ["Automobile", "Logistique", "Industrie", "Qualité", "Export"],
  },
  {
    slug: "marrakech", name: "Marrakech", patterns: ["marrakech"],
    intro: "Première destination touristique du pays, Marrakech recrute surtout dans l'hôtellerie, la restauration, l'événementiel et le commerce, avec un écosystème de centres d'appel et de startups en croissance.",
    sectors: ["Hôtellerie", "Tourisme", "Commercial", "Centres d'appel", "Immobilier"],
  },
  {
    slug: "agadir", name: "Agadir", patterns: ["agadir"],
    intro: "Agadir combine tourisme balnéaire, agro-industrie de la région Souss-Massa et pêche. On y trouve des postes en hôtellerie, en agronomie, en logistique et en commerce.",
    sectors: ["Agro-industrie", "Hôtellerie", "Logistique", "Pêche", "Commercial"],
  },
  {
    slug: "fes", name: "Fès", patterns: ["fès", "fes"],
    intro: "Ville universitaire et industrielle, Fès recrute dans l'offshoring, le textile, l'enseignement et la santé. Les jeunes diplômés y trouvent de nombreux stages et premiers emplois.",
    sectors: ["Offshoring", "Textile", "Enseignement", "Santé", "Commercial"],
  },
  {
    slug: "mohammedia", name: "Mohammédia", patterns: ["mohammédia", "mohammedia"],
    intro: "Entre Casablanca et Rabat, Mohammédia est un pôle industriel et portuaire. Les offres y concernent l'industrie, la chimie, la logistique et les fonctions support.",
    sectors: ["Industrie", "Logistique", "Chimie", "Maintenance", "Administration"],
  },
  {
    slug: "kenitra", name: "Kénitra", patterns: ["kénitra", "kenitra"],
    intro: "Avec l'Atlantic Free Zone et son usine automobile, Kénitra est devenue un bassin industriel majeur. Ingénieurs, techniciens et opérateurs y sont recherchés en continu.",
    sectors: ["Automobile", "Industrie", "Maintenance", "Qualité", "Logistique"],
  },
  {
    slug: "temara", name: "Témara", patterns: ["témara", "temara"],
    intro: "Ville voisine de Rabat, Témara offre des postes dans le commerce, les services et les entreprises de la région Rabat-Salé-Kénitra.",
    sectors: ["Commercial", "Services", "Administration", "Logistique"],
  },
  {
    slug: "meknes", name: "Meknès", patterns: ["meknès", "meknes"],
    intro: "Meknès, avec Agropolis, est un centre de l'agro-alimentaire marocain. Les offres touchent l'agronomie, l'industrie, l'enseignement et la santé.",
    sectors: ["Agro-alimentaire", "Agronomie", "Enseignement", "Santé"],
  },
];

export function getCity(slug: string) {
  return CITY_PAGES.find(c => c.slug === slug);
}

/** PostgREST `or` filter string for a city's patterns. */
export function cityOrFilter(city: CityPage) {
  return city.patterns.map(p => `city.ilike.%${p}%`).join(",");
}

/** Find the city landing page a free-text city belongs to (for internal links). */
export function citySlugFor(raw?: string | null): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  return CITY_PAGES.find(c => c.patterns.some(p => s.includes(p)))?.slug ?? null;
}

// ── JobPosting ────────────────────────────────────────────────────────────
export const JOB_VALID_DAYS = 45;

const EMPLOYMENT: Record<string, string> = {
  "cdi": "FULL_TIME", "temps plein": "FULL_TIME",
  "cdd": "TEMPORARY", "intérim": "TEMPORARY", "interim": "TEMPORARY",
  "stage": "INTERN", "pfe": "INTERN",
  "temps partiel": "PART_TIME", "freelance": "CONTRACTOR",
};

export function cleanCity(raw?: string | null): string | null {
  if (!raw) return null;
  const c = raw.replace(/\(.*?\)/g, "").split(",")[0].trim();
  if (!c || /^maroc$/i.test(c)) return null;
  return c;
}

export function jobPostedDate(job: { created_at: string }) {
  return new Date(job.created_at);
}

export function isJobExpired(job: { created_at: string }, days = 60) {
  return Date.now() - jobPostedDate(job).getTime() > days * 864e5;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- jobs rows are untyped across the codebase
export function buildJobPosting(job: any, descriptionHtml: string) {
  const posted = jobPostedDate(job);
  const validThrough = new Date(posted.getTime() + JOB_VALID_DAYS * 864e5);
  const locality = cleanCity(job.city);
  const employmentType = job.contract_type
    ? EMPLOYMENT[String(job.contract_type).toLowerCase()]
    : undefined;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: descriptionHtml,
    identifier: { "@type": "PropertyValue", name: SITE_NAME, value: job.id },
    datePosted: posted.toISOString(),
    validThrough: validThrough.toISOString(),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company || "Confidentiel",
      ...(job.logo_url && /^https:\/\//.test(job.logo_url) && !/serpapi|gstatic/.test(job.logo_url)
        ? { logo: job.logo_url } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(locality ? { addressLocality: locality } : {}),
        addressCountry: "MA",
      },
    },
    directApply: job.source === "employer",
    url: `${SITE_URL}/jobs/${job.id}`,
  };
  if (employmentType) data.employmentType = employmentType;
  return data;
}

export function breadcrumb(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem", position: i + 1, name: it.name, item: it.url,
    })),
  };
}

export function faqPage(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(f => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
