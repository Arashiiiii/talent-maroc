"use client";
import { useState, useCallback, useEffect, useRef } from "react";

// ── DODO PAYMENT LINKS ────────────────────────────────────────────────────
const DODO_CHECKOUT: Record<string, string> = {
  starter: "https://test.checkout.dodopayments.com/buy/pdt_0NeCdmQE5gOZo2WER3XE2?quantity=1&redirect_url=https%3A%2F%2Ftalentmaroc.shop%2Fsuccess%3Ftype%3Dcv",
  pro:     "https://test.checkout.dodopayments.com/buy/pdt_0NeCdv6Pkc5C3Z4Pnno5Q?quantity=1&redirect_url=https%3A%2F%2Ftalentmaroc.shop%2Fsuccess%3Ftype%3Dcv",
  cadre:   "https://test.checkout.dodopayments.com/buy/pdt_0NeCe2Pfl1hs6WDESYmgB?quantity=1&redirect_url=https%3A%2F%2Ftalentmaroc.shop%2Fsuccess%3Ftype%3Dcv",
};

// ── TYPES ──────────────────────────────────────────────────────────────────
interface CVData {
  name:        string;
  title:       string;
  email:       string;
  phone:       string;
  location:    string;
  profile:     string;
  experiences: { company: string; role: string; period: string; bullets: string[] }[];
  education:   { school: string; degree: string; year: string }[];
  skills:      string[];
  languages:   { lang: string; level: string }[];
  certifications?: string[];
  photo?:      string;
}

interface Template {
  id:    number;
  name:  string;
  cat:   "classic"|"modern"|"minimal"|"executive"|"creative"|"twocol"|"timeline"|"rightsidebar";
  desc:  string;
  badge: "gratuit"|"pro"|"nouveau";
}

type PlanTier = "starter" | "pro" | "cadre";
interface Plan { name: string; price: string; productId: string; tier: PlanTier; }
type Step = 1|2|3|4|5;
type Mode = "upload"|"ai";

// ── A4 DIMENSIONS (px at 96dpi) ────────────────────────────────────────────
const A4_W = 794;
const A4_H = 1123;

// ── SAMPLE CV DATA (used in previews) ──────────────────────────────────────
const SAMPLE: CVData = {
  name:     "Youssef Benali",
  title:    "Développeur Full Stack Senior",
  email:    "youssef@email.ma",
  phone:    "+212 6 00 00 00 00",
  location: "Casablanca, Maroc",
  profile:  "Ingénieur Full Stack avec 5 ans d'expérience dans le développement d'applications web et mobiles à fort trafic. Expert React, Node.js et architectures cloud.",
  experiences: [
    { company:"Capgemini Maroc", role:"Lead Developer", period:"2021 – Présent",
      bullets:["Pilotage d'une équipe de 6 développeurs sur des projets clients","Architecture microservices, CI/CD GitHub Actions, déploiement AWS","Réduction de 40% du temps de chargement sur l'application principale"] },
    { company:"OCP Digital", role:"Développeur Full Stack", period:"2019 – 2021",
      bullets:["Développement de portails RH internes avec React et Node.js","Intégration GraphQL et migration base de données PostgreSQL"] },
  ],
  education: [
    { school:"ENSA Rabat", degree:"Master Génie Informatique", year:"2019" },
    { school:"CPGE Casablanca", degree:"Classes Préparatoires MP", year:"2016" },
  ],
  skills: ["React","Next.js","TypeScript","Node.js","Python","PostgreSQL","AWS","Docker"],
  languages: [
    { lang:"Arabe",    level:"Natif"   },
    { lang:"Français", level:"Courant" },
    { lang:"Anglais",  level:"Courant" },
  ],
  certifications: ["AWS Certified Developer (2023)","PMP Project Management (2022)"],
};

// ── TEMPLATES REGISTRY ─────────────────────────────────────────────────────
const TEMPLATES: Template[] = [
  { id:1, name:"Classique",   cat:"classic",   desc:"Sobre et intemporel. Idéal pour finance, juridique, institutions.", badge:"gratuit" },
  { id:2, name:"Moderne",     cat:"modern",    desc:"Sidebar colorée, typographie soignée. Tech, marketing, startups.",  badge:"gratuit" },
  { id:3, name:"Minimaliste", cat:"minimal",   desc:"Ultra-épuré, beaucoup d'espace. Design, consulting, créatif.",      badge:"nouveau" },
  { id:4, name:"Exécutif",    cat:"executive", desc:"Prestige et autorité. Cadres dirigeants, direction générale.",      badge:"pro"     },
  { id:5, name:"Créatif",     cat:"creative",  desc:"Accrocheur et original. Design, UX, communication, médias.",        badge:"nouveau" },
  { id:6, name:"Azurill",     cat:"classic",   desc:"Colonne unique élégante. ATS-friendly, sobre et efficace.",         badge:"nouveau" },
  { id:7, name:"Bronzor",     cat:"modern",    desc:"Sidebar droite, mise en valeur des compétences. Tech & data.",      badge:"nouveau" },
  { id:8, name:"Ditto",       cat:"minimal",   desc:"Deux colonnes équilibrées, lecture rapide. Tous secteurs.",         badge:"gratuit" },
  { id:9, name:"Leafish",     cat:"creative",  desc:"Timeline visuelle, accent vert nature. Impact immédiat.",           badge:"nouveau" },
];

const BADGE_STYLES: Record<string,{bg:string;color:string}> = {
  gratuit:{ bg:"#f5f3ff", color:"#6d28d9" },
  pro:    { bg:"#fef3c7", color:"#92400e" },
  nouveau:{ bg:"#eff6ff", color:"#1d4ed8" },
};

const ACCENT_COLORS = [
  { name:"Violet",  value:"#7c3aed" },
  { name:"Marine",  value:"#1e3a5f" },
  { name:"Bleu",    value:"#1d4ed8" },
  { name:"Vert",    value:"#059669" },
  { name:"Rouge",   value:"#dc2626" },
  { name:"Orange",  value:"#ea580c" },
  { name:"Rose",    value:"#db2777" },
  { name:"Ardoise", value:"#374151" },
];

const FONT_OPTIONS = [
  { name:"Inter",    value:"'Inter',sans-serif",                   label:"Sans-serif moderne" },
  { name:"Georgia",  value:"'Georgia',serif",                      label:"Classique élégant" },
  { name:"Calibri",  value:"'Calibri','Segoe UI',sans-serif",     label:"Sobre professionnel" },
  { name:"Garamond", value:"'Garamond','Times New Roman',serif",   label:"Littéraire raffiné" },
];

const CV_SECTIONS = [
  { id:"profile",        label:"Profil professionnel" },
  { id:"experience",     label:"Expériences" },
  { id:"education",      label:"Formation" },
  { id:"skills",         label:"Compétences" },
  { id:"languages",      label:"Langues" },
  { id:"certifications", label:"Certifications" },
];

const PLANS: Plan[] = [
  { name:"Starter",       price:"19",  productId:"pdt_0NeCdmQE5gOZo2WER3XE2", tier:"starter" },
  { name:"Professionnel", price:"35",  productId:"pdt_0NeCdv6Pkc5C3Z4Pnno5Q", tier:"pro"     },
  { name:"Cadre",         price:"55",  productId:"pdt_0NeCe2Pfl1hs6WDESYmgB", tier:"cadre"   },
];

const PLAN_FEATURES: Record<string,string[]> = {
  Starter:       ["1 CV optimisé ATS","Téléchargement PDF","Reformulation professionnelle","Livraison instantanée"],
  Professionnel: ["Amélioration avancée","PDF téléchargeable","Lettre de motivation incluse","Résumé LinkedIn généré","Résultats quantifiés"],
  Cadre:         ["Réécriture exécutive","PDF téléchargeable","Lettre de motivation + Bio","Questions d'entretien IA","Vocabulaire C-Suite"],
};

// ── STORAGE HELPERS ────────────────────────────────────────────────────────
function safeSetStorage(key: string, value: string, storage: Storage = sessionStorage): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`Storage quota exceeded for key: ${key}`);
    return false;
  }
}

function safeGetStorage(key: string, storage: Storage = sessionStorage): string | null {
  try {
    return storage.getItem(key);
  } catch (e) {
    console.warn(`Failed to read storage key: ${key}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ── SHARED SECTION HELPERS ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// FIX: Increased all font sizes (section titles 10→11, body 10→11.5, bullets 10→11)
function Section({ title, children, accent="#1a1a1a" }: { title:string; children:React.ReactNode; accent?:string }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", borderBottom:`1.5px solid ${accent}`, paddingBottom:3, marginBottom:8, color:accent }}>{title}</div>
      {children}
    </div>
  );
}
function SideSection({ title, children, light }: { title:string; children:React.ReactNode; light?:boolean }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:light?"rgba(255,255,255,0.45)":"#555", marginBottom:6 }}>{title}</div>
      {children}
    </div>
  );
}
function MSection({ title, children, accent }: { title:string; children:React.ReactNode; accent:string }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:accent, borderBottom:`1.5px solid ${accent}`, paddingBottom:3, marginBottom:8, display:"inline-block" }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}
function ASection({ title, accent, children }: { title:string; accent:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:accent }}>{title}</div>
        <div style={{ flex:1, height:1.5, background:"#e2e8f0" }}/>
      </div>
      {children}
    </div>
  );
}
function BSection({ title, accent, children }: { title:string; accent:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:accent, marginBottom:8, borderLeft:`3px solid ${accent}`, paddingLeft:8 }}>{title}</div>
      {children}
    </div>
  );
}
function DSection({ title, children, accent="#1e293b" }: { title:string; children:React.ReactNode; accent?:string }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:accent, borderBottom:`1.5px solid ${accent}`, paddingBottom:3, marginBottom:8, display:"inline-block" }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── CV TEMPLATE RENDERERS (FIX: Increased all font sizes) ─────────────────
// ═══════════════════════════════════════════════════════════════════════════

type TplProps = { cv: CVData; scale?: number; accent?: string; font?: string; hidden?: string[] };

// ── 1. CLASSIQUE ──────────────────────────────────────────────────────────
function TplClassique({ cv, scale=1, accent="#1a1a1a", font="'Georgia',serif", hidden=[] }: TplProps) {
  return (
    <div style={{ width:A4_W, minHeight:A4_H, background:"white", fontFamily:font, color:"#1a1a1a", padding:"32px 48px 28px", transform:`scale(${scale})`, transformOrigin:"top left", boxSizing:"border-box" }}>
      {/* Header */}
      <div style={{ textAlign:"center", borderBottom:`2px solid ${accent}`, paddingBottom:14, marginBottom:16 }}>
        <div style={{ fontSize:26, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:5, color:accent }}>{cv.name}</div>
        <div style={{ fontSize:13, color:"#444", letterSpacing:"0.04em", marginBottom:7 }}>{cv.title}</div>
        <div style={{ fontSize:11, color:"#555", display:"flex", justifyContent:"center", gap:16, flexWrap:"wrap" }}>
          <span>{cv.email}</span><span>·</span><span>{cv.phone}</span><span>·</span><span>{cv.location}</span>
        </div>
      </div>
      {!hidden.includes("profile") && <Section title="Profil Professionnel" accent={accent}><p style={{ fontSize:11.5, lineHeight:1.6, color:"#333", margin:0 }}>{cv.profile}</p></Section>}
      {!hidden.includes("experience") && <Section title="Expériences Professionnelles" accent={accent}>{cv.experiences.map((e,i)=>(
        <div key={i} style={{ marginBottom:11 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <div style={{ fontSize:12.5, fontWeight:700 }}>{e.role} — {e.company}</div>
            <div style={{ fontSize:10.5, color:"#666", flexShrink:0, marginLeft:10 }}>{e.period}</div>
          </div>
          <ul style={{ paddingLeft:18, margin:0 }}>{e.bullets.map((b,j)=><li key={j} style={{ fontSize:11, lineHeight:1.55, color:"#333" }}>{b}</li>)}</ul>
        </div>
      ))}</Section>}
      {!hidden.includes("education") && <Section title="Formation" accent={accent}>{cv.education.map((e,i)=>(
        <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <div><span style={{ fontSize:11.5, fontWeight:700 }}>{e.degree}</span> <span style={{ fontSize:11.5, color:"#444" }}>— {e.school}</span></div>
          <div style={{ fontSize:10.5, color:"#666" }}>{e.year}</div>
        </div>
      ))}</Section>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        {!hidden.includes("skills") && <Section title="Compétences" accent={accent}><div style={{ display:"flex", flexWrap:"wrap", gap:"4px 12px" }}>{cv.skills.map((s,i)=><span key={i} style={{ fontSize:11, color:"#333" }}>• {s}</span>)}</div></Section>}
        {!hidden.includes("languages") && <Section title="Langues" accent={accent}>{cv.languages.map((l,i)=><div key={i} style={{ fontSize:11, marginBottom:4 }}><strong>{l.lang}</strong> — {l.level}</div>)}</Section>}
      </div>
      {!hidden.includes("certifications") && cv.certifications && cv.certifications.length>0 && <Section title="Certifications" accent={accent}>{cv.certifications.map((c,i)=><div key={i} style={{ fontSize:11, marginBottom:4 }}>• {c}</div>)}</Section>}
    </div>
  );
}

// ── 2. MODERNE ────────────────────────────────────────────────────────────
function TplModerne({ cv, scale=1, accent="#1e3a5f", font="'Inter',sans-serif", hidden=[] }: TplProps) {
  return (
    <div style={{ width:A4_W, minHeight:A4_H, fontFamily:font, display:"flex", transform:`scale(${scale})`, transformOrigin:"top left", background:`linear-gradient(to right, ${accent} 220px, white 220px)`, boxSizing:"border-box" }}>
      {/* Sidebar */}
      <div style={{ width:220, padding:"24px 18px", flexShrink:0, boxSizing:"border-box" }}>
        {cv.photo ? (
          <img src={cv.photo} alt={cv.name} style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover", marginBottom:16, border:"3px solid rgba(255,255,255,0.2)" }}/>
        ) : (
          <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:800, color:"white", marginBottom:16 }}>
            {cv.name.charAt(0)}
          </div>
        )}
        <div style={{ fontSize:15, fontWeight:800, color:"white", marginBottom:4, lineHeight:1.2 }}>{cv.name}</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:20, lineHeight:1.4 }}>{cv.title}</div>
        <SideSection title="Contact" light>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)", lineHeight:2 }}>
            <div>✉ {cv.email}</div><div>📞 {cv.phone}</div><div>📍 {cv.location}</div>
          </div>
        </SideSection>
        {!hidden.includes("skills") && <SideSection title="Compétences" light>
          {cv.skills.map((s,i)=>(
            <div key={i} style={{ marginBottom:5 }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.85)", marginBottom:3 }}>{s}</div>
              <div style={{ height:2.5, background:"rgba(255,255,255,0.15)", borderRadius:2 }}>
                <div style={{ height:2.5, background:"#3b82f6", borderRadius:2, width:`${75+((i*13)%25)}%` }}/>
              </div>
            </div>
          ))}
        </SideSection>}
        {!hidden.includes("languages") && <SideSection title="Langues" light>
          {cv.languages.map((l,i)=><div key={i} style={{ fontSize:10, color:"rgba(255,255,255,0.8)", marginBottom:4 }}>{l.lang} <span style={{ color:"#93c5fd" }}>— {l.level}</span></div>)}
        </SideSection>}
        {!hidden.includes("certifications") && cv.certifications && <SideSection title="Certifications" light>{cv.certifications.map((c,i)=><div key={i} style={{ fontSize:10, color:"rgba(255,255,255,0.7)", marginBottom:4, lineHeight:1.5 }}>• {c}</div>)}</SideSection>}
      </div>
      {/* Main */}
      <div style={{ flex:1, padding:"24px 24px" }}>
        {!hidden.includes("profile") && <div style={{ fontSize:12, color:"#374151", lineHeight:1.7, marginBottom:14, paddingBottom:12, borderBottom:"1.5px solid #e5e7eb" }}>{cv.profile}</div>}
        {!hidden.includes("experience") && <MSection title="Expériences" accent={accent}>
          {cv.experiences.map((e,i)=>(
            <div key={i} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{e.role}</div>
                <div style={{ fontSize:10, color:"#6b7280", background:"#f3f4f6", padding:"3px 8px", borderRadius:100, flexShrink:0, marginLeft:8, lineHeight:"1.5" }}>{e.period}</div>
              </div>
              <div style={{ fontSize:11, color:accent, fontWeight:600, marginBottom:4 }}>{e.company}</div>
              <ul style={{ paddingLeft:16, margin:0 }}>{e.bullets.map((b,j)=><li key={j} style={{ fontSize:11, lineHeight:1.6, color:"#374151" }}>{b}</li>)}</ul>
            </div>
          ))}
        </MSection>}
        {!hidden.includes("education") && <MSection title="Formation" accent={accent}>{cv.education.map((e,i)=>(
          <div key={i} style={{ marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{e.degree}</div>
            <div style={{ fontSize:11, color:"#6b7280" }}>{e.school} · {e.year}</div>
          </div>
        ))}</MSection>}
      </div>
    </div>
  );
}

// ── 3. MINIMALISTE ────────────────────────────────────────────────────────
function TplMinimal({ cv, scale=1, accent="#0ea5e9", font="'Helvetica Neue',Helvetica,sans-serif", hidden=[] }: TplProps) {
  return (
    <div style={{ width:A4_W, minHeight:A4_H, background:"white", fontFamily:font, padding:"36px 52px 28px", transform:`scale(${scale})`, transformOrigin:"top left", boxSizing:"border-box" }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:30, fontWeight:300, color:"#0f172a", letterSpacing:"-0.02em", marginBottom:4 }}>{cv.name}</div>
        <div style={{ fontSize:13, color:"#64748b", marginBottom:12 }}>{cv.title}</div>
        <div style={{ display:"flex", gap:24, fontSize:11, color:"#94a3b8" }}>
          <span>{cv.email}</span><span>{cv.phone}</span><span>{cv.location}</span>
        </div>
      </div>
      <div style={{ height:1.5, background:"#e2e8f0", marginBottom:24 }}/>
      {!hidden.includes("profile") && <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:accent, marginBottom:10 }}>À Propos</div>
        <p style={{ fontSize:12, lineHeight:1.8, color:"#475569", margin:0 }}>{cv.profile}</p>
      </div>}
      {!hidden.includes("experience") && <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:accent, marginBottom:14 }}>Expérience</div>
        {cv.experiences.map((e,i)=>(
          <div key={i} style={{ display:"grid", gridTemplateColumns:"130px 1fr", gap:18, marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, color:"#64748b", lineHeight:1.5 }}>{e.period}</div>
              <div style={{ fontSize:11, color:accent, fontWeight:500 }}>{e.company}</div>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:"#0f172a", marginBottom:5 }}>{e.role}</div>
              {e.bullets.map((b,j)=><div key={j} style={{ fontSize:11, color:"#475569", lineHeight:1.6, marginBottom:3 }}>— {b}</div>)}
            </div>
          </div>
        ))}
      </div>}
      <div style={{ height:1.5, background:"#e2e8f0", marginBottom:20 }}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:24 }}>
        {!hidden.includes("education") && <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:accent, marginBottom:10 }}>Formation</div>
          {cv.education.map((e,i)=><div key={i} style={{ marginBottom:8 }}><div style={{ fontSize:11.5, fontWeight:500, color:"#0f172a" }}>{e.degree}</div><div style={{ fontSize:10.5, color:"#64748b" }}>{e.school} · {e.year}</div></div>)}
        </div>}
        {!hidden.includes("skills") && <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:accent, marginBottom:10 }}>Compétences</div>
          {cv.skills.map((s,i)=><div key={i} style={{ fontSize:11, color:"#475569", marginBottom:4 }}>{s}</div>)}
        </div>}
        {!hidden.includes("languages") && <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:accent, marginBottom:10 }}>Langues</div>
          {cv.languages.map((l,i)=><div key={i} style={{ fontSize:11, color:"#475569", marginBottom:4 }}>{l.lang} <span style={{ color:"#94a3b8" }}>/ {l.level}</span></div>)}
        </div>}
      </div>
    </div>
  );
}

// ── 4. EXÉCUTIF ───────────────────────────────────────────────────────────
function TplExecutif({ cv, scale=1, accent="#d4af37", font="'Georgia',serif", hidden=[] }: TplProps) {
  return (
    <div style={{ width:A4_W, minHeight:A4_H, background:"#0c0a09", fontFamily:font, transform:`scale(${scale})`, transformOrigin:"top left", boxSizing:"border-box" }}>
      <div style={{ background:"linear-gradient(135deg,#1c1410,#2d1f0e)", padding:"36px 52px 28px", borderBottom:`2px solid ${accent}` }}>
        <div style={{ fontSize:28, fontWeight:700, color:"#f5f0e8", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:5 }}>{cv.name}</div>
        <div style={{ fontSize:13, color:accent, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>{cv.title}</div>
        <div style={{ display:"flex", gap:20, fontSize:11, color:"rgba(255,255,255,0.5)" }}>
          <span>{cv.email}</span><span>|</span><span>{cv.phone}</span><span>|</span><span>{cv.location}</span>
        </div>
      </div>
      <div style={{ padding:"28px 52px" }}>
        {!hidden.includes("profile") && <div style={{ marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${accent}33` }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:accent, marginBottom:10 }}>Profil Exécutif</div>
          <p style={{ fontSize:12, lineHeight:1.8, color:"rgba(255,255,255,0.75)", fontStyle:"italic", margin:0 }}>{cv.profile}</p>
        </div>}
        {!hidden.includes("experience") && <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:accent, marginBottom:14 }}>Parcours Professionnel</div>
          {cv.experiences.map((e,i)=>(
            <div key={i} style={{ marginBottom:16, paddingLeft:14, borderLeft:`2px solid ${accent}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#f5f0e8" }}>{e.role}</div>
                <div style={{ fontSize:11, color:accent }}>{e.period}</div>
              </div>
              <div style={{ fontSize:11, color:accent, opacity:0.7, marginBottom:5 }}>{e.company}</div>
              {e.bullets.map((b,j)=><div key={j} style={{ fontSize:11, color:"rgba(255,255,255,0.65)", lineHeight:1.6, marginBottom:3 }}>◆ {b}</div>)}
            </div>
          ))}
        </div>}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>
          {!hidden.includes("education") && <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:accent, marginBottom:12 }}>Formation</div>
            {cv.education.map((e,i)=><div key={i} style={{ marginBottom:10 }}><div style={{ fontSize:12, color:"#f5f0e8", fontWeight:600 }}>{e.degree}</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{e.school} · {e.year}</div></div>)}
          </div>}
          <div>
            {!hidden.includes("skills") && <>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:accent, marginBottom:12 }}>Compétences Clés</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                {cv.skills.map((s,i)=><span key={i} style={{ fontSize:10, color:accent, border:`1px solid ${accent}55`, padding:"3px 10px", borderRadius:2, display:"inline-block", lineHeight:1.5 }}>{s}</span>)}
              </div>
            </>}
            {!hidden.includes("languages") && <>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:accent, marginBottom:10 }}>Langues</div>
              {cv.languages.map((l,i)=><div key={i} style={{ fontSize:11, color:"rgba(255,255,255,0.65)", marginBottom:4 }}>{l.lang} — {l.level}</div>)}
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 5. CRÉATIF ────────────────────────────────────────────────────────────
function TplCreatif({ cv, scale=1, accent="#7c3aed", font="'Inter',sans-serif", hidden=[] }: TplProps) {
  return (
    <div style={{ width:A4_W, minHeight:A4_H, background:"white", fontFamily:font, transform:`scale(${scale})`, transformOrigin:"top left", boxSizing:"border-box" }}>
      <div style={{ height:7, background:`linear-gradient(90deg,${accent},#ec4899,#f97316)` }}/>
      <div style={{ padding:"30px 48px 28px" }}>
        <div style={{ marginBottom:22, display:"flex", alignItems:"flex-start", gap:18 }}>
          {cv.photo && <img src={cv.photo} alt={cv.name} style={{ width:72, height:72, borderRadius:12, objectFit:"cover", flexShrink:0, border:`2px solid ${accent}44` }}/>}
          <div>
            <div style={{ fontSize:30, fontWeight:900, color:"#0f172a", letterSpacing:"-0.03em", lineHeight:1, marginBottom:5 }}>{cv.name}</div>
            <div style={{ fontSize:14, fontWeight:600, color:accent, marginBottom:10 }}>{cv.title}</div>
            <div style={{ display:"flex", gap:18, fontSize:11, color:"#6b7280", flexWrap:"wrap" }}>
              <span>✉ {cv.email}</span><span>📞 {cv.phone}</span><span>📍 {cv.location}</span>
            </div>
          </div>
        </div>
        {!hidden.includes("profile") && <div style={{ borderLeft:`4px solid ${accent}`, paddingLeft:14, marginBottom:22 }}>
          <p style={{ fontSize:12, lineHeight:1.7, color:"#374151", margin:0 }}>{cv.profile}</p>
        </div>}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 250px", gap:32 }}>
          <div>
            {!hidden.includes("experience") && <>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:accent, marginBottom:12 }}>Expériences</div>
              {cv.experiences.map((e,i)=>(
                <div key={i} style={{ marginBottom:16, position:"relative", paddingLeft:14 }}>
                  <div style={{ position:"absolute", left:0, top:5, width:6, height:6, borderRadius:"50%", background:accent }}/>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{e.role}</div>
                  <div style={{ fontSize:11, color:accent, marginBottom:4 }}>{e.company} · <span style={{ color:"#9ca3af" }}>{e.period}</span></div>
                  {e.bullets.map((b,j)=><div key={j} style={{ fontSize:11, color:"#374151", lineHeight:1.6 }}>→ {b}</div>)}
                </div>
              ))}
            </>}
            {!hidden.includes("education") && <>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:accent, marginBottom:10, marginTop:16 }}>Formation</div>
              {cv.education.map((e,i)=>(
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{e.degree}</div>
                  <div style={{ fontSize:11, color:"#6b7280" }}>{e.school} · {e.year}</div>
                </div>
              ))}
            </>}
          </div>
          <div>
            {!hidden.includes("skills") && <>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:accent, marginBottom:10 }}>Compétences</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:18 }}>
                {cv.skills.map((s,i)=>(
                  <span key={i} style={{ fontSize:10, background:`${accent}18`, color:accent, padding:"4px 10px", borderRadius:100, fontWeight:600, display:"inline-block", lineHeight:1.4 }}>{s}</span>
                ))}
              </div>
            </>}
            {!hidden.includes("languages") && <>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:accent, marginBottom:10 }}>Langues</div>
              {cv.languages.map((l,i)=>(
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                    <span style={{ fontWeight:600, color:"#0f172a" }}>{l.lang}</span>
                    <span style={{ color:"#6b7280" }}>{l.level}</span>
                  </div>
                  <div style={{ height:3.5, background:"#f3f4f6", borderRadius:2 }}>
                    <div style={{ height:3.5, borderRadius:2, width:l.level==="Natif"?"100%":l.level==="Courant"?"85%":"55%", background:accent }}/>
                  </div>
                </div>
              ))}
            </>}
            {!hidden.includes("certifications") && cv.certifications && cv.certifications.length>0 && <>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:accent, marginBottom:10, marginTop:14 }}>Certifications</div>
              {cv.certifications.map((c,i)=><div key={i} style={{ fontSize:11, color:"#374151", marginBottom:5 }}>🏅 {c}</div>)}
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 6. AZURILL ────────────────────────────────────────────────────────────
function TplAzurill({ cv, scale=1, accent="#0d9488", font="'Calibri','Segoe UI',sans-serif", hidden=[] }: TplProps) {
  return (
    <div style={{ width:A4_W, minHeight:A4_H, background:"white", fontFamily:font, padding:"40px 52px 28px", transform:`scale(${scale})`, transformOrigin:"top left", color:"#1e293b", boxSizing:"border-box" }}>
      <div style={{ textAlign:"center", marginBottom:20 }}>
        {cv.photo && <img src={cv.photo} alt={cv.name} style={{ width:76, height:76, borderRadius:"50%", objectFit:"cover", marginBottom:12, border:`3px solid ${accent}55`, display:"block", margin:"0 auto 12px" }}/>}
        <div style={{ fontSize:28, fontWeight:800, color:"#0f172a", letterSpacing:"-0.02em", marginBottom:4 }}>{cv.name}</div>
        <div style={{ fontSize:14, color:accent, fontWeight:600, marginBottom:10 }}>{cv.title}</div>
        <div style={{ display:"flex", justifyContent:"center", gap:18, fontSize:11, color:"#64748b", flexWrap:"wrap" }}>
          <span>✉ {cv.email}</span><span>📞 {cv.phone}</span><span>📍 {cv.location}</span>
        </div>
      </div>
      <div style={{ height:4, background:`linear-gradient(90deg,${accent},${accent}99,${accent})`, borderRadius:2, marginBottom:18 }}/>
      {!hidden.includes("profile") && <ASection title="Résumé" accent={accent}><p style={{ fontSize:12, lineHeight:1.7, color:"#334155", margin:0 }}>{cv.profile}</p></ASection>}
      {!hidden.includes("experience") && <ASection title="Expérience Professionnelle" accent={accent}>
        {cv.experiences.map((e,i)=>(
          <div key={i} style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:3 }}>
              <div>
                <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{e.role}</span>
                <span style={{ fontSize:12, color:accent, fontWeight:600 }}> · {e.company}</span>
              </div>
              <span style={{ fontSize:11, color:"#94a3b8", flexShrink:0, marginLeft:10, background:"#f1f5f9", padding:"2px 8px", borderRadius:100, display:"inline-block", lineHeight:1.5 }}>{e.period}</span>
            </div>
            <ul style={{ paddingLeft:16, margin:0 }}>
              {e.bullets.map((b,j)=><li key={j} style={{ fontSize:11, lineHeight:1.6, color:"#334155", marginBottom:1 }}>{b}</li>)}
            </ul>
          </div>
        ))}
      </ASection>}
      {!hidden.includes("education") && <ASection title="Formation" accent={accent}>
        {cv.education.map((e,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{e.degree}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{e.school}</div>
            </div>
            <div style={{ fontSize:11, color:"#94a3b8", flexShrink:0 }}>{e.year}</div>
          </div>
        ))}
      </ASection>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:28 }}>
        {!hidden.includes("skills") && <ASection title="Compétences" accent={accent}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {cv.skills.map((s,i)=>(
              <span key={i} style={{ fontSize:10, background:`${accent}18`, color:accent, border:`1px solid ${accent}44`, padding:"3px 10px", borderRadius:100, fontWeight:600, display:"inline-block", lineHeight:1.5 }}>{s}</span>
            ))}
          </div>
        </ASection>}
        {!hidden.includes("languages") && <ASection title="Langues" accent={accent}>
          {cv.languages.map((l,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6, alignItems:"center" }}>
              <span style={{ fontWeight:600, color:"#0f172a" }}>{l.lang}</span>
              <span style={{ fontSize:10, color:accent, background:`${accent}18`, padding:"2px 9px", borderRadius:100, border:`1px solid ${accent}44`, display:"inline-block", lineHeight:1.5 }}>{l.level}</span>
            </div>
          ))}
          {!hidden.includes("certifications") && cv.certifications?.map((c,i)=>(
            <div key={i} style={{ fontSize:11, color:"#334155", marginBottom:4 }}>🏅 {c}</div>
          ))}
        </ASection>}
      </div>
    </div>
  );
}

// ── 7. BRONZOR ────────────────────────────────────────────────────────────
function TplBronzor({ cv, scale=1, accent="#6366f1", font="'Inter',sans-serif", hidden=[] }: TplProps) {
  return (
    <div style={{ width:A4_W, minHeight:A4_H, background:"white", fontFamily:font, display:"flex", transform:`scale(${scale})`, transformOrigin:"top left", boxSizing:"border-box" }}>
      <div style={{ flex:1, padding:"36px 32px 36px 40px", borderRight:"1px solid #e2e8f0" }}>
        <div style={{ marginBottom:20, paddingBottom:16, borderBottom:"2px solid #f1f5f9" }}>
          <div style={{ fontSize:26, fontWeight:800, color:"#0f172a", letterSpacing:"-0.02em", marginBottom:4 }}>{cv.name}</div>
          <div style={{ fontSize:14, color:accent, fontWeight:600 }}>{cv.title}</div>
        </div>
        {!hidden.includes("profile") && <BSection title="Profil" accent={accent}><p style={{ fontSize:12, lineHeight:1.7, color:"#475569", margin:0 }}>{cv.profile}</p></BSection>}
        {!hidden.includes("experience") && <BSection title="Expériences" accent={accent}>
          {cv.experiences.map((e,i)=>(
            <div key={i} style={{ marginBottom:14, paddingLeft:12, borderLeft:`2px solid ${accent}33` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{e.role}</div>
                <div style={{ fontSize:10, color:accent, background:`${accent}18`, padding:"3px 8px", borderRadius:100, flexShrink:0, marginLeft:8, fontWeight:600, lineHeight:"1.5" }}>{e.period}</div>
              </div>
              <div style={{ fontSize:11, color:accent, fontWeight:600, marginBottom:4 }}>{e.company}</div>
              {e.bullets.map((b,j)=><div key={j} style={{ fontSize:11, color:"#475569", lineHeight:1.6, marginBottom:3, paddingLeft:8 }}>· {b}</div>)}
            </div>
          ))}
        </BSection>}
        {!hidden.includes("education") && <BSection title="Formation" accent={accent}>
          {cv.education.map((e,i)=>(
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{e.degree}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{e.school} · {e.year}</div>
            </div>
          ))}
        </BSection>}
      </div>
      <div style={{ width:190, background:"#f8fafc", padding:"36px 18px", flexShrink:0 }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:accent, marginBottom:12 }}>Contact</div>
          {[cv.email, cv.phone, cv.location].map((v,i)=>(
            <div key={i} style={{ fontSize:10, color:"#475569", marginBottom:6, lineHeight:1.6, wordBreak:"break-all" }}>{v}</div>
          ))}
        </div>
        {!hidden.includes("skills") && <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:accent, marginBottom:12 }}>Compétences</div>
          {cv.skills.map((s,i)=>(
            <div key={i} style={{ marginBottom:8 }}>
              <div style={{ fontSize:10, color:"#334155", marginBottom:3, fontWeight:500 }}>{s}</div>
              <div style={{ height:2.5, background:"#e2e8f0", borderRadius:2 }}>
                <div style={{ height:2.5, background:accent, borderRadius:2, width:`${70+((i*11)%30)}%` }}/>
              </div>
            </div>
          ))}
        </div>}
        {!hidden.includes("languages") && <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:accent, marginBottom:12 }}>Langues</div>
          {cv.languages.map((l,i)=>(
            <div key={i} style={{ marginBottom:9 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:3 }}>
                <span style={{ fontWeight:600, color:"#334155" }}>{l.lang}</span>
                <span style={{ color:"#94a3b8" }}>{l.level}</span>
              </div>
              <div style={{ height:2.5, background:"#e2e8f0", borderRadius:2 }}>
                <div style={{ height:2.5, background:`${accent}99`, borderRadius:2, width:l.level==="Natif"?"100%":l.level==="Courant"?"80%":"50%" }}/>
              </div>
            </div>
          ))}
        </div>}
        {!hidden.includes("certifications") && cv.certifications && cv.certifications.length>0 && (
          <div>
            <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:accent, marginBottom:10 }}>Certifications</div>
            {cv.certifications.map((c,i)=><div key={i} style={{ fontSize:10, color:"#475569", marginBottom:6, lineHeight:1.6 }}>✦ {c}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 8. DITTO ──────────────────────────────────────────────────────────────
function TplDitto({ cv, scale=1, accent="#1e293b", font="'Georgia',serif", hidden=[] }: TplProps) {
  return (
    <div style={{ width:A4_W, minHeight:A4_H, background:"white", fontFamily:font, transform:`scale(${scale})`, transformOrigin:"top left", boxSizing:"border-box" }}>
      <div style={{ background:accent, padding:"32px 40px 24px" }}>
        <div style={{ fontSize:28, fontWeight:700, color:"white", letterSpacing:"0.04em", textTransform:"uppercase", marginBottom:4 }}>{cv.name}</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:12 }}>{cv.title}</div>
        <div style={{ display:"flex", gap:22, fontSize:11, color:"rgba(255,255,255,0.5)", flexWrap:"wrap" }}>
          <span>✉ {cv.email}</span><span>📞 {cv.phone}</span><span>📍 {cv.location}</span>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
        <div style={{ padding:"24px 24px 24px 40px", borderRight:"1px solid #e2e8f0" }}>
          {!hidden.includes("profile") && <DSection title="Profil" accent={accent}><p style={{ fontSize:12, lineHeight:1.7, color:"#334155", margin:0 }}>{cv.profile}</p></DSection>}
          {!hidden.includes("education") && <DSection title="Formation" accent={accent}>{cv.education.map((e,i)=>(<div key={i} style={{ marginBottom:12 }}><div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{e.degree}</div><div style={{ fontSize:11, color:"#64748b" }}>{e.school}</div><div style={{ fontSize:10, color:"#94a3b8" }}>{e.year}</div></div>))}</DSection>}
          {!hidden.includes("skills") && <DSection title="Compétences" accent={accent}><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 8px" }}>{cv.skills.map((s,i)=>(<div key={i} style={{ fontSize:11, color:"#334155", display:"flex", alignItems:"center", gap:5 }}><div style={{ width:4, height:4, borderRadius:"50%", background:accent, flexShrink:0 }}/>{s}</div>))}</div></DSection>}
          {!hidden.includes("languages") && <DSection title="Langues" accent={accent}>{cv.languages.map((l,i)=>(<div key={i} style={{ fontSize:12, marginBottom:5 }}><strong style={{ color:"#0f172a" }}>{l.lang}</strong><span style={{ color:"#64748b" }}> — {l.level}</span></div>))}</DSection>}
        </div>
        <div style={{ padding:"24px 40px 24px 24px" }}>
          {!hidden.includes("experience") && <DSection title="Expériences Professionnelles" accent={accent}>{cv.experiences.map((e,i)=>(<div key={i} style={{ marginBottom:16 }}><div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:1 }}>{e.role}</div><div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}><div style={{ fontSize:11, color:"#475569", fontStyle:"italic" }}>{e.company}</div><div style={{ fontSize:10, color:"#94a3b8" }}>{e.period}</div></div><ul style={{ paddingLeft:14, margin:0 }}>{e.bullets.map((b,j)=><li key={j} style={{ fontSize:11, lineHeight:1.6, color:"#334155", marginBottom:1 }}>{b}</li>)}</ul></div>))}</DSection>}
          {!hidden.includes("certifications") && cv.certifications && cv.certifications.length>0 && <DSection title="Certifications" accent={accent}>{cv.certifications.map((c,i)=>(<div key={i} style={{ fontSize:11, color:"#334155", marginBottom:5 }}>🏅 {c}</div>))}</DSection>}
        </div>
      </div>
    </div>
  );
}

// ── 9. LEAFISH ────────────────────────────────────────────────────────────
function TplLeafish({ cv, scale=1, accent="#16a34a", font="'Inter',sans-serif", hidden=[] }: TplProps) {
  return (
    <div style={{ width:A4_W, minHeight:A4_H, background:"#fafaf9", fontFamily:font, transform:`scale(${scale})`, transformOrigin:"top left", boxSizing:"border-box" }}>
      <div style={{ background:"white", borderBottom:`3px solid ${accent}`, padding:"32px 44px 24px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:150, height:"100%", background:`linear-gradient(135deg,${accent}18,${accent}33)`, opacity:0.6 }}/>
        <div style={{ position:"relative", display:"flex", alignItems:"flex-start", gap:18 }}>
          {cv.photo && <img src={cv.photo} alt={cv.name} style={{ width:68, height:68, borderRadius:10, objectFit:"cover", flexShrink:0, border:`2px solid ${accent}55` }}/>}
          <div>
            <div style={{ fontSize:28, fontWeight:800, color:"#0f172a", letterSpacing:"-0.02em", marginBottom:4 }}>{cv.name}</div>
            <div style={{ fontSize:14, color:accent, fontWeight:700, marginBottom:10 }}>{cv.title}</div>
            <div style={{ display:"flex", gap:18, fontSize:11, color:"#64748b", flexWrap:"wrap" }}>
              <span>✉ {cv.email}</span><span>📞 {cv.phone}</span><span>📍 {cv.location}</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding:"24px 44px", display:"grid", gridTemplateColumns:"1fr 200px", gap:32 }}>
        <div>
          {!hidden.includes("profile") && <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:accent, marginBottom:10 }}>À Propos</div>
            <p style={{ fontSize:12, lineHeight:1.7, color:"#374151", margin:0 }}>{cv.profile}</p>
          </div>}
          <div>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:accent, marginBottom:14 }}>Parcours</div>
            <div style={{ position:"relative", paddingLeft:22 }}>
              <div style={{ position:"absolute", left:6, top:8, bottom:0, width:2, background:`${accent}44`, borderRadius:2 }}/>
              {!hidden.includes("experience") && cv.experiences.map((e,i)=>(
                <div key={i} style={{ position:"relative", marginBottom:16 }}>
                  <div style={{ position:"absolute", left:-22, top:4, width:12, height:12, borderRadius:"50%", background:accent, border:"2px solid white", boxShadow:`0 0 0 2px ${accent}` }}/>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:3 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{e.role}</div>
                    <div style={{ fontSize:10, color:"#6b7280", background:`${accent}18`, border:`1px solid ${accent}44`, padding:"2px 8px", borderRadius:100, flexShrink:0, marginLeft:8, lineHeight:"1.5" }}>{e.period}</div>
                  </div>
                  <div style={{ fontSize:11, color:accent, fontWeight:600, marginBottom:4 }}>{e.company}</div>
                  {e.bullets.map((b,j)=><div key={j} style={{ fontSize:11, color:"#374151", lineHeight:1.6, marginBottom:3 }}>→ {b}</div>)}
                </div>
              ))}
              {!hidden.includes("education") && cv.education.map((e,i)=>(
                <div key={i} style={{ position:"relative", marginBottom:12 }}>
                  <div style={{ position:"absolute", left:-22, top:4, width:12, height:12, borderRadius:"50%", background:"white", border:`2px solid ${accent}` }}/>
                  <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{e.degree}</div>
                  <div style={{ fontSize:11, color:"#6b7280" }}>{e.school} · {e.year}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          {!hidden.includes("skills") && <div style={{ background:"white", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"14px", marginBottom:12 }}>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:accent, marginBottom:10 }}>Compétences</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {cv.skills.map((s,i)=>(
                <span key={i} style={{ fontSize:10, background:`${accent}18`, color:accent, border:`1px solid ${accent}44`, padding:"3px 9px", borderRadius:100, fontWeight:600, display:"inline-block", lineHeight:1.5 }}>{s}</span>
              ))}
            </div>
          </div>}
          {!hidden.includes("languages") && <div style={{ background:"white", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"14px", marginBottom:12 }}>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:accent, marginBottom:10 }}>Langues</div>
            {cv.languages.map((l,i)=>(
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                  <span style={{ fontWeight:600, color:"#0f172a" }}>{l.lang}</span>
                  <span style={{ color:"#6b7280", fontSize:10 }}>{l.level}</span>
                </div>
                <div style={{ height:3.5, background:"#f3f4f6", borderRadius:100 }}>
                  <div style={{ height:3.5, borderRadius:100, background:accent, width:l.level==="Natif"?"100%":l.level==="Courant"?"82%":"50%" }}/>
                </div>
              </div>
            ))}
          </div>}
          {!hidden.includes("certifications") && cv.certifications && cv.certifications.length>0 && (
            <div style={{ background:"white", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"14px" }}>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:accent, marginBottom:10 }}>Certifications</div>
              {cv.certifications.map((c,i)=>(
                <div key={i} style={{ fontSize:10, color:"#374151", marginBottom:6, lineHeight:1.6 }}>🏅 {c}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── RENDER CV BY TEMPLATE ID ───────────────────────────────────────────────
function RenderCV({ id, cv, scale=1, accent, font, hidden=[] }: { id:number; cv:CVData; scale?:number; accent?:string; font?:string; hidden?:string[] }) {
  const p = { cv, scale, accent, font, hidden };
  if (id===1) return <TplClassique {...p}/>;
  if (id===2) return <TplModerne   {...p}/>;
  if (id===3) return <TplMinimal   {...p}/>;
  if (id===4) return <TplExecutif  {...p}/>;
  if (id===5) return <TplCreatif   {...p}/>;
  if (id===6) return <TplAzurill   {...p}/>;
  if (id===7) return <TplBronzor   {...p}/>;
  if (id===8) return <TplDitto     {...p}/>;
  if (id===9) return <TplLeafish   {...p}/>;
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── PDF PRINT ENGINE ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
function buildPrintHTML(cvHtml: string, styles: string, fontLinks: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
${fontLinks}
${styles}
<style>
  @page { size: 210mm 297mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: white; width: 210mm; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  @media screen { html { background: #d0d0d0; padding: 20px 0; min-height: 100vh; } body { width: 210mm; margin: 0 auto; box-shadow: 0 4px 40px rgba(0,0,0,.3); } #cv-wrap { background: white; } }
  @media print { html, body { background: white !important; } #cv-wrap { width: 210mm !important; } }
  #cv-wrap { width: 794px; background: white; overflow: hidden; }
</style>
</head>
<body>
<div id="cv-wrap">${cvHtml}</div>
<script>
  document.fonts.ready.then(function() {
    setTimeout(function() { window.print(); }, 500);
  });
</script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── MAIN PAGE COMPONENT ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export default function CVPage() {
  const [mode,        setMode]        = useState<Mode>("upload");
  const [step,        setStep]        = useState<Step>(1);
  const [selectedTpl, setSelectedTpl] = useState<number>(1);
  const [previewTpl,  setPreviewTpl]  = useState<number|null>(null);

  const [preferredPages,    setPreferredPages]    = useState<1|2>(1);
  const preferredPagesRef                         = useRef<1|2>(1);
  const [editorAccent,      setEditorAccent]      = useState<string>("");
  const [editorFont,        setEditorFont]        = useState<string>("");
  const [hiddenSections,    setHiddenSections]    = useState<string[]>([]);
  const [editorTab,         setEditorTab]         = useState<"template"|"color"|"font"|"sections"|"content">("template");
  const [editingCv,         setEditingCv]         = useState<CVData|null>(null);

  const [uploadedFile,    setUploadedFile]    = useState<string|null>(null);
  const [uploadedContent, setUploadedContent] = useState<string>("");
  const [uploadedBase64,  setUploadedBase64]  = useState<string|null>(null);
  const [uploadedMime,    setUploadedMime]    = useState<string|null>(null);
  const [photoBase64,     setPhotoBase64]     = useState<string|null>(null);
  const [enhanceType,     setEnhanceType]     = useState("Optimisation ATS");
  const [uploadError,     setUploadError]     = useState<string|null>(null);
  const [uploadPaywall,   setUploadPaywall]   = useState(false);

  const [form, setForm] = useState({
    name:"", title:"", email:"", phone:"", location:"",
    industry:"", level:"", experience:"", education:"", skills:"", langs:"", notes:"",
  });

  const wasRedirectedFromPayment = useRef(
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("paid") === "true"
  );

  const [hasPaid,       setHasPaid]       = useState(false);
  const [currentPlan,   setCurrentPlan]   = useState<Plan>(PLANS[1]);
  const [purchasedPlan, setPurchasedPlan] = useState<Plan>(PLANS[0]);
  const purchasedPlanRef                  = useRef<Plan>(PLANS[0]);

  const [generating,  setGenerating]  = useState(false);
  const [pdfBusy,     setPdfBusy]     = useState(false);
  const [genStep,     setGenStep]     = useState(0);
  const [cvData,      setCvData]      = useState<CVData|null>(null);
  const [genError,    setGenError]    = useState<string|null>(null);

  const printRef     = useRef<HTMLDivElement>(null);

  const [justPaid,     setJustPaid]     = useState(false);
  const [tplSwitching, setTplSwitching] = useState(false);
  const [saveToast,    setSaveToast]    = useState(false);
  const [copied,       setCopied]       = useState<string|null>(null);
  const saveToastTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const copiedTimer    = useRef<ReturnType<typeof setTimeout>|null>(null);

  const [coverLetter,        setCoverLetter]        = useState<string|null>(null);
  const [linkedinSummary,    setLinkedinSummary]    = useState<string|null>(null);
  const [executiveBio,       setExecutiveBio]       = useState<string|null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<string[]|null>(null);
  const [bonusLoading,       setBonusLoading]       = useState(false);
  const [bonusError,         setBonusError]         = useState<string|null>(null);

  // FIX: Initialize freeGenUsed from localStorage on mount
  const [freeGenUsed, setFreeGenUsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tm_free_gen_used") === "1";
    }
    return false;
  });

  const uploadedBase64Ref  = useRef<string|null>(null);
  const uploadedMimeRef    = useRef<string|null>(null);
  const uploadedContentRef = useRef<string>("");
  const enhanceTypeRef     = useRef<string>("Optimisation ATS");
  const formRef            = useRef(form);
  const photoBase64Ref     = useRef<string|null>(null);

  const GEN_STEPS = ["Lecture du CV","Extraction des données","Application du modèle","Optimisation ATS","Finalisation"];

  // ── PAYMENT REDIRECT RESTORE ──────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") !== "true") return;
    window.history.replaceState({}, "", "/cv");

    const savedCv        = safeGetStorage("dodo_cv_data");
    const savedTpl       = safeGetStorage("dodo_cv_tpl");
    const savedAccent    = safeGetStorage("dodo_cv_accent");
    const savedFont      = safeGetStorage("dodo_cv_font");
    const savedHidden    = safeGetStorage("dodo_cv_hidden");
    const savedPlanT     = safeGetStorage("dodo_cv_plan") as PlanTier | null;
    const savedCover     = safeGetStorage("dodo_cv_cover");
    const savedLinkedin  = safeGetStorage("dodo_cv_linkedin");
    const savedBio       = safeGetStorage("dodo_cv_bio");
    const savedQuestions = safeGetStorage("dodo_cv_questions");
    const savedPhoto     = safeGetStorage("dodo_cv_photo");
    
    ["dodo_cv_data","dodo_cv_tpl","dodo_cv_accent","dodo_cv_font","dodo_cv_hidden","dodo_cv_plan",
     "dodo_cv_cover","dodo_cv_linkedin","dodo_cv_bio","dodo_cv_questions","dodo_cv_photo"]
      .forEach(k => { try { sessionStorage.removeItem(k); } catch {} });

    if (savedCv) {
      try {
        const cv = JSON.parse(savedCv) as CVData;
        if (savedPhoto) cv.photo = savedPhoto;
        setCvData(cv); setEditingCv(cv); setStep(5);
        if (savedTpl)    setSelectedTpl(Number(savedTpl));
        if (savedAccent) setEditorAccent(savedAccent);
        if (savedFont)   setEditorFont(savedFont);
        if (savedHidden) setHiddenSections(JSON.parse(savedHidden));
        const plan = PLANS.find(p => p.tier === savedPlanT) || PLANS[1];
        setCurrentPlan(plan); setPurchasedPlan(plan); purchasedPlanRef.current = plan;
      } catch (e) { console.error("Failed to restore CV data:", e); }
    }
    if (savedCover)     setCoverLetter(savedCover);
    if (savedLinkedin)  setLinkedinSummary(savedLinkedin);
    if (savedBio)       setExecutiveBio(savedBio);
    if (savedQuestions) { try { setInterviewQuestions(JSON.parse(savedQuestions)); } catch {} }
    setHasPaid(true);
    setJustPaid(true);
  }, []);

  // ── SESSION PERSISTENCE ───────────────────────────────────────────────
  useEffect(() => {
    if (step !== 5 || !cvData) return;
    safeSetStorage("cv_session", JSON.stringify({
      cvData: editingCv || cvData,
      step: 5, selectedTpl, editorAccent, editorFont, hiddenSections,
      planTier: currentPlan.tier, hasPaid,
      coverLetter, linkedinSummary, executiveBio,
    }));
    setSaveToast(true);
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    saveToastTimer.current = setTimeout(() => setSaveToast(false), 1800);
  }, [step, cvData, editingCv, selectedTpl, editorAccent, editorFont, hiddenSections, hasPaid, coverLetter, linkedinSummary, executiveBio, currentPlan]);

  useEffect(() => {
    if (wasRedirectedFromPayment.current) return;
    try {
      const raw = safeGetStorage("cv_session");
      if (!raw) return;
      const s = JSON.parse(raw);
      if (!s.cvData) return;
      setCvData(s.cvData); setEditingCv(s.cvData); setStep(5);
      if (s.selectedTpl)     setSelectedTpl(s.selectedTpl);
      if (s.editorAccent)    setEditorAccent(s.editorAccent);
      if (s.editorFont)      setEditorFont(s.editorFont);
      if (s.hiddenSections)  setHiddenSections(s.hiddenSections);
      if (s.coverLetter)     setCoverLetter(s.coverLetter);
      if (s.linkedinSummary) setLinkedinSummary(s.linkedinSummary);
      if (s.executiveBio)    setExecutiveBio(s.executiveBio);
      setHasPaid(s.hasPaid || false);
      const plan = PLANS.find(p => p.tier === s.planTier) || PLANS[1];
      setCurrentPlan(plan); setPurchasedPlan(plan); purchasedPlanRef.current = plan;
    } catch {}
  }, []);

  useEffect(()=>{ uploadedBase64Ref.current  = uploadedBase64;  }, [uploadedBase64]);
  useEffect(()=>{ uploadedMimeRef.current    = uploadedMime;    }, [uploadedMime]);
  useEffect(()=>{ uploadedContentRef.current = uploadedContent; }, [uploadedContent]);
  useEffect(()=>{ enhanceTypeRef.current     = enhanceType;     }, [enhanceType]);
  useEffect(()=>{ formRef.current            = form;            }, [form]);
  useEffect(()=>{ photoBase64Ref.current     = photoBase64;     }, [photoBase64]);

  // ── FILE UPLOAD ───────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    setUploadError(null); setUploadedFile(file.name);
    if (file.name.endsWith(".pdf")) {
      const r=new FileReader(); r.onload=e=>{const d=e.target?.result as string;if(d){setUploadedBase64(d.split(",")[1]);setUploadedMime("application/pdf");setUploadedContent("");}};
      r.readAsDataURL(file);
    } else {
      const r=new FileReader(); r.onload=e=>{setUploadedContent(e.target?.result as string??"");setUploadedBase64(null);setUploadedMime(null);};
      r.readAsText(file);
    }
  };

  // ── FIX: Improved generation prompt - preserves rich content with larger text ──
  const runGeneration = useCallback(async (src: Mode) => {
    const base64   = uploadedBase64Ref.current;
    const mime     = uploadedMimeRef.current;
    const content  = uploadedContentRef.current;
    const enhance  = enhanceTypeRef.current;
    const f        = formRef.current;
    const photo    = photoBase64Ref.current;
    const plan     = purchasedPlanRef.current;

    setGenerating(true); setGenError(null); setCvData(null); setGenStep(0);
    setCoverLetter(null); setLinkedinSummary(null); setExecutiveBio(null);
    setInterviewQuestions(null); setBonusLoading(false); setBonusError(null);

    const tick = (i:number) => new Promise<void>(r=>setTimeout(()=>{setGenStep(i);r()},600));

    const planInstructions: Record<PlanTier, string> = {
      starter: `AMÉLIORATION PROFESSIONNELLE - Conserve TOUTES les informations originales. Reformule pour plus de clarté et d'impact SANS condenser excessivement. Utilise des verbes d'action naturels. Maintiens la longueur originale des descriptions. Ne supprime AUCUN détail important. Les bullets doivent être des PHRASES COMPLÈTES de 12-18 mots.`,
      pro:     `AMÉLIORATION AVANCÉE - Conserve TOUT le contenu original. Reformule avec des verbes d'action percutants. Ajoute des résultats quantifiés si mentionnés dans le CV source. Maintiens la richesse des descriptions. Le CV doit être COMPLET et DÉTAILLÉ avec des bullets substantielles.`,
      cadre:   `AMÉLIORATION EXÉCUTIVE - Conserve TOUTES les informations. Reformule avec un ton stratégique et des verbes de leadership. Quantifie les résultats. Maintiens TOUS les détails importants. Le CV doit être SUBSTANTIEL avec des descriptions riches.`,
    };

    const pagesTarget = preferredPagesRef.current;
    const pageConstraints = pagesTarget === 1
      ? `FORMAT : 1 PAGE A4

CONSIGNES DE CONTENU IMPORTANTES :
- profile : 2-3 phrases substantielles (60-80 mots). Rédige un résumé professionnel COMPLET qui capture toute l'expérience du candidat.
- experiences : Conserve TOUS les postes pertinents (maximum 4). Pour chaque poste : 3-4 bullets DÉTAILLÉS de 12-18 mots chacun. Les bullets doivent être RICHES en information, pas des fragments.
- education : Conserve toutes les formations pertinentes (maximum 3).
- skills : Conserve 10-15 compétences techniques réelles du CV source.
- languages : Conserve toutes les langues mentionnées avec leur niveau exact.
- certifications : Conserve toutes les certifications (maximum 3).

IMPORTANT : Ne SUR-condense PAS le contenu. Le CV doit être LISIBLE avec des phrases complètes. Chaque bullet doit contenir des détails concrets (quoi, comment, résultat).`
      : `FORMAT : 2 PAGES A4

CONSIGNES DE CONTENU :
- profile : 3-4 phrases détaillées (80-100 mots). Résumé professionnel complet et percutant.
- experiences : Conserve TOUS les postes (maximum 6). Pour chaque poste : 4-5 bullets détaillés de 15-22 mots chacun. Descriptions GÉNÉREUSES en détails.
- education : Conserve toutes les formations (maximum 5).
- skills : Conserve 15-22 compétences.
- languages : Toutes les langues avec niveau.
- certifications : Toutes les certifications (maximum 5).

IMPORTANT : Sois GÉNÉREUX en détails. Des descriptions complètes et informatives.`;

    const systemPrompt = `Tu es un rédacteur de CV professionnel expert. Tu crées des CV RICHES, DÉTAILLÉS et ATS-FRIENDLY pour le marché marocain et international.

RÈGLES CRITIQUES :
1. CONSERVE toutes les informations factuelles du CV source : noms d'entreprises, dates exactes, diplômes, compétences techniques, langues.
2. NE RÉDUIS PAS la longueur des descriptions. Le CV final doit être SUBSTANTIEL, pas squelettique.
3. Les bullets d'expérience doivent être des PHRASES COMPLÈTES de 12-18 mots MINIMUM, décrivant des réalisations et responsabilités concrètes.
4. Si le CV source mentionne des chiffres, pourcentages ou résultats spécifiques, CONSERVE-LES intégralement.
5. Le profil professionnel doit être un résumé RICHE qui capture l'essence de la carrière du candidat.
6. Pour les compétences, liste les compétences TECHNIQUES réelles (logiciels, outils, technologies, méthodologies) mentionnées dans le CV source.
7. Le niveau des langues doit être un parmi : Natif, Courant, Avancé, Intermédiaire, Débutant.

FORMAT DE RÉPONSE : UNIQUEMENT un objet JSON valide, sans markdown, sans texte avant ou après. Le JSON doit suivre exactement ce schéma :
{
  "name": string,
  "title": string (poste actuel ou visé, descriptif),
  "email": string,
  "phone": string,
  "location": string (Ville, Pays),
  "profile": string (résumé professionnel RICHE de plusieurs phrases),
  "experiences": [{ "company": string, "role": string, "period": string, "bullets": string[] }],
  "education": [{ "school": string, "degree": string (nom complet du diplôme), "year": string }],
  "skills": string[] (compétences techniques réelles),
  "languages": [{ "lang": string, "level": string }],
  "certifications": string[] (optionnel)
}

${pageConstraints}

RÈGLES SUPPLÉMENTAIRES :
- ${planInstructions[plan.tier]}
- Les bullets d'expérience doivent TOUJOURS commencer par un verbe d'action au passé.
- Les périodes doivent conserver le format original (ex: "2021 – Présent", "01/2019 – 02/2019").
- Les titres de poste doivent être professionnels et standards.
- N'invente JAMAIS d'informations qui ne sont pas dans le CV source.`;

    try {
      await tick(1);
      let messages: any[];

      if (src==="upload") {
        const instructions = `Mode d'amélioration : "${enhance}".

INSTRUCTIONS IMPORTANTES :
- Analyse TOUT le contenu du CV source fourni.
- Conserve CHAQUE information factuelle : entreprises, dates, diplômes, compétences, langues.
- Reformule pour plus de professionnalisme SANS réduire le contenu.
- Les descriptions doivent rester RICHES et DÉTAILLÉES.
- N'OMETS AUCUN détail important du CV original.
- Le CV final doit être COMPLET et PRÊT À L'EMPLOI.
- Les bullets doivent être des phrases complètes et informatives.`;
        
        if (base64 && mime==="application/pdf") {
          messages=[{role:"user",content:[
            {type:"document",source:{type:"base64",media_type:"application/pdf",data:base64}},
            {type:"text",text:instructions}
          ]}];
        } else if (content.trim()) {
          messages=[{role:"user",content:`CV SOURCE À AMÉLIORER :\n\n${content}\n\n${instructions}`}];
        } else {
          throw new Error("Aucun contenu CV trouvé. Veuillez réimporter votre fichier.");
        }
      } else {
        let jobCtxStr = "";
        try {
          const jc = safeGetStorage("cv_job_context");
          if (jc) {
            const jcData = JSON.parse(jc);
            try { sessionStorage.removeItem("cv_job_context"); } catch {}
            if (jcData.title) {
              jobCtxStr = `\n\nCIBLAGE POSTE : "${jcData.title}" chez ${jcData.company} (${jcData.city}).` +
                (jcData.desc ? `\nDescription du poste : ${jcData.desc.slice(0, 250)}` : "") +
                `\nAdapte le titre et les compétences pour ce poste tout en conservant l'exactitude factuelle.`;
            }
          }
        } catch(e) {}

        messages=[{role:"user",content:`CRÉE un CV professionnel COMPLET et DÉTAILLÉ avec ces informations :

CANDIDAT :
- Nom complet : ${f.name}
- Poste visé : ${f.title}
- Email : ${f.email}
- Téléphone : ${f.phone}
- Localisation : ${f.location||"Maroc"}
- Secteur d'activité : ${f.industry}
- Niveau d'expérience : ${f.level}

EXPÉRIENCES PROFESSIONNELLES (source originale à conserver et enrichir) :
${f.experience}

FORMATION ACADÉMIQUE :
${f.education}

COMPÉTENCES TECHNIQUES :
${f.skills}

LANGUES :
${f.langs}

INFORMATIONS COMPLÉMENTAIRES :
${f.notes}${jobCtxStr}

IMPORTANT :
- Crée un CV RICHE et DÉTAILLÉ avec des bullets substantielles (12-18 mots minimum).
- Pour chaque expérience, rédige 3-4 bullets décrivant des réalisations et responsabilités concrètes.
- Le profil professionnel doit être un résumé percutant de 2-3 phrases complètes.
- Les compétences doivent refléter les technologies, outils et méthodologies RÉELS du secteur.
- Conserve le format original des périodes et le nom exact des entreprises et écoles.`}];
      }

      await tick(2);
      const res = await fetch("/api/generate-cv", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens: pagesTarget === 1 ? 2500 : 4000,  // FIX: Increased from 1800/3000 for richer output
          system:systemPrompt,
          messages,
        }),
      });

      await tick(3);

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Erreur API (${res.status}): ${err.slice(0,200)}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(`Erreur IA: ${data.error.message || JSON.stringify(data.error)}`);

      const raw   = data.content?.map((c:any)=>c.text??"").join("")??"";
      const clean = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
      if (!clean) throw new Error("Réponse vide. Vérifiez votre clé API.");

      await tick(4);

      let parsed: CVData;
      try { parsed = JSON.parse(clean); }
      catch { throw new Error(`JSON invalide reçu. Début : ${clean.slice(0,120)}`); }

      if (!parsed.name && !parsed.experiences) throw new Error("CV incomplet retourné par l'IA. Réessayez.");

      // ── POST-PROCESS: relaxed limits for richer content ──
      const maxExp    = pagesTarget === 1 ? 4 : 6;
      const maxBullet = pagesTarget === 1 ? 4 : 5;
      const maxSkills = pagesTarget === 1 ? 15 : 22;
      const maxEdu    = pagesTarget === 1 ? 3 : 5;
      const maxCerts  = pagesTarget === 1 ? 3 : 5;
      const maxLangs  = pagesTarget === 1 ? 4 : 6;

      const safe: CVData = {
        name:           parsed.name           || f.name || "",
        title:          parsed.title          || f.title || "",
        email:          parsed.email          || f.email || "",
        phone:          parsed.phone          || f.phone || "",
        location:       parsed.location       || f.location || "",
        profile:        parsed.profile        || "",
        experiences:    (Array.isArray(parsed.experiences) ? parsed.experiences : [])
                          .slice(0, maxExp)
                          .map(e => ({ ...e, bullets: (e.bullets || []).slice(0, maxBullet) })),
        education:      (Array.isArray(parsed.education)   ? parsed.education   : []).slice(0, maxEdu),
        skills:         (Array.isArray(parsed.skills)      ? parsed.skills      : f.skills.split(",").map(s=>s.trim()).filter(Boolean)).slice(0, maxSkills),
        languages:      (Array.isArray(parsed.languages)   ? parsed.languages   : []).slice(0, maxLangs),
        certifications: (Array.isArray(parsed.certifications) ? parsed.certifications : []).slice(0, maxCerts),
        photo:          photo || parsed.photo,
      };

      await tick(5);
      setCvData(safe);
      setEditingCv(safe);
      setStep(5);

      // Bonus content for Pro/Cadre
      if (plan.tier === "pro" || plan.tier === "cadre") {
        setBonusLoading(true); setBonusError(null);
        (async () => {
          try {
            const isCadre = plan.tier === "cadre";
            const ctx = `Candidat: ${safe.name}, ${safe.title}.\nProfil: ${safe.profile}\nExpériences: ${safe.experiences.map(e=>`${e.role} chez ${e.company}`).join(", ")}\nCompétences: ${safe.skills.slice(0,10).join(", ")}`;
            const bonusSystem = `Tu es un expert RH senior. Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après.`;
            const bonusUser = isCadre
              ? `${ctx}\n\nGénère un objet JSON avec exactement ces clés:\n- "cover_letter": lettre de motivation percutante de 4 paragraphes (ton exécutif)\n- "executive_bio": bio professionnelle de 2 paragraphes à la 3ème personne (style C-Suite)\n- "questions": tableau de 5 objets {"q":"question","a":"réponse suggérée courte"}`
              : `${ctx}\n\nGénère un objet JSON avec exactement ces clés:\n- "cover_letter": lettre de motivation percutante de 4 paragraphes\n- "linkedin_summary": résumé LinkedIn optimisé de 3 phrases (accrocheur, 1ère personne, mots-clés secteur)`;

            const bonusRes = await fetch("/api/generate-cv", {
              method:"POST", headers:{"Content-Type":"application/json"},
              body: JSON.stringify({ max_tokens:1500, system:bonusSystem, messages:[{role:"user",content:bonusUser}] }),
            });
            if (!bonusRes.ok) throw new Error(`API ${bonusRes.status}`);
            const bonusData = await bonusRes.json();
            if (bonusData.error) throw new Error(bonusData.error.message || "Erreur");
            const rawB   = bonusData.content?.map((c:any)=>c.text??"").join("") ?? "";
            const cleanB = rawB.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
            const bonus = JSON.parse(cleanB);
            if (bonus.cover_letter)     setCoverLetter(bonus.cover_letter);
            if (bonus.linkedin_summary) setLinkedinSummary(bonus.linkedin_summary);
            if (bonus.executive_bio)    setExecutiveBio(bonus.executive_bio);
            if (bonus.questions)        setInterviewQuestions((bonus.questions as any[]).map(q=>`${q.q}\n→ ${q.a}`));
          } catch(e:any) {
            setBonusError("Les extras n'ont pas pu être générés : " + (e.message || "erreur inconnue"));
          } finally {
            setBonusLoading(false);
          }
        })();
      }
    } catch(e:any) {
      setGenError(e.message || "Erreur inconnue. Réessayez.");
    } finally {
      setGenerating(false); setGenStep(0);
    }
  },[]);

  // ── DODO REDIRECT ─────────────────────────────────────────────────────
  const redirectToPayment = (plan: Plan) => {
    const cv = editingCv || cvData;
    if (cv) safeSetStorage("dodo_cv_data", JSON.stringify(cv));
    safeSetStorage("dodo_cv_plan",    plan.tier);
    safeSetStorage("dodo_cv_tpl",     String(selectedTpl));
    safeSetStorage("dodo_cv_accent",  editorAccent);
    safeSetStorage("dodo_cv_font",    editorFont);
    safeSetStorage("dodo_cv_hidden",  JSON.stringify(hiddenSections));
    if (coverLetter)        safeSetStorage("dodo_cv_cover",     coverLetter);
    if (linkedinSummary)    safeSetStorage("dodo_cv_linkedin",  linkedinSummary);
    if (executiveBio)       safeSetStorage("dodo_cv_bio",       executiveBio);
    if (interviewQuestions) safeSetStorage("dodo_cv_questions", JSON.stringify(interviewQuestions));
    const photo = (editingCv || cvData)?.photo;
    if (photo) safeSetStorage("dodo_cv_photo", photo);
    window.location.href = DODO_CHECKOUT[plan.tier] || DODO_CHECKOUT.starter;
  };

  const selectPlanAndGenerate = (plan: Plan, triggerMode: Mode = "ai") => {
    setCurrentPlan(plan);
    purchasedPlanRef.current = plan;
    setPurchasedPlan(plan);
    setHasPaid(false);
    setUploadPaywall(false);
    setTimeout(() => runGeneration(triggerMode), 100);
  };

  // ── PDF DOWNLOAD ──────────────────────────────────────────────────────
  const downloadPDF = () => {
    const node = printRef.current;
    if (!node) return;
    setGenError(null);

    const w = window.open("", "_blank", "width=860,height=750");
    if (!w) {
      setGenError("Autorisez les popups dans votre navigateur pour télécharger le PDF.");
      return;
    }

    const fontLinks = Array.from(document.querySelectorAll('link[href*="fonts.googleapis"]'))
      .map(l => l.outerHTML).join("\n");

    const pageStyles = Array.from(document.querySelectorAll("style"))
      .map(s => `<style>${s.textContent ?? ""}</style>`).join("\n");

    const cvHtml = node.outerHTML;

    w.document.write(buildPrintHTML(cvHtml, pageStyles, fontLinks));
    w.document.close();
  };

  const handleDownload = () => {
    if (hasPaid) { downloadPDF(); }
    else         { redirectToPayment(currentPlan); }
  };

  const goStep = (n: Step) => { setStep(n); window.scrollTo({top:0,behavior:"smooth"}); };

  const upd = useCallback((patch: Partial<CVData>) => {
    setEditingCv(prev => ({ ...(prev || cvData || {} as CVData), ...patch }));
  }, [cvData]);

  const switchTemplate = useCallback((id: number) => {
    setTplSwitching(true);
    setSelectedTpl(id);
    setTimeout(() => setTplSwitching(false), 250);
  }, []);

  const PHOTO_TEMPLATES = [2,5,6,9];

  const validateForm = (): string|null => {
    if (!form.name.trim())       return "Le nom complet est requis.";
    if (!form.title.trim())      return "Le poste visé est requis.";
    if (!form.email.trim())      return "L'email est requis.";
    if (!form.phone.trim())      return "Le téléphone est requis.";
    if (!form.location.trim())   return "La ville est requise.";
    if (!form.industry)          return "Le secteur est requis.";
    if (!form.level)             return "Le niveau d'expérience est requis.";
    if (!form.experience.trim()) return "Les expériences professionnelles sont requises.";
    if (!form.education.trim())  return "La formation est requise.";
    if (!form.skills.trim())     return "Les compétences sont requises.";
    if (!form.langs.trim())      return "Les langues sont requises.";
    return null;
  };

  const [formValidErr, setFormValidErr] = useState<string|null>(null);

  const handleFormContinue = () => {
    const err = validateForm();
    if (err) { setFormValidErr(err); window.scrollTo({top:200,behavior:"smooth"}); return; }
    setFormValidErr(null);
    goStep(3);
  };

  const THUMB_SCALE = 0.24;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{width:100%;overflow-x:hidden;}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f5f3ff;color:#0f172a;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

        .cv-editor-wrap { --cv-scale: 0.80; }
        @media(min-width:1400px){ .cv-editor-wrap { --cv-scale: 0.92; } }
        @media(max-width:1100px){ .cv-editor-wrap { --cv-scale: 0.66; } }
        @media(max-width:768px){
          .cv-editor-wrap { flex-direction:column!important; height:auto!important; min-height:auto!important; --cv-scale:0.43; }
          .cv-editor-left { width:100%!important; max-height:360px; border-radius:14px 14px 0 0!important; }
          /* FIX: Changed overflow from hidden to visible to allow scrolling */
          .cv-editor-right { border-radius:0 0 14px 14px!important; padding:14px 10px 28px!important; overflow:visible!important; }
          .cv-editor-toolbar { flex-direction:column; gap:6px!important; align-items:flex-start!important; }
          .cv-editor-toolbar-btns { display:flex; gap:6px; flex-wrap:wrap; }
          /* FIX: Remove margin-bottom compensation to prevent content cutoff */
          .cv-preview-outer { overflow:visible!important; width:100%; display:flex!important; justify-content:center!important; }
          .cv-scale-wrap { margin-bottom:0!important; transform-origin:top center!important; }
        }

        .au{animation:fadeUp .5s cubic-bezier(.16,1,.3,1) both}
        .spinner{width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#7c3aed;border-radius:50%;animation:spin .7s linear infinite}

        .nl{color:#4b5563;text-decoration:none;font-size:14px;font-weight:600;padding:7px 12px;border-radius:8px;transition:all .18s}
        .nl:hover{color:#1e1147;background:#f5f3ff}

        .tpl-thumb{border:2px solid #e5e7eb;border-radius:14px;overflow:hidden;cursor:pointer;background:white;transition:all .2s;box-shadow:0 1px 4px rgba(0,0,0,.05)}
        .tpl-thumb:hover{border-color:#7c3aed;box-shadow:0 4px 20px rgba(124,58,237,.12);transform:translateY(-2px)}
        .tpl-thumb.selected{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.2)}

        input,select,textarea{font-family:inherit;font-size:14px;}
        input:focus,select:focus,textarea:focus{outline:none;border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,.1)!important;}

        .btn-green{display:inline-flex;align-items:center;justify-content:center;gap:7px;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:white;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .18s;box-shadow:0 4px 16px rgba(124,58,237,.35)}
        .btn-green:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(124,58,237,.45)}
        .btn-green:disabled{background:#d1d5db;cursor:not-allowed;transform:none;box-shadow:none}
        .btn-outline{display:inline-flex;align-items:center;gap:7px;background:white;color:#374151;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;border:1.5px solid #e5e7eb;cursor:pointer;font-family:inherit;transition:all .18s}
        .btn-outline:hover{border-color:#7c3aed;color:#7c3aed}

        .pay-card{border:2px solid #e5e7eb;border-radius:14px;padding:24px;transition:all .18s;background:white}
        .pay-card:hover{border-color:#7c3aed;box-shadow:0 4px 20px rgba(124,58,237,.1)}
        .pay-card.featured{border-color:#7c3aed;background:#f5f3ff}

        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;overflow-y:auto;backdrop-filter:blur(4px)}
        .modal-box{background:white;border-radius:16px;width:100%;max-width:860px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.3)}

        .gen-step{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:500;padding:8px 0;transition:all .3s}

        .fl{font-size:13px;font-weight:600;display:block;margin-bottom:6px;color:#374151}
        .fi{border:1.5px solid #e5e7eb;border-radius:9px;padding:11px 14px;width:100%;background:white;color:#0f172a;font-size:14px;font-family:inherit;transition:border-color .18s}
        .fi.req-err{border-color:#ef4444!important;}

        .choice-card{border:2px solid #e5e7eb;border-radius:16px;padding:28px 24px;cursor:pointer;background:white;transition:all .22s;text-align:left;font-family:inherit;display:flex;flex-direction:column;gap:10}
        .choice-card:hover{border-color:#7c3aed;box-shadow:0 6px 24px rgba(124,58,237,.15);transform:translateY(-2px)}

        @media(max-width:640px){.hide-sm{display:none!important}.grid2{grid-template-columns:1fr!important}.choice-grid{grid-template-columns:1fr!important}}

        @media print{body{background:white}}
      `}</style>

      <div style={{background:"#f5f3ff",minHeight:"100vh",width:"100%"}}>

        {/* ── NAVBAR ── */}
        <nav style={{background:"rgba(255,255,255,.96)",backdropFilter:"blur(12px)",borderBottom:"1.5px solid #f0f0f0",padding:"0 24px",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:28}}>
            <a href="/" style={{display:"flex",alignItems:"center",textDecoration:"none",overflow:"hidden",height:62}}>
              <img src="/logo.png" alt="TalentMaroc" style={{height:110,width:"auto",objectFit:"contain",margin:"-22px 0"}} />
            </a>
            <div className="hide-sm" style={{display:"flex",gap:2}}>
              <a href="/" className="nl">Emplois</a>
              <a href="/employeur" className="nl">Recruteurs</a>
              <span style={{color:"#7c3aed",fontSize:14,fontWeight:700,padding:"7px 12px"}}>Mon CV ✦</span>
            </div>
          </div>
          <a href="/dashboard" className="btn-green" style={{padding:"8px 16px",fontSize:13}}>📋 Mes candidatures</a>
        </nav>

        {/* ── HERO ── */}
        {step !== 5 && <div style={{background:"white",borderBottom:"1.5px solid #ede9fe",padding:"44px 24px 48px",textAlign:"center"}}>
          <div className="au" style={{display:"inline-flex",alignItems:"center",gap:7,background:"#f5f3ff",border:"1.5px solid #ddd6fe",borderRadius:100,padding:"5px 14px",marginBottom:18}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:"#7c3aed",display:"inline-block"}}/>
            <span style={{fontSize:12,fontWeight:700,color:"#6d28d9"}}>9 modèles professionnels · IA de rédaction · PDF A4 téléchargeable</span>
          </div>
          <h1 className="au" style={{fontFamily:"inherit",fontSize:"clamp(24px,5vw,42px)",fontWeight:800,color:"#0f172a",lineHeight:1.12,letterSpacing:"-0.02em",marginBottom:12,animationDelay:".08s"}}>
            Importer un CV ou en créer un nouveau
          </h1>
          <p className="au" style={{fontSize:15,color:"#6b7280",maxWidth:500,margin:"0 auto",lineHeight:1.7,animationDelay:".14s"}}>
            Importez votre CV existant pour l&apos;améliorer, ou créez-en un nouveau avec l&apos;aide de l&apos;IA.
          </p>
        </div>}

        {/* ── MAIN ── */}
        <div style={{maxWidth: step===5 ? "100%" : 1080, margin:"0 auto", padding: step===5 ? "0" : "36px 20px 80px"}}>

          {/* ─────── ENTRY POINT ─────── */}
          {step===1 && mode==="upload" && (
            <div className="au">
              <div className="choice-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,maxWidth:700,margin:"0 auto"}}>
                <button className="choice-card" onClick={()=>{ setMode("upload"); goStep(2); }}>
                  <div style={{width:52,height:52,background:"#f0fdf4",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>📂</div>
                  <div>
                    <div style={{fontSize:17,fontWeight:800,color:"#0f172a",marginBottom:6}}>Importer mon CV</div>
                    <div style={{fontSize:13,color:"#6b7280",lineHeight:1.6}}>Importez un PDF, DOCX ou TXT. L&apos;IA l&apos;améliore et le met en forme dans le modèle de votre choix.</div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                    <span style={{fontSize:11,fontWeight:700,background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0",padding:"3px 10px",borderRadius:100}}>✓ Sauvegardé dans votre dashboard</span>
                    <span style={{fontSize:11,fontWeight:700,background:"#fef3c7",color:"#92400e",border:"1px solid #fde68a",padding:"3px 10px",borderRadius:100}}>À partir de 19 MAD</span>
                  </div>
                </button>
                <button className="choice-card" onClick={()=>{ setMode("ai"); goStep(2); }}>
                  <div style={{width:52,height:52,background:"#eff6ff",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>✦</div>
                  <div>
                    <div style={{fontSize:17,fontWeight:800,color:"#0f172a",marginBottom:6}}>Créer un nouveau CV</div>
                    <div style={{fontSize:13,color:"#6b7280",lineHeight:1.6}}>Remplissez vos informations, choisissez un modèle et laissez l&apos;IA rédiger un CV professionnel complet.</div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                    <span style={{fontSize:11,fontWeight:700,background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe",padding:"3px 10px",borderRadius:100}}>✓ Modèles professionnels</span>
                    <span style={{fontSize:11,fontWeight:700,background:"#fef3c7",color:"#92400e",border:"1px solid #fde68a",padding:"3px 10px",borderRadius:100}}>À partir de 19 MAD</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ─────── UPLOAD: step 2 ─────── */}
          {step===2 && mode==="upload" && (
            <div className="au">
              <StepBack label="← Retour" onClick={()=>goStep(1)}/>
              {genError && (
                <div style={{background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:10,padding:"14px 18px",marginBottom:16,display:"flex",gap:12,alignItems:"flex-start"}}>
                  <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#dc2626",marginBottom:4}}>Erreur de génération</div>
                    <div style={{fontSize:12,color:"#7f1d1d",lineHeight:1.6}}>{genError}</div>
                    <button onClick={()=>setGenError(null)} style={{marginTop:8,fontSize:12,color:"#dc2626",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0,fontWeight:600}}>Fermer ×</button>
                  </div>
                </div>
              )}
              <div style={{background:"white",border:"1.5px solid #f0f0f0",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)",marginBottom:20}}>
                <div style={{padding:"20px 24px",borderBottom:"1.5px solid #f0f0f0"}}>
                  <h2 style={{fontSize:16,fontWeight:800}}>1. Importez votre CV</h2>
                  <p style={{fontSize:13,color:"#6b7280",marginTop:3}}>PDF, DOCX ou TXT</p>
                </div>
                <div style={{padding:28}}>
                  <label style={{display:"block",border:"2px dashed #d1d5db",borderRadius:12,padding:"36px 24px",textAlign:"center",cursor:"pointer",background:"#f9fafb",transition:"all .18s"}}
                    onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor="#16a34a";e.currentTarget.style.background="#f0fdf4"}}
                    onDragLeave={e=>{e.currentTarget.style.borderColor="#d1d5db";e.currentTarget.style.background="#f9fafb"}}
                    onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleFile(f);e.currentTarget.style.borderColor="#d1d5db";e.currentTarget.style.background="#f9fafb"}}>
                    <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e=>{if(e.target.files?.[0])handleFile(e.target.files[0]);}} style={{display:"none"}}/>
                    <div style={{fontSize:36,marginBottom:10}}>📄</div>
                    <div style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:4}}>Glissez votre CV ici</div>
                    <p style={{fontSize:12,color:"#9ca3af"}}>ou cliquez pour parcourir · PDF, DOCX, TXT</p>
                  </label>
                  {uploadedFile && (
                    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:10,marginTop:14}}>
                      <span style={{fontSize:20}}>✅</span>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#15803d"}}>{uploadedFile}</div><div style={{fontSize:11,color:"#6b7280"}}>Prêt à être amélioré</div></div>
                      <button onClick={()=>{setUploadedFile(null);setUploadedContent("");setUploadedBase64(null);setUploadedMime(null);}} style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:18,fontFamily:"inherit"}}>×</button>
                    </div>
                  )}
                  <div style={{marginTop:22}}>
                    <label className="fl">Photo de profil <span style={{fontWeight:400,color:"#9ca3af"}}>(optionnel)</span></label>
                    <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                      <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 18px",border:"1.5px solid #e5e7eb",borderRadius:9,cursor:"pointer",background:"white",fontSize:13,fontWeight:600,color:"#374151"}}>
                        <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoBase64(ev.target?.result as string);r.readAsDataURL(f);}}/>
                        📷 Ajouter une photo
                      </label>
                      {photoBase64 && (
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <img src={photoBase64} alt="" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",border:"2px solid #bbf7d0"}}/>
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:"#15803d"}}>✓ Photo ajoutée</div>
                            <button onClick={()=>setPhotoBase64(null)} style={{fontSize:11,color:"#9ca3af",background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"inherit"}}>Supprimer</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{marginTop:20}}>
                    <label className="fl">Type d&apos;amélioration</label>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:9}}>
                      {[
                        {v:"Optimisation ATS",icon:"🤖",d:"Mots-clés, structure ATS"},
                        {v:"Reformulation Pro",icon:"✍️",d:"Verbes d'action, impact"},
                        {v:"Reconversion",icon:"🔄",d:"Compétences transférables"},
                        {v:"Niveau Cadre",icon:"🎯",d:"Ton stratégique, leadership"},
                        {v:"Refonte complète",icon:"🔥",d:"Réécriture professionnelle"},
                      ].map(opt=>(
                        <label key={opt.v} style={{display:"flex",gap:10,padding:"11px 13px",border:`1.5px solid ${enhanceType===opt.v?"#16a34a":"#e5e7eb"}`,borderRadius:9,cursor:"pointer",background:enhanceType===opt.v?"#f0fdf4":"white",transition:"all .15s"}}>
                          <input type="radio" name="enhance" value={opt.v} checked={enhanceType===opt.v} onChange={()=>setEnhanceType(opt.v)} style={{accentColor:"#16a34a",marginTop:1}}/>
                          <div><div style={{fontSize:13,fontWeight:600,color:enhanceType===opt.v?"#15803d":"#0f172a"}}>{opt.icon} {opt.v}</div><div style={{fontSize:11,color:"#6b7280"}}>{opt.d}</div></div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <button className="btn-outline" onClick={()=>goStep(1)}>← Retour</button>
                <button className="btn-green" disabled={!uploadedFile} onClick={()=>setUploadPaywall(true)}>
                  ✨ Améliorer et mettre en forme →
                </button>
              </div>
            </div>
          )}

          {/* ─────── CREATE NEW: step 2 ─────── */}
          {step===2 && mode==="ai" && (
            <div className="au">
              <StepBack label="← Retour" onClick={()=>{ setMode("upload"); goStep(1); }}/>
              {formValidErr && (
                <div style={{background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:10,padding:"14px 18px",marginBottom:16,display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:18}}>⚠️</span>
                  <div style={{fontSize:13,fontWeight:600,color:"#dc2626"}}>{formValidErr}</div>
                </div>
              )}
              <div style={{background:"white",border:"1.5px solid #f0f0f0",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)",marginBottom:20}}>
                <div style={{padding:"20px 24px",borderBottom:"1.5px solid #f0f0f0"}}>
                  <h2 style={{fontSize:16,fontWeight:800}}>1. Vos informations <span style={{fontSize:12,color:"#9ca3af",fontWeight:400}}>— tous les champs avec * sont obligatoires</span></h2>
                </div>
                <div style={{padding:28}}>
                  <div className="grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                    <div><label className="fl">Prénom et Nom *</label><input className={`fi${formValidErr&&!form.name?" req-err":""}`} placeholder="Youssef Benali" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
                    <div><label className="fl">Poste visé *</label><input className={`fi${formValidErr&&!form.title?" req-err":""}`} placeholder="Développeur Full Stack" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></div>
                    <div><label className="fl">Email *</label><input type="email" className={`fi${formValidErr&&!form.email?" req-err":""}`} placeholder="youssef@email.ma" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
                    <div><label className="fl">Téléphone *</label><input className={`fi${formValidErr&&!form.phone?" req-err":""}`} placeholder="+212 6 00 00 00 00" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
                    <div><label className="fl">Ville *</label><input className={`fi${formValidErr&&!form.location?" req-err":""}`} placeholder="Casablanca, Maroc" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))}/></div>
                    <div><label className="fl">Secteur *</label>
                      <select className={`fi${formValidErr&&!form.industry?" req-err":""}`} value={form.industry} onChange={e=>setForm(p=>({...p,industry:e.target.value}))}>
                        <option value="">Sélectionnez...</option>
                        {["Informatique","Finance","Commerce","Marketing","RH","Ingénierie","Santé","Logistique","Tourisme","Juridique","Éducation","BTP","Autre"].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div><label className="fl">Niveau d&apos;expérience *</label>
                      <select className={`fi${formValidErr&&!form.level?" req-err":""}`} value={form.level} onChange={e=>setForm(p=>({...p,level:e.target.value}))}>
                        <option value="">Sélectionnez...</option>
                        {["Débutant (0–2 ans)","Intermédiaire (2–5 ans)","Confirmé (5–10 ans)","Manager","Directeur","C-Suite"].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div style={{gridColumn:"1 / -1"}}>
                      <label className="fl">Expériences professionnelles *</label>
                      <textarea className={`fi${formValidErr&&!form.experience?" req-err":""}`} rows={5} value={form.experience} onChange={e=>setForm(p=>({...p,experience:e.target.value}))}
                        placeholder={"Capgemini Maroc — Lead Developer (2021–Présent)\n- Pilotage d'une équipe de 6 développeurs\n\nOCP Digital — Dev Full Stack (2019–2021)\n- Développement de portails RH"} style={{resize:"vertical",lineHeight:1.6}}/>
                    </div>
                    <div style={{gridColumn:"1 / -1"}}>
                      <label className="fl">Formation *</label>
                      <textarea className={`fi${formValidErr&&!form.education?" req-err":""}`} rows={2} value={form.education} onChange={e=>setForm(p=>({...p,education:e.target.value}))}
                        placeholder={"Master Génie Informatique — ENSA Rabat (2019)"} style={{resize:"vertical",lineHeight:1.6}}/>
                    </div>
                    <div><label className="fl">Compétences *</label><input className={`fi${formValidErr&&!form.skills?" req-err":""}`} placeholder="React, Node.js, Python, PostgreSQL" value={form.skills} onChange={e=>setForm(p=>({...p,skills:e.target.value}))}/></div>
                    <div><label className="fl">Langues *</label><input className={`fi${formValidErr&&!form.langs?" req-err":""}`} placeholder="Arabe (natif), Français (courant)" value={form.langs} onChange={e=>setForm(p=>({...p,langs:e.target.value}))}/></div>
                    <div style={{gridColumn:"1 / -1"}}>
                      <label className="fl">Informations complémentaires <span style={{fontWeight:400,color:"#9ca3af"}}>(optionnel)</span></label>
                      <textarea className="fi" rows={2} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Certifications, projets, liens GitHub/LinkedIn..." style={{resize:"vertical"}}/>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <button className="btn-outline" onClick={()=>{ setMode("upload"); goStep(1); }}>← Retour</button>
                <button className="btn-green" onClick={handleFormContinue}>Choisir un modèle →</button>
              </div>
            </div>
          )}

          {/* ─────── CREATE NEW: step 3 — choose template ─────── */}
          {step===3 && mode==="ai" && (
            <div className="au">
              <StepBack label="← Modifier mes informations" onClick={()=>goStep(2)}/>
              <div style={{background:"white",border:"1.5px solid #f0f0f0",borderRadius:14,overflow:"hidden",marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                <div style={{padding:"20px 24px",borderBottom:"1.5px solid #f0f0f0"}}>
                  <h2 style={{fontSize:16,fontWeight:800}}>2. Choisissez votre modèle</h2>
                </div>
                <div style={{padding:"24px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:16}}>
                  {TEMPLATES.map(t=>{
                    const bs=BADGE_STYLES[t.badge];
                    const sel=selectedTpl===t.id;
                    const hasPhoto=PHOTO_TEMPLATES.includes(t.id);
                    return (
                      <div key={t.id} className={`tpl-thumb${sel?" selected":""}`} style={{position:"relative"}} onClick={()=>switchTemplate(t.id)}>
                        <div style={{height:220,overflow:"hidden",position:"relative",background:"#f8fafc"}}>
                          <div style={{position:"absolute",top:0,left:0,width:A4_W,transformOrigin:"top left",transform:`scale(${THUMB_SCALE})`,pointerEvents:"none",userSelect:"none"}}>
                            <RenderCV id={t.id} cv={SAMPLE}/>
                          </div>
                          <div style={{position:"absolute",inset:0,zIndex:1,cursor:"pointer"}}/>
                          <div style={{position:"absolute",bottom:0,left:0,right:0,height:60,background:"linear-gradient(to bottom,transparent,#f8fafc)",pointerEvents:"none",zIndex:2}}/>
                          <div style={{position:"absolute",top:8,left:8,display:"flex",gap:4,zIndex:3,pointerEvents:"none"}}>
                            <span style={{background:bs.bg,color:bs.color,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:100}}>{({gratuit:"Gratuit",pro:"Pro",nouveau:"Nouveau"})[t.badge]}</span>
                            {hasPhoto && <span style={{background:"#eff6ff",color:"#1d4ed8",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:100}}>🖼</span>}
                          </div>
                          {sel && <div style={{position:"absolute",top:8,right:8,width:22,height:22,background:"#16a34a",borderRadius:"50%",color:"white",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,zIndex:3,pointerEvents:"none"}}>✓</div>}
                        </div>
                        <div style={{padding:"10px 14px 12px",borderTop:"1.5px solid #f0f0f0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:sel?"#15803d":"#0f172a"}}>{t.name}</div>
                            <div style={{fontSize:10,color:"#6b7280",marginTop:1,lineHeight:1.4}}>{t.desc.split(".")[0]}</div>
                          </div>
                          <button onClick={e=>{e.stopPropagation();setPreviewTpl(t.id);}} style={{background:sel?"#f0fdf4":"#f3f4f6",border:`1.5px solid ${sel?"#bbf7d0":"#e5e7eb"}`,borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:600,color:sel?"#15803d":"#374151",cursor:"pointer",flexShrink:0,fontFamily:"inherit"}}>
                            {sel ? "✓ Sélectionné" : "Aperçu"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <button className="btn-outline" onClick={()=>goStep(2)}>← Retour</button>
                <button className="btn-green" onClick={()=>goStep(4)}>✓ Continuer avec ce modèle →</button>
              </div>
            </div>
          )}

          {/* ─────── CREATE NEW: step 4 — payment ─────── */}
          {step===4 && mode==="ai" && (
            <div className="au">
              <StepBack label="← Changer de modèle" onClick={()=>goStep(3)}/>
              <div style={{marginBottom:20}}>
                <h2 style={{fontSize:18,fontWeight:800}}>3. Choisissez votre formule</h2>
                <p style={{fontSize:13,color:"#6b7280",marginTop:4}}>Paiement sécurisé via Dodo Payments · Visa, Mastercard, PayPal</p>
              </div>
              {!freeGenUsed && (
                <div style={{background:"#f0fdf4",border:"2px solid #16a34a",borderRadius:14,padding:"20px 22px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:"#15803d",marginBottom:3}}>🎁 1 génération gratuite disponible</div>
                    <div style={{fontSize:12,color:"#166534",lineHeight:1.6}}>Chaque compte bénéficie d&apos;une génération de CV gratuite.</div>
                  </div>
                  <button className="btn-green" onClick={()=>{
                    localStorage.setItem("tm_free_gen_used","1");
                    setFreeGenUsed(true);
                    setPurchasedPlan(PLANS[0]);
                    purchasedPlanRef.current = PLANS[0];
                    runGeneration("ai");
                  }} style={{whiteSpace:"nowrap",flexShrink:0}}>
                    ✓ Utiliser ma génération gratuite →
                  </button>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14,marginBottom:20}}>
                {PLANS.map(plan=>{
                  const featured=plan.name==="Professionnel";
                  return (
                    <div key={plan.name} className={`pay-card${featured?" featured":""}`} style={{position:"relative"}}>
                      {featured && <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#16a34a",color:"white",fontSize:11,fontWeight:700,padding:"4px 14px",borderRadius:100,whiteSpace:"nowrap"}}>⭐ Le plus populaire</div>}
                      <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#6b7280",marginBottom:10}}>{plan.name}</div>
                      <div style={{fontSize:38,fontWeight:800,color:"#0f172a",lineHeight:1,marginBottom:3}}>{plan.price} MAD</div>
                      <div style={{fontSize:12,color:"#6b7280",marginBottom:18}}>Paiement unique</div>
                      <div style={{height:1,background:"#e5e7eb",marginBottom:16}}/>
                      <ul style={{listStyle:"none",marginBottom:20}}>
                        {PLAN_FEATURES[plan.name].map(f=><li key={f} style={{display:"flex",alignItems:"center",gap:7,fontSize:13,marginBottom:8,color:"#374151"}}><span style={{color:"#16a34a",fontWeight:700,fontSize:14}}>✓</span>{f}</li>)}
                      </ul>
                      <button className="btn-green" onClick={()=>selectPlanAndGenerate(plan,"ai")} style={{width:"100%",background:featured?"#16a34a":"white",color:featured?"white":"#16a34a",border:featured?"none":"1.5px solid #16a34a"}}>
                        Générer mon CV →
                      </button>
                    </div>
                  );
                })}
              </div>
              <div style={{background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#6b7280"}}>
                <span style={{fontSize:18}}>🔒</span> Paiement 100% sécurisé via <strong style={{color:"#0f172a"}}>Dodo Payments</strong>.
              </div>
            </div>
          )}

          {/* ─────── LIVE EDITOR: step 5 ─────── */}
          {step===5 && cvData && (() => {
            const cv = editingCv || cvData;
            const ac = editorAccent || undefined;
            const fn = editorFont    || undefined;
            const IS: React.CSSProperties = { border:"1.5px solid #e5e7eb", borderRadius:8, padding:"8px 10px", width:"100%", fontSize:12, fontFamily:"inherit", outline:"none", background:"white" };
            const tabBtn = (id: typeof editorTab, label: string) => (
              <button key={id} onClick={()=>setEditorTab(id)}
                style={{ flex:1, padding:"9px 4px", border:"none", background:editorTab===id?"white":"transparent", color:editorTab===id?"#7c3aed":"#6b7280", fontWeight:700, fontSize:11, borderRadius:8, cursor:"pointer", fontFamily:"inherit", boxShadow:editorTab===id?"0 1px 4px rgba(0,0,0,.08)":"none" }}>
                {label}
              </button>
            );
            return (
              <div className="cv-editor-wrap" style={{ display:"flex", gap:0, height:"calc(100vh - 120px)", minHeight:700 }}>

                {/* ── LEFT PANEL ── */}
                <div className="cv-editor-left" style={{ width:300, flexShrink:0, background:"white", border:"1.5px solid #ede9fe", borderRadius:"14px 0 0 14px", display:"flex", flexDirection:"column", overflow:"hidden" }}>
                  <div style={{ display:"flex", background:"#f5f3ff", padding:4, gap:2, borderBottom:"1.5px solid #ede9fe" }}>
                    {tabBtn("template","🎨 Modèle")}
                    {tabBtn("color","Couleur")}
                    {tabBtn("font","Police")}
                    {tabBtn("sections","Sections")}
                    {tabBtn("content","✏️ Contenu")}
                  </div>

                  <div style={{ flex:1, overflowY:"auto", padding:"16px 14px" }}>

                    {/* TEMPLATE TAB */}
                    {editorTab==="template" && (
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10, padding:"12px 14px", marginBottom:4 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#15803d", marginBottom:8 }}>📄 Format du CV</div>
                          <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                            {([1,2] as const).map(p => (
                              <button key={p} onClick={()=>{ setPreferredPages(p); preferredPagesRef.current=p; }}
                                style={{ flex:1, padding:"8px 4px", borderRadius:8, border:`1.5px solid ${preferredPages===p?"#16a34a":"#d1fae5"}`, background:preferredPages===p?"#16a34a":"white", color:preferredPages===p?"white":"#374151", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>
                                {p} page{p>1?"s":""}
                              </button>
                            ))}
                          </div>
                          <div style={{ fontSize:10, color:"#6b7280", marginBottom:8, lineHeight:1.5 }}>
                            {preferredPages===1 ? "Idéal pour profils juniors/intermédiaires." : "Recommandé pour cadres & profils seniors."}
                          </div>
                          <button onClick={()=>runGeneration(mode)} disabled={generating||pdfBusy}
                            style={{ width:"100%", padding:"8px", borderRadius:8, border:"none", background:(generating||pdfBusy)?"#d1d5db":"linear-gradient(135deg,#16a34a,#15803d)", color:"white", fontSize:12, fontWeight:700, cursor:(generating||pdfBusy)?"not-allowed":"pointer", fontFamily:"inherit" }}>
                            {generating ? "⏳ Génération…" : `↺ Régénérer en ${preferredPages} page${preferredPages>1?"s":""}`}
                          </button>
                        </div>

                        <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Choisir un modèle</div>
                        {TEMPLATES.map(t => (
                          <button key={t.id} onClick={()=>setSelectedTpl(t.id)}
                            style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", border:`1.5px solid ${selectedTpl===t.id?"#7c3aed":"#e5e7eb"}`, background:selectedTpl===t.id?"#f5f3ff":"white", borderRadius:10, cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all .15s" }}>
                            <div style={{ width:32, height:40, background:selectedTpl===t.id?"#ede9fe":"#f3f4f6", borderRadius:6, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                              {["📄","🎨","⬜","👔","✨","🌿","📊","⚡","🍃"][t.id-1]}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:selectedTpl===t.id?"#7c3aed":"#0f172a" }}>{t.name}</div>
                              <div style={{ fontSize:10, color:"#9ca3af", lineHeight:1.4, marginTop:1 }}>{t.desc.slice(0,45)}…</div>
                            </div>
                            {selectedTpl===t.id && <span style={{ color:"#7c3aed", fontWeight:700, fontSize:14 }}>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* COLOR TAB */}
                    {editorTab==="color" && (
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Couleur d&apos;accent</div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                          {ACCENT_COLORS.map(c => (
                            <button key={c.value} onClick={()=>setEditorAccent(editorAccent===c.value?"":c.value)} title={c.name}
                              style={{ width:"100%", aspectRatio:"1", borderRadius:10, background:c.value, border:editorAccent===c.value?"3px solid #0f172a":"3px solid transparent", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,.15)" }}/>
                          ))}
                        </div>
                        <button onClick={()=>setEditorAccent("")}
                          style={{ width:"100%", padding:"8px", border:"1.5px dashed #e5e7eb", borderRadius:8, background:"none", color:"#9ca3af", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                          ↺ Couleur par défaut du modèle
                        </button>
                      </div>
                    )}

                    {/* FONT TAB */}
                    {editorTab==="font" && (
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Police de caractères</div>
                        {FONT_OPTIONS.map(f => (
                          <button key={f.value} onClick={()=>setEditorFont(editorFont===f.value?"":f.value)}
                            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"12px 14px", border:`1.5px solid ${editorFont===f.value?"#7c3aed":"#e5e7eb"}`, background:editorFont===f.value?"#f5f3ff":"white", borderRadius:10, cursor:"pointer", textAlign:"left", fontFamily:"inherit", marginBottom:8 }}>
                            <div>
                              <div style={{ fontSize:15, fontFamily:f.value, fontWeight:600, color:"#0f172a", marginBottom:2 }}>{f.name}</div>
                              <div style={{ fontSize:10, color:"#9ca3af" }}>{f.label}</div>
                            </div>
                            {editorFont===f.value && <span style={{ color:"#7c3aed", fontWeight:700 }}>✓</span>}
                          </button>
                        ))}
                        <button onClick={()=>setEditorFont("")}
                          style={{ width:"100%", padding:"8px", border:"1.5px dashed #e5e7eb", borderRadius:8, background:"none", color:"#9ca3af", fontSize:12, cursor:"pointer", fontFamily:"inherit", marginTop:4 }}>
                          ↺ Police par défaut
                        </button>
                      </div>
                    )}

                    {/* SECTIONS TAB */}
                    {editorTab==="sections" && (
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Afficher / masquer</div>
                        {CV_SECTIONS.map(s => {
                          const visible = !hiddenSections.includes(s.id);
                          return (
                            <div key={s.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 12px", border:"1.5px solid #f0f0f0", borderRadius:9, marginBottom:6, background:"white" }}>
                              <span style={{ fontSize:13, fontWeight:600, color:visible?"#0f172a":"#9ca3af" }}>{s.label}</span>
                              <button onClick={()=>setHiddenSections(prev=>prev.includes(s.id)?prev.filter(x=>x!==s.id):[...prev,s.id])}
                                style={{ width:42, height:24, borderRadius:12, border:"none", background:visible?"#7c3aed":"#e5e7eb", cursor:"pointer", position:"relative", transition:"background .2s" }}>
                                <div style={{ width:18, height:18, borderRadius:"50%", background:"white", position:"absolute", top:3, left:visible?21:3, transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* CONTENT TAB */}
                    {editorTab==="content" && (
                      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em" }}>Modifier le contenu</div>

                        <div style={{ background:"#f9fafb", borderRadius:10, padding:"12px" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>📷 Photo de profil</div>
                          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                            {cv.photo ? (
                              <img src={cv.photo} style={{ width:56, height:56, borderRadius:"50%", objectFit:"cover", border:"2px solid #e5e7eb", flexShrink:0 }}/>
                            ) : (
                              <div style={{ width:56, height:56, borderRadius:"50%", background:"#e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>👤</div>
                            )}
                            <div style={{ flex:1 }}>
                              <label style={{ display:"inline-block", cursor:"pointer", background:"#7c3aed", color:"white", fontSize:11, fontWeight:700, padding:"6px 12px", borderRadius:8 }}>
                                {cv.photo ? "Changer" : "Ajouter une photo"}
                                <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{
                                  const file = e.target.files?.[0]; if(!file) return;
                                  const reader = new FileReader();
                                  reader.onload = ev => { const data = ev.target?.result as string; upd({photo:data}); };
                                  reader.readAsDataURL(file);
                                }}/>
                              </label>
                              {cv.photo && <button onClick={()=>upd({photo:undefined})} style={{ marginLeft:8, fontSize:11, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>✕ Supprimer</button>}
                            </div>
                          </div>
                        </div>

                        <div style={{ background:"#f9fafb", borderRadius:10, padding:"12px" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>📋 Informations personnelles</div>
                          {([["name","Nom complet"],["title","Titre"],["email","Email"],["phone","Téléphone"],["location","Localisation"]] as [keyof CVData, string][]).map(([k,label])=>(
                            <div key={k} style={{ marginBottom:6 }}>
                              <label style={{ fontSize:10, color:"#6b7280", display:"block", marginBottom:2 }}>{label}</label>
                              <input value={String(cv[k]||"")} onChange={e=>upd({[k]:e.target.value})} style={IS}/>
                            </div>
                          ))}
                        </div>

                        <div style={{ background:"#f9fafb", borderRadius:10, padding:"12px" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>👤 Profil</div>
                          <textarea value={cv.profile} onChange={e=>upd({profile:e.target.value})} rows={4} style={{ ...IS, resize:"vertical" }}/>
                        </div>

                        <div style={{ background:"#f9fafb", borderRadius:10, padding:"12px" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>🔧 Compétences <span style={{ fontWeight:400, color:"#9ca3af" }}>(séparées par virgule)</span></div>
                          <textarea value={cv.skills.join(", ")} onChange={e=>upd({skills:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} rows={3} style={{ ...IS, resize:"vertical" }}/>
                        </div>

                        <div style={{ background:"#f9fafb", borderRadius:10, padding:"12px" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>💼 Expériences</div>
                          {cv.experiences.map((e,i)=>(
                            <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:i<cv.experiences.length-1?"1px solid #e5e7eb":"none" }}>
                              <input value={e.role} onChange={ev=>{const ex=[...cv.experiences];ex[i]={...ex[i],role:ev.target.value};upd({experiences:ex});}} placeholder="Intitulé du poste" style={{ ...IS, marginBottom:4 }}/>
                              <input value={e.company} onChange={ev=>{const ex=[...cv.experiences];ex[i]={...ex[i],company:ev.target.value};upd({experiences:ex});}} placeholder="Entreprise" style={{ ...IS, marginBottom:4 }}/>
                              <input value={e.period} onChange={ev=>{const ex=[...cv.experiences];ex[i]={...ex[i],period:ev.target.value};upd({experiences:ex});}} placeholder="Période" style={IS}/>
                            </div>
                          ))}
                        </div>

                        <div style={{ background:"#f9fafb", borderRadius:10, padding:"12px" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>🏅 Certifications <span style={{ fontWeight:400, color:"#9ca3af" }}>(une par ligne)</span></div>
                          <textarea
                            value={(cv.certifications||[]).join("\n")}
                            onChange={e=>upd({certifications:e.target.value.split("\n").map(s=>s.trim()).filter(Boolean)})}
                            rows={3} placeholder="AWS Certified Developer (2023)" style={{ ...IS, resize:"vertical" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ padding:"12px 14px", borderTop:"1.5px solid #ede9fe", display:"flex", gap:8 }}>
                    <button className="btn-outline" onClick={()=>{setCvData(null);setEditingCv(null);setMode("upload");setHasPaid(false);setJustPaid(false);setCoverLetter(null);setLinkedinSummary(null);setExecutiveBio(null);setInterviewQuestions(null);setCurrentPlan(PLANS[1]);setPurchasedPlan(PLANS[0]);purchasedPlanRef.current=PLANS[0];setSelectedTpl(1);try{sessionStorage.removeItem("cv_session");}catch{}goStep(1);}} disabled={pdfBusy} style={{ flex:1, fontSize:12, padding:"9px", opacity:pdfBusy?0.5:1 }}>↺ Recommencer</button>
                    <button className="btn-green" onClick={handleDownload} disabled={generating} style={{ flex:1, fontSize:12, padding:"9px" }}>
                      {hasPaid ? "🖨 PDF" : `🔒 ${currentPlan.price} MAD`}
                    </button>
                  </div>
                </div>

                {/* ── RIGHT PANEL: live preview ── */}
                <div className="cv-editor-right" style={{ flex:1, overflowY:"auto", overflowX:"hidden", background:"#e8e5f0", borderRadius:"0 14px 14px 0", padding:"20px 24px 40px", display:"flex", flexDirection:"column", alignItems:"center" }}>

                  <div className="cv-editor-toolbar" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", maxWidth:A4_W, marginBottom:14 }}>
                    <div style={{ fontSize:12, color:"#6b7280", display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:"#7c3aed", display:"inline-block", animation:"pulse 2s infinite" }}/>
                      Aperçu · <strong style={{ color:"#1e1147" }}>{TEMPLATES.find(t=>t.id===selectedTpl)?.name}</strong>
                      {saveToast && (
                        <span style={{ fontSize:10, color:"#059669", fontWeight:700, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:100, padding:"2px 10px", animation:"fadeUp .3s ease both" }}>
                          ✓ Sauvegardé
                        </span>
                      )}
                    </div>
                    <div className="cv-editor-toolbar-btns" style={{ display:"flex", gap:8 }}>
                      <button className="btn-green" onClick={handleDownload} disabled={generating} style={{ fontSize:11, padding:"6px 14px" }}>
                        {hasPaid ? "🖨 Télécharger PDF" : `🔒 ${currentPlan.price} MAD · Télécharger`}
                      </button>
                    </div>
                  </div>

                  {justPaid && (
                    <div style={{ width:"100%", maxWidth:A4_W, marginBottom:14, background:"linear-gradient(135deg,#059669,#047857)", borderRadius:12, padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap", boxShadow:"0 4px 16px rgba(5,150,105,.3)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:22 }}>✓</span>
                        <div>
                          <div style={{ color:"white", fontWeight:700, fontSize:13 }}>Paiement confirmé — votre CV est prêt !</div>
                          <div style={{ color:"rgba(255,255,255,.75)", fontSize:11, marginTop:2 }}>Cliquez sur le bouton pour télécharger votre PDF</div>
                        </div>
                      </div>
                      <button onClick={() => { setJustPaid(false); downloadPDF(); }}
                        style={{ background:"white", color:"#047857", border:"none", borderRadius:8, padding:"9px 18px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                        🖨 Télécharger mon CV →
                      </button>
                    </div>
                  )}

                  {/* FIX: cv-preview-outer overflow changed for mobile scrolling */}
                  <div className="cv-preview-outer" style={{ width:"100%", display:"flex", justifyContent:"center", overflow:"hidden" }}>
                    <div className="cv-scale-wrap"
                      style={{ transformOrigin:"top center", transform:"scale(var(--cv-scale, 0.82))", width:A4_W, flexShrink:0,
                               marginBottom:`calc((var(--cv-scale, 0.82) - 1) * ${A4_H}px)` }}>
                      {generating ? (
                        <div style={{ background:"white", boxShadow:"0 8px 40px rgba(0,0,0,.18)", width:A4_W, minHeight:A4_H, padding:"48px 52px", boxSizing:"border-box", display:"flex", flexDirection:"column", gap:20, position:"relative" }}>
                          {[72, 55, 80, 55, 65].map((w, i) => (
                            <div key={i} style={{ display:"flex", flexDirection:"column", gap:8 }}>
                              <div style={{ width:100, height:12, borderRadius:3, background:"linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)", backgroundSize:"400% 100%", animation:`shimmer 1.4s infinite ${i*0.1}s` }}/>
                              {[w, w-15, w-8].map((bw, j) => (
                                <div key={j} style={{ width:`${bw}%`, height:10, borderRadius:3, background:"linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)", backgroundSize:"400% 100%", animation:`shimmer 1.4s infinite ${(i+j)*0.08}s` }}/>
                              ))}
                            </div>
                          ))}
                          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                            <div style={{ width:44, height:44, border:"3px solid #ede9fe", borderTopColor:"#7c3aed", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
                            <div style={{ fontSize:13, fontWeight:700, color:"#7c3aed", background:"white", padding:"6px 16px", borderRadius:100, boxShadow:"0 2px 12px rgba(124,58,237,.15)" }}>Génération en cours…</div>
                          </div>
                        </div>
                      ) : tplSwitching ? (
                        <div style={{ background:"white", boxShadow:"0 8px 40px rgba(0,0,0,.18)", width:A4_W, height:500, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                            <div style={{ width:32, height:32, border:"3px solid #ede9fe", borderTopColor:"#7c3aed", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>
                            <div style={{ fontSize:12, color:"#7c3aed", fontWeight:600 }}>Changement de modèle…</div>
                          </div>
                        </div>
                      ) : (
                        <div ref={printRef} style={{ background:"white", boxShadow:"0 8px 40px rgba(0,0,0,.18)", overflow:"hidden" }}>
                          <RenderCV id={selectedTpl} cv={cv} accent={ac} font={fn} hidden={hiddenSections}/>
                        </div>
                      )}
                    </div>
                  </div>

                  {genError && <div style={{ marginTop:16, background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:8, padding:"12px 16px", fontSize:13, color:"#dc2626", maxWidth:A4_W, width:"100%" }}>⚠ {genError}</div>}

                  {bonusLoading && (
                    <div style={{ marginTop:24, maxWidth:A4_W, width:"100%", background:"white", borderRadius:12, padding:"18px 20px", border:"1.5px solid #ede9fe", display:"flex", alignItems:"center", gap:12 }}>
                      <div className="spinner" style={{ width:20, height:20 }}/>
                      <span style={{ fontSize:13, color:"#7c3aed", fontWeight:600 }}>Génération de la lettre de motivation…</span>
                    </div>
                  )}
                  {bonusError && (
                    <div style={{ marginTop:16, maxWidth:A4_W, width:"100%", background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:10, padding:"14px 16px", fontSize:13, color:"#dc2626" }}>
                      ⚠ {bonusError}
                    </div>
                  )}

                  {(coverLetter || linkedinSummary || executiveBio || interviewQuestions) && (
                    <div style={{ marginTop:24, maxWidth:A4_W, width:"100%", display:"flex", flexDirection:"column", gap:12 }}>
                      {!hasPaid && (
                        <div style={{ background:"linear-gradient(135deg,#1e1147,#3b1fa3)", borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontSize:22 }}>🔒</span>
                            <div>
                              <div style={{ color:"white", fontWeight:700, fontSize:13 }}>Contenu premium généré et prêt</div>
                              <div style={{ color:"rgba(255,255,255,.6)", fontSize:11, marginTop:2 }}>Téléchargez votre CV pour débloquer les extras</div>
                            </div>
                          </div>
                          <button onClick={handleDownload} style={{ background:"linear-gradient(135deg,#f97316,#ea580c)", color:"white", border:"none", borderRadius:8, padding:"9px 18px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                            Débloquer · {currentPlan.price} MAD →
                          </button>
                        </div>
                      )}

                      {coverLetter && (
                        <div style={{ background:"white", borderRadius:12, padding:"20px 24px", border:"1.5px solid #ede9fe" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                            <span style={{ fontSize:18 }}>✉</span>
                            <div style={{ fontSize:14, fontWeight:800, color:"#1e1147" }}>Lettre de motivation</div>
                            <span style={{ marginLeft:"auto", fontSize:11, background:"#f5f3ff", color:"#7c3aed", padding:"3px 10px", borderRadius:100, fontWeight:700, border:"1px solid #ddd6fe" }}>Incluse</span>
                          </div>
                          <pre style={{ fontSize:12, lineHeight:1.85, color:"#374151", whiteSpace:"pre-wrap", fontFamily:"inherit", margin:0, filter:hasPaid?"none":"blur(4px)", userSelect:hasPaid?"auto":"none" }}>{coverLetter}</pre>
                          {hasPaid && (
                            <div style={{ display:"flex", gap:8, marginTop:14 }}>
                              <button onClick={()=>{navigator.clipboard.writeText(coverLetter);setCopied("cover");if(copiedTimer.current)clearTimeout(copiedTimer.current);copiedTimer.current=setTimeout(()=>setCopied(null),2000);}}
                                style={{ background:copied==="cover"?"#059669":"#f5f3ff", color:copied==="cover"?"white":"#7c3aed", border:"1.5px solid #ddd6fe", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                                {copied==="cover" ? "✓ Copié !" : "📋 Copier"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {linkedinSummary && (
                        <div style={{ background:"white", borderRadius:12, padding:"20px 24px", border:"1.5px solid #dbeafe" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                            <span style={{ fontSize:18 }}>💼</span>
                            <div style={{ fontSize:14, fontWeight:800, color:"#1e1147" }}>Résumé LinkedIn</div>
                          </div>
                          <p style={{ fontSize:13, lineHeight:1.8, color:"#374151", margin:0, filter:hasPaid?"none":"blur(4px)" }}>{linkedinSummary}</p>
                          {hasPaid && (
                            <button onClick={()=>{navigator.clipboard.writeText(linkedinSummary);setCopied("linkedin");if(copiedTimer.current)clearTimeout(copiedTimer.current);copiedTimer.current=setTimeout(()=>setCopied(null),2000);}}
                              style={{ marginTop:12, background:copied==="linkedin"?"#059669":"#eff6ff", color:copied==="linkedin"?"white":"#1d4ed8", border:"1.5px solid #bfdbfe", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                              {copied==="linkedin" ? "✓ Copié !" : "📋 Copier"}
                            </button>
                          )}
                        </div>
                      )}

                      {executiveBio && (
                        <div style={{ background:"white", borderRadius:12, padding:"20px 24px", border:"1.5px solid #fde68a" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                            <span style={{ fontSize:18 }}>👔</span>
                            <div style={{ fontSize:14, fontWeight:800, color:"#1e1147" }}>Bio Exécutive</div>
                          </div>
                          <pre style={{ fontSize:12, lineHeight:1.85, color:"#374151", whiteSpace:"pre-wrap", fontFamily:"inherit", margin:0, filter:hasPaid?"none":"blur(4px)" }}>{executiveBio}</pre>
                          {hasPaid && (
                            <button onClick={()=>{navigator.clipboard.writeText(executiveBio);setCopied("bio");if(copiedTimer.current)clearTimeout(copiedTimer.current);copiedTimer.current=setTimeout(()=>setCopied(null),2000);}}
                              style={{ marginTop:12, background:copied==="bio"?"#059669":"#fef3c7", color:copied==="bio"?"white":"#92400e", border:"1.5px solid #fde68a", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                              {copied==="bio" ? "✓ Copié !" : "📋 Copier"}
                            </button>
                          )}
                        </div>
                      )}

                      {interviewQuestions && (
                        <div style={{ background:"white", borderRadius:12, padding:"20px 24px", border:"1.5px solid #ede9fe" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                            <span style={{ fontSize:18 }}>🎯</span>
                            <div style={{ fontSize:14, fontWeight:800, color:"#1e1147" }}>Questions d&apos;entretien IA</div>
                          </div>
                          <div style={{ filter:hasPaid?"none":"blur(4px)" }}>
                            {interviewQuestions.map((q,i) => (
                              <div key={i} style={{ marginBottom:14, paddingBottom:14, borderBottom:i<interviewQuestions.length-1?"1px solid #f3f4f6":"none" }}>
                                <pre style={{ fontSize:12, lineHeight:1.8, color:"#374151", whiteSpace:"pre-wrap", fontFamily:"inherit", margin:0 }}>{q}</pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── UPLOAD PAYWALL MODAL ── */}
          {uploadPaywall && (
            <div className="modal-bg" onClick={()=>setUploadPaywall(false)}>
              <div className="modal-box" style={{maxWidth:680}} onClick={e=>e.stopPropagation()}>
                <div style={{background:"#0f172a",padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{color:"white",fontWeight:800,fontSize:15}}>Amélioration de CV par IA</div>
                    <div style={{color:"rgba(255,255,255,.45)",fontSize:12,marginTop:2}}>Choisissez votre formule pour continuer</div>
                  </div>
                  <button onClick={()=>setUploadPaywall(false)} style={{background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.7)",fontSize:20,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>×</button>
                </div>
                <div style={{padding:"24px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
                    {PLANS.map(plan=>{
                      const featured=plan.name==="Professionnel";
                      return (
                        <div key={plan.name} className={`pay-card${featured?" featured":""}`} style={{position:"relative",padding:"20px 18px"}}>
                          {featured && <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:"#16a34a",color:"white",fontSize:10,fontWeight:700,padding:"3px 12px",borderRadius:100,whiteSpace:"nowrap"}}>⭐ Populaire</div>}
                          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#6b7280",marginBottom:8}}>{plan.name}</div>
                          <div style={{fontSize:32,fontWeight:800,color:"#0f172a",lineHeight:1,marginBottom:12}}>{plan.price} MAD</div>
                          <ul style={{listStyle:"none",marginBottom:16}}>
                            {PLAN_FEATURES[plan.name].map(f=><li key={f} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,marginBottom:6,color:"#374151"}}><span style={{color:"#16a34a",fontWeight:700}}>✓</span>{f}</li>)}
                          </ul>
                          <button className="btn-green" onClick={()=>selectPlanAndGenerate(plan,"upload")} style={{width:"100%",background:featured?"#16a34a":"white",color:featured?"white":"#16a34a",border:featured?"none":"1.5px solid #16a34a",fontSize:13,padding:"10px"}}>
                            Générer mon CV
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {genError && <p style={{fontSize:12,color:"#dc2626",textAlign:"center",marginTop:8,marginBottom:0}}>⚠ {genError}</p>}
                  <p style={{fontSize:11,color:"#9ca3af",textAlign:"center",marginTop:8}}>🔒 Paiement sécurisé · Aucune donnée bancaire stockée</p>
                </div>
              </div>
            </div>
          )}

          {/* ── GENERATING OVERLAY ── */}
          {generating && step!==5 && (
            <div className="modal-bg">
              <div className="modal-box" style={{maxWidth:400,padding:"40px 32px",textAlign:"center"}}>
                <div className="spinner" style={{margin:"0 auto 20px"}}/>
                <div style={{fontSize:17,fontWeight:800,marginBottom:6}}>Génération en cours…</div>
                <div style={{fontSize:13,color:"#6b7280",marginBottom:24}}>L&apos;IA prépare votre CV professionnel.</div>
                <div style={{textAlign:"left"}}>
                  {GEN_STEPS.map((label,i)=>(
                    <div key={i} className="gen-step" style={{color:genStep>i?"#16a34a":genStep===i?"#0f172a":"#d1d5db"}}>
                      <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,background:genStep>i?"#16a34a":genStep===i?"#0f172a":"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:genStep>=i?"white":"#9ca3af",fontWeight:700}}>
                        {genStep>i?"✓":(i+1)}
                      </div>
                      {label}
                    </div>
                  ))}
                </div>
                {genError && <div style={{marginTop:20,padding:"12px",background:"#fef2f2",borderRadius:8,fontSize:13,color:"#dc2626",textAlign:"left"}}>{genError}</div>}
              </div>
            </div>
          )}

          {/* ── TEMPLATE PREVIEW MODAL ── */}
          {previewTpl!==null && (()=>{
            const t=TEMPLATES.find(tpl=>tpl.id===previewTpl)!;
            const bs=BADGE_STYLES[t.badge];
            return (
              <div className="modal-bg" onClick={()=>setPreviewTpl(null)}>
                <div className="modal-box" onClick={e=>e.stopPropagation()}>
                  <div style={{background:"#0f172a",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{background:bs.bg,color:bs.color,fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:100}}>{({gratuit:"Gratuit",pro:"Pro",nouveau:"Nouveau"})[t.badge]}</span>
                      <span style={{color:"white",fontWeight:700,fontSize:15}}>{t.name}</span>
                    </div>
                    <button onClick={()=>setPreviewTpl(null)} style={{background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.7)",fontSize:20,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>×</button>
                  </div>
                  <div style={{overflowY:"auto",maxHeight:"70vh",background:"#f8fafc",padding:"20px"}}>
                    <div style={{width:A4_W,margin:"0 auto",boxShadow:"0 4px 24px rgba(0,0,0,.1)",borderRadius:4,overflow:"hidden"}}>
                      <RenderCV id={t.id} cv={SAMPLE}/>
                    </div>
                  </div>
                  <div style={{background:"white",borderTop:"1.5px solid #f0f0f0",padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                    <div style={{fontSize:13,color:"#6b7280"}}>Aperçu avec données fictives</div>
                    <div style={{display:"flex",gap:10}}>
                      <button className="btn-outline" onClick={()=>setPreviewTpl(null)}>Fermer</button>
                      <button className="btn-green" onClick={()=>{setSelectedTpl(t.id);setPreviewTpl(null);}}>
                        {selectedTpl===t.id?"✓ Sélectionné":"Choisir ce modèle →"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

        {/* ── FOOTER ── */}
        <footer style={{background:"#0f172a",padding:"24px",textAlign:"center"}}>
          <span style={{fontSize:12,color:"rgba(255,255,255,.25)"}}>© 2026 Talent Maroc</span>
        </footer>
      </div>
    </>
  );
}

function StepBack({ label, onClick }: { label:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,color:"#6b7280",background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:16,fontFamily:"inherit",padding:0}}>
      {label}
    </button>
  );
}