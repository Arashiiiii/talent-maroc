import Link from "next/link";
import {
  Check,
  Zap,
  Users,
  BarChart3,
  Rocket,
  Briefcase,
  ShieldCheck,
  Search,
  Building2,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";

type Plan = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  popular?: boolean;
};

const plans: Plan[] = [
  {
    name: "Basique",
    price: "0",
    cadence: "/offre",
    description: "Pour tester la plateforme avec une première annonce.",
    features: [
      "1 offre d'emploi",
      "Visibilité standard",
      "Gestion simple des candidatures",
      "7 jours en ligne",
    ],
    ctaLabel: "Commencer gratuitement",
    ctaHref: "/auth/register?role=employer&plan=basic",
  },
  {
    name: "Premium",
    price: "490",
    cadence: "/mois",
    description: "Pour les PME qui veulent recruter plus vite et mieux.",
    features: [
      "3 offres d'emploi actives",
      "Annonce mise en avant",
      "Logo entreprise en couleur",
      "30 jours en ligne",
      "Statistiques de clics et candidatures",
    ],
    ctaLabel: "Choisir Premium",
    ctaHref: "/auth/register?role=employer&plan=premium",
    popular: true,
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    cadence: "",
    description: "Pour les structures qui recrutent en volume.",
    features: [
      "Offres illimitées",
      "CVthèque",
      "Support dédié",
      "Badge entreprise vérifiée",
      "Intégration API / automatisation",
    ],
    ctaLabel: "Contacter Sales",
    ctaHref: "/contact?topic=employers",
  },
];

const stats = [
  { value: "50k+", label: "candidats visitent la plateforme chaque mois" },
  { value: "<24h", label: "pour recevoir les premières candidatures" },
  { value: "3x", label: "plus de visibilité avec les offres premium" },
];

const steps = [
  {
    title: "Créer un compte recruteur",
    text: "Inscription rapide de votre entreprise avec accès recruteur dédié.",
    icon: Building2,
  },
  {
    title: "Publier votre offre",
    text: "Ajoutez le poste, la ville, le salaire, les compétences et les critères.",
    icon: Briefcase,
  },
  {
    title: "Recevoir et filtrer",
    text: "Suivez les candidatures, consultez les profils et passez à l'action.",
    icon: Search,
  },
  {
    title: "Piloter depuis le dashboard",
    text: "Visualisez les clics, candidatures, statuts et performances en temps réel.",
    icon: BarChart3,
  },
];

export default function EmployerLandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="mb-5 inline-flex items-center rounded-full bg-blue-600/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-300 ring-1 ring-inset ring-blue-500/30">
                Espace recruteur
              </span>
              <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
                Recrutez plus vite au Maroc avec un espace employeur clair et efficace.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Créez votre compte entreprise, publiez vos offres, suivez les candidatures et pilotez
                vos recrutements depuis un tableau de bord pensé pour les employeurs.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/auth/sign-up?role=employer"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white transition hover:bg-blue-700"
                >
                  Créer un compte recruteur
                </Link>
                <Link
                  href="/auth/login?role=employer"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700 px-6 py-4 text-base font-bold text-white transition hover:bg-slate-900"
                >
                  Se connecter
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="text-2xl font-black text-white">{item.value}</div>
                    <div className="mt-1 text-sm text-slate-400">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-800 bg-white p-6 text-slate-900 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Aperçu dashboard recruteur</p>
                  <h2 className="text-2xl font-black">TalentMaroc Employer</h2>
                </div>
                <BadgeCheck className="h-9 w-9 text-blue-600" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Offres actives", value: "3" },
                  { label: "Candidatures", value: "48" },
                  { label: "Entretiens", value: "7" },
                ].map((card) => (
                  <div key={card.label} className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">{card.label}</div>
                    <div className="mt-2 text-3xl font-black">{card.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">Offres récentes</h3>
                  <Link href="/employeur/dashboard" className="text-sm font-semibold text-blue-600 hover:underline">
                    Ouvrir le dashboard
                  </Link>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ["Responsable Logistique", "Tanger", "18 candidatures"],
                    ["Acheteur Senior", "Casablanca", "11 candidatures"],
                    ["Chargé RH", "Rabat", "19 candidatures"],
                  ].map(([title, city, apps]) => (
                    <div key={title} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <div>
                        <div className="font-semibold">{title}</div>
                        <div className="text-sm text-slate-500">{city}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-600">{apps}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 font-bold text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                    Entreprise vérifiée
                  </div>
                  <p className="mt-2 text-sm text-emerald-900">
                    Renforcez la confiance avec un profil entreprise complet et contrôlé.
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4">
                  <div className="flex items-center gap-2 font-bold text-blue-700">
                    <Rocket className="h-5 w-5" />
                    Publication rapide
                  </div>
                  <p className="mt-2 text-sm text-blue-900">
                    Publiez une offre en quelques minutes et commencez à recevoir des profils.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-xl font-black">Audience qualifiée</h3>
            <p className="mt-3 text-slate-600">
              Touchez des candidats issus des meilleures écoles, filières et expériences du Maroc.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-xl font-black">Recrutement plus rapide</h3>
            <p className="mt-3 text-slate-600">
              Centralisez vos candidatures, comparez les profils et réduisez le temps de traitement.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BarChart3 className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-xl font-black">Dashboard en temps réel</h3>
            <p className="mt-3 text-slate-600">
              Suivez les vues, clics, candidatures et statuts d'entretien en un seul endroit.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black sm:text-4xl">Comment ça marche</h2>
            <p className="mt-4 text-slate-600">
              Tout le parcours recruteur, de l'inscription au suivi des candidatures.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="mt-4 text-sm font-bold text-blue-600">Étape {index + 1}</div>
                  <h3 className="mt-2 text-xl font-black">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black sm:text-4xl">Tarifs employeurs</h2>
            <p className="mt-4 text-slate-600">Choisissez la formule adaptée à votre volume de recrutement.</p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-[28px] bg-white p-8 shadow-sm ring-1 ${
                  plan.popular ? "scale-[1.02] ring-2 ring-blue-600" : "ring-slate-200"
                }`}
              >
                {plan.popular ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                    Le plus populaire
                  </span>
                ) : null}

                <h3 className="text-2xl font-black">{plan.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{plan.description}</p>

                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-black">{plan.price}</span>
                  {plan.price !== "Sur devis" ? <span className="pb-1 font-semibold text-slate-500">MAD{plan.cadence}</span> : null}
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-700">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaHref}
                  className={`mt-10 inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-base font-bold transition ${
                    plan.popular ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {plan.ctaLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black sm:text-4xl">Prêt à ouvrir votre espace employeur ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Créez votre compte, publiez vos offres et gérez vos recrutements depuis un dashboard dédié.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register?role=employer"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700"
            >
              Créer mon compte recruteur
            </Link>
            <Link
              href="/employeur/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 px-6 py-4 font-bold text-white transition hover:bg-slate-900"
            >
              Voir le dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
