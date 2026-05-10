/**
 * Atlas — left dark sidebar with photo + contact, light main column.
 */
import { IE } from "../InlineEditable";
import {
  initials, rtlDir, cvFont,
  MainSection, SidebarSection, SH,
} from "./_shared";
import { I18N } from "../../../_lib/i18n";
import { A4_W, A4_H, type TemplateProps } from "./index";
import type { SectionId } from "../../../_lib/schema";

const SIDEBAR: SectionId[] = ["skills", "languages", "certifications", "interests"];
const MAIN: SectionId[]    = ["summary", "experience", "education", "projects"];

export function Atlas({ cv, accent, lang, order, enabled, onUpdate, readOnly }: TemplateProps) {
  const t = I18N[lang];
  const dir = rtlDir(lang);
  const sidebar = order.filter((s) => enabled[s] !== false && SIDEBAR.includes(s));
  const main    = order.filter((s) => enabled[s] !== false && MAIN.includes(s));

  const ie = (value: string, path: string, block?: boolean) => (
    <IE value={value} onChange={(v) => onUpdate(path, v)} block={block} readOnly={readOnly} />
  );

  return (
    <div dir={dir} style={{
      width: A4_W, minHeight: A4_H, background: "#fff",
      fontFamily: cvFont(lang), color: "#111", fontSize: 11,
      display: "grid", gridTemplateColumns: "260px 1fr",
    }}>
      {/* Sidebar */}
      <aside style={{ background: "#0f172a", color: "#e2e8f0", padding: "40px 24px" }}>
        <div style={{
          width: 140, height: 140, borderRadius: "50%", margin: "0 auto 20px",
          background: accent, display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 44, color: "#fff", overflow: "hidden",
          border: `4px solid ${accent}`,
        }}>
          {cv.profile.photo
            ? <img src={cv.profile.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : initials(cv)}
        </div>

        <div style={{ marginBottom: 24 }}>
          <SH title={t.contact} accent={accent} style={{ color: "#fff" }} rtl={dir === "rtl"} />
          <div style={{ display: "grid", gap: 6, fontSize: 10.5, color: "#cbd5e1", marginTop: 8 }}>
            <span>{ie(cv.profile.email, "profile.email")}</span>
            <span>{ie(cv.profile.phone, "profile.phone")}</span>
            <span>{ie(cv.profile.city, "profile.city")}</span>
            {cv.profile.website  && <span>{ie(cv.profile.website,  "profile.website")}</span>}
            {cv.profile.linkedin && <span>{ie(cv.profile.linkedin, "profile.linkedin")}</span>}
          </div>
        </div>

        <div style={{ display: "grid", gap: 18, color: "#e2e8f0" }}>
          {sidebar.map((sec) => (
            <SidebarSection key={sec} sec={sec} cv={cv} lang={lang} onUpdate={onUpdate} readOnly={readOnly} />
          ))}
        </div>
      </aside>

      {/* Main */}
      <div style={{ padding: "44px 40px" }}>
        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: -0.5 }}>
          {ie(cv.profile.firstName, "profile.firstName")}{" "}
          <span style={{ color: accent }}>{ie(cv.profile.lastName, "profile.lastName")}</span>
        </h1>
        <div style={{
          marginTop: 4, fontSize: 13, color: "#475569", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600,
        }}>
          {ie(cv.profile.title, "profile.title")}
        </div>
        <div style={{ height: 2, background: accent, width: 60, margin: "16px 0 24px" }} />

        {main.map((sec) => (
          <MainSection key={sec} sec={sec} cv={cv} accent={accent} lang={lang} onUpdate={onUpdate} readOnly={readOnly} />
        ))}
      </div>
    </div>
  );
}
