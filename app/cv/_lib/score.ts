/**
 * Pure CV completeness scorer — no React, no store imports.
 * Runs identically in API routes, server components, and the browser.
 */

import type { CVData, SectionId } from "./schema";

export interface ScoreItem {
  id:     string;
  label:  string;
  delta:  number;
  done:   boolean;
}

export interface ScoreResult {
  value: number;
  items: ScoreItem[];
}

export function computeScore(
  cv: CVData,
  _order: SectionId[],
  enabled: Record<SectionId, boolean>,
): ScoreResult {
  const totalSkillItems = cv.skills.reduce((n, g) => n + g.items.filter(Boolean).length, 0);

  const items: ScoreItem[] = [
    {
      id:    "contact-full",
      label: "Compléter prénom, email et téléphone",
      delta: 8,
      done:  Boolean(cv.profile.firstName.trim()) &&
             Boolean(cv.profile.email.trim())     &&
             Boolean(cv.profile.phone.trim()),
    },
    {
      id:    "title",
      label: "Ajouter un titre professionnel",
      delta: 7,
      done:  Boolean(cv.profile.title.trim()),
    },
    {
      id:    "photo",
      label: "Ajouter une photo de profil",
      delta: 8,
      done:  Boolean(cv.profile.photo),
    },
    {
      id:    "summary",
      label: "Rédiger un résumé professionnel (50+ mots)",
      delta: 12,
      done:  enabled.summary !== false &&
             cv.summary.trim().split(/\s+/).filter(Boolean).length >= 50,
    },
    {
      id:    "exp-exists",
      label: "Ajouter au moins une expérience professionnelle",
      delta: 15,
      done:  cv.experience.length > 0,
    },
    {
      id:    "exp-bullets",
      label: "Détailler chaque poste avec 2+ points clés",
      delta: 10,
      done:  cv.experience.length > 0 &&
             cv.experience.every((e) => e.bullets.filter(Boolean).length >= 2),
    },
    {
      id:    "education",
      label: "Ajouter une formation ou diplôme",
      delta: 10,
      done:  cv.education.length > 0,
    },
    {
      id:    "skills",
      label: "Lister au moins 5 compétences",
      delta: 10,
      done:  totalSkillItems >= 5,
    },
    {
      id:    "languages",
      label: "Indiquer les langues parlées",
      delta: 8,
      done:  cv.languages.length > 0,
    },
    {
      id:    "linkedin",
      label: "Ajouter votre URL LinkedIn",
      delta: 7,
      done:  Boolean(cv.profile.linkedin?.trim()),
    },
    {
      id:    "certifications",
      label: "Ajouter une certification",
      delta: 5,
      done:  cv.certifications.length > 0,
    },
  ];

  // Defensive invariant: deltas must sum to 100
  const total = items.reduce((s, i) => s + i.delta, 0);
  if (total !== 100) items[items.length - 1].delta += 100 - total;

  const earned = items.reduce((s, i) => s + (i.done ? i.delta : 0), 0);
  const value  = Math.min(100, Math.max(0, Math.round(earned)));

  // Done items first, then by descending delta (biggest opportunity at top)
  const sorted = [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? -1 : 1;
    return b.delta - a.delta;
  });

  return { value, items: sorted };
}

export function scoreColor(value: number): string {
  if (value >= 80) return "#16a34a";
  if (value >= 50) return "#f97316";
  return "#ef4444";
}
