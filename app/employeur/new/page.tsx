"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

const CITIES    = ["Casablanca","Rabat","Tanger","Marrakech","Agadir","Fès","Meknès","Oujda","Kenitra","Tétouan","Autre"];
const SECTORS   = ["Informatique","Finance","Commerce","Marketing","RH","Ingénierie","Santé","Logistique","Tourisme","Juridique","Éducation","BTP","Industrie","Autre"];
const CONTRACTS = ["CDI","CDD","Stage","Alternance","Freelance","Temps partiel","Intérim"];

function EF({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const IS: React.CSSProperties = {
  border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "9px 12px",
  width: "100%", fontSize: 13, fontFamily: "inherit", color: "#0f172a",
  background: "white", outline: "none",
};

const FREE_JOB_LIMIT = 3;

export default function NewJobPage() {
  const [user,      setUser]     = useState<any>(null);
  const [loading,   setLoading]  = useState(true);
  const [saving,    setSaving]   = useState(false);
  const [err,       setErr]      = useState<string | null>(null);
  const [jobCount,  setJobCount] = useState(0);
  const [form,      setForm]     = useState({
    title: "", company: "", city: "", sector: "",
    contract_type: "", salary: "", description: "", logo_url: "",
  });

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/employeur"; return; }
      setUser(user);
      // Count current active jobs for limit enforcement
      const { count } = await sb
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("employer_id", user.id);
      setJobCount(count || 0);
      setLoading(false);
    });
  }, []);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim() || !form.city) {
      setErr("Veuillez remplir les champs obligatoires."); return;
    }
    setSaving(true); setErr(null);
    const sb = getSupabase();
    const { error } = await sb.from("jobs").insert({
      title:         form.title.trim(),
      company:       form.company.trim(),
      city:          form.city,
      sector:        form.sector        || null,
      contract_type: form.contract_type || null,
      salary:        form.salary.trim() || null,
      description:   form.description.trim() || null,
      logo_url:      form.logo_url.trim()     || null,
      employer_id:   user.id,
      source:        "employer",
      posted_at:     new Date().toISOString(),
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    window.location.href = "/employeur/dashboard";
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 14, color: "#6b7280" }}>Chargement…</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f5f3ff;color:#0f172a}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .au{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) both}
        input:focus,select:focus,textarea:focus{border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,.1)!important;outline:none!important}
        .nl{color:#4b5563;text-decoration:none;font-size:13px;font-weight:600;padding:6px 10px;border-radius:7px;transition:all .18s}
        .nl:hover{color:#1e1147;background:#f5f3ff}
      `}</style>

      <div style={{ background: "#f5f3ff", minHeight: "100vh" }}>
        {/* NAVBAR */}
        <nav style={{ background: "rgba(255,255,255,.96)", backdropFilter: "blur(12px)", borderBottom: "1.5px solid #f0f0f0", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <img src="/logo.png" alt="TalentMaroc" style={{ height:40, width:'auto', objectFit:'contain' }} />
            </a>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6d28d9", background: "#f5f3ff", padding: "4px 10px", borderRadius: 7 }}>Publier une offre</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <a href="/employeur/dashboard" className="nl">← Dashboard</a>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "1.5px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <button onClick={() => { getSupabase().auth.signOut(); window.location.href = "/employeur"; }}
              style={{ background: "none", border: "1.5px solid #e5e7eb", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit" }}>
              Déconnexion
            </button>
          </div>
        </nav>

        {/* FORM */}
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 20px 80px" }}>
          <div className="au" style={{ background: "white", border: "1.5px solid #f0f0f0", borderRadius: 16, padding: "32px 36px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Nouvelle offre d'emploi</h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 28 }}>Remplissez les informations ci-dessous pour publier votre offre.</p>

            {/* Free plan job limit banner */}
            {jobCount >= FREE_JOB_LIMIT && (
              <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#92400e", marginBottom: 4 }}>
                  Limite du plan Gratuit atteinte
                </div>
                <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.6, marginBottom: 10 }}>
                  Vous avez {jobCount} offre{jobCount > 1 ? "s" : ""} publiée{jobCount > 1 ? "s" : ""}. Le plan Gratuit est limité à {FREE_JOB_LIMIT} offres actives.
                  Passez au plan <strong>Pro Recruteur</strong> pour publier des offres illimitées.
                </div>
                <a href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  ✦ Voir les offres Pro →
                </a>
              </div>
            )}

            {err && (
              <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#dc2626" }}>
                ⚠ {err}
              </div>
            )}

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <EF label="Titre du poste" required>
                  <input style={IS} value={form.title} onChange={set("title")} placeholder="ex: Développeur Full Stack" required />
                </EF>
                <EF label="Entreprise" required>
                  <input style={IS} value={form.company} onChange={set("company")} placeholder="ex: Maroc Telecom" required />
                </EF>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <EF label="Ville" required>
                  <select style={IS} value={form.city} onChange={set("city")} required>
                    <option value="">Choisir une ville…</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </EF>
                <EF label="Secteur">
                  <select style={IS} value={form.sector} onChange={set("sector")}>
                    <option value="">Choisir un secteur…</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </EF>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <EF label="Type de contrat">
                  <select style={IS} value={form.contract_type} onChange={set("contract_type")}>
                    <option value="">Choisir un contrat…</option>
                    {CONTRACTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </EF>
                <EF label="Salaire">
                  <input style={IS} value={form.salary} onChange={set("salary")} placeholder="ex: 8 000 – 12 000 MAD" />
                </EF>
              </div>

              <EF label="Description du poste">
                <textarea
                  style={{ ...IS, minHeight: 140, resize: "vertical" }}
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Décrivez les missions, profil recherché, avantages…"
                />
              </EF>

              <EF label="URL du logo (optionnel)">
                <input style={IS} value={form.logo_url} onChange={set("logo_url")} placeholder="https://…" type="url" />
              </EF>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
                <a href="/employeur/dashboard"
                  style={{ display: "inline-flex", alignItems: "center", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "white", color: "#374151", border: "1.5px solid #e5e7eb", textDecoration: "none", cursor: "pointer" }}>
                  Annuler
                </a>
                <button type="submit" disabled={saving || jobCount >= FREE_JOB_LIMIT}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: (saving || jobCount >= FREE_JOB_LIMIT) ? "#d1d5db" : "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "white", border: "none", cursor: (saving || jobCount >= FREE_JOB_LIMIT) ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all .18s", boxShadow: (saving || jobCount >= FREE_JOB_LIMIT) ? "none" : "0 4px 14px rgba(124,58,237,.3)" }}>
                  {saving ? "Publication…" : jobCount >= FREE_JOB_LIMIT ? "Limite atteinte" : "Publier l'offre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
