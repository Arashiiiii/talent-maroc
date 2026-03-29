import { Geist, Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  metadataBase: new URL("https://talentmaroc.shop"),
  title: {
    default: "Talent Maroc | Emploi et Recrutement au Maroc",
    template: "%s | Talent Maroc",
  },
  description:
    "Le portail n°1 pour trouver un emploi au Maroc. Découvrez des milliers d'offres actualisées à Casablanca, Tanger, Rabat et partout dans le Royaume.",
  keywords: [
    "emploi maroc",
    "recrutement maroc",
    "offres d'emploi",
    "travail maroc",
    "tanger",
    "casablanca",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.className} ${inter.variable}`}
      suppressHydrationWarning
    >
      {/*
        Removed the flex/items-center wrapper that was constraining
        full-width pages like /cv and /terms.
        Each page now controls its own layout.
      */}
      <body className="bg-background text-foreground min-h-screen">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}