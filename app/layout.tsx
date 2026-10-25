import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { jsonLd } from "@/lib/seo";

const geistSans = Geist({ display: "swap", subsets: ["latin"] });
const inter     = Inter({ display: "swap", subsets: ["latin"], variable: "--font-inter" });

const SITE_URL  = "https://talentmaroc.shop";
const SITE_NAME = "Talent Maroc";
const DEFAULT_TITLE = "Talent Maroc | Emploi et Recrutement au Maroc";
const DEFAULT_DESC  =
  "Le portail n°1 pour trouver un emploi au Maroc. Milliers d'offres actualisées à Casablanca, Tanger, Rabat, Marrakech et partout dans le Royaume.";

export const metadata = {
  metadataBase: new URL(SITE_URL),

  // ── Titles ──────────────────────────────────────────────────────────────
  title: {
    default:  DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },

  // ── Core ────────────────────────────────────────────────────────────────
  description: DEFAULT_DESC,
  keywords: [
    "emploi maroc", "offres emploi maroc", "recrutement maroc",
    "travail maroc", "site emploi maroc", "annonces emploi maroc",
    "chercher emploi casablanca", "emploi tanger", "emploi rabat",
    "emploi marrakech", "CDI maroc", "CDD maroc", "stage PFE maroc",
    "CV maroc", "créer CV maroc", "CV professionnel maroc",
    "talent maroc", "portail emploi maroc",
  ],
  authors:   [{ name: SITE_NAME, url: SITE_URL }],
  creator:   SITE_NAME,
  publisher: SITE_NAME,

  // ── Canonical & alternates ───────────────────────────────────────────────
  alternates: {
    // No site-wide canonical here: it would be inherited by every page that
    // forgets to set its own and point them all at the homepage.
    languages: { "fr-MA": SITE_URL },
  },

  // ── Open Graph ───────────────────────────────────────────────────────────
  openGraph: {
    type:        "website",
    locale:      "fr_MA",
    url:         SITE_URL,
    siteName:    SITE_NAME,
    title:       DEFAULT_TITLE,
    description: DEFAULT_DESC,
    // Image comes from app/opengraph-image.png (file convention) — the old
    // explicit "/og-image.jpg" did not exist and 404'd on every share.
  },

  // ── Twitter / X ──────────────────────────────────────────────────────────
  twitter: {
    card:        "summary_large_image",
    title:       DEFAULT_TITLE,
    description: DEFAULT_DESC,
    creator:     "@talentmaroc",
    site:        "@talentmaroc",
  },

  // ── Verification — set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION / NEXT_PUBLIC_BING_SITE_VERIFICATION in Vercel
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other:  process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },

  // ── Icons ────────────────────────────────────────────────────────────────
  // apple-touch-icon.png / favicon-16x16.png were referenced but never existed.
  icons: {
    icon:  "/favicon.ico",
    apple: "/logo.png",
  },

  // ── Crawl directives ────────────────────────────────────────────────────
  robots: {
    index:            true,
    follow:           true,
    googleBot: {
      index:          true,
      follow:         true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet":  -1,
    },
  },
};

const SITE_SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#org`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    email: "contact@talentmaroc.shop",
    areaServed: "MA",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "fr-MA",
    publisher: { "@id": `${SITE_URL}/#org` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.className} ${inter.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(SITE_SCHEMA) }} />
        {children}
      </body>
    </html>
  );
}
