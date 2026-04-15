"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

// ── TYPES ──────────────────────────────────────────────────────────────────
interface Job {
  id: string; title: string; company: string; city: string;
  sector: string|null; contract_type: string|null; salary: string|null;
  description: string|null; original_url: string|null; logo_url: string|null;
  created_at: string; posted_at: string|null; employer_id: string|null;
  featured: boolean|null; source: string|null;
  apps?: Application[];
}
interface Application {
  id: string; job_id: string|null; user_id: string;
  job_title: string; company: string; city: string|null;
  status: AppStatus; notes: string|null; cv_version: string|null;
  applied_at: string|null; created_at: string;
  // Candidate info (populated after SQL migration)
  candidate_email?: string|null;
  candidate_name?: string|null;
  cv_url?: string|null;
  cover_letter?: string|null;
}
type AppStatus = "saved"|"applied"|"interview"|"offer"|"rejected";
type DashTab   = "overview"|"jobs"|"candidates";

const STATUS_CFG: Record<AppStatus,{label:string;color:string;bg:string;border:string}> = {
  saved:     { label:"Sauvegardée",  color:"#374151", bg:"#f9fafb",  border:"#e5e7eb" },
  applied:   { label:"Postulée",     color:"#1d4ed8", bg:"#eff6ff",  border:"#bfdbfe" },
  interview: { label:"Entretien",    color:"#92400e", bg:"#fffbeb",  border:"#fde68a" },
  offer:     { label:"Offre reçue",  color:"#065f46", bg:"#f0fdf4",  border:"#bbf7d0" },
  rejected:  { label:"Refusée",      color:"#991b1b", bg:"#fef2f2",  border:"#fecaca" },
};
const CITIES    = ["Casablanca","Rabat","Tanger","Marrakech","Agadir","Fès","Meknès","Oujda","Kenitra","Tétouan","Autre"];
const SECTORS   = ["Informatique","Finance","Commerce","Marketing","RH","Ingénierie","Santé","Logistique","Tourisme","Juridique","Éducation","BTP","Industrie","Autre"];
const CONTRACTS = ["CDI","CDD","Stage","Alternance","Freelance","Temps partiel","Intérim"];

function EF({ label, required, children }: { label:string; required?:boolean; children:React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>
        {label}{required&&<span style={{ color:"#ef4444", marginLeft:3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}
const EIS: React.CSSProperties = {
  border:"1.5px solid #e5e7eb", borderRadius:8, padding:"9px 12px",
  width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a",
  background:"white", outline:"none",
};

function dlCSV(filename: string, rows: Record<string,any>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc  = (v: any) => `"${String(v??'').replace(/"/g,'""')}"`;
  const csv  = [cols.join(","), ...rows.map(r=>cols.map(c=>esc(r[c])).join(","))].join("\n");
  const blob = new Blob(["\ufeff"+csv], { type:"text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

// ── MAIN ───────────────────────────────────────────────────────────────────
export default function EmployeurDashboard() {
  const [user,         setUser]         = useState<any>(null);
  const [jobs,         setJobs]         = useState<Job[]>([]);
  const [allApps,      setAllApps]      = useState<Application[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState<DashTab>("overview");
  const [search,       setSearch]       = useState("");
  const [jobFilter,    setJobFilter]    = useState("all");
  const [statusFilter, setStatusFilter] = useState<AppStatus|"all">("all");
  const [editJob,      setEditJob]      = useState<Job|null>(null);
  const [editForm,     setEditForm]     = useState<Partial<Job>>({});
  const [saving,       setSaving]       = useState(false);
  const [delId,        setDelId]        = useState<string|null>(null);
  const [err,          setErr]          = useState<string|null>(null);
  // AI compare
  const [comparing,    setComparing]    = useState(false);
  const [compareResult,setCompareResult]= useState<string|null>(null);
  const [compareModal, setCompareModal] = useState(false);

  // ── LOAD ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const sb = getSupabase();

    // Global logout listener — redirect to employer login on sign-out from any tab
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        window.location.href = "/employeur";
      }
    });

    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href="/employeur"; return; }
      // Role guard: candidates use their own dashboard
      if (user.user_metadata?.role === "candidate") {
        window.location.href = "/dashboard"; return;
      }
      setUser(user);
      load(user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const load = useCallback(async (uid: string) => {
    setLoading(true);
    const sb = getSupabase();

    const { data: jobsData, error: jErr } = await sb
      .from("jobs")
      .select("*")
      .eq("employer_id", uid)
      .order("created_at", { ascending: false });

    if (jErr) { setErr(jErr.message); setLoading(false); return; }
    const myJobs: Job[] = jobsData || [];

    const jobIds = myJobs.map(j=>j.id);
    let apps: Application[] = [];
    if (jobIds.length > 0) {
      const { data: appsData } = await sb
        .from("applications")
        .select("*")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });
      if (appsData) apps = appsData;
    }

    const byJob: Record<string,Application[]> = {};
    apps.forEach(a => { if (a.job_id) { byJob[a.job_id]??=[]; byJob[a.job_id].push(a); } });
    setJobs(myJobs.map(j=>({ ...j, apps: byJob[j.id]||[] })));
    setAllApps(apps);
    setLoading(false);
  }, []);

  // ── STATS ──────────────────────────────────────────────────────────────
  const totalApps   = allApps.length;
  const interviews  = allApps.filter(a=>a.status==="interview").length;
  const responseRate = totalApps > 0
    ? Math.round((allApps.filter(a=>["interview","offer"].includes(a.status)).length / totalApps)*100)
    : 0;

  // ── FILTERS ────────────────────────────────────────────────────────────
  const filteredJobs = useMemo(()=>{
    const q=search.toLowerCase();
    return jobs.filter(j=>!q||j.title.toLowerCase().includes(q)||j.company.toLowerCase().includes(q)||(j.city||"").toLowerCase().includes(q));
  },[jobs,search]);

  const filteredApps = useMemo(()=>{
    return allApps.filter(a=>{
      const matchJob    = jobFilter==="all"||a.job_id===jobFilter;
      const matchStatus = statusFilter==="all"||a.status===statusFilter;
      const q=search.toLowerCase();
      const matchSearch=!q||a.job_title.toLowerCase().includes(q)||(a.candidate_name||"").toLowerCase().includes(q)||(a.candidate_email||"").toLowerCase().includes(q);
      return matchJob&&matchStatus&&matchSearch;
    });
  },[allApps,jobFilter,statusFilter,search]);

  // ── EDIT JOB ───────────────────────────────────────────────────────────
  const openEdit=(j:Job)=>{ setEditJob(j); setEditForm({ title:j.title, company:j.company, city:j.city||"", sector:j.sector||"", contract_type:j.contract_type||"", salary:j.salary||"", description:j.description||"", original_url:j.original_url||"", logo_url:j.logo_url||"" }); };

  const saveEdit=async()=>{
    if(!editJob)return; setSaving(true);
    const sb=getSupabase();
    const {error}=await sb.from("jobs").update({ title:editForm.title, company:editForm.company, city:editForm.city, sector:editForm.sector||null, contract_type:editForm.contract_type||null, salary:editForm.salary||null, description:editForm.description||null, original_url:editForm.original_url||null, logo_url:editForm.logo_url||null }).eq("id",editJob.id);
    if(!error){ setJobs(p=>p.map(j=>j.id===editJob.id?{...j,...editForm}:j)); setEditJob(null); }
    setSaving(false);
  };

  const doDelete=async()=>{
    if(!delId)return;
    await getSupabase().from("jobs").delete().eq("id",delId);
    setJobs(p=>p.filter(j=>j.id!==delId));
    setAllApps(p=>p.filter(a=>a.job_id!==delId));
    setDelId(null);
  };

  const updateStatus=async(id:string,status:AppStatus)=>{
    await getSupabase().from("applications").update({status}).eq("id",id);
    const upd=(a:Application)=>a.id===id?{...a,status}:a;
    setAllApps(p=>p.map(upd));
    setJobs(p=>p.map(j=>({...j,apps:j.apps?.map(upd)})));
  };

  const setEF=(k:keyof Job)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>
    setEditForm(p=>({...p,[k]:e.target.value}));

  const signOut = async () => {
    await getSupabase().auth.signOut();
    window.location.href = "/employeur";
  };

  // ── AI COMPARE ─────────────────────────────────────────────────────────
  const aiCompare = async () => {
    const candidates = filteredApps.slice(0, 10); // max 10
    if (candidates.length < 2) { setErr("Sélectionnez au moins 2 candidats (utilisez les filtres)."); return; }
    setComparing(true); setCompareResult(null); setCompareModal(true);

    const job = jobs.find(j => j.id === jobFilter) || jobs[0];

    try {
      const res = await fetch("/api/ai-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: candidates.map(a => ({
            name: a.candidate_name || `Candidat #${a.user_id.slice(0,8)}`,
            email: a.candidate_email || null,
            job_title: a.job_title,
            status: STATUS_CFG[a.status].label,
            applied_at: a.applied_at,
            notes: a.notes,
            cover_letter: a.cover_letter,
            cv_url: a.cv_url,
          })),
          job_title: job?.title || "Poste",
          job_description: job?.description || "",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCompareResult(data.result);
    } catch (e: any) {
      setCompareResult(`Erreur : ${e.message}`);
    } finally {
      setComparing(false);
    }
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:"3px solid #e5e7eb", borderTopColor:"#16a34a", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 12px" }}/>
        <div style={{ fontSize:14, color:"#6b7280" }}>Chargement…</div>
      </div>
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
        .tab-nav{display:flex;border-bottom:1.5px solid #f0f0f0}
        .tab-item{padding:14px 18px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;font-family:inherit;color:#6b7280;border-bottom:2px solid transparent;transition:all .18s}
        .tab-item.active{color:#16a34a;border-bottom-color:#16a34a}
        .tab-item:hover:not(.active){color:#0f172a}
        .card{background:white;border:1.5px solid #f0f0f0;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
        .btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;border:none;transition:all .18s;text-decoration:none;white-space:nowrap}
        .btn-green{background:#16a34a;color:white}.btn-green:hover{background:#15803d}
        .btn-outline{background:white;color:#374151;border:1.5px solid #e5e7eb}.btn-outline:hover{border-color:#16a34a;color:#16a34a}
        .btn-ghost{background:none;color:#6b7280;padding:6px;border-radius:7px}.btn-ghost:hover{background:#f3f4f6;color:#0f172a}
        .btn-del{background:none;color:#9ca3af;padding:6px;border-radius:7px;cursor:pointer;font-family:inherit;border:none;display:inline-flex;align-items:center}.btn-del:hover{background:#fef2f2;color:#dc2626}
        .btn-pro{background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none}.btn-pro:hover{opacity:.9}
        .chip{padding:6px 12px;border-radius:100px;border:1.5px solid #e5e7eb;background:white;cursor:pointer;font-size:11px;font-weight:600;color:#374151;font-family:inherit;transition:all .18s}
        .chip.active{border-color:#16a34a;color:#16a34a;background:#f0fdf4}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
        .modal{background:white;border-radius:16px;width:100%;max-width:660px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.2)}
        .modal-lg{max-width:760px}
        .stat-card{background:white;border:1.5px solid #f0f0f0;border-radius:12px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
        .nl{color:#4b5563;text-decoration:none;font-size:13px;font-weight:600;padding:6px 10px;border-radius:7px;transition:all .18s}
        .nl:hover{color:#0f172a;background:#f3f4f6}
        @media(max-width:640px){.stats-grid{grid-template-columns:1fr 1fr!important}.hide-sm{display:none!important}.edit-grid{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{ background:"#f8fafc", minHeight:"100vh" }}>
        {/* NAVBAR */}
        <nav style={{ background:"rgba(255,255,255,.96)", backdropFilter:"blur(12px)", borderBottom:"1.5px solid #f0f0f0", padding:"0 20px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <a href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
              <div style={{ width:32, height:32, background:"#16a34a", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, color:"white" }}>T</div>
              <span style={{ fontWeight:800, fontSize:15, color:"#0f172a" }}>TalentMaroc</span>
            </a>
            <span style={{ fontSize:12, fontWeight:700, color:"#16a34a", background:"#f0fdf4", padding:"4px 10px", borderRadius:7 }}>Dashboard Recruteur</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <a href="/employeur/new" className="nl">+ Nouvelle offre</a>
            <div style={{ width:30, height:30, borderRadius:"50%", background:"#f0fdf4", border:"1.5px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#15803d" }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <button onClick={signOut}
              style={{ background:"none", border:"1.5px solid #e5e7eb", borderRadius:7, padding:"6px 12px", fontSize:12, fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>
              Déconnexion
            </button>
          </div>
        </nav>

        {/* HEADER + TABS */}
        <div style={{ background:"white", borderBottom:"1.5px solid #f0f0f0", padding:"20px 24px 0" }}>
          <div style={{ maxWidth:1080, margin:"0 auto" }}>
            <h1 style={{ fontSize:"clamp(17px,2.5vw,22px)", fontWeight:800, marginBottom:3 }}>
              Bonjour {user?.user_metadata?.name || user?.email?.split("@")[0]} 👋
            </h1>
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>
              {jobs.length} offre{jobs.length!==1?"s":""} publiée{jobs.length!==1?"s":""} · {totalApps} candidature{totalApps!==1?"s":""}
            </p>
            <div className="tab-nav">
              {([["overview","📊 Vue d'ensemble"],["jobs","💼 Mes offres"],["candidates","👥 Candidatures"]] as const).map(([t,l])=>(
                <button key={t} className={`tab-item${tab===t?" active":""}`} onClick={()=>setTab(t)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1080, margin:"0 auto", padding:"24px 20px 80px" }}>
          {err && <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13, color:"#dc2626" }}>⚠ {err} <button onClick={()=>setErr(null)} style={{ float:"right", background:"none", border:"none", cursor:"pointer", color:"#dc2626", fontWeight:700 }}>×</button></div>}

          {/* ── OVERVIEW ── */}
          {tab==="overview" && (
            <div className="au">
              <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                {[
                  {icon:"💼",label:"Mes offres",       val:jobs.length,      color:"#16a34a"},
                  {icon:"👥",label:"Candidatures",      val:totalApps,        color:"#1d4ed8"},
                  {icon:"🗓",label:"Entretiens",         val:interviews,       color:"#92400e"},
                  {icon:"📈",label:"Taux de réponse",   val:`${responseRate}%`,color:"#065f46"},
                ].map((s,i)=>(
                  <div key={i} className="stat-card">
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <span style={{ fontSize:20 }}>{s.icon}</span>
                      <span style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.val}</span>
                    </div>
                    <div style={{ fontSize:11, fontWeight:600, color:"#6b7280" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding:"20px 22px", marginBottom:16 }}>
                <h3 style={{ fontSize:14, fontWeight:800, marginBottom:14 }}>Pipeline des candidatures</h3>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {(Object.entries(STATUS_CFG) as [AppStatus,any][]).map(([key,cfg])=>{
                    const count=allApps.filter(a=>a.status===key).length;
                    return (
                      <div key={key} style={{ flex:1, minWidth:90, background:cfg.bg, border:`1.5px solid ${cfg.border}`, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:cfg.color }}>{count}</div>
                        <div style={{ fontSize:10, fontWeight:600, color:cfg.color, marginTop:2 }}>{cfg.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card" style={{ padding:"20px 22px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <h3 style={{ fontSize:14, fontWeight:800 }}>Mes offres récentes</h3>
                  <button className="btn btn-outline" onClick={()=>setTab("jobs")}>Voir tout →</button>
                </div>
                {jobs.length===0 ? (
                  <div style={{ textAlign:"center", padding:"28px", color:"#9ca3af", fontSize:13 }}>
                    Aucune offre publiée. <a href="/employeur/new" style={{ color:"#16a34a", fontWeight:600 }}>Publier →</a>
                  </div>
                ) : jobs.slice(0,5).map(j=>(
                  <div key={j.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid #f3f4f6", flexWrap:"wrap", gap:8 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{j.title}</div>
                      <div style={{ fontSize:11, color:"#6b7280" }}>{j.company} · {j.city} · {j.contract_type||"—"}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:(j.apps?.length||0)>0?"#16a34a":"#d1d5db" }}>{j.apps?.length||0}</div>
                        <div style={{ fontSize:10, color:"#9ca3af" }}>candidat{(j.apps?.length||0)!==1?"s":""}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── JOBS TAB ── */}
          {tab==="jobs" && (
            <div className="au">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:16 }}>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}>🔍</span>
                  <input placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}
                    style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"9px 14px 9px 32px", fontSize:13, fontFamily:"inherit", width:220, outline:"none" }}/>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-outline" onClick={()=>dlCSV("mes_offres.csv",jobs.map(j=>({ Titre:j.title, Entreprise:j.company, Ville:j.city, Contrat:j.contract_type||"", Secteur:j.sector||"", Salaire:j.salary||"", Candidatures:j.apps?.length||0 })))}>
                    ⬇ Exporter CSV
                  </button>
                  <a href="/employeur/new" className="btn btn-green" style={{ textDecoration:"none" }}>+ Nouvelle offre</a>
                </div>
              </div>

              {filteredJobs.length===0 ? (
                <div style={{ textAlign:"center", padding:"56px", background:"white", border:"2px dashed #e5e7eb", borderRadius:14 }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>💼</div>
                  <h3 style={{ fontSize:15, fontWeight:800, marginBottom:8 }}>Aucune offre publiée</h3>
                  <a href="/employeur/new" className="btn btn-green" style={{ textDecoration:"none", display:"inline-flex" }}>Publier ma première offre</a>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {filteredJobs.map(j=>(
                    <div key={j.id} className="card" style={{ padding:"18px 20px" }}>
                      <div style={{ display:"flex", gap:12, alignItems:"flex-start", flexWrap:"wrap" }}>
                        <div style={{ width:44, height:44, borderRadius:10, background:"#f3f4f6", flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"#9ca3af" }}>
                          {j.logo_url ? <img src={j.logo_url} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }} onError={e=>(e.currentTarget.style.display="none")}/> : j.company.charAt(0)}
                        </div>
                        <div style={{ flex:1, minWidth:160 }}>
                          <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{j.title}</div>
                          <div style={{ fontSize:12, color:"#6b7280", display:"flex", gap:10, flexWrap:"wrap" }}>
                            <span style={{ fontWeight:600, color:"#374151" }}>{j.company}</span>
                            <span>📍 {j.city}</span>
                            {j.contract_type&&<span>· {j.contract_type}</span>}
                            {j.sector&&<span>· {j.sector}</span>}
                            {j.salary&&<span style={{ color:"#16a34a", fontWeight:600 }}>💰 {j.salary}</span>}
                          </div>
                          {(j.apps?.length||0)>0&&(
                            <div style={{ display:"flex", gap:5, marginTop:8, flexWrap:"wrap" }}>
                              {(Object.entries(STATUS_CFG) as [AppStatus,any][]).map(([s,c])=>{
                                const n=j.apps?.filter(a=>a.status===s).length||0;
                                if(!n)return null;
                                return <span key={s} style={{ fontSize:10, fontWeight:700, background:c.bg, color:c.color, border:`1px solid ${c.border}`, padding:"2px 8px", borderRadius:100 }}>{c.label}: {n}</span>;
                              })}
                            </div>
                          )}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                          <div style={{ textAlign:"center", minWidth:44 }}>
                            <div style={{ fontSize:18, fontWeight:800, color:(j.apps?.length||0)>0?"#16a34a":"#d1d5db" }}>{j.apps?.length||0}</div>
                            <div style={{ fontSize:10, color:"#9ca3af" }}>candidat{(j.apps?.length||0)!==1?"s":""}</div>
                          </div>
                          <a href={`/jobs/${j.id}`} target="_blank" className="btn btn-outline" style={{ textDecoration:"none", fontSize:11 }}>👁 Voir</a>
                          <button className="btn btn-outline" style={{ fontSize:11 }} onClick={()=>dlCSV(`candidats_${j.id}.csv`,(j.apps||[]).map(a=>({ "Nom":a.candidate_name||"—", "Email":a.candidate_email||"—", "Poste":a.job_title, "Statut":STATUS_CFG[a.status].label, "Date":a.applied_at||"", "Notes":a.notes||"", "CV":a.cv_url||"" })))}>⬇ CSV</button>
                          <button className="btn-ghost btn" onClick={()=>openEdit(j)}>✏️</button>
                          <button className="btn-del" onClick={()=>setDelId(j.id)}>🗑</button>
                        </div>
                      </div>
                      {j.description&&<div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #f3f4f6", fontSize:12, color:"#6b7280", lineHeight:1.6 }}>{j.description.slice(0,200)}{j.description.length>200?"…":""}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CANDIDATES TAB ── */}
          {tab==="candidates" && (
            <div className="au">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:14 }}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}>🔍</span>
                    <input placeholder="Nom, email…" value={search} onChange={e=>setSearch(e.target.value)}
                      style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"9px 14px 9px 32px", fontSize:13, fontFamily:"inherit", width:200, outline:"none" }}/>
                  </div>
                  <select value={jobFilter} onChange={e=>setJobFilter(e.target.value)}
                    style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"9px 12px", fontSize:12, fontFamily:"inherit", color:"#374151", outline:"none", background:"white" }}>
                    <option value="all">Toutes les offres</option>
                    {jobs.map(j=><option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                  {(["all","applied","interview","offer","rejected"] as const).map(s=>(
                    <button key={s} className={`chip${statusFilter===s?" active":""}`} onClick={()=>setStatusFilter(s as any)}>
                      {s==="all"?`Toutes (${allApps.length})`:`${STATUS_CFG[s as AppStatus]?.label} (${allApps.filter(a=>a.status===s).length})`}
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-outline" onClick={()=>dlCSV("candidatures.csv",filteredApps.map(a=>({ "Nom":a.candidate_name||"—", "Email":a.candidate_email||"—", "Poste":a.job_title, "Ville":a.city||"—", "Statut":STATUS_CFG[a.status].label, "Date":a.applied_at||"", "Notes":a.notes||"", "CV":a.cv_url||"" })))}>
                    ⬇ CSV ({filteredApps.length})
                  </button>
                  <button className="btn btn-pro" onClick={aiCompare} disabled={comparing}
                    title="Comparaison IA des candidats — Fonctionnalité Pro">
                    {comparing ? "Analyse…" : "🤖 Comparer IA ✦ Pro"}
                  </button>
                </div>
              </div>

              {filteredApps.length===0 ? (
                <div style={{ textAlign:"center", padding:"48px", background:"white", border:"2px dashed #e5e7eb", borderRadius:14, color:"#9ca3af", fontSize:13 }}>
                  Aucune candidature trouvée.
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {filteredApps.map(a=>{
                    const sc=STATUS_CFG[a.status];
                    const job=jobs.find(j=>j.id===a.job_id);
                    const displayName = a.candidate_name || `Candidat #${a.user_id.slice(0,8)}`;
                    const displayEmail = a.candidate_email;
                    return (
                      <div key={a.id} className="card" style={{ padding:"14px 18px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                          {/* Avatar */}
                          <div style={{ width:40, height:40, borderRadius:"50%", background:"#f0fdf4", border:"1.5px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:"#15803d", flexShrink:0 }}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          {/* Info */}
                          <div style={{ flex:1, minWidth:160 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:2 }}>{displayName}</div>
                            {displayEmail && (
                              <a href={`mailto:${displayEmail}`} style={{ fontSize:11, color:"#1d4ed8", textDecoration:"none", display:"block", marginBottom:2 }}>📧 {displayEmail}</a>
                            )}
                            <div style={{ fontSize:11, color:"#6b7280" }}>
                              {a.job_title} · {a.city||"—"} · {a.applied_at?new Date(a.applied_at).toLocaleDateString("fr-FR"):new Date(a.created_at).toLocaleDateString("fr-FR")}
                            </div>
                            {a.notes&&<div style={{ fontSize:11, color:"#4b5563", marginTop:4, background:"#f9fafb", padding:"3px 8px", borderRadius:5 }}>📝 {a.notes.slice(0,80)}{a.notes.length>80?"…":""}</div>}
                            {a.cover_letter&&<div style={{ fontSize:11, color:"#6b7280", marginTop:3, fontStyle:"italic" }}>✉️ Lettre de motivation jointe</div>}
                          </div>
                          {/* Status selector */}
                          <select value={a.status} onChange={e=>updateStatus(a.id,e.target.value as AppStatus)}
                            style={{ border:`1.5px solid ${sc.border}`, background:sc.bg, color:sc.color, borderRadius:8, padding:"6px 10px", fontSize:11, fontWeight:700, fontFamily:"inherit", cursor:"pointer", outline:"none" }}>
                            {(Object.entries(STATUS_CFG) as [AppStatus,any][]).map(([s,c])=>(
                              <option key={s} value={s}>{c.label}</option>
                            ))}
                          </select>
                          {/* Actions */}
                          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                            {job&&<a href={`/jobs/${job.id}`} target="_blank" className="btn btn-outline" style={{ textDecoration:"none", fontSize:11, padding:"5px 8px" }}>👁 Offre</a>}
                            {a.cv_url && (
                              <a href={a.cv_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ textDecoration:"none", fontSize:11, padding:"5px 8px", color:"#16a34a", borderColor:"#bbf7d0" }}>📄 CV</a>
                            )}
                            {displayEmail && (
                              <a href={`mailto:${displayEmail}?subject=Votre candidature pour ${a.job_title}`} className="btn btn-outline" style={{ textDecoration:"none", fontSize:11, padding:"5px 8px" }}>✉️</a>
                            )}
                            <button onClick={()=>dlCSV(`candidat_${displayName.replace(/\s+/g,"_")}.csv`,[{ "Nom":displayName, "Email":displayEmail||"—", "Poste":a.job_title, "Statut":sc.label, "Date":a.applied_at||"", "Notes":a.notes||"", "CV":a.cv_url||"" }])}
                              style={{ fontSize:11, padding:"5px 8px", background:"#f3f4f6", color:"#374151", borderRadius:6, fontWeight:600, border:"none", cursor:"pointer", fontFamily:"inherit" }}>⬇</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT JOB MODAL ── */}
      {editJob&&(
        <div className="modal-bg" onClick={()=>setEditJob(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"20px 24px", borderBottom:"1.5px solid #f0f0f0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div><div style={{ fontSize:15, fontWeight:800 }}>Modifier l'offre</div><div style={{ fontSize:12, color:"#6b7280" }}>{editJob.title}</div></div>
              <button onClick={()=>setEditJob(null)} style={{ background:"none", border:"none", fontSize:20, color:"#9ca3af", cursor:"pointer" }}>×</button>
            </div>
            <div style={{ padding:"22px", display:"flex", flexDirection:"column", gap:14 }}>
              <div className="edit-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <EF label="Titre" required><input style={EIS} value={editForm.title||""} onChange={setEF("title")}/></EF>
                <EF label="Entreprise" required><input style={EIS} value={editForm.company||""} onChange={setEF("company")}/></EF>
              </div>
              <div className="edit-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <EF label="Ville"><select style={EIS} value={editForm.city||""} onChange={setEF("city")}><option value="">...</option>{CITIES.map(c=><option key={c}>{c}</option>)}</select></EF>
                <EF label="Secteur"><select style={EIS} value={editForm.sector||""} onChange={setEF("sector")}><option value="">...</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select></EF>
              </div>
              <div className="edit-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <EF label="Contrat"><select style={EIS} value={editForm.contract_type||""} onChange={setEF("contract_type")}><option value="">...</option>{CONTRACTS.map(c=><option key={c}>{c}</option>)}</select></EF>
                <EF label="Salaire"><input style={EIS} placeholder="8 000 – 12 000 DH" value={editForm.salary||""} onChange={setEF("salary")}/></EF>
              </div>
              <EF label="Description"><textarea style={{ ...EIS, resize:"vertical", lineHeight:1.6 } as React.CSSProperties} rows={5} value={editForm.description||""} onChange={setEF("description")}/></EF>
              <div className="edit-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <EF label="Lien candidature"><input style={EIS} placeholder="https://..." value={editForm.original_url||""} onChange={setEF("original_url")}/></EF>
                <EF label="URL logo"><input style={EIS} placeholder="https://..." value={editForm.logo_url||""} onChange={setEF("logo_url")}/></EF>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
                <button className="btn btn-outline" onClick={()=>setEditJob(null)}>Annuler</button>
                <button className="btn btn-green" onClick={saveEdit} disabled={saving}>{saving?"Sauvegarde…":"💾 Sauvegarder"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {delId&&(
        <div className="modal-bg" onClick={()=>setDelId(null)}>
          <div style={{ background:"white", borderRadius:14, padding:"32px 28px", maxWidth:340, width:"100%", textAlign:"center", boxShadow:"0 20px 50px rgba(0,0,0,.2)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:36, marginBottom:12 }}>🗑</div>
            <h3 style={{ fontSize:16, fontWeight:800, marginBottom:8 }}>Supprimer cette offre ?</h3>
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:22 }}>Action irréversible.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button className="btn btn-outline" onClick={()=>setDelId(null)}>Annuler</button>
              <button onClick={doDelete} style={{ background:"#dc2626", color:"white", padding:"9px 18px", borderRadius:8, border:"none", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI COMPARE MODAL ── */}
      {compareModal&&(
        <div className="modal-bg" onClick={()=>{ if(!comparing){ setCompareModal(false); setCompareResult(null); } }}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"20px 24px", borderBottom:"1.5px solid #f0f0f0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:15, fontWeight:800, display:"flex", alignItems:"center", gap:8 }}>
                  🤖 Comparaison IA des candidats
                  <span style={{ fontSize:10, fontWeight:700, background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"white", padding:"2px 8px", borderRadius:100 }}>PRO</span>
                </div>
                <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>Analyse comparative de {Math.min(filteredApps.length,10)} candidats</div>
              </div>
              {!comparing&&<button onClick={()=>{ setCompareModal(false); setCompareResult(null); }} style={{ background:"none", border:"none", fontSize:20, color:"#9ca3af", cursor:"pointer" }}>×</button>}
            </div>
            <div style={{ padding:"24px" }}>
              {comparing ? (
                <div style={{ textAlign:"center", padding:"40px" }}>
                  <div style={{ width:40, height:40, border:"3px solid #e5e7eb", borderTopColor:"#7c3aed", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 16px" }}/>
                  <div style={{ fontSize:14, color:"#6b7280" }}>Analyse en cours par l'IA…</div>
                </div>
              ) : compareResult ? (
                <div style={{ fontSize:13, lineHeight:1.8, color:"#0f172a", whiteSpace:"pre-wrap" }}>{compareResult}</div>
              ) : null}
              {!comparing&&compareResult&&(
                <div style={{ marginTop:20, display:"flex", justifyContent:"flex-end", gap:10 }}>
                  <button className="btn btn-outline" onClick={()=>{ const el=document.createElement("a"); el.href="data:text/plain;charset=utf-8,"+encodeURIComponent(compareResult||""); el.download="analyse_candidats.txt"; el.click(); }}>⬇ Exporter</button>
                  <button className="btn btn-green" onClick={()=>{ setCompareModal(false); setCompareResult(null); }}>Fermer</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
