/**
 * Vertex — editorial single-column with a left accent rail,
 * oversized name typography, numbered sections and date pills.
 */
import { IE } from "../InlineEditable";
import {
  initials,
  fullName,
  rtlDir,
  cvFont,
  LangDots,
} from "./_shared";
import { I18N } from "../../../_lib/i18n";
import { A4_W, A4_H, type TemplateProps } from "./index";
import type { SectionId } from "../../../_lib/schema";

const LABELS: Record<SectionId, keyof typeof I18N["en"]> = {
  summary: "summary",
  experience: "experience",
  education: "education",
  skills: "skills",
  languages: "languages",
  certifications: "certifications",
  projects: "projects",
  interests: "interests",
};

export function Vertex({
  cv,
  accent,
  lang,
  order,
  enabled,
  onUpdate,
  readOnly,
}: TemplateProps) {
  const t = I18N[lang];
  const dir = rtlDir(lang);
  const visible = order.filter((s) => enabled[s] !== false);

  const ie = (value: string, path: string, block?: boolean) => (
    <IE
      value={value}
      onChange={(v) => onUpdate(path, v)}
      block={block}
      readOnly={readOnly}
    />
  );

  const Pill = ({ children }: { children: React.ReactNode }) => (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        background: accent,
        color: "#fff",
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );

  const SectionTitle = ({
    index,
    label,
  }: {
    index: number;
    label: string;
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 14,
        marginBottom: 14,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: accent,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: 0.5,
        }}
      >
        {String(index).padStart(2, "0")}
      </span>
      <h2
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#0a0a0a",
        }}
      >
        {label}
      </h2>
      <span
        style={{
          flex: 1,
          height: 1,
          background: "#e5e5e5",
          alignSelf: "center",
        }}
      />
    </div>
  );

  const renderSection = (sec: SectionId, index: number) => {
    const title = t[LABELS[sec]] as string;

    switch (sec) {
      case "summary":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <SectionTitle index={index} label={title} />
            <div style={{ fontSize: 11.5, lineHeight: 1.7, color: "#262626" }}>
              {ie(cv.summary, "summary", true)}
            </div>
          </section>
        );

      case "experience":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <SectionTitle index={index} label={title} />
            {cv.experience.map((e, i) => (
              <div key={e.id} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 4,
                  }}
                >
                  <strong style={{ fontSize: 12.5, color: "#0a0a0a" }}>
                    {ie(e.role, `experience.${i}.role`)}
                  </strong>
                  <span style={{ color: "#737373" }}>·</span>
                  <span style={{ fontSize: 11.5, color: accent, fontWeight: 600 }}>
                    {ie(e.company, `experience.${i}.company`)}
                  </span>
                  <span style={{ flex: 1 }} />
                  <Pill>
                    {ie(e.start, `experience.${i}.start`)}
                    {" – "}
                    {e.current
                      ? t.present
                      : ie(e.end ?? "", `experience.${i}.end`)}
                  </Pill>
                </div>
                {e.city && (
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "#737373",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    }}
                  >
                    {ie(e.city, `experience.${i}.city`)}
                  </div>
                )}
                <ul
                  style={{
                    margin: 0,
                    paddingInlineStart: 18,
                    fontSize: 11,
                    lineHeight: 1.65,
                    color: "#262626",
                  }}
                >
                  {e.bullets.map((b, j) => (
                    <li key={j}>{ie(b, `experience.${i}.bullets.${j}`)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );

      case "education":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <SectionTitle index={index} label={title} />
            {cv.education.map((ed, i) => (
              <div
                key={ed.id}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <strong style={{ fontSize: 12, color: "#0a0a0a" }}>
                  {ie(ed.degree, `education.${i}.degree`)}
                </strong>
                <span style={{ color: "#737373" }}>·</span>
                <span style={{ fontSize: 11, color: accent, fontWeight: 600 }}>
                  {ie(ed.school, `education.${i}.school`)}
                </span>
                <span style={{ flex: 1 }} />
                <Pill>
                  {ie(ed.start, `education.${i}.start`)} –{" "}
                  {ie(ed.end, `education.${i}.end`)}
                </Pill>
              </div>
            ))}
          </section>
        );

      case "projects":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <SectionTitle index={index} label={title} />
            {cv.projects.map((p, i) => (
              <div key={p.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <strong style={{ fontSize: 12, color: "#0a0a0a" }}>
                    {ie(p.name, `projects.${i}.name`)}
                  </strong>
                  <span style={{ fontSize: 10.5, color: accent, fontWeight: 600 }}>
                    {ie(p.role, `projects.${i}.role`)}
                  </span>
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.6, color: "#262626" }}>
                  {ie(p.detail, `projects.${i}.detail`, true)}
                </div>
              </div>
            ))}
          </section>
        );

      case "skills":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <SectionTitle index={index} label={title} />
            {cv.skills.map((g, i) => (
              <div key={g.id} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: "#525252",
                    marginBottom: 4,
                  }}
                >
                  {ie(g.group, `skills.${i}.group`)}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {g.items.map((it, j) => (
                    <span
                      key={j}
                      style={{
                        fontSize: 10.5,
                        padding: "3px 9px",
                        border: `1px solid ${accent}`,
                        color: "#0a0a0a",
                        borderRadius: 4,
                      }}
                    >
                      {ie(it, `skills.${i}.items.${j}`)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        );

      case "languages":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <SectionTitle index={index} label={title} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
              {cv.languages.map((l, i) => (
                <div
                  key={l.id}
                  style={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
                  <span style={{ fontSize: 11.5, fontWeight: 600 }}>
                    {ie(l.name, `languages.${i}.name`)}
                  </span>
                  <LangDots dots={l.dots} filled={accent} empty="#e5e5e5" />
                </div>
              ))}
            </div>
          </section>
        );

      case "certifications":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <SectionTitle index={index} label={title} />
            {cv.certifications.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 6,
                }}
              >
                <strong style={{ fontSize: 11.5 }}>
                  {ie(c.name, `certifications.${i}.name`)}
                </strong>
                <span style={{ fontSize: 11, color: "#525252" }}>
                  {ie(c.issuer, `certifications.${i}.issuer`)}
                </span>
                <span style={{ flex: 1 }} />
                <Pill>{ie(c.year, `certifications.${i}.year`)}</Pill>
              </div>
            ))}
          </section>
        );

      case "interests":
        return (
          <section key={sec} style={{ marginBottom: 22 }}>
            <SectionTitle index={index} label={title} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {cv.interests.map((it, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 10.5,
                    padding: "3px 10px",
                    background: "#f5f5f4",
                    borderRadius: 999,
                    color: "#262626",
                  }}
                >
                  {ie(it, `interests.${i}`)}
                </span>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div
      dir={dir}
      style={{
        width: A4_W,
        minHeight: A4_H,
        background: "#ffffff",
        fontFamily: cvFont(lang),
        color: "#0a0a0a",
        fontSize: 11.5,
        lineHeight: 1.6,
        display: "grid",
        gridTemplateColumns: "8px 1fr",
      }}
    >
      {/* Accent rail */}
      <div style={{ background: accent }} />

      <div style={{ padding: "56px 56px 64px" }}>
        {/* Header */}
        <header style={{ marginBottom: 36 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: accent,
              marginBottom: 12,
            }}
          >
            {ie(cv.profile.title, "profile.title")}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {cv.profile.photo ? (
              <img
                src={cv.profile.photo}
                alt=""
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 4,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 4,
                  background: "#f5f5f4",
                  color: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 30,
                  flexShrink: 0,
                }}
              >
                {initials(cv)}
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 56,
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: -1.5,
                  color: "#0a0a0a",
                }}
              >
                {ie(cv.profile.firstName, "profile.firstName")}
              </h1>
              <h1
                style={{
                  margin: 0,
                  fontSize: 56,
                  lineHeight: 1,
                  fontWeight: 300,
                  letterSpacing: -1.5,
                  color: "#0a0a0a",
                  fontStyle: "italic",
                }}
              >
                {ie(cv.profile.lastName, "profile.lastName")}
              </h1>
            </div>
          </div>

          {/* Contact strip */}
          <div
            style={{
              marginTop: 22,
              paddingTop: 14,
              borderTop: `1px solid #e5e5e5`,
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 18px",
              fontSize: 10.5,
              color: "#525252",
            }}
          >
            <span>{ie(cv.profile.email, "profile.email")}</span>
            <span>·</span>
            <span>{ie(cv.profile.phone, "profile.phone")}</span>
            <span>·</span>
            <span>{ie(cv.profile.city, "profile.city")}</span>
            {cv.profile.website && (
              <>
                <span>·</span>
                <span>{ie(cv.profile.website, "profile.website")}</span>
              </>
            )}
            {cv.profile.linkedin && (
              <>
                <span>·</span>
                <span>{ie(cv.profile.linkedin, "profile.linkedin")}</span>
              </>
            )}
          </div>
        </header>

        {/* Sections */}
        {visible.map((sec, i) => renderSection(sec, i + 1))}
      </div>
    </div>
  );
}
