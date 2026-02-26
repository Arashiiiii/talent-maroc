import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://talentmaroc.shop"),
  title: {
    default: "Talent Maroc | Emploi et Recrutement au Maroc",
    template: "%s | Talent Maroc",
  },
  description: "Le portail n°1 pour trouver un emploi au Maroc. Découvrez des milliers d'offres actualisées à Casablanca, Tanger, Rabat et partout dans le Royaume.",
  keywords: ["emploi maroc", "recrutement maroc", "offres d'emploi", "travail maroc", "tanger", "casablanca"],
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
    <html lang="fr" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <main className="min-h-screen flex flex-col items-center">
          <div className="flex-1 w-full flex flex-col items-center">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}