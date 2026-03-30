import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const role = user.user_metadata?.role ?? "candidate";
  const fullName = user.user_metadata?.full_name ?? user.email ?? "Utilisateur";

  if (role === "employer") {
    redirect("/employeur/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-3xl bg-slate-900 p-8 text-white">
          <p className="mb-2 text-sm uppercase tracking-widest text-slate-300">
            Espace candidat
          </p>
          <h1 className="text-3xl font-black">
            Bienvenue, {fullName}
          </h1>
          <p className="mt-3 text-slate-300">
            Votre compte est confirmé et vous êtes connecté.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Mon profil</h2>
            <p className="mt-2 text-sm text-slate-500">
              Complétez vos informations pour améliorer votre visibilité.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Mes candidatures</h2>
            <p className="mt-2 text-sm text-slate-500">
              Suivez l’état de vos candidatures en cours.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">CV & documents</h2>
            <p className="mt-2 text-sm text-slate-500">
              Gérez votre CV, vos lettres et vos documents.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Informations du compte</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Nom</p>
              <p className="mt-1 font-medium text-slate-900">
                {user.user_metadata?.full_name || "Non renseigné"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
              <p className="mt-1 font-medium text-slate-900">
                {user.email || "Non renseigné"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Téléphone</p>
              <p className="mt-1 font-medium text-slate-900">
                {user.user_metadata?.phone || "Non renseigné"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Rôle</p>
              <p className="mt-1 font-medium text-slate-900">{role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}