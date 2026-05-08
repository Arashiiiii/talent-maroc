/**
 * Meridian — classic centered editorial.
 * Serif typeset, centered header, full-width sections with "— TITLE —" dividers.
 */

import { IE } from "../InlineEditable";
import { I18N } from "../../../_lib/i18n";
import { rtlDir, cvFont } from "./_shared";
import { A4_W, A4_H, type TemplateProps } from "./index";
import type { SectionId } from "../../../_lib/schema";

export function Meridian({ cv, accent, lang, order, enabled, onUpdate, readOnly }: TemplateProps) {
  const t       = I18N[lang];
  const dir     = rtlDir(lang);
  const visible = order.filter((s) => enabled[s] !== false);

  const ie = (value: string, path: string, block?: boolean) => (
    <IE value={value} onChange={(v) => onUpdate(path, v)} block={block} readOnly={readOnly} />
  );

  const H = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      fontSize:       11, fontWeight: 700, letterSpacing: ".22em",
      textTransform:  "uppercase", color: accent, textAlign: "center",
      margin:         "22px 0 12px",
    }}>
      — {children} —
    </div>
  );

  const renderSection = (sec: SectionId) => {
    if (sec === "summary") return (
      <div key={sec}>
        <H>{t.summary}</H>
        <p style={{ textAlign: "center", fontStyle: "italic", color: "#374151", maxWidth: 560, margin: "0 auto", fontSize: 11.5 }}>
          {ie(cv.summary, "summary", true)}
        </p>
      </div>
    );

    if (sec === "experience") return (
      <div key={sec}>
        <H>{t.experience}</H>
        {cv.experience.map((e) => (
          <div key={e.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {ie(e.role, `experience.${e.id}.role`)}
                {", "}
                <span style={{ fontStyle: "italic", fontWeight: 500 }}>
                  {ie(e.company, `experience.${e.id}.company`)}
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: "#666" }}>
                {e.start} – {e.current ? t.present : (e.end ?? "")}
              </div>
            </div>
            {e.city && <div style={{ fontSize: 10.5, color: "#666", fontStyle: "italic" }}>{e.city}</div>}
            <ul style={{ margin: "5px 0 0", paddingLeft: 18, fontSize: 11 }}>
              {e.bullets.map((b, i) => (
                <li key={i}>{ie(b, `experience.${e.id}.bullets.${i}`, true)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );

    if (sec === "education") return (
      <div key={sec}>
        <H>{t.education}</H>
        {cv.education.map((ed) => (
          <div key={ed.id} style={{ marginBottom: 8, textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>
              {ie(ed.degree, `education.${ed.id}.degree`)}
            </div>
            <div style={{ fontSize: 11, fontStyle: "italic", color: "#555" }}>
              {ie(ed.school, `education.${ed.id}.school`)}
              {ed.city ? ` – ${ed.city}` : ""} – {ed.start}–{ed.end}
            </div>
            {ed.detail && <div style={{ fontSize: 10.5, color: "#666" }}>{ed.detail}</div>}
          </div>
        ))}
      </div>
    );

    if (sec === "skills") return (
      <div key={sec}>
        <H>{t.skills}</H>
        <div style={{ textAlign: "center", fontSize: 11.5, color: "#374151" }}>
          {cv.skills.flatMap((g) => g.items).join(" · ")}
        </div>
      </div>
    );

    if (sec === "languages") return (
      <div key={sec}>
        <H>{t.languages}</H>
        <div style={{ textAlign: "center", fontSize: 11.5 }}>
          {cv.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}
        </div>
      </div>
    );

    if (sec === "certifications") return (
      <div key={sec}>
        <H>{t.certifications}</H>
        {cv.certifications.map((c) => (
          <div key={c.id} style={{ textAlign: "center", fontSize: 11 }}>
            <b>{ie(c.name, `certifications.${c.id}.name`)}</b>
            {c.issuer ? ` – ${c.issuer}` : ""}{c.year ? `, ${c.year}` : ""}
          </div>
        ))}
      </div>
    );

    if (sec === "projects") return (
      <div key={sec}>
        <H>{t.projects}</H>
        {cv.projects.map((p) => (
          <div key={p.id} style={{ textAlign: "center", fontSize: 11, marginBottom: 4 }}>
            <b>{ie(p.name, `projects.${p.id}.name`)}</b>
            {p.role && <> – <i>{p.role}</i></>}.{" "}
            {ie(p.detail, `projects.${p.id}.detail`)}
          </div>
        ))}
      </div>
    );

    if (sec === "interests") return (
      <div key={sec}>
        <H>{t.interests}</H>
        <div style={{ textAlign: "center", fontSize: 11, color: "#374151" }}>
          {cv.interests.join(" · ")}
        </div>
      </div>
    );

    return null;
  };

  return (
    <div dir={dir} style={{
      width:      A4_W, minHeight: A4_H,
      padding:    "52px 64px",
      background: "#fff",
      fontFamily: lang === "ar" ? cvFont(lang) : "'Georgia', 'Times New Roman', serif",
      color:      "#1c1c1c",
      fontSize:   11.5, lineHeight: 1.6,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", borderBottom: `1px solid ${accent}`, paddingBottom: 18, marginBottom: 22 }}>
        <h1 style={{ fontSize: 34, fontWeight: 400, margin: 0, letterSpacing: ".06em", textTransform: "uppercase" }}>
          {ie(cv.profile.firstName, "profile.firstName")}
          {" "}
          {ie(cv.profile.lastName,  "profile.lastName")}
        </h1>
        <div style={{ fontSize: 12, color: accent, fontStyle: "italic", marginTop: 6, letterSpacing: ".04em" }}>
          {ie(cv.profile.title, "profile.title")}
        </div>
        <div style={{ fontSize: 10.5, color: "#555", marginTop: 10, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <span>{ie(cv.profile.email, "profile.email")}</span>
          <span>·</span>
          <span>{ie(cv.profile.phone, "profile.phone")}</span>
          <span>·</span>
          <span>{ie(cv.profile.city,  "profile.city")}</span>
          {cv.profile.linkedin && <><span>·</span><span>{ie(cv.profile.linkedin, "profile.linkedin")}</span></>}
        </div>
      </div>

      {visible.map(renderSection)}
    </div>
  );
}
