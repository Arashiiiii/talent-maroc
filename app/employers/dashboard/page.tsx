"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Briefcase,
  Users,
  Eye,
  CalendarDays,
  Building2,
  Search,
  Filter,
  Download,
  ArrowUpRight,
} from "lucide-react";

type JobStatus = "Brouillon" | "Active" | "Clôturée";
type CandidateStatus = "Nouveau" | "Shortlist" | "Entretien" | "Rejeté";

type Job = {
  id: number;
  title: string;
  city: string;
  type: string;
  postedAt: string;
  views: number;
  applications: number;
  status: JobStatus;
};

type Candidate = {
  id: number;
  name: string;
  role: string;
  city: string;
  appliedTo: string;
  status: CandidateStatus;
  score: number;
};

const initialJobs: Job[] = [
  { id: 1, title: "Responsable Logistique", city: "Tanger", type: "CDI", postedAt: "2026-03-20", views: 412, applications: 18, status: "Active" },
  { id: 2, title: "Acheteur Senior", city: "Casablanca", type: "CDI", postedAt: "2026-03-18", views: 290, applications: 11, status: "Active" },
  { id: 3, title: "Chargé RH", city: "Rabat", type: "CDD", postedAt: "2026-03-12", views: 180, applications: 7, status: "Brouillon" },
];

const initialCandidates: Candidate[] = [
  { id: 1, name: "Salma Bennani", role: "Responsable Logistique", city: "Tanger", appliedTo: "Responsable Logistique", status: "Shortlist", score: 92 },
  { id: 2, name: "Youssef El Idrissi", role: "Acheteur Senior", city: "Casablanca", appliedTo: "Acheteur Senior", status: "Entretien", score: 88 },
  { id: 3, name: "Nadia Amrani", role: "Chargé RH", city: "Rabat", appliedTo: "Chargé RH", status: "Nouveau", score: 84 },
  { id: 4, name: "Omar Kettani", role: "Responsable Logistique", city: "Tétouan", appliedTo: "Responsable Logistique", status: "Rejeté", score: 69 },
];

function badgeClass(status: JobStatus | CandidateStatus) {
  switch (status) {
    case "Active":
    case "Shortlist":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Entretien":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "Brouillon":
    case "Nouveau":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "Clôturée":
    case "Rejeté":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export default function EmployerDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [search, setSearch] = useState("");

  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((candidate) =>
      [candidate.name, candidate.role, candidate.city, candidate.appliedTo, candidate.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [candidates, search]);

  const totalViews = jobs.reduce((sum, job) => sum + job.views, 0);
  const totalApplications = jobs.reduce((sum, job) => sum + job.applications, 0);
  const activeJobs = jobs.filter((job) => job.status === "Active").length;

  const createDemoJob = () => {
    const nextId = jobs.length + 1;
    setJobs((prev) => [
      {
        id: nextId,
        title: `Nouvelle offre ${nextId}`,
        city: "Casablanca",
        type: "CDI",
        postedAt: new Date().toISOString().slice(0, 10),
        views: 0,
        applications: 0,
        status: "Brouillon",
      },
      ...prev,
    ]);
  };

  const moveCandidate = (id: number, status: CandidateStatus) => {
    setCandidates((prev) => prev.map((candidate) => (candidate.id === id ? { ...candidate, status } : candidate)));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Dashboard recruteur</div>
              <div className="text-xl font-black">TalentMaroc Employer</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/employeur"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Retour landing
            </Link>
            <button
              onClick={createDemoJob}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nouvelle offre
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Offres actives", value: activeJobs, icon: Briefcase },
            { label: "Candidatures", value: totalApplications, icon: Users },
            { label: "Vues totales", value: totalViews, icon: Eye },
            { label: "Entretiens", value: candidates.filter((c) => c.status === "Entretien").length, icon: CalendarDays },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{card.label}</p>
                    <p className="mt-2 text-3xl font-black">{card.value}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">Mes offres</h2>
                <p className="mt-1 text-sm text-slate-500">Gérez vos annonces et surveillez leurs performances.</p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-3 font-semibold">Poste</th>
                    <th className="pb-3 font-semibold">Ville</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Vues</th>
                    <th className="pb-3 font-semibold">Candidatures</th>
                    <th className="pb-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-slate-100">
                      <td className="py-4">
                        <div className="font-semibold">{job.title}</div>
                        <div className="text-xs text-slate-500">Publié le {job.postedAt}</div>
                      </td>
                      <td className="py-4">{job.city}</td>
                      <td className="py-4">{job.type}</td>
                      <td className="py-4">{job.views}</td>
                      <td className="py-4">{job.applications}</td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${badgeClass(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-8">
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-black">Actions rapides</h2>
              <div className="mt-5 grid gap-3">
                {[
                  "Créer une nouvelle offre",
                  "Consulter la CVthèque",
                  "Mettre à jour le profil entreprise",
                  "Contacter le support",
                ].map((action) => (
                  <button
                    key={action}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {action}
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-black">Pipeline</h2>
              <div className="mt-5 space-y-4">
                {[
                  ["Nouveaux", candidates.filter((c) => c.status === "Nouveau").length],
                  ["Shortlist", candidates.filter((c) => c.status === "Shortlist").length],
                  ["Entretiens", candidates.filter((c) => c.status === "Entretien").length],
                  ["Rejetés", candidates.filter((c) => c.status === "Rejeté").length],
                ].map(([label, count]) => (
                  <div key={label as string}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">{label as string}</span>
                      <span className="text-slate-500">{count as number}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{
                          width: `${Math.max(12, ((count as number) / Math.max(1, candidates.length)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Candidats récents</h2>
              <p className="mt-1 text-sm text-slate-500">Filtrez et changez le statut des candidatures.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un candidat..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none ring-0 transition focus:border-blue-500 sm:w-72"
                />
              </div>
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                <Filter className="h-4 w-4" />
                Filtres
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold">{candidate.name}</h3>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${badgeClass(candidate.status)}`}>
                      {candidate.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      Score {candidate.score}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {candidate.role} • {candidate.city} • Postulé à {candidate.appliedTo}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["Nouveau", "Shortlist", "Entretien", "Rejeté"] as CandidateStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => moveCandidate(candidate.id, status)}
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                        candidate.status === status
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredCandidates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                Aucun candidat trouvé pour cette recherche.
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
