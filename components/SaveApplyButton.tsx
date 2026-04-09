"use client";
import React from "react";
import { ExternalLink } from "lucide-react";

export function SaveApplyButton({ job }: { job: any }) {
  const [state,    setState]    = React.useState<"idle"|"saving"|"saved"|"error">("idle");
  const [authed,   setAuthed]   = React.useState<boolean|null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({ name:"", email:"", message:"" });
  const [formSent, setFormSent] = React.useState(false);
  const [formErr,  setFormErr]  = React.useState<string|null>(null);

  // Is this an employer-direct job with no real external URL?
  const isDirectJob =
    !job.original_url ||
    job.original_url === "https://talentmaroc.shop" ||
    job.original_url === "https://talentmaroc.shop/" ||
    job.original_url.endsWith("/jobs") ||
    job.source === "employer_direct";

  React.useEffect(() => {
    import("@supabase/supabase-js").then(({ createClient }) => {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      sb.auth.getUser().then(({ data: { user } }) => {
        setAuthed(!!user);
        if (user) {
          setFormData(p => ({
            ...p,
            email: user.email || "",
            name:  user.user_metadata?.name || "",
          }));
        }
      });
    });
  }, []);

  const saveApplication = async () => {
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
  };

  const handleApply = async () => {
    if (authed === false) {
      window.location.href = `/auth/login?redirect=/jobs/${job.id}`;
      return;
    }
    if (isDirectJob) {
      setShowForm(true);
      return;
    }
    setState("saving");
    const ok = await saveApplication();
    if (ok) {
      setState("saved");
      window.open(job.original_url, "_blank", "noopener,noreferrer");
    } else {
      setState("error");
    }
  };

  const submitForm = async () => {
    setFormErr(null);
    if (!formData.name.trim())  { setFormErr("Votre nom est requis."); return; }
    if (!formData.email.trim()) { setFormErr("Votre email est requis."); return; }

    setState("saving");
    try {
      if (authed) await saveApplication();
      const subject = encodeURIComponent(`Candidature : ${job.title} — TalentMaroc`);
      const body    = encodeURIComponent(
        `Bonjour,\n\nJe souhaite postuler au poste de ${job.title} chez ${job.company}.\n\nNom : ${formData.name}\nEmail : ${formData.email}\n\nMessage :\n${formData.message}\n\n— Envoyé via TalentMaroc`
      );
      window.location.href = `mailto:contact@talentmaroc.shop?subject=${subject}&body=${body}`;
      setState("saved");
      setFormSent(true);
      setShowForm(false);
    } catch {
      setState("error");
      setFormErr("Erreur lors de l'envoi. Réessayez.");
    }
  };

  if (authed === null) return null;

  const btnStyle: React.CSSProperties = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
    padding:"11px 20px", borderRadius:10, fontSize:13, fontWeight:600,
    cursor:"pointer", fontFamily:"inherit", transition:"all .18s", width:"100%", border:"none",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

      {/* On-platform form for employer-direct jobs */}
      {showForm && (
        <div style={{ background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:12, padding:"20px", marginBottom:4 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0f172a", marginBottom:4 }}>
            📋 Postuler à {job.title}
          </div>
          <div style={{ fontSize:12, color:"#6b7280", marginBottom:16, lineHeight:1.5 }}>
            Chez <strong>{job.company}</strong> · {job.city}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Prénom et Nom *</label>
              <input value={formData.name} onChange={e=>setFormData(p=>({...p,name:e.target.value}))}
                placeholder="Youssef Benali"
                style={{ border:"1.5px solid #e5e7eb", borderRadius:8, padding:"9px 12px", width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"white", outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Email *</label>
              <input type="email" value={formData.email} onChange={e=>setFormData(p=>({...p,email:e.target.value}))}
                placeholder="youssef@email.ma"
                style={{ border:"1.5px solid #e5e7eb", borderRadius:8, padding:"9px 12px", width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"white", outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Message de motivation</label>
              <textarea value={formData.message} onChange={e=>setFormData(p=>({...p,message:e.target.value}))}
                rows={4} placeholder="Présentez-vous brièvement et expliquez votre intérêt pour ce poste…"
                style={{ border:"1.5px solid #e5e7eb", borderRadius:8, padding:"9px 12px", width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"white", outline:"none", resize:"vertical", lineHeight:1.6, boxSizing:"border-box" }}/>
            </div>
            {formErr && (
              <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:7, padding:"8px 12px", fontSize:12, color:"#dc2626" }}>
                ⚠ {formErr}
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowForm(false)}
                style={{ flex:1, padding:"10px", borderRadius:8, border:"1.5px solid #e5e7eb", background:"white", fontSize:13, fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>
                Annuler
              </button>
              <button onClick={submitForm} disabled={state==="saving"}
                style={{ flex:2, padding:"10px", borderRadius:8, border:"none", background:"#16a34a", fontSize:13, fontWeight:700, color:"white", cursor:"pointer", fontFamily:"inherit", opacity:state==="saving"?0.7:1 }}>
                {state==="saving" ? "Envoi…" : "📨 Envoyer ma candidature"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main CTA button */}
      {!formSent ? (
        <button
          onClick={handleApply}
          disabled={state==="saving" || state==="saved"}
          style={{
            ...btnStyle,
            background: state==="saved" ? "#15803d" : "#16a34a",
            color: "white",
            opacity: state==="saving" ? 0.7 : 1,
            cursor: state==="saved" ? "default" : "pointer",
          }}
        >
          {state==="saving" ? "Envoi en cours…"
            : state==="saved" ? "✓ Candidature envoyée !"
            : isDirectJob
              ? (authed ? "📋 Postuler à cette offre" : "🔐 Connexion pour postuler")
              : (authed ? "Postuler sur le site" : "🔐 Connexion pour postuler")}
          {state==="idle" && !isDirectJob && <ExternalLink size={15}/>}
        </button>
      ) : (
        <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#15803d", marginBottom:4 }}>🎉 Candidature envoyée !</div>
          <div style={{ fontSize:12, color:"#15803d" }}>Le recruteur vous contactera par email.</div>
        </div>
      )}

      {/* Save & track button for external jobs */}
      {!isDirectJob && !formSent && authed && (
        <button
          onClick={async () => {
            setState("saving");
            const ok = await saveApplication();
            setState(ok ? "saved" : "error");
          }}
          disabled={state==="saving" || state==="saved"}
          style={{
            ...btnStyle,
            background: state==="saved" ? "#f0fdf4" : "white",
            color:       state==="saved" ? "#15803d" : "#374151",
            border:      `1.5px solid ${state==="saved" ? "#bbf7d0" : "#e5e7eb"}`,
            cursor:      state==="saved" ? "default" : "pointer",
          }}
        >
          {state==="saving" ? "Sauvegarde…"
            : state==="saved" ? "✓ Sauvegardée dans votre dashboard"
            : state==="error" ? "Erreur — réessayez"
            : "📋 Sauvegarder & suivre"}
        </button>
      )}

      {state==="saved" && !isDirectJob && (
        <a href="/dashboard" style={{ fontSize:12, color:"#16a34a", textAlign:"center", textDecoration:"none", fontWeight:600 }}>
          Voir mon dashboard →
        </a>
      )}
    </div>
  );
}