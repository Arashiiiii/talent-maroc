import { Geist, Inter } from "next/font/google";
import "./globals.css";

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
    canonical: SITE_URL,
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
    images: [
      {
        url:    "/og-image.jpg",
        width:  1200,
        height: 630,
        alt:    "Talent Maroc — Emploi & CV Professionnel au Maroc",
      },
    ],
  },

  // ── Twitter / X ──────────────────────────────────────────────────────────
  twitter: {
    card:        "summary_large_image",
    title:       DEFAULT_TITLE,
    description: DEFAULT_DESC,
    images:      ["/og-image.jpg"],
    creator:     "@talentmaroc",
    site:        "@talentmaroc",
  },

  // ── Verification (add once you have the codes) ───────────────────────────
  // verification: {
  //   google: "YOUR_GOOGLE_SEARCH_CONSOLE_TOKEN",
  //   yandex: "YOUR_YANDEX_TOKEN",
  // },

  // ── Icons ────────────────────────────────────────────────────────────────
  icons: {
    icon:        "/favicon.ico",
    apple:       "/apple-touch-icon.png",
    shortcut:    "/favicon-16x16.png",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.className} ${inter.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
}
