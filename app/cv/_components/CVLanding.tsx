"use client";
/**
 * CVLanding — marketing / conversion page shown at /cv to visitors who
 * aren't logged in yet (the "Mes CVs" dashboard takes over once they are).
 *
 * Every CV preview here is the real production CVRender — same templates
 * used in the builder and the print route — not a mockup image, so the
 * gallery and hero always match what people actually get. Sample data is
 * fictional but shaped exactly like CVData.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check, Sparkles, MousePointerClick, GripVertical, Languages, Upload,
  ChevronRight, Plus,
} from "lucide-react";
import { CVRender, A4_W, A4_H } from "../[id]/_components/templates";
import type { CVData, SectionId, TemplateId, Lang } from "../_lib/schema";

// ─── Tokens (TalentMaroc violet system, not the prototype's neutral gray) ───
const TOK = {
  violet: "#7c3aed", violetDeep: "#5b21b6", violet600: "#6d28d9", violetInk: "#1e1147",
  orange: "#f97316", ink: "#0f172a", body: "#475569", muted: "#64748b", faint: "#94a3b8",
  line: "#ede9fe", lineSoft: "#f5f3ff", bg: "#fff", bgAlt: "#faf9ff",
  success: "#16a34a", successBg: "#f0fdf4",
};
const MAXW = 1120;

// ─── Sample CV — real schema shape, used only for decorative previews ──────
const SAMPLE_CV: CVData = {
  profile: {
    firstName: "Yasmine", lastName: "El Amrani", title: "Product Designer Senior",
    email: "yasmine.elamrani@gmail.com", phone: "+212 6 61 24 18 90", city: "Casablanca, Maroc",
    website: "yasmineelamrani.com", linkedin: "linkedin.com/in/yelamrani",
  },
  summary: "Product Designer avec 7 ans d'expérience à concevoir des produits SaaS B2B utilisés par des équipes en EMEA. J'aime traduire des besoins complexes en interfaces simples, animer des design systems, et livrer vite avec l'ingénierie et le produit.",
  experience: [
    { id: "e1", role: "Lead Product Designer", company: "BMCE Capital", city: "Casablanca", start: "Mars 2023", end: "Présent", current: true,
      bullets: [
        "Pilote la refonte du portail de banque privée — engagement +38%, NPS de 24 à 51 en 9 mois.",
        "Anime un design system de 120+ composants avec 3 équipes ingénierie.",
        "Recrute et accompagne 2 designers juniors ; rituel de critique hebdomadaire.",
      ] },
    { id: "e2", role: "Product Designer", company: "Atlas Tech", city: "Casablanca", start: "Sept 2020", end: "Févr 2023", current: false,
      bullets: [
        "Conception de bout en bout de la suite e-commerce pour 1 200 marchands au Maghreb.",
        "Lancement du checkout multi-devise (MAD, EUR, USD) — conversion +14%.",
      ] },
  ],
  education: [
    { id: "ed1", degree: "Master en Design Interactif", school: "ENSA Casablanca", city: "Casablanca", start: "2016", end: "2018", detail: "Mention Très Bien" },
  ],
  skills: [
    { id: "s1", group: "Design", items: ["Figma", "Design Systems", "Prototypage", "Recherche utilisateur"] },
    { id: "s2", group: "Outils", items: ["Notion", "Linear", "Webflow", "Framer"] },
  ],
  languages: [
    { id: "l1", name: "Arabe", level: "Langue maternelle", dots: 5 },
    { id: "l2", name: "Français", level: "Bilingue", dots: 5 },
    { id: "l3", name: "Anglais", level: "Courant — C1", dots: 4 },
  ],
  certifications: [
    { id: "c1", name: "Nielsen Norman UX Master", issuer: "NN/g", year: "2024" },
  ],
  projects: [
    { id: "p1", name: "Atlas Pay", role: "Lead Designer", detail: "App de paiement P2P pour le marché marocain — 80K utilisateurs actifs." },
  ],
  interests: ["Photographie argentique", "Course longue distance", "Typographie arabe"],
};
const SHOWCASE_ORDER: SectionId[] = ["summary", "experience", "education", "skills", "languages", "certifications", "projects", "interests"];
const SHOWCASE_ENABLED = Object.fromEntries(SHOWCASE_ORDER.map((k) => [k, true])) as Record<SectionId, boolean>;

interface TplInfo { id: TemplateId; name: string; sub: string; accent: string; badge: string | null; desc: string; }
const TEMPLATES: TplInfo[] = [
  { id: "corso",    name: "Corso",    sub: "Sidebar colorée",     accent: "#7c3aed", badge: "Populaire", desc: "Sidebar colorée à gauche. Idéal tech, marketing, créatif." },
  { id: "meridian", name: "Meridian", sub: "Classique sérif",     accent: "#1e3a5f", badge: null,        desc: "Élégant et centré, typographie sérif. Finance, conseil, juridique." },
  { id: "aria",     name: "Aria",     sub: "Ultra-épuré",         accent: "#0ea5e9", badge: null,        desc: "Colonne de labels, très épuré. Design, consulting, minimaliste." },
  { id: "dahab",    name: "Dahab",    sub: "Prestige exécutif",   accent: "#6d28d9", badge: "Exécutif",  desc: "En-tête dégradé sombre. Cadres et direction générale." },
  { id: "medina",   name: "Medina",   sub: "Créatif chaleureux",  accent: "#f97316", badge: null,        desc: "Typographie créative, fond chaleureux. RH, communication." },
  { id: "vertex",   name: "Vertex",   sub: "Rail éditorial",      accent: "#0f172a", badge: "Nouveau",   desc: "Rail vertical accent, sections numérotées, style éditorial." },
  { id: "atlas",    name: "Atlas",    sub: "Sidebar sombre",      accent: "#1e293b", badge: "Nouveau",   desc: "Sidebar sombre avec photo, colonne claire. Tous secteurs." },
  { id: "lumen",    name: "Lumen",    sub: "Bandeau 2 colonnes",  accent: "#0891b2", badge: "Nouveau",   desc: "Bandeau coloré en haut, corps deux colonnes. Moderne." },
  { id: "helix",    name: "Helix",    sub: "Timeline verticale",  accent: "#7c3aed", badge: "Nouveau",   desc: "Timeline pointillée, pills de dates. Impact visuel fort." },
  { id: "slate",    name: "Slate",    sub: "Grille Swiss",        accent: "#374151", badge: "Nouveau",   desc: "Grille Swiss, métadonnées monospace. Minimaliste absolu." },
];
const ACCENT_OPTIONS = ["#7c3aed", "#1e1147", "#0f172a", "#0e7490", "#065f46", "#b45309", "#f97316", "#be123c"];

// ─── Live A4 render, scaled into a fixed thumbnail box ─────────────────────
function TplPreview({ template, accent, scale, lang = "fr" }: { template: TemplateId; accent: string; scale: number; lang?: Lang }) {
  return (
    <div style={{ width: A4_W * scale, height: A4_H * scale, overflow: "hidden" }}>
      <div style={{ width: A4_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <CVRender template={template} cv={SAMPLE_CV} accent={accent} lang={lang} order={SHOWCASE_ORDER} enabled={SHOWCASE_ENABLED} readOnly />
      </div>
    </div>
  );
}

// ─── Small self-animating feature demos ────────────────────────────────────
function DemoRewrite() {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setInterval(() => setOn((o) => !o), 2600); return () => clearInterval(t); }, []);
  const before = "Responsable du site e-commerce, j'ai aidé l'équipe sur le checkout.";
  const after = "Piloté la refonte du checkout multi-devise — conversion +14% sur 1 200 marchands.";
  return (
    <div style={{ border: `1px solid ${TOK.line}`, borderRadius: 9, padding: "10px 11px", background: TOK.lineSoft, fontSize: 12, lineHeight: 1.55, minHeight: 64 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: on ? TOK.violet : TOK.faint, transition: ".3s" }}>{on ? "✦ Après" : "Avant"}</span>
        <span style={{ flex: 1, height: 1, background: TOK.line }} />
      </div>
      <div key={on ? "a" : "b"} style={{ animation: "cvlpFade .4s ease", color: on ? TOK.ink : TOK.muted }}>{on ? after : before}</div>
    </div>
  );
}
function DemoReorder() {
  const items = ["Profil", "Expérience", "Formation", "Compétences"];
  const [order, setOrder] = useState([0, 1, 2, 3]);
  useEffect(() => {
    const t = setInterval(() => setOrder((o) => { const n = o.slice(); const [x] = n.splice(2, 1); n.splice(1, 0, x); return n; }), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {order.map((i, pos) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: `1px solid ${pos === 1 ? "#ddd6fe" : TOK.line}`, background: pos === 1 ? TOK.lineSoft : "#fff", borderRadius: 7, fontSize: 12, fontWeight: 500, color: TOK.ink, transition: ".45s cubic-bezier(.16,1,.3,1)" }}>
          <GripVertical size={13} color="#cbd5e1" />{items[i]}
        </div>
      ))}
    </div>
  );
}
function DemoLang() {
  const [i, setI] = useState(0);
  const langs: [string, string, boolean][] = [["Fr", "Expérience professionnelle", false], ["En", "Professional experience", false], ["ع ر", "الخبرة المهنية", true]];
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % 3), 2000); return () => clearInterval(t); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ display: "flex", gap: 3, border: `1px solid ${TOK.line}`, borderRadius: 7, padding: 2, background: "#fff", width: "fit-content" }}>
        {langs.map(([l], k) => <span key={l} style={{ fontSize: 11, fontWeight: k === i ? 700 : 500, color: k === i ? TOK.violet : TOK.faint, background: k === i ? TOK.lineSoft : "transparent", padding: "4px 9px", borderRadius: 5, transition: ".2s" }}>{l}</span>)}
      </div>
      <div key={i} style={{ fontSize: 12.5, fontWeight: 600, color: TOK.ink, letterSpacing: langs[i][2] ? "normal" : ".08em", textTransform: langs[i][2] ? "none" : "uppercase", animation: "cvlpFade .35s ease", direction: langs[i][2] ? "rtl" : "ltr", fontFamily: langs[i][2] ? "'Cairo', sans-serif" : "inherit" }}>{langs[i][1]}</div>
    </div>
  );
}
function DemoImport() {
  const rows: [string, string][] = [["PDF", "Extraction du texte"], ["DOCX", "Sections détectées"], ["LinkedIn", "Postes et dates"]];
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep((s) => (s + 1) % 4), 900); return () => clearInterval(t); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {rows.map(([src, lbl], i) => {
        const done = step > i;
        return (
          <div key={src} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", border: `1px solid ${done ? "#ddd6fe" : TOK.line}`, background: done ? TOK.lineSoft : "#fff", borderRadius: 7, fontSize: 11.5, transition: ".35s" }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".06em", color: done ? TOK.violet : TOK.faint, minWidth: 48 }}>{src}</span>
            <span style={{ color: done ? TOK.ink : TOK.faint, transition: ".35s" }}>{lbl}</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: done ? TOK.success : "#cbd5e1" }}>{done ? "✓" : "○"}</span>
          </div>
        );
      })}
    </div>
  );
}
function DemoInline() {
  return (
    <div style={{ border: `1px solid ${TOK.line}`, borderRadius: 9, padding: "12px 13px", background: "#fff", fontSize: 12.5, lineHeight: 1.6 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: TOK.ink }}>Lead Product Designer</div>
      <div style={{ fontSize: 11.5, color: TOK.violet, fontWeight: 600 }}>BMCE Capital · Casablanca</div>
      <div style={{ marginTop: 6, background: "rgba(124,58,237,.10)", boxShadow: "0 0 0 2px rgba(124,58,237,.2)", borderRadius: 3, display: "inline", padding: "1px 0", fontSize: 11.5, color: TOK.body }}>
        Refonte du portail — NPS de 24 à 51
        <span style={{ display: "inline-block", width: 1.5, height: 12, background: TOK.violet, verticalAlign: "-2px", marginLeft: 1, animation: "cvlpBlink 1.1s step-end infinite" }} />
      </div>
    </div>
  );
}

// ─── Small check icon (green circle) ────────────────────────────────────────
function CheckDot() {
  return (
    <span style={{ width: 17, height: 17, borderRadius: "50%", background: TOK.successBg, border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Check size={10} color={TOK.success} strokeWidth={3} />
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════
export default function CVLanding({ onStart }: { onStart: () => void }) {
  const [selTpl, setSelTpl] = useState<TemplateId>("corso");
  const [accents, setAccents] = useState<Record<TemplateId, string>>(() => Object.fromEntries(TEMPLATES.map((t) => [t.id, t.accent])) as Record<TemplateId, string>);
  const [faqOpen, setFaqOpen] = useState(0);

  const sel = TEMPLATES.find((t) => t.id === selTpl) ?? TEMPLATES[0];

  return (
    <div style={{ background: TOK.bg, fontFamily: "'Plus Jakarta Sans',sans-serif", color: TOK.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Cairo:wght@600;700&display=swap');
        .cvlp-navlink:hover { background:${TOK.lineSoft}; color:${TOK.violetDeep}; }
        .cvlp-primary:hover { background:${TOK.violet600}; transform:translateY(-1px); }
        .cvlp-secondary:hover { border-color:#ddd6fe; background:${TOK.bgAlt}; }
        .cvlp-tpl-card:hover { transform:translateY(-3px); }
        @keyframes cvlpFade { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:none} }
        @keyframes cvlpBlink { 0%,50%{opacity:1} 51%,100%{opacity:0} }
        @media(max-width:1180px) and (min-width:781px){ .cvlp-tpl-row{ grid-template-columns:repeat(4,1fr)!important } }
        @media(max-width:780px){ .cvlp-tpl-row{ grid-template-columns:repeat(2,1fr)!important } }
        @media(max-width:1000px){
          .cvlp-hero-inner{ grid-template-columns:1fr!important; gap:36px!important }
          .cvlp-hero-visual{ height:auto!important; padding-bottom:20px }
          .cvlp-feat-grid,.cvlp-flow-row,.cvlp-price-grid{ grid-template-columns:1fr!important }
          .cvlp-feat-wide{ grid-column:span 1!important }
          .cvlp-ats-inner{ grid-template-columns:1fr!important; gap:32px!important }
          .cvlp-foot-inner{ grid-template-columns:1fr 1fr!important }
        }
        @media(max-width:640px){ .cvlp-stats{ flex-wrap:wrap } .cvlp-stats>div{ flex:1 1 40%!important } }
      `}</style>

      {/* ══ NAV ═══════════════════════════════════════════════════════════ */}
      <nav style={{ position: "sticky", top: 0, zIndex: 60, background: "rgba(255,255,255,.9)", backdropFilter: "blur(16px)", borderBottom: `1.5px solid ${TOK.line}` }}>
        <div style={{ maxWidth: MAXW, margin: "0 auto", padding: "0 24px", height: 62, display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/logo.png" alt="TalentMaroc" style={{ height: 90, width: "auto", objectFit: "contain", margin: "-18px 0" }} />
          </Link>
          <div style={{ display: "flex", gap: 2 }} className="hide-sm">
            {[["Modèles", "#modeles"], ["Fonctionnalités", "#features"], ["ATS", "#ats"], ["Tarifs", "#tarifs"], ["Offres d'emploi", "/"]].map(([l, h]) => (
              <a key={l} href={h} className="cvlp-navlink" style={{ fontSize: 13, fontWeight: 600, color: TOK.muted, padding: "7px 12px", borderRadius: 8, textDecoration: "none", transition: ".15s" }}>{l}</a>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/auth/login" style={{ fontSize: 13, fontWeight: 600, color: TOK.body, padding: "8px 12px", borderRadius: 8, textDecoration: "none" }}>Connexion</Link>
            <button onClick={onStart} className="cvlp-primary" style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: TOK.violet, padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, transition: ".15s", boxShadow: "0 2px 8px rgba(124,58,237,.3)" }}>
              Créer mon CV
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", borderBottom: `1.5px solid ${TOK.line}` }}>
        <div style={{ position: "absolute", top: -300, left: "50%", transform: "translateX(-50%)", width: 1000, height: 560, background: "radial-gradient(ellipse at center, rgba(124,58,237,.10) 0%, rgba(124,58,237,0) 68%)", pointerEvents: "none" }} />
        <div className="cvlp-hero-inner" style={{ position: "relative", maxWidth: MAXW, margin: "0 auto", padding: "64px 24px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div style={{ paddingBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 700, color: TOK.violetDeep, background: TOK.lineSoft, border: "1.5px solid #ddd6fe", padding: "5px 11px 5px 8px", borderRadius: 100, marginBottom: 20 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: TOK.orange }} />Nouveau — édition en direct sur l'aperçu
            </div>
            <h1 style={{ fontSize: "clamp(32px,4.4vw,50px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-.03em", margin: 0, color: TOK.ink }}>
              Le CV qui passe<br />les filtres.<br /><span style={{ color: TOK.faint, fontWeight: 400 }}>Et les recruteurs.</span>
            </h1>
            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: TOK.body, marginTop: 20, maxWidth: 440 }}>
              Un éditeur pensé pour le marché marocain : dix modèles, réécriture par IA en français, anglais et arabe. Vous voyez le résultat pendant que vous tapez.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
              <button onClick={onStart} className="cvlp-primary" style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", background: TOK.violet, padding: "13px 22px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px -8px rgba(124,58,237,.5)", transition: ".15s" }}>
                Créer mon CV — gratuit <ChevronRight size={16} />
              </button>
              <a href="#modeles" className="cvlp-secondary" style={{ fontSize: 14.5, fontWeight: 600, color: TOK.body, background: "#fff", padding: "13px 20px", borderRadius: 10, border: `1.5px solid ${TOK.line}`, textDecoration: "none", transition: ".15s" }}>
                Voir les 10 modèles
              </a>
            </div>
            <div style={{ fontSize: 12.5, color: TOK.faint, marginTop: 18, display: "flex", gap: 18, flexWrap: "wrap" }}>
              {["Sans carte bancaire", "Export PDF", "Données hébergées au Maroc"].map((f) => (
                <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><CheckDot />{f}</span>
              ))}
            </div>
          </div>

          <div className="cvlp-hero-visual" style={{ position: "relative", height: 480, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 340, transform: "perspective(1600px) rotateY(-9deg) rotateX(2deg) rotate(1deg)" }}>
              <div style={{ position: "absolute", top: 22, left: -40, width: 794 * 0.43, opacity: 0.55, zIndex: -1, boxShadow: "0 16px 40px -12px rgba(15,23,42,.16)", borderRadius: 3, overflow: "hidden" }}>
                <TplPreview template="meridian" accent="#1e3a5f" scale={0.43} />
              </div>
              <div style={{ boxShadow: "0 1px 2px rgba(15,23,42,.06), 0 24px 48px -12px rgba(15,23,42,.22), 0 48px 100px -30px rgba(124,58,237,.28)", borderRadius: 3, overflow: "hidden" }}>
                <TplPreview template="corso" accent={TOK.violet} scale={0.5} />
              </div>
              <div style={{ position: "absolute", top: 40, left: -78, background: "rgba(255,255,255,.96)", backdropFilter: "blur(12px)", border: `1px solid ${TOK.line}`, borderRadius: 10, padding: "8px 12px", fontSize: 11.5, fontWeight: 600, boxShadow: "0 8px 24px -6px rgba(15,23,42,.16)", display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={13} color={TOK.violet} /> Réécrit par l'IA
              </div>
              <div style={{ position: "absolute", bottom: 70, left: -64, background: "rgba(255,255,255,.96)", backdropFilter: "blur(12px)", border: `1px solid ${TOK.line}`, borderRadius: 10, padding: "8px 12px", fontSize: 11.5, fontWeight: 600, boxShadow: "0 8px 24px -6px rgba(15,23,42,.16)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: TOK.success }} /> Compatible ATS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS (real site numbers, no fabricated endorsements) ══════════ */}
      <section style={{ background: TOK.bgAlt, borderBottom: `1.5px solid ${TOK.line}` }}>
        <div style={{ maxWidth: MAXW, margin: "0 auto", padding: "0 24px" }}>
          <div className="cvlp-stats" style={{ display: "flex", borderTop: "none" }}>
            {[["18 400+", "offres actives sur Talent Maroc"], ["10", "modèles de CV inclus"], ["3", "langues — Fr · En · عربية"], ["12 min", "pour un CV complet"]].map(([n, l]) => (
              <div key={l} style={{ flex: 1, padding: "26px 0" }}>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", color: TOK.ink }}>{n}</div>
                <div style={{ fontSize: 12.5, color: TOK.muted, marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TEMPLATES ════════════════════════════════════════════════════ */}
      <section id="modeles" style={{ padding: "88px 0 96px", borderBottom: `1.5px solid ${TOK.line}` }}>
        <div style={{ maxWidth: MAXW, margin: "0 auto", padding: "0 24px" }}>
          <SecHead eyebrow="Modèles" title="Dix mises en page. Une seule source de vérité." sub="Changez de modèle à tout moment — votre contenu suit. Chaque rendu ci-dessous est le vrai modèle, pas une image." action={
            <button onClick={onStart} className="cvlp-secondary" style={{ fontSize: 13.5, fontWeight: 600, color: TOK.body, background: "#fff", padding: "10px 16px", borderRadius: 9, border: `1.5px solid ${TOK.line}`, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Ouvrir l'éditeur →</button>
          } />
          <div className="cvlp-tpl-row" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "28px 18px" }}>
            {TEMPLATES.map((t) => (
              <div key={t.id} className="cvlp-tpl-card" onMouseEnter={() => setSelTpl(t.id)} style={{ cursor: "pointer", transition: ".2s cubic-bezier(.16,1,.3,1)" }}>
                <div style={{ borderRadius: 6, overflow: "hidden", background: "#fff", border: `1px solid ${selTpl === t.id ? TOK.violet : TOK.line}`, boxShadow: selTpl === t.id ? "0 1px 2px rgba(124,58,237,.2), 0 18px 40px -14px rgba(124,58,237,.4)" : "0 1px 3px rgba(15,23,42,.06)", transition: ".2s" }}>
                  <div style={{ width: "100%", aspectRatio: "794/1123", overflow: "hidden", position: "relative" }}>
                    <div style={{ width: A4_W, position: "absolute", top: 0, left: 0, transform: "scale(.238)", transformOrigin: "top left" }}>
                      <CVRender template={t.id} cv={SAMPLE_CV} accent={accents[t.id]} lang="fr" order={SHOWCASE_ORDER} enabled={SHOWCASE_ENABLED} readOnly />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 7 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: TOK.ink }}>{t.name}</span>
                  <span style={{ fontSize: 11.5, color: TOK.faint }}>{t.sub}</span>
                  {t.badge && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".05em", padding: "2px 6px", borderRadius: 4, background: `${t.accent}1f`, color: t.accent, marginLeft: "auto", textTransform: "uppercase", whiteSpace: "nowrap" }}>{t.badge}</span>}
                </div>
                <p style={{ fontSize: 11.5, lineHeight: 1.5, color: TOK.faint, margin: "5px 0 0" }}>{t.desc}</p>
                <div style={{ display: "flex", gap: 5, marginTop: 9 }}>
                  {[t.accent, ...ACCENT_OPTIONS.filter((c) => c !== t.accent)].slice(0, 5).map((c) => (
                    <button key={c} title={c} onClick={(e) => { e.stopPropagation(); setAccents((a) => ({ ...a, [t.id]: c })); }}
                      style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: accents[t.id] === c ? `2px solid ${TOK.ink}` : "1px solid rgba(15,23,42,.1)", cursor: "pointer", padding: 0 }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════════ */}
      <section id="features" style={{ background: TOK.bgAlt, padding: "88px 0 96px", borderBottom: `1.5px solid ${TOK.line}` }}>
        <div style={{ maxWidth: MAXW, margin: "0 auto", padding: "0 24px" }}>
          <SecHead eyebrow="Fonctionnalités" title="Fait pour écrire, pas pour remplir un formulaire." sub="Les outils qui existent vous font saisir des champs. Celui-ci vous aide à formuler." />
          <div className="cvlp-feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: TOK.line, border: `1px solid ${TOK.line}`, borderRadius: 14, overflow: "hidden" }}>
            {[
              { icon: <Sparkles size={15} />, title: "Réécriture IA, par ligne", desc: "Chaque réalisation a son bouton. L'IA transforme une phrase plate en résultat mesurable — sans inventer de faits.", demo: <DemoRewrite />, wide: true },
              { icon: <MousePointerClick size={15} />, title: "Édition sur l'aperçu", desc: "Cliquez sur le texte du CV et tapez. Le formulaire et l'aperçu partagent le même état.", demo: <DemoInline /> },
              { icon: <GripVertical size={15} />, title: "Ordre des sections", desc: "Glissez pour réordonner, masquez ce qui ne sert pas au poste visé.", demo: <DemoReorder /> },
              { icon: <Languages size={15} />, title: "Fr · En · عربية", desc: "Titres traduits, mise en page adaptée en arabe. Un CV, trois marchés.", demo: <DemoLang /> },
              { icon: <Upload size={15} />, title: "Importez ce que vous avez", desc: "PDF, DOCX ou profil LinkedIn — l'extraction remplit le formulaire. Vous corrigez, vous validez.", demo: <DemoImport /> },
            ].map((c) => (
              <div key={c.title} className={c.wide ? "cvlp-feat-wide" : ""} style={{ gridColumn: c.wide ? "span 2" : undefined, background: "#fff", padding: "26px 24px 28px", display: "flex", flexDirection: "column", gap: 12, minHeight: 210 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: TOK.lineSoft, border: "1px solid #ede9fe", color: TOK.violet, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 650, color: TOK.ink, letterSpacing: "-.01em" }}>{c.title}</div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: TOK.body, margin: "5px 0 0" }}>{c.desc}</p>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 16 }}>{c.demo}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WORKFLOW ═════════════════════════════════════════════════════ */}
      <section style={{ padding: "88px 0 96px", borderBottom: `1.5px solid ${TOK.line}` }}>
        <div style={{ maxWidth: MAXW, margin: "0 auto", padding: "0 24px" }}>
          <SecHead eyebrow="Déroulé" title="Trois étapes. Douze minutes." sub="Pas d'assistant en sept écrans. Tout est sur une page, modifiable à tout moment." />
          <div className="cvlp-flow-row" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 36 }}>
            {[
              ["Partez de votre CV actuel", "Importez un PDF ou collez votre profil LinkedIn. L'extraction remplit les sections. Ou partez d'une page blanche."],
              ["Écrivez avec l'IA à côté", "Réécrivez ligne par ligne. Le score de complétude vous dit précisément ce qui manque."],
              ["Exportez pour chaque offre", "Changez de modèle, masquez une section, basculez en anglais. Un PDF propre en un clic, autant de fois que nécessaire."],
            ].map(([t, d], i) => (
              <div key={t}>
                <div style={{ fontSize: 13, fontWeight: 800, color: TOK.violet, width: 28, height: 28, borderRadius: "50%", border: "1px solid #ddd6fe", background: TOK.lineSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{i + 1}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TOK.ink, marginBottom: 7 }}>{t}</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.62, color: TOK.body, margin: 0, maxWidth: 290 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ATS — claim kept technical/defensible, no fabricated tool names ═ */}
      <section id="ats" style={{ background: TOK.violetInk, padding: "92px 0 96px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -260, right: -160, width: 700, height: 560, background: "radial-gradient(ellipse at center, rgba(124,58,237,.5) 0%, rgba(124,58,237,0) 68%)", pointerEvents: "none" }} />
        <div className="cvlp-ats-inner" style={{ position: "relative", maxWidth: MAXW, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: TOK.orange, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 14 }}>Compatibilité ATS</div>
            <h2 style={{ fontSize: "clamp(24px,3vw,32px)", fontWeight: 800, letterSpacing: "-.025em", margin: 0, lineHeight: 1.15 }}>Beaucoup de CV sont écartés avant d'être lus par un humain.</h2>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: "rgba(255,255,255,.72)", marginTop: 16 }}>
              Les grands recruteurs filtrent par logiciel. Une colonne mal placée, un titre exotique, une compétence en image — et le dossier disparaît. Nos dix modèles utilisent une structure simple, en texte réel, sans mise en page piégeuse.
            </p>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              {["Texte réel uniquement — aucune information encodée en image", "Titres de section standards, structure à une ou deux colonnes", "Réécriture IA qui ajoute des verbes d'action, jamais des faits inventés"].map((l) => (
                <div key={l} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, color: "rgba(255,255,255,.9)", lineHeight: 1.5 }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(22,163,74,.2)", border: "1px solid rgba(74,222,128,.4)", color: "#4ade80", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}><Check size={9} strokeWidth={3} /></span>
                  {l}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 14, padding: 24, backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,.12)", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>Score de complétude</div>
                <div style={{ fontSize: 34, fontWeight: 800 }}>92<span style={{ fontSize: 16, color: "rgba(255,255,255,.4)" }}>/100</span></div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 11.5, color: "#4ade80", background: "rgba(22,163,74,.15)", border: "1px solid rgba(74,222,128,.3)", padding: "5px 10px", borderRadius: 100, fontWeight: 600 }}>✓ Prêt à envoyer</div>
            </div>
            {[["Structure lisible", 100], ["Titres de section standards", 100], ["Photo et coordonnées", 100], ["Texte en image", 100], ["Réalisations chiffrées", 68]].map(([l, p]) => (
              <div key={l as string} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", fontSize: 13, color: "rgba(255,255,255,.82)", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
                <span style={{ color: (p as number) === 100 ? "#4ade80" : "#fbbf24", fontSize: 11 }}>{(p as number) === 100 ? "✓" : "!"}</span>
                <span>{l}</span>
                <span style={{ flex: 1, height: 4, background: "rgba(255,255,255,.12)", borderRadius: 100, overflow: "hidden", marginLeft: "auto", maxWidth: 64 }}><span style={{ width: `${p}%`, height: "100%", display: "block", background: (p as number) === 100 ? "#4ade80" : "#fbbf24", borderRadius: 100 }} /></span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)", minWidth: 26, textAlign: "right" }}>{p}%</span>
              </div>
            ))}
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 14, lineHeight: 1.5 }}>Ajoutez un chiffre dans votre dernière expérience pour atteindre 100.</div>
          </div>
        </div>
      </section>

      {/* ══ PRICING — mirrors the real /pricing model (no fictional subscription) ═ */}
      <section id="tarifs" style={{ padding: "88px 0 96px", borderBottom: `1.5px solid ${TOK.line}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40, maxWidth: 560, marginInline: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TOK.violet, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 14 }}>Tarifs</div>
            <h2 style={{ fontSize: "clamp(24px,3vw,32px)", fontWeight: 800, letterSpacing: "-.025em", margin: 0 }}>Gratuit pour construire. Payant pour aller plus loin.</h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: TOK.body, marginTop: 14 }}>Les dix modèles et l'export PDF sont inclus gratuitement. Pas d'abonnement caché.</p>
          </div>
          <div className="cvlp-price-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "stretch" }}>
            <div style={{ background: "#fff", border: `1px solid ${TOK.line}`, borderRadius: 15, padding: "28px 26px 26px", display: "flex", flexDirection: "column" }}>
              <span style={{ display: "inline-flex", fontSize: 9.5, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "#f3f4f6", color: "#374151", marginBottom: 12, width: "fit-content" }}>Gratuit</span>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: TOK.ink }}>Pour construire un CV solide</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 20 }}>
                <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-.03em" }}>0</span><span style={{ fontSize: 13.5, color: TOK.muted, fontWeight: 500 }}>MAD</span>
              </div>
              <div style={{ fontSize: 12, color: TOK.faint, marginTop: 7 }}>Pour toujours · Aucune carte requise</div>
              <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                {["Les 10 modèles, export PDF illimité", "Édition en direct sur l'aperçu", "Français, anglais et arabe", "Score de complétude", "1 génération de CV par IA offerte"].map((f) => (
                  <div key={f} style={{ display: "flex", gap: 9, fontSize: 13, color: TOK.body, alignItems: "flex-start" }}><Check size={14} color={TOK.success} style={{ marginTop: 2, flexShrink: 0 }} />{f}</div>
                ))}
              </div>
              <Link href="/auth/login" style={{ marginTop: 22, padding: 12, borderRadius: 9, border: `1px solid ${TOK.line}`, background: "#fff", color: TOK.ink, fontSize: 14, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>Créer un compte gratuit</Link>
            </div>
            <div style={{ background: "linear-gradient(160deg,#f5f3ff 0%,#ede9fe 100%)", border: `1.5px solid ${TOK.violet}`, borderRadius: 15, padding: "28px 26px 26px", position: "relative", boxShadow: "0 1px 3px rgba(124,58,237,.16), 0 20px 50px -20px rgba(124,58,237,.4)", display: "flex", flexDirection: "column" }}>
              <span style={{ position: "absolute", top: -10, left: 26, background: TOK.violet, color: "#fff", fontSize: 9.5, fontWeight: 700, padding: "4px 10px", borderRadius: 100, letterSpacing: ".08em", textTransform: "uppercase" }}>✦ CV par IA</span>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#4c1d95", marginTop: 4 }}>Paiement unique — sans abonnement</div>
              <div style={{ fontSize: 12, color: TOK.muted, marginTop: 5, lineHeight: 1.5 }}>Payez une seule fois pour un CV entièrement écrit et optimisé par l'IA.</div>
              <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
                {[
                  ["Starter — 19 MAD", "CV optimisé ATS + PDF"],
                  ["Professionnel — 35 MAD", "CV avancé + lettre de motivation + résumé LinkedIn"],
                  ["Cadre — 55 MAD", "Réécriture exécutive + lettre + bio + questions d'entretien IA"],
                ].map(([label, desc], i, arr) => (
                  <div key={label} style={{ padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid #e9d5ff" : "none" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#4c1d95" }}>{label}</div>
                    <div style={{ fontSize: 12, color: TOK.muted, marginTop: 2 }}>{desc}</div>
                  </div>
                ))}
              </div>
              <button onClick={onStart} className="cvlp-primary" style={{ marginTop: 22, padding: 12, borderRadius: 9, border: "none", background: TOK.violet, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: ".15s" }}>Créer mon CV →</button>
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 12.5, color: TOK.faint, marginTop: 22 }}>
            Voir le détail complet sur la page <Link href="/pricing" style={{ color: TOK.violet }}>Tarifs</Link>.
          </div>
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════════════════════ */}
      <section style={{ background: TOK.bgAlt, padding: "88px 0 96px", borderBottom: `1.5px solid ${TOK.line}` }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px" }}>
          <SecHead eyebrow="Questions" title="Ce qu'on nous demande le plus." />
          <div>
            {[
              ["Mon CV sera-t-il lisible par les logiciels de tri (ATS) ?", "Nos dix modèles utilisent du texte réel et une structure simple à une ou deux colonnes — pas de tableaux complexes ni de texte encodé en image, ce qui est la principale cause de perte d'information lors d'un scan automatique."],
              ["L'IA invente-t-elle des choses sur mon parcours ?", "Non. Elle ne fait que reformuler ce que vous avez écrit : verbe d'action en tête, formulation naturelle. S'il n'y a pas de chiffre dans votre phrase, elle n'en invente pas — elle vous suggère d'en ajouter un."],
              ["Puis-je faire un CV en arabe ?", "Oui. Les titres de section sont traduits et certains modèles adaptent leur mise en page pour l'arabe."],
              ["Que devient mon CV si je n'achète pas de forfait IA ?", "Vos données restent accessibles et exportables en PDF avec les dix modèles gratuits. Vous ne perdez jamais l'accès à ce que vous avez écrit."],
              ["Où sont stockées mes données ?", "Sur l'infrastructure Supabase de Talent Maroc. Aucun recruteur n'accède à votre CV sans que vous ayez postulé."],
              ["Puis-je importer un CV Word ou un profil LinkedIn ?", "Oui — PDF, DOCX ou lien LinkedIn. L'extraction remplit les sections ; vous relisez et corrigez avant de publier."],
            ].map(([q, a], i) => (
              <div key={q} style={{ borderBottom: `1px solid ${TOK.line}` }}>
                <div onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "19px 0", cursor: "pointer", fontSize: 15, fontWeight: 600, color: TOK.ink, userSelect: "none" }}>
                  {q}<span style={{ marginLeft: "auto", color: TOK.faint, fontSize: 17, fontWeight: 300, transition: ".2s", transform: faqOpen === i ? "rotate(45deg)" : "none", flexShrink: 0 }}><Plus size={17} /></span>
                </div>
                {faqOpen === i && <p style={{ fontSize: 14, lineHeight: 1.68, color: TOK.body, paddingBottom: 20, maxWidth: 640, margin: 0 }}>{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════════ */}
      <section style={{ padding: "96px 0 100px", textAlign: "center", position: "relative", overflow: "hidden", borderBottom: `1.5px solid ${TOK.line}` }}>
        <div style={{ position: "absolute", bottom: -300, left: "50%", transform: "translateX(-50%)", width: 900, height: 520, background: "radial-gradient(ellipse at center, rgba(124,58,237,.13) 0%, rgba(124,58,237,0) 68%)", pointerEvents: "none" }} />
        <h2 style={{ position: "relative", fontSize: "clamp(26px,3.6vw,40px)", fontWeight: 800, letterSpacing: "-.03em", margin: 0, lineHeight: 1.1 }}>Votre prochain poste<br />commence par une page.</h2>
        <p style={{ position: "relative", fontSize: 16, color: TOK.body, marginTop: 18, maxWidth: 440, marginInline: "auto" }}>Gratuit, sans carte bancaire. Un CV complet en douze minutes.</p>
        <div style={{ position: "relative", display: "flex", gap: 10, justifyContent: "center", marginTop: 30, flexWrap: "wrap" }}>
          <button onClick={onStart} className="cvlp-primary" style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", background: TOK.violet, padding: "13px 22px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px -8px rgba(124,58,237,.5)", transition: ".15s" }}>Créer mon CV <ChevronRight size={16} /></button>
          <a href="#modeles" className="cvlp-secondary" style={{ fontSize: 14.5, fontWeight: 600, color: TOK.body, background: "#fff", padding: "13px 20px", borderRadius: 10, border: `1.5px solid ${TOK.line}`, textDecoration: "none", transition: ".15s" }}>Parcourir les modèles</a>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer style={{ background: TOK.violetInk, padding: "48px 24px 24px" }}>
        <div className="cvlp-foot-inner" style={{ maxWidth: MAXW, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 32, marginBottom: 32 }}>
          <div>
            <img src="/logo.png" alt="TalentMaroc" style={{ height: 64, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.85, marginBottom: 14 }} />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", lineHeight: 1.6, maxWidth: 240, margin: 0 }}>La plateforme d'emploi et de CV pensée pour le marché marocain.</p>
          </div>
          {[["Produit", [["Créer un CV", "/cv"], ["Modèles", "#modeles"], ["Tarifs", "/pricing"]]],
            ["Emploi", [["Offres d'emploi", "/"], ["Publier une offre", "/employeur/new"]]]].map(([h, links]) => (
            <div key={h as string}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.4)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".1em" }}>{h as string}</div>
              {(links as [string, string][]).map(([label, href]) => (
                <a key={label} href={href} style={{ fontSize: 13.5, color: "rgba(255,255,255,.6)", textDecoration: "none", display: "block", padding: "4px 0" }}>{label}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", maxWidth: MAXW, margin: "0 auto", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>© 2026 Talent Maroc</span>
          <a href="mailto:contact@talentmaroc.shop" style={{ fontSize: 12, color: "rgba(255,255,255,.25)", textDecoration: "none" }}>contact@talentmaroc.shop</a>
        </div>
      </footer>
    </div>
  );
}

function SecHead({ eyebrow, title, sub, action }: { eyebrow?: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: action ? "1fr auto" : "1fr", gap: 32, alignItems: "end", marginBottom: 38 }}>
      <div style={{ maxWidth: 600 }}>
        {eyebrow && <div style={{ fontSize: 11, fontWeight: 700, color: TOK.violet, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 14 }}>{eyebrow}</div>}
        <h2 style={{ fontSize: "clamp(24px,3vw,32px)", fontWeight: 800, letterSpacing: "-.025em", color: TOK.ink, margin: 0, lineHeight: 1.1 }}>{title}</h2>
        {sub && <p style={{ fontSize: 15, lineHeight: 1.6, color: TOK.body, marginTop: 14, marginBottom: 0 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
