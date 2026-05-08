/**
 * Shared sub-components used by two or more templates.
 * Pure render — no hooks, no store access.
 */

import type { CSSProperties } from "react";
import type { CVData, SectionId, Lang } from "../../../_lib/schema";
import { IE, type IEProps } from "../InlineEditable";
import { I18N }   from "../../../_lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// RTL / font helpers — consumed by every template
// ─────────────────────────────────────────────────────────────────────────────

export function rtlDir(lang: Lang): "rtl" | undefined {
  return lang === "ar" ? "rtl" : undefined;
}

export function cvFont(lang: Lang): string {
  return lang === "ar"
    ? "'Cairo', 'Noto Sans Arabic', system-ui, sans-serif"
    : "'Inter', system-ui, sans-serif";
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function initials(cv: CVData): string {
  return (
    (cv.profile.firstName?.[0] ?? "") +
    (cv.profile.lastName?.[0]  ?? "")
  ).toUpperCase() || "?";
}

export function fullName(cv: CVData): string {
  return `${cv.profile.firstName} ${cv.profile.lastName}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header: "─── TITLE ───" line
// rtl: reverses the gradient tail so it fades toward the start of the line
// ─────────────────────────────────────────────────────────────────────────────

interface SHProps {
  title:  string;
  accent: string;
  style?: CSSProperties;
  rtl?:   boolean;
}

export function SH({ title, accent, style, rtl }: SHProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 10px", ...style }}>
      <div style={{
        fontSize:        11,
        fontWeight:      800,
        letterSpacing:   ".18em",
        color:           accent,
        textTransform:   "uppercase",
        whiteSpace:      "nowrap",
      }}>
        {title}
      </div>
      <div style={{
        flex:       1,
        height:     1,
        background: `linear-gradient(to ${rtl ? "left" : "right"}, ${accent}44, transparent)`,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Language dot-row helper
// ─────────────────────────────────────────────────────────────────────────────

export function LangDots({ dots, filled, empty }: { dots: number; filled: string; empty: string }) {
  return (
    <span style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{ width: 6, height: 6, borderRadius: "50%", background: i <= dots ? filled : empty }}
        />
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared MainSection — used by Corso, Dahab, Medina
// Renders: summary, experience, education, projects
// ─────────────────────────────────────────────────────────────────────────────

interface MainSectionProps {
  sec:      SectionId;
  cv:       CVData;
  accent:   string;
  lang:     Lang;
  onUpdate: (path: string, value: unknown) => void;
  readOnly?: boolean;
}

export function MainSection({ sec, cv, accent, lang, onUpdate, readOnly }: MainSectionProps) {
  const t   = I18N[lang];
  const rtl = lang === "ar";
  const ie  = (p: Omit<IEProps, "onChange"> & { path: string }) => (
    <IE {...p} onChange={(v) => onUpdate(p.path, v)} readOnly={readOnly} />
  );

  if (sec === "summary") return (
    <>
      <SH title={t.summary} accent={accent} rtl={rtl} />
      <p style={{ margin: 0, color: "#374151", fontSize: 11.5, lineHeight: 1.7 }}>
        {ie({ value: cv.summary, path: "summary", block: true })}
      </p>
    </>
  );

  if (sec === "experience") return (
    <>
      <SH title={t.experience} accent={accent} rtl={rtl} />
      {cv.experience.map((e) => (
        <div key={e.id} style={{ marginBottom: 14, paddingInlineStart: 14, position: "relative" }}>
          {/* Bullet dot — uses logical inset so it flips in RTL */}
          <div style={{
            position:        "absolute",
            insetInlineStart: 0,
            top:             6,
            width:           6,
            height:          6,
            borderRadius:    "50%",
            background:      accent,
          }} />
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {ie({ value: e.role, path: `experience.${e.id}.role` })}
            </div>
            <div style={{ fontSize: 10.5, color: "#64748b", whiteSpace: "nowrap" }}>
              {e.start} – {e.current ? t.present : (e.end ?? "")}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: accent, fontWeight: 600, marginBottom: 4 }}>
            {ie({ value: e.company, path: `experience.${e.id}.company` })}
            {e.city && <span style={{ color: "#64748b", fontWeight: 400 }}> · {e.city}</span>}
          </div>
          <ul style={{ margin: 0, paddingInlineStart: 16, color: "#374151", fontSize: 11, lineHeight: 1.65 }}>
            {e.bullets.map((b, i) => (
              <li key={i}>
                {ie({ value: b, path: `experience.${e.id}.bullets.${i}`, block: true })}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );

  if (sec === "education") return (
    <>
      <SH title={t.education} accent={accent} rtl={rtl} />
      {cv.education.map((ed) => (
        <div key={ed.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>
              {ie({ value: ed.degree, path: `education.${ed.id}.degree` })}
            </div>
            <div style={{ fontSize: 10.5, color: "#64748b" }}>{ed.start} – {ed.end}</div>
          </div>
          <div style={{ fontSize: 11, color: accent, fontWeight: 600 }}>
            {ie({ value: ed.school, path: `education.${ed.id}.school` })}
            {ed.city && <span style={{ color: "#64748b", fontWeight: 400 }}> · {ed.city}</span>}
          </div>
          {(ed as { detail?: string }).detail && (
            <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
              {(ed as { detail?: string }).detail}
            </div>
          )}
        </div>
      ))}
    </>
  );

  if (sec === "projects") return (
    <>
      <SH title={t.projects} accent={accent} rtl={rtl} />
      {cv.projects.map((p) => (
        <div key={p.id} style={{ marginBottom: 8, fontSize: 11 }}>
          <span style={{ fontWeight: 700 }}>
            {ie({ value: p.name, path: `projects.${p.id}.name` })}
          </span>
          {p.role && <span style={{ color: "#64748b" }}> — {p.role}. </span>}
          <span style={{ color: "#374151" }}>
            {ie({ value: p.detail, path: `projects.${p.id}.detail` })}
          </span>
        </div>
      ))}
    </>
  );

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SidebarSection — used by Corso (light-on-dark sidebar)
// Renders: skills, languages, certifications, interests
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarSectionProps {
  sec:      SectionId;
  cv:       CVData;
  lang:     Lang;
  onUpdate: (path: string, value: unknown) => void;
  readOnly?: boolean;
}

export function SidebarSection({ sec, cv, lang, onUpdate, readOnly }: SidebarSectionProps) {
  const t  = I18N[lang];
  const ie = (p: Omit<IEProps, "onChange"> & { path: string }) => (
    <IE {...p} onChange={(v) => onUpdate(p.path, v)} readOnly={readOnly} />
  );

  const head = (label: string) => (
    <div style={{
      fontSize:      10.5,
      fontWeight:    700,
      letterSpacing: ".16em",
      textTransform: "uppercase",
      opacity:       0.7,
      margin:        "20px 0 8px",
    }}>
      {label}
    </div>
  );

  if (sec === "skills") return (
    <>
      {head(t.skills)}
      {cv.skills.map((g) => (
        <div key={g.id} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.9, marginBottom: 3 }}>
            {ie({ value: g.group, path: `skills.${g.id}.group` })}
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.85, lineHeight: 1.7 }}>
            {g.items.join(" · ")}
          </div>
        </div>
      ))}
    </>
  );

  if (sec === "languages") return (
    <>
      {head(t.languages)}
      {cv.languages.map((l) => (
        <div key={l.id} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>
              {ie({ value: l.name, path: `languages.${l.id}.name` })}
            </span>
            <LangDots dots={l.dots} filled="#fff" empty="rgba(255,255,255,.3)" />
          </div>
          <div style={{ fontSize: 10, opacity: 0.7 }}>{l.level}</div>
        </div>
      ))}
    </>
  );

  if (sec === "certifications") return (
    <>
      {head(t.certifications)}
      {cv.certifications.map((c) => (
        <div key={c.id} style={{ fontSize: 10.5, marginBottom: 8, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 600 }}>
            {ie({ value: c.name, path: `certifications.${c.id}.name` })}
          </div>
          <div style={{ opacity: 0.7 }}>{c.issuer}{c.year ? ` · ${c.year}` : ""}</div>
        </div>
      ))}
    </>
  );

  if (sec === "interests") return (
    <>
      {head(t.interests)}
      <div style={{ fontSize: 10.5, opacity: 0.85, lineHeight: 1.7 }}>
        {cv.interests.join(" · ")}
      </div>
    </>
  );

  return null;
}
