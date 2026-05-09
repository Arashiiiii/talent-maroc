"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { EMPTY_CV, DEFAULT_SECTION_ORDER, DEFAULT_SECTIONS_ENABLED } from "./_lib/schema";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const TEMPLATE_LABELS: Record<string, string> = {
  corso:    "Corso",
  meridian: "Meridian",
  aria:     "Aria",
  dahab:    "Dahab",
  medina:   "Medina",
};

interface CVRow {
  id:         string;
  name:       string;
  template:   string;
  updated_at: string;
}

export default function CVListPage() {
  const router = useRouter();
  const [cvs,      setCvs]      = useState<CVRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [userId,   setUserId]   = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/dashboard"); return; }
      setUserId(user.id);
      supabase
        .from("cvs")
        .select("id, name, template, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .then(({ data }) => { setCvs(data ?? []); setLoading(false); });
    });
  }, [router]);

  const createCV = useCallback(async () => {
    if (!userId || creating) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("cvs")
      .insert({
        user_id:          userId,
        name:             "Mon CV",
        data:             EMPTY_CV,
        template:         "corso",
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
      setCreating(false);
    }
  }, [userId, creating, router]);

  // ── Loading spinner ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#fafbfc" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: "3px solid #e5e7eb", borderTopColor: "#7c3aed",
        animation: "spin .7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Page ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Topbar */}
      <div style={{
        background:   "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding:      "0 28px",
        height:       56,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "space-between",
        flexShrink:   0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width:        26, height:    26,
            borderRadius: 6,
            background:   "linear-gradient(135deg, #7c3aed 0%, #7c3aed 50%, #f97316 50%, #f97316 100%)",
          }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            Talent <span style={{ color: "#f97316" }}>Maroc</span>
          </span>
          <span style={{ color: "#cbd5e1", margin: "0 6px", fontWeight: 300, fontSize: 18 }}>/</span>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Mes CVs</span>
        </div>

        <Link href="/dashboard" style={{ fontSize: 12, color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          ← Tableau de bord
        </Link>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Mes CVs</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "5px 0 0" }}>
              {cvs.length === 0
                ? "Créez votre premier CV professionnel"
                : `${cvs.length} CV${cvs.length > 1 ? "s" : ""} enregistré${cvs.length > 1 ? "s" : ""}`}
            </p>
          </div>

          <button
            type="button"
            onClick={createCV}
            disabled={creating}
            style={{
              padding:      "9px 20px",
              borderRadius: 8,
              border:       "none",
              background:   creating ? "#a78bfa" : "#7c3aed",
              color:        "#fff",
              fontSize:     13,
              fontWeight:   600,
              cursor:       creating ? "wait" : "pointer",
              fontFamily:   "inherit",
              transition:   "background .15s",
            }}
          >
            {creating ? "Création…" : "+ Nouveau CV"}
          </button>
        </div>

        {/* Empty state */}
        {cvs.length === 0 && (
          <div style={{
            textAlign:    "center",
            padding:      "72px 24px",
            border:       "2px dashed #e2e8f0",
            borderRadius: 16,
            background:   "#fff",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>📄</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              Aucun CV pour l'instant
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>
              Créez un CV professionnel en quelques minutes avec nos 5 modèles.
            </p>
            <button
              type="button"
              onClick={createCV}
              disabled={creating}
              style={{
                padding:      "10px 26px",
                borderRadius: 8,
                border:       "none",
                background:   "#7c3aed",
                color:        "#fff",
                fontSize:     14,
                fontWeight:   600,
                cursor:       creating ? "wait" : "pointer",
                fontFamily:   "inherit",
              }}
            >
              {creating ? "Création…" : "Créer mon premier CV"}
            </button>
          </div>
        )}

        {/* CV grid */}
        {cvs.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {cvs.map((cv) => (
              <CVCard key={cv.id} cv={cv} />
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── CV card ────────────────────────────────────────────────────────────────

function CVCard({ cv }: { cv: CVRow }) {
  const [hovered, setHovered] = useState(false);
  const date = new Date(cv.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  return (
    <Link href={`/cv/${cv.id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:   "#fff",
          border:       `1px solid ${hovered ? "#c4b5fd" : "#e5e7eb"}`,
          borderRadius: 12,
          padding:      18,
          cursor:       "pointer",
          transition:   "border-color .15s, box-shadow .15s",
          boxShadow:    hovered ? "0 4px 16px rgba(124,58,237,.10)" : "none",
        }}
      >
        {/* Thumbnail placeholder */}
        <div style={{
          width:        "100%",
          height:       110,
          background:   "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
          borderRadius: 8,
          marginBottom: 14,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          fontSize:     36,
          color:        "#7c3aed",
          fontWeight:   700,
        }}>
          {(cv.name?.[0] ?? "C").toUpperCase()}
        </div>

        {/* Name */}
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cv.name || "Mon CV"}
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#94a3b8" }}>
          <span>{TEMPLATE_LABELS[cv.template] ?? cv.template}</span>
          <span>{date}</span>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: hovered ? "#7c3aed" : "#94a3b8", transition: "color .15s" }}>
            Ouvrir l'éditeur →
          </span>
        </div>
      </div>
    </Link>
  );
}
