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
  const [success, setSuccess] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    setDebug("Submit clicked");
    setError(null);
    setSuccess(null);
    setIsLoading(true);

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
      setDebug("Creating Supabase client");
      const supabase = createClient();

      const nextPath = isEmployer ? "/employeur/dashboard" : "/protected";
const redirectUrl = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`;

      setDebug(`Sending signUp request to Supabase with redirect: ${redirectUrl}`);

      const { data, error } = await supabase.auth.signUp({
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

      console.log("Supabase signUp response:", { data, error });

      if (error) {
        throw error;
      }

      setSuccess("Compte créé. Vérifiez votre email pour confirmer l'inscription.");
      setDebug("Signup succeeded, redirecting to success page");

      router.push(`/auth/sign-up-success?role=${role}`);
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err?.message || "Erreur lors de l'inscription.");
      setDebug(`Signup failed: ${err?.message || "unknown error"}`);
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

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {success}
                </div>
              )}

              {debug && (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Debug: {debug}
                </div>
              )}

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