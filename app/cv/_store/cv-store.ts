"use client";

/**
 * Zustand store for the CV builder.
 *
 * Key design decisions
 * ─────────────────────
 * updatePath(dotPath, value) — single update path shared by both the left-column
 * form AND the inline-edit spans inside the preview. This is the exact same
 * path system as the prototype (e.g. "profile.email", "experience.e1.bullets.0").
 * No state is duplicated.
 *
 * Structural mutations (add/remove items) are separate named actions so callers
 * don't have to build full replacement arrays themselves.
 *
 * Persistence is intentionally NOT in the store — the useAutosave hook
 * (app/cv/[id]/_hooks/useAutosave.ts) subscribes and debounces at 800 ms.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

import {
  type CVData,
  type SectionId,
  type TemplateId,
  type Lang,
  type ExperienceItem,
  type EducationItem,
  type SkillGroup,
  type LanguageItem,
  type CertItem,
  type ProjectItem,
  EMPTY_CV,
  DEFAULT_SECTION_ORDER,
  DEFAULT_SECTIONS_ENABLED,
  uid,
} from "../_lib/schema";

// ─────────────────────────────────────────────────────────────────────────────
// Path-based deep setter — matches the prototype's setPath semantics.
// Works correctly with immer drafts (Proxy).
//
// Path examples:
//   "profile.email"               → cv.profile.email = value
//   "experience.e1.role"          → cv.experience[id=e1].role = value
//   "experience.e1.bullets.0"     → cv.experience[id=e1].bullets[0] = value
//   "skills.s1.items"             → cv.skills[id=s1].items = value
// ─────────────────────────────────────────────────────────────────────────────
function setByPath(root: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");

  function go(node: unknown, depth: number): void {
    if (node === null || node === undefined) return;

    const key = parts[depth];
    const isLast = depth === parts.length - 1;

    if (Array.isArray(node)) {
      // This key is an ID or numeric index into the array
      const idx = /^\d+$/.test(key)
        ? +key
        : (node as Array<{ id?: string }>).findIndex((x) => x?.id === key);
      if (idx < 0 || idx >= node.length) return;

      if (isLast) {
        node[idx] = value;
      } else {
        go(node[idx], depth + 1);
      }
      return;
    }

    if (typeof node !== "object") return;
    const obj = node as Record<string, unknown>;

    if (isLast) {
      obj[key] = value;
      return;
    }

    const child = obj[key];
    if (Array.isArray(child)) {
      // Next segment is the ref/index into this array
      go(child, depth + 1);
    } else {
      go(child, depth + 1);
    }
  }

  go(root, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// State + Actions interface
// ─────────────────────────────────────────────────────────────────────────────

interface CVState {
  cv:       CVData;
  template: TemplateId;
  accent:   string;
  lang:     Lang;
  order:    SectionId[];
  enabled:  Record<SectionId, boolean>;
  cvName:   string;
  cvId:     string | null;
  lastSaved: Date | null;
  saving:   boolean;
}

interface CVActions {
  /** Bulk-init from server-fetched data when the builder mounts. */
  init: (id: string, partial: Partial<CVState>) => void;

  /** Replace the entire CV data (used by the import feature). */
  loadCV: (data: CVData) => void;

  // ── Universal path-based field update ────────────────────────────────────
  /**
   * Update any CV field by dot-path.
   * Called by both form inputs and inline-edit spans — single update path.
   */
  updatePath: (path: string, value: unknown) => void;

  // ── Structural add/remove (form actions) ─────────────────────────────────
  addExperience:    ()       => void;
  removeExperience: (id: string) => void;
  addBullet:        (expId: string) => void;
  removeBullet:     (expId: string, idx: number) => void;
  reorderExperiences: (items: ExperienceItem[]) => void;

  addEducation:    () => void;
  removeEducation: (id: string) => void;

  addSkillGroup:    () => void;
  removeSkillGroup: (id: string) => void;

  addLanguage:    () => void;
  removeLanguage: (id: string) => void;

  addCert:    () => void;
  removeCert: (id: string) => void;

  addProject:    () => void;
  removeProject: (id: string) => void;

  setInterests: (raw: string) => void;

  // ── Display settings ─────────────────────────────────────────────────────
  setTemplate: (t: TemplateId) => void;
  setAccent:   (hex: string) => void;
  setLang:     (l: Lang) => void;
  setCVName:   (name: string) => void;

  // ── Section layout ────────────────────────────────────────────────────────
  reorderSections: (order: SectionId[]) => void;
  toggleSection:   (id: SectionId) => void;

  // ── Autosave signals (called by useAutosave hook) ─────────────────────────
  markSaving: () => void;
  markSaved:  () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useCVStore = create<CVState & CVActions>()(
  devtools(
    immer((set) => ({
      cv:        EMPTY_CV,
      template:  "corso",
      accent:    "#7c3aed",
      lang:      "fr",
      order:     [...DEFAULT_SECTION_ORDER],
      enabled:   { ...DEFAULT_SECTIONS_ENABLED },
      cvName:    "Mon CV",
      cvId:      null,
      lastSaved: null,
      saving:    false,

      // ── Init ─────────────────────────────────────────────────────────────
      init: (id, partial) =>
        set((s) => {
          s.cvId = id;
          if (partial.cv)       s.cv       = partial.cv;
          if (partial.template) s.template = partial.template;
          if (partial.accent)   s.accent   = partial.accent;
          if (partial.lang)     s.lang     = partial.lang;
          if (partial.order)    s.order    = partial.order;
          if (partial.enabled)  s.enabled  = partial.enabled;
          if (partial.cvName)   s.cvName   = partial.cvName;
        }),

      // ── Import ───────────────────────────────────────────────────────────
      loadCV: (data) => set((s) => { s.cv = data; }),

      // ── Universal path update ─────────────────────────────────────────────
      updatePath: (path, value) =>
        set((s) => {
          setByPath(s.cv as unknown as Record<string, unknown>, path, value);
        }),

      // ── Experience ────────────────────────────────────────────────────────
      addExperience: () =>
        set((s) => {
          s.cv.experience.push({
            id:      uid(),
            role:    "",
            company: "",
            city:    "",
            start:   "",
            end:     "",
            current: false,
            bullets: [""],
          });
        }),

      removeExperience: (id) =>
        set((s) => {
          s.cv.experience = s.cv.experience.filter((e) => e.id !== id);
        }),

      addBullet: (expId) =>
        set((s) => {
          const e = s.cv.experience.find((x) => x.id === expId);
          if (e) e.bullets.push("");
        }),

      removeBullet: (expId, idx) =>
        set((s) => {
          const e = s.cv.experience.find((x) => x.id === expId);
          if (e) e.bullets.splice(idx, 1);
        }),

      reorderExperiences: (items) =>
        set((s) => { s.cv.experience = items; }),

      // ── Education ────────────────────────────────────────────────────────
      addEducation: () =>
        set((s) => {
          s.cv.education.push({
            id: uid(), degree: "", school: "", city: "", start: "", end: "",
          });
        }),

      removeEducation: (id) =>
        set((s) => {
          s.cv.education = s.cv.education.filter((e) => e.id !== id);
        }),

      // ── Skills ───────────────────────────────────────────────────────────
      addSkillGroup: () =>
        set((s) => {
          s.cv.skills.push({ id: uid(), group: "Nouveau groupe", items: [] });
        }),

      removeSkillGroup: (id) =>
        set((s) => {
          s.cv.skills = s.cv.skills.filter((g) => g.id !== id);
        }),

      // ── Languages ────────────────────────────────────────────────────────
      addLanguage: () =>
        set((s) => {
          s.cv.languages.push({ id: uid(), name: "", level: "", dots: 3 });
        }),

      removeLanguage: (id) =>
        set((s) => {
          s.cv.languages = s.cv.languages.filter((l) => l.id !== id);
        }),

      // ── Certifications ───────────────────────────────────────────────────
      addCert: () =>
        set((s) => {
          s.cv.certifications.push({ id: uid(), name: "", issuer: "", year: "" });
        }),

      removeCert: (id) =>
        set((s) => {
          s.cv.certifications = s.cv.certifications.filter((c) => c.id !== id);
        }),

      // ── Projects ─────────────────────────────────────────────────────────
      addProject: () =>
        set((s) => {
          s.cv.projects.push({ id: uid(), name: "", role: "", detail: "" });
        }),

      removeProject: (id) =>
        set((s) => {
          s.cv.projects = s.cv.projects.filter((p) => p.id !== id);
        }),

      // ── Interests ────────────────────────────────────────────────────────
      setInterests: (raw) =>
        set((s) => {
          s.cv.interests = raw.split(",").map((x) => x.trim()).filter(Boolean);
        }),

      // ── Display ──────────────────────────────────────────────────────────
      setTemplate: (t)    => set((s) => { s.template = t; }),
      setAccent:   (hex)  => set((s) => { s.accent   = hex; }),
      setLang:     (l)    => set((s) => { s.lang     = l; }),
      setCVName:   (name) => set((s) => { s.cvName   = name; }),

      // ── Layout ───────────────────────────────────────────────────────────
      reorderSections: (order) => set((s) => { s.order   = order; }),
      toggleSection:   (id)    => set((s) => { s.enabled[id] = !s.enabled[id]; }),

      // ── Autosave ─────────────────────────────────────────────────────────
      markSaving: () => set((s) => { s.saving = true; }),
      markSaved:  () => set((s) => { s.saving = false; s.lastSaved = new Date(); }),
    })),
    { name: "cv-store" }
  )
);

// ─────────────────────────────────────────────────────────────────────────────
// Selector helpers — scope re-renders to what each component actually reads
// ─────────────────────────────────────────────────────────────────────────────

export const selectCV         = (s: CVState) => s.cv;
export const selectTemplate   = (s: CVState) => s.template;
export const selectAccent     = (s: CVState) => s.accent;
export const selectLang       = (s: CVState) => s.lang;
export const selectOrder      = (s: CVState) => s.order;
export const selectEnabled    = (s: CVState) => s.enabled;
export const selectSaveStatus = (s: CVState) => ({ saving: s.saving, lastSaved: s.lastSaved });
export const selectUpdatePath = (s: CVState & CVActions) => s.updatePath;
