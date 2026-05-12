import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-violet-950 text-white p-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          CV Professionnel Prêt en 2 Minutes
        </h1>
        <p className="text-lg text-slate-300">
          Des CVs prêts à l'emploi pour les métiers du Maroc — 29 DH seulement.
        </p>
        <Link
          to="/cv-ouvrier"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full px-8 py-3 text-lg transition"
        >
          Voir le catalogue →
        </Link>
      </div>
    </div>
  );
}
