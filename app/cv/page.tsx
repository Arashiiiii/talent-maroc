"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── TYPES ──────────────────────────────────────────────────────────────────
interface Template {
  id: number; name: string; cat: string; role: string;
  bg: string; acc: string; badge: "gratuit" | "pro" | "nouveau"; light?: boolean;
}
interface Plan { name: string; price: string; paddlePriceId: string; }
type Step = 1 | 2 | 3 | 4;
type Tab2 = "ai" | "upload";
type FilterCat = "all"|"tech"|"business"|"creative"|"entry"|"executive"|"academic";

// ─────────────────────────────────────────────────────────────────────────────
// 🔑  REPLACE THESE WITH YOUR REAL VALUES FROM paddle.com
// ─────────────────────────────────────────────────────────────────────────────
const PADDLE_CLIENT_TOKEN = "live_REPLACE_YOUR_CLIENT_TOKEN";
const PADDLE_SANDBOX      = false; // true while testing

const PADDLE_PRICE_IDS = {
  starter:       "pri_REPLACE_STARTER",
  professionnel: "pri_REPLACE_PROFESSIONNEL",
  cadre:         "pri_REPLACE_CADRE",
};
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  { id:1,  name:"Architecte",   cat:"tech",      role:"Développeur · Senior",        bg:"#0f172a", acc:"#3b82f6", badge:"pro"     },
  { id:2,  name:"Circuit",      cat:"tech",      role:"Ingénieur · DevOps",          bg:"#042f2e", acc:"#2dd4bf", badge:"pro"     },
  { id:3,  name:"Nexus",        cat:"tech",      role:"Data Science · IA",           bg:"#1e1b4b", acc:"#818cf8", badge:"nouveau" },
  { id:4,  name:"Console",      cat:"tech",      role:"Full Stack · Mobile",         bg:"#18181b", acc:"#a3e635", badge:"pro"     },
  { id:5,  name:"Horizon",      cat:"business",  role:"Commerce · Vente",            bg:"#1e3a5f", acc:"#60a5fa", badge:"pro"     },
  { id:6,  name:"Meridian",     cat:"business",  role:"Finance · Banque",            bg:"#1c1917", acc:"#f59e0b", badge:"pro"     },
  { id:7,  name:"Stratège",     cat:"business",  role:"Consultant · MBA",            bg:"#0c1445", acc:"#facc15", badge:"nouveau" },
  { id:8,  name:"Vente+",       cat:"business",  role:"Business Dev · KAM",          bg:"#0a1628", acc:"#f97316", badge:"pro"     },
  { id:9,  name:"Lumière",      cat:"creative",  role:"Designer · UX/UI",            bg:"#fdf4ff", acc:"#d946ef", badge:"nouveau", light:true },
  { id:10, name:"Folio",        cat:"creative",  role:"Portfolio · Graphiste",       bg:"#fffbeb", acc:"#f59e0b", badge:"nouveau", light:true },
  { id:11, name:"Création",     cat:"creative",  role:"Publicité · Contenu",         bg:"#1a0a00", acc:"#fb923c", badge:"pro"     },
  { id:12, name:"Départ",       cat:"entry",     role:"Débutant · Tous secteurs",    bg:"#f8fafc", acc:"#6366f1", badge:"gratuit", light:true },
  { id:13, name:"Campus",       cat:"entry",     role:"Étudiant · Alternance",       bg:"#f0fdf4", acc:"#22c55e", badge:"gratuit", light:true },
  { id:14, name:"Tremplin",     cat:"entry",     role:"Premier emploi · Stage",      bg:"#eff6ff", acc:"#3b82f6", badge:"gratuit", light:true },
  { id:15, name:"Reconversion", cat:"entry",     role:"Changement de carrière",      bg:"#fef9c3", acc:"#ca8a04", badge:"nouveau", light:true },
  { id:16, name:"Sommet",       cat:"executive", role:"Cadre supérieur · Directeur", bg:"#0f0f0f", acc:"#d4af37", badge:"pro"     },
  { id:17, name:"Vanguard",     cat:"executive", role:"Direction · VP",              bg:"#1e0a3c", acc:"#c084fc", badge:"pro"     },
  { id:18, name:"Prestige",     cat:"executive", role:"PDG · Conseil d'admin.",      bg:"#0c0a09", acc:"#d97706", badge:"pro"     },
  { id:19, name:"Thèse",        cat:"academic",  role:"Chercheur · Doctorant",       bg:"#1e1b4b", acc:"#818cf8", badge:"pro"     },
  { id:20, name:"Clinique",     cat:"academic",  role:"Médecin · Pharmacien",        bg:"#fff1f2", acc:"#f43f5e", badge:"nouveau", light:true },
  { id:21, name:"Prof",         cat:"academic",  role:"Enseignant · Formateur",      bg:"#f0f9ff", acc:"#0ea5e9", badge:"gratuit", light:true },
  { id:22, name:"Juridique",    cat:"academic",  role:"Avocat · Juriste",            bg:"#1c1917", acc:"#a8a29e", badge:"pro"     },
  { id:23, name:"RH Talent",    cat:"business",  role:"RH · People Ops",             bg:"#fef3c7", acc:"#d97706", badge:"gratuit", light:true },
  { id:24, name:"Hôtellerie",   cat:"entry",     role:"Tourisme · Restauration",     bg:"#0c1a2e", acc:"#7dd3fc", badge:"nouveau" },
  { id:25, name:"Ingénieur",    cat:"tech",      role:"Génie Civil · BTP",           bg:"#14532d", acc:"#86efac", badge:"pro"     },
];

const CATEGORIES: { key: FilterCat; label: string }[] = [
  { key:"all",       label:"Tous (25)"  },
  { key:"tech",      label:"Tech"       },
  { key:"business",  label:"Business"   },
  { key:"creative",  label:"Créatif"    },
  { key:"entry",     label:"Débutant"   },
  { key:"executive", label:"Cadre"      },
  { key:"academic",  label:"Académique" },
];

const BADGE_STYLES: Record<string,{bg:string;color:string}> = {
  gratuit:{ bg:"#f0fdf4", color:"#057a55" },
  pro:    { bg:"#fef3c7", color:"#92400e" },
  nouveau:{ bg:"#eff6ff", color:"#1d4ed8" },
};

const PLANS: Plan[] = [
  { name:"Starter",       price:"1.99", paddlePriceId: PADDLE_PRICE_IDS.starter       },
  { name:"Professionnel", price:"4.99", paddlePriceId: PADDLE_PRICE_IDS.professionnel },
  { name:"Cadre",         price:"9.99", paddlePriceId: PADDLE_PRICE_IDS.cadre         },
];

const PLAN_FEATURES: Record<string,string[]> = {
  Starter:       ["1 CV généré par IA","5 modèles au choix","Téléchargement PDF","Compatible ATS","Livraison instantanée"],
  Professionnel: ["3 versions de CV","Tous les 25 modèles","PDF + Word (DOCX)","Lettre de motivation incluse","Résumé LinkedIn","Génération prioritaire"],
  Cadre:         ["Révisions illimitées","Tous les 25 modèles","PDF + Word + HTML","Lettre de motivation + Bio","Coaching dirigeant","Questions d'entretien IA","Support prioritaire"],
};

const GEN_STEP_LABELS = [
  "Analyse de votre expérience",
  "Application du modèle choisi",
  "Optimisation ATS",
  "Rédaction et mise en forme",
  "Finalisation du document",
];

// ── COMPONENT ─────────────────────────────────────────────────────────────
export default function CVPage() {
  const [step,        setStep]        = useState<Step>(1);
  const [tab2,        setTab2]        = useState<Tab2>("upload"); // default = free upload tab
  const [catFilter,   setCatFilter]   = useState<FilterCat>("all");
  const [selectedTpl, setSelectedTpl] = useState<number|null>(null);
  const [previewTpl,  setPreviewTpl]  = useState<number|null>(null);

  const [form, setForm] = useState({
    name:"", title:"", email:"", phone:"",
    industry:"", level:"", experience:"",
    education:"", skills:"", langs:"", notes:"",
  });

  // Upload state
  const [uploadedFile,    setUploadedFile]    = useState<string|null>(null);
  const [uploadedFileObj, setUploadedFileObj] = useState<File|null>(null);
  const [uploadedContent, setUploadedContent] = useState<string>("");
  const [uploadedBase64,  setUploadedBase64]  = useState<string|null>(null);
  const [uploadedMime,    setUploadedMime]    = useState<string|null>(null);
  const [enhanceType,     setEnhanceType]     = useState("Optimisation ATS — Compatible logiciels de recrutement");
  const [uploadError,     setUploadError]     = useState<string|null>(null);

  // Paddle
  const [paddleReady, setPaddleReady] = useState(false);
  const [payPending,  setPayPending]  = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan>(PLANS[1]);

  // Generating
  const [showGenModal, setShowGenModal] = useState(false);
  const [genSteps,     setGenSteps]     = useState<("idle"|"active"|"done")[]>(Array(5).fill("idle"));
  const [genMode,      setGenMode]      = useState<"ai"|"upload">("upload"); // track which mode triggered generation

  // Result
  const [cvHtml,   setCvHtml]   = useState<string|null>(null);
  const resultRef               = useRef<HTMLDivElement>(null);

  // ── LOAD PADDLE SDK ────────────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById("paddle-js")) { setPaddleReady(true); return; }
    const script  = document.createElement("script");
    script.id     = "paddle-js";
    script.src    = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      // @ts-ignore
      const P = window.Paddle;
      if (PADDLE_SANDBOX) P.Environment.set("sandbox");
      P.Initialize({ token: PADDLE_CLIENT_TOKEN });
      setPaddleReady(true);
    };
    document.body.appendChild(script);
  }, []);

  // ── DETECT ?payment=success ────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      window.history.replaceState({}, "", "/cv");
      setGenMode("ai");
      startGenerating("ai");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── READ UPLOADED FILE ─────────────────────────────────────────────────
  const handleFileUpload = (file: File) => {
    setUploadError(null);
    setUploadedFile(file.name);
    setUploadedFileObj(file);

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedContent(e.target?.result as string ?? "");
        setUploadedBase64(null);
        setUploadedMime(null);
      };
      reader.readAsText(file);
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // Read PDF as base64 — Claude API can read it natively
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        setUploadedBase64(base64);
        setUploadedMime("application/pdf");
        setUploadedContent("");
      };
      reader.readAsDataURL(file);
    } else {
      // DOC/DOCX — read as text best effort
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedContent(e.target?.result as string ?? "");
        setUploadedBase64(null);
        setUploadedMime(null);
      };
      reader.readAsText(file);
    }
  };

  // ── FREE UPLOAD PATH — goes straight to result ─────────────────────────
  const handleFreeEnhance = () => {
    if (!uploadedFile) { setUploadError("Veuillez d'abord importer un fichier CV."); return; }
    setGenMode("upload");
    startGenerating("upload");
  };

  // ── OPEN PADDLE CHECKOUT (AI path only) ───────────────────────────────
  const openPaddleCheckout = (plan: Plan) => {
    // @ts-ignore
    const P = window.Paddle;
    if (!P || !paddleReady) { alert("Chargement en cours, réessayez dans un instant."); return; }
    setCurrentPlan(plan);
    setPayPending(true);
    P.Checkout.open({
      items: [{ priceId: plan.paddlePriceId, quantity: 1 }],
      customer: { email: form.email || undefined },
      customData: { plan: plan.name, candidateName: form.name, templateId: selectedTpl },
      settings: { displayModeTheme:"light", locale:"fr", successUrl:`${window.location.origin}/cv?payment=success` },
      eventCallback: (event: { name:string }) => {
        if (event.name === "checkout.completed") { setPayPending(false); setGenMode("ai"); startGenerating("ai"); }
        if (event.name === "checkout.closed")    { setPayPending(false); }
      },
    });
  };

  // ── GENERATING ANIMATION ───────────────────────────────────────────────
  const startGenerating = async (mode: "ai"|"upload") => {
    setShowGenModal(true);
    setGenSteps(Array(5).fill("idle"));
    for (let i = 0; i < 5; i++) {
      await new Promise<void>((res) => setTimeout(() => {
        setGenSteps((prev) => {
          const u = [...prev] as ("idle"|"active"|"done")[];
          if (i > 0) u[i-1] = "done";
          u[i] = "active";
          return u;
        });
        res();
      }, i * 800));
    }
    await new Promise<void>((res) => setTimeout(res, 500));
    setGenSteps(Array(5).fill("done") as ("idle"|"active"|"done")[]);
    setShowGenModal(false);
    goStep(4);
    if (mode === "upload") generateUploadCV();
    else generateAICV();
  };

  // ── GENERATE: UPLOAD/ENHANCE (FREE) ───────────────────────────────────
  const generateUploadCV = useCallback(async () => {
    setCvHtml(null);

    const instructions = `Tu es un expert en rédaction de CV professionnels pour le marché marocain.

L'utilisateur souhaite améliorer son CV avec le mode : "${enhanceType}".

IMPORTANT : Utilise UNIQUEMENT les informations présentes dans le CV fourni. Ne génère AUCUNE information fictive. Conserve tous les faits : noms, entreprises, dates, diplômes, compétences réelles.

Retourne le CV amélioré en français, format texte structuré clair (sans symboles markdown ** ou #).
Structure obligatoire (titres en MAJUSCULES) :

NOM COMPLET
Titre du poste | Email | Téléphone

PROFIL PROFESSIONNEL
[2-3 phrases percutantes basées sur l'expérience réelle]

EXPÉRIENCES PROFESSIONNELLES
[Chaque poste avec dates et réalisations concrètes tirées du CV original]

FORMATION
[Diplômes et formations exactement comme dans le CV original]

COMPÉTENCES
[Compétences réelles du candidat, bien organisées]

LANGUES
[Langues exactement comme dans le CV original]

Applique le mode "${enhanceType}" : améliore uniquement la formulation, le style et l'impact. Ne change pas les faits.`;

    try {
      let messages: any[];

      if (uploadedBase64 && uploadedMime === "application/pdf") {
        // PDF — send as native document so Claude reads it directly
        messages = [{
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: uploadedBase64 },
            },
            { type: "text", text: instructions },
          ],
        }];
      } else {
        // Plain text / DOC
        const cvText = uploadedContent || "[Contenu du CV non disponible]";
        messages = [{
          role: "user",
          content: `Voici le CV à améliorer :

${cvText}

${instructions}`,
        }];
      }

      const res = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages,
        }),
      });
      const data = await res.json();
      const text: string = data.content?.map((c:{text?:string}) => c.text ?? "").join("") ?? "";
      if (!text.trim()) {
        setCvHtml(`<div style="color:#dc2626;text-align:center;padding:40px;">Aucun contenu retourné. Vérifiez votre fichier et réessayez.</div>`);
      } else {
        setCvHtml(renderCVHtml(text));
      }
    } catch (err) {
      setCvHtml(`<div style="color:#6b7280;text-align:center;padding:40px;">Erreur de connexion. Vérifiez votre configuration.</div>`);
    }
  }, [uploadedContent, uploadedBase64, uploadedMime, enhanceType]);

  // ── GENERATE: AI FROM FORM (PAID) ─────────────────────────────────────
  const generateAICV = useCallback(async () => {
    setCvHtml(null);
    const tpl     = TEMPLATES.find((t) => t.id === selectedTpl);
    const tplName = tpl?.name ?? "Professionnel";

    const prompt = `Rédige un CV professionnel en français, format texte structuré clair (sans symboles markdown ** ou #).
Candidat : ${form.name||"Prénom Nom"} | Poste visé : ${form.title||"Professionnel"}
Modèle : ${tplName} | Secteur : ${form.industry||"Général"} | Niveau : ${form.level||"Intermédiaire"}
Expérience : ${form.experience||"Non fournie"}
Formation : ${form.education||"Non fournie"}
Compétences : ${form.skills||"Non fournies"}
Langues : ${form.langs||"Non fournies"}
Infos supplémentaires : ${form.notes||"Aucune"}
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
      const res  = await fetch("/api/generate-cv", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:4000, messages:[{role:"user",content:prompt}] }),
      });
      const data = await res.json();
      const text: string = data.content?.map((c:{text?:string})=>c.text??"").join("") ?? "";
      setCvHtml(renderCVHtml(text));
    } catch {
      setCvHtml(`<div style="color:#6b7280;text-align:center;padding:40px;">Erreur de connexion. Vérifiez votre configuration.</div>`);
    }
  }, [form, selectedTpl]);

  const renderCVHtml = (text: string): string =>
    text.split("\n").map((line,i) => {
      const t = line.trim();
      if (!t) return `<div style="height:6px;"></div>`;
      const isSection = /^[A-ZÉÀÂÙÈÊÎÔ][A-ZÉÀÂÙÈÊÎÔ\s\/&]{2,59}$/.test(t) && i > 0;
      if (i===0) return `<h1 style="font-size:26px;font-weight:700;margin-bottom:2px;font-family:Inter,sans-serif;">${t}</h1>`;
      if (i===1) return `<div style="font-size:13px;color:#666;margin-bottom:20px;font-family:Inter,sans-serif;">${t}</div>`;
      if (isSection) return `<h2 style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border-bottom:2px solid #1a56db;padding-bottom:5px;margin:24px 0 10px;color:#1a56db;font-family:Inter,sans-serif;">${t}</h2>`;
      return `<p style="font-size:14px;margin-bottom:6px;">${t}</p>`;
    }).join("");

  const downloadCV = () => {
    const content = document.getElementById("cvPreview")?.innerText ?? "";
    const blob = new Blob([content],{type:"text/plain;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download="Mon_CV_TalentMaroc.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const goStep = (n: Step) => { setStep(n); window.scrollTo({top:0,behavior:"smooth"}); };

  const stepCircleStyle = (n: number) => {
    if (n < step)   return { background:"#057a55", borderColor:"#057a55", color:"white" };
    if (n === step) return { background:"#1a56db", borderColor:"#1a56db", color:"white" };
    return { background:"#f3f4f6", borderColor:"#e5e7eb", color:"#6b7280" };
  };
  const stepLabelColor = (n: number) => n<step?"#057a55":n===step?"#1a56db":"#6b7280";
  const filteredTpls   = catFilter==="all" ? TEMPLATES : TEMPLATES.filter(t=>t.cat===catFilter);

  // Step bar labels change depending on mode
  const stepLabels = tab2==="upload"
    ? ["Importer mon CV","Options","—","Télécharger"]
    : ["Choisir un modèle","Vos informations","Paiement","Télécharger"];

  // ── JSX ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        html,body{width:100%;overflow-x:hidden;}
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Inter',sans-serif;}
        @keyframes spin   {to{transform:rotate(360deg);}}
        @keyframes popIn  {from{opacity:0;transform:scale(0.94) translateY(10px);}to{opacity:1;transform:scale(1) translateY(0);}}
        @keyframes fadeUp {from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        .spinner{width:44px;height:44px;border:3px solid #e5e7eb;border-top-color:#1a56db;border-radius:50%;animation:spin 0.8s linear infinite;}
        .modal-anim{animation:popIn 0.25s cubic-bezier(0.34,1.56,0.64,1);}
        .tpl-card{animation:fadeUp 0.3s ease both;}
        input,select,textarea{font-family:'Inter',sans-serif;font-size:14px;}
        input:focus,select:focus,textarea:focus{outline:none;border-color:#1a56db!important;box-shadow:0 0 0 3px rgba(26,86,219,0.1);}
        .pricing-feat li{list-style:none;display:flex;align-items:flex-start;gap:8px;font-size:13px;margin-bottom:10px;}
        .pricing-feat li::before{content:'✓';color:#057a55;font-weight:700;font-size:12px;flex-shrink:0;margin-top:1px;}
        .overlay-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px);}
        .tab-btn{padding:14px 22px;font-size:13px;font-weight:600;border:none;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;background:transparent;color:#6b7280;}
        .tab-btn:hover{color:#1a56db;}
        .tab-active{color:#1a56db!important;border-bottom-color:#1a56db!important;background:white!important;}
        .pay-btn{transition:opacity 0.2s,transform 0.1s;}
        .pay-btn:hover:not(:disabled){opacity:0.88;transform:translateY(-1px);}
        .pay-btn:disabled{opacity:0.5;cursor:not-allowed;}
        .free-badge{display:inline-flex;align-items:center;gap:5px;background:#f0fdf4;border:1px solid #bbf7d0;color:#057a55;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;}
        .paid-badge{display:inline-flex;align-items:center;gap:5px;background:#fef3c7;border:1px solid #fde68a;color:#92400e;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;}
      `}</style>

      <div style={{fontFamily:"'Inter',sans-serif",background:"#f3f4f6",color:"#111827",minHeight:"100vh",width:"100%"}}>

        {/* ── NAVBAR ── */}
        <nav style={{background:"#0f1d36",padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,width:"100%"}}>
          <a href="https://talentmaroc.shop" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}>
            <div style={{width:34,height:34,background:"#1a56db",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"white"}}>T</div>
            <span style={{color:"white",fontWeight:700,fontSize:15}}>TalentMaroc</span>
          </a>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <a href="https://talentmaroc.shop"            style={{color:"rgba(255,255,255,0.7)",textDecoration:"none",fontSize:14,fontWeight:500,padding:"6px 14px",borderRadius:6}}>Emplois</a>
            <a href="https://talentmaroc.shop/employers"  style={{color:"rgba(255,255,255,0.7)",textDecoration:"none",fontSize:14,fontWeight:500,padding:"6px 14px",borderRadius:6}}>Recruteurs</a>
            <span style={{color:"white",fontSize:14,fontWeight:500,padding:"6px 14px",borderRadius:6,background:"rgba(255,255,255,0.08)"}}>Mon CV</span>
            <a href="https://talentmaroc.shop/auth/login" style={{color:"rgba(255,255,255,0.7)",textDecoration:"none",fontSize:14,fontWeight:500,padding:"6px 14px",borderRadius:6}}>Connexion</a>
            <a href="https://talentmaroc.shop/employers"  style={{background:"#1a56db",color:"white",textDecoration:"none",padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,marginLeft:4}}>Publier</a>
          </div>
        </nav>

        {/* ── HERO ── */}
        <div style={{background:"#0f1d36",padding:"52px 24px 60px",textAlign:"center",position:"relative",overflow:"hidden",width:"100%"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 80% at 50% 120%, rgba(26,86,219,0.25) 0%, transparent 60%)",pointerEvents:"none"}}/>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(26,86,219,0.2)",border:"1px solid rgba(26,86,219,0.3)",color:"#93c5fd",fontSize:12,fontWeight:600,padding:"5px 14px",borderRadius:100,marginBottom:20,position:"relative"}}>
            ✦ Nouveau — Générateur de CV IA
          </div>
          <h1 style={{fontSize:"clamp(26px,5vw,46px)",fontWeight:800,color:"white",lineHeight:1.15,marginBottom:16,position:"relative"}}>
            Créez un CV <span style={{color:"#60a5fa"}}>professionnel</span><br/>en quelques minutes
          </h1>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:15,maxWidth:560,margin:"0 auto 28px",position:"relative",lineHeight:1.65}}>
            Importez votre CV existant gratuitement, ou laissez notre IA le créer de A à Z à partir de 1,99 €.
          </p>

          {/* Mode selector in hero */}
          <div style={{display:"inline-flex",background:"rgba(255,255,255,0.08)",borderRadius:12,padding:4,gap:4,position:"relative",marginBottom:28}}>
            <button onClick={()=>{setTab2("upload");}}
              style={{padding:"10px 22px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:600,fontSize:14,transition:"all 0.2s",
                background:tab2==="upload"?"white":"transparent",color:tab2==="upload"?"#111827":"rgba(255,255,255,0.7)"}}>
              ↑ Importer mon CV <span style={{fontSize:11,marginLeft:6,background:"#f0fdf4",color:"#057a55",padding:"2px 7px",borderRadius:100,fontWeight:700}}>GRATUIT</span>
            </button>
            <button onClick={()=>{setTab2("ai");}}
              style={{padding:"10px 22px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:600,fontSize:14,transition:"all 0.2s",
                background:tab2==="ai"?"white":"transparent",color:tab2==="ai"?"#111827":"rgba(255,255,255,0.7)"}}>
              ✦ Générer avec l'IA <span style={{fontSize:11,marginLeft:6,background:"#fef3c7",color:"#92400e",padding:"2px 7px",borderRadius:100,fontWeight:700}}>À PARTIR DE 1,99 €</span>
            </button>
          </div>

          <div style={{display:"flex",gap:28,justifyContent:"center",flexWrap:"wrap",position:"relative"}}>
            {[["25","Modèles IA"],["Gratuit","Importer & améliorer"],["1,99 €","Générer par IA"],["ATS","Compatible"]].map(([num,lbl])=>(
              <div key={lbl} style={{textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:800,color:"white"}}>{num}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:2}}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{width:"100%",maxWidth:1140,margin:"0 auto",padding:"36px 20px 80px"}}>

          {/* ════════════════════════════════════════════
              UPLOAD PATH — FREE (no steps needed, direct)
              ════════════════════════════════════════════ */}
          {tab2 === "upload" && step !== 4 && (
            <div>
              {/* Free banner */}
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"14px 20px",display:"flex",alignItems:"center",gap:12,marginBottom:24,fontSize:13,color:"#065f46"}}>
                <span style={{fontSize:20}}>🎁</span>
                <div>
                  <strong>Gratuit</strong> — Importez votre CV existant et notre IA l'améliore instantanément, sans paiement.
                  <span style={{color:"#6b7280",marginLeft:8}}>Envie d'un CV créé de zéro ? <button onClick={()=>setTab2("ai")} style={{background:"none",border:"none",color:"#1a56db",cursor:"pointer",fontWeight:600,padding:0,fontSize:13}}>Essayez le générateur IA →</button></span>
                </div>
              </div>

              <div style={{background:"white",border:"1px solid #e5e7eb",borderRadius:10,boxShadow:"0 1px 3px rgba(0,0,0,.08)",overflow:"hidden",marginBottom:24}}>
                <div style={{padding:"20px 24px",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <h3 style={{fontSize:15,fontWeight:700}}>↑ Importer et améliorer votre CV</h3>
                    <p style={{fontSize:12,color:"#6b7280",marginTop:3}}>Téléchargez votre CV existant — notre IA le reformule et l'optimise.</p>
                  </div>
                  <span className="free-badge">✓ Gratuit</span>
                </div>

                <div style={{padding:28}}>
                  {/* Drop zone */}
                  <label style={{border:"2px dashed #d1d5db",borderRadius:10,padding:"36px 24px",textAlign:"center",cursor:"pointer",display:"block",background:"#f9fafb",position:"relative",transition:"border-color 0.2s"}}>
                    <input type="file" accept=".pdf,.doc,.docx,.txt"
                      onChange={e=>{if(e.target.files?.[0])handleFileUpload(e.target.files[0]);}}
                      style={{position:"absolute",inset:0,opacity:0,cursor:"pointer"}}/>
                    <div style={{fontSize:40,marginBottom:12,opacity:0.5}}>📄</div>
                    <div style={{fontSize:15,fontWeight:700,marginBottom:6,color:"#111827"}}>Déposez votre CV ici</div>
                    <p style={{fontSize:12,color:"#9ca3af"}}>PDF, DOC, DOCX ou TXT · 10 Mo max</p>
                  </label>

                  {uploadedFile && (
                    <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,marginTop:14}}>
                      <span style={{fontSize:22}}>✅</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:"#065f46"}}>{uploadedFile}</div>
                        <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>Fichier prêt à être amélioré</div>
                      </div>
                      <button onClick={()=>{setUploadedFile(null);setUploadedContent("");setUploadedBase64(null);setUploadedMime(null);setUploadedFileObj(null);}}
                        style={{marginLeft:"auto",background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
                    </div>
                  )}

                  {uploadError && (
                    <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginTop:12,fontSize:13,color:"#dc2626"}}>
                      ⚠ {uploadError}
                    </div>
                  )}

                  {/* Enhancement type */}
                  <div style={{marginTop:24}}>
                    <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:8}}>
                      Type d'amélioration
                    </label>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
                      {[
                        {value:"Optimisation ATS — Compatible logiciels de recrutement",        icon:"🤖", desc:"Mots-clés ATS, structure optimisée"},
                        {value:"Reformulation Pro — Améliorer l'impact des formulations",        icon:"✍️", desc:"Verbes d'action, résultats chiffrés"},
                        {value:"Reconversion — Adapter pour un autre secteur",                   icon:"🔄", desc:"Mise en valeur des compétences transférables"},
                        {value:"Niveau Cadre — Élever vers un profil dirigeant",                 icon:"🎯", desc:"Ton stratégique, leadership"},
                        {value:"Refonte complète — Réécriture totale, garder les faits",         icon:"🔥", desc:"Réécriture intégrale professionnelle"},
                      ].map(opt=>(
                        <label key={opt.value}
                          style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",border:`2px solid ${enhanceType===opt.value?"#1a56db":"#e5e7eb"}`,borderRadius:8,cursor:"pointer",background:enhanceType===opt.value?"#f0f7ff":"white",transition:"all 0.15s"}}>
                          <input type="radio" name="enhance" value={opt.value} checked={enhanceType===opt.value} onChange={()=>setEnhanceType(opt.value)} style={{marginTop:2,accentColor:"#1a56db"}}/>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:enhanceType===opt.value?"#1a56db":"#111827"}}>{opt.icon} {opt.value.split("—")[0].trim()}</div>
                            <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{opt.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{marginTop:28,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                    <button onClick={handleFreeEnhance}
                      style={{background:"#057a55",color:"white",border:"none",padding:"14px 32px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                      ✨ Améliorer mon CV gratuitement
                    </button>
                    <span style={{fontSize:12,color:"#6b7280"}}>🔒 Aucun paiement requis</span>
                  </div>
                </div>
              </div>

              {/* Upsell */}
              <div style={{background:"#0f1d36",borderRadius:10,padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"white",marginBottom:4}}>✦ Envie d'un CV créé de zéro par l'IA ?</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>Choisissez parmi 25 modèles et notre IA rédige tout pour vous.</div>
                </div>
                <button onClick={()=>setTab2("ai")}
                  style={{background:"#1a56db",color:"white",border:"none",padding:"10px 22px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                  Essayer le générateur IA →
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              AI PATH — PAID (step 1 → 2 → 3 → 4)
              ════════════════════════════════════════════ */}
          {tab2 === "ai" && step !== 4 && (
            <div>
              {/* Paid banner */}
              <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"14px 20px",display:"flex",alignItems:"center",gap:12,marginBottom:24,fontSize:13,color:"#92400e"}}>
                <span style={{fontSize:20}}>✦</span>
                <div>
                  <strong>Générateur IA</strong> — Notre IA rédige votre CV de A à Z à partir de vos informations. À partir de 1,99 €.
                  <span style={{color:"#6b7280",marginLeft:8}}>Vous avez déjà un CV ? <button onClick={()=>setTab2("upload")} style={{background:"none",border:"none",color:"#057a55",cursor:"pointer",fontWeight:600,padding:0,fontSize:13}}>Importez-le gratuitement →</button></span>
                </div>
              </div>

              {/* STEP BAR */}
              <div style={{background:"white",border:"1px solid #e5e7eb",borderRadius:10,padding:"18px 24px",marginBottom:28,display:"flex",alignItems:"center",boxShadow:"0 1px 3px rgba(0,0,0,.08)",overflowX:"auto"}}>
                {[1,2,3].map((n,idx)=>(
                  <div key={n} style={{display:"flex",alignItems:"center",flex:idx<2?1:"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                      <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,transition:"all 0.3s",...stepCircleStyle(n)}}>
                        {n<step?"✓":n}
                      </div>
                      <span style={{fontSize:13,fontWeight:600,color:stepLabelColor(n),whiteSpace:"nowrap"}}>
                        {["Choisir un modèle","Vos informations","Paiement"][n-1]}
                      </span>
                    </div>
                    {idx<2 && <div style={{height:2,flex:1,minWidth:20,background:n<step?"#057a55":"#e5e7eb",margin:"0 8px",transition:"background 0.3s"}}/>}
                  </div>
                ))}
              </div>

              {/* STEP 1: TEMPLATES */}
              {step===1 && (
                <div>
                  <div style={{background:"white",border:"1px solid #e5e7eb",borderRadius:10,boxShadow:"0 1px 3px rgba(0,0,0,.08)",overflow:"hidden",marginBottom:24}}>
                    <div style={{padding:"20px 24px",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                      <div>
                        <h3 style={{fontSize:15,fontWeight:700}}>📋 Choisissez votre modèle</h3>
                        <p style={{fontSize:12,color:"#6b7280",marginTop:2}}>Cliquez sur un modèle pour voir l'aperçu complet.</p>
                      </div>
                      {selectedTpl && <span style={{fontSize:13,color:"#6b7280"}}>Sélectionné : <strong>{TEMPLATES.find(t=>t.id===selectedTpl)?.name}</strong></span>}
                    </div>

                    {/* Category filter */}
                    <div style={{display:"flex",borderBottom:"1px solid #e5e7eb",background:"#f9fafb",padding:"0 24px",overflowX:"auto"}}>
                      {CATEGORIES.map(c=>(
                        <button key={c.key} onClick={()=>setCatFilter(c.key)}
                          className={`tab-btn${catFilter===c.key?" tab-active":""}`}>
                          {c.label}
                        </button>
                      ))}
                    </div>

                    {/* Template grid */}
                    <div style={{padding:"20px 24px 24px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
                      {filteredTpls.map((t,i)=>{
                        const isLight = t.light;
                        const txtColor = isLight ? "rgba(30,30,30,0.6)" : "rgba(255,255,255,0.6)";
                        const bs  = BADGE_STYLES[t.badge];
                        const sel = selectedTpl===t.id;
                        return (
                          <div key={t.id} className="tpl-card"
                            style={{border:`2px solid ${sel?"#1a56db":"#e5e7eb"}`,borderRadius:12,overflow:"hidden",cursor:"pointer",
                              background:"white",position:"relative",
                              boxShadow:sel?"0 0 0 4px rgba(26,86,219,0.12), 0 4px 16px rgba(0,0,0,0.1)":"0 1px 4px rgba(0,0,0,0.06)",
                              animationDelay:`${i*0.025}s`,transition:"all 0.2s"}}>

                            {sel && (
                              <div style={{position:"absolute",top:8,right:8,width:22,height:22,background:"#1a56db",
                                borderRadius:"50%",color:"white",fontSize:11,display:"flex",alignItems:"center",
                                justifyContent:"center",fontWeight:700,zIndex:3}}>✓</div>
                            )}
                            <span style={{position:"absolute",top:8,left:8,fontSize:10,fontWeight:700,padding:"3px 8px",
                              borderRadius:100,background:bs.bg,color:bs.color,zIndex:3,letterSpacing:"0.04em"}}>
                              {{gratuit:"Gratuit",pro:"Pro",nouveau:"Nouveau"}[t.badge]}
                            </span>

                            {/* CV PREVIEW THUMBNAIL — scaled real layout */}
                            <div style={{height:220,overflow:"hidden",position:"relative",background:t.bg}}>
                              {/* Outer clip container — card width ~200px, we render at 400px then scale 0.5 */}
                              <div style={{position:"absolute",top:0,left:0,width:400,transformOrigin:"top left",transform:"scale(0.5)",pointerEvents:"none"}}>
                                <div style={{background:t.bg,padding:"32px 32px 24px",fontFamily:"Inter,sans-serif",width:400}}>
                                  {/* Name */}
                                  <div style={{fontSize:18,fontWeight:800,color:isLight?"#0f172a":"#fff",letterSpacing:"-0.02em",marginBottom:3}}>{t.name} — CV</div>
                                  <div style={{fontSize:11,fontWeight:600,color:t.acc,marginBottom:3}}>{t.role}</div>
                                  <div style={{fontSize:10,color:isLight?"#6b7280":"rgba(255,255,255,0.5)",marginBottom:12}}>email@exemple.ma · +212 6 00 00 00 00 · Casablanca</div>
                                  {/* Divider */}
                                  <div style={{height:2,background:t.acc,opacity:0.6,marginBottom:12}}/>
                                  {/* Profile section */}
                                  <div style={{fontSize:8,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:t.acc,marginBottom:5}}>PROFIL</div>
                                  <div style={{fontSize:9,color:isLight?"#374151":"rgba(255,255,255,0.6)",lineHeight:1.6,marginBottom:12}}>
                                    Professionnel expérimenté avec expertise en {t.role.split("·")[0].trim()}. Forte capacité d analyse et de leadership.
                                  </div>
                                  {/* Experience section */}
                                  <div style={{fontSize:8,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:t.acc,marginBottom:6}}>EXPÉRIENCES</div>
                                  <div style={{marginBottom:8}}>
                                    <div style={{fontSize:9,fontWeight:700,color:isLight?"#111827":"#fff",marginBottom:1}}>Poste Senior — Entreprise Maroc <span style={{fontWeight:400,color:isLight?"#6b7280":"rgba(255,255,255,0.45)"}}>2021–Présent</span></div>
                                    <div style={{fontSize:9,color:isLight?"#4b5563":"rgba(255,255,255,0.55)",lineHeight:1.5}}>Direction de projets stratégiques. Résultats mesurables et impact fort.</div>
                                  </div>
                                  <div style={{marginBottom:12}}>
                                    <div style={{fontSize:9,fontWeight:700,color:isLight?"#111827":"#fff",marginBottom:1}}>Consultant — Groupe International <span style={{fontWeight:400,color:isLight?"#6b7280":"rgba(255,255,255,0.45)"}}>2018–2021</span></div>
                                    <div style={{fontSize:9,color:isLight?"#4b5563":"rgba(255,255,255,0.55)",lineHeight:1.5}}>Accompagnement clients grands comptes. Technologies innovantes.</div>
                                  </div>
                                  {/* Two-col: Skills + Education */}
                                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                                    <div>
                                      <div style={{fontSize:8,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:t.acc,marginBottom:5}}>COMPÉTENCES</div>
                                      {["Expertise technique","Management","Communication","Analyse & Stratégie"].map(sk=>(
                                        <div key={sk} style={{fontSize:8,color:isLight?"#374151":"rgba(255,255,255,0.55)",marginBottom:3,display:"flex",alignItems:"center",gap:4}}>
                                          <div style={{width:4,height:4,borderRadius:"50%",background:t.acc,flexShrink:0}}/>{sk}
                                        </div>
                                      ))}
                                    </div>
                                    <div>
                                      <div style={{fontSize:8,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:t.acc,marginBottom:5}}>FORMATION</div>
                                      <div style={{fontSize:9,fontWeight:600,color:isLight?"#111827":"#fff",marginBottom:1}}>Master Ingénierie</div>
                                      <div style={{fontSize:8,color:isLight?"#6b7280":"rgba(255,255,255,0.45)"}}>Université Maroc · 2018</div>
                                      <div style={{marginTop:8,fontSize:8,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:t.acc,marginBottom:4}}>LANGUES</div>
                                      <div style={{fontSize:8,color:isLight?"#374151":"rgba(255,255,255,0.55)",lineHeight:1.6}}>Arabe · Français · Anglais</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Bottom fade */}
                              <div style={{position:"absolute",bottom:0,left:0,right:0,height:50,background:`linear-gradient(to bottom,transparent,${t.bg})`,pointerEvents:"none"}}/>
                            </div>

                            {/* Card footer */}
                            <div style={{padding:"10px 14px 12px",borderTop:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                              <div>
                                <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{t.name}</div>
                                <div style={{fontSize:10,color:"#6b7280",marginTop:1}}>{t.role}</div>
                              </div>
                              <button
                                onClick={(e)=>{e.stopPropagation();setPreviewTpl(t.id);}}
                                style={{background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:6,padding:"4px 9px",
                                  fontSize:10,fontWeight:600,color:"#374151",cursor:"pointer",whiteSpace:"nowrap",
                                  transition:"all 0.15s",flexShrink:0}}
                                onMouseEnter={e=>(e.currentTarget.style.background="#e5e7eb")}
                                onMouseLeave={e=>(e.currentTarget.style.background="#f3f4f6")}>
                                Aperçu
                              </button>
                            </div>

                            {/* Click whole card to select */}
                            <div onClick={()=>setSelectedTpl(t.id)}
                              style={{position:"absolute",inset:0,zIndex:1}}/>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <button onClick={()=>goStep(2)} disabled={!selectedTpl}
                      style={{background:selectedTpl?"#1a56db":"#d1d5db",color:"white",border:"none",padding:"14px 28px",
                        borderRadius:8,fontSize:15,fontWeight:600,cursor:selectedTpl?"pointer":"not-allowed",transition:"background 0.2s"}}>
                      Continuer →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: FORM */}
              {step===2 && (
                <div>
                  <div style={{background:"white",border:"1px solid #e5e7eb",borderRadius:10,boxShadow:"0 1px 3px rgba(0,0,0,.08)",overflow:"hidden",marginBottom:24}}>
                    <div style={{padding:"20px 24px",borderBottom:"1px solid #e5e7eb"}}>
                      <h3 style={{fontSize:15,fontWeight:700}}>📝 Vos informations</h3>
                      <p style={{fontSize:12,color:"#6b7280",marginTop:3}}>L'IA utilisera ces données pour rédiger votre CV.</p>
                    </div>
                    <div style={{padding:28}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                        {[
                          {id:"name",  label:"Prénom et Nom",  ph:"Youssef Benali",               type:"text" },
                          {id:"title", label:"Poste visé",     ph:"Développeur Full Stack Senior", type:"text" },
                          {id:"email", label:"Email",          ph:"youssef@email.ma",             type:"email"},
                          {id:"phone", label:"Téléphone",      ph:"+212 6 00 00 00 00",           type:"text" },
                        ].map(f=>(
                          <div key={f.id}>
                            <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>{f.label}</label>
                            <input type={f.type} value={form[f.id as keyof typeof form]} onChange={e=>setForm(p=>({...p,[f.id]:e.target.value}))}
                              placeholder={f.ph} style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 14px",width:"100%",background:"white",color:"#111827"}}/>
                          </div>
                        ))}
                        <div>
                          <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>Secteur d'activité</label>
                          <select value={form.industry} onChange={e=>setForm(p=>({...p,industry:e.target.value}))}
                            style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 14px",width:"100%",background:"white",color:"#111827",cursor:"pointer"}}>
                            <option value="">Sélectionnez...</option>
                            {["Informatique & Technologie","Finance & Banque","Commerce & Vente","Marketing & Communication","Ressources Humaines","Ingénierie & Industrie","Santé & Médecine","Juridique & Compliance","Logistique & Supply Chain","Enseignement & Recherche","Hôtellerie & Tourisme","Autre"].map(o=><option key={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>Niveau d'expérience</label>
                          <select value={form.level} onChange={e=>setForm(p=>({...p,level:e.target.value}))}
                            style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 14px",width:"100%",background:"white",color:"#111827",cursor:"pointer"}}>
                            <option value="">Sélectionnez...</option>
                            {["Débutant (0–2 ans)","Intermédiaire (2–5 ans)","Confirmé (5–10 ans)","Manager / Chef d'équipe","Directeur / Responsable","Cadre dirigeant / C-Suite"].map(o=><option key={o}>{o}</option>)}
                          </select>
                        </div>
                        <div style={{gridColumn:"1 / -1"}}>
                          <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>Expériences professionnelles <span style={{color:"#6b7280",fontWeight:400}}>(résumé)</span></label>
                          <textarea value={form.experience} onChange={e=>setForm(p=>({...p,experience:e.target.value}))} rows={5}
                            placeholder={"Société A — Développeur (2021–2024) : App mobile 200K utilisateurs\nSociété B — Stagiaire (2020) : API REST, optimisation SQL"}
                            style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 14px",width:"100%",background:"white",color:"#111827",resize:"vertical",lineHeight:1.6}}/>
                        </div>
                        {[
                          {id:"education",label:"Formation",                ph:"Licence Informatique, ENSIAS Rabat, 2020"},
                          {id:"skills",   label:"Compétences & Technologies",ph:"React, Node.js, SQL, Python..."},
                          {id:"langs",    label:"Langues parlées",           ph:"Arabe (natif), Français (courant), Anglais (intermédiaire)"},
                        ].map(f=>(
                          <div key={f.id} style={{gridColumn:"1 / -1"}}>
                            <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>{f.label}</label>
                            <input type="text" value={form[f.id as keyof typeof form]} onChange={e=>setForm(p=>({...p,[f.id]:e.target.value}))}
                              placeholder={f.ph} style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 14px",width:"100%",background:"white",color:"#111827"}}/>
                          </div>
                        ))}
                        <div style={{gridColumn:"1 / -1"}}>
                          <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>Informations complémentaires <span style={{color:"#6b7280",fontWeight:400}}>(optionnel)</span></label>
                          <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={3}
                            placeholder="Certifications, bénévolat, projets personnels..."
                            style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 14px",width:"100%",background:"white",color:"#111827",resize:"vertical",lineHeight:1.6}}/>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                    <button onClick={()=>goStep(1)} style={{background:"#f3f4f6",color:"#111827",border:"1px solid #e5e7eb",padding:"11px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>← Retour</button>
                    <button onClick={()=>goStep(3)} style={{background:"#1a56db",color:"white",border:"none",padding:"14px 28px",borderRadius:8,fontSize:15,fontWeight:600,cursor:"pointer"}}>Continuer vers le paiement →</button>
                  </div>
                </div>
              )}

              {/* STEP 3: PRICING */}
              {step===3 && (
                <div>
                  <div style={{marginBottom:20}}>
                    <h2 style={{fontSize:20,fontWeight:700}}>Choisissez votre formule</h2>
                    <p style={{color:"#6b7280",fontSize:13,marginTop:4}}>Paiement sécurisé via Paddle · Visa, Mastercard, PayPal acceptés</p>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16,marginBottom:24}}>
                    {PLANS.map(plan=>{
                      const featured = plan.name==="Professionnel";
                      return (
                        <div key={plan.name} style={{background:featured?"#f8faff":"white",border:`2px solid ${featured?"#1a56db":"#e5e7eb"}`,borderRadius:10,padding:"28px 24px",position:"relative"}}>
                          {featured && (
                            <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#1a56db",color:"white",fontSize:11,fontWeight:700,padding:"4px 14px",borderRadius:100,whiteSpace:"nowrap"}}>
                              ⭐ Le plus populaire
                            </div>
                          )}
                          <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#6b7280",marginBottom:12}}>{plan.name}</div>
                          <div style={{fontSize:42,fontWeight:800,color:"#111827",lineHeight:1,marginBottom:4}}>
                            <sup style={{fontSize:20,fontWeight:700,verticalAlign:"super"}}>€</sup>
                            {plan.price.split(".")[0]}<span style={{fontSize:22}}>.{plan.price.split(".")[1]}</span>
                          </div>
                          <div style={{fontSize:12,color:"#6b7280",marginBottom:20}}>Paiement unique</div>
                          <div style={{height:1,background:"#e5e7eb",margin:"20px 0"}}/>
                          <ul className="pricing-feat" style={{marginBottom:24}}>
                            {PLAN_FEATURES[plan.name].map(f=><li key={f}>{f}</li>)}
                          </ul>
                          <button className="pay-btn" onClick={()=>openPaddleCheckout(plan)} disabled={!paddleReady||payPending}
                            style={{width:"100%",background:featured?"#1a56db":"transparent",color:featured?"white":"#1a56db",border:"1px solid #1a56db",padding:"12px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>
                            {!paddleReady?"Chargement...":payPending&&currentPlan.name===plan.name?"Ouverture…":`Payer ${plan.price} € →`}
                          </button>
                          <div style={{textAlign:"center",marginTop:10,fontSize:11,color:"#9ca3af"}}>🔒 Visa · Mastercard · PayPal</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{background:"white",border:"1px solid #e5e7eb",borderRadius:10,padding:"16px 20px",display:"flex",alignItems:"center",gap:12,marginBottom:24,fontSize:13,color:"#6b7280"}}>
                    <span style={{fontSize:20}}>🔒</span>
                    <span>Paiement 100% sécurisé via <strong style={{color:"#111827"}}>Paddle</strong> — gestion complète de la facturation et des taxes. Vos données bancaires ne transitent jamais par nos serveurs.</span>
                  </div>
                  <button onClick={()=>goStep(2)} style={{background:"#f3f4f6",color:"#111827",border:"1px solid #e5e7eb",padding:"11px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>← Retour</button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4 : RESULT (shared by both paths) ── */}
          {step===4 && (
            <div ref={resultRef}>
              {/* Mode badge */}
              <div style={{marginBottom:16}}>
                {genMode==="upload"
                  ? <span className="free-badge">✓ CV amélioré gratuitement</span>
                  : <span className="paid-badge">✦ CV généré par l'IA</span>}
              </div>
              <div style={{background:"white",border:"1px solid #e5e7eb",borderRadius:10,padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginBottom:20,boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
                <div>
                  <div style={{fontSize:18,fontWeight:800}}>🎉 Votre CV est prêt !</div>
                  <div style={{fontSize:13,color:"#6b7280"}}>Consultez, téléchargez ou régénérez votre CV ci-dessous.</div>
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button onClick={()=>{setCvHtml(null);genMode==="upload"?generateUploadCV():generateAICV();}}
                    style={{background:"#f3f4f6",color:"#111827",border:"1px solid #e5e7eb",padding:"11px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>↺ Régénérer</button>
                  <button onClick={downloadCV}
                    style={{background:"#057a55",color:"white",border:"none",padding:"11px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>⬇ Télécharger</button>
                </div>
              </div>
              <div id="cvPreview" style={{background:"white",border:"1px solid #e5e7eb",borderRadius:10,padding:"52px 60px",boxShadow:"0 4px 16px rgba(0,0,0,.08)",fontFamily:"Georgia,'Times New Roman',serif",color:"#1a1a1a",minHeight:400,lineHeight:1.65}}>
                {cvHtml===null
                  ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:300,gap:14,color:"#6b7280",fontSize:13}}>
                      <div className="spinner"/>Génération en cours…
                    </div>
                  : <div dangerouslySetInnerHTML={{__html:cvHtml}}/>}
              </div>

              {/* If upload path — upsell AI after */}
              {genMode==="upload" && (
                <div style={{background:"#0f1d36",borderRadius:10,padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,marginTop:20}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"white",marginBottom:4}}>✦ Vous voulez un CV créé de zéro par l'IA ?</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>25 modèles professionnels, rédaction complète par IA. À partir de 1,99 €.</div>
                  </div>
                  <button onClick={()=>{setTab2("ai");setStep(1);window.scrollTo({top:0,behavior:"smooth"});}}
                    style={{background:"#1a56db",color:"white",border:"none",padding:"10px 22px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                    Essayer le générateur IA →
                  </button>
                </div>
              )}
            </div>
          )}

        </div>{/* /main */}

        {/* ── FOOTER ── */}
        <footer style={{background:"#0f1d36",color:"rgba(255,255,255,0.45)",textAlign:"center",padding:24,fontSize:13,marginTop:60,width:"100%"}}>
          © 2026 Talent Maroc — Propulsé par n8n &amp; Supabase &nbsp;·&nbsp;
          <a href="#" style={{color:"rgba(255,255,255,0.55)",textDecoration:"none"}}>Politique de confidentialité</a> &nbsp;·&nbsp;
          <a href="#" style={{color:"rgba(255,255,255,0.55)",textDecoration:"none"}}>Remboursement</a> &nbsp;·&nbsp;
          <a href="#" style={{color:"rgba(255,255,255,0.55)",textDecoration:"none"}}>Contact</a>
        </footer>
      </div>

      {/* ── TEMPLATE PREVIEW MODAL ── */}
      {previewTpl !== null && (() => {
        const t = TEMPLATES.find(tpl => tpl.id === previewTpl)!;
        const isLight = t.light;
        const headColor = isLight ? "#0f172a" : "#ffffff";
        const subColor  = isLight ? "#374151" : "rgba(255,255,255,0.75)";
        const bodyColor = isLight ? "#4b5563" : "rgba(255,255,255,0.6)";
        const bs = BADGE_STYLES[t.badge];
        return (
          <div className="overlay-backdrop" onClick={()=>setPreviewTpl(null)} style={{alignItems:"flex-start",paddingTop:40,paddingBottom:40,overflowY:"auto"}}>
            <div className="modal-anim" onClick={e=>e.stopPropagation()}
              style={{background:"white",borderRadius:16,width:"100%",maxWidth:720,
                boxShadow:"0 32px 80px rgba(0,0,0,0.35)",overflow:"hidden",position:"relative"}}>

              {/* Modal header */}
              <div style={{background:"#0f1d36",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{background:bs.bg,color:bs.color,fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:100,letterSpacing:"0.04em"}}>
                    {{gratuit:"Gratuit",pro:"Pro",nouveau:"Nouveau"}[t.badge]}
                  </span>
                  <span style={{color:"white",fontWeight:700,fontSize:15}}>{t.name}</span>
                  <span style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>— {t.role}</span>
                </div>
                <button onClick={()=>setPreviewTpl(null)}
                  style={{background:"rgba(255,255,255,0.08)",border:"none",color:"rgba(255,255,255,0.7)",
                    fontSize:18,width:32,height:32,borderRadius:8,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center"}}>x</button>
              </div>

              {/* Full CV preview */}
              <div style={{background:t.bg,padding:"48px 52px",fontFamily:"Georgia,serif",minHeight:540}}>
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:26,fontWeight:800,color:headColor,letterSpacing:"-0.02em",lineHeight:1.1,marginBottom:4,fontFamily:"Inter,sans-serif"}}>
                    Youssef Benali
                  </div>
                  <div style={{fontSize:14,fontWeight:600,color:t.acc,marginBottom:6,fontFamily:"Inter,sans-serif"}}>
                    Développeur Full Stack Senior
                  </div>
                  <div style={{fontSize:12,color:subColor,display:"flex",gap:16,flexWrap:"wrap",fontFamily:"Inter,sans-serif"}}>
                    <span>youssef@email.ma</span><span>+212 6 00 00 00 00</span><span>Casablanca, Maroc</span>
                  </div>
                </div>
                <div style={{height:2,background:t.acc,opacity:0.7,marginBottom:20}}/>
                <div style={{marginBottom:18}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:t.acc,marginBottom:8,fontFamily:"Inter,sans-serif"}}>Profil Professionnel</div>
                  <div style={{fontSize:13,color:bodyColor,lineHeight:1.7}}>
                    Ingénieur Full Stack avec 5 ans d expérience dans le développement d applications web performantes.
                    Expert React et Node.js, passionné par l optimisation des systèmes et la qualité du code.
                  </div>
                </div>
                <div style={{marginBottom:18}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:t.acc,marginBottom:10,fontFamily:"Inter,sans-serif"}}>Expériences Professionnelles</div>
                  {[
                    {title:"Lead Developer",company:"Capgemini Maroc",period:"2021 – Présent",desc:"Pilotage d une équipe de 6 développeurs. Architecture microservices, CI/CD, React, Node.js."},
                    {title:"Développeur Full Stack",company:"OCP Digital",period:"2019 – 2021",desc:"Développement de portails internes. PostgreSQL, GraphQL, TypeScript."},
                  ].map(exp=>(
                    <div key={exp.title} style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:2}}>
                        <div style={{fontSize:13,fontWeight:700,color:headColor,fontFamily:"Inter,sans-serif"}}>{exp.title} — <span style={{color:t.acc}}>{exp.company}</span></div>
                        <div style={{fontSize:11,color:subColor,flexShrink:0,marginLeft:8,fontFamily:"Inter,sans-serif"}}>{exp.period}</div>
                      </div>
                      <div style={{fontSize:12,color:bodyColor,lineHeight:1.6}}>{exp.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:t.acc,marginBottom:8,fontFamily:"Inter,sans-serif"}}>Compétences</div>
                    {["React · Next.js · TypeScript","Node.js · Python · SQL","AWS · Docker · CI/CD","Agile · Scrum · Git"].map(sk=>(
                      <div key={sk} style={{fontSize:12,color:bodyColor,marginBottom:5,display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:5,height:5,borderRadius:"50%",background:t.acc,flexShrink:0}}/>{sk}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:t.acc,marginBottom:8,fontFamily:"Inter,sans-serif"}}>Formation</div>
                    <div style={{fontSize:12,fontWeight:600,color:headColor,marginBottom:2,fontFamily:"Inter,sans-serif"}}>Master Génie Informatique</div>
                    <div style={{fontSize:11,color:subColor,fontFamily:"Inter,sans-serif"}}>ENSA Rabat · 2019</div>
                    <div style={{marginTop:10,fontSize:12,fontWeight:600,color:headColor,marginBottom:3,fontFamily:"Inter,sans-serif"}}>Langues</div>
                    <div style={{fontSize:11,color:bodyColor,lineHeight:1.7,fontFamily:"Inter,sans-serif"}}>Arabe (natif) · Français · Anglais</div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{background:"white",borderTop:"1px solid #e5e7eb",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div style={{fontSize:13,color:"#6b7280"}}>
                  {selectedTpl===t.id
                    ? <span style={{color:"#057a55",fontWeight:600}}>checkmark Modèle sélectionné</span>
                    : "Aperçu avec données fictives"}
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setPreviewTpl(null)}
                    style={{background:"#f3f4f6",color:"#374151",border:"1px solid #e5e7eb",padding:"9px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>
                    Fermer
                  </button>
                  <button onClick={()=>{setSelectedTpl(t.id);setPreviewTpl(null);}}
                    style={{background:selectedTpl===t.id?"#057a55":"#1a56db",color:"white",border:"none",
                      padding:"9px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>
                    {selectedTpl===t.id ? "Selectionne" : "Choisir ce modele"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── GENERATING MODAL ── */}
      {showGenModal && (
        <div className="overlay-backdrop">
          <div className="modal-anim" style={{background:"white",borderRadius:14,maxWidth:420,width:"100%",padding:"40px 32px",textAlign:"center",boxShadow:"0 24px 80px rgba(0,0,0,0.2)"}}>
            <div className="spinner" style={{margin:"0 auto 20px"}}/>
            <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>
              {genMode==="upload"?"Amélioration de votre CV en cours…":"Création de votre CV en cours…"}
            </div>
            <div style={{fontSize:13,color:"#6b7280",marginBottom:24}}>Notre IA optimise chaque section pour vous.</div>
            <div style={{maxWidth:280,margin:"0 auto",textAlign:"left",display:"flex",flexDirection:"column",gap:10}}>
              {GEN_STEP_LABELS.map((label,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,fontWeight:genSteps[i]==="active"?600:400,
                  color:genSteps[i]==="done"?"#057a55":genSteps[i]==="active"?"#1a56db":"#d1d5db"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,
                    backgroundColor:genSteps[i]==="done"?"#057a55":genSteps[i]==="active"?"#1a56db":"#d1d5db"}}/>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}