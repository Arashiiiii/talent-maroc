/**
 * Dahab — executive prestige.
 * Dark gradient header band (accent → deep purple) with photo.
 * Two-column body: 66% main left / 34% sidebar right.
 * Reuses MainSection from _shared.
 */

import { IE } from "../InlineEditable";
import { initials, MainSection, rtlDir, cvFont } from "./_shared";
import { I18N } from "../../../_lib/i18n";
import { A4_W, A4_H, type TemplateProps } from "./index";

const SIDEBAR_SECTIONS = ["skills", "languages", "certifications", "interests"] as const;
const MAIN_SECTIONS    = ["summary", "experience", "education", "projects"] as const;

export function Dahab({ cv, accent, lang, order, enabled, onUpdate, readOnly }: TemplateProps) {
  const t   = I18N[lang];
  const dir = rtlDir(lang);

  const sidebar = order.filter(
    (s) => enabled[s] !== false && (SIDEBAR_SECTIONS as readonly string[]).includes(s),
  );
  const main = order.filter(
    (s) => enabled[s] !== false && (MAIN_SECTIONS as readonly string[]).includes(s),
  );

  const ie = (value: string, path: string) => (
    <IE value={value} onChange={(v) => onUpdate(path, v)} readOnly={readOnly} />
  );

  const sidebarHead = (label: string) => (
    <div style={{
      fontSize:       10.5, fontWeight: 800, letterSpacing: ".18em",
      color:          accent, textTransform: "uppercase", marginBottom: 8,
    }}>{label}</div>
  );

  const renderSidebarSection = (sec: string) => {
    if (sec === "skills") return (
      <div key={sec} style={{ marginBottom: 18 }}>
        {sidebarHead(t.skills)}
        {cv.skills.map((g) => (
          <div key={g.id} style={{ marginBottom: 8, fontSize: 11 }}>
            <b>{g.group}</b>
            <br />
            <span style={{ color: "#475569" }}>{g.items.join(" · ")}</span>
          </div>
        ))}
      </div>
    );

    if (sec === "languages") return (
      <div key={sec} style={{ marginBottom: 18 }}>
        {sidebarHead(t.languages)}
        {cv.languages.map((l) => (
          <div key={l.id} style={{ fontSize: 11, marginBottom: 4 }}>
            <b>{l.name}</b> – <span style={{ color: "#475569" }}>{l.level}</span>
          </div>
        ))}
      </div>
    );

    if (sec === "certifications") return (
      <div key={sec} style={{ marginBottom: 18 }}>
        {sidebarHead(t.certifications)}
        {cv.certifications.map((c) => (
          <div key={c.id} style={{ fontSize: 11, marginBottom: 4 }}>
            <b>{ie(c.name, `certifications.${c.id}.name`)}</b>
            <br />
            <span style={{ color: "#475569" }}>{c.issuer}{c.year ? ` · ${c.year}` : ""}</span>
          </div>
        ))}
      </div>
    );

    if (sec === "interests") return (
      <div key={sec} style={{ marginBottom: 18 }}>
        {sidebarHead(t.interests)}
        <div style={{ fontSize: 11, color: "#475569" }}>{cv.interests.join(" · ")}</div>
      </div>
    );

    return null;
  };

  return (
    <div dir={dir} style={{ width: A4_W, minHeight: A4_H, background: "#fff", fontFamily: cvFont(lang), color: "#0f172a", fontSize: 11.5 }}>
      {/* ── Dark gradient header ─────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${accent} 0%, #3b1fa3 60%, #5b21b6 100%)`,
        color:      "#fff",
        padding:    "40px 48px 32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* Avatar */}
          <div style={{
            width: 96, height: 96, borderRadius: 14,
            background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.3)",
            overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 800, flexShrink: 0,
          }}>
            {cv.profile.photo
              ? <img src={cv.profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials(cv)
            }
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: "#f97316" }}>
              {t.executive}
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: "4px 0 6px", letterSpacing: "-.01em" }}>
              {ie(cv.profile.firstName, "profile.firstName")}
              {" "}
              {ie(cv.profile.lastName,  "profile.lastName")}
            </h1>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              {ie(cv.profile.title, "profile.title")}
            </div>
          </div>
        </div>

        {/* Contact strip */}
        <div style={{ display: "flex", gap: 18, marginTop: 18, fontSize: 10.5, opacity: 0.92, flexWrap: "wrap" }}>
          <span>{ie(cv.profile.email,   "profile.email")}</span>
          <span>{ie(cv.profile.phone,   "profile.phone")}</span>
          <span>{ie(cv.profile.city,    "profile.city")}</span>
          {cv.profile.linkedin && <span>{ie(cv.profile.linkedin, "profile.linkedin")}</span>}
        </div>
      </div>

      {/* ── Body grid ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "66% 34%", padding: "28px 0" }}>
        {/* Main column */}
        <div style={{ paddingInlineStart: 48, paddingInlineEnd: 36 }}>
          {main.map((sec) => (
            <MainSection key={sec} sec={sec} cv={cv} accent={accent} lang={lang} onUpdate={onUpdate} readOnly={readOnly} />
          ))}
        </div>

        {/* Sidebar — borderInlineStart flips to the correct side in RTL */}
        <div style={{ paddingInlineStart: 24, paddingInlineEnd: 48, borderInlineStart: "1px solid #e5e7eb" }}>
          {sidebar.map(renderSidebarSection)}
        </div>
      </div>
    </div>
  );
}
