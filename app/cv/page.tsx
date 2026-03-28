"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

// ── PADDLE CONFIG ──────────────────────────────────────────────────────────
// 🔑 REPLACE these with your real values from paddle.com
// While testing:  PADDLE_ENV = "sandbox"  +  use your sandbox token + sandbox price IDs
// When live:      PADDLE_ENV = "production" + use your live token + live price IDs
const PADDLE_CLIENT_TOKEN = "test_f6beac788c5a1289b346269ad2a";  // from Paddle → Developer Tools → Authentication
const PADDLE_ENV = "sandbox" as "sandbox" | "production";       // change to "production" when going live
const PADDLE_PRICE_IDS    = {
  starter:       "pri_01kmgxck2ancmk83gjky609g1r",
  professionnel: "pri_01kmgx9tx3xhdn8gadp5sqqdzt",
  cadre:         "pri_01kmgx4gba4kvpn78wr2ds9qwb",
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
  photo?:      string; // base64 data URL
}

interface Template {
  id:    number;
  name:  string;
  cat:   "classic"|"modern"|"minimal"|"executive"|"creative"|"twocol"|"timeline"|"rightsidebar";
  desc:  string;
  badge: "gratuit"|"pro"|"nouveau";
}

interface Plan { name: string; price: string; paddlePriceId: string; }
type Step = 1|2|3|4;
type Mode = "upload"|"ai";

// ── SAMPLE CV DATA (used in previews) ──────────────────────────────────────
const SAMPLE: CVData = {
  name:     "Youssef Benali",
  title:    "Développeur Full Stack Senior",
  email:    "youssef@email.ma",
  phone:    "+212 6 00 00 00 00",
  location: "Casablanca, Maroc",
  profile:  "Ingénieur Full Stack avec 5 ans d'expérience dans le développement d'applications web et mobiles à fort trafic. Expert React, Node.js et architectures cloud. Passionné par la qualité du code et les performances système.",
  experiences: [
    { company:"Capgemini Maroc", role:"Lead Developer", period:"2021 – Présent",
      bullets:["Pilotage d'une équipe de 6 développeurs sur des projets clients grands comptes","Architecture microservices, CI/CD GitHub Actions, déploiement AWS","Réduction de 40% du temps de chargement sur l'application principale"] },
    { company:"OCP Digital", role:"Développeur Full Stack", period:"2019 – 2021",
      bullets:["Développement de portails RH internes avec React et Node.js","Intégration GraphQL et migration base de données PostgreSQL","Accompagnement des équipes métier dans l'adoption des nouveaux outils"] },
  ],
  education: [
    { school:"ENSA Rabat", degree:"Master Génie Informatique", year:"2019" },
    { school:"CPGE Casablanca", degree:"Classes Préparatoires MP", year:"2016" },
  ],
  skills: ["React","Next.js","TypeScript","Node.js","Python","PostgreSQL","AWS","Docker","Git"],
  languages: [
    { lang:"Arabe",   level:"Natif"    },
    { lang:"Français",level:"Courant"  },
    { lang:"Anglais", level:"Courant"  },
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
  gratuit:{ bg:"#f0fdf4", color:"#15803d" },
  pro:    { bg:"#fef3c7", color:"#92400e" },
  nouveau:{ bg:"#eff6ff", color:"#1d4ed8" },
};

const PLANS: Plan[] = [
  { name:"Starter",       price:"1.99", paddlePriceId: PADDLE_PRICE_IDS.starter       },
  { name:"Professionnel", price:"4.99", paddlePriceId: PADDLE_PRICE_IDS.professionnel },
  { name:"Cadre",         price:"9.99", paddlePriceId: PADDLE_PRICE_IDS.cadre         },
];

const PLAN_FEATURES: Record<string,string[]> = {
  Starter:       ["1 CV généré","Téléchargement PDF","Compatible ATS","Livraison instantanée"],
  Professionnel: ["3 versions","PDF + Word","Lettre de motivation","Résumé LinkedIn","Prioritaire"],
  Cadre:         ["Révisions illimitées","PDF + Word + HTML","Lettre + Bio","Questions d'entretien IA","Support prioritaire"],
};

const PLAN_CAPS = {
  Starter: {
    allowPdf: true,
    allowWord: false,
    allowHtml: false,
    allowCoverLetter: false,
    allowLinkedIn: false,
    templateLimit: 1,
  },
  Professionnel: {
    allowPdf: true,
    allowWord: true,
    allowHtml: false,
    allowCoverLetter: true,
    allowLinkedIn: true,
    templateLimit: 3,
  },
  Cadre: {
    allowPdf: true,
    allowWord: true,
    allowHtml: true,
    allowCoverLetter: true,
    allowLinkedIn: true,
    templateLimit: 999,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ── CV TEMPLATE RENDERERS ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. CLASSIQUE ──────────────────────────────────────────────────────────
function TplClassique({ cv, scale=1 }: { cv: CVData; scale?: number }) {
  return (
    <div style={{ width:794, background:"white", fontFamily:"'Georgia',serif", color:"#1a1a1a", padding:"52px 60px", transform:`scale(${scale})`, transformOrigin:"top left" }}>
      {/* Header */}
      <div style={{ textAlign:"center", borderBottom:"2px solid #1a1a1a", paddingBottom:18, marginBottom:20 }}>
        <div style={{ fontSize:28, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>{cv.name}</div>
        <div style={{ fontSize:13, color:"#444", letterSpacing:"0.05em", marginBottom:8 }}>{cv.title}</div>
        <div style={{ fontSize:11, color:"#666", display:"flex", justifyContent:"center", gap:20, flexWrap:"wrap" }}>
          <span>{cv.email}</span><span>·</span><span>{cv.phone}</span><span>·</span><span>{cv.location}</span>
        </div>
      </div>
      {/* Profile */}
      <Section title="Profil Professionnel">
        <p style={{ fontSize:12, lineHeight:1.8, color:"#333" }}>{cv.profile}</p>
      </Section>
      {/* Experience */}
      <Section title="Expériences Professionnelles">
        {cv.experiences.map((e,i) => (
          <div key={i} style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <div style={{ fontSize:13, fontWeight:700 }}>{e.role} — {e.company}</div>
              <div style={{ fontSize:11, color:"#666", flexShrink:0, marginLeft:12 }}>{e.period}</div>
            </div>
            <ul style={{ paddingLeft:18, margin:0 }}>{e.bullets.map((b,j)=><li key={j} style={{ fontSize:12, lineHeight:1.7, color:"#333" }}>{b}</li>)}</ul>
          </div>
        ))}
      </Section>
      {/* Education */}
      <Section title="Formation">
        {cv.education.map((e,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <div><span style={{ fontSize:12, fontWeight:700 }}>{e.degree}</span> <span style={{ fontSize:12, color:"#444" }}>— {e.school}</span></div>
            <div style={{ fontSize:11, color:"#666" }}>{e.year}</div>
          </div>
        ))}
      </Section>
      {/* Two col */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>
        <Section title="Compétences">
          <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 12px" }}>
            {cv.skills.map((s,i)=><span key={i} style={{ fontSize:12, color:"#333" }}>• {s}</span>)}
          </div>
        </Section>
        <Section title="Langues">
          {cv.languages.map((l,i)=><div key={i} style={{ fontSize:12, marginBottom:4 }}><strong>{l.lang}</strong> — {l.level}</div>)}
        </Section>
      </div>
      {cv.certifications && cv.certifications.length > 0 && (
        <Section title="Certifications">
          {cv.certifications.map((c,i)=><div key={i} style={{ fontSize:12, marginBottom:4 }}>• {c}</div>)}
        </Section>
      )}
    </div>
  );
}

// ── 2. MODERNE ────────────────────────────────────────────────────────────
function TplModerne({ cv, scale=1 }: { cv: CVData; scale?: number }) {
  return (
    <div style={{ width:794, background:"white", fontFamily:"'Inter',sans-serif", display:"flex", transform:`scale(${scale})`, transformOrigin:"top left", minHeight:600 }}>
      {/* Sidebar */}
      <div style={{ width:240, background:"#1e3a5f", padding:"40px 24px", flexShrink:0 }}>
        {/* Avatar — photo if available, else initial */}
        {cv.photo ? (
          <img src={cv.photo} alt={cv.name} style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", marginBottom:20, border:"3px solid rgba(255,255,255,0.2)" }}/>
        ) : (
          <div style={{ width:72, height:72, borderRadius:"50%", background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:800, color:"white", marginBottom:20 }}>
            {cv.name.charAt(0)}
          </div>
        )}
        <div style={{ fontSize:16, fontWeight:800, color:"white", marginBottom:4, lineHeight:1.2 }}>{cv.name}</div>
        <div style={{ fontSize:11, color:"#93c5fd", marginBottom:24, lineHeight:1.4 }}>{cv.title}</div>
        <SideSection title="Contact" light>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)", lineHeight:2 }}>
            <div>✉ {cv.email}</div><div>📞 {cv.phone}</div><div>📍 {cv.location}</div>
          </div>
        </SideSection>
        <SideSection title="Compétences" light>
          {cv.skills.map((s,i)=>(
            <div key={i} style={{ marginBottom:5 }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.85)", marginBottom:2 }}>{s}</div>
              <div style={{ height:3, background:"rgba(255,255,255,0.15)", borderRadius:2 }}>
                <div style={{ height:3, background:"#3b82f6", borderRadius:2, width:`${75+((i*13)%25)}%` }}/>
              </div>
            </div>
          ))}
        </SideSection>
        <SideSection title="Langues" light>
          {cv.languages.map((l,i)=><div key={i} style={{ fontSize:10, color:"rgba(255,255,255,0.8)", marginBottom:4 }}>{l.lang} <span style={{ color:"#93c5fd" }}>— {l.level}</span></div>)}
        </SideSection>
        {cv.certifications && <SideSection title="Certifications" light>{cv.certifications.map((c,i)=><div key={i} style={{ fontSize:10, color:"rgba(255,255,255,0.7)", marginBottom:4, lineHeight:1.5 }}>• {c}</div>)}</SideSection>}
      </div>
      {/* Main */}
      <div style={{ flex:1, padding:"40px 36px" }}>
        <div style={{ fontSize:12, color:"#374151", lineHeight:1.8, marginBottom:24, paddingBottom:20, borderBottom:"2px solid #e5e7eb" }}>{cv.profile}</div>
        <MSection title="Expériences" accent="#1e3a5f">
          {cv.experiences.map((e,i)=>(
            <div key={i} style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{e.role}</div>
                <div style={{ fontSize:10, color:"#6b7280", background:"#f3f4f6", padding:"2px 8px", borderRadius:100, flexShrink:0, marginLeft:8 }}>{e.period}</div>
              </div>
              <div style={{ fontSize:11, color:"#3b82f6", fontWeight:600, marginBottom:4 }}>{e.company}</div>
              <ul style={{ paddingLeft:16, margin:0 }}>{e.bullets.map((b,j)=><li key={j} style={{ fontSize:11, lineHeight:1.7, color:"#374151" }}>{b}</li>)}</ul>
            </div>
          ))}
        </MSection>
        <MSection title="Formation" accent="#1e3a5f">
          {cv.education.map((e,i)=>(
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{e.degree}</div>
              <div style={{ fontSize:11, color:"#6b7280" }}>{e.school} · {e.year}</div>
            </div>
          ))}
        </MSection>
      </div>
    </div>
  );
}

// ── 3. MINIMALISTE ────────────────────────────────────────────────────────
function TplMinimal({ cv, scale=1 }: { cv: CVData; scale?: number }) {
  return (
    <div style={{ width:794, background:"white", fontFamily:"'Helvetica Neue',Helvetica,sans-serif", padding:"60px 72px", transform:`scale(${scale})`, transformOrigin:"top left" }}>
      {/* Header */}
      <div style={{ marginBottom:36 }}>
        <div style={{ fontSize:32, fontWeight:300, color:"#0f172a", letterSpacing:"-0.02em", marginBottom:4 }}>{cv.name}</div>
        <div style={{ fontSize:13, color:"#64748b", fontWeight:400, marginBottom:12 }}>{cv.title}</div>
        <div style={{ display:"flex", gap:24, fontSize:11, color:"#94a3b8" }}>
          <span>{cv.email}</span><span>{cv.phone}</span><span>{cv.location}</span>
        </div>
      </div>
      {/* Thin rule */}
      <div style={{ height:1, background:"#e2e8f0", marginBottom:28 }}/>
      {/* Profile */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"#94a3b8", marginBottom:10 }}>À Propos</div>
        <p style={{ fontSize:12, lineHeight:1.9, color:"#475569", maxWidth:580 }}>{cv.profile}</p>
      </div>
      {/* Experience */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"#94a3b8", marginBottom:14 }}>Expérience</div>
        {cv.experiences.map((e,i)=>(
          <div key={i} style={{ display:"grid", gridTemplateColumns:"140px 1fr", gap:20, marginBottom:18 }}>
            <div>
              <div style={{ fontSize:11, color:"#64748b", lineHeight:1.5 }}>{e.period}</div>
              <div style={{ fontSize:11, color:"#0ea5e9", fontWeight:500 }}>{e.company}</div>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:"#0f172a", marginBottom:6 }}>{e.role}</div>
              {e.bullets.map((b,j)=><div key={j} style={{ fontSize:11, color:"#475569", lineHeight:1.7, marginBottom:3 }}>— {b}</div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ height:1, background:"#e2e8f0", marginBottom:24 }}/>
      {/* Three col bottom */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:24 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"#94a3b8", marginBottom:10 }}>Formation</div>
          {cv.education.map((e,i)=><div key={i} style={{ marginBottom:8 }}><div style={{ fontSize:11, fontWeight:500, color:"#0f172a" }}>{e.degree}</div><div style={{ fontSize:10, color:"#64748b" }}>{e.school} · {e.year}</div></div>)}
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"#94a3b8", marginBottom:10 }}>Compétences</div>
          {cv.skills.map((s,i)=><div key={i} style={{ fontSize:11, color:"#475569", marginBottom:4 }}>{s}</div>)}
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"#94a3b8", marginBottom:10 }}>Langues</div>
          {cv.languages.map((l,i)=><div key={i} style={{ fontSize:11, color:"#475569", marginBottom:4 }}>{l.lang} <span style={{ color:"#94a3b8" }}>/ {l.level}</span></div>)}
        </div>
      </div>
    </div>
  );
}

// ── 4. EXÉCUTIF ───────────────────────────────────────────────────────────
function TplExecutif({ cv, scale=1 }: { cv: CVData; scale?: number }) {
  return (
    <div style={{ width:794, background:"#0c0a09", fontFamily:"'Georgia',serif", transform:`scale(${scale})`, transformOrigin:"top left", minHeight:600 }}>
      {/* Gold header */}
      <div style={{ background:"linear-gradient(135deg,#1c1410,#2d1f0e)", padding:"44px 56px 32px", borderBottom:"2px solid #d4af37" }}>
        <div style={{ fontSize:30, fontWeight:700, color:"#f5f0e8", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:6 }}>{cv.name}</div>
        <div style={{ fontSize:13, color:"#d4af37", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>{cv.title}</div>
        <div style={{ display:"flex", gap:24, fontSize:11, color:"rgba(255,255,255,0.5)" }}>
          <span>{cv.email}</span><span>|</span><span>{cv.phone}</span><span>|</span><span>{cv.location}</span>
        </div>
      </div>
      <div style={{ padding:"32px 56px" }}>
        {/* Profile */}
        <div style={{ marginBottom:24, paddingBottom:20, borderBottom:"1px solid rgba(212,175,55,0.2)" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"#d4af37", marginBottom:10 }}>Profil Exécutif</div>
          <p style={{ fontSize:12, lineHeight:1.9, color:"rgba(255,255,255,0.75)", fontStyle:"italic" }}>{cv.profile}</p>
        </div>
        {/* Experience */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"#d4af37", marginBottom:14 }}>Parcours Professionnel</div>
          {cv.experiences.map((e,i)=>(
            <div key={i} style={{ marginBottom:18, paddingLeft:16, borderLeft:"2px solid #d4af37" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#f5f0e8" }}>{e.role}</div>
                <div style={{ fontSize:11, color:"#d4af37" }}>{e.period}</div>
              </div>
              <div style={{ fontSize:12, color:"#d4af37", opacity:0.7, marginBottom:6 }}>{e.company}</div>
              {e.bullets.map((b,j)=><div key={j} style={{ fontSize:11, color:"rgba(255,255,255,0.65)", lineHeight:1.7, marginBottom:3 }}>◆ {b}</div>)}
            </div>
          ))}
        </div>
        {/* Two col */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"#d4af37", marginBottom:12 }}>Formation</div>
            {cv.education.map((e,i)=><div key={i} style={{ marginBottom:10 }}><div style={{ fontSize:12, color:"#f5f0e8", fontWeight:600 }}>{e.degree}</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{e.school} · {e.year}</div></div>)}
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"#d4af37", marginBottom:12 }}>Compétences Clés</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {cv.skills.map((s,i)=><span key={i} style={{ fontSize:10, color:"#d4af37", border:"1px solid rgba(212,175,55,0.35)", padding:"3px 10px", borderRadius:2 }}>{s}</span>)}
            </div>
            <div style={{ marginTop:16, fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"#d4af37", marginBottom:10 }}>Langues</div>
            {cv.languages.map((l,i)=><div key={i} style={{ fontSize:11, color:"rgba(255,255,255,0.65)", marginBottom:4 }}>{l.lang} — {l.level}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 5. CRÉATIF ────────────────────────────────────────────────────────────
function TplCreatif({ cv, scale=1 }: { cv: CVData; scale?: number }) {
  return (
    <div style={{ width:794, background:"white", fontFamily:"'Inter',sans-serif", transform:`scale(${scale})`, transformOrigin:"top left" }}>
      {/* Bold top bar */}
      <div style={{ height:8, background:"linear-gradient(90deg,#7c3aed,#ec4899,#f97316)" }}/>
      <div style={{ padding:"40px 52px" }}>
        {/* Header - big name */}
        <div style={{ marginBottom:28, display:"flex", alignItems:"flex-start", gap:20 }}>
          {cv.photo && (
            <img src={cv.photo} alt={cv.name} style={{ width:80, height:80, borderRadius:12, objectFit:"cover", flexShrink:0, border:"2px solid #e9d5ff" }}/>
          )}
          <div>
            <div style={{ fontSize:34, fontWeight:900, color:"#0f172a", letterSpacing:"-0.03em", lineHeight:1, marginBottom:6 }}>{cv.name}</div>
            <div style={{ fontSize:14, fontWeight:600, background:"linear-gradient(90deg,#7c3aed,#ec4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:12 }}>{cv.title}</div>
            <div style={{ display:"flex", gap:20, fontSize:11, color:"#6b7280", flexWrap:"wrap" }}>
              <span>✉ {cv.email}</span><span>📞 {cv.phone}</span><span>📍 {cv.location}</span>
            </div>
          </div>
        </div>
        {/* Profile with left border */}
        <div style={{ borderLeft:"4px solid #7c3aed", paddingLeft:16, marginBottom:28 }}>
          <p style={{ fontSize:12, lineHeight:1.8, color:"#374151" }}>{cv.profile}</p>
        </div>
        {/* Two col layout */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:36 }}>
          {/* Left */}
          <div>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:"#7c3aed", marginBottom:14 }}>Expériences</div>
            {cv.experiences.map((e,i)=>(
              <div key={i} style={{ marginBottom:18, position:"relative", paddingLeft:16 }}>
                <div style={{ position:"absolute", left:0, top:5, width:6, height:6, borderRadius:"50%", background:"#7c3aed" }}/>
                <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{e.role}</div>
                <div style={{ fontSize:11, color:"#7c3aed", marginBottom:4 }}>{e.company} · <span style={{ color:"#9ca3af" }}>{e.period}</span></div>
                {e.bullets.map((b,j)=><div key={j} style={{ fontSize:11, color:"#374151", lineHeight:1.7 }}>→ {b}</div>)}
              </div>
            ))}
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:"#7c3aed", marginBottom:12, marginTop:20 }}>Formation</div>
            {cv.education.map((e,i)=>(
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{e.degree}</div>
                <div style={{ fontSize:11, color:"#6b7280" }}>{e.school} · {e.year}</div>
              </div>
            ))}
          </div>
          {/* Right */}
          <div>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:"#ec4899", marginBottom:12 }}>Compétences</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20 }}>
              {cv.skills.map((s,i)=>(
                <span key={i} style={{ fontSize:10, background:i%3===0?"#f3e8ff":i%3===1?"#fce7f3":"#fff7ed", color:i%3===0?"#7c3aed":i%3===1?"#ec4899":"#ea580c", padding:"4px 10px", borderRadius:100, fontWeight:600 }}>{s}</span>
              ))}
            </div>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:"#f97316", marginBottom:12 }}>Langues</div>
            {cv.languages.map((l,i)=>(
              <div key={i} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                  <span style={{ fontWeight:600, color:"#0f172a" }}>{l.lang}</span>
                  <span style={{ color:"#6b7280" }}>{l.level}</span>
                </div>
                <div style={{ height:4, background:"#f3f4f6", borderRadius:2 }}>
                  <div style={{ height:4, borderRadius:2, width:l.level==="Natif"?"100%":l.level==="Courant"?"85%":"55%", background:"linear-gradient(90deg,#7c3aed,#ec4899)" }}/>
                </div>
              </div>
            ))}
            {cv.certifications && cv.certifications.length > 0 && <>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:"#7c3aed", marginBottom:10, marginTop:16 }}>Certifications</div>
              {cv.certifications.map((c,i)=><div key={i} style={{ fontSize:11, color:"#374151", marginBottom:5 }}>🏅 {c}</div>)}
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── NEW TEMPLATES (Reactive Resume inspired layouts) ──────────────────────
// ═══════════════════════════════════════════════════════════════════════════

// ── 6. AZURILL — clean single column, ATS-friendly ────────────────────────
function TplAzurill({ cv, scale=1 }: { cv: CVData; scale?: number }) {
  return (
    <div style={{ width:794, background:"white", fontFamily:"'Calibri','Segoe UI',sans-serif", padding:"48px 56px", transform:`scale(${scale})`, transformOrigin:"top left", color:"#1e293b" }}>
      {/* Header — centered, teal accent */}
      <div style={{ textAlign:"center", marginBottom:24 }}>
        {cv.photo && (
          <img src={cv.photo} alt={cv.name} style={{ width:88, height:88, borderRadius:"50%", objectFit:"cover", marginBottom:14, border:"3px solid #99f6e4", display:"block", margin:"0 auto 14px" }}/>
        )}
        <div style={{ fontSize:30, fontWeight:800, color:"#0f172a", letterSpacing:"-0.02em", marginBottom:4 }}>{cv.name}</div>
        <div style={{ fontSize:14, color:"#0d9488", fontWeight:600, marginBottom:10 }}>{cv.title}</div>
        <div style={{ display:"flex", justifyContent:"center", gap:20, fontSize:11, color:"#64748b", flexWrap:"wrap" }}>
          <span>✉ {cv.email}</span>
          <span>📞 {cv.phone}</span>
          <span>📍 {cv.location}</span>
        </div>
      </div>

      {/* Teal rule */}
      <div style={{ height:3, background:"linear-gradient(90deg,#0d9488,#14b8a6,#0d9488)", borderRadius:2, marginBottom:22 }}/>

      {/* Profile */}
      <ASection title="Résumé" accent="#0d9488">
        <p style={{ fontSize:12, lineHeight:1.85, color:"#334155" }}>{cv.profile}</p>
      </ASection>

      {/* Experience */}
      <ASection title="Expérience Professionnelle" accent="#0d9488">
        {cv.experiences.map((e,i)=>(
          <div key={i} style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:3 }}>
              <div>
                <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{e.role}</span>
                <span style={{ fontSize:12, color:"#0d9488", fontWeight:600 }}> · {e.company}</span>
              </div>
              <span style={{ fontSize:11, color:"#94a3b8", flexShrink:0, marginLeft:12, background:"#f1f5f9", padding:"2px 8px", borderRadius:100 }}>{e.period}</span>
            </div>
            <ul style={{ paddingLeft:16, margin:0 }}>
              {e.bullets.map((b,j)=><li key={j} style={{ fontSize:12, lineHeight:1.75, color:"#334155", marginBottom:2 }}>{b}</li>)}
            </ul>
          </div>
        ))}
      </ASection>

      {/* Education */}
      <ASection title="Formation" accent="#0d9488">
        {cv.education.map((e,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{e.degree}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{e.school}</div>
            </div>
            <div style={{ fontSize:11, color:"#94a3b8", flexShrink:0 }}>{e.year}</div>
          </div>
        ))}
      </ASection>

      {/* Bottom row: skills + languages */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:28 }}>
        <ASection title="Compétences" accent="#0d9488">
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {cv.skills.map((s,i)=>(
              <span key={i} style={{ fontSize:10, background:"#f0fdfa", color:"#0d9488", border:"1px solid #99f6e4", padding:"3px 10px", borderRadius:100, fontWeight:600 }}>{s}</span>
            ))}
          </div>
        </ASection>
        <ASection title="Langues" accent="#0d9488">
          {cv.languages.map((l,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6, alignItems:"center" }}>
              <span style={{ fontWeight:600, color:"#0f172a" }}>{l.lang}</span>
              <span style={{ fontSize:10, color:"#0d9488", background:"#f0fdfa", padding:"2px 8px", borderRadius:100, border:"1px solid #99f6e4" }}>{l.level}</span>
            </div>
          ))}
          {cv.certifications?.map((c,i)=>(
            <div key={i} style={{ fontSize:11, color:"#334155", marginBottom:4 }}>🏅 {c}</div>
          ))}
        </ASection>
      </div>
    </div>
  );
}

// ── 7. BRONZOR — right sidebar layout ─────────────────────────────────────
function TplBronzor({ cv, scale=1 }: { cv: CVData; scale?: number }) {
  return (
    <div style={{ width:794, background:"white", fontFamily:"'Inter',sans-serif", display:"flex", transform:`scale(${scale})`, transformOrigin:"top left", minHeight:600 }}>
      {/* Main content — left */}
      <div style={{ flex:1, padding:"40px 36px 40px 44px", borderRight:"1px solid #e2e8f0" }}>
        {/* Name block */}
        <div style={{ marginBottom:24, paddingBottom:20, borderBottom:"2px solid #f1f5f9" }}>
          <div style={{ fontSize:28, fontWeight:800, color:"#0f172a", letterSpacing:"-0.02em", marginBottom:4 }}>{cv.name}</div>
          <div style={{ fontSize:14, color:"#6366f1", fontWeight:600 }}>{cv.title}</div>
        </div>

        {/* Profile */}
        <BSection title="Profil" accent="#6366f1">
          <p style={{ fontSize:12, lineHeight:1.85, color:"#475569" }}>{cv.profile}</p>
        </BSection>

        {/* Experience */}
        <BSection title="Expériences" accent="#6366f1">
          {cv.experiences.map((e,i)=>(
            <div key={i} style={{ marginBottom:18, paddingLeft:12, borderLeft:"3px solid #e0e7ff" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{e.role}</div>
                <div style={{ fontSize:10, color:"#6366f1", background:"#eef2ff", padding:"2px 8px", borderRadius:100, flexShrink:0, marginLeft:8, fontWeight:600 }}>{e.period}</div>
              </div>
              <div style={{ fontSize:11, color:"#6366f1", fontWeight:600, marginBottom:5 }}>{e.company}</div>
              {e.bullets.map((b,j)=><div key={j} style={{ fontSize:11, color:"#475569", lineHeight:1.7, marginBottom:3, paddingLeft:8 }}>· {b}</div>)}
            </div>
          ))}
        </BSection>

        {/* Education */}
        <BSection title="Formation" accent="#6366f1">
          {cv.education.map((e,i)=>(
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{e.degree}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{e.school} · {e.year}</div>
            </div>
          ))}
        </BSection>
      </div>

      {/* Right sidebar */}
      <div style={{ width:200, background:"#f8fafc", padding:"40px 20px", flexShrink:0 }}>
        {/* Contact */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:"#6366f1", marginBottom:12 }}>Contact</div>
          {[cv.email, cv.phone, cv.location].map((v,i)=>(
            <div key={i} style={{ fontSize:10, color:"#475569", marginBottom:6, lineHeight:1.5, wordBreak:"break-all" }}>{v}</div>
          ))}
        </div>

        {/* Skills */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:"#6366f1", marginBottom:12 }}>Compétences</div>
          {cv.skills.map((s,i)=>(
            <div key={i} style={{ marginBottom:7 }}>
              <div style={{ fontSize:10, color:"#334155", marginBottom:3, fontWeight:500 }}>{s}</div>
              <div style={{ height:3, background:"#e2e8f0", borderRadius:2 }}>
                <div style={{ height:3, background:"#6366f1", borderRadius:2, width:`${70+((i*11)%30)}%`, transition:"width .6s" }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Languages */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:"#6366f1", marginBottom:12 }}>Langues</div>
          {cv.languages.map((l,i)=>(
            <div key={i} style={{ marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:3 }}>
                <span style={{ fontWeight:600, color:"#334155" }}>{l.lang}</span>
                <span style={{ color:"#94a3b8" }}>{l.level}</span>
              </div>
              <div style={{ height:3, background:"#e2e8f0", borderRadius:2 }}>
                <div style={{ height:3, background:"#a5b4fc", borderRadius:2, width:l.level==="Natif"?"100%":l.level==="Courant"?"80%":"50%" }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Certs */}
        {cv.certifications && cv.certifications.length>0 && (
          <div>
            <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:"#6366f1", marginBottom:10 }}>Certifications</div>
            {cv.certifications.map((c,i)=><div key={i} style={{ fontSize:10, color:"#475569", marginBottom:6, lineHeight:1.5 }}>✦ {c}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 8. DITTO — balanced two-column layout ─────────────────────────────────
function TplDitto({ cv, scale=1 }: { cv: CVData; scale?: number }) {
  return (
    <div style={{ width:794, background:"white", fontFamily:"'Georgia',serif", transform:`scale(${scale})`, transformOrigin:"top left" }}>
      {/* Header — full width with slate bg */}
      <div style={{ background:"#1e293b", padding:"36px 44px 28px", marginBottom:0 }}>
        <div style={{ fontSize:30, fontWeight:700, color:"white", letterSpacing:"0.04em", textTransform:"uppercase", marginBottom:4 }}>{cv.name}</div>
        <div style={{ fontSize:13, color:"#94a3b8", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:14 }}>{cv.title}</div>
        <div style={{ display:"flex", gap:24, fontSize:11, color:"#64748b", flexWrap:"wrap" }}>
          <span>✉ {cv.email}</span><span>📞 {cv.phone}</span><span>📍 {cv.location}</span>
        </div>
      </div>

      {/* Two column body */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
        {/* Left column */}
        <div style={{ padding:"28px 28px 28px 44px", borderRight:"1px solid #e2e8f0" }}>
          <DSection title="Profil">
            <p style={{ fontSize:12, lineHeight:1.85, color:"#334155" }}>{cv.profile}</p>
          </DSection>
          <DSection title="Formation">
            {cv.education.map((e,i)=>(
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{e.degree}</div>
                <div style={{ fontSize:11, color:"#64748b" }}>{e.school}</div>
                <div style={{ fontSize:10, color:"#94a3b8" }}>{e.year}</div>
              </div>
            ))}
          </DSection>
          <DSection title="Compétences">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 8px" }}>
              {cv.skills.map((s,i)=>(
                <div key={i} style={{ fontSize:11, color:"#334155", display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:4, height:4, borderRadius:"50%", background:"#334155", flexShrink:0 }}/>{s}
                </div>
              ))}
            </div>
          </DSection>
          <DSection title="Langues">
            {cv.languages.map((l,i)=>(
              <div key={i} style={{ fontSize:12, marginBottom:5 }}>
                <strong style={{ color:"#0f172a" }}>{l.lang}</strong>
                <span style={{ color:"#64748b" }}> — {l.level}</span>
              </div>
            ))}
          </DSection>
        </div>

        {/* Right column */}
        <div style={{ padding:"28px 44px 28px 28px" }}>
          <DSection title="Expériences Professionnelles">
            {cv.experiences.map((e,i)=>(
              <div key={i} style={{ marginBottom:18 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:1 }}>{e.role}</div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <div style={{ fontSize:11, color:"#475569", fontStyle:"italic" }}>{e.company}</div>
                  <div style={{ fontSize:10, color:"#94a3b8" }}>{e.period}</div>
                </div>
                <ul style={{ paddingLeft:14, margin:0 }}>
                  {e.bullets.map((b,j)=><li key={j} style={{ fontSize:11, lineHeight:1.7, color:"#334155", marginBottom:2 }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </DSection>
          {cv.certifications && cv.certifications.length>0 && (
            <DSection title="Certifications">
              {cv.certifications.map((c,i)=>(
                <div key={i} style={{ fontSize:11, color:"#334155", marginBottom:5 }}>🏅 {c}</div>
              ))}
            </DSection>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 9. LEAFISH — timeline layout, green nature accent ─────────────────────
function TplLeafish({ cv, scale=1 }: { cv: CVData; scale?: number }) {
  return (
    <div style={{ width:794, background:"#fafaf9", fontFamily:"'Inter',sans-serif", transform:`scale(${scale})`, transformOrigin:"top left" }}>
      {/* Top header band */}
      <div style={{ background:"white", borderBottom:"3px solid #16a34a", padding:"36px 48px 28px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:160, height:"100%", background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", opacity:0.6 }}/>
        <div style={{ position:"relative", display:"flex", alignItems:"flex-start", gap:18 }}>
          {cv.photo && (
            <img src={cv.photo} alt={cv.name} style={{ width:76, height:76, borderRadius:10, objectFit:"cover", flexShrink:0, border:"2px solid #bbf7d0" }}/>
          )}
          <div>
            <div style={{ fontSize:30, fontWeight:800, color:"#0f172a", letterSpacing:"-0.02em", marginBottom:4 }}>{cv.name}</div>
            <div style={{ fontSize:14, color:"#16a34a", fontWeight:700, marginBottom:12 }}>{cv.title}</div>
            <div style={{ display:"flex", gap:20, fontSize:11, color:"#64748b", flexWrap:"wrap" }}>
              <span>✉ {cv.email}</span><span>📞 {cv.phone}</span><span>📍 {cv.location}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:"28px 48px", display:"grid", gridTemplateColumns:"1fr 220px", gap:36 }}>
        {/* Left — timeline experience */}
        <div>
          {/* Profile */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:"#16a34a", marginBottom:10 }}>À Propos</div>
            <p style={{ fontSize:12, lineHeight:1.85, color:"#374151" }}>{cv.profile}</p>
          </div>

          {/* Timeline experience */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:"#16a34a", marginBottom:16 }}>Parcours</div>
            <div style={{ position:"relative", paddingLeft:24 }}>
              {/* Vertical line */}
              <div style={{ position:"absolute", left:7, top:6, bottom:0, width:2, background:"#bbf7d0", borderRadius:2 }}/>

              {cv.experiences.map((e,i)=>(
                <div key={i} style={{ position:"relative", marginBottom:20 }}>
                  {/* Timeline dot */}
                  <div style={{ position:"absolute", left:-24, top:4, width:12, height:12, borderRadius:"50%", background:"#16a34a", border:"2px solid white", boxShadow:"0 0 0 2px #16a34a" }}/>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:3 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{e.role}</div>
                    <div style={{ fontSize:10, color:"#6b7280", background:"#f0fdf4", border:"1px solid #bbf7d0", padding:"2px 8px", borderRadius:100, flexShrink:0, marginLeft:8 }}>{e.period}</div>
                  </div>
                  <div style={{ fontSize:11, color:"#16a34a", fontWeight:600, marginBottom:5 }}>{e.company}</div>
                  {e.bullets.map((b,j)=><div key={j} style={{ fontSize:11, color:"#374151", lineHeight:1.7, marginBottom:2 }}>→ {b}</div>)}
                </div>
              ))}

              {/* Education in timeline */}
              {cv.education.map((e,i)=>(
                <div key={i} style={{ position:"relative", marginBottom:14 }}>
                  <div style={{ position:"absolute", left:-24, top:4, width:12, height:12, borderRadius:"50%", background:"white", border:"2px solid #16a34a" }}/>
                  <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{e.degree}</div>
                  <div style={{ fontSize:11, color:"#6b7280" }}>{e.school} · {e.year}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Skills */}
          <div style={{ background:"white", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"16px", marginBottom:14 }}>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:"#16a34a", marginBottom:12 }}>Compétences</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {cv.skills.map((s,i)=>(
                <span key={i} style={{ fontSize:10, background:"#f0fdf4", color:"#15803d", border:"1px solid #bbf7d0", padding:"3px 9px", borderRadius:100, fontWeight:600 }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div style={{ background:"white", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"16px", marginBottom:14 }}>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:"#16a34a", marginBottom:12 }}>Langues</div>
            {cv.languages.map((l,i)=>(
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                  <span style={{ fontWeight:600, color:"#0f172a" }}>{l.lang}</span>
                  <span style={{ color:"#6b7280", fontSize:10 }}>{l.level}</span>
                </div>
                <div style={{ height:4, background:"#f3f4f6", borderRadius:100 }}>
                  <div style={{ height:4, borderRadius:100, background:"linear-gradient(90deg,#16a34a,#4ade80)", width:l.level==="Natif"?"100%":l.level==="Courant"?"82%":"50%" }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Certifications */}
          {cv.certifications && cv.certifications.length>0 && (
            <div style={{ background:"white", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"16px" }}>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:"#16a34a", marginBottom:10 }}>Certifications</div>
              {cv.certifications.map((c,i)=>(
                <div key={i} style={{ fontSize:10, color:"#374151", marginBottom:6, lineHeight:1.5 }}>🏅 {c}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TEMPLATE-SPECIFIC SECTION HELPERS ─────────────────────────────────────
function ASection({ title, accent, children }: { title:string; accent:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:accent }}>{title}</div>
        <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
      </div>
      {children}
    </div>
  );
}
function BSection({ title, accent, children }: { title:string; accent:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:accent, marginBottom:10, borderLeft:`3px solid ${accent}`, paddingLeft:8 }}>{title}</div>
      {children}
    </div>
  );
}
function DSection({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#1e293b", borderBottom:"2px solid #1e293b", paddingBottom:4, marginBottom:10, display:"inline-block" }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

// ── HELPER SUB-COMPONENTS ─────────────────────────────────────────────────
function Section({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", borderBottom:"1px solid #1a1a1a", paddingBottom:3, marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}
function SideSection({ title, children, light }: { title:string; children:React.ReactNode; light?:boolean }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:light?"rgba(255,255,255,0.4)":"#666", marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );
}
function MSection({ title, children, accent }: { title:string; children:React.ReactNode; accent:string }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:accent, borderBottom:`2px solid ${accent}`, paddingBottom:4, marginBottom:12, display:"inline-block" }}>{title}</div>
      {children}
    </div>
  );
}

// ── RENDER CV BY TEMPLATE ID ───────────────────────────────────────────────
function RenderCV({ id, cv, scale=1 }: { id:number; cv:CVData; scale?:number }) {
  if (id===1) return <TplClassique  cv={cv} scale={scale}/>;
  if (id===2) return <TplModerne    cv={cv} scale={scale}/>;
  if (id===3) return <TplMinimal    cv={cv} scale={scale}/>;
  if (id===4) return <TplExecutif   cv={cv} scale={scale}/>;
  if (id===5) return <TplCreatif    cv={cv} scale={scale}/>;
  if (id===6) return <TplAzurill    cv={cv} scale={scale}/>;
  if (id===7) return <TplBronzor    cv={cv} scale={scale}/>;
  if (id===8) return <TplDitto      cv={cv} scale={scale}/>;
  if (id===9) return <TplLeafish    cv={cv} scale={scale}/>;
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── MAIN PAGE COMPONENT ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export default function CVPage() {
  const [mode,        setMode]        = useState<Mode>("upload");
  const [step,        setStep]        = useState<Step>(1);
  const [selectedTpl, setSelectedTpl] = useState<number>(1);
  const [previewTpl,  setPreviewTpl]  = useState<number|null>(null);

  // Upload state
  const [uploadedFile,    setUploadedFile]    = useState<string|null>(null);
  const [uploadedContent, setUploadedContent] = useState<string>("");
  const [uploadedBase64,  setUploadedBase64]  = useState<string|null>(null);
  const [uploadedMime,    setUploadedMime]    = useState<string|null>(null);
  const [photoBase64,     setPhotoBase64]     = useState<string|null>(null); // user photo data URL
  const [enhanceType,     setEnhanceType]     = useState("Optimisation ATS");
  const [uploadError,     setUploadError]     = useState<string|null>(null);
  // Payment state for upload path
  const [uploadPaywall,   setUploadPaywall]   = useState(false); // show payment modal

  // AI form state
  const [form, setForm] = useState({
    name:"", title:"", email:"", phone:"", location:"",
    industry:"", level:"", experience:"", education:"", skills:"", langs:"", notes:"",
  });

  // Paddle
  const [paddle,         setPaddle]         = useState<Paddle | undefined>(undefined);
  const [payPending,     setPayPending]      = useState(false);
  const [currentPlan,    setCurrentPlan]     = useState<Plan>(PLANS[1]);
  const currentCaps = PLAN_CAPS[currentPlan.name as keyof typeof PLAN_CAPS] ?? PLAN_CAPS.Starter;
  const pendingModeRef = useRef<Mode>("ai"); // track which mode triggered paddle

  // Generation
  const [generating,  setGenerating]  = useState(false);
  const [genStep,     setGenStep]     = useState(0);
  const [cvData,      setCvData]      = useState<CVData|null>(null);
  const [genError,    setGenError]    = useState<string|null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Refs to always hold latest values — solves stale closure in Paddle eventCallback
  const uploadedBase64Ref  = useRef<string|null>(null);
  const uploadedMimeRef    = useRef<string|null>(null);
  const uploadedContentRef = useRef<string>("");
  const enhanceTypeRef     = useRef<string>("Optimisation ATS");
  const formRef            = useRef(form);
  const photoBase64Ref     = useRef<string|null>(null);

  const GEN_STEPS = ["Lecture du CV","Extraction des données","Application du modèle","Optimisation ATS","Finalisation"];

  // Initialize Paddle via npm package
  useEffect(() => {
    initializePaddle({
      environment: PADDLE_ENV,
      token: PADDLE_CLIENT_TOKEN,
      eventCallback(event) {
        if (event.name === "checkout.completed") {
          setPayPending(false);
          try { sessionStorage.setItem("tm_plan_name", currentPlan.name); } catch {}
          runGeneration(pendingModeRef.current);
        }
        if (event.name === "checkout.closed") {
          setPayPending(false);
        }
      },
    }).then((p) => {
      if (p) setPaddle(p);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("tm_plan_name");
      if (!saved) return;
      const found = PLANS.find((p) => p.name === saved);
      if (found) setCurrentPlan(found);
    } catch {}
  }, []);

  // Keep refs in sync with latest state values
  useEffect(()=>{ uploadedBase64Ref.current  = uploadedBase64;  }, [uploadedBase64]);
  useEffect(()=>{ uploadedMimeRef.current    = uploadedMime;    }, [uploadedMime]);
  useEffect(()=>{ uploadedContentRef.current = uploadedContent; }, [uploadedContent]);
  useEffect(()=>{ enhanceTypeRef.current     = enhanceType;     }, [enhanceType]);
  useEffect(()=>{ formRef.current            = form;            }, [form]);
  useEffect(()=>{ photoBase64Ref.current     = photoBase64;     }, [photoBase64]);

  // ── FILE UPLOAD ───────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    setUploadError(null);
    setUploadedFile(file.name);

    const lower = file.name.toLowerCase();
    const isPdf = lower.endsWith(".pdf");
    const isTxt = lower.endsWith(".txt") || file.type.startsWith("text/");

    if (isPdf) {
      const r = new FileReader();
      r.onload = e => {
        setUploadedBase64((e.target?.result as string).split(",")[1]);
        setUploadedMime("application/pdf");
        setUploadedContent("");
      };
      r.readAsDataURL(file);
      return;
    }

    if (isTxt) {
      const r = new FileReader();
      r.onload = e => {
        setUploadedContent((e.target?.result as string) ?? "");
        setUploadedBase64(null);
        setUploadedMime(null);
      };
      r.readAsText(file);
      return;
    }

    setUploadedBase64(null);
    setUploadedMime(null);
    setUploadedContent("");
    setUploadError("Format non supporté. Utilisez un PDF ou un fichier texte.");
  };

  // ── GENERATE — reads from refs so always has fresh values even in stale closures ──
  const runGeneration = useCallback(async (src: Mode) => {
    // Read latest values from refs (not closure-captured state)
    const base64   = uploadedBase64Ref.current;
    const mime     = uploadedMimeRef.current;
    const content  = uploadedContentRef.current;
    const enhance  = enhanceTypeRef.current;
    const f        = formRef.current;
    const photo    = photoBase64Ref.current;

    setGenerating(true); setGenError(null); setCvData(null); setGenStep(0);

    const tick = (i:number) => new Promise<void>(r=>setTimeout(()=>{setGenStep(i);r()},600));

    const systemPrompt = `Tu es un expert en rédaction de CV professionnels pour le marché marocain.
Tu dois TOUJOURS répondre avec UNIQUEMENT un objet JSON valide, sans aucun texte avant ou après.
Le JSON doit suivre exactement ce schéma :
{
  "name": string,
  "title": string,
  "email": string,
  "phone": string,
  "location": string,
  "profile": "2-3 phrases percutantes",
  "experiences": [{ "company": string, "role": string, "period": string, "bullets": string[] }],
  "education": [{ "school": string, "degree": string, "year": string }],
  "skills": string[],
  "languages": [{ "lang": string, "level": string }],
  "certifications": string[]
}
RÈGLES ABSOLUES :
- Utilise UNIQUEMENT les informations du CV fourni. Ne génère RIEN de fictif.
- Améliore la formulation et le style selon le mode demandé.
- Réponds avec UNIQUEMENT le JSON, rien d'autre, pas de markdown.`;

    try {
      await tick(1);
      let messages: any[];

      if (src==="upload") {
        const instructions = `Mode : "${enhance}". Analyse ce CV et retourne le JSON amélioré.`;
        if (base64 && mime==="application/pdf") {
          messages=[{role:"user",content:[
            {type:"document",source:{type:"base64",media_type:"application/pdf",data:base64}},
            {type:"text",text:instructions}
          ]}];
        } else if (content.trim()) {
          messages=[{role:"user",content:`Voici le CV à améliorer :

${content}

${instructions}`}];
        } else {
          throw new Error("Aucun contenu CV trouvé. Veuillez réimporter votre fichier.");
        }
      } else {
        messages=[{role:"user",content:`Génère un CV professionnel JSON pour :
Nom : ${f.name} | Poste : ${f.title} | Email : ${f.email} | Tél : ${f.phone} | Ville : ${f.location||"Maroc"}
Secteur : ${f.industry} | Niveau : ${f.level}
Expériences : ${f.experience}
Formation : ${f.education}
Compétences : ${f.skills}
Langues : ${f.langs}
Notes : ${f.notes}
Retourne UNIQUEMENT le JSON.`}];
      }

      await tick(2);
      const res = await fetch("/api/generate-cv", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:4000,
          system:systemPrompt,
          messages,
          isPdf: !!(base64 && mime === "application/pdf"),
        }),
      });

      await tick(3);

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Erreur API (${res.status}): ${err.slice(0,200)}`);
      }

      const data = await res.json();

      if (data.error) throw new Error(`Anthropic: ${data.error.message || JSON.stringify(data.error)}`);

      const raw   = data.content?.map((c:any)=>c.text??"").join("")??"";
      const clean = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();

      if (!clean) throw new Error("Réponse vide. Vérifiez votre clé API sur Vercel.");

      await tick(4);

      let parsed: CVData;
      try {
        parsed = JSON.parse(clean);
      } catch {
        throw new Error(`JSON invalide reçu. Début : ${clean.slice(0,120)}`);
      }

      if (!parsed.name && !parsed.experiences) throw new Error("CV incomplet retourné par l'IA. Réessayez.");

      // Inject photo
      if (photo) parsed.photo = photo;

      await tick(5);
      setCvData(parsed);
      setStep(4);
    } catch(e:any) {
      setGenError(e.message || "Erreur inconnue. Réessayez.");
    } finally {
      setGenerating(false); setGenStep(0);
    }
  // Intentionally empty deps — function reads from refs, not state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);


  // ── PADDLE CHECKOUT ───────────────────────────────────────────────────────
  const openPaddle = (plan: Plan, triggerMode: Mode = "ai") => {
    if (!paddle) { alert("Paddle non chargé. Rafraîchissez la page."); return; }
    pendingModeRef.current = triggerMode;
    try { sessionStorage.setItem("tm_plan_name", plan.name); } catch {}
    setCurrentPlan(plan); setPayPending(true);
    paddle.Checkout.open({
      items: [{ priceId: plan.paddlePriceId, quantity: 1 }],
      ...(form.email ? { customer: { email: form.email } } : {}),
      settings: {
        displayMode: "overlay",
        theme: "light",
        locale: "fr",
      },
    });
  };

  const allowedTemplateIds = TEMPLATES.slice(0, currentCaps.templateLimit).map((t) => t.id);
  const selectedTemplateLocked = !allowedTemplateIds.includes(selectedTpl);

  useEffect(() => {
    if (selectedTemplateLocked && allowedTemplateIds.length) {
      setSelectedTpl(allowedTemplateIds[0]);
    }
  }, [selectedTemplateLocked, allowedTemplateIds]);

  const downloadTextFile = (filename: string, content: string, mime = "text/plain;charset=utf-8") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const cvToPlainText = (cv: CVData) => {
    return [
      `${cv.name}`,
      `${cv.title}`,
      `${cv.email} | ${cv.phone} | ${cv.location}`,
      "",
      "PROFIL",
      cv.profile,
      "",
      "EXPÉRIENCES",
      ...cv.experiences.flatMap((e) => [
        `${e.role} — ${e.company} (${e.period})`,
        ...e.bullets.map((b) => `- ${b}`),
        "",
      ]),
      "FORMATION",
      ...cv.education.map((e) => `${e.degree} — ${e.school} (${e.year})`),
      "",
      "COMPÉTENCES",
      cv.skills.join(", "),
      "",
      "LANGUES",
      ...cv.languages.map((l) => `${l.lang} — ${l.level}`),
      ...(cv.certifications?.length ? ["", "CERTIFICATIONS", ...cv.certifications] : []),
    ].join("\n");
  };

  const coverLetterText = (cv: CVData) => `Objet : Candidature au poste de ${cv.title}

Madame, Monsieur,

Je vous adresse ma candidature pour le poste de ${cv.title}. Fort${cv.name.endsWith('a') ? 'e' : ''} d'une expérience construite autour de ${cv.experiences[0]?.role || cv.title}, je souhaite mettre mes compétences au service de votre structure.

Au fil de mon parcours, j'ai développé une expertise en ${cv.skills.slice(0, 4).join(", ")} et j'ai contribué à des missions à forte valeur ajoutée, notamment chez ${cv.experiences[0]?.company || 'mes précédents employeurs'}. Mon sens de l'organisation, ma capacité d'adaptation et mon orientation résultats me permettent d'apporter une contribution rapide et concrète.

Je serais ravi${cv.name.endsWith('a') ? 'e' : ''} d'échanger avec vous afin de vous présenter plus en détail ma motivation et l'apport que je pourrais avoir au sein de votre équipe.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${cv.name}`;

  const linkedinSummaryText = (cv: CVData) => `${cv.title} basé${cv.name.endsWith('a') ? 'e' : ''} à ${cv.location}. ${cv.profile} Compétences clés : ${cv.skills.slice(0, 8).join(", ")}. Expérience récente : ${cv.experiences[0]?.role || cv.title} chez ${cv.experiences[0]?.company || 'une entreprise de référence'}.`;

  const downloadWord = () => {
    if (!cvData) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre style="font-family:Calibri,Arial,sans-serif;white-space:pre-wrap">${cvToPlainText(cvData)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</pre></body></html>`;
    downloadTextFile(`CV-${(cvData.name || "TalentMaroc").replace(/\s+/g, "-")}.doc`, html, "application/msword");
  };

  const downloadHTML = () => {
    const node = printRef.current;
    if (!node || !cvData) return;
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CV ${cvData.name}</title></head><body style="margin:0;background:#fff">${node.innerHTML}</body></html>`;
    downloadTextFile(`CV-${(cvData.name || "TalentMaroc").replace(/\s+/g, "-")}.html`, html, "text/html;charset=utf-8");
  };

  const downloadCoverLetter = () => {
    if (!cvData) return;
    downloadTextFile(`Lettre-${(cvData.name || "TalentMaroc").replace(/\s+/g, "-")}.txt`, coverLetterText(cvData));
  };

  const downloadLinkedInSummary = () => {
    if (!cvData) return;
    downloadTextFile(`LinkedIn-${(cvData.name || "TalentMaroc").replace(/\s+/g, "-")}.txt`, linkedinSummaryText(cvData));
  };

  // ── PRINT / DOWNLOAD — direct PDF save ──────────────────────────────────
  const downloadPDF = async () => {
    const node = printRef.current;
    if (!node || !cvData) return;

    const mod: any = await import("html2pdf.js");
    const html2pdf = mod.default || mod;

    await html2pdf()
      .set({
        margin: 0,
        filename: `CV-${(cvData.name || "TalentMaroc").replace(/\s+/g, "-")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(node)
      .save();
  };

  const goStep = (n: Step) => { setStep(n); window.scrollTo({top:0,behavior:"smooth"}); };
  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{width:100%;overflow-x:hidden;}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f8fafc;color:#0f172a;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

        .au{animation:fadeUp .5s cubic-bezier(.16,1,.3,1) both}
        .spinner{width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#16a34a;border-radius:50%;animation:spin .7s linear infinite}

        .nl{color:#4b5563;text-decoration:none;font-size:14px;font-weight:600;padding:7px 12px;border-radius:8px;transition:all .18s}
        .nl:hover{color:#0f172a;background:#f3f4f6}

        .tab-pill{padding:9px 20px;border-radius:9px;border:none;cursor:pointer;font-weight:700;font-size:14px;transition:all .2s;font-family:inherit}

        .tpl-thumb{border:2px solid #e5e7eb;border-radius:14px;overflow:hidden;cursor:pointer;background:white;transition:all .2s;box-shadow:0 1px 4px rgba(0,0,0,.05)}
        .tpl-thumb:hover{border-color:#16a34a;box-shadow:0 4px 20px rgba(22,163,74,.12);transform:translateY(-2px)}
        .tpl-thumb.selected{border-color:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.2)}

        .chip{display:inline-flex;align-items:center;padding:6px 14px;border-radius:100px;border:1.5px solid #e5e7eb;background:white;cursor:pointer;font-size:12px;font-weight:600;color:#374151;transition:all .18s;text-decoration:none;font-family:inherit}
        .chip:hover,.chip.active{border-color:#16a34a;color:#16a34a;background:#f0fdf4}

        input,select,textarea{font-family:inherit;font-size:14px;}
        input:focus,select:focus,textarea:focus{outline:none;border-color:#16a34a!important;box-shadow:0 0 0 3px rgba(22,163,74,.1)!important;}

        .btn-green{display:inline-flex;align-items:center;justify-content:center;gap:7px;background:#16a34a;color:white;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .18s}
        .btn-green:hover{background:#15803d;transform:translateY(-1px);box-shadow:0 6px 20px rgba(22,163,74,.3)}
        .btn-green:disabled{background:#d1d5db;cursor:not-allowed;transform:none;box-shadow:none}
        .btn-outline{display:inline-flex;align-items:center;gap:7px;background:white;color:#374151;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;border:1.5px solid #e5e7eb;cursor:pointer;font-family:inherit;transition:all .18s}
        .btn-outline:hover{border-color:#16a34a;color:#16a34a}

        .pay-card{border:2px solid #e5e7eb;border-radius:14px;padding:24px;transition:all .18s;background:white}
        .pay-card:hover{border-color:#16a34a;box-shadow:0 4px 20px rgba(22,163,74,.1)}
        .pay-card.featured{border-color:#16a34a;background:#f0fdf4}

        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;overflow-y:auto;backdrop-filter:blur(4px)}
        .modal-box{background:white;border-radius:16px;width:100%;max-width:860px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.3)}

        .gen-step{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:500;padding:8px 0;transition:all .3s}

        .field-label{font-size:13px;font-weight:600;display:block;margin-bottom:6px;color:#374151}
        .field-input{border:1.5px solid #e5e7eb;border-radius:9px;padding:11px 14px;width:100%;background:white;color:#0f172a;font-size:14px;font-family:inherit;transition:border-color .18s}

        @media(max-width:640px){.hide-sm{display:none!important}.grid2{grid-template-columns:1fr!important}}
        @media print{#cv-print{display:block!important}body{background:white}}
      `}</style>

      <div style={{background:"#f8fafc",minHeight:"100vh",width:"100%"}}>

        {/* ── NAVBAR ── */}
        <nav style={{background:"rgba(255,255,255,.96)",backdropFilter:"blur(12px)",borderBottom:"1.5px solid #f0f0f0",padding:"0 24px",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:28}}>
            <a href="/" style={{display:"flex",alignItems:"center",gap:9,textDecoration:"none"}}>
              <div style={{width:34,height:34,background:"#16a34a",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"white"}}>T</div>
              <span style={{color:"#0f172a",fontWeight:800,fontSize:16}}>TalentMaroc</span>
            </a>
            <div className="hide-sm" style={{display:"flex",gap:2}}>
              <a href="/" className="nl">Emplois</a>
              <a href="/employers" className="nl">Recruteurs</a>
              <span style={{color:"#16a34a",fontSize:14,fontWeight:700,padding:"7px 12px"}}>Mon CV ✦</span>
            </div>
          </div>
          <a href="/employers/new" className="btn-green" style={{padding:"8px 16px",fontSize:13}}>Publier</a>
        </nav>

        {/* ── HERO ── */}
        <div style={{background:"white",borderBottom:"1.5px solid #f0f0f0",padding:"44px 24px 48px",textAlign:"center"}}>
          <div className="au" style={{display:"inline-flex",alignItems:"center",gap:7,background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:100,padding:"5px 14px",marginBottom:18}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:"#16a34a",display:"inline-block"}}/>
            <span style={{fontSize:12,fontWeight:700,color:"#15803d"}}>Nouveau — CV IA avec vrais modèles</span>
          </div>
          <h1 className="au" style={{fontFamily:"inherit",fontSize:"clamp(24px,5vw,44px)",fontWeight:800,color:"#0f172a",lineHeight:1.12,letterSpacing:"-0.02em",marginBottom:12,animationDelay:".08s"}}>
            Créez un CV qui décroche des entretiens
          </h1>
          <p className="au" style={{fontSize:15,color:"#6b7280",maxWidth:480,margin:"0 auto 24px",lineHeight:1.7,animationDelay:".16s"}}>
            L'IA analyse votre profil et remplit automatiquement de vrais modèles professionnels. Téléchargez en PDF.
          </p>
          {/* Mode toggle */}
          <div className="au" style={{display:"inline-flex",background:"#f3f4f6",borderRadius:12,padding:4,gap:4,animationDelay:".22s"}}>
            <button className="tab-pill" onClick={()=>{setMode("upload");setStep(1);setCvData(null);}}
              style={{background:mode==="upload"?"white":"transparent",color:mode==="upload"?"#0f172a":"#6b7280",boxShadow:mode==="upload"?"0 1px 4px rgba(0,0,0,.1)":undefined}}>
              ↑ Importer mon CV <span style={{fontSize:11,marginLeft:6,background:"#f0fdf4",color:"#15803d",padding:"2px 8px",borderRadius:100}}>GRATUIT</span>
            </button>
            <button className="tab-pill" onClick={()=>{setMode("ai");setStep(1);setCvData(null);}}
              style={{background:mode==="ai"?"white":"transparent",color:mode==="ai"?"#0f172a":"#6b7280",boxShadow:mode==="ai"?"0 1px 4px rgba(0,0,0,.1)":undefined}}>
              ✦ Générer avec l'IA <span style={{fontSize:11,marginLeft:6,background:"#fef3c7",color:"#92400e",padding:"2px 8px",borderRadius:100}}>À PARTIR DE 1,99€</span>
            </button>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{maxWidth:1080,margin:"0 auto",padding:"36px 20px 80px"}}>

          {/* ─────── STEP 1 : CHOOSE TEMPLATE ─────── */}
          {step===1 && (
            <div className="au">
              <div style={{background:"white",border:"1.5px solid #f0f0f0",borderRadius:14,overflow:"hidden",marginBottom:24,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                <div style={{padding:"20px 24px",borderBottom:"1.5px solid #f0f0f0"}}>
                  <h2 style={{fontSize:16,fontWeight:800}}>1. Choisissez votre modèle</h2>
                  <p style={{fontSize:13,color:"#6b7280",marginTop:3}}>Cliquez sur "Aperçu" pour voir le rendu complet avec vos données.</p>
                </div>
                <div style={{padding:"24px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:16}}>
                  {TEMPLATES.map(t=>{
                    const bs=BADGE_STYLES[t.badge];
                    const sel=selectedTpl===t.id;
                    return (
                      <div key={t.id} className={`tpl-thumb${sel?" selected":""}`} onClick={()=>setSelectedTpl(t.id)}>
                        {/* Thumbnail — scaled real CV */}
                        <div style={{height:220,overflow:"hidden",position:"relative",background:"#f8fafc"}}>
                          <div style={{position:"absolute",top:0,left:0,width:794,transformOrigin:"top left",transform:"scale(0.24)",pointerEvents:"none"}}>
                            <RenderCV id={t.id} cv={SAMPLE}/>
                          </div>
                          {/* Fade bottom */}
                          <div style={{position:"absolute",bottom:0,left:0,right:0,height:60,background:"linear-gradient(to bottom,transparent,#f8fafc)",pointerEvents:"none"}}/>
                          {/* Badges */}
                          <div style={{position:"absolute",top:8,left:8,background:bs.bg,color:bs.color,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:100,zIndex:2}}>
                            {{gratuit:"Gratuit",pro:"Pro",nouveau:"Nouveau"}[t.badge]}
                          </div>
                          {sel && <div style={{position:"absolute",top:8,right:8,width:22,height:22,background:"#16a34a",borderRadius:"50%",color:"white",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,zIndex:2}}>✓</div>}
                        </div>
                        {/* Footer */}
                        <div style={{padding:"10px 14px 12px",borderTop:"1.5px solid #f0f0f0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{t.name}</div>
                            <div style={{fontSize:10,color:"#6b7280",marginTop:1,lineHeight:1.4}}>{t.desc.split(".")[0]}</div>
                          </div>
                          <button onClick={e=>{e.stopPropagation();setPreviewTpl(t.id);}}
                            style={{background:"#f3f4f6",border:"1.5px solid #e5e7eb",borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:600,color:"#374151",cursor:"pointer",flexShrink:0,fontFamily:"inherit",transition:"all .15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background="#e5e7eb"}
                            onMouseLeave={e=>e.currentTarget.style.background="#f3f4f6"}>
                            Aperçu
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end"}}>
                <button className="btn-green" onClick={()=>goStep(2)}>
                  Continuer avec {TEMPLATES.find(t=>t.id===selectedTpl)?.name} →
                </button>
              </div>
            </div>
          )}

          {/* ─────── STEP 2 : UPLOAD or FORM ─────── */}
          {step===2 && mode==="upload" && (
            <div className="au">
              <StepBack label="← Changer de modèle" onClick={()=>goStep(1)}/>

              {/* ── ERROR BANNER ── */}
              {genError && (
                <div style={{background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:10,padding:"14px 18px",marginBottom:16,display:"flex",gap:12,alignItems:"flex-start"}}>
                  <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#dc2626",marginBottom:4}}>Erreur de génération</div>
                    <div style={{fontSize:12,color:"#7f1d1d",lineHeight:1.6}}>{genError}</div>
                    <button onClick={()=>setGenError(null)} style={{marginTop:8,fontSize:12,color:"#dc2626",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0,fontWeight:600}}>
                      Fermer ×
                    </button>
                  </div>
                </div>
              )}

              <div style={{background:"white",border:"1.5px solid #f0f0f0",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)",marginBottom:24}}>
                <div style={{padding:"20px 24px",borderBottom:"1.5px solid #f0f0f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <h2 style={{fontSize:16,fontWeight:800}}>2. Importez votre CV</h2>
                    <p style={{fontSize:13,color:"#6b7280",marginTop:3}}>PDF ou TXT — l'IA l'améliore et le met en forme dans votre modèle.</p>
                  </div>
                  <span style={{background:"#f0fdf4",color:"#15803d",border:"1.5px solid #bbf7d0",padding:"4px 12px",borderRadius:100,fontSize:12,fontWeight:700}}>✓ Gratuit</span>
                </div>
                <div style={{padding:28}}>
                  {/* Drop zone */}
                  <label style={{display:"block",border:"2px dashed #d1d5db",borderRadius:12,padding:"40px 24px",textAlign:"center",cursor:"pointer",background:"#f9fafb",transition:"all .18s"}}
                    onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor="#16a34a";e.currentTarget.style.background="#f0fdf4"}}
                    onDragLeave={e=>{e.currentTarget.style.borderColor="#d1d5db";e.currentTarget.style.background="#f9fafb"}}
                    onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleFile(f);e.currentTarget.style.borderColor="#d1d5db";e.currentTarget.style.background="#f9fafb"}}>
                    <input type="file" accept=".pdf,.txt,text/plain,application/pdf" onChange={e=>{if(e.target.files?.[0])handleFile(e.target.files[0]);}} style={{display:"none"}}/>
                    <div style={{fontSize:36,marginBottom:10}}>📄</div>
                    <div style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:4}}>Glissez votre CV ici</div>
                    <p style={{fontSize:12,color:"#9ca3af"}}>ou cliquez pour parcourir · PDF, DOC, DOCX, TXT</p>
                  </label>
                  {uploadedFile && (
                    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:10,marginTop:14}}>
                      <span style={{fontSize:20}}>✅</span>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#15803d"}}>{uploadedFile}</div><div style={{fontSize:11,color:"#6b7280"}}>Prêt à être amélioré</div></div>
                      <button onClick={()=>{setUploadedFile(null);setUploadedContent("");setUploadedBase64(null);setUploadedMime(null);}} style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:18,fontFamily:"inherit"}}>×</button>
                    </div>
                  )}
                  {uploadError && <div style={{background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:8,padding:"10px 14px",marginTop:12,fontSize:13,color:"#dc2626"}}>⚠ {uploadError}</div>}

                  {/* Photo upload */}
                  <div style={{marginTop:24,marginBottom:4}}>
                    <label className="field-label">Photo de profil <span style={{fontWeight:400,color:"#9ca3af"}}>(optionnel — pour les modèles avec photo)</span></label>
                    <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                      <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 18px",border:"1.5px solid #e5e7eb",borderRadius:9,cursor:"pointer",background:"white",fontSize:13,fontWeight:600,color:"#374151",transition:"all .18s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="#16a34a"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e7eb"}>
                        <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                          const f=e.target.files?.[0];
                          if(!f)return;
                          const r=new FileReader();
                          r.onload=ev=>setPhotoBase64(ev.target?.result as string);
                          r.readAsDataURL(f);
                        }}/>
                        📷 Importer une photo
                      </label>
                      {photoBase64 && (
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <img src={photoBase64} alt="Photo" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",border:"2px solid #bbf7d0"}}/>
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:"#15803d"}}>✓ Photo ajoutée</div>
                            <button onClick={()=>setPhotoBase64(null)} style={{fontSize:11,color:"#9ca3af",background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"inherit"}}>Supprimer</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhancement type */}
                  <div style={{marginTop:20}}>
                    <label className="field-label">Type d'amélioration</label>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:9}}>
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
                  ✨ Améliorer et appliquer le modèle →
                </button>
              </div>
            </div>
          )}

          {step===2 && mode==="ai" && (
            <div className="au">
              <StepBack label="← Changer de modèle" onClick={()=>goStep(1)}/>
              <div style={{background:"white",border:"1.5px solid #f0f0f0",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)",marginBottom:24}}>
                <div style={{padding:"20px 24px",borderBottom:"1.5px solid #f0f0f0"}}>
                  <h2 style={{fontSize:16,fontWeight:800}}>2. Vos informations</h2>
                  <p style={{fontSize:13,color:"#6b7280",marginTop:3}}>L'IA génère un CV complet à partir de ces données.</p>
                </div>
                <div style={{padding:28}}>
                  <div className="grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                    {[{id:"name",l:"Prénom et Nom",ph:"Youssef Benali"},{id:"title",l:"Poste visé",ph:"Développeur Full Stack"},{id:"email",l:"Email",ph:"youssef@email.ma",type:"email"},{id:"phone",l:"Téléphone",ph:"+212 6 00 00 00 00"},{id:"location",l:"Ville",ph:"Casablanca"}].map(f=>(
                      <div key={f.id}><label className="field-label">{f.l}</label>
                        <input type={f.type||"text"} className="field-input" value={form[f.id as keyof typeof form]} onChange={e=>setForm(p=>({...p,[f.id]:e.target.value}))} placeholder={f.ph}/>
                      </div>
                    ))}
                    <div><label className="field-label">Secteur</label>
                      <select className="field-input" value={form.industry} onChange={e=>setForm(p=>({...p,industry:e.target.value}))}>
                        <option value="">Sélectionnez...</option>
                        {["Informatique","Finance","Commerce","Marketing","RH","Ingénierie","Santé","Logistique","Tourisme","Juridique","Autre"].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div><label className="field-label">Niveau</label>
                      <select className="field-input" value={form.level} onChange={e=>setForm(p=>({...p,level:e.target.value}))}>
                        <option value="">Sélectionnez...</option>
                        {["Débutant (0–2 ans)","Intermédiaire (2–5 ans)","Confirmé (5–10 ans)","Manager","Directeur","C-Suite"].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div style={{gridColumn:"1 / -1"}}><label className="field-label">Expériences professionnelles</label>
                      <textarea className="field-input" rows={4} value={form.experience} onChange={e=>setForm(p=>({...p,experience:e.target.value}))} placeholder={"Société A — Poste (2021–2024) : réalisations\nSociété B — Poste (2019–2021) : réalisations"} style={{resize:"vertical",lineHeight:1.6}}/>
                    </div>
                    <div style={{gridColumn:"1 / -1"}}><label className="field-label">Formation</label>
                      <input type="text" className="field-input" value={form.education} onChange={e=>setForm(p=>({...p,education:e.target.value}))} placeholder="Master Génie Informatique, ENSA Rabat, 2020"/>
                    </div>
                    <div><label className="field-label">Compétences</label>
                      <input type="text" className="field-input" value={form.skills} onChange={e=>setForm(p=>({...p,skills:e.target.value}))} placeholder="React, Node.js, Python..."/>
                    </div>
                    <div><label className="field-label">Langues</label>
                      <input type="text" className="field-input" value={form.langs} onChange={e=>setForm(p=>({...p,langs:e.target.value}))} placeholder="Arabe (natif), Français, Anglais"/>
                    </div>
                    <div style={{gridColumn:"1 / -1"}}><label className="field-label">Infos complémentaires <span style={{fontWeight:400,color:"#9ca3af"}}>(optionnel)</span></label>
                      <textarea className="field-input" rows={2} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Certifications, projets, bénévolat..." style={{resize:"vertical"}}/>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <button className="btn-outline" onClick={()=>goStep(1)}>← Retour</button>
                <button className="btn-green" onClick={()=>goStep(3)}>Continuer vers le paiement →</button>
              </div>
            </div>
          )}

          {/* ─────── STEP 3 : PAYMENT ─────── */}
          {step===3 && mode==="ai" && (
            <div className="au">
              <StepBack label="← Modifier mes informations" onClick={()=>goStep(2)}/>
              <div style={{marginBottom:20}}>
                <h2 style={{fontSize:18,fontWeight:800}}>3. Choisissez votre formule</h2>
                <p style={{fontSize:13,color:"#6b7280",marginTop:4}}>Paiement sécurisé via Paddle · Visa, Mastercard, PayPal</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14,marginBottom:20}}>
                {PLANS.map(plan=>{
                  const featured=plan.name==="Professionnel";
                  return (
                    <div key={plan.name} className={`pay-card${featured?" featured":""}`} style={{position:"relative"}}>
                      {featured && <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#16a34a",color:"white",fontSize:11,fontWeight:700,padding:"4px 14px",borderRadius:100,whiteSpace:"nowrap"}}>⭐ Le plus populaire</div>}
                      <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#6b7280",marginBottom:10}}>{plan.name}</div>
                      <div style={{fontSize:38,fontWeight:800,color:"#0f172a",lineHeight:1,marginBottom:3}}>€{plan.price}</div>
                      <div style={{fontSize:12,color:"#6b7280",marginBottom:18}}>Paiement unique</div>
                      <div style={{height:1,background:"#e5e7eb",marginBottom:16}}/>
                      <ul style={{listStyle:"none",marginBottom:20}}>
                        {PLAN_FEATURES[plan.name].map(f=><li key={f} style={{display:"flex",alignItems:"center",gap:7,fontSize:13,marginBottom:8,color:"#374151"}}><span style={{color:"#16a34a",fontWeight:700,fontSize:14}}>✓</span>{f}</li>)}
                      </ul>
                      <button className="btn-green" disabled={!paddle||payPending} onClick={()=>openPaddle(plan)} style={{width:"100%",background:featured?"#16a34a":"white",color:featured?"white":"#16a34a",border:featured?"none":"1.5px solid #16a34a"}}>
                        {payPending&&currentPlan.name===plan.name?"Ouverture…":`Payer €${plan.price} →`}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div style={{background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#6b7280"}}>
                <span style={{fontSize:18}}>🔒</span> Paiement 100% sécurisé via <strong style={{color:"#0f172a"}}>Paddle</strong>. Vos données bancaires ne transitent jamais par nos serveurs.
              </div>
            </div>
          )}

          {/* ─────── STEP 4 : RESULT ─────── */}
          {step===4 && cvData && (
            <div className="au">
              <div style={{background:"white",border:"1.5px solid #f0f0f0",borderRadius:14,padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                <div>
                  <div style={{fontSize:17,fontWeight:800,color:"#0f172a"}}>🎉 Votre CV est prêt !</div>
                  <div style={{fontSize:13,color:"#6b7280",marginTop:2}}>Formule active : <strong>{currentPlan.name}</strong> · Modèle : <strong>{TEMPLATES.find(t=>t.id===selectedTpl)?.name}</strong>.</div>
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button className="btn-outline" onClick={()=>{setCvData(null);goStep(1);}}>↺ Recommencer</button>
                  {currentCaps.allowPdf && <button className="btn-green" onClick={downloadPDF}>⬇ Télécharger PDF</button>}
                  {currentCaps.allowWord && <button className="btn-outline" onClick={downloadWord}>⬇ Word</button>}
                  {currentCaps.allowHtml && <button className="btn-outline" onClick={downloadHTML}>⬇ HTML</button>}
                </div>
              </div>

              {(currentCaps.allowCoverLetter || currentCaps.allowLinkedIn) && (
                <div style={{background:"white",border:"1.5px solid #f0f0f0",borderRadius:12,padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>Options incluses avec votre formule</div>
                    <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>Téléchargez aussi les livrables inclus dans votre achat.</div>
                  </div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    {currentCaps.allowCoverLetter && <button className="btn-outline" onClick={downloadCoverLetter}>⬇ Lettre de motivation</button>}
                    {currentCaps.allowLinkedIn && <button className="btn-outline" onClick={downloadLinkedInSummary}>⬇ Résumé LinkedIn</button>}
                  </div>
                </div>
              )}

              {/* Template switcher */}
              <div style={{background:"white",border:"1.5px solid #f0f0f0",borderRadius:12,padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                <span style={{fontSize:13,fontWeight:600,color:"#374151",flexShrink:0}}>Changer de modèle :</span>
                {TEMPLATES.map((t, idx)=>(
                  <button key={t.id} onClick={()=>allowedTemplateIds.includes(t.id) && setSelectedTpl(t.id)}
                    disabled={!allowedTemplateIds.includes(t.id)}
                    title={allowedTemplateIds.includes(t.id) ? "" : "Disponible avec une formule supérieure"}
                    style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${selectedTpl===t.id?"#16a34a":"#e5e7eb"}`,background:!allowedTemplateIds.includes(t.id)?"#f3f4f6":selectedTpl===t.id?"#f0fdf4":"white",color:!allowedTemplateIds.includes(t.id)?"#9ca3af":selectedTpl===t.id?"#15803d":"#374151",fontSize:12,fontWeight:600,cursor:allowedTemplateIds.includes(t.id)?"pointer":"not-allowed",transition:"all .15s",fontFamily:"inherit",opacity:allowedTemplateIds.includes(t.id)?1:.7}}>
                    {t.name}{!allowedTemplateIds.includes(t.id) ? " 🔒" : ""}
                  </button>
                ))}
              </div>

              {/* CV PREVIEW */}
              <div style={{background:"white",borderRadius:14,boxShadow:"0 4px 24px rgba(0,0,0,.08)",overflow:"hidden",marginBottom:24}}>
                <div id="cv-print" ref={printRef} style={{width:794,margin:"0 auto",background:"white"}}>
                  <RenderCV id={selectedTpl} cv={cvData}/>
                </div>
              </div>
            </div>
          )}

          {/* ─────── UPLOAD PAYWALL MODAL ─────── */}
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
                  {/* What's included */}
                  <div style={{background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:10,padding:"14px 16px",marginBottom:20,display:"flex",gap:10,alignItems:"flex-start"}}>
                    <span style={{fontSize:18,flexShrink:0}}>✨</span>
                    <div style={{fontSize:13,color:"#15803d",lineHeight:1.6}}>
                      <strong>Ce qui sera fait :</strong> Votre CV sera analysé par notre IA, reformulé selon le mode choisi ({enhanceType}), et mis en page dans le modèle <strong>{TEMPLATES.find(t=>t.id===selectedTpl)?.name}</strong> que vous avez sélectionné.
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
                    {PLANS.map(plan=>{
                      const featured=plan.name==="Professionnel";
                      return (
                        <div key={plan.name} className={`pay-card${featured?" featured":""}`} style={{position:"relative",padding:"20px 18px"}}>
                          {featured && <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:"#16a34a",color:"white",fontSize:10,fontWeight:700,padding:"3px 12px",borderRadius:100,whiteSpace:"nowrap"}}>⭐ Populaire</div>}
                          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#6b7280",marginBottom:8}}>{plan.name}</div>
                          <div style={{fontSize:32,fontWeight:800,color:"#0f172a",lineHeight:1,marginBottom:12}}>€{plan.price}</div>
                          <ul style={{listStyle:"none",marginBottom:16}}>
                            {PLAN_FEATURES[plan.name].map(f=><li key={f} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,marginBottom:6,color:"#374151"}}><span style={{color:"#16a34a",fontWeight:700}}>✓</span>{f}</li>)}
                          </ul>
                          <button className="btn-green" disabled={!paddle||payPending} onClick={()=>{setUploadPaywall(false);openPaddle(plan,"upload");}}
                            style={{width:"100%",background:featured?"#16a34a":"white",color:featured?"white":"#16a34a",border:featured?"none":"1.5px solid #16a34a",fontSize:13,padding:"10px"}}>
                            {payPending&&currentPlan.name===plan.name?"Ouverture…":`Payer €${plan.price}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{fontSize:11,color:"#9ca3af",textAlign:"center",marginTop:16}}>🔒 Paiement sécurisé via Paddle · Aucune donnée bancaire stockée</p>
                </div>
              </div>
            </div>
          )}

          {/* ─────── GENERATING OVERLAY ─────── */}
          {generating && (
            <div className="modal-bg">
              <div className="modal-box" style={{maxWidth:400,padding:"40px 32px",textAlign:"center"}}>
                <div className="spinner" style={{margin:"0 auto 20px"}}/>
                <div style={{fontSize:17,fontWeight:800,marginBottom:6}}>Génération en cours…</div>
                <div style={{fontSize:13,color:"#6b7280",marginBottom:24}}>L'IA prépare votre CV dans le modèle sélectionné.</div>
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

          {/* ─────── TEMPLATE PREVIEW MODAL ─────── */}
          {previewTpl!==null && (()=>{
            const t=TEMPLATES.find(tpl=>tpl.id===previewTpl)!;
            const bs=BADGE_STYLES[t.badge];
            return (
              <div className="modal-bg" onClick={()=>setPreviewTpl(null)}>
                <div className="modal-box" onClick={e=>e.stopPropagation()}>
                  {/* Modal header */}
                  <div style={{background:"#0f172a",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{background:bs.bg,color:bs.color,fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:100}}>{{gratuit:"Gratuit",pro:"Pro",nouveau:"Nouveau"}[t.badge]}</span>
                      <span style={{color:"white",fontWeight:700,fontSize:15}}>{t.name}</span>
                      <span style={{color:"rgba(255,255,255,.45)",fontSize:12}}>— {t.desc}</span>
                    </div>
                    <button onClick={()=>setPreviewTpl(null)} style={{background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.7)",fontSize:20,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>×</button>
                  </div>
                  {/* Scrollable CV preview */}
                  <div style={{overflowY:"auto",maxHeight:"70vh",background:"#f8fafc",padding:"20px"}}>
                    <div style={{width:794,margin:"0 auto",boxShadow:"0 4px 24px rgba(0,0,0,.1)",borderRadius:4,overflow:"hidden"}}>
                      <RenderCV id={t.id} cv={SAMPLE}/>
                    </div>
                  </div>
                  {/* Footer */}
                  <div style={{background:"white",borderTop:"1.5px solid #f0f0f0",padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                    <div style={{fontSize:13,color:"#6b7280"}}>Aperçu avec données fictives · Votre contenu sera différent</div>
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

        </div>{/* /main */}

        {/* ── FOOTER ── */}
        <footer style={{background:"#0f172a",padding:"24px",textAlign:"center"}}>
          <span style={{fontSize:12,color:"rgba(255,255,255,.25)"}}>© 2026 Talent Maroc</span>
        </footer>
      </div>
    </>
  );
}

// ── HELPER ─────────────────────────────────────────────────────────────────
function StepBack({ label, onClick }: { label:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,color:"#6b7280",background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:16,fontFamily:"inherit",padding:0}}>
      {label}
    </button>
  );
}