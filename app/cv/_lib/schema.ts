import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Primitive enumerations
// ─────────────────────────────────────────────────────────────────────────────

export const LANGS = ["fr", "en", "ar"] as const;
export type Lang = (typeof LANGS)[number];

export const TEMPLATE_IDS = ["corso", "meridian", "aria", "dahab", "medina", "vertex", "atlas", "lumen", "helix", "slate"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const SECTION_IDS = [
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
  "certifications",
  "projects",
  "interests",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schemas — each item has an `id` for React keys and dnd-kit sorting
// ─────────────────────────────────────────────────────────────────────────────

/** Fixed profile block at the top (not draggable). */
export const ProfileSchema = z.object({
  firstName: z.string(),
  lastName:  z.string(),
  title:     z.string(),
  email:     z.string(),
  phone:     z.string(),
  city:      z.string(),
  website:   z.string().optional(),
  linkedin:  z.string().optional(),
  /** Base64 JPEG or Supabase Storage URL (max 800×800 after crop). */
  photo:     z.string().optional(),
});

export const ExperienceItemSchema = z.object({
  id:      z.string(),
  role:    z.string(),
  company: z.string(),
  city:    z.string().optional(),
  start:   z.string(),
  end:     z.string().optional(),
  current: z.boolean().optional(),
  bullets: z.array(z.string()),
});

export const EducationItemSchema = z.object({
  id:     z.string(),
  degree: z.string(),
  school: z.string(),
  city:   z.string().optional(),
  start:  z.string(),
  end:    z.string(),
  detail: z.string().optional(),
});

/** Skills are organised into named groups (e.g. "Design", "Outils & code"). */
export const SkillGroupSchema = z.object({
  id:    z.string(),
  group: z.string(),
  items: z.array(z.string()),
});

export const LanguageItemSchema = z.object({
  id:    z.string(),
  name:  z.string(),
  level: z.string(),
  /** Dot rating 1–5 used by sidebar templates. */
  dots:  z.number().min(1).max(5),
});

export const CertItemSchema = z.object({
  id:     z.string(),
  name:   z.string(),
  issuer: z.string().optional(),
  year:   z.string().optional(),
});

export const ProjectItemSchema = z.object({
  id:     z.string(),
  name:   z.string(),
  role:   z.string().optional(),
  detail: z.string(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Root CV schema — shape that lives in `cvs.data` (jsonb)
// ─────────────────────────────────────────────────────────────────────────────

export const CVDataSchema = z.object({
  profile:        ProfileSchema,
  summary:        z.string(),
  experience:     z.array(ExperienceItemSchema),
  education:      z.array(EducationItemSchema),
  skills:         z.array(SkillGroupSchema),
  languages:      z.array(LanguageItemSchema),
  certifications: z.array(CertItemSchema),
  projects:       z.array(ProjectItemSchema),
  interests:      z.array(z.string()),
});

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript types (inferred — single source of truth)
// ─────────────────────────────────────────────────────────────────────────────

export type Profile        = z.infer<typeof ProfileSchema>;
export type CVData         = z.infer<typeof CVDataSchema>;
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;
export type EducationItem  = z.infer<typeof EducationItemSchema>;
export type SkillGroup     = z.infer<typeof SkillGroupSchema>;
export type LanguageItem   = z.infer<typeof LanguageItemSchema>;
export type CertItem       = z.infer<typeof CertItemSchema>;
export type ProjectItem    = z.infer<typeof ProjectItemSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────────

export const EMPTY_CV: CVData = {
  profile:        { firstName: "", lastName: "", title: "", email: "", phone: "", city: "" },
  summary:        "",
  experience:     [],
  education:      [],
  skills:         [],
  languages:      [],
  certifications: [],
  projects:       [],
  interests:      [],
};

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
  "certifications",
  "projects",
  "interests",
];

export const DEFAULT_SECTIONS_ENABLED: Record<SectionId, boolean> = {
  summary:        true,
  experience:     true,
  education:      true,
  skills:         true,
  languages:      true,
  certifications: true,
  projects:       false,
  interests:      false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Template registry
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateConfig {
  id:     TemplateId;
  name:   string;
  /** Short descriptor shown under the thumbnail. */
  sub:    string;
  /** Default accent colour for this template. */
  accent: string;
  tag:    "Inclus" | "Pro";
}

export const TEMPLATE_REGISTRY: TemplateConfig[] = [
  { id: "corso",    name: "Corso",    sub: "Sidebar moderne",     accent: "#7c3aed", tag: "Inclus" },
  { id: "meridian", name: "Meridian", sub: "Classique éditorial", accent: "#0f172a", tag: "Inclus" },
  { id: "aria",     name: "Aria",     sub: "Minimal",             accent: "#374151", tag: "Inclus" },
  { id: "dahab",    name: "Dahab",    sub: "Exécutif",            accent: "#1e1147", tag: "Pro"    },
  { id: "medina",   name: "Medina",   sub: "Créatif",             accent: "#f97316", tag: "Pro"    },
  { id: "vertex",   name: "Vertex",   sub: "Rail éditorial",      accent: "#0f172a", tag: "Pro"    },
  { id: "atlas",    name: "Atlas",    sub: "Sidebar sombre",      accent: "#1e293b", tag: "Pro"    },
  { id: "lumen",    name: "Lumen",    sub: "Bandeau + 2 colonnes",accent: "#0891b2", tag: "Pro"    },
  { id: "helix",    name: "Helix",    sub: "Timeline",            accent: "#7c3aed", tag: "Pro"    },
  { id: "slate",    name: "Slate",    sub: "Swiss minimaliste",   accent: "#374151", tag: "Pro"    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section metadata (labels, icons, preview headings)
// ─────────────────────────────────────────────────────────────────────────────

export const SECTION_META: Record<SectionId, { label: string; icon: string; preview: string }> = {
  summary:        { label: "Profil",             icon: "◆", preview: "Profil"                    },
  experience:     { label: "Expérience",         icon: "◈", preview: "Expérience professionnelle" },
  education:      { label: "Formation",          icon: "◊", preview: "Formation"                 },
  skills:         { label: "Compétences",        icon: "⬡", preview: "Compétences"               },
  languages:      { label: "Langues",            icon: "◎", preview: "Langues"                   },
  certifications: { label: "Certifications",     icon: "◍", preview: "Certifications"            },
  projects:       { label: "Projets",            icon: "◳", preview: "Projets"                   },
  interests:      { label: "Centres d'intérêt",  icon: "◦", preview: "Centres d'intérêt"         },
};

// ─────────────────────────────────────────────────────────────────────────────
// Accent colour palette (8 options surfaced in AccentPicker)
// ─────────────────────────────────────────────────────────────────────────────

export const ACCENT_OPTIONS = [
  "#7c3aed",
  "#1e1147",
  "#0f172a",
  "#0e7490",
  "#065f46",
  "#b45309",
  "#f97316",
  "#be123c",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Persisted document schema (maps 1-to-1 to Supabase columns)
// ─────────────────────────────────────────────────────────────────────────────

export const CVDocSchema = z.object({
  data:             CVDataSchema,
  template:         z.enum(TEMPLATE_IDS),
  accent:           z.string(),
  lang:             z.enum(LANGS),
  section_order:    z.array(z.enum(SECTION_IDS)),
  sections_enabled: z.record(z.enum(SECTION_IDS), z.boolean()),
});
export type CVDoc = z.infer<typeof CVDocSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Tiny UID helper — used when adding new items
// ─────────────────────────────────────────────────────────────────────────────
export const uid = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
