"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

interface JobForm {
  title: string; company: string; city: string; sector: string;
  contract_type: string; salary: string; description: string;
  original_url: string; logo_url: string;
}
const EMPTY: JobForm = {
  title:"", company:"", city:"", sector:"", contract_type:"",
  salary:"", description:"", original_url:"", logo_url:"",
};
const CITIES    = ["Casablanca","Rabat","Tanger","Marrakech","Agadir","Fès","Meknès","Oujda","Kenitra","Tétouan","Autre"];
const SECTORS   = ["Informatique","Finance","Commerce","Marketing","RH","Ingénierie","Santé","Logistique","Tourisme","Juridique","Éducation","BTP","Industrie","Autre"];
const CONTRACTS = ["CDI","CDD","Stage","Alternance","Freelance","Temps partiel","Intérim"];

// ── OUTSIDE COMPONENT: prevents remount/typing bug ─────────────────────────
function Field({ label, required, children }: { label:string; required?:boolean; children:React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>
        {label}{required && <span style={{ color:"#ef4444", marginLeft:3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}
const IS: React.CSSProperties = {
  border:"1.5px solid #e5e7eb", borderRadius:9, padding:"11px 14px",
  width:"100%", fontSize:14, fontFamily:"inherit", color:"#0f172a",
  background:"white", outline:"none",
};

// ── AUTH PANEL — also outside ──────────────────────────────────────────────
function AuthPanel({ onSuccess }: { onSuccess:(u:any)=>void }) {
  const [mode, setMode]       = useState<"login"|"signup">("login");
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string|null>(null);

  const submit = async () => {
    if (!email || !pass) { setError("Email et mot de passe requis."); return; }
    setLoading(true); setError(null);
    const sb = getSupabase();
    try {
      if (mode === "login") {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        onSuccess(data.user);
      } else {
        const { data, error } = await sb.auth.signUp({
          email, password: pass, options: { data: { name } }
        });
        if (error) throw error;
        if (!data.user) throw new Error("Vérifiez votre email pour confirmer votre compte.");
        onSuccess(data.user);
      }
    } catch(e:any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background:"white", border:"1.5px solid #f0f0f0", borderRadius:16, overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,.08)", maxWidth:480, margin:"0 auto" }}>
      <div style={{ padding:"36px 36px 32px" }}>
        <div style={{ fontSize:32, marginBottom:14, textAlign:"center" }}>🏢</div>
        <h2 style={{ fontSize:22, fontWeight:800, marginBottom:6, textAlign:"center" }}>Espace Recruteur</h2>
        <p style={{ fontSize:13, color:"#6b7280", marginBottom:28, textAlign:"center", lineHeight:1.6 }}>
          Connectez-vous pour publier vos offres et gérer vos recrutements.
        </p>
        {/* Toggle */}
        <div style={{ display:"flex", gap:4, background:"#f3f4f6", borderRadius:10, padding:4, marginBottom:24 }}>
          {(["login","signup"] as const).map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError(null);}}
              style={{ flex:1, padding:"10px", borderRadius:8, border:"none", fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer",
                background:mode===m?"white":"transparent", color:mode===m?"#0f172a":"#6b7280",
                boxShadow:mode===m?"0 1px 4px rgba(0,0,0,.1)":"none", transition:"all .18s" }}>
              {m==="login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {mode==="signup" && (
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Nom de l'entreprise</label>
              <input style={IS} placeholder="Capgemini Maroc" value={name} onChange={e=>setName(e.target.value)}/>
            </div>
          )}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Email *</label>
            <input type="email" style={IS} placeholder="rh@entreprise.ma" value={email}
              onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Mot de passe *</label>
            <input type="password" style={IS} placeholder="••••••••" value={pass}
              onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          {error && (
            <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#dc2626" }}>⚠ {error}</div>
          )}
          <button disabled={loading} onClick={submit}
            style={{ background:"#16a34a", color:"white", padding:"13px", borderRadius:10, border:"none", fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, marginTop:4 }}>
            {loading ? "…" : mode==="login" ? "Se connecter →" : "Créer mon compte →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function EmployeurPage() {
  const [user,       setUser]       = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState<JobForm>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState<string|null>(null);

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data:{ user } }) => {
      setUser(user); setLoading(false);
    });
  }, []);

  // Stable setter — doesn't cause remount
  const set = useCallback((k: keyof JobForm) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value })),
  []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!form.title.trim())   { setError("Le titre du poste est requis."); return; }
    if (!form.company.trim()) { setError("Le nom de l'entreprise est requis."); return; }
    if (!form.city)           { setError("La ville est requise."); return; }
    if (!form.contract_type)  { setError("Le type de contrat est requis."); return; }

    setSubmitting(true);
    try {
      const sb = getSupabase();
      const { error: err } = await sb.from("jobs").insert({
        title:         form.title.trim(),
        company:       form.company.trim(),
        city:          form.city,
        sector:        form.sector || null,
        contract_type: form.contract_type,
        salary:        form.salary.trim() || null,
        description:   form.description.trim() || null,
        original_url:  form.original_url.trim() || "https://talentmaroc.shop",
        logo_url:      form.logo_url.trim() || null,
        posted_at:     new Date().toLocaleDateString("fr-FR"),
        employer_id:   user?.id || null,
        source:        "employer_direct",
        featured:      false,
      });
      if (err) throw err;
      setSuccess(true);
      setForm(EMPTY);
      window.scrollTo({ top:0, behavior:"smooth" });
    } catch(e:any) {
      setError(e.message || "Erreur lors de la publication.");
    } finally {
      setSubmitting(false);
    }
  }, [form, user]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ width:32, height:32, border:"3px solid #e5e7eb", borderTopColor:"#16a34a", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f8fafc;color:#0f172a}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .au{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) both}
        input:focus,select:focus,textarea:focus{border-color:#16a34a!important;box-shadow:0 0 0 3px rgba(22,163,74,.1)!important;outline:none!important}
        .nl{color:#4b5563;text-decoration:none;font-size:14px;font-weight:600;padding:7px 12px;border-radius:8px;transition:all .18s}
        .nl:hover{color:#0f172a;background:#f3f4f6}
        @media(max-width:640px){.two-col{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{ background:"#f8fafc", minHeight:"100vh" }}>
        {/* NAVBAR */}
        <nav style={{ background:"rgba(255,255,255,.96)", backdropFilter:"blur(12px)", borderBottom:"1.5px solid #f0f0f0", padding:"0 24px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
            <div style={{ width:34, height:34, background:"#16a34a", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:"white" }}>T</div>
            <span style={{ color:"#0f172a", fontWeight:800, fontSize:16 }}>TalentMaroc</span>
          </a>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <a href="/" className="nl">Emplois</a>
            {user && (
              <a href="/employeur/dashboard" style={{ fontSize:13, fontWeight:700, color:"#16a34a", background:"#f0fdf4", border:"1px solid #bbf7d0", padding:"7px 14px", borderRadius:8, textDecoration:"none" }}>
                📊 Dashboard →
              </a>
            )}
            {user && (
              <button onClick={()=>{ getSupabase().auth.signOut(); setUser(null); setSuccess(false); }}
                style={{ background:"none", border:"1.5px solid #e5e7eb", borderRadius:8, padding:"7px 14px", fontSize:13, fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>
                Déconnexion
              </button>
            )}
          </div>
        </nav>

        {/* HERO */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", padding:"52px 24px 56px", textAlign:"center" }}>
          <h1 className="au" style={{ fontSize:"clamp(24px,4vw,38px)", fontWeight:800, color:"white", lineHeight:1.15, marginBottom:10, letterSpacing:"-0.02em" }}>
            {user ? `Bonjour ${user.user_metadata?.name || user.email?.split("@")[0]} 👋` : "Recrutez vos talents au Maroc"}
          </h1>
          <p className="au" style={{ fontSize:14, color:"rgba(255,255,255,.55)", maxWidth:420, margin:"0 auto", lineHeight:1.7, animationDelay:".1s" }}>
            {user ? "Publiez une offre ou gérez vos recrutements depuis votre dashboard." : "Créez un compte recruteur pour accéder à la plateforme."}
          </p>
        </div>

        <div style={{ maxWidth:820, margin:"0 auto", padding:"36px 20px 80px" }}>

          {/* NOT LOGGED IN → show auth only */}
          {!user && (
            <div className="au"><AuthPanel onSuccess={u=>setUser(u)}/></div>
          )}

          {/* LOGGED IN → show form */}
          {user && (
            <div className="au">
              {success && (
                <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:12, padding:"18px 22px", marginBottom:24, display:"flex", alignItems:"center", gap:14 }}>
                  <span style={{ fontSize:24 }}>🎉</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:"#15803d", marginBottom:2 }}>Offre publiée avec succès !</div>
                    <div style={{ fontSize:13, color:"#15803d" }}>Visible par les candidats · <a href="/employeur/dashboard" style={{ fontWeight:700, color:"#15803d" }}>Gérer mes offres →</a></div>
                  </div>
                  <button onClick={()=>setSuccess(false)} style={{ marginLeft:"auto", background:"none", border:"none", fontSize:20, color:"#9ca3af", cursor:"pointer", lineHeight:1 }}>×</button>
                </div>
              )}

              <div style={{ background:"white", border:"1.5px solid #f0f0f0", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)", marginBottom:16 }}>
                <div style={{ padding:"20px 28px", borderBottom:"1.5px solid #f0f0f0", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                  <div>
                    <h2 style={{ fontSize:16, fontWeight:800 }}>Publier une nouvelle offre</h2>
                    <p style={{ fontSize:13, color:"#6b7280", marginTop:2 }}>Tous les champs marqués * sont obligatoires</p>
                  </div>
                  <span style={{ fontSize:12, background:"#f0fdf4", color:"#15803d", border:"1px solid #bbf7d0", padding:"4px 12px", borderRadius:100 }}>✓ {user.email}</span>
                </div>

                <div style={{ padding:"28px", display:"flex", flexDirection:"column", gap:20 }}>
                  <div className="two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <Field label="Intitulé du poste" required>
                      <input style={IS} placeholder="Développeur Full Stack" value={form.title} onChange={set("title")}/>
                    </Field>
                    <Field label="Entreprise" required>
                      <input style={IS} placeholder="Capgemini Maroc" value={form.company} onChange={set("company")}/>
                    </Field>
                  </div>
                  <div className="two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <Field label="Ville" required>
                      <select style={IS} value={form.city} onChange={set("city")}>
                        <option value="">Sélectionnez...</option>
                        {CITIES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Secteur">
                      <select style={IS} value={form.sector} onChange={set("sector")}>
                        <option value="">Sélectionnez...</option>
                        {SECTORS.map(s=><option key={s}>{s}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <Field label="Type de contrat" required>
                      <select style={IS} value={form.contract_type} onChange={set("contract_type")}>
                        <option value="">Sélectionnez...</option>
                        {CONTRACTS.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Salaire">
                      <input style={IS} placeholder="8 000 – 12 000 DH / mois" value={form.salary} onChange={set("salary")}/>
                    </Field>
                  </div>
                  <Field label="Description du poste">
                    <textarea style={{ ...IS, resize:"vertical", lineHeight:1.65 } as React.CSSProperties} rows={7}
                      placeholder={"Missions :\n• Mission 1\n\nProfil recherché :\n• Critère 1\n\nAvantages :\n• ..."}
                      value={form.description} onChange={set("description")}/>
                  </Field>
                  <div className="two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <Field label="Lien de candidature">
                      <input style={IS} placeholder="https://votresite.ma/postuler" value={form.original_url} onChange={set("original_url")}/>
                    </Field>
                    <Field label="URL du logo">
                      <input style={IS} placeholder="https://...logo.png" value={form.logo_url} onChange={set("logo_url")}/>
                      {form.logo_url && (
                        <img src={form.logo_url} alt="" style={{ width:36, height:36, borderRadius:6, objectFit:"contain", marginTop:8, border:"1px solid #e5e7eb" }}
                          onError={e=>(e.currentTarget.style.display="none")}/>
                      )}
                    </Field>
                  </div>
                  {error && (
                    <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:8, padding:"12px 16px", fontSize:13, color:"#dc2626" }}>⚠ {error}</div>
                  )}
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:10, paddingTop:4 }}>
                    <button onClick={()=>{ setForm(EMPTY); setError(null); }}
                      style={{ background:"none", border:"1.5px solid #e5e7eb", borderRadius:9, padding:"11px 20px", fontSize:14, fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>
                      Réinitialiser
                    </button>
                    <button onClick={handleSubmit} disabled={submitting}
                      style={{ background:"#16a34a", color:"white", padding:"11px 24px", borderRadius:9, border:"none", fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:7, opacity:submitting?0.7:1, transition:"all .18s" }}>
                      {submitting ? "Publication…" : "📢 Publier l'offre →"}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ textAlign:"center" }}>
                <a href="/employeur/dashboard" style={{ fontSize:13, color:"#16a34a", fontWeight:600, textDecoration:"none" }}>
                  📊 Gérer mes offres et candidatures →
                </a>
              </div>
            </div>
          )}
        </div>
        <footer style={{ background:"#0f172a", padding:"20px 24px", textAlign:"center" }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.25)" }}>© 2026 Talent Maroc</span>
        </footer>
      </div>
    </>
  );
}