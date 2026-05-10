/**
 * Helix — left vertical rail with date pills; experience entries branch right.
 */
import { IE } from "../InlineEditable";
import { initials, rtlDir, cvFont } from "./_shared";
import { I18N } from "../../../_lib/i18n";
import { A4_W, A4_H, type TemplateProps } from "./index";
import type { SectionId } from "../../../_lib/schema";

export function Helix({ cv, accent, lang, order, enabled, onUpdate, readOnly }: TemplateProps) {
  const t = I18N[lang];
  const dir = rtlDir(lang);
  const visible = order.filter((s) => enabled[s] !== false);

  const ie = (value: string, path: string, block?: boolean) => (
    <IE value={value} onChange={(v) => onUpdate(path, v)} block={block} readOnly={readOnly} />
  );

  const Title = ({ children }: { children: React.ReactNode }) => (
    <h2 style={{
      margin: "0 0 12px", fontSize: 13, fontWeight: 800, letterSpacing: 2,
      textTransform: "uppercase", color: accent,
    }}>{children}</h2>
  );

  const Rail = ({ children }: { children: React.ReactNode }) => (
    <div style={{ position: "relative", paddingInlineStart: 24, marginBottom: 22 }}>
      <span style={{
        position: "absolute", insetInlineStart: 6, top: 6, bottom: 0, width: 2,
        background: `repeating-linear-gradient(to bottom, ${accent} 0 4px, transparent 4px 8px)`,
      }} />
      {children}
    </div>
  );

  const Dot = () => (
    <span style={{
      position: "absolute", insetInlineStart: 0, top: 4, width: 14, height: 14,
      borderRadius: "50%", background: "#fff", border: `3px solid ${accent}`,
    }} />
  );

  const renderSection = (sec: SectionId) => {
    switch (sec) {
      case "summary":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <Title>{t.summary}</Title>
            <p style={{ margin: 0, color: "#374151" }}>{ie(cv.summary, "summary", true)}</p>
          </section>
        );
      case "experience":
        return (
          <section key={sec}>
            <Title>{t.experience}</Title>
            {cv.experience.map((e, i) => (
              <div key={e.id} style={{ position: "relative", paddingInlineStart: 24, marginBottom: 16 }}>
                <Dot />
                <div style={{
                  display: "inline-block", padding: "1px 8px", borderRadius: 3,
                  background: accent, color: "#fff", fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, marginBottom: 4,
                }}>
                  {ie(e.start, `experience.${i}.start`)} – {e.current ? t.present : ie(e.end ?? "", `experience.${i}.end`)}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111" }}>
                  {ie(e.role, `experience.${i}.role`)} · <span style={{ color: accent }}>{ie(e.company, `experience.${i}.company`)}</span>
                </div>
                {e.city && <div style={{ fontSize: 10.5, color: "#6b7280" }}>{ie(e.city, `experience.${i}.city`)}</div>}
                <ul style={{ margin: "6px 0 0", paddingInlineStart: 16, fontSize: 11, color: "#374151" }}>
                  {e.bullets.map((b, j) => <li key={j}>{ie(b, `experience.${i}.bullets.${j}`)}</li>)}
                </ul>
              </div>
            ))}
          </section>
        );
      case "education":
        return (
          <section key={sec} style={{ marginTop: 6 }}>
            <Title>{t.education}</Title>
            {cv.education.map((ed, i) => (
              <div key={ed.id} style={{ position: "relative", paddingInlineStart: 24, marginBottom: 10 }}>
                <Dot />
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  {ie(ed.degree, `education.${i}.degree`)}
                </div>
                <div style={{ fontSize: 11, color: accent }}>
                  {ie(ed.school, `education.${i}.school`)} · {ie(ed.start, `education.${i}.start`)} – {ie(ed.end, `education.${i}.end`)}
                </div>
              </div>
            ))}
          </section>
        );
      case "skills":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <Title>{t.skills}</Title>
            {cv.skills.map((g, i) => (
              <div key={g.id} style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: "#111" }}>{ie(g.group, `skills.${i}.group`)}: </span>
                <span style={{ color: "#374151" }}>
                  {g.items.map((it, j) => (
                    <span key={j}>{ie(it, `skills.${i}.items.${j}`)}{j < g.items.length - 1 ? " · " : ""}</span>
                  ))}
                </span>
              </div>
            ))}
          </section>
        );
      case "languages":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <Title>{t.languages}</Title>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
              {cv.languages.map((l, i) => (
                <span key={l.id}>
                  <strong>{ie(l.name, `languages.${i}.name`)}</strong>{" — "}
                  <span style={{ color: accent }}>{ie(l.level, `languages.${i}.level`)}</span>
                </span>
              ))}
            </div>
          </section>
        );
      case "certifications":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <Title>{t.certifications}</Title>
            {cv.certifications.map((c, i) => (
              <div key={c.id} style={{ marginBottom: 4 }}>
                <strong>{ie(c.name, `certifications.${i}.name`)}</strong> ·{" "}
                {ie(c.issuer ?? "", `certifications.${i}.issuer`)} ·{" "}
                <span style={{ color: accent }}>{ie(c.year ?? "", `certifications.${i}.year`)}</span>
              </div>
            ))}
          </section>
        );
      case "projects":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <Title>{t.projects}</Title>
            {cv.projects.map((p, i) => (
              <div key={p.id} style={{ marginBottom: 8 }}>
                <strong>{ie(p.name, `projects.${i}.name`)}</strong>{" — "}
                <span style={{ color: accent }}>{ie(p.role, `projects.${i}.role`)}</span>
                <div style={{ color: "#374151" }}>{ie(p.detail, `projects.${i}.detail`, true)}</div>
              </div>
            ))}
          </section>
        );
      case "interests":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <Title>{t.interests}</Title>
            <div style={{ color: "#374151" }}>
              {cv.interests.map((it, i) => (
                <span key={i}>{ie(it, `interests.${i}`)}{i < cv.interests.length - 1 ? " · " : ""}</span>
              ))}
            </div>
          </section>
        );
      default: return null;
    }
  };

  return (
    <div dir={dir} style={{
      width: A4_W, minHeight: A4_H, background: "#fff",
      fontFamily: cvFont(lang), color: "#111", fontSize: 11.5, lineHeight: 1.6,
      padding: "48px 56px",
    }}>
      <header style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
        <div style={{
          width: 84, height: 84, borderRadius: "50%", background: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: 28, overflow: "hidden",
        }}>
          {cv.profile.photo
            ? <img src={cv.profile.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : initials(cv)}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>
            {ie(cv.profile.firstName, "profile.firstName")} {ie(cv.profile.lastName, "profile.lastName")}
          </h1>
          <div style={{ fontSize: 12, color: accent, fontWeight: 600, marginTop: 2 }}>
            {ie(cv.profile.title, "profile.title")}
          </div>
          <div style={{ fontSize: 10.5, color: "#6b7280", marginTop: 4 }}>
            {ie(cv.profile.email, "profile.email")} · {ie(cv.profile.phone, "profile.phone")} · {ie(cv.profile.city, "profile.city")}
          </div>
        </div>
      </header>

      {visible.map(renderSection)}
    </div>
  );
}
