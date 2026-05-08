/**
 * Corso — sidebar layout.
 * Left 34%: coloured sidebar (accent bg), photo, contact, skills/lang/certs/interests
 * Right 66%: white main column — summary, experience, education, projects
 */

import { IE } from "../InlineEditable";
import { initials, SidebarSection, MainSection, rtlDir, cvFont } from "./_shared";
import { I18N } from "../../../_lib/i18n";
import { A4_W, A4_H, type TemplateProps } from "./index";

const SIDEBAR_SECTIONS = ["skills", "languages", "certifications", "interests"] as const;
const MAIN_SECTIONS    = ["summary", "experience", "education", "projects"] as const;

export function Corso({ cv, accent, lang, order, enabled, onUpdate, readOnly }: TemplateProps) {
  const t   = I18N[lang];
  const dir = rtlDir(lang);

  const sidebar = order.filter(
    (s) => enabled[s] !== false && (SIDEBAR_SECTIONS as readonly string[]).includes(s),
  );
  const main = order.filter(
    (s) => enabled[s] !== false && (MAIN_SECTIONS as readonly string[]).includes(s),
  );

  const ie = (value: string, path: string, block?: boolean) => (
    <IE value={value} onChange={(v) => onUpdate(path, v)} block={block} readOnly={readOnly} />
  );

  return (
    <div dir={dir} style={{
      width:               A4_W,
      minHeight:           A4_H,
      display:             "grid",
      gridTemplateColumns: "34% 66%",
      fontFamily:          cvFont(lang),
      color:               "#0f172a",
      fontSize:            11.5,
      lineHeight:          1.55,
    }}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div style={{ background: accent, color: "#fff", padding: "40px 22px 36px" }}>
        {/* Avatar */}
        <div style={{
          width:         100, height:       100,
          borderRadius:  "50%",
          background:    "rgba(255,255,255,.18)",
          border:        "2px solid rgba(255,255,255,.4)",
          overflow:      "hidden",
          display:       "flex", alignItems: "center", justifyContent: "center",
          fontSize:      36, fontWeight: 800,
          marginBottom:  20,
          flexShrink:    0,
        }}>
          {cv.profile.photo
            ? <img src={cv.profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials(cv)
          }
        </div>

        {/* Contact */}
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", opacity: 0.7, marginBottom: 8 }}>
          {t.contact}
        </div>
        <div style={{ fontSize: 10.5, opacity: 0.92, lineHeight: 1.85 }}>
          <div>{ie(cv.profile.email,   "profile.email")}</div>
          <div>{ie(cv.profile.phone,   "profile.phone")}</div>
          <div>{ie(cv.profile.city,    "profile.city")}</div>
          {cv.profile.linkedin && <div>{ie(cv.profile.linkedin, "profile.linkedin")}</div>}
          {cv.profile.website  && <div>{ie(cv.profile.website,  "profile.website")}</div>}
        </div>

        {/* Dynamic sidebar sections */}
        {sidebar.map((sec) => (
          <SidebarSection key={sec} sec={sec} cv={cv} lang={lang} onUpdate={onUpdate} readOnly={readOnly} />
        ))}
      </div>

      {/* ── Main column ──────────────────────────────────────────────────── */}
      <div style={{ padding: "40px 34px 36px", background: "#fff" }}>
        {/* Name / Title */}
        <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: 14, marginBottom: 6 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: "-.01em", lineHeight: 1.05 }}>
            {ie(cv.profile.firstName, "profile.firstName")}
            {" "}
            <span style={{ color: accent }}>{ie(cv.profile.lastName, "profile.lastName")}</span>
          </h1>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 6, fontWeight: 500 }}>
            {ie(cv.profile.title, "profile.title")}
          </div>
        </div>

        {/* Sections */}
        {main.map((sec) => (
          <MainSection key={sec} sec={sec} cv={cv} accent={accent} lang={lang} onUpdate={onUpdate} readOnly={readOnly} />
        ))}
      </div>
    </div>
  );
}
