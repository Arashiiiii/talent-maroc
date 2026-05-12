import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/cv-ouvrier",
  }),
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + redirect },
        });
        if (error) throw error;
        toast.success("Compte créé ! Vous êtes connecté.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté");
      }
      navigate({ to: redirect });
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <Link to="/cv-ouvrier" className="text-sm text-slate-500 hover:text-violet-600">
          ← Retour
        </Link>
        <h1 className="text-2xl font-bold mt-4 text-slate-900">
          {mode === "signin" ? "Connexion" : "Créer un compte"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {mode === "signin"
            ? "Connectez-vous pour télécharger votre CV"
            : "Créez votre compte gratuit en 10 secondes"}
        </p>
        <form onSubmit={onSubmit} className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            {loading ? "..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-sm text-violet-600 hover:underline mt-4 w-full text-center"
        >
          {mode === "signin"
            ? "Pas de compte ? Créer un compte"
            : "Déjà inscrit ? Se connecter"}
        </button>
      </div>
    </div>
  );
}
