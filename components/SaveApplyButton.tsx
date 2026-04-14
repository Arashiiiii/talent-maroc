"use client";
import React from "react";
import { ExternalLink } from "lucide-react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Get Supabase client (singleton to avoid multiple instances)
let _sb: any = null;
function getSB() {
  if (!_sb) {
    const { createClient } = require("@supabase/supabase-js");
    _sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return _sb;
}

export function SaveApplyButton({ job }: { job: any }) {
  const [user,     setUser]    = React.useState<any>(undefined); // undefined=loading
  const [token,    setToken]   = React.useState<string>("");
  const [saved,    setSaved]   = React.useState(false);
  const [saving,   setSaving]  = React.useState(false);
  const [showForm, setShowForm]= React.useState(false);
  const [formData, setFormData]= React.useState({ name:"", email:"", message:"" });
  const [formSent, setFormSent]= React.useState(false);
  const [formErr,  setFormErr] = React.useState<string|null>(null);
  const [saveErr,  setSaveErr] = React.useState<string|null>(null);

  const isDirectJob =
    !job.original_url ||
    job.original_url === "https://talentmaroc.shop" ||
    job.original_url === "https://talentmaroc.shop/" ||
    job.original_url.endsWith("/jobs") ||
    job.source === "employer_direct";

  React.useEffect(() => {
    const sb = getSB();
    // Get current session — session.access_token is the JWT we need
    sb.auth.getSession().then(({ data: { session } }: any) => {
      if (session) {
        setUser(session.user);
        setToken(session.access_token);
        setFormData((p: any) => ({
          ...p,
          email: session.user.email || "",
          name:  session.user.user_metadata?.name || "",
        }));

        // Auto-trigger if coming back from login page
        const fromLogin = document.referrer.includes("/auth/login");
        if (fromLogin) {
          if (isDirectJob) {
            setTimeout(() => setShowForm(true), 400);
          } else {
            setTimeout(() => doSave(session.access_token), 400);
          }
        }
      } else {
        setUser(null);
      }
    });
  }, []);

  // Save application with JWT in Authorization header
  const doSave = async (accessToken: string) => {
    setSaveErr(null);
    setSaving(true);
    try {
      const res = await fetch("/api/save-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
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
      if (res.ok) {
        setSaved(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveErr(err.error || "Erreur lors de la sauvegarde.");
      }
    } catch (e: any) {
      setSaveErr("Erreur réseau. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const loginRedirect = () => {
    window.location.href = `/auth/login?redirect=/jobs/${job.id}`;
  };

  const submitForm = async () => {
    setFormErr(null);
    if (!formData.name.trim())  { setFormErr("Votre nom est requis."); return; }
    if (!formData.email.trim()) { setFormErr("Votre email est requis."); return; }
    setSaving(true);
    try {
      // Save to DB
      await fetch("/api/save-application", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          job_id: job.id, job_title: job.title, company: job.company,
          city: job.city, original_url: job.original_url,
          logo_url: job.logo_url || null, status: "applied",
        }),
      });
      // Open mailto
      const subject = encodeURIComponent(`Candidature : ${job.title} — TalentMaroc`);
      const body    = encodeURIComponent(
        `Bonjour,\n\nCandidature pour le poste : ${job.title} chez ${job.company}.\n\nNom : ${formData.name}\nEmail : ${formData.email}\n\nMessage :\n${formData.message || "(aucun message)"}\n\n— Via TalentMaroc`
      );
      window.location.href = `mailto:contact@talentmaroc.shop?subject=${subject}&body=${body}`;
      setFormSent(true);
      setShowForm(false);
    } catch {
      setFormErr("Erreur lors de l'envoi. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const btnBase: React.CSSProperties = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
    padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:700,
    cursor:"pointer", fontFamily:"inherit", width:"100%", border:"none", transition:"all .18s",
  };

  // Loading
  if (user === undefined) return (
    <div style={{ padding:"12px", background:"#f3f4f6", borderRadius:10, textAlign:"center", fontSize:13, color:"#9ca3af" }}>
      Chargement…
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

      {/* On-platform application form (for employer-direct jobs) */}
      {showForm && !formSent && (
        <div style={{ background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:12, padding:"18px", marginBottom:4 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0f172a", marginBottom:3 }}>📋 Postuler — {job.title}</div>
          <div style={{ fontSize:12, color:"#6b7280", marginBottom:14 }}>{job.company} · {job.city}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Prénom et Nom *</label>
              <input value={formData.name} onChange={e=>setFormData((p:any)=>({...p,name:e.target.value}))}
                placeholder="Youssef Benali"
                style={{ border:"1.5px solid #e5e7eb", borderRadius:8, padding:"9px 12px", width:"100%", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Email *</label>
              <input type="email" value={formData.email} onChange={e=>setFormData((p:any)=>({...p,email:e.target.value}))}
                placeholder="youssef@email.ma"
                style={{ border:"1.5px solid #e5e7eb", borderRadius:8, padding:"9px 12px", width:"100%", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Message <span style={{ fontWeight:400, color:"#9ca3af" }}>(optionnel)</span></label>
              <textarea value={formData.message} onChange={e=>setFormData((p:any)=>({...p,message:e.target.value}))}
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

      {!formSent && (
        isDirectJob ? (
          /* Employer-direct job: single Postuler button */
          <button onClick={()=>{ if(!user){loginRedirect();return;} setShowForm(true); }} disabled={saving}
            style={{ ...btnBase, background:"#16a34a", color:"white" }}>
            {user ? "📋 Postuler à cette offre" : "🔐 Connexion pour postuler"}
          </button>
        ) : (
          /* External/scraped job: Postuler link + Save button */
          <>
            {/* "Postuler sur le site" — plain <a> tag, always works */}
            <a href={job.original_url} target="_blank" rel="noopener noreferrer"
              style={{ ...btnBase, background:"#16a34a", color:"white", textDecoration:"none" }}>
              Postuler sur le site <ExternalLink size={14}/>
            </a>

            {/* Save & track */}
            {user ? (
              <button
                onClick={()=>{ if(!saved && !saving) doSave(token); }}
                disabled={saving || saved}
                style={{ ...btnBase,
                  background: saved ? "#f0fdf4" : "white",
                  color:       saved ? "#15803d" : "#374151",
                  border:     `1.5px solid ${saved ? "#bbf7d0" : "#e5e7eb"}`,
                  cursor:      saved || saving ? "default" : "pointer",
                  opacity:     saving ? 0.7 : 1,
                }}>
                {saving ? "Sauvegarde…" : saved ? "✓ Sauvegardée dans votre dashboard" : "📋 Sauvegarder & suivre"}
              </button>
            ) : (
              <button onClick={loginRedirect}
                style={{ ...btnBase, background:"white", color:"#374151", border:"1.5px solid #e5e7eb", cursor:"pointer" }}>
                🔐 Connexion pour sauvegarder & suivre
              </button>
            )}

            {saveErr && <div style={{ fontSize:12, color:"#dc2626", textAlign:"center" }}>⚠ {saveErr}</div>}
            {saved && <a href="/dashboard" style={{ fontSize:12, color:"#16a34a", textAlign:"center", textDecoration:"none", fontWeight:600 }}>Voir mon dashboard →</a>}
          </>
        )
      )}
    </div>
  );
}