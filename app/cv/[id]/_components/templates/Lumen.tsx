/**
 * Lumen — soft tinted top banner, two-column body, photo in banner.
 */
import { IE } from "../InlineEditable";
import {
  initials, rtlDir, cvFont, MainSection, SidebarSection,
} from "./_shared";
import { I18N } from "../../../_lib/i18n";
import { A4_W, A4_H, type TemplateProps } from "./index";
import type { SectionId } from "../../../_lib/schema";

const SIDEBAR: SectionId[] = ["skills", "languages", "certifications", "interests"];
const MAIN: SectionId[]    = ["summary", "experience", "education", "projects"];

export function Lumen({ cv, accent, lang, order, enabled, onUpdate, readOnly }: TemplateProps) {
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
      fontFamily: cvFont(lang), color: "#1f2937", fontSize: 11.5, lineHeight: 1.6,
    }}>
      {/* Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
        padding: "36px 48px", display: "flex", alignItems: "center", gap: 24,
        borderBottom: `3px solid ${accent}`,
      }}>
        <div style={{
          width: 100, height: 100, borderRadius: "50%", background: "#fff",
          border: `3px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center",
          color: accent, fontWeight: 800, fontSize: 32, overflow: "hidden", flexShrink: 0,
        }}>
          {cv.profile.photo
            ? <img src={cv.profile.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : initials(cv)}
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#0f172a" }}>
            {ie(cv.profile.firstName, "profile.firstName")} {ie(cv.profile.lastName, "profile.lastName")}
          </h1>
          <div style={{ marginTop: 4, fontSize: 13, color: accent, fontWeight: 600 }}>
            {ie(cv.profile.title, "profile.title")}
          </div>
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 10.5, color: "#475569" }}>
            <span>{ie(cv.profile.email, "profile.email")}</span>
            <span>·</span><span>{ie(cv.profile.phone, "profile.phone")}</span>
            <span>·</span><span>{ie(cv.profile.city, "profile.city")}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 32, padding: "32px 48px" }}>
        <div>
          {main.map((sec) => (
            <MainSection key={sec} sec={sec} cv={cv} accent={accent} lang={lang} onUpdate={onUpdate} readOnly={readOnly} />
          ))}
        </div>
        <div style={{ display: "grid", gap: 18 }}>
          {sidebar.map((sec) => (
            <SidebarSection key={sec} sec={sec} cv={cv} lang={lang} onUpdate={onUpdate} readOnly={readOnly} />
          ))}
        </div>
      </div>
    </div>
  );
}
