"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { EMPTY_CV, DEFAULT_SECTION_ORDER, DEFAULT_SECTIONS_ENABLED } from "./_lib/schema";
import type { CVData } from "./_lib/schema";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ─── Template catalogue ───────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id:    "corso",
    name:  "Corso",
    desc:  "Sidebar colorée à gauche. Idéal pour la tech, le marketing et le créatif.",
    badge: "Populaire" as const,
    color: "#7c3aed",
    layout: "sidebar-left" as const,
  },
  {
    id:    "meridian",
    name:  "Meridian",
    desc:  "Classique et élégant, typographie sérif. Finance, juridique, conseil.",
    badge: null,
    color: "#1e3a5f",
    layout: "centered" as const,
  },
  {
    id:    "aria",
    name:  "Aria",
    desc:  "Ultra-épuré avec colonne de labels. Design, consulting, minimaliste.",
    badge: null,
    color: "#0ea5e9",
    layout: "label-col" as const,
  },
  {
    id:    "dahab",
    name:  "Dahab",
    desc:  "En-tête dégradé sombre, prestige exécutif. Cadres et direction générale.",
    badge: "Exécutif" as const,
    color: "#6d28d9",
    layout: "dark-header" as const,
  },
  {
    id:    "medina",
    name:  "Medina",
    desc:  "Typographie créative, fond chaleureux. Communication, RH, événementiel.",
    badge: null,
    color: "#f97316",
    layout: "creative" as const,
  },
  {
    id:    "vertex",
    name:  "Vertex",
    desc:  "Rail vertical accent, numérotation des sections, typographie éditoriale.",
    badge: "Nouveau" as const,
    color: "#0f172a",
    layout: "single-rail" as const,
  },
  {
    id:    "atlas",
    name:  "Atlas",
    desc:  "Sidebar sombre avec photo, colonne principale claire. Tous secteurs.",
    badge: "Nouveau" as const,
    color: "#1e293b",
    layout: "sidebar-dark" as const,
  },
  {
    id:    "lumen",
    name:  "Lumen",
    desc:  "Bandeau coloré en haut, corps deux colonnes. Moderne et lisible.",
    badge: "Nouveau" as const,
    color: "#0891b2",
    layout: "banner-two-col" as const,
  },
  {
    id:    "helix",
    name:  "Helix",
    desc:  "Timeline verticale pointillée, pills de dates. Impact visuel fort.",
    badge: "Nouveau" as const,
    color: "#7c3aed",
    layout: "timeline" as const,
  },
  {
    id:    "slate",
    name:  "Slate",
    desc:  "Grille Swiss ultra-propre, métadonnées monospace. Minimaliste absolu.",
    badge: "Nouveau" as const,
    color: "#374151",
    layout: "monospace" as const,
  },
];

type Layout = "sidebar-left" | "centered" | "label-col" | "dark-header" | "creative" | "single-rail" | "sidebar-dark" | "banner-two-col" | "timeline" | "monospace";

// ─── Mini template preview ────────────────────────────────────────────────────

function TemplateMini({ layout, color, active }: { layout: Layout; color: string; active: boolean }) {
  const bg    = active ? `${color}18` : "#f8fafc";
  const lines = (n: number, w: string, h = 3, mb = 3, bg2 = "#e2e8f0") =>
    Array.from({ length: n }, (_, i) => (
      <div key={i} style={{ height: h, borderRadius: 2, background: bg2, width: w, marginBottom: mb }} />
    ));

  if (layout === "sidebar-left") return (
    <div style={{ display: "flex", height: 90, borderRadius: 6, overflow: "hidden", background: bg, border: `1.5px solid ${active ? color : "#e5e7eb"}` }}>
      <div style={{ width: "34%", background: color, padding: "8px 5px" }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,.3)", margin: "0 auto 6px" }} />
        {lines(3, "80%", 2, 3, "rgba(255,255,255,.3)")}
        <div style={{ height: 1, background: "rgba(255,255,255,.2)", margin: "5px 0 4px" }} />
        {lines(2, "90%", 2, 2, "rgba(255,255,255,.25)")}
      </div>
      <div style={{ flex: 1, padding: "8px 7px" }}>
        <div style={{ height: 5, borderRadius: 2, background: color, width: "60%", marginBottom: 4 }} />
        <div style={{ height: 3, borderRadius: 2, background: "#cbd5e1", width: "40%", marginBottom: 8 }} />
        {lines(2, "90%")}
        <div style={{ height: 1, background: "#e2e8f0", margin: "6px 0 4px" }} />
        {lines(3, "85%")}
      </div>
    </div>
  );

  if (layout === "centered") return (
    <div style={{ height: 90, borderRadius: 6, padding: "8px 10px", background: bg, border: `1.5px solid ${active ? color : "#e5e7eb"}` }}>
      <div style={{ textAlign: "center", borderBottom: `1.5px solid ${color}`, paddingBottom: 5, marginBottom: 5 }}>
        <div style={{ height: 5, borderRadius: 2, background: color, width: "45%", margin: "0 auto 3px" }} />
        <div style={{ height: 3, borderRadius: 2, background: "#cbd5e1", width: "30%", margin: "0 auto" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>
        {lines(3, "18%", 2, 0, "#e2e8f0")}
      </div>
      {lines(3, "95%")}
      <div style={{ height: 1, background: "#e2e8f0", margin: "5px 0 4px" }} />
      {lines(2, "90%")}
    </div>
  );

  if (layout === "label-col") return (
    <div style={{ height: 90, borderRadius: 6, padding: "8px 10px", background: bg, border: `1.5px solid ${active ? color : "#e5e7eb"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8, borderBottom: `1px solid ${color}44`, paddingBottom: 5 }}>
        <div>
          <div style={{ height: 5, borderRadius: 2, background: color, width: 60, marginBottom: 3 }} />
          <div style={{ height: 3, borderRadius: 2, background: "#cbd5e1", width: 45 }} />
        </div>
        <div style={{ textAlign: "right" }}>{lines(2, "50px", 2, 2)}</div>
      </div>
      {[80, 70, 75].map((w, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 5, marginBottom: 3 }}>
          <div style={{ height: 2, borderRadius: 1, background: "#cbd5e1", alignSelf: "center" }} />
          <div style={{ height: 2, borderRadius: 1, background: "#e2e8f0", width: `${w}%` }} />
        </div>
      ))}
    </div>
  );

  if (layout === "dark-header") return (
    <div style={{ height: 90, borderRadius: 6, overflow: "hidden", background: bg, border: `1.5px solid ${active ? color : "#e5e7eb"}` }}>
      <div style={{ background: `linear-gradient(135deg, ${color}, #3b1fa3)`, padding: "7px 8px", display: "flex", gap: 6, alignItems: "center" }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, background: "rgba(255,255,255,.2)", flexShrink: 0 }} />
        <div>
          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,.7)", width: 40, marginBottom: 3 }} />
          <div style={{ height: 2, borderRadius: 1, background: "rgba(255,255,255,.4)", width: 30 }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "60% 40%", padding: "5px 0" }}>
        <div style={{ padding: "0 6px" }}>{lines(4, "90%", 2, 3)}</div>
        <div style={{ padding: "0 6px", borderLeft: "1px solid #e5e7eb" }}>{lines(3, "85%", 2, 3)}</div>
      </div>
    </div>
  );

  // single-rail (Vertex)
  if (layout === "single-rail") return (
    <div style={{ height: 90, borderRadius: 6, overflow: "hidden", background: bg, border: `1.5px solid ${active ? color : "#e5e7eb"}`, display: "flex" }}>
      <div style={{ width: 4, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "8px 10px" }}>
        <div style={{ height: 7, borderRadius: 2, background: color, width: "55%", marginBottom: 6 }} />
        <div style={{ height: 3, borderRadius: 1, background: "#cbd5e1", width: "35%", marginBottom: 10 }} />
        {[0,1,2].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: 2, background: `${color}22`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 6, height: 1.5, background: color }} />
            </div>
            <div style={{ height: 2, borderRadius: 1, background: "#e2e8f0", flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  );

  // sidebar-dark (Atlas)
  if (layout === "sidebar-dark") return (
    <div style={{ display: "flex", height: 90, borderRadius: 6, overflow: "hidden", border: `1.5px solid ${active ? color : "#e5e7eb"}` }}>
      <div style={{ width: "36%", background: color === "#1e293b" ? "#1e293b" : color, padding: "8px 6px" }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,.2)", margin: "0 auto 5px" }} />
        {lines(3, "80%", 2, 3, "rgba(255,255,255,.25)")}
        <div style={{ height: 1, background: "rgba(255,255,255,.15)", margin: "4px 0" }} />
        {lines(2, "70%", 2, 2, "rgba(255,255,255,.2)")}
      </div>
      <div style={{ flex: 1, padding: "8px 7px", background: "#fff" }}>
        <div style={{ height: 5, borderRadius: 2, background: "#0f172a", width: "60%", marginBottom: 3 }} />
        <div style={{ height: 2, borderRadius: 1, background: "#cbd5e1", width: "40%", marginBottom: 8 }} />
        {lines(4, "90%")}
      </div>
    </div>
  );

  // banner-two-col (Lumen)
  if (layout === "banner-two-col") return (
    <div style={{ height: 90, borderRadius: 6, overflow: "hidden", background: bg, border: `1.5px solid ${active ? color : "#e5e7eb"}` }}>
      <div style={{ background: `${color}22`, padding: "7px 10px", borderBottom: `2px solid ${color}` }}>
        <div style={{ height: 5, borderRadius: 2, background: color, width: "45%", marginBottom: 3 }} />
        <div style={{ height: 2, borderRadius: 1, background: "#94a3b8", width: "30%" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "60% 40%", padding: "6px 0" }}>
        <div style={{ padding: "0 8px" }}>{lines(3, "90%", 2, 3)}</div>
        <div style={{ padding: "0 8px", borderInlineStart: "1px solid #e5e7eb" }}>{lines(3, "85%", 2, 3)}</div>
      </div>
    </div>
  );

  // timeline (Helix)
  if (layout === "timeline") return (
    <div style={{ height: 90, borderRadius: 6, padding: "8px 10px", background: bg, border: `1.5px solid ${active ? color : "#e5e7eb"}` }}>
      <div style={{ height: 5, borderRadius: 2, background: color, width: "50%", marginBottom: 8 }} />
      {[0,1,2].map((i) => (
        <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5, alignItems: "flex-start" }}>
          <div style={{ position: "relative", flexShrink: 0, width: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, marginTop: 2 }} />
            {i < 2 && <div style={{ width: 1.5, height: 10, background: `repeating-linear-gradient(to bottom, ${color} 0 3px, transparent 3px 6px)`, position: "absolute", left: 3, top: 10 }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 2.5, borderRadius: 1, background: "#1e293b", width: "70%", marginBottom: 2 }} />
            <div style={{ height: 2, borderRadius: 1, background: "#e2e8f0", width: "50%" }} />
          </div>
          <div style={{ height: 12, width: 22, borderRadius: 3, background: `${color}22`, border: `1px solid ${color}44`, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );

  // monospace (Slate)
  if (layout === "monospace") return (
    <div style={{ height: 90, borderRadius: 6, padding: "8px 10px", background: bg, border: `1.5px solid ${active ? color : "#e5e7eb"}` }}>
      <div style={{ borderBottom: `2px solid ${color}`, paddingBottom: 6, marginBottom: 4 }}>
        <div style={{ height: 5, borderRadius: 2, background: "#0f172a", width: "50%", marginBottom: 3 }} />
        <div style={{ height: 2, borderRadius: 1, background: "#94a3b8", width: "35%" }} />
      </div>
      {[0,1,2].map((i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 8, padding: "3px 0", borderTop: i === 0 ? "none" : "1px solid #f1f5f9" }}>
          <div style={{ height: 2, borderRadius: 1, background: `${color}88`, alignSelf: "center" }} />
          <div style={{ height: 2, borderRadius: 1, background: "#e2e8f0", width: `${70 + i * 8}%` }} />
        </div>
      ))}
    </div>
  );

  // creative (Medina)
  return (
    <div style={{ height: 90, borderRadius: 6, padding: "8px 10px", background: "#fffaf5", border: `1.5px solid ${active ? color : "#e5e7eb"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <div>
          <div style={{ height: 6, borderRadius: 2, background: "#1c1917", width: 50, marginBottom: 2 }} />
          <div style={{ height: 6, borderRadius: 2, background: color, width: 40 }} />
        </div>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: `linear-gradient(135deg, ${color}, ${color}aa)` }} />
      </div>
      <div style={{ height: 1, borderTop: `1.5px dashed ${color}66`, marginBottom: 5 }} />
      {lines(3, "90%")}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CVRow {
  id:         string;
  name:       string;
  template:   string;
  updated_at: string;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CVListPage() {
  const router = useRouter();
  const [cvs,         setCvs]        = useState<CVRow[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [userId,      setUserId]     = useState<string | null>(null);
  const [showModal,   setShowModal]  = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      supabase
        .from("cvs")
        .select("id, name, template, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error) setCvs(data ?? []);
          setLoading(false);
        });
    });
  }, []);

  const createCV = useCallback(async (template: string, cvData?: CVData): Promise<void> => {
    setCreateError(null);

    let uid = userId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCreateError("Vous devez être connecté pour créer un CV.");
        return;
      }
      setUserId(user.id);
      uid = user.id;
    }

    const { data, error } = await supabase
      .from("cvs")
      .insert({
        user_id:          uid,
        name:             cvData?.profile?.firstName
          ? `CV de ${cvData.profile.firstName} ${cvData.profile.lastName ?? ""}`.trim()
          : "Mon CV",
        data:             cvData ?? EMPTY_CV,
        template,
        accent:           "#7c3aed",
        lang:             "fr",
        section_order:    DEFAULT_SECTION_ORDER,
        sections_enabled: DEFAULT_SECTIONS_ENABLED,
      })
      .select("id")
      .single();

    if (data && !error) {
      router.push(`/cv/${data.id}`);
    } else {
      setCreateError(error?.message ?? "Impossible de créer le CV. Vérifiez que la table cvs existe dans Supabase.");
    }
  }, [userId, router]);

  if (loading) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#fafbfc" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#7c3aed", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Topbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg, #7c3aed 0%, #7c3aed 50%, #f97316 50%, #f97316 100%)" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            Talent <span style={{ color: "#f97316" }}>Maroc</span>
          </span>
          <span style={{ color: "#cbd5e1", margin: "0 6px", fontWeight: 300, fontSize: 18 }}>/</span>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Mes CVs</span>
        </div>
        <Link href="/dashboard" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>← Tableau de bord</Link>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>

        {createError && (
          <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⚠ {createError}</span>
            <button type="button" onClick={() => setCreateError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", fontSize: 18 }}>×</button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Mes CVs</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "5px 0 0" }}>
              {cvs.length === 0 ? "Créez votre premier CV professionnel" : `${cvs.length} CV${cvs.length > 1 ? "s" : ""} enregistré${cvs.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button type="button" onClick={() => setShowModal(true)} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            + Nouveau CV
          </button>
        </div>

        {cvs.length === 0 && (
          <div style={{ textAlign: "center", padding: "72px 24px", border: "2px dashed #e2e8f0", borderRadius: 16, background: "#fff" }}>
            <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>📄</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>Aucun CV pour l'instant</h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>Créez un CV professionnel en quelques minutes avec nos 5 modèles.</p>
            <button type="button" onClick={() => setShowModal(true)} style={{ padding: "10px 26px", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Créer mon premier CV
            </button>
          </div>
        )}

        {cvs.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {cvs.map((cv) => <CVCard key={cv.id} cv={cv} />)}
          </div>
        )}
      </div>

      {showModal && (
        <NewCVModal
          onClose={() => setShowModal(false)}
          onCreate={async (template, cvData) => {
            await createCV(template, cvData);
            setShowModal(false);
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── New CV modal ─────────────────────────────────────────────────────────────

type ModalStep = "choose" | "template" | "importing";

function NewCVModal({ onClose, onCreate }: {
  onClose:  () => void;
  onCreate: (template: string, cvData?: CVData) => Promise<void>;
}) {
  const [step,     setStep]     = useState<ModalStep>("choose");
  const [selected, setSelected] = useState("corso");
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    setBusy(true);
    await onCreate(selected);
    setBusy(false);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res  = await fetch("/api/cv/import", { method: "POST", body });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `Erreur ${res.status}`);
      }
      const { cv } = await res.json() as { cv: CVData };
      await onCreate(selected, cv);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 16, width: 640, maxWidth: "calc(100vw - 32px)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {step === "choose"   && "Nouveau CV"}
            {step === "template" && "Choisissez un modèle"}
            {step === "importing" && "Importer un CV existant"}
          </h2>
          <button type="button" onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "#f1f5f9", color: "#64748b", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* ── Step: choose mode ── */}
        {step === "choose" && (
          <div style={{ padding: "20px 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <ModeCard
              icon="✦"
              title="Créer un nouveau CV"
              desc="Partez d'un modèle vierge et remplissez vos informations."
              onClick={() => setStep("template")}
            />
            <ModeCard
              icon="↑"
              title="Importer un CV existant"
              desc="Uploadez votre CV (PDF ou DOCX) — l'IA extrait et structure vos données."
              onClick={() => setStep("importing")}
            />
          </div>
        )}

        {/* ── Step: template picker ── */}
        {(step === "template" || step === "importing") && (
          <div style={{ padding: "16px 24px 0" }}>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px" }}>
              {step === "importing" ? "Quel modèle utiliser pour afficher votre CV ?" : "Choisissez le style de votre CV :"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t.id)}
                  style={{
                    background:   selected === t.id ? `${t.color}0d` : "#fff",
                    border:       `2px solid ${selected === t.id ? t.color : "#e5e7eb"}`,
                    borderRadius: 10,
                    padding:      10,
                    cursor:       "pointer",
                    textAlign:    "left",
                    transition:   "border-color .15s",
                  }}
                >
                  <TemplateMini layout={t.layout} color={t.color} active={selected === t.id} />
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{t.name}</span>
                    {t.badge && (
                      <span style={{ fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 100, background: `${t.color}18`, color: t.color }}>
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 10.5, color: "#64748b", margin: "3px 0 0", lineHeight: 1.4 }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: import file upload ── */}
        {step === "importing" && (
          <div style={{ padding: "16px 24px" }}>
            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 12, marginBottom: 12 }}>
                ⚠ {error}
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={handleImportFile} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              style={{
                width:        "100%",
                padding:      "14px",
                borderRadius: 10,
                border:       "2px dashed #c4b5fd",
                background:   busy ? "#f5f3ff" : "#faf9ff",
                color:        "#7c3aed",
                fontSize:     13,
                fontWeight:   600,
                cursor:       busy ? "wait" : "pointer",
                fontFamily:   "inherit",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                gap:          8,
              }}
            >
              {busy
                ? <><span style={{ animation: "spin .65s linear infinite", display: "inline-block" }}>⟳</span> Analyse en cours…</>
                : <>↑ Sélectionner un fichier PDF ou DOCX</>
              }
            </button>
            <p style={{ fontSize: 11.5, color: "#94a3b8", textAlign: "center", margin: "8px 0 0" }}>
              L'IA extrait automatiquement vos informations et les structure dans le modèle choisi.
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "16px 24px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={step === "choose" ? onClose : () => setStep("choose")}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            {step === "choose" ? "Annuler" : "← Retour"}
          </button>

          {step === "template" && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy}
              style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: busy ? "#a78bfa" : "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 600, cursor: busy ? "wait" : "pointer", fontFamily: "inherit" }}
            >
              {busy ? "Création…" : "Créer avec ce modèle →"}
            </button>
          )}

          {step === "importing" && (
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Sélectionnez un fichier pour continuer</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeCard({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:      20,
        borderRadius: 12,
        border:       `2px solid ${hov ? "#7c3aed" : "#e5e7eb"}`,
        background:   hov ? "#faf9ff" : "#fff",
        cursor:       "pointer",
        textAlign:    "left",
        transition:   "border-color .15s, background .15s",
        fontFamily:   "inherit",
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.5 }}>{desc}</div>
    </button>
  );
}

// ─── CV card ──────────────────────────────────────────────────────────────────

function CVCard({ cv }: { cv: CVRow }) {
  const [hov, setHov] = useState(false);
  const tpl  = TEMPLATES.find((t) => t.id === cv.template) ?? TEMPLATES[0];
  const date = new Date(cv.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  return (
    <Link href={`/cv/${cv.id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ background: "#fff", border: `1px solid ${hov ? "#c4b5fd" : "#e5e7eb"}`, borderRadius: 12, padding: 16, cursor: "pointer", transition: "border-color .15s, box-shadow .15s", boxShadow: hov ? "0 4px 16px rgba(124,58,237,.10)" : "none" }}
      >
        <TemplateMini layout={tpl.layout} color={tpl.color} active={false} />
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", margin: "12px 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cv.name || "Mon CV"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#94a3b8" }}>
          <span>{tpl.name}</span>
          <span>{date}</span>
        </div>
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: hov ? "#7c3aed" : "#94a3b8", transition: "color .15s" }}>
            Ouvrir l'éditeur →
          </span>
        </div>
      </div>
    </Link>
  );
}
