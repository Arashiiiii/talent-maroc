"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── TYPES ──────────────────────────────────────────────────────────────────
interface JobForm {
  title:         string;
  company:       string;
  city:          string;
  sector:        string;
  contract_type: string;
  salary:        string;
  description:   string;
  original_url:  string;
  logo_url:      string;
}

const EMPTY_FORM: JobForm = {
  title:"", company:"", city:"", sector:"", contract_type:"",
  salary:"", description:"", original_url:"", logo_url:"",
};

const CITIES = ["Casablanca","Rabat","Tanger","Marrakech","Agadir","Fès","Meknès","Oujda","Kenitra","Tétouan","Autre"];
const SECTORS = ["Informatique","Finance","Commerce","Marketing","RH","Ingénierie","Santé","Logistique","Tourisme","Juridique","Éducation","BTP","Industrie","Autre"];
const CONTRACTS = ["CDI","CDD","Stage","Alternance","Freelance","Temps partiel","Intérim"];

export default function EmployeurPage() {
  const [user,      setUser]      = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [form,      setForm]      = useState<JobForm>(EMPTY_FORM);
  const [submitting,setSubmitting] = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"publish"|"login">("publish");
  const [authForm,  setAuthForm]  = useState({ email:"", password:"", name:"" });
  const [authMode,  setAuthMode]  = useState<"login"|"signup">("login");
  const [authLoading,setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string|null>(null);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  const handleAuth = async () => {
    setAuthLoading(true); setAuthError(null);
    const sb = getSupabase();
    try {
      if (authMode === "login") {
        const { data, error } = await sb.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
        if (error) throw error;
        setUser(data.user);
        setActiveTab("publish");
      } else {
        const { data, error } = await sb.auth.signUp({
          email: authForm.email, password: authForm.password,
          options: { data: { name: authForm.name } }
        });
        if (error) throw error;
        setUser(data.user);
        setActiveTab("publish");
      }
    } catch(e: any) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async () => {
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
        original_url:  form.original_url.trim() || `https://talentmaroc.shop/jobs`,
        logo_url:      form.logo_url.trim() || null,
        posted_at:     new Date().toLocaleDateString("fr-FR"),
        featured:      false,
        source:        "employer_direct",
        employer_id:   user?.id || null,
      });
      if (err) throw err;
      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch(e: any) {
      setError(e.message || "Erreur lors de la publication.");
    } finally {
      setSubmitting(false);
    }
  };

  const F = ({ label, id, required, children }: { label:string; id:string; required?:boolean; children:React.ReactNode }) => (
    <div>
      <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>
        {label} {required && <span style={{ color:"#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    border:"1.5px solid #e5e7eb", borderRadius:9, padding:"11px 14px",
    width:"100%", fontSize:14, fontFamily:"inherit", color:"#0f172a",
    background:"white", transition:"border-color .18s", outline:"none",
  };

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
        input:focus,select:focus,textarea:focus{border-color:#16a34a!important;box-shadow:0 0 0 3px rgba(22,163,74,.1)!important;outline:none}
        .tab-btn{padding:10px 22px;border-radius:9px;border:none;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:all .18s}
        .nl{color:#4b5563;text-decoration:none;font-size:14px;font-weight:600;padding:7px 12px;border-radius:8px;transition:all .18s}
        .nl:hover{color:#0f172a;background:#f3f4f6}
        .btn-green{display:inline-flex;align-items:center;justify-content:center;gap:7px;background:#16a34a;color:white;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .18s}
        .btn-green:hover{background:#15803d;transform:translateY(-1px);box-shadow:0 6px 20px rgba(22,163,74,.25)}
        .btn-green:disabled{background:#d1d5db;cursor:not-allowed;transform:none;box-shadow:none}
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
            {user && <a href="/employeur/dashboard" className="nl">Dashboard →</a>}
            {user && (
              <button onClick={()=>{ getSupabase().auth.signOut(); setUser(null); }} className="nl" style={{ border:"none", cursor:"pointer", background:"none" }}>
                Déconnexion
              </button>
            )}
          </div>
        </nav>

        {/* HERO */}
        <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", padding:"56px 24px 60px", textAlign:"center" }}>
          <div className="au" style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(22,163,74,.15)", border:"1px solid rgba(22,163,74,.3)", borderRadius:100, padding:"5px 14px", marginBottom:18 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block" }}/>
            <span style={{ fontSize:12, fontWeight:700, color:"#4ade80" }}>Recruteurs — Publiez gratuitement</span>
          </div>
          <h1 className="au" style={{ fontSize:"clamp(26px,4vw,42px)", fontWeight:800, color:"white", lineHeight:1.15, marginBottom:14, letterSpacing:"-0.02em", animationDelay:".07s" }}>
            Trouvez vos talents<br/>au Maroc rapidement
          </h1>
          <p className="au" style={{ fontSize:15, color:"rgba(255,255,255,.6)", maxWidth:460, margin:"0 auto 28px", lineHeight:1.7, animationDelay:".14s" }}>
            Publiez votre offre en 5 minutes. Visibilité immédiate auprès de 320 000+ candidats actifs.
          </p>
          <div className="au" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", animationDelay:".2s" }}>
            {[["⚡ Mise en ligne instantanée"], ["🎯 Candidats qualifiés"], ["📊 Dashboard temps réel"]].map(([t])=>(
              <div key={t} style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:100, padding:"6px 16px", fontSize:12, fontWeight:600, color:"rgba(255,255,255,.75)" }}>{t}</div>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <div style={{ maxWidth:820, margin:"0 auto", padding:"36px 20px 80px" }}>

          {/* Auth tabs if not logged in */}
          {!user && (
            <div className="au" style={{ background:"white", border:"1.5px solid #f0f0f0", borderRadius:14, overflow:"hidden", marginBottom:24, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
              <div style={{ display:"flex", borderBottom:"1.5px solid #f0f0f0" }}>
                {[["publish","📋 Publier une offre"],["login","🔐 Se connecter"]].map(([t,l])=>(
                  <button key={t} className="tab-btn" onClick={()=>setActiveTab(t as any)}
                    style={{ flex:1, borderRadius:0, background:activeTab===t?"#f0fdf4":"white", color:activeTab===t?"#15803d":"#6b7280", borderBottom:activeTab===t?"2px solid #16a34a":"none" }}>
                    {l}
                  </button>
                ))}
              </div>
              {activeTab==="login" && (
                <div style={{ padding:"28px 32px" }}>
                  <div style={{ display:"flex", gap:8, background:"#f3f4f6", borderRadius:9, padding:4, marginBottom:20, width:"fit-content" }}>
                    {[["login","Connexion"],["signup","Inscription"]].map(([m,l])=>(
                      <button key={m} onClick={()=>setAuthMode(m as any)}
                        style={{ padding:"8px 20px", borderRadius:7, border:"none", fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer", background:authMode===m?"white":"transparent", color:authMode===m?"#0f172a":"#6b7280", boxShadow:authMode===m?"0 1px 3px rgba(0,0,0,.1)":"none" }}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:400 }}>
                    {authMode==="signup" && (
                      <div>
                        <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>Nom de l'entreprise</label>
                        <input style={inputStyle} placeholder="Capgemini Maroc" value={authForm.name} onChange={e=>setAuthForm(p=>({...p,name:e.target.value}))}/>
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>Email</label>
                      <input type="email" style={inputStyle} placeholder="rh@entreprise.ma" value={authForm.email} onChange={e=>setAuthForm(p=>({...p,email:e.target.value}))}/>
                    </div>
                    <div>
                      <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>Mot de passe</label>
                      <input type="password" style={inputStyle} placeholder="••••••••" value={authForm.password} onChange={e=>setAuthForm(p=>({...p,password:e.target.value}))}/>
                    </div>
                    {authError && <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#dc2626" }}>⚠ {authError}</div>}
                    <button className="btn-green" onClick={handleAuth} disabled={authLoading} style={{ alignSelf:"flex-start" }}>
                      {authLoading ? "..." : authMode==="login" ? "Se connecter →" : "Créer mon compte →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div className="au" style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:12, padding:"20px 24px", marginBottom:24, display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ fontSize:28 }}>🎉</span>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:"#15803d", marginBottom:4 }}>Offre publiée avec succès !</div>
                <div style={{ fontSize:13, color:"#15803d" }}>Votre offre est maintenant visible par les candidats. <a href="/employeur/dashboard" style={{ fontWeight:700, color:"#15803d" }}>Voir mon dashboard →</a></div>
              </div>
              <button onClick={()=>setSuccess(false)} style={{ marginLeft:"auto", background:"none", border:"none", fontSize:20, color:"#9ca3af", cursor:"pointer" }}>×</button>
            </div>
          )}

          {/* Job form */}
          <div className="au" style={{ background:"white", border:"1.5px solid #f0f0f0", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ padding:"22px 28px", borderBottom:"1.5px solid #f0f0f0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <h2 style={{ fontSize:17, fontWeight:800 }}>Publier une offre d'emploi</h2>
                <p style={{ fontSize:13, color:"#6b7280", marginTop:3 }}>Diffusion immédiate sur TalentMaroc</p>
              </div>
              {user && (
                <div style={{ fontSize:12, color:"#6b7280", background:"#f0fdf4", border:"1px solid #bbf7d0", padding:"5px 12px", borderRadius:100 }}>
                  ✓ Connecté · <strong style={{ color:"#15803d" }}>{user.email}</strong>
                </div>
              )}
            </div>

            <div style={{ padding:"28px 28px", display:"flex", flexDirection:"column", gap:20 }}>

              {/* Row 1: title + company */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <F label="Intitulé du poste" id="title" required>
                  <input style={inputStyle} placeholder="Développeur Full Stack" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
                </F>
                <F label="Entreprise" id="company" required>
                  <input style={inputStyle} placeholder="Capgemini Maroc" value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))}/>
                </F>
              </div>

              {/* Row 2: city + sector */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <F label="Ville" id="city" required>
                  <select style={inputStyle} value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))}>
                    <option value="">Sélectionnez...</option>
                    {CITIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </F>
                <F label="Secteur" id="sector">
                  <select style={inputStyle} value={form.sector} onChange={e=>setForm(p=>({...p,sector:e.target.value}))}>
                    <option value="">Sélectionnez...</option>
                    {SECTORS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </F>
              </div>

              {/* Row 3: contract + salary */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <F label="Type de contrat" id="contract" required>
                  <select style={inputStyle} value={form.contract_type} onChange={e=>setForm(p=>({...p,contract_type:e.target.value}))}>
                    <option value="">Sélectionnez...</option>
                    {CONTRACTS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </F>
                <F label="Salaire" id="salary">
                  <input style={inputStyle} placeholder="8 000 – 12 000 DH / mois" value={form.salary} onChange={e=>setForm(p=>({...p,salary:e.target.value}))}/>
                </F>
              </div>

              {/* Description */}
              <F label="Description du poste" id="desc">
                <textarea style={{ ...inputStyle, resize:"vertical", lineHeight:1.65 }} rows={7}
                  placeholder={"Missions :\n• Mission 1\n• Mission 2\n\nProfil recherché :\n• Critère 1\n• Critère 2\n\nAvantages :\n• ..."}
                  value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
              </F>

              {/* URL + Logo */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <F label="Lien de candidature" id="url">
                  <input style={inputStyle} placeholder="https://votresite.ma/jobs/..." value={form.original_url} onChange={e=>setForm(p=>({...p,original_url:e.target.value}))}/>
                </F>
                <F label="URL du logo" id="logo">
                  <input style={inputStyle} placeholder="https://...png" value={form.logo_url} onChange={e=>setForm(p=>({...p,logo_url:e.target.value}))}/>
                  {form.logo_url && <img src={form.logo_url} alt="Logo" style={{ width:36, height:36, borderRadius:6, objectFit:"contain", marginTop:8, border:"1px solid #e5e7eb" }} onError={e=>(e.currentTarget.style.display="none")}/>}
                </F>
              </div>

              {/* Error */}
              {error && (
                <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:8, padding:"12px 16px", fontSize:13, color:"#dc2626", display:"flex", gap:8, alignItems:"center" }}>
                  ⚠ {error}
                </div>
              )}

              {/* Submit */}
              <div style={{ display:"flex", justifyContent:"flex-end", gap:10, paddingTop:4 }}>
                <button onClick={()=>setForm(EMPTY_FORM)} style={{ background:"none", border:"1.5px solid #e5e7eb", borderRadius:9, padding:"11px 20px", fontSize:14, fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>
                  Réinitialiser
                </button>
                <button className="btn-green" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Publication…" : "📢 Publier l'offre →"}
                </button>
              </div>
            </div>
          </div>

          {/* Features grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14, marginTop:28 }}>
            {[
              { icon:"⚡", title:"Mise en ligne instantanée", desc:"Votre offre est visible dès la soumission, sans validation manuelle." },
              { icon:"🎯", title:"Candidats ciblés", desc:"Nos algorithmes présentent votre offre aux profils correspondants." },
              { icon:"📊", title:"Dashboard complet", desc:"Suivez les vues, candidatures et performances de vos offres." },
              { icon:"🔒", title:"Données sécurisées", desc:"Vos données entreprise sont protégées et jamais revendues." },
            ].map(f=>(
              <div key={f.title} style={{ background:"white", border:"1.5px solid #f0f0f0", borderRadius:12, padding:"20px", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
                <div style={{ fontSize:24, marginBottom:10 }}>{f.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:5 }}>{f.title}</div>
                <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer style={{ background:"#0f172a", padding:"20px 24px", textAlign:"center" }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.25)" }}>© 2026 Talent Maroc · <a href="/privacy" style={{ color:"rgba(255,255,255,.35)", textDecoration:"none" }}>Confidentialité</a> · <a href="/terms" style={{ color:"rgba(255,255,255,.35)", textDecoration:"none" }}>CGU</a></span>
        </footer>
      </div>
    </>
  );
}