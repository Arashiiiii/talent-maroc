"use client";
import React from "react";
import { ExternalLink } from "lucide-react";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getSBUser() {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function saveApp(job: any) {
  try {
    const res = await fetch("/api/save-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id:       job.id,
        job_title:    job.title,
        company:      job.company,
        city:         job.city,
        original_url: job.original_url,
        logo_url:     job.logo_url || null,
        status:       "applied",
      }),
    });
    return res.ok;
  } catch { return false; }
}

export function SaveApplyButton({ job }: { job: any }) {
  const [user,     setUser]    = React.useState<any>(undefined); // undefined = loading
  const [saved,    setSaved]   = React.useState(false);
  const [saving,   setSaving]  = React.useState(false);
  const [showForm, setShowForm]= React.useState(false);
  const [formData, setFormData]= React.useState({ name: "", email: "", message: "" });
  const [formSent, setFormSent]= React.useState(false);
  const [formErr,  setFormErr] = React.useState<string|null>(null);

  const isDirectJob =
    !job.original_url ||
    job.original_url === "https://talentmaroc.shop" ||
    job.original_url === "https://talentmaroc.shop/" ||
    job.original_url.endsWith("/jobs") ||
    job.source === "employer_direct";

  React.useEffect(() => {
    getSBUser().then(u => {
      setUser(u || null);
      if (u) {
        setFormData(p => ({ ...p, email: u.email || "", name: u.user_metadata?.name || "" }));

        // Auto-trigger if coming back from login
        const fromLogin = document.referrer.includes("/auth/login");
        if (fromLogin) {
          if (isDirectJob) {
            setTimeout(() => setShowForm(true), 400);
          } else {
            // Auto save + open external URL
            setTimeout(async () => {
              setSaving(true);
              const ok = await saveApp(job);
              setSaving(false);
              if (ok) { setSaved(true); window.open(job.original_url, "_blank", "noopener,noreferrer"); }
            }, 400);
          }
        }
      }
    });
  }, []);

  const loginRedirect = () => {
    window.location.href = `/auth/login?redirect=/jobs/${job.id}`;
  };

  const handleApply = async () => {
    if (!user) { loginRedirect(); return; }
    if (isDirectJob) { setShowForm(true); return; }
    // External job: open URL directly — saving is separate
    window.open(job.original_url, "_blank", "noopener,noreferrer");
  };

  const handleSave = async () => {
    if (!user) { loginRedirect(); return; }
    setSaving(true);
    const ok = await saveApp(job);
    setSaving(false);
    if (ok) setSaved(true);
  };

  const submitForm = async () => {
    setFormErr(null);
    if (!formData.name.trim())  { setFormErr("Votre nom est requis."); return; }
    if (!formData.email.trim()) { setFormErr("Votre email est requis."); return; }
    setSaving(true);
    try {
      await saveApp(job);
      const subject = encodeURIComponent(`Candidature : ${job.title} — TalentMaroc`);
      const body    = encodeURIComponent(
        `Bonjour,\n\nCandidature au poste de ${job.title} chez ${job.company}.\n\nNom : ${formData.name}\nEmail : ${formData.email}\n\nMessage :\n${formData.message}\n\n— Envoyé via TalentMaroc`
      );
      window.location.href = `mailto:contact@talentmaroc.shop?subject=${subject}&body=${body}`;
      setFormSent(true);
      setShowForm(false);
    } catch {
      setFormErr("Erreur lors de l'envoi.");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (user === undefined) return (
    <div style={{ padding:"12px", background:"#f3f4f6", borderRadius:10, textAlign:"center", fontSize:13, color:"#9ca3af" }}>
      Chargement…
    </div>
  );

  const btnBase: React.CSSProperties = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
    padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:700,
    cursor:"pointer", fontFamily:"inherit", width:"100%", border:"none", transition:"all .18s",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

      {/* On-platform form for direct employer jobs */}
      {showForm && !formSent && (
        <div style={{ background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:12, padding:"18px", marginBottom:4 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0f172a", marginBottom:3 }}>
            📋 Postuler — {job.title}
          </div>
          <div style={{ fontSize:12, color:"#6b7280", marginBottom:14 }}>
            {job.company} · {job.city}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Prénom et Nom *</label>
              <input value={formData.name} onChange={e=>setFormData(p=>({...p,name:e.target.value}))}
                placeholder="Youssef Benali"
                style={{ border:"1.5px solid #e5e7eb", borderRadius:8, padding:"9px 12px", width:"100%", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Email *</label>
              <input type="email" value={formData.email} onChange={e=>setFormData(p=>({...p,email:e.target.value}))}
                placeholder="youssef@email.ma"
                style={{ border:"1.5px solid #e5e7eb", borderRadius:8, padding:"9px 12px", width:"100%", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Message <span style={{ fontWeight:400, color:"#9ca3af" }}>(optionnel)</span></label>
              <textarea value={formData.message} onChange={e=>setFormData(p=>({...p,message:e.target.value}))}
                rows={3} placeholder="Présentez-vous brièvement…"
                style={{ border:"1.5px solid #e5e7eb", borderRadius:8, padding:"9px 12px", width:"100%", fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", lineHeight:1.6, boxSizing:"border-box" }}/>
            </div>
            {formErr && <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:7, padding:"8px 12px", fontSize:12, color:"#dc2626" }}>⚠ {formErr}</div>}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowForm(false)}
                style={{ flex:1, padding:"10px", borderRadius:8, border:"1.5px solid #e5e7eb", background:"white", fontSize:13, fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>
                Annuler
              </button>
              <button onClick={submitForm} disabled={saving}
                style={{ flex:2, padding:"10px", borderRadius:8, border:"none", background:"#16a34a", fontSize:13, fontWeight:700, color:"white", cursor:"pointer", fontFamily:"inherit", opacity:saving?0.7:1 }}>
                {saving ? "Envoi…" : "📨 Envoyer ma candidature"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success state */}
      {formSent && (
        <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#15803d", marginBottom:3 }}>🎉 Candidature envoyée !</div>
          <div style={{ fontSize:12, color:"#15803d" }}>Le recruteur vous contactera par email.</div>
        </div>
      )}

      {/* Main apply button */}
      {!formSent && (
        isDirectJob ? (
          // Direct employer job: show "Postuler" button
          <button onClick={handleApply} disabled={saving}
            style={{ ...btnBase, background:"#16a34a", color:"white", opacity:saving?0.7:1 }}>
            {user ? "📋 Postuler à cette offre" : "🔐 Connexion pour postuler"}
          </button>
        ) : (
          // External scraped job: show "Postuler sur le site" link + save button
          <>
            <a href={job.original_url} target="_blank" rel="noopener noreferrer"
              style={{ ...btnBase, background:"#16a34a", color:"white", textDecoration:"none" }}>
              Postuler sur le site <ExternalLink size={14}/>
            </a>

            {/* Save to dashboard button — only show if logged in */}
            {user && (
              <button onClick={handleSave} disabled={saving || saved}
                style={{ ...btnBase,
                  background: saved ? "#f0fdf4" : "white",
                  color:       saved ? "#15803d" : "#374151",
                  border:     `1.5px solid ${saved ? "#bbf7d0" : "#e5e7eb"}`,
                  cursor:      saved ? "default" : "pointer",
                }}>
                {saving ? "Sauvegarde…" : saved ? "✓ Sauvegardée dans votre dashboard" : "📋 Sauvegarder & suivre"}
              </button>
            )}

            {/* Prompt to login to save — only show if not logged in */}
            {!user && (
              <button onClick={loginRedirect}
                style={{ ...btnBase, background:"white", color:"#374151", border:"1.5px solid #e5e7eb", cursor:"pointer" }}>
                🔐 Connexion pour sauvegarder & suivre
              </button>
            )}

            {saved && (
              <a href="/dashboard" style={{ fontSize:12, color:"#16a34a", textAlign:"center", textDecoration:"none", fontWeight:600 }}>
                Voir mon dashboard →
              </a>
            )}
          </>
        )
      )}
    </div>
  );
}