"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

function getSB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── TYPES ──────────────────────────────────────────────────────────────────
type AppStatus = "saved" | "applied" | "interview" | "offer" | "rejected";
type Tab = "overview" | "applications" | "cvs" | "outils" | "profile";

interface Application {
  id: string; job_id: string | null; job_title: string; company: string;
  city: string | null; original_url: string | null; logo_url: string | null;
  status: AppStatus; applied_at: string | null; notes: string | null;
  cv_version: string | null; created_at: string;
}

interface SavedCV {
  id: string; name: string; type: "generated" | "imported" | "uploaded";
  template: string; created_at: string; url?: string;
}

const STATUS: Record<AppStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
  saved:     { label: "Sauvegardée",  color: "#374151", bg: "#f9fafb",  border: "#e5e7eb",  icon: "⭐" },
  applied:   { label: "Postulée",     color: "#1d4ed8", bg: "#eff6ff",  border: "#bfdbfe",  icon: "📤" },
  interview: { label: "Entretien",    color: "#92400e", bg: "#fffbeb",  border: "#fde68a",  icon: "🗓" },
  offer:     { label: "Offre reçue",  color: "#065f46", bg: "#f0fdf4",  border: "#bbf7d0",  icon: "🎉" },
  rejected:  { label: "Refusée",      color: "#991b1b", bg: "#fef2f2",  border: "#fecaca",  icon: "✗"  },
};

// ── OUTSIDE COMPONENT (no remount) ─────────────────────────────────────────
function Badge({ status }: { status: AppStatus }) {
  const s = STATUS[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      {s.icon} {s.label}
    </span>
  );
}

function Logo({ name, url }: { name: string; url?: string | null }) {
  if (url) return (
    <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f8fafc", border: "1.5px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
      <img src={url} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} onError={e => { e.currentTarget.parentElement!.innerHTML = `<div style="width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#7c3aed">${name.charAt(0)}</div>`; }} />
    </div>
  );
  return (
    <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f5f3ff", border: "1.5px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#7c3aed", flexShrink: 0 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [user,       setUser]       = useState<any>(null);
  const [apps,       setApps]       = useState<Application[]>([]);
  const [cvs,        setCvs]        = useState<SavedCV[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<Tab>("overview");
  const [search,     setSearch]     = useState("");
  const [sf,         setSf]         = useState<AppStatus | "all">("all");
  const [editApp,    setEditApp]    = useState<Application | null>(null);
  const [editNotes,  setEditNotes]  = useState("");
  const [editStatus, setEditStatus] = useState<AppStatus>("applied");
  const [saving,     setSaving]     = useState(false);
  const [pName,      setPName]      = useState("");
  const [pSaving,    setPSaving]    = useState(false);
  const [pMsg,       setPMsg]       = useState<string | null>(null);
  // AI tools state — cover letter
  const [clJobTitle,   setClJobTitle]   = useState("");
  const [clCompany,    setClCompany]    = useState("");
  const [clDesc,       setClDesc]       = useState("");
  const [clLoading,    setClLoading]    = useState(false);
  const [clResult,     setClResult]     = useState<string|null>(null);
  const [clErr,        setClErr]        = useState<string|null>(null);
  // AI tools state — LinkedIn bio
  const [liLoading,    setLiLoading]    = useState(false);
  const [liResult,     setLiResult]     = useState<string|null>(null);
  const [liErr,        setLiErr]        = useState<string|null>(null);

  // CV upload state
  const [cvUploading,  setCvUploading]  = useState(false);
  const [cvUploadErr,  setCvUploadErr]  = useState<string | null>(null);
  const [cvUploadMsg,  setCvUploadMsg]  = useState<string | null>(null);
  const [storedCvUrl,  setStoredCvUrl]  = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sb = getSB();

    // Auth state listener — handles global logout across tabs
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        window.location.href = "/auth/login?redirect=/dashboard";
      }
    });

    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/auth/login?redirect=/dashboard"; return; }
      // Role guard: employers use their own dashboard
      if (user.user_metadata?.role === "employer") {
        window.location.href = "/employeur/dashboard"; return;
      }
      setUser(user);
      setPName(user.user_metadata?.name || "");
      setStoredCvUrl(user.user_metadata?.cv_url || null);
      loadApps(user.id);
      loadCVs(user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadApps = useCallback(async (uid: string) => {
    const { data } = await getSB().from("applications").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    setApps(data || []);
    setLoading(false);
  }, []);

  const loadCVs = useCallback((uid: string) => {
    try {
      const raw = localStorage.getItem(`tm_cvs_${uid}`);
      if (raw) setCvs(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // ── CV UPLOAD ──────────────────────────────────────────────────────────
  const handleCVUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setCvUploadErr("Seuls les fichiers PDF sont acceptés."); return; }
    if (file.size > 10 * 1024 * 1024) { setCvUploadErr("Fichier trop volumineux (max 10 Mo)."); return; }

    setCvUploading(true); setCvUploadErr(null); setCvUploadMsg(null);
    const sb = getSB();
    const path = `${user.id}/cv_${Date.now()}.pdf`;

    const { error: upErr } = await sb.storage.from("cvs").upload(path, file, { upsert: true, contentType: "application/pdf" });
    if (upErr) { setCvUploadErr(upErr.message); setCvUploading(false); return; }

    const { data: { publicUrl } } = sb.storage.from("cvs").getPublicUrl(path);

    // Save URL to user metadata
    const { error: metaErr } = await sb.auth.updateUser({ data: { cv_url: publicUrl, cv_filename: file.name } });
    if (metaErr) { setCvUploadErr(metaErr.message); setCvUploading(false); return; }

    setStoredCvUrl(publicUrl);

    // Also save to localStorage CVs list
    const newCV: SavedCV = {
      id: path,
      name: file.name.replace(/\.pdf$/i, ""),
      type: "uploaded",
      template: "PDF importé",
      created_at: new Date().toISOString(),
      url: publicUrl,
    };
    const next = [newCV, ...cvs.filter(c => c.type !== "uploaded")];
    setCvs(next);
    localStorage.setItem(`tm_cvs_${user.id}`, JSON.stringify(next));

    setCvUploadMsg("CV importé avec succès ✓");
    setCvUploading(false);
    setTimeout(() => setCvUploadMsg(null), 4000);
  };

  // ── STATS ──────────────────────────────────────────────────────────────
  const total      = apps.length;
  const active     = apps.filter(a => ["applied", "interview"].includes(a.status)).length;
  const interviews = apps.filter(a => a.status === "interview").length;
  const offers     = apps.filter(a => a.status === "offer").length;

  const filtered = apps.filter(a => {
    const okStatus = sf === "all" || a.status === sf;
    const q = search.toLowerCase();
    const okSearch = !q || a.job_title.toLowerCase().includes(q) || a.company.toLowerCase().includes(q);
    return okStatus && okSearch;
  });

  const saveEdit = async () => {
    if (!editApp) return;
    setSaving(true);
    await getSB().from("applications").update({ status: editStatus, notes: editNotes }).eq("id", editApp.id);
    setApps(p => p.map(a => a.id === editApp.id ? { ...a, status: editStatus, notes: editNotes } : a));
    setEditApp(null); setSaving(false);
  };

  const deleteApp = async (id: string) => {
    await getSB().from("applications").delete().eq("id", id);
    setApps(p => p.filter(a => a.id !== id));
  };

  const deleteCV = (id: string) => {
    const next = cvs.filter(c => c.id !== id);
    setCvs(next);
    if (user) localStorage.setItem(`tm_cvs_${user.id}`, JSON.stringify(next));
  };

  const saveProfile = async () => {
    setPSaving(true);
    const { error } = await getSB().auth.updateUser({ data: { name: pName } });
    setPMsg(error ? "Erreur lors de la sauvegarde." : "Profil mis à jour ✓");
    setPSaving(false);
    setTimeout(() => setPMsg(null), 3000);
  };

  const signOut = async () => {
    await getSB().auth.signOut();
    window.location.href = "/";
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 14, color: "#6b7280" }}>Chargement de votre espace…</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const IS2: React.CSSProperties = { border: "1.5px solid #e5e7eb", borderRadius: 9, padding: "10px 13px", width: "100%", fontSize: 13, fontFamily: "inherit", color: "#0f172a", background: "white", outline: "none" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f5f3ff;color:#0f172a}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .au{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) both}
        input:focus,select:focus,textarea:focus{border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,.1)!important;outline:none!important}
        .tab{padding:13px 16px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;font-family:inherit;color:#6b7280;border-bottom:2.5px solid transparent;transition:all .18s;display:flex;align-items:center;gap:7px;white-space:nowrap}
        .tab.on{color:#7c3aed;border-bottom-color:#7c3aed}
        .tab:hover:not(.on){color:#1e1147}
        .card{background:white;border:1.5px solid #ede9fe;border-radius:13px;box-shadow:0 1px 4px rgba(124,58,237,.06)}
        .acard{background:white;border:1.5px solid #ede9fe;border-radius:12px;padding:16px 18px;transition:border-color .15s;box-shadow:0 1px 3px rgba(0,0,0,.03)}
        .acard:hover{border-color:#c4b5fd;box-shadow:0 2px 8px rgba(124,58,237,.08)}
        .bg{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:white;padding:9px 18px;border-radius:9px;font-size:13px;font-weight:700;border:none;cursor:pointer;font-family:inherit;text-decoration:none;transition:all .18s;white-space:nowrap;box-shadow:0 4px 14px rgba(124,58,237,.3)}
        .bg:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(124,58,237,.4)}
        .bg:disabled{background:#d1d5db;cursor:not-allowed;transform:none;box-shadow:none}
        .bo{display:inline-flex;align-items:center;gap:6px;background:white;color:#374151;padding:9px 16px;border-radius:9px;font-size:13px;font-weight:600;border:1.5px solid #e5e7eb;cursor:pointer;font-family:inherit;text-decoration:none;transition:all .18s;white-space:nowrap}
        .bo:hover{border-color:#7c3aed;color:#7c3aed}
        .chip{padding:6px 12px;border-radius:100px;border:1.5px solid #e5e7eb;background:white;cursor:pointer;font-size:11px;font-weight:600;color:#374151;font-family:inherit;transition:all .18s}
        .chip.on{border-color:#7c3aed;color:#6d28d9;background:#f5f3ff}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
        .modal{background:white;border-radius:16px;width:100%;max-width:500px;box-shadow:0 24px 60px rgba(0,0,0,.2);overflow:hidden}
        .ghost{background:none;border:none;cursor:pointer;padding:6px;border-radius:7px;color:#9ca3af;font-family:inherit;font-size:13px;display:inline-flex;align-items:center;transition:all .15s}
        .ghost:hover{background:#f5f3ff;color:#374151}
        .upload-zone{border:2px dashed #d1d5db;border-radius:12px;padding:28px;text-align:center;cursor:pointer;transition:all .2s}
        .upload-zone:hover{border-color:#7c3aed;background:#f5f3ff}
        @media(max-width:640px){
          .sgrid{grid-template-columns:1fr 1fr!important}
          .hide-sm{display:none!important}
          .tabs{overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
          .tabs::-webkit-scrollbar{display:none}
          .tab{white-space:nowrap;font-size:12px!important;padding:10px 12px!important}
          .acard{padding:13px 14px!important}
          input,textarea{font-size:16px!important}
        }
      `}</style>

      <div style={{ background: "#f5f3ff", minHeight: "100vh" }}>

        {/* NAVBAR */}
        <nav style={{ background: "rgba(255,255,255,.97)", backdropFilter: "blur(12px)", borderBottom: "1.5px solid #f0f0f0", padding: "0 22px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <div style={{ width: 33, height: 33, background: "linear-gradient(135deg,#7c3aed,#5b21b6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "white" }}>T</div>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#1e1147" }}>TalentMaroc</span>
            </a>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6d28d9", background: "#f5f3ff", border: "1px solid #ddd6fe", padding: "4px 10px", borderRadius: 100 }}>
              Espace Candidat
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <a href="/" className="bo hide-sm" style={{ padding: "7px 14px", fontSize: 12 }}>🔍 Offres</a>
            <a href="/cv" className="bo hide-sm" style={{ padding: "7px 14px", fontSize: 12 }}>✦ CV Builder</a>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "1.5px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white" }}>
              {(pName || user?.email || "?").charAt(0).toUpperCase()}
            </div>
            <button onClick={signOut}
              style={{ background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit" }}>
              Déconnexion
            </button>
          </div>
        </nav>

        {/* HEADER + TABS */}
        <div style={{ background: "white", borderBottom: "1.5px solid #f0f0f0", padding: "22px 24px 0" }}>
          <div style={{ maxWidth: 1060, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <div>
                <h1 style={{ fontSize: "clamp(17px,2.5vw,22px)", fontWeight: 800 }}>
                  Bonjour {pName || user?.email?.split("@")[0]} 👋
                </h1>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>
                  {total} candidature{total !== 1 ? "s" : ""} · {cvs.length} CV sauvegardé{cvs.length !== 1 ? "s" : ""}
                  {storedCvUrl && <span style={{ color: "#7c3aed", marginLeft: 8 }}>· ✅ CV importé</span>}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href="/" className="bo" style={{ fontSize: 12 }}>🔍 Nouvelles offres</a>
                <a href="/cv" className="bg" style={{ fontSize: 12 }}>✦ Créer un CV</a>
              </div>
            </div>
            <div className="tabs" style={{ display: "flex", gap: 0 }}>
              {([
                ["overview",     "📊 Vue d'ensemble"],
                ["applications", `💼 Candidatures (${total})`],
                ["cvs",          `📄 Mes CVs (${cvs.length})`],
                ["outils",       "✦ Outils IA"],
                ["profile",      "👤 Mon profil"],
              ] as const).map(([t, l]) => (
                <button key={t} className={`tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "24px 20px 80px" }}>

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="au">
              <div className="sgrid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { icon: "💼", label: "Total candidatures", val: total,      c: "#7c3aed" },
                  { icon: "🔥", label: "En cours",           val: active,     c: "#1d4ed8" },
                  { icon: "🗓", label: "Entretiens",          val: interviews, c: "#92400e" },
                  { icon: "🎉", label: "Offres reçues",       val: offers,     c: "#065f46" },
                ].map((s, i) => (
                  <div key={i} className="card" style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{ fontSize: 22 }}>{s.icon}</span>
                      <span style={{ fontSize: 28, fontWeight: 800, color: s.val > 0 ? s.c : "#d1d5db" }}>{s.val}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* CV banner */}
              {storedCvUrl ? (
                <div className="card" style={{ padding: "18px 22px", marginBottom: 16, background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1.5px solid #ddd6fe" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 28 }}>📄</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#6d28d9" }}>Votre CV est prêt à l'emploi</div>
                        <div style={{ fontSize: 12, color: "#7c3aed" }}>Importé · Joints automatiquement lors de vos candidatures</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={storedCvUrl} target="_blank" rel="noopener noreferrer" className="bo" style={{ fontSize: 12 }}>👁 Voir le CV</a>
                      <button className="bg" style={{ fontSize: 12 }} onClick={() => { setTab("cvs"); }}>Gérer les CVs</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: "18px 22px", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 32 }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Importez votre CV</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Joignez votre CV aux candidatures pour augmenter vos chances.</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="bg" style={{ fontSize: 12 }} onClick={() => setTab("cvs")}>📂 Importer un CV</button>
                      <a href="/cv" className="bo" style={{ fontSize: 12 }}>✦ Créer avec l'IA</a>
                    </div>
                  </div>
                </div>
              )}

              {/* Pipeline */}
              <div className="card" style={{ padding: "20px 22px", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Pipeline de candidatures</h3>
                {total === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", fontSize: 13 }}>
                    Aucune candidature. <a href="/" style={{ color: "#7c3aed", fontWeight: 600 }}>Parcourez les offres →</a>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(Object.entries(STATUS) as [AppStatus, any][]).map(([key, cfg]) => {
                      const count = apps.filter(a => a.status === key).length;
                      return (
                        <div key={key} onClick={() => { setTab("applications"); setSf(key); }}
                          style={{ flex: 1, minWidth: 85, background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 10, padding: "12px 14px", textAlign: "center", cursor: "pointer", transition: "transform .15s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "none"}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{count}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, marginTop: 2 }}>{cfg.icon} {cfg.label}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent */}
              <div className="card" style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800 }}>Candidatures récentes</h3>
                  <button className="bo" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => setTab("applications")}>Voir tout →</button>
                </div>
                {apps.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px", color: "#9ca3af", fontSize: 13 }}>
                    Aucune candidature. <a href="/" style={{ color: "#7c3aed", fontWeight: 600 }}>Parcourez les offres d'emploi →</a>
                  </div>
                ) : apps.slice(0, 5).map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap" }}>
                    <Logo name={a.company} url={a.logo_url} />
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{a.job_title}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{a.company}{a.city ? ` · ${a.city}` : ""}</div>
                    </div>
                    <Badge status={a.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── APPLICATIONS ── */}
          {tab === "applications" && (
            <div className="au">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 13 }}>🔍</span>
                    <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
                      style={{ border: "1.5px solid #e5e7eb", borderRadius: 9, padding: "9px 14px 9px 32px", fontSize: 13, fontFamily: "inherit", width: 200, outline: "none" }} />
                  </div>
                  {(["all", "saved", "applied", "interview", "offer", "rejected"] as const).map(s => (
                    <button key={s} className={`chip${sf === s ? " on" : ""}`} onClick={() => setSf(s as any)}>
                      {s === "all" ? `Toutes (${apps.length})` : `${STATUS[s as AppStatus]?.icon} ${STATUS[s as AppStatus]?.label} (${apps.filter(a => a.status === s).length})`}
                    </button>
                  ))}
                </div>
                <a href="/" className="bg" style={{ fontSize: 12 }}>+ Nouvelles offres</a>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "56px", background: "white", border: "2px dashed #e5e7eb", borderRadius: 14 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{apps.length === 0 ? "Aucune candidature" : "Aucun résultat"}</h3>
                  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>{apps.length === 0 ? "Parcourez les offres et cliquez sur Postuler." : "Modifiez la recherche ou les filtres."}</p>
                  {apps.length === 0 && <a href="/" className="bg">🔍 Voir les offres d'emploi</a>}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filtered.map(a => (
                    <div key={a.id} className="acard">
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <Logo name={a.company} url={a.logo_url} />
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{a.job_title}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{a.company}{a.city ? ` · 📍 ${a.city}` : ""}</div>
                          {a.notes && (
                            <div style={{ fontSize: 11, color: "#4b5563", marginTop: 6, background: "#f9fafb", padding: "4px 10px", borderRadius: 6, lineHeight: 1.5, maxWidth: 400 }}>
                              📝 {a.notes.slice(0, 100)}{a.notes.length > 100 ? "…" : ""}
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                            {a.applied_at ? `Postulée le ${new Date(a.applied_at).toLocaleDateString("fr-FR")}` : `Sauvegardée le ${new Date(a.created_at).toLocaleDateString("fr-FR")}`}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                          <Badge status={a.status} />
                          <div style={{ display: "flex", gap: 4 }}>
                            {a.job_id && <a href={`/jobs/${a.job_id}`} className="bo" style={{ padding: "5px 10px", fontSize: 11 }}>👁 Voir</a>}
                            {a.original_url && !a.original_url.includes("talentmaroc") && (
                              <a href={a.original_url} target="_blank" rel="noopener noreferrer" className="bo" style={{ padding: "5px 10px", fontSize: 11 }}>↗</a>
                            )}
                            <button className="ghost" onClick={() => { setEditApp(a); setEditNotes(a.notes || ""); setEditStatus(a.status); }} title="Modifier">✏️</button>
                            <button className="ghost" onClick={() => { if (confirm("Supprimer cette candidature ?")) deleteApp(a.id); }} style={{ color: "#ef4444" }} title="Supprimer">🗑</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CVs ── */}
          {tab === "cvs" && (
            <div className="au">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>Mes CVs</h2>
                  <p style={{ fontSize: 13, color: "#6b7280" }}>Importez un CV PDF ou générez-en un avec l'IA.</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href="/cv" className="bo">✦ Nouveau CV IA</a>
                </div>
              </div>

              {/* Upload zone */}
              <div className="card" style={{ padding: "24px", marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📂 Importer votre CV (PDF)</h3>
                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Votre CV sera sauvegardé et joint automatiquement à vos candidatures. Max 10 Mo.</p>

                <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleCVUpload(f); e.target.value = ""; }} />

                <div className="upload-zone" onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = "#7c3aed"; }}
                  onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db"; }}
                  onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db"; const f = e.dataTransfer.files[0]; if (f) handleCVUpload(f); }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{cvUploading ? "⏳" : "📤"}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    {cvUploading ? "Import en cours…" : "Glissez votre CV ici ou cliquez pour sélectionner"}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>PDF uniquement · Max 10 Mo</div>
                </div>

                {cvUploadErr && <div style={{ marginTop: 10, background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>⚠ {cvUploadErr}</div>}
                {cvUploadMsg && <div style={{ marginTop: 10, background: "#f5f3ff", border: "1.5px solid #ddd6fe", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#6d28d9" }}>✓ {cvUploadMsg}</div>}

                {storedCvUrl && (
                  <div style={{ marginTop: 14, background: "#f5f3ff", border: "1.5px solid #ddd6fe", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>📄</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#6d28d9" }}>CV actif</div>
                        <div style={{ fontSize: 11, color: "#7c3aed" }}>Ce CV est joint automatiquement à vos candidatures</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={storedCvUrl} target="_blank" rel="noopener noreferrer" className="bo" style={{ fontSize: 12 }}>👁 Voir</a>
                      <a href={storedCvUrl} download className="bg" style={{ fontSize: 12 }}>⬇ Télécharger</a>
                    </div>
                  </div>
                )}
              </div>

              {/* AI-generated and uploaded CVs */}
              {cvs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 32px", background: "white", border: "2px dashed #e5e7eb", borderRadius: 14 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Aucun CV sauvegardé</h3>
                  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24, maxWidth: 360, margin: "0 auto 24px", lineHeight: 1.7 }}>
                    Importez votre CV ci-dessus ou créez-en un avec notre générateur IA.
                  </p>
                  <a href="/cv" className="bg">✦ Générer mon CV avec l'IA</a>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
                  {cvs.map(cv => (
                    <div key={cv.id} className="card" style={{ padding: "20px", transition: "transform .15s, box-shadow .15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,.08)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,.04)"; }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ width: 44, height: 44, background: cv.type === "generated" ? "#f5f3ff" : cv.type === "uploaded" ? "#f0fdf4" : "#fefce8", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                          {cv.type === "generated" ? "✦" : cv.type === "uploaded" ? "📂" : "📄"}
                        </div>
                        <button onClick={() => { if (confirm(`Supprimer "${cv.name}" ?`)) deleteCV(cv.id); }} className="ghost" style={{ color: "#d1d5db" }}>🗑</button>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{cv.name}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 14 }}>
                        {cv.type === "generated" ? "✦ IA" : cv.type === "uploaded" ? "📂 Importé" : "📄 Modèle"} · {new Date(cv.created_at).toLocaleDateString("fr-FR")}
                      </div>
                      <div style={{ display: "flex", gap: 7 }}>
                        {cv.url ? (
                          <a href={cv.url} target="_blank" rel="noopener noreferrer" className="bg" style={{ flex: 1, padding: "8px", fontSize: 12, justifyContent: "center" }}>👁 Voir</a>
                        ) : (
                          <a href="/cv" className="bg" style={{ flex: 1, padding: "8px", fontSize: 12, justifyContent: "center" }}>Modifier</a>
                        )}
                        <a href="/" className="bo" style={{ flex: 1, padding: "8px", fontSize: 12, justifyContent: "center" }}>Postuler</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Enhancement upsell */}
              <div style={{ marginTop: 20, background: "linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(167,139,250,.2)", border: "1px solid rgba(167,139,250,.3)", borderRadius: 100, padding: "3px 10px", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa" }}>✦ PRO</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 4 }}>Améliorez votre CV avec l'IA</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.5 }}>Notre IA analyse et réécrit votre CV pour maximiser vos chances. Adapté à chaque poste.</div>
                </div>
                <a href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "white", padding: "10px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(124,58,237,.35)" }}>
                  Voir les offres Pro →
                </a>
              </div>
            </div>
          )}

          {/* ── OUTILS IA ── */}
          {tab === "outils" && (
            <div className="au">

              {/* ── COVER LETTER ── */}
              <div className="card" style={{ padding:"24px 26px", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:20 }}>✉️</span>
                  <h2 style={{ fontSize:16, fontWeight:800 }}>Lettre de motivation IA</h2>
                  <span style={{ fontSize:11, fontWeight:700, background:"linear-gradient(135deg,#7c3aed,#5b21b6)", color:"white", padding:"2px 8px", borderRadius:100 }}>Pro</span>
                </div>
                <p style={{ fontSize:13, color:"#6b7280", marginBottom:20, lineHeight:1.6 }}>
                  L'IA génère une lettre de motivation personnalisée pour le poste ciblé en se basant sur votre profil.
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Poste visé *</label>
                    <input value={clJobTitle} onChange={e=>setClJobTitle(e.target.value)} placeholder="ex: Développeur Full Stack"
                      style={IS2}/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Entreprise *</label>
                    <input value={clCompany} onChange={e=>setClCompany(e.target.value)} placeholder="ex: Maroc Telecom"
                      style={IS2}/>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Description du poste <span style={{ fontWeight:400, color:"#9ca3af" }}>(optionnel)</span></label>
                  <textarea value={clDesc} onChange={e=>setClDesc(e.target.value)} rows={3}
                    placeholder="Copiez-collez la description du poste pour une lettre encore plus ciblée…"
                    style={{ ...IS2, resize:"vertical", lineHeight:1.6 }}/>
                </div>
                {clErr && <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#dc2626", marginBottom:12 }}>⚠ {clErr}</div>}
                <button className="bg" disabled={clLoading || !clJobTitle.trim() || !clCompany.trim()}
                  onClick={async ()=>{
                    setClLoading(true); setClErr(null); setClResult(null);
                    try {
                      const res = await fetch("/api/generate-tools", {
                        method:"POST", headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({
                          type:"cover_letter",
                          data:{
                            name: pName || user?.email?.split("@")[0] || "",
                            candidate_title: user?.user_metadata?.title || "",
                            skills: user?.user_metadata?.skills || "",
                            experience: user?.user_metadata?.experience || "",
                            location: user?.user_metadata?.location || "Maroc",
                            job_title: clJobTitle,
                            company: clCompany,
                            job_description: clDesc,
                          }
                        })
                      });
                      const json = await res.json();
                      if (json.error) throw new Error(json.error);
                      setClResult(json.result);
                    } catch(e:any){ setClErr(e.message); }
                    finally{ setClLoading(false); }
                  }}>
                  {clLoading ? "Génération…" : "✦ Générer ma lettre de motivation"}
                </button>

                {clResult && (
                  <div style={{ marginTop:18 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#6d28d9" }}>✓ Lettre générée</div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button className="bo" style={{ fontSize:12, padding:"6px 12px" }}
                          onClick={()=>{ navigator.clipboard.writeText(clResult); }}>
                          📋 Copier
                        </button>
                        <button className="bo" style={{ fontSize:12, padding:"6px 12px" }}
                          onClick={()=>{ const a=document.createElement("a"); a.href="data:text/plain;charset=utf-8,"+encodeURIComponent(clResult); a.download=`lettre_${clCompany.replace(/\s+/g,"_")}.txt`; a.click(); }}>
                          ⬇ Télécharger
                        </button>
                      </div>
                    </div>
                    <div style={{ background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"18px 20px", fontSize:13, color:"#374151", lineHeight:1.9, whiteSpace:"pre-wrap" }}>
                      {clResult}
                    </div>
                  </div>
                )}
              </div>

              {/* ── LINKEDIN BIO ── */}
              <div className="card" style={{ padding:"24px 26px", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:20 }}>💼</span>
                  <h2 style={{ fontSize:16, fontWeight:800 }}>Résumé LinkedIn IA</h2>
                  <span style={{ fontSize:11, fontWeight:700, background:"linear-gradient(135deg,#7c3aed,#5b21b6)", color:"white", padding:"2px 8px", borderRadius:100 }}>Pro</span>
                </div>
                <p style={{ fontSize:13, color:"#6b7280", marginBottom:20, lineHeight:1.6 }}>
                  Générez une bio LinkedIn percutante basée sur votre profil pour maximiser votre visibilité.
                </p>
                {liErr && <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#dc2626", marginBottom:12 }}>⚠ {liErr}</div>}
                <button className="bg" disabled={liLoading}
                  onClick={async ()=>{
                    setLiLoading(true); setLiErr(null); setLiResult(null);
                    try {
                      const res = await fetch("/api/generate-tools", {
                        method:"POST", headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({
                          type:"linkedin_bio",
                          data:{
                            name: pName || user?.email?.split("@")[0] || "",
                            candidate_title: user?.user_metadata?.title || "",
                            industry: user?.user_metadata?.industry || "",
                            skills: user?.user_metadata?.skills || "",
                            experience: user?.user_metadata?.experience || "",
                            location: user?.user_metadata?.location || "Maroc",
                          }
                        })
                      });
                      const json = await res.json();
                      if (json.error) throw new Error(json.error);
                      setLiResult(json.result);
                    } catch(e:any){ setLiErr(e.message); }
                    finally{ setLiLoading(false); }
                  }}>
                  {liLoading ? "Génération…" : "✦ Générer mon résumé LinkedIn"}
                </button>

                {!pName && !user?.user_metadata?.title && (
                  <div style={{ marginTop:10, fontSize:12, color:"#9ca3af" }}>
                    💡 Complétez votre profil (onglet "Mon profil") pour une bio plus personnalisée.
                  </div>
                )}

                {liResult && (
                  <div style={{ marginTop:18 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#6d28d9" }}>✓ Bio LinkedIn générée</div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button className="bo" style={{ fontSize:12, padding:"6px 12px" }}
                          onClick={()=>{ navigator.clipboard.writeText(liResult); }}>
                          📋 Copier
                        </button>
                        <button className="bo" style={{ fontSize:12, padding:"6px 12px" }}
                          onClick={()=>{ const a=document.createElement("a"); a.href="data:text/plain;charset=utf-8,"+encodeURIComponent(liResult); a.download="bio_linkedin.txt"; a.click(); }}>
                          ⬇ Télécharger
                        </button>
                      </div>
                    </div>
                    <div style={{ background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"18px 20px", fontSize:13, color:"#374151", lineHeight:1.9, whiteSpace:"pre-wrap" }}>
                      {liResult}
                    </div>
                  </div>
                )}
              </div>

              {/* ── UPGRADE BANNER ── */}
              <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius:14, padding:"22px 26px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:800, color:"#a78bfa", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5 }}>✦ Candidat Pro · 49 MAD/mois</div>
                  <div style={{ fontSize:14, fontWeight:800, color:"white", marginBottom:3 }}>Débloquez tous les outils IA</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", lineHeight:1.6 }}>
                    CV amélioré · Lettre de motivation · Bio LinkedIn · Adaptation CV au poste
                  </div>
                </div>
                <a href="/pricing" style={{ display:"inline-flex", alignItems:"center", gap:7, background:"linear-gradient(135deg,#7c3aed,#5b21b6)", color:"white", padding:"11px 20px", borderRadius:9, fontSize:13, fontWeight:700, textDecoration:"none", whiteSpace:"nowrap", flexShrink:0, boxShadow:"0 4px 14px rgba(124,58,237,.35)" }}>
                  Voir les offres →
                </a>
              </div>
            </div>
          )}

          {/* ── PROFILE ── */}
          {tab === "profile" && (
            <div className="au" style={{ maxWidth: 560 }}>
              <div className="card" style={{ padding: "24px 26px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#5b21b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "white" }}>
                    {(pName || user?.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{pName || user?.email?.split("@")[0]}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>{user?.email}</div>
                    <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, marginTop: 2 }}>✅ Compte Candidat actif</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Prénom et Nom</label>
                    <input value={pName} onChange={e => setPName(e.target.value)} placeholder="Youssef Benali"
                      style={IS2} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email</label>
                    <input value={user?.email || ""} disabled
                      style={{ ...IS2, color: "#9ca3af", background: "#f9fafb", cursor: "not-allowed" }} />
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>L'email ne peut pas être modifié.</p>
                  </div>

                  {/* CV in profile */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Mon CV</label>
                    {storedCvUrl ? (
                      <div style={{ background: "#f5f3ff", border: "1.5px solid #ddd6fe", borderRadius: 9, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ fontSize: 13, color: "#6d28d9", fontWeight: 600 }}>📄 CV importé</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <a href={storedCvUrl} target="_blank" rel="noopener noreferrer" className="bo" style={{ fontSize: 11, padding: "4px 10px" }}>Voir</a>
                          <button className="bo" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setTab("cvs")}>Remplacer</button>
                        </div>
                      </div>
                    ) : (
                      <button className="bo" style={{ width: "100%", justifyContent: "center" }} onClick={() => setTab("cvs")}>
                        📂 Importer un CV →
                      </button>
                    )}
                  </div>

                  {pMsg && (
                    <div style={{ background: pMsg.includes("Erreur") ? "#fef2f2" : "#f5f3ff", border: `1.5px solid ${pMsg.includes("Erreur") ? "#fecaca" : "#ddd6fe"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: pMsg.includes("Erreur") ? "#dc2626" : "#6d28d9" }}>
                      {pMsg}
                    </div>
                  )}
                  <button className="bg" onClick={saveProfile} disabled={pSaving} style={{ alignSelf: "flex-start" }}>
                    {pSaving ? "Sauvegarde…" : "💾 Sauvegarder le profil"}
                  </button>
                </div>
              </div>

              <div className="card" style={{ padding: "20px 22px", marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Informations du compte</h3>
                {[
                  ["📧 Email",            user?.email],
                  ["📅 Membre depuis",    user?.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "—"],
                  ["💼 Candidatures",     `${total} au total`],
                  ["📄 CVs sauvegardés",  `${cvs.length} CV${cvs.length !== 1 ? "s" : ""}`],
                  ["🔖 Rôle",             "Candidat"],
                ].map(([label, value]) => (
                  <div key={label as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                    <span style={{ color: "#6b7280" }}>{label as string}</span>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>{value as string}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a href="/" className="bo">🏠 Accueil</a>
                <a href="/cv" className="bo">✦ CV Builder</a>
                <a href="/pricing" className="bo">💎 Offres Pro</a>
                <button className="bo" style={{ color: "#dc2626", borderColor: "#fecaca" }} onClick={signOut}>
                  Déconnexion
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* EDIT MODAL */}
      {editApp && (
        <div className="modal-bg" onClick={() => setEditApp(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 22px", borderBottom: "1.5px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>Modifier la candidature</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{editApp.job_title} · {editApp.company}</div>
              </div>
              <button onClick={() => setEditApp(null)} style={{ background: "none", border: "none", fontSize: 22, color: "#9ca3af", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Statut</label>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {(Object.entries(STATUS) as [AppStatus, any][]).map(([s, cfg]) => (
                    <button key={s} onClick={() => setEditStatus(s)}
                      style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${editStatus === s ? cfg.border : "#e5e7eb"}`, background: editStatus === s ? cfg.bg : "white", color: editStatus === s ? cfg.color : "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Notes personnelles</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={4}
                  placeholder="Entretien prévu le… / Contact : … / Points à préparer…"
                  style={{ border: "1.5px solid #e5e7eb", borderRadius: 9, padding: "10px 13px", width: "100%", fontSize: 13, fontFamily: "inherit", color: "#0f172a", background: "white", outline: "none", resize: "vertical", lineHeight: 1.6 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button className="bo" onClick={() => setEditApp(null)}>Annuler</button>
                <button className="bg" onClick={saveEdit} disabled={saving}>{saving ? "Sauvegarde…" : "💾 Sauvegarder"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
