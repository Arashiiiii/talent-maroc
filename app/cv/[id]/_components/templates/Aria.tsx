/**
 * Aria — minimal two-column grid layout.
 * Left label column (140 px) / right content column. No colour blocks.
 * Very clean, lots of white space.
 */

import { IE } from "../InlineEditable";
import { I18N } from "../../../_lib/i18n";
import { rtlDir, cvFont } from "./_shared";
import { A4_W, A4_H, type TemplateProps } from "./index";
import type { SectionId, CVData, Lang } from "../../../_lib/schema";

interface RowProps {
  left:  React.ReactNode;
  right: React.ReactNode;
}
function Row({ left, right }: RowProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 24, marginBottom: 14 }}>
      <div style={{ fontSize: 10.5, color: "#94a3b8", paddingTop: 1 }}>{left}</div>
      <div>{right}</div>
    </div>
  );
}

function ColHead({ title, accent }: { title: string; accent: string }) {
  return (
    <div style={{
      display:             "grid",
      gridTemplateColumns: "140px 1fr",
      gap:                 24,
      marginBottom:        4,
      marginTop:           24,
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: "#0f172a", textTransform: "uppercase", letterSpacing: ".14em" }}>
        {title}
      </div>
      <div style={{ height: 1, background: `${accent}44`, alignSelf: "center" }} />
    </div>
  );
}

export function Aria({ cv, accent, lang, order, enabled, onUpdate, readOnly }: TemplateProps) {
  const t       = I18N[lang];
  const dir     = rtlDir(lang);
  const visible = order.filter((s) => enabled[s] !== false);

  const ie = (value: string, path: string, block?: boolean) => (
    <IE value={value} onChange={(v) => onUpdate(path, v)} block={block} readOnly={readOnly} />
  );

  const renderSection = (sec: SectionId) => {
    if (sec === "summary") return (
      <Row key={sec}
        left=""
        right={<p style={{ margin: 0, fontSize: 11.5, color: "#374151" }}>{ie(cv.summary, "summary", true)}</p>}
      />
    );

    if (sec === "experience") return (
      <div key={sec}>
        <ColHead title={t.experience} accent={accent} />
        {cv.experience.map((e) => (
          <Row key={e.id}
            left={`${e.start} – ${e.current ? t.present : (e.end ?? "")}`}
            right={
              <>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                  {ie(e.role, `experience.${e.id}.role`)}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                  {ie(e.company, `experience.${e.id}.company`)}
                  {e.city && ` · ${e.city}`}
                </div>
                <ul style={{ margin: 0, paddingLeft: 14, fontSize: 11, color: "#374151", lineHeight: 1.65 }}>
                  {e.bullets.map((b, i) => (
                    <li key={i}>{ie(b, `experience.${e.id}.bullets.${i}`, true)}</li>
                  ))}
                </ul>
              </>
            }
          />
        ))}
      </div>
    );

    if (sec === "education") return (
      <div key={sec}>
        <ColHead title={t.education} accent={accent} />
        {cv.education.map((ed) => (
          <Row key={ed.id}
            left={`${ed.start} – ${ed.end}`}
            right={
              <>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {ie(ed.degree, `education.${ed.id}.degree`)}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {ie(ed.school, `education.${ed.id}.school`)}
                  {ed.city && ` · ${ed.city}`}
                </div>
                {ed.detail && <div style={{ fontSize: 10.5, color: "#475569", marginTop: 2 }}>{ed.detail}</div>}
              </>
            }
          />
        ))}
      </div>
    );

    if (sec === "skills") return (
      <div key={sec}>
        <ColHead title={t.skills} accent={accent} />
        {cv.skills.map((g) => (
          <Row key={g.id}
            left={g.group}
            right={<div style={{ fontSize: 11, color: "#374151" }}>{g.items.join(" · ")}</div>}
          />
        ))}
      </div>
    );

    if (sec === "languages") return (
      <div key={sec}>
        <ColHead title={t.languages} accent={accent} />
        {cv.languages.map((l) => (
          <Row key={l.id}
            left={l.name}
            right={<div style={{ fontSize: 11, color: "#374151" }}>{l.level}</div>}
          />
        ))}
      </div>
    );

    if (sec === "certifications") return (
      <div key={sec}>
        <ColHead title={t.certifications} accent={accent} />
        {cv.certifications.map((c) => (
          <Row key={c.id}
            left={c.year ?? ""}
            right={
              <div style={{ fontSize: 11 }}>
                <b>{ie(c.name, `certifications.${c.id}.name`)}</b>
                {c.issuer && <span style={{ color: "#64748b" }}> · {c.issuer}</span>}
              </div>
            }
          />
        ))}
      </div>
    );

    if (sec === "projects") return (
      <div key={sec}>
        <ColHead title={t.projects} accent={accent} />
        {cv.projects.map((p) => (
          <Row key={p.id}
            left={p.role ?? ""}
            right={
              <div style={{ fontSize: 11 }}>
                <b>{ie(p.name, `projects.${p.id}.name`)}</b>. {ie(p.detail, `projects.${p.id}.detail`)}
              </div>
            }
          />
        ))}
      </div>
    );

    if (sec === "interests") return (
      <Row key={sec}
        left={t.interests}
        right={<div style={{ fontSize: 11, color: "#374151" }}>{cv.interests.join(" · ")}</div>}
      />
    );

    return null;
  };

  return (
    <div dir={dir} style={{
      width:      A4_W, minHeight: A4_H,
      padding:    "56px 64px",
      background: "#fff",
      fontFamily: cvFont(lang),
      color:      "#0f172a",
      fontSize:   11, lineHeight: 1.6,
    }}>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "end", gap: 16, marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 6 }}>
            Curriculum vitae
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 300, margin: 0, letterSpacing: "-.02em", lineHeight: 1.05, color: "#0f172a" }}>
            {ie(cv.profile.firstName, "profile.firstName")}
            {" "}
            <span style={{ fontWeight: 600 }}>{ie(cv.profile.lastName, "profile.lastName")}</span>
          </h1>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 5 }}>
            {ie(cv.profile.title, "profile.title")}
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: "#475569", textAlign: "end", lineHeight: 1.7 }}>
          <div>{ie(cv.profile.email, "profile.email")}</div>
          <div>{ie(cv.profile.phone, "profile.phone")}</div>
          <div>{ie(cv.profile.city,  "profile.city")}</div>
          {cv.profile.linkedin && <div>{ie(cv.profile.linkedin, "profile.linkedin")}</div>}
        </div>
      </div>

      {visible.map(renderSection)}
    </div>
  );
}
