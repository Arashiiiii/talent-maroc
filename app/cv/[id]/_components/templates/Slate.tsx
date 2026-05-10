/**
 * Slate — Swiss-style minimal grid, monospace metadata, ultra-clean.
 */
import { IE } from "../InlineEditable";
import { initials, rtlDir, cvFont } from "./_shared";
import { I18N } from "../../../_lib/i18n";
import { A4_W, A4_H, type TemplateProps } from "./index";
import type { SectionId } from "../../../_lib/schema";

const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";

export function Slate({ cv, accent, lang, order, enabled, onUpdate, readOnly }: TemplateProps) {
  const t = I18N[lang];
  const dir = rtlDir(lang);
  const visible = order.filter((s) => enabled[s] !== false);

  const ie = (value: string, path: string, block?: boolean) => (
    <IE value={value} onChange={(v) => onUpdate(path, v)} block={block} readOnly={readOnly} />
  );

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 24, padding: "14px 0", borderTop: "1px solid #e5e7eb" }}>
      <div style={{
        fontFamily: MONO, fontSize: 10, color: accent, textTransform: "uppercase",
        letterSpacing: 1, paddingTop: 2,
      }}>{label}</div>
      <div>{children}</div>
    </div>
  );

  const renderSection = (sec: SectionId) => {
    switch (sec) {
      case "summary":
        return <Row key={sec} label={t.summary}>
          <p style={{ margin: 0, color: "#374151" }}>{ie(cv.summary, "summary", true)}</p>
        </Row>;
      case "experience":
        return <Row key={sec} label={t.experience}>
          {cv.experience.map((e, i) => (
            <div key={e.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong style={{ fontSize: 12 }}>
                  {ie(e.role, `experience.${i}.role`)}, {ie(e.company, `experience.${i}.company`)}
                </strong>
                <span style={{ fontFamily: MONO, fontSize: 10, color: "#6b7280", whiteSpace: "nowrap" }}>
                  {ie(e.start, `experience.${i}.start`)}—{e.current ? t.present : ie(e.end ?? "", `experience.${i}.end`)}
                </span>
              </div>
              <ul style={{ margin: "4px 0 0", paddingInlineStart: 16, color: "#374151", fontSize: 11 }}>
                {e.bullets.map((b, j) => <li key={j}>{ie(b, `experience.${i}.bullets.${j}`)}</li>)}
              </ul>
            </div>
          ))}
        </Row>;
      case "education":
        return <Row key={sec} label={t.education}>
          {cv.education.map((ed, i) => (
            <div key={ed.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span><strong>{ie(ed.degree, `education.${i}.degree`)}</strong>, {ie(ed.school, `education.${i}.school`)}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: "#6b7280" }}>
                {ie(ed.start, `education.${i}.start`)}—{ie(ed.end, `education.${i}.end`)}
              </span>
            </div>
          ))}
        </Row>;
      case "skills":
        return <Row key={sec} label={t.skills}>
          {cv.skills.map((g, i) => (
            <div key={g.id} style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: "#6b7280" }}>{ie(g.group, `skills.${i}.group`)} → </span>
              {g.items.map((it, j) => <span key={j}>{ie(it, `skills.${i}.items.${j}`)}{j < g.items.length - 1 ? ", " : ""}</span>)}
            </div>
          ))}
        </Row>;
      case "languages":
        return <Row key={sec} label={t.languages}>
          {cv.languages.map((l, i) => (
            <div key={l.id}>
              <strong>{ie(l.name, `languages.${i}.name`)}</strong>{" — "}{ie(l.level, `languages.${i}.level`)}
            </div>
          ))}
        </Row>;
      case "certifications":
        return <Row key={sec} label={t.certifications}>
          {cv.certifications.map((c, i) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between" }}>
              <span><strong>{ie(c.name, `certifications.${i}.name`)}</strong>, {ie(c.issuer, `certifications.${i}.issuer`)}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: "#6b7280" }}>{ie(c.year, `certifications.${i}.year`)}</span>
            </div>
          ))}
        </Row>;
      case "projects":
        return <Row key={sec} label={t.projects}>
          {cv.projects.map((p, i) => (
            <div key={p.id} style={{ marginBottom: 8 }}>
              <strong>{ie(p.name, `projects.${i}.name`)}</strong> — <em>{ie(p.role, `projects.${i}.role`)}</em>
              <div style={{ color: "#374151" }}>{ie(p.detail, `projects.${i}.detail`, true)}</div>
            </div>
          ))}
        </Row>;
      case "interests":
        return <Row key={sec} label={t.interests}>
          {cv.interests.map((it, i) => <span key={i}>{ie(it, `interests.${i}`)}{i < cv.interests.length - 1 ? " · " : ""}</span>)}
        </Row>;
      default: return null;
    }
  };

  return (
    <div dir={dir} style={{
      width: A4_W, minHeight: A4_H, background: "#fff",
      fontFamily: cvFont(lang), color: "#111", fontSize: 11, lineHeight: 1.55,
      padding: "56px 64px",
    }}>
      <header style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: accent, textTransform: "uppercase", letterSpacing: 2 }}>
            ⎯ {ie(cv.profile.title, "profile.title")}
          </div>
          <h1 style={{ margin: "8px 0 0", fontSize: 38, fontWeight: 700, letterSpacing: -0.5 }}>
            {ie(cv.profile.firstName, "profile.firstName")} {ie(cv.profile.lastName, "profile.lastName")}
          </h1>
          <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 10, color: "#6b7280" }}>
            {ie(cv.profile.email, "profile.email")} / {ie(cv.profile.phone, "profile.phone")} / {ie(cv.profile.city, "profile.city")}
          </div>
        </div>
        {cv.profile.photo
          ? <img src={cv.profile.photo} alt="" style={{ width: 72, height: 72, objectFit: "cover" }} />
          : <div style={{
              width: 72, height: 72, background: "#f3f4f6", color: accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: MONO, fontWeight: 700, fontSize: 22,
            }}>{initials(cv)}</div>}
      </header>

      {visible.map(renderSection)}
    </div>
  );
}
