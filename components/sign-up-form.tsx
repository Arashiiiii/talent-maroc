"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const role = useMemo(
    () => (searchParams.get("role") === "employer" ? "employer" : "candidate"),
    [searchParams]
  );

  const isEmployer = role === "employer";

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (!fullName.trim()) {
      setError("Veuillez saisir votre nom complet.");
      setIsLoading(false);
      return;
    }

    if (isEmployer && !companyName.trim()) {
      setError("Veuillez saisir le nom de votre entreprise.");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setIsLoading(false);
      return;
    }

    try {
      const confirmRedirect = isEmployer
        ? `${window.location.origin}/employeur/dashboard`
        : `${window.location.origin}/protected`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: confirmRedirect,
          data: {
            role,
            full_name: fullName,
            phone,
            ...(isEmployer ? { company_name: companyName } : {}),
          },
        },
      });

      if (error) throw error;

      setMessage(
        isEmployer
          ? "Compte recruteur créé. Vérifiez votre email pour confirmer votre inscription."
          : "Compte créé. Vérifiez votre email pour confirmer votre inscription."
      );

      router.push(`/auth/sign-up-success?role=${role}`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isEmployer ? "Créer un compte recruteur" : "Créer un compte"}
          </CardTitle>
          <CardDescription>
            {isEmployer
              ? "Inscrivez votre entreprise pour publier des offres et gérer vos candidatures."
              : "Créez un nouveau compte candidat."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              {isEmployer && (
                <div className="grid gap-2">
                  <Label htmlFor="companyName">Entreprise</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Nom de votre entreprise"
                    required={isEmployer}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="fullName">
                  {isEmployer ? "Nom du recruteur" : "Nom complet"}
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={isEmployer ? "Votre nom" : "Votre nom complet"}
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+212 ..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Confirmer le mot de passe</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              {message && <p className="text-sm text-green-600">{message}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? "Création du compte..."
                  : isEmployer
                  ? "Créer un compte recruteur"
                  : "Créer un compte"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Vous avez déjà un compte ?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Se connecter
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}