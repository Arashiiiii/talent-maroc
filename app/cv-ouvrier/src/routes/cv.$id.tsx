import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cv/$id")({
  component: CVEditorStub,
});

function CVEditorStub() {
  const { id } = Route.useParams();
  const [cv, setCv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("cvs")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setCv(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-12 text-center text-slate-500">Chargement…</div>;
  if (!cv)
    return (
      <div className="p-12 text-center text-slate-500">
        CV introuvable.{" "}
        <Link to="/cv-ouvrier" className="text-violet-600">
          Retour
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border p-8">
        <Link to="/cv-ouvrier" className="text-sm text-slate-500 hover:text-violet-600">
          ← Retour
        </Link>
        <h1 className="text-2xl font-bold mt-4 text-slate-900">{cv.name}</h1>
        <p className="text-slate-500 mt-1">L'éditeur complet arrive bientôt.</p>
        <div className="mt-6 flex gap-3">
          <a
            href={`/cv/${id}/print?autoprint=1`}
            target="_blank"
            rel="noreferrer"
            className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg font-medium"
          >
            ↓ Télécharger le PDF
          </a>
        </div>
        <pre className="mt-8 bg-slate-50 p-4 rounded-lg text-xs overflow-auto border">
          {JSON.stringify(cv.data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
