"use client";
import React from "react";
import { ExternalLink } from "lucide-react";

const MOBILE_STYLE = `
  @media(max-width:600px) {
    .sab-name-grid { grid-template-columns:1fr !important; }
    .sab-form-btns { flex-direction:column !important; }
    .sab-form-btns button { flex:none !important; }
  }
`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _sb: any = null;
function getSB() {
  if (!_sb) {
    const { createClient } = require("@supabase/supabase-js");
    _sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return _sb;
}

const IS: React.CSSProperties = {
  border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "9px 12px",
  width: "100%", fontSize: 13, fontFamily: "inherit", outline: "none",
  boxSizing: "border-box", color: "#0f172a", background: "white",
};

export function SaveApplyButton({ job }: { job: any }) {
  const [user,        setUser]        = React.useState<any>(undefined);
  const [token,       setToken]       = React.useState<string>("");
  const [saved,       setSaved]       = React.useState(false);
  const [saving,      setSaving]      = React.useState(false);
  const [showForm,    setShowForm]    = React.useState(false);
  const [formSent,    setFormSent]    = React.useState(false);
  const [formErr,     setFormErr]     = React.useState<string|null>(null);
  const [saveErr,     setSaveErr]     = React.useState<string|null>(null);

  // Form fields — pre-filled from profile
  const [candName,    setCandName]    = React.useState("");
  const [candEmail,   setCandEmail]   = React.useState("");
  const [coverLetter, setCoverLetter] = React.useState("");
  const [userCvUrl,   setUserCvUrl]   = React.useState<string|null>(null);
  const [userCvName,  setUserCvName]  = React.useState<string|null>(null);

  const isDirectJob =
    !job.original_url ||
    job.original_url === "https://talentmaroc.shop" ||
    job.original_url === "https://talentmaroc.shop/" ||
    job.original_url.endsWith("/jobs") ||
    job.source === "employer";

  React.useEffect(() => {
    const sb = getSB();
    sb.auth.getSession().then(({ data: { session } }: any) => {
      if (session) {
        setUser(session.user);
        setToken(session.access_token);

        const meta = session.user.user_metadata || {};
        const name  = meta.name  || session.user.email?.split("@")[0] || "";
        const email = session.user.email || "";
        const cvUrl = meta.cv_url || null;

        setCandName(name);
        setCandEmail(email);
        setUserCvUrl(cvUrl);
        setUserCvName(meta.cv_filename || (cvUrl ? "CV importé" : null));

        // Pre-fill cover letter template
        setCoverLetter(
          `Madame, Monsieur,\n\n` +
          `Je me permets de vous adresser ma candidature pour le poste de ${job.title} au sein de ${job.company}.\n\n` +
          `[Rédigez ici votre lettre de motivation : pourquoi ce poste vous intéresse, ce que vous apportez…]\n\n` +
          `Dans l'attente de votre retour, je reste disponible pour tout entretien.\n\n` +
          `Cordialement,\n${name}`
        );

        // Auto-open form when coming back from login
        if (document.referrer.includes("/auth/login")) {
          if (isDirectJob) setTimeout(() => setShowForm(true), 400);
          else setTimeout(() => doSave(session.access_token), 400);
        }
      } else {
        setUser(null);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save job to track (external jobs)
  const doSave = async (accessToken: string) => {
    setSaveErr(null); setSaving(true);
    try {
      const res = await fetch("/api/save-application", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
        body: JSON.stringify({
          job_id: job.id, job_title: job.title, company: job.company,
          city: job.city, original_url: job.original_url,
          logo_url: job.logo_url || null, status: "saved",
        }),
      });
      if (res.ok) setSaved(true);
      else { const e = await res.json().catch(()=>({})); setSaveErr(e.error || "Erreur."); }
    } catch { setSaveErr("Erreur réseau."); }
    finally { setSaving(false); }
  };

  // Submit direct-job application
  const submitApplication = async () => {
    setFormErr(null);
    if (!candName.trim()) { setFormErr("Votre nom est requis."); return; }
    if (!coverLetter.trim()) { setFormErr("Veuillez rédiger une lettre de motivation."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/save-application", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          job_id:         job.id,
          job_title:      job.title,
          company:        job.company,
          city:           job.city,
          original_url:   job.original_url,
          logo_url:       job.logo_url || null,
          status:         "applied",
          cover_letter:   coverLetter.trim(),
          candidate_name:  candName.trim(),
          candidate_email: candEmail.trim() || null,
        }),
      });
      if (res.ok) { setFormSent(true); setShowForm(false); }
      else { const e = await res.json().catch(()=>({})); setFormErr(e.error || "Erreur lors de l'envoi."); }
    } catch { setFormErr("Erreur réseau. Réessayez."); }
    finally { setSaving(false); }
  };

  const loginRedirect = () => { window.location.href = `/auth/login?redirect=/jobs/${job.id}`; };

  const btnBase: React.CSSProperties = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
    padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:700,
    cursor:"pointer", fontFamily:"inherit", width:"100%", border:"none", transition:"all .18s",
  };

  if (user === undefined) return (
    <div style={{ padding:"12px", background:"#f3f4f6", borderRadius:10, textAlign:"center", fontSize:13, color:"#9ca3af" }}>
      Chargement…
    </div>
  );

  // Employers can view jobs but cannot apply or save them
  if (user?.user_metadata?.role === "employer") return (
    <div style={{ background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"12px 15px", textAlign:"center" }}>
      <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", marginBottom:4 }}>Espace recruteur</div>
      <div style={{ fontSize:12, color:"#9ca3af", lineHeight:1.5 }}>
        Les comptes recruteurs ne peuvent pas postuler aux offres.
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <style>{MOBILE_STYLE}</style>

      {/* ── APPLICATION FORM (direct jobs) ── */}
      {showForm && !formSent && (
        <div style={{ background:"white", border:"1.5px solid #e5e7eb", borderRadius:14, overflow:"hidden", marginBottom:4, boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>

          {/* Header */}
          <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", padding:"16px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:"white" }}>📋 Postuler — {job.title}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", marginTop:2 }}>{job.company} · {job.city}</div>
            </div>
            <button onClick={()=>setShowForm(false)}
              style={{ background:"rgba(255,255,255,.1)", border:"none", color:"white", fontSize:18, width:30, height:30, borderRadius:7, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              ×
            </button>
          </div>

          <div style={{ padding:"18px", display:"flex", flexDirection:"column", gap:14 }}>

            {/* Profile summary */}
            <div style={{ background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>
                Votre profil
              </div>
              <div className="sab-name-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:"#6b7280", display:"block", marginBottom:4 }}>Nom complet *</label>
                  <input value={candName} onChange={e=>setCandName(e.target.value)}
                    placeholder="Youssef Benali" style={IS}/>
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:"#6b7280", display:"block", marginBottom:4 }}>
                    Email <span style={{ fontWeight:400, color:"#9ca3af" }}>(optionnel)</span>
                  </label>
                  <input type="email" value={candEmail} onChange={e=>setCandEmail(e.target.value)}
                    placeholder="vous@email.ma" style={IS}/>
                </div>
              </div>
            </div>

            {/* CV status */}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:8 }}>
                CV joint à la candidature
              </label>
              {userCvUrl ? (
                <div style={{ display:"flex", alignItems:"center", gap:10, background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:9, padding:"10px 13px" }}>
                  <span style={{ fontSize:18 }}>📄</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#15803d" }}>{userCvName || "Mon CV"}</div>
                    <div style={{ fontSize:11, color:"#4b7c59" }}>Votre CV importé sera joint automatiquement</div>
                  </div>
                  <a href={userCvUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, color:"#16a34a", textDecoration:"none", fontWeight:600, background:"white", border:"1px solid #bbf7d0", padding:"4px 10px", borderRadius:6 }}>
                    Voir →
                  </a>
                </div>
              ) : (
                <div style={{ background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:9, padding:"10px 13px", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:16 }}>⚠️</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#92400e" }}>Aucun CV importé</div>
                    <div style={{ fontSize:11, color:"#78350f" }}>Importez un CV depuis votre dashboard pour l'attacher à vos candidatures.</div>
                  </div>
                  <a href="/dashboard" target="_blank"
                    style={{ fontSize:11, color:"#92400e", textDecoration:"none", fontWeight:600, background:"#fef3c7", border:"1px solid #fde68a", padding:"4px 10px", borderRadius:6, whiteSpace:"nowrap" }}>
                    Importer →
                  </a>
                </div>
              )}
            </div>

            {/* Cover letter */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.07em" }}>
                  Lettre de motivation *
                </label>
                <span style={{ fontSize:10, color:"#9ca3af" }}>{coverLetter.length} caractères</span>
              </div>
              <textarea
                value={coverLetter}
                onChange={e=>setCoverLetter(e.target.value)}
                rows={9}
                style={{ ...IS, resize:"vertical", lineHeight:1.7, fontSize:12 }}
              />
            </div>

            {formErr && (
              <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:8, padding:"9px 13px", fontSize:12, color:"#dc2626" }}>
                ⚠ {formErr}
              </div>
            )}

            <div className="sab-form-btns" style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowForm(false)}
                style={{ flex:1, padding:"11px", borderRadius:9, border:"1.5px solid #e5e7eb", background:"white", fontSize:13, fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>
                Annuler
              </button>
              <button onClick={submitApplication} disabled={saving}
                style={{ flex:2, padding:"11px", borderRadius:9, border:"none", background: saving ? "#86efac" : "#16a34a", fontSize:13, fontWeight:700, color:"white", cursor: saving ? "not-allowed" : "pointer", fontFamily:"inherit", transition:"background .18s" }}>
                {saving ? "Envoi en cours…" : "📨 Envoyer ma candidature"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {formSent && (
        <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:11, padding:"18px 16px", textAlign:"center" }}>
          <div style={{ fontSize:22, marginBottom:8 }}>🎉</div>
          <div style={{ fontSize:14, fontWeight:800, color:"#15803d", marginBottom:4 }}>Candidature envoyée !</div>
          <div style={{ fontSize:12, color:"#4b7c59", lineHeight:1.6 }}>
            Votre CV et votre lettre de motivation ont été transmis au recruteur.
          </div>
          <a href="/dashboard" style={{ display:"inline-block", marginTop:12, fontSize:12, color:"#16a34a", fontWeight:700, textDecoration:"none" }}>
            Suivre ma candidature →
          </a>
        </div>
      )}

      {!formSent && (
        isDirectJob ? (
          <button
            onClick={()=>{ if(!user){loginRedirect();return;} setShowForm(p=>!p); }}
            disabled={saving}
            style={{ ...btnBase, background: showForm ? "#0f172a" : "#16a34a", color:"white" }}>
            {user
              ? (showForm ? "✕ Fermer le formulaire" : "📋 Postuler à cette offre")
              : "🔐 Connexion pour postuler"}
          </button>
        ) : (
          <>
            <a href={job.original_url} target="_blank" rel="noopener noreferrer"
              style={{ ...btnBase, background:"#16a34a", color:"white", textDecoration:"none" }}>
              Postuler sur le site <ExternalLink size={14}/>
            </a>

            {user ? (
              <button
                onClick={()=>{ if(!saved && !saving) doSave(token); }}
                disabled={saving || saved}
                style={{ ...btnBase,
                  background: saved ? "#f0fdf4" : "white",
                  color:      saved ? "#15803d" : "#374151",
                  border:     `1.5px solid ${saved ? "#bbf7d0" : "#e5e7eb"}`,
                  cursor:     saved || saving ? "default" : "pointer",
                  opacity:    saving ? 0.7 : 1,
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
