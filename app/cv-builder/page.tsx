"use client";

import { useState, useRef, useCallback } from "react";

// ── TYPES ──────────────────────────────────────────────────────────────────
interface Template {
  id: number;
  name: string;
  cat: string;
  role: string;
  bg: string;
  acc: string;
  badge: "gratuit" | "pro" | "nouveau";
  light?: boolean;
}

interface Plan {
  name: string;
  price: string;
}

type Step = 1 | 2 | 3 | 4;
type Tab2 = "ai" | "upload";
type FilterCat = "all" | "tech" | "business" | "creative" | "entry" | "executive" | "academic";

// ── DATA ───────────────────────────────────────────────────────────────────
const TEMPLATES: Template[] = [
  { id: 1,  name: "Architecte",   cat: "tech",      role: "Développeur · Senior",        bg: "#0f172a", acc: "#3b82f6", badge: "pro"     },
  { id: 2,  name: "Circuit",      cat: "tech",      role: "Ingénieur · DevOps",          bg: "#042f2e", acc: "#2dd4bf", badge: "pro"     },
  { id: 3,  name: "Nexus",        cat: "tech",      role: "Data Science · IA",           bg: "#1e1b4b", acc: "#818cf8", badge: "nouveau" },
  { id: 4,  name: "Console",      cat: "tech",      role: "Full Stack · Mobile",         bg: "#18181b", acc: "#a3e635", badge: "pro"     },
  { id: 5,  name: "Horizon",      cat: "business",  role: "Commerce · Vente",            bg: "#1e3a5f", acc: "#60a5fa", badge: "pro"     },
  { id: 6,  name: "Meridian",     cat: "business",  role: "Finance · Banque",            bg: "#1c1917", acc: "#f59e0b", badge: "pro"     },
  { id: 7,  name: "Stratège",     cat: "business",  role: "Consultant · MBA",            bg: "#0c1445", acc: "#facc15", badge: "nouveau" },
  { id: 8,  name: "Vente+",       cat: "business",  role: "Business Dev · KAM",         bg: "#0a1628", acc: "#f97316", badge: "pro"     },
  { id: 9,  name: "Lumière",      cat: "creative",  role: "Designer · UX/UI",            bg: "#fdf4ff", acc: "#d946ef", badge: "nouveau", light: true },
  { id: 10, name: "Folio",        cat: "creative",  role: "Portfolio · Graphiste",       bg: "#fffbeb", acc: "#f59e0b", badge: "nouveau", light: true },
  { id: 11, name: "Création",     cat: "creative",  role: "Publicité · Contenu",         bg: "#1a0a00", acc: "#fb923c", badge: "pro"     },
  { id: 12, name: "Départ",       cat: "entry",     role: "Débutant · Tous secteurs",    bg: "#f8fafc", acc: "#6366f1", badge: "gratuit", light: true },
  { id: 13, name: "Campus",       cat: "entry",     role: "Étudiant · Alternance",       bg: "#f0fdf4", acc: "#22c55e", badge: "gratuit", light: true },
  { id: 14, name: "Tremplin",     cat: "entry",     role: "Premier emploi · Stage",      bg: "#eff6ff", acc: "#3b82f6", badge: "gratuit", light: true },
  { id: 15, name: "Reconversion", cat: "entry",     role: "Changement de carrière",      bg: "#fef9c3", acc: "#ca8a04", badge: "nouveau", light: true },
  { id: 16, name: "Sommet",       cat: "executive", role: "Cadre supérieur · Directeur", bg: "#0f0f0f", acc: "#d4af37", badge: "pro"     },
  { id: 17, name: "Vanguard",     cat: "executive", role: "Direction · VP",              bg: "#1e0a3c", acc: "#c084fc", badge: "pro"     },
  { id: 18, name: "Prestige",     cat: "executive", role: "PDG · Conseil d'admin.",      bg: "#0c0a09", acc: "#d97706", badge: "pro"     },
  { id: 19, name: "Thèse",        cat: "academic",  role: "Chercheur · Doctorant",       bg: "#1e1b4b", acc: "#818cf8", badge: "pro"     },
  { id: 20, name: "Clinique",     cat: "academic",  role: "Médecin · Pharmacien",        bg: "#fff1f2", acc: "#f43f5e", badge: "nouveau", light: true },
  { id: 21, name: "Prof",         cat: "academic",  role: "Enseignant · Formateur",      bg: "#f0f9ff", acc: "#0ea5e9", badge: "gratuit", light: true },
  { id: 22, name: "Juridique",    cat: "academic",  role: "Avocat · Juriste",            bg: "#1c1917", acc: "#a8a29e", badge: "pro"     },
  { id: 23, name: "RH Talent",    cat: "business",  role: "RH · People Ops",             bg: "#fef3c7", acc: "#d97706", badge: "gratuit", light: true },
  { id: 24, name: "Hôtellerie",   cat: "entry",     role: "Tourisme · Restauration",     bg: "#0c1a2e", acc: "#7dd3fc", badge: "nouveau" },
  { id: 25, name: "Ingénieur",    cat: "tech",      role: "Génie Civil · BTP",           bg: "#14532d", acc: "#86efac", badge: "pro"     },
];

const CATEGORIES: { key: FilterCat; label: string }[] = [
  { key: "all",       label: "Tous (25)"  },
  { key: "tech",      label: "Tech"       },
  { key: "business",  label: "Business"   },
  { key: "creative",  label: "Créatif"    },
  { key: "entry",     label: "Débutant"   },
  { key: "executive", label: "Cadre"      },
  { key: "academic",  label: "Académique" },
];

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  gratuit: { bg: "#f0fdf4", color: "#057a55" },
  pro:     { bg: "#fef3c7", color: "#92400e" },
  nouveau: { bg: "#eff6ff", color: "#1d4ed8" },
};

// ── HELPERS ────────────────────────────────────────────────────────────────
function fmtCard(v: string) {
  return v.replace(/\D/g, "").substring(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function fmtExp(v: string) {
  const d = v.replace(/\D/g, "").substring(0, 4);
  return d.length >= 2 ? d.substring(0, 2) + " / " + d.substring(2) : d;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────
export default function CVPage() {
  // Navigation
  const [step, setStep] = useState<Step>(1);
  const [tab2, setTab2] = useState<Tab2>("ai");
  const [catFilter, setCatFilter] = useState<FilterCat>("all");

  // Template selection
  const [selectedTpl, setSelectedTpl] = useState<number | null>(null);

  // Form fields
  const [form, setForm] = useState({
    name: "", title: "", email: "", phone: "",
    industry: "", level: "", experience: "",
    education: "", skills: "", langs: "", notes: "",
  });

  // Upload
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [enhanceType, setEnhanceType] = useState("Optimisation ATS — Compatible logiciels de recrutement");

  // Payment modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalState, setModalState] = useState<"form" | "generating" | "success">("form");
  const [currentPlan, setCurrentPlan] = useState<Plan>({ name: "Professionnel", price: "4.99" });
  const [genSteps, setGenSteps] = useState<("idle" | "active" | "done")[]>(Array(5).fill("idle"));

  // Payment form
  const [payName, setPayName] = useState("");
  const [payCard, setPayCard] = useState("");
  const [payExp, setPayExp] = useState("");
  const [payEmail, setPayEmail] = useState("");

  // Result
  const [showResult, setShowResult] = useState(false);
  const [cvHtml, setCvHtml] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // ── TEMPLATE FILTER ────────────────────────────────────────────────────
  const filteredTpls = catFilter === "all"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.cat === catFilter);

  // ── STEP HELPERS ───────────────────────────────────────────────────────
  const goStep = (n: Step) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const stepCircleStyle = (n: number) => {
    if (n < step) return { background: "#057a55", borderColor: "#057a55", color: "white" };
    if (n === step) return { background: "#1a56db", borderColor: "#1a56db", color: "white" };
    return { background: "#f3f4f6", borderColor: "#e5e7eb", color: "#6b7280" };
  };
  const stepLabelColor = (n: number) => {
    if (n < step) return "#057a55";
    if (n === step) return "#1a56db";
    return "#6b7280";
  };
  const connectorDone = (n: number) => n < step;

  // ── OPEN PAYMENT MODAL ─────────────────────────────────────────────────
  const openPayment = (name: string, price: string) => {
    setCurrentPlan({ name, price });
    setModalState("form");
    setGenSteps(Array(5).fill("idle"));
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  // ── PROCESS PAYMENT ────────────────────────────────────────────────────
  const processPayment = async () => {
    if (!payName || !payCard) {
      alert("Veuillez renseigner vos coordonnées bancaires.");
      return;
    }
    setModalState("generating");
    const stepsLabels = ["gs0", "gs1", "gs2", "gs3", "gs4"];
    const next = [...Array(5).fill("idle")] as ("idle" | "active" | "done")[];

    for (let i = 0; i < 5; i++) {
      await new Promise<void>((res) => {
        setTimeout(() => {
          setGenSteps((prev) => {
            const updated = [...prev] as ("idle" | "active" | "done")[];
            if (i > 0) updated[i - 1] = "done";
            updated[i] = "active";
            return updated;
          });
          res();
        }, i * 900);
      });
    }

    await new Promise<void>((res) => setTimeout(res, 600));
    setGenSteps(Array(5).fill("done") as ("idle" | "active" | "done")[]);
    setModalState("success");
    goStep(4);
    generateCV();
  };

  // ── GENERATE CV VIA CLAUDE API ─────────────────────────────────────────
  const generateCV = useCallback(async () => {
    setCvHtml(null);
    const tpl = TEMPLATES.find((t) => t.id === selectedTpl);
    const tplName = tpl?.name ?? "Professionnel";

    const prompt = `Rédige un CV professionnel en français, format texte structuré clair (sans symboles markdown ** ou #).
Candidat : ${form.name || "Prénom Nom"} | Poste visé : ${form.title || "Professionnel"}
Modèle : ${tplName} | Secteur : ${form.industry || "Général"} | Niveau : ${form.level || "Intermédiaire"}
Expérience : ${form.experience || "Non fournie"}
Formation : ${form.education || "Non fournie"}
Compétences : ${form.skills || "Non fournies"}
Langues : ${form.langs || "Non fournies"}
Infos supplémentaires : ${form.notes || "Aucune"}
Contact : ${form.email} | ${form.phone}

Structurer ainsi (titres de section en MAJUSCULES) :

NOM COMPLET
Titre du poste | Email | Téléphone

PROFIL PROFESSIONNEL
[2-3 phrases percutantes]

EXPÉRIENCES PROFESSIONNELLES
[Chaque poste sur plusieurs lignes]

FORMATION
[Diplôme, établissement, année]

COMPÉTENCES
[Catégorisées]

LANGUES
[Liste]

Utiliser des verbes d'action, quantifier les réalisations, ton professionnel adapté au marché marocain.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text: string = data.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
      setCvHtml(renderCVHtml(text));
    } catch {
      setCvHtml(`<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:#6b7280;font-size:13px;">Impossible de se connecter à l'API IA. Vérifiez votre configuration.</div>`);
    }
  }, [form, selectedTpl]);

  // ── RENDER CV TEXT → HTML ──────────────────────────────────────────────
  const renderCVHtml = (text: string): string => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const t = line.trim();
      if (!t) return `<div style="height:6px;"></div>`;
      const isSection = /^[A-ZÉÀÂÙÈÊÎÔ][A-ZÉÀÂÙÈÊÎÔ\s\/&]{2,59}$/.test(t) && i > 0;
      if (i === 0) return `<h1 style="font-size:26px;font-weight:700;margin-bottom:2px;font-family:Inter,sans-serif;">${t}</h1>`;
      if (i === 1) return `<div style="font-size:13px;color:#666;margin-bottom:20px;font-family:Inter,sans-serif;">${t}</div>`;
      if (isSection) return `<h2 style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border-bottom:2px solid #1a56db;padding-bottom:5px;margin:24px 0 10px;color:#1a56db;font-family:Inter,sans-serif;">${t}</h2>`;
      return `<p style="font-size:14px;margin-bottom:6px;">${t}</p>`;
    }).join("");
  };

  // ── DOWNLOAD ───────────────────────────────────────────────────────────
  const downloadCV = () => {
    const el = document.getElementById("cvPreview");
    const content = el?.innerText ?? "";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "Mon_CV_TalentMaroc.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── PRICING HELPERS ────────────────────────────────────────────────────
  const priceNum = parseFloat(currentPlan.price);
  const vat = (priceNum * 0.2).toFixed(2);
  const total = (priceNum * 1.2).toFixed(2);

  // ── GEN STEP LABELS ────────────────────────────────────────────────────
  const genStepLabels = [
    "Analyse de votre expérience",
    "Application du modèle choisi",
    "Optimisation ATS",
    "Rédaction et mise en forme",
    "Finalisation du document",
  ];

  // ────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* GLOBAL STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .spinner {
          width:44px; height:44px;
          border:3px solid #e5e7eb;
          border-top-color:#1a56db;
          border-radius:50%;
          animation: spin 0.8s linear infinite;
        }
        .modal-anim { animation: popIn 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        .tpl-card { animation: fadeUp 0.3s ease both; }
        .success-icon-anim { animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both; }
        input, select, textarea {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
        }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #1a56db !important;
          box-shadow: 0 0 0 3px rgba(26,86,219,0.1);
        }
        .pricing-feat li { list-style: none; display: flex; align-items: flex-start; gap: 8px; font-size:13px; margin-bottom:10px; }
        .pricing-feat li::before { content:'✓'; color:#057a55; font-weight:700; font-size:12px; flex-shrink:0; margin-top:1px; }
        .overlay-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px); }
        .tab-active { color:#1a56db!important; border-bottom-color:#1a56db!important; background:white!important; }
        .tab-inactive { color:#6b7280; border-bottom:2px solid transparent; background:transparent; }
        .tab-inactive:hover { color:#1a56db; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#f1f1f1; }
        ::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:3px; }
      `}</style>

      <div style={{ fontFamily: "'Inter', sans-serif", background: "#f3f4f6", color: "#111827", minHeight: "100vh" }}>

        {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
        <nav style={{ background: "#0f1d36", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <a href="https://talentmaroc.shop" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, background: "#1a56db", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "white" }}>T</div>
            <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>TalentMaroc</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[
              { href: "https://talentmaroc.shop", label: "Emplois" },
              { href: "https://talentmaroc.shop/employers", label: "Recruteurs" },
            ].map((l) => (
              <a key={l.label} href={l.href} style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "6px 14px", borderRadius: 6 }}>{l.label}</a>
            ))}
            <span style={{ color: "white", fontSize: 14, fontWeight: 500, padding: "6px 14px", borderRadius: 6, background: "rgba(255,255,255,0.08)" }}>Mon CV</span>
            <a href="https://talentmaroc.shop/auth/login" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "6px 14px", borderRadius: 6 }}>Connexion</a>
            <a href="https://talentmaroc.shop/employers" style={{ background: "#1a56db", color: "white", textDecoration: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, marginLeft: 4 }}>Publier</a>
          </div>
        </nav>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <div style={{ background: "#0f1d36", padding: "56px 24px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 80% at 50% 120%, rgba(26,86,219,0.25) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(26,86,219,0.2)", border: "1px solid rgba(26,86,219,0.3)", color: "#93c5fd", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 100, marginBottom: 20, position: "relative" }}>
            ✦ Nouveau — Générateur de CV IA
          </div>
          <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, color: "white", lineHeight: 1.15, marginBottom: 16, position: "relative" }}>
            Créez un CV <span style={{ color: "#60a5fa" }}>professionnel</span>
            <br />en quelques minutes
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, maxWidth: 540, margin: "0 auto 32px", position: "relative", lineHeight: 1.6 }}>
            Choisissez parmi 25 modèles conçus pour le marché marocain. Notre IA rédige, optimise et met en forme votre CV.
          </p>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap", position: "relative" }}>
            {[["25", "Modèles IA"], ["3 min", "Temps moyen"], ["1,99 €", "À partir de"], ["ATS", "Compatible"]].map(([num, lbl]) => (
              <div key={lbl} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>{num}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN ───────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 20px 80px" }}>

          {/* STEP BAR */}
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "20px 28px", marginBottom: 32, display: "flex", alignItems: "center", gap: 0, boxShadow: "0 1px 3px rgba(0,0,0,.08)", overflowX: "auto" }}>
            {[1, 2, 3, 4].map((n, idx) => (
              <div key={n} style={{ display: "flex", alignItems: "center", flex: idx < 3 ? 1 : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, transition: "all 0.3s", ...stepCircleStyle(n) }}>
                    {n < step ? "✓" : n}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: stepLabelColor(n), whiteSpace: "nowrap" }}>
                    {["Choisir un modèle", "Vos informations", "Paiement", "Télécharger"][n - 1]}
                  </span>
                </div>
                {idx < 3 && (
                  <div style={{ height: 2, flex: 1, minWidth: 24, background: connectorDone(n) ? "#057a55" : "#e5e7eb", margin: "0 8px", transition: "background 0.3s" }} />
                )}
              </div>
            ))}
          </div>

          {/* ── STEP 1: TEMPLATES ────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,.08)", overflow: "hidden", marginBottom: 28 }}>
                {/* Card header */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>📋 Choisissez votre modèle</h3>
                  {selectedTpl && <span style={{ fontSize: 13, color: "#6b7280" }}>Sélectionné : {TEMPLATES.find((t) => t.id === selectedTpl)?.name}</span>}
                </div>
                {/* Filter tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", padding: "0 24px", overflowX: "auto" }}>
                  {CATEGORIES.map((c) => (
                    <button key={c.key} onClick={() => setCatFilter(c.key)}
                      className={catFilter === c.key ? "tab-active" : "tab-inactive"}
                      style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", borderBottom: "2px solid", whiteSpace: "nowrap", transition: "all 0.2s" }}>
                      {c.label}
                    </button>
                  ))}
                </div>
                {/* Grid */}
                <div style={{ padding: "20px 24px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 14 }}>
                  {filteredTpls.map((t, i) => {
                    const tc = t.light ? "rgba(30,30,30,0.55)" : "rgba(255,255,255,0.55)";
                    const bs = BADGE_STYLES[t.badge];
                    const isSel = selectedTpl === t.id;
                    return (
                      <div key={t.id} className="tpl-card" onClick={() => setSelectedTpl(t.id)}
                        style={{ border: `2px solid ${isSel ? "#1a56db" : "#e5e7eb"}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", background: "white", position: "relative", boxShadow: isSel ? "0 0 0 3px rgba(26,86,219,0.15)" : undefined, animationDelay: `${i * 0.03}s`, transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s" }}>
                        {/* Selected check */}
                        {isSel && (
                          <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, background: "#1a56db", borderRadius: "50%", color: "white", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, zIndex: 2 }}>✓</div>
                        )}
                        {/* Badge */}
                        <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: bs.bg, color: bs.color, zIndex: 2 }}>
                          {{ gratuit: "Gratuit", pro: "Pro", nouveau: "Nouveau" }[t.badge]}
                        </span>
                        {/* Preview */}
                        <div style={{ height: 148, background: t.bg, padding: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                          <div style={{ height: 14, borderRadius: 2, background: t.acc, width: "50%" }} />
                          <div style={{ height: 4, borderRadius: 2, background: tc, width: "35%", marginTop: 2 }} />
                          <div style={{ height: 1, background: t.acc, opacity: 0.4, margin: "6px 0" }} />
                          <div style={{ height: 3, borderRadius: 2, background: t.acc, width: "30%", opacity: 0.8 }} />
                          {[100, 80, 60].map((w, j) => <div key={j} style={{ height: 3, borderRadius: 2, background: tc, width: `${w}%`, marginTop: 3 }} />)}
                          <div style={{ height: 3, borderRadius: 2, background: t.acc, width: "30%", opacity: 0.8, marginTop: 6 }} />
                          {[100, 75, 90].map((w, j) => <div key={j} style={{ height: 3, borderRadius: 2, background: tc, width: `${w}%`, marginTop: 3 }} />)}
                        </div>
                        {/* Info */}
                        <div style={{ padding: "10px 12px 12px", borderTop: "1px solid #e5e7eb" }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{t.role}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => goStep(2)} style={{ background: "#1a56db", color: "white", border: "none", padding: "14px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: FORM ─────────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,.08)", overflow: "hidden", marginBottom: 24 }}>
                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", padding: "0 24px" }}>
                  {(["ai", "upload"] as Tab2[]).map((t) => (
                    <button key={t} onClick={() => setTab2(t)}
                      className={tab2 === t ? "tab-active" : "tab-inactive"}
                      style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", borderBottom: "2px solid", transition: "all 0.2s" }}>
                      {t === "ai" ? "✦ Générer avec l'IA" : "↑ Importer mon CV"}
                    </button>
                  ))}
                </div>

                {/* AI FORM */}
                {tab2 === "ai" && (
                  <div style={{ padding: 28 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                      {[
                        { id: "name", label: "Prénom et Nom", placeholder: "Youssef Benali", type: "text" },
                        { id: "title", label: "Poste visé", placeholder: "Développeur Full Stack Senior", type: "text" },
                        { id: "email", label: "Email", placeholder: "youssef@email.ma", type: "email" },
                        { id: "phone", label: "Téléphone", placeholder: "+212 6 00 00 00 00", type: "text" },
                      ].map((f) => (
                        <div key={f.id}>
                          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{f.label}</label>
                          <input type={f.type} value={form[f.id as keyof typeof form]} onChange={(e) => setForm((p) => ({ ...p, [f.id]: e.target.value }))}
                            placeholder={f.placeholder}
                            style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", background: "white", color: "#111827" }} />
                        </div>
                      ))}

                      {/* Industry */}
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Secteur d'activité</label>
                        <select value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
                          style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", background: "white", color: "#111827", cursor: "pointer" }}>
                          <option value="">Sélectionnez...</option>
                          {["Informatique & Technologie", "Finance & Banque", "Commerce & Vente", "Marketing & Communication", "Ressources Humaines", "Ingénierie & Industrie", "Santé & Médecine", "Juridique & Compliance", "Logistique & Supply Chain", "Enseignement & Recherche", "Hôtellerie & Tourisme", "Autre"].map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>

                      {/* Level */}
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Niveau d'expérience</label>
                        <select value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
                          style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", background: "white", color: "#111827", cursor: "pointer" }}>
                          <option value="">Sélectionnez...</option>
                          {["Débutant (0–2 ans)", "Intermédiaire (2–5 ans)", "Confirmé (5–10 ans)", "Manager / Chef d'équipe", "Directeur / Responsable", "Cadre dirigeant / C-Suite"].map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>

                      {/* Experience - full width */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Expériences professionnelles <span style={{ color: "#6b7280", fontWeight: 400 }}>(résumé)</span></label>
                        <textarea value={form.experience} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
                          rows={5} placeholder={"Société A — Développeur (2021–2024) : Développement d'une app mobile utilisée par 200K utilisateurs\nSociété B — Stagiaire (2020–2021) : Création d'API REST, optimisation SQL"}
                          style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", background: "white", color: "#111827", resize: "vertical", lineHeight: 1.6 }} />
                      </div>

                      {/* Education */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Formation</label>
                        <input type="text" value={form.education} onChange={(e) => setForm((p) => ({ ...p, education: e.target.value }))}
                          placeholder="Licence en Informatique, ENSIAS Rabat, 2020"
                          style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", background: "white", color: "#111827" }} />
                      </div>

                      {/* Skills */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Compétences & Technologies</label>
                        <input type="text" value={form.skills} onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
                          placeholder="React, Node.js, SQL, Python, Gestion de projet..."
                          style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", background: "white", color: "#111827" }} />
                      </div>

                      {/* Languages */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Langues parlées</label>
                        <input type="text" value={form.langs} onChange={(e) => setForm((p) => ({ ...p, langs: e.target.value }))}
                          placeholder="Arabe (natif), Français (courant), Anglais (intermédiaire)"
                          style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", background: "white", color: "#111827" }} />
                      </div>

                      {/* Notes */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Informations complémentaires <span style={{ color: "#6b7280", fontWeight: 400 }}>(optionnel)</span></label>
                        <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                          rows={3} placeholder="Certifications, bénévolat, projets personnels..."
                          style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", background: "white", color: "#111827", resize: "vertical", lineHeight: 1.6 }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPLOAD TAB */}
                {tab2 === "upload" && (
                  <div style={{ padding: 28 }}>
                    <label style={{ border: "2px dashed #e5e7eb", borderRadius: 10, padding: "40px 24px", textAlign: "center", cursor: "pointer", display: "block", background: "#f9fafb", position: "relative", transition: "all 0.2s" }}>
                      <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0].name); }}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                      <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.6 }}>📄</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Déposez votre CV ici</div>
                      <p style={{ fontSize: 12, color: "#6b7280" }}>PDF, DOC, DOCX ou TXT · 10 Mo max</p>
                    </label>
                    {uploadedFile && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, marginTop: 14 }}>
                        <span style={{ fontSize: 22 }}>✅</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{uploadedFile}</span>
                      </div>
                    )}
                    <div style={{ marginTop: 24 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Type d'amélioration</label>
                      <select value={enhanceType} onChange={(e) => setEnhanceType(e.target.value)}
                        style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", background: "white", color: "#111827" }}>
                        {["Optimisation ATS — Compatible logiciels de recrutement", "Reformulation Pro — Améliorer l'impact des formulations", "Reconversion — Adapter pour un autre secteur", "Niveau Cadre — Élever vers un profil dirigeant", "Refonte complète — Réécriture totale, garder les faits"].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <button onClick={() => goStep(1)} style={{ background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb", padding: "11px 22px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Retour</button>
                <button onClick={() => goStep(3)} style={{ background: "#1a56db", color: "white", border: "none", padding: "14px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Continuer vers le paiement →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: PRICING ──────────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Choisissez votre formule</h2>
                <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Paiement unique · Livraison immédiate · Satisfait ou remboursé</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 28 }}>
                {[
                  { name: "Starter",       price: "1.99", features: ["1 CV généré par IA", "5 modèles au choix", "Téléchargement PDF", "Compatible ATS", "Livraison instantanée"], featured: false },
                  { name: "Professionnel", price: "4.99", features: ["3 versions de CV", "Tous les 25 modèles", "PDF + Word (DOCX)", "Lettre de motivation incluse", "Résumé LinkedIn", "Génération prioritaire"], featured: true },
                  { name: "Cadre",         price: "9.99", features: ["Révisions illimitées", "Tous les 25 modèles", "PDF + Word + HTML", "Lettre de motivation + Bio", "Coaching ton dirigeant", "Questions d'entretien IA", "Support prioritaire"], featured: false },
                ].map((plan) => (
                  <div key={plan.name}
                    style={{ background: plan.featured ? "#f8faff" : "white", border: `2px solid ${plan.featured ? "#1a56db" : "#e5e7eb"}`, borderRadius: 10, padding: "28px 24px", position: "relative", transition: "all 0.2s" }}>
                    {plan.featured && (
                      <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#1a56db", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 100, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
                        ⭐ Le plus populaire
                      </div>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: 12 }}>{plan.name}</div>
                    <div style={{ fontSize: 42, fontWeight: 800, color: "#111827", lineHeight: 1, marginBottom: 4 }}>
                      <sup style={{ fontSize: 20, fontWeight: 700, verticalAlign: "super" }}>€</sup>
                      {plan.price.split(".")[0]}
                      <span style={{ fontSize: 22 }}>.{plan.price.split(".")[1]}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>Paiement unique</div>
                    <div style={{ height: 1, background: "#e5e7eb", margin: "20px 0" }} />
                    <ul className="pricing-feat" style={{ marginBottom: 24 }}>
                      {plan.features.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                    <button onClick={() => openPayment(plan.name, plan.price)}
                      style={{ width: "100%", background: plan.featured ? "#1a56db" : "transparent", color: plan.featured ? "white" : "#1a56db", border: `1px solid #1a56db`, padding: "11px 22px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                      Choisir {plan.name}
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={() => goStep(2)} style={{ background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb", padding: "11px 22px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Retour</button>
            </div>
          )}

          {/* ── STEP 4: RESULT ───────────────────────────────────────────── */}
          {step === 4 && (
            <div ref={resultRef}>
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>🎉 Votre CV est prêt !</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>Consultez, téléchargez ou régénérez votre CV ci-dessous.</div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={() => { setCvHtml(null); generateCV(); }}
                    style={{ background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb", padding: "11px 22px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    ↺ Régénérer
                  </button>
                  <button onClick={downloadCV}
                    style={{ background: "#057a55", color: "white", border: "none", padding: "11px 22px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    ⬇ Télécharger PDF
                  </button>
                </div>
              </div>

              {/* CV PAPER */}
              <div id="cvPreview"
                style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "52px 60px", boxShadow: "0 4px 16px rgba(0,0,0,.08)", fontFamily: "Georgia, 'Times New Roman', serif", color: "#1a1a1a", minHeight: 400, lineHeight: 1.65 }}>
                {cvHtml === null ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 14, color: "#6b7280", fontSize: 13 }}>
                    <div className="spinner" />
                    Génération en cours…
                  </div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: cvHtml }} />
                )}
              </div>
            </div>
          )}

        </div>{/* /main-container */}

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer style={{ background: "#0f1d36", color: "rgba(255,255,255,0.45)", textAlign: "center", padding: 24, fontSize: 13, marginTop: 60 }}>
          © 2026 Talent Maroc — Propulsé par n8n &amp; Supabase &nbsp;·&nbsp;
          <a href="#" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>Politique de confidentialité</a>
          &nbsp;·&nbsp;
          <a href="#" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>Remboursement</a>
          &nbsp;·&nbsp;
          <a href="#" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>Contact</a>
        </footer>

        {/* ── PAYMENT MODAL ───────────────────────────────────────────────── */}
        {modalOpen && (
          <div className="overlay-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="modal-anim" style={{ background: "white", borderRadius: 14, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>

              {/* PAYMENT FORM */}
              {modalState === "form" && (
                <>
                  <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 800 }}>Finaliser le paiement</h3>
                      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>Paiement sécurisé via Stripe</p>
                    </div>
                    <button onClick={closeModal} style={{ background: "#f3f4f6", border: "none", width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                  <div style={{ padding: "20px 24px 28px" }}>
                    {/* Order box */}
                    <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                      {[
                        [`CV ${currentPlan.name}`, `${currentPlan.price} €`],
                        ["Génération IA", "incluse"],
                        ["TVA (20%)", `${vat} €`],
                      ].map(([label, val]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
                          <span>{label}</span><span>{val}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, paddingTop: 12, borderTop: "1px solid #e5e7eb", marginTop: 8 }}>
                        <span>Total TTC</span>
                        <span style={{ color: "#1a56db" }}>{total} €</span>
                      </div>
                    </div>

                    {/* Card icons */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                      {["VISA", "MC", "CMI", "PayPal"].map((b) => (
                        <div key={b} style={{ height: 24, padding: "3px 8px", border: "1px solid #e5e7eb", borderRadius: 5, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", color: "#6b7280", background: "white" }}>{b}</div>
                      ))}
                    </div>

                    {/* Payment fields */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Nom du titulaire</label>
                        <input type="text" value={payName} onChange={(e) => setPayName(e.target.value)} placeholder="Youssef Benali"
                          style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", color: "#111827" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Numéro de carte</label>
                        <div style={{ position: "relative" }}>
                          <input type="text" value={payCard} onChange={(e) => setPayCard(fmtCard(e.target.value))} placeholder="4242 4242 4242 4242" maxLength={19}
                            style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 40px 10px 14px", width: "100%", color: "#111827" }} />
                          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4 }}>💳</span>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Expiration</label>
                          <input type="text" value={payExp} onChange={(e) => setPayExp(fmtExp(e.target.value))} placeholder="MM / AA" maxLength={7}
                            style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", color: "#111827" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>CVV</label>
                          <input type="text" placeholder="•••" maxLength={4}
                            style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", color: "#111827" }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Email (reçu)</label>
                        <input type="email" value={payEmail} onChange={(e) => setPayEmail(e.target.value)} placeholder="vous@email.ma"
                          style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", width: "100%", color: "#111827" }} />
                      </div>
                      <button onClick={processPayment}
                        style={{ background: "#1a56db", color: "white", border: "none", padding: "14px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", marginTop: 8 }}>
                        🔒 Payer {total} € et générer mon CV
                      </button>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280", justifyContent: "center" }}>
                        🔒 Chiffrement SSL 256 bits · Stripe · Données sécurisées
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* GENERATING */}
              {modalState === "generating" && (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <div className="spinner" style={{ margin: "0 auto 20px" }} />
                  <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Création de votre CV en cours…</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>Notre IA optimise chaque section pour vous.</div>
                  <div style={{ maxWidth: 300, margin: "0 auto", textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}>
                    {genStepLabels.map((label, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: genSteps[i] === "done" ? "#057a55" : genSteps[i] === "active" ? "#1a56db" : "#6b7280", fontWeight: genSteps[i] === "active" ? 600 : 400 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor", flexShrink: 0, backgroundColor: genSteps[i] === "done" ? "#057a55" : genSteps[i] === "active" ? "#1a56db" : "#d1d5db" }} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUCCESS */}
              {modalState === "success" && (
                <>
                  <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={closeModal} style={{ background: "#f3f4f6", border: "none", width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                  <div style={{ padding: "8px 24px 36px", textAlign: "center" }}>
                    <div className="success-icon-anim" style={{ width: 64, height: 64, background: "#f0fdf4", border: "2px solid #6ee7b7", borderRadius: "50%", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>✓</div>
                    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>CV généré avec succès !</div>
                    <p style={{ fontSize: 13, color: "#6b7280", maxWidth: 320, margin: "0 auto 24px", lineHeight: 1.6 }}>
                      Votre CV professionnel est prêt. Un reçu a été envoyé à votre adresse email.
                    </p>
                    <button onClick={() => { closeModal(); setShowResult(true); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }}
                      style={{ background: "#057a55", color: "white", border: "none", padding: "14px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                      Voir et télécharger mon CV →
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

      </div>
    </>
  );
}
