/**
 * Medina — creative two-tone.
 * Large stacked first/last names in brand colours, circular photo top-right.
 * Dashed accent border for the contact strip.
 * Reuses MainSection from _shared.
 */

import { IE } from "../InlineEditable";
import { initials, MainSection, rtlDir, cvFont } from "./_shared";
import { I18N } from "../../../_lib/i18n";
import { A4_W, A4_H, type TemplateProps } from "./index";
import type { SectionId } from "../../../_lib/schema";

export function Medina({ cv, accent, lang, order, enabled, onUpdate, readOnly }: TemplateProps) {
  const t       = I18N[lang];
  const dir     = rtlDir(lang);
  const visible = order.filter((s) => enabled[s] !== false);

  const ie = (value: string, path: string, block?: boolean) => (
    <IE value={value} onChange={(v) => onUpdate(path, v)} block={block} readOnly={readOnly} />
  );

  const renderSection = (sec: SectionId) => {
    // Summary, experience, education, projects reuse MainSection
    if (["summary", "experience", "education", "projects"].includes(sec)) {
      return (
        <MainSection key={sec} sec={sec} cv={cv} accent={accent} lang={lang} onUpdate={onUpdate} readOnly={readOnly} />
      );
    }

    // Remaining sections rendered inline here
    if (sec === "skills") return (
      <div key={sec} style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: accent, marginBottom: 10 }}>
          {t.skills}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {cv.skills.flatMap((g) => g.items).map((item, i) => (
            <span key={i} style={{
              fontSize: 10.5, background: `${accent}18`, color: accent,
              border: `1px solid ${accent}44`, borderRadius: 100,
              padding: "3px 10px", fontWeight: 600,
            }}>{item}</span>
          ))}
        </div>
      </div>
    );

    if (sec === "languages") return (
      <div key={sec} style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: accent, marginBottom: 8 }}>
          {t.languages}
        </div>
        {cv.languages.map((l) => (
          <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 5 }}>
            <span style={{ fontWeight: 600 }}>{l.name}</span>
            <span style={{ color: "#57534e" }}>{l.level}</span>
          </div>
        ))}
      </div>
    );

    if (sec === "certifications") return (
      <div key={sec} style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: accent, marginBottom: 8 }}>
          {t.certifications}
        </div>
        {cv.certifications.map((c) => (
          <div key={c.id} style={{ fontSize: 11, marginBottom: 5 }}>
            <b>{ie(c.name, `certifications.${c.id}.name`)}</b>
            {c.issuer && <span style={{ color: "#57534e" }}> · {c.issuer}</span>}
            {c.year   && <span style={{ color: "#57534e" }}>, {c.year}</span>}
          </div>
        ))}
      </div>
    );

    if (sec === "interests") return (
      <div key={sec} style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: accent, marginBottom: 8 }}>
          {t.interests}
        </div>
        <div style={{ fontSize: 11, color: "#57534e" }}>{cv.interests.join(" · ")}</div>
      </div>
    );

    return null;
  };

  return (
    <div dir={dir} style={{
      width:      A4_W, minHeight: A4_H,
      background: "#fffaf5",
      fontFamily: cvFont(lang),
      color:      "#1c1917",
      fontSize:   11.5, lineHeight: 1.6,
      padding:    "48px 56px",
    }}>
      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{
            fontSize: 10.5, fontWeight: 800, color: accent,
            letterSpacing: ".22em", textTransform: "uppercase", marginBottom: 8,
          }}>✦ {t.summary}</div>
          <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0, letterSpacing: "-.02em", lineHeight: 1, color: "#1c1917" }}>
            {ie(cv.profile.firstName, "profile.firstName")}
          </h1>
          <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0, letterSpacing: "-.02em", lineHeight: 1, color: accent }}>
            {ie(cv.profile.lastName, "profile.lastName")}
          </h1>
          <div style={{ fontSize: 14, color: "#57534e", marginTop: 8, fontWeight: 500 }}>
            {ie(cv.profile.title, "profile.title")}
          </div>
        </div>

        {/* Circular avatar */}
        <div style={{
          width: 120, height: 120, borderRadius: "50%",
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, fontWeight: 800, overflow: "hidden", flexShrink: 0,
        }}>
          {cv.profile.photo
            ? <img src={cv.profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials(cv)
          }
        </div>
      </div>

      {/* ── Contact strip ────────────────────────────────────────────────── */}
      <div style={{
        display:        "flex", gap: 16, fontSize: 10.5, color: "#57534e",
        borderTop:      `2px dashed ${accent}66`,
        borderBottom:   `2px dashed ${accent}66`,
        padding:        "10px 0", marginBottom: 24,
        flexWrap:       "wrap",
      }}>
        <span>✉ {ie(cv.profile.email, "profile.email")}</span>
        <span>✆ {ie(cv.profile.phone, "profile.phone")}</span>
        <span>📍 {ie(cv.profile.city,  "profile.city")}</span>
        {cv.profile.website  && <span>🌐 {ie(cv.profile.website,  "profile.website")}</span>}
        {cv.profile.linkedin && <span>🔗 {ie(cv.profile.linkedin, "profile.linkedin")}</span>}
      </div>

      {/* ── Sections ──────────────────────────────────────────────────────── */}
      {visible.map(renderSection)}
    </div>
  );
}
