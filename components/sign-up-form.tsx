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
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (!fullName.trim()) {
      setError("Veuillez saisir votre nom.");
      setIsLoading(false);
      return;
    }

    if (isEmployer && !companyName.trim()) {
      setError("Veuillez saisir le nom de l'entreprise.");
      setIsLoading(false);
      return;
    }

    if (!email.trim()) {
      setError("Veuillez saisir votre email.");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Mot de passe trop court.");
      setIsLoading(false);
      return;
    }

    try {
      const nextPath = isEmployer ? "/employeur/dashboard" : "/protected";
      const redirectUrl = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(
        nextPath
      )}`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role,
            full_name: fullName,
            phone,
            ...(isEmployer ? { company_name: companyName } : {}),
          },
        },
      });

      if (error) throw error;

      router.push(`/auth/sign-up-success?role=${role}`);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'inscription.");
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
              ? "Publiez des offres et gérez vos candidatures."
              : "Créez votre compte candidat."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-5">
              {isEmployer && (
                <div className="grid gap-2">
                  <Label htmlFor="companyName">Entreprise</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nom de l'entreprise"
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="fullName">
                  {isEmployer ? "Nom du recruteur" : "Nom complet"}
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isEmployer ? "Votre nom" : "Votre nom complet"}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="repeatPassword">Confirmer mot de passe</Label>
                <Input
                  id="repeatPassword"
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading
                  ? "Création..."
                  : isEmployer
                    ? "Créer un compte recruteur"
                    : "Créer un compte"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Déjà inscrit ?{" "}
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