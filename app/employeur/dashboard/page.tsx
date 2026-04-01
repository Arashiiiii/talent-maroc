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
  apps?: Application[];
}

interface Application {
  id: string; job_id: string|null; user_id: string;
  job_title: string; company: string; city: string|null;
  status: "saved"|"applied"|"interview"|"offer"|"rejected";
  notes: string|null; cv_version: string|null;
  applied_at: string|null; created_at: string; updated_at: string;
  // joined candidate info
  candidate_email?: string; candidate_name?: string;
}

type AppStatus = "saved"|"applied"|"interview"|"offer"|"rejected";
type DashTab = "overview"|"jobs"|"candidates";

const STATUS_CONFIG: Record<AppStatus,{label:string;color:string;bg:string;border:string}> = {
  saved:     { label:"Sauvegardée",  color:"#374151", bg:"#f9fafb",  border:"#e5e7eb" },
  applied:   { label:"Postulée",     color:"#1d4ed8", bg:"#eff6ff",  border:"#bfdbfe" },
  interview: { label:"Entretien",    color:"#92400e", bg:"#fffbeb",  border:"#fde68a" },
  offer:     { label:"Offre",        color:"#065f46", bg:"#f0fdf4",  border:"#bbf7d0" },
  rejected:  { label:"Refusée",      color:"#991b1b", bg:"#fef2f2",  border:"#fecaca" },
};

const CITIES    = ["Casablanca","Rabat","Tanger","Marrakech","Agadir","Fès","Meknès","Oujda","Kenitra","Tétouan","Autre"];
const SECTORS   = ["Informatique","Finance","Commerce","Marketing","RH","Ingénierie","Santé","Logistique","Tourisme","Juridique","Éducation","BTP","Industrie","Autre"];
const CONTRACTS = ["CDI","CDD","Stage","Alternance","Freelance","Temps partiel","Intérim"];

// ── OUTSIDE COMPONENT — prevents remount/typing bug ────────────────────────
function EField({ label, required, children }: { label:string; required?:boolean; children:React.ReactNode }) {
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

// ── CSV DOWNLOAD HELPERS ───────────────────────────────────────────────────
function toCSV(rows: Record<string,any>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map(r => cols.map(c => escape(r[c])).join(","))].join("\n");
}

function downloadCSV(filename: string, rows: Record<string,any>[]) {
  const blob = new Blob(["\ufeff" + toCSV(rows)], { type:"text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────
export default function EmployeurDashboard() {
  const [user,     setUser]     = useState<any>(null);
  const [jobs,     setJobs]     = useState<Job[]>([]);
  const [allApps,  setAllApps]  = useState<Application[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<DashTab>("overview");
  const [search,   setSearch]   = useState("");
  const [jobFilter,setJobFilter]= useState("all");
  const [editJob,  setEditJob]  = useState<Job|null>(null);
  const [editForm, setEditForm] = useState<Partial<Job>>({});
  const [saving,   setSaving]   = useState(false);
  const [delId,    setDelId]    = useState<string|null>(null);
  const [globalErr,setGlobalErr]= useState<string|null>(null);
  const [statusFilter, setStatusFilter] = useState<AppStatus|"all">("all");

  // ── AUTH + LOAD ────────────────────────────────────────────────────────
  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(({ data:{ user } }) => {
      if (!user) { window.location.href = "/employeur"; return; }
      setUser(user);
      loadData(user.id);
    });
  }, []);

  const loadData = useCallback(async (uid: string) => {
    setLoading(true);
    const sb = getSupabase();

    // 1. Load all jobs (all jobs for now since employer_id migration may not be run)
    // Once you run employer-migration.sql, change to: .eq("employer_id", uid)
    const { data: jobsData, error: jobErr } = await sb
      .from("jobs").select("*").order("created_at", { ascending: false });

    if (jobErr) { setGlobalErr(jobErr.message); setLoading(false); return; }
    const jobs: Job[] = jobsData || [];

    // 2. Load applications for all these jobs
    const jobIds = jobs.map(j => j.id);
    let apps: Application[] = [];
    if (jobIds.length > 0) {
      const { data: appsData } = await sb
        .from("applications").select("*").in("job_id", jobIds).order("created_at", { ascending: false });
      if (appsData) {
        // Try to fetch candidate emails from auth.users via a join
        // Since we can't access auth.users directly from client, we use user_id to match
        apps = appsData;
      }
    }

    // 3. Associate apps to jobs
    const appsByJob: Record<string, Application[]> = {};
    apps.forEach(a => { if (a.job_id) { appsByJob[a.job_id] = appsByJob[a.job_id] || []; appsByJob[a.job_id].push(a); } });
    setJobs(jobs.map(j => ({ ...j, apps: appsByJob[j.id] || [] })));
    setAllApps(apps);
    setLoading(false);
  }, []);

  // ── STATS ──────────────────────────────────────────────────────────────
  const totalApps     = allApps.length;
  const interviews    = allApps.filter(a=>a.status==="interview").length;
  const offers        = allApps.filter(a=>a.status==="offer").length;
  const responseRate  = totalApps > 0 ? Math.round((allApps.filter(a=>["interview","offer"].includes(a.status)).length / totalApps)*100) : 0;

  // ── FILTERED JOBS ──────────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const q = search.toLowerCase();
      return !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || (j.city||"").toLowerCase().includes(q);
    });
  }, [jobs, search]);

  // ── FILTERED APPS ──────────────────────────────────────────────────────
  const filteredApps = useMemo(() => {
    return allApps.filter(a => {
      const matchJob    = jobFilter==="all" || a.job_id===jobFilter;
      const matchStatus = statusFilter==="all" || a.status===statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || a.job_title.toLowerCase().includes(q) || a.company.toLowerCase().includes(q);
      return matchJob && matchStatus && matchSearch;
    });
  }, [allApps, jobFilter, statusFilter, search]);

  // ── EDIT JOB ───────────────────────────────────────────────────────────
  const openEdit = (job: Job) => {
    setEditJob(job);
    setEditForm({
      title:job.title, company:job.company, city:job.city||"",
      sector:job.sector||"", contract_type:job.contract_type||"",
      salary:job.salary||"", description:job.description||"",
      original_url:job.original_url||"", logo_url:job.logo_url||"",
    });
  };

  const saveEdit = async () => {
    if (!editJob) return;
    setSaving(true);
    const sb = getSupabase();
    const { error } = await sb.from("jobs").update({
      title:editForm.title, company:editForm.company, city:editForm.city,
      sector:editForm.sector||null, contract_type:editForm.contract_type||null,
      salary:editForm.salary||null, description:editForm.description||null,
      original_url:editForm.original_url||null, logo_url:editForm.logo_url||null,
    }).eq("id", editJob.id);
    if (!error) {
      setJobs(prev => prev.map(j => j.id===editJob.id ? {...j,...editForm} : j));
      setEditJob(null);
    }
    setSaving(false);
  };

  // ── DELETE JOB ─────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!delId) return;
    const sb = getSupabase();
    await sb.from("jobs").delete().eq("id", delId);
    setJobs(prev => prev.filter(j => j.id!==delId));
    setAllApps(prev => prev.filter(a => a.job_id!==delId));
    setDelId(null);
  };

  // ── UPDATE APPLICATION STATUS ──────────────────────────────────────────
  const updateAppStatus = async (id: string, status: AppStatus) => {
    const sb = getSupabase();
    await sb.from("applications").update({ status }).eq("id", id);
    setAllApps(prev => prev.map(a => a.id===id ? {...a,status} : a));
    setJobs(prev => prev.map(j => ({
      ...j, apps: j.apps?.map(a => a.id===id ? {...a,status} : a)
    })));
  };

  // ── DOWNLOAD HELPERS ───────────────────────────────────────────────────
  const downloadAllCandidates = () => {
    downloadCSV("candidats_talentmaroc.csv", filteredApps.map(a => ({
      "Nom / User ID":        a.candidate_name || a.user_id,
      "Email":                a.candidate_email || "(voir Supabase Auth)",
      "Poste postulé":        a.job_title,
      "Entreprise":           a.company,
      "Ville":                a.city || "",
      "Statut":               STATUS_CONFIG[a.status]?.label || a.status,
      "Date candidature":     a.applied_at ? new Date(a.applied_at).toLocaleDateString("fr-FR") : "",
      "Date sauvegarde":      new Date(a.created_at).toLocaleDateString("fr-FR"),
      "Notes":                a.notes || "",
      "Version CV":           a.cv_version || "",
    })));
  };

  const downloadJobReport = (job: Job) => {
    const apps = job.apps || [];
    downloadCSV(`candidats_${job.title.replace(/\s+/g,"_")}.csv`, apps.map(a => ({
      "User ID":          a.user_id,
      "Email":            a.candidate_email || "(voir Supabase Auth)",
      "Statut":           STATUS_CONFIG[a.status]?.label || a.status,
      "Date":             a.applied_at ? new Date(a.applied_at).toLocaleDateString("fr-FR") : "",
      "Notes":            a.notes || "",
      "Version CV":       a.cv_version || "",
    })));
  };

  const setEF = (k: keyof Job) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setEditForm(p => ({ ...p, [k]: e.target.value }));

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:"3px solid #e5e7eb", borderTopColor:"#16a34a", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 12px" }}/>
        <div style={{ fontSize:14, color:"#6b7280" }}>Chargement du dashboard…</div>
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
        .tab-nav{display:flex;border-bottom:1.5px solid #f0f0f0;background:white;padding:0 24px}
        .tab-item{padding:14px 18px;font-size:14px;font-weight:600;cursor:pointer;border:none;background:none;font-family:inherit;color:#6b7280;border-bottom:2px solid transparent;transition:all .18s;display:flex;align-items:center;gap:7px}
        .tab-item.active{color:#16a34a;border-bottom-color:#16a34a}
        .tab-item:hover{color:#0f172a}
        .stat-card{background:white;border:1.5px solid #f0f0f0;border-radius:12px;padding:20px 22px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
        .job-card{background:white;border:1.5px solid #f0f0f0;border-radius:12px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.04);transition:all .18s}
        .job-card:hover{border-color:#d1d5db;box-shadow:0 3px 12px rgba(0,0,0,.07)}
        .app-row{background:white;border:1.5px solid #f0f0f0;border-radius:10px;padding:14px 16px;transition:all .15s}
        .app-row:hover{border-color:#d1d5db}
        .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;border:none;transition:all .18s}
        .btn-green{background:#16a34a;color:white}.btn-green:hover{background:#15803d}
        .btn-green:disabled{background:#d1d5db;cursor:not-allowed}
        .btn-outline{background:white;color:#374151;border:1.5px solid #e5e7eb}.btn-outline:hover{border-color:#16a34a;color:#16a34a}
        .btn-ghost{background:none;color:#6b7280;padding:7px}.btn-ghost:hover{background:#f3f4f6;color:#0f172a;border-radius:7px}
        .btn-danger{background:none;color:#9ca3af;padding:7px}.btn-danger:hover{background:#fef2f2;color:#dc2626;border-radius:7px}
        .chip{padding:6px 12px;border-radius:100px;border:1.5px solid #e5e7eb;background:white;cursor:pointer;font-size:12px;font-weight:600;color:#374151;font-family:inherit;transition:all .18s}
        .chip.active{border-color:#16a34a;color:#16a34a;background:#f0fdf4}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
        .modal{background:white;border-radius:16px;width:100%;max-width:660px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.2)}
        .nl{color:#4b5563;text-decoration:none;font-size:14px;font-weight:600;padding:7px 12px;border-radius:8px}
        .nl:hover{color:#0f172a;background:#f3f4f6}
        @media(max-width:640px){.hide-sm{display:none!important}.stats-grid{grid-template-columns:1fr 1fr!important}}
      `}</style>

      <div style={{ background:"#f8fafc", minHeight:"100vh" }}>

        {/* NAVBAR */}
        <nav style={{ background:"rgba(255,255,255,.96)", backdropFilter:"blur(12px)", borderBottom:"1.5px solid #f0f0f0", padding:"0 24px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <a href="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
              <div style={{ width:34, height:34, background:"#16a34a", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:"white" }}>T</div>
              <span style={{ color:"#0f172a", fontWeight:800, fontSize:16 }}>TalentMaroc</span>
            </a>
            <span style={{ fontSize:13, fontWeight:700, color:"#16a34a", background:"#f0fdf4", padding:"5px 12px", borderRadius:8 }}>Dashboard Recruteur</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <a href="/employeur" className="nl" style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
              + Nouvelle offre
            </a>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"#f0fdf4", border:"1.5px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#15803d" }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <button onClick={()=>{ getSupabase().auth.signOut(); window.location.href="/employeur"; }}
              style={{ background:"none", border:"1.5px solid #e5e7eb", borderRadius:8, padding:"6px 12px", fontSize:13, fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>
              Déconnexion
            </button>
          </div>
        </nav>

        {/* PAGE HEADER */}
        <div style={{ background:"white", borderBottom:"1.5px solid #f0f0f0", padding:"24px 24px 0" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <div style={{ marginBottom:20 }}>
              <h1 style={{ fontSize:"clamp(18px,2.5vw,24px)", fontWeight:800, marginBottom:3 }}>
                Bonjour {user?.user_metadata?.name || user?.email?.split("@")[0]} 👋
              </h1>
              <p style={{ fontSize:13, color:"#6b7280" }}>
                {jobs.length} offre{jobs.length!==1?"s":""} · {totalApps} candidature{totalApps!==1?"s":""}
              </p>
            </div>
            {/* TAB NAV */}
            <div className="tab-nav" style={{ padding:"0", margin:"0 -0px" }}>
              {([
                ["overview","📊 Vue d'ensemble"],
                ["jobs",    "💼 Mes offres"],
                ["candidates","👥 Candidatures"],
              ] as const).map(([t,l])=>(
                <button key={t} className={`tab-item${tab===t?" active":""}`} onClick={()=>setTab(t)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 20px 80px" }}>

          {globalErr && <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#dc2626" }}>⚠ {globalErr}</div>}

          {/* ── OVERVIEW TAB ── */}
          {tab==="overview" && (
            <div className="au">
              {/* Stats */}
              <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
                {[
                  { label:"Offres publiées",  value:jobs.length,     icon:"💼", color:"#16a34a" },
                  { label:"Candidatures",      value:totalApps,      icon:"👥", color:"#1d4ed8" },
                  { label:"Entretiens",        value:interviews,     icon:"🗓", color:"#92400e" },
                  { label:"Taux de réponse",   value:`${responseRate}%`, icon:"📈", color:"#065f46" },
                ].map((s,i)=>(
                  <div key={i} className="stat-card">
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{ fontSize:22 }}>{s.icon}</div>
                      <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#6b7280" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Pipeline */}
              <div style={{ background:"white", border:"1.5px solid #f0f0f0", borderRadius:12, padding:"22px 24px", marginBottom:20, boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
                <h3 style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>Pipeline des candidatures</h3>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {(Object.entries(STATUS_CONFIG) as [AppStatus, typeof STATUS_CONFIG[AppStatus]][]).map(([key,cfg])=>{
                    const count = allApps.filter(a=>a.status===key).length;
                    return (
                      <div key={key} style={{ flex:1, minWidth:110, background:cfg.bg, border:`1.5px solid ${cfg.border}`, borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
                        <div style={{ fontSize:20, fontWeight:800, color:cfg.color }}>{count}</div>
                        <div style={{ fontSize:11, fontWeight:600, color:cfg.color, marginTop:3 }}>{cfg.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent jobs */}
              <div style={{ background:"white", border:"1.5px solid #f0f0f0", borderRadius:12, padding:"22px 24px", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <h3 style={{ fontSize:15, fontWeight:800 }}>Offres récentes</h3>
                  <button className="btn btn-outline" onClick={()=>setTab("jobs")}>Voir tout →</button>
                </div>
                {jobs.slice(0,4).map(job=>(
                  <div key={job.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid #f3f4f6" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{job.title}</div>
                      <div style={{ fontSize:11, color:"#6b7280" }}>{job.company} · {job.city} · {job.contract_type}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:16, fontWeight:800, color:(job.apps?.length||0)>0?"#16a34a":"#d1d5db" }}>{job.apps?.length||0}</span>
                      <span style={{ fontSize:11, color:"#9ca3af" }}>candidature{(job.apps?.length||0)!==1?"s":""}</span>
                      <button className="btn btn-outline" style={{ fontSize:11, padding:"5px 10px" }} onClick={()=>downloadJobReport(job)}>⬇ CSV</button>
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && <div style={{ textAlign:"center", padding:"32px", color:"#9ca3af", fontSize:13 }}>Aucune offre publiée. <a href="/employeur" style={{ color:"#16a34a", fontWeight:600 }}>Publiez votre première offre →</a></div>}
              </div>
            </div>
          )}

          {/* ── JOBS TAB ── */}
          {tab==="jobs" && (
            <div className="au">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:18 }}>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#9ca3af" }}>🔍</span>
                  <input placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}
                    style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"9px 14px 9px 32px", fontSize:13, fontFamily:"inherit", width:240, outline:"none" }}/>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-outline" onClick={()=>downloadCSV("offres.csv", jobs.map(j=>({ Titre:j.title, Entreprise:j.company, Ville:j.city, Contrat:j.contract_type||"", Secteur:j.sector||"", Salaire:j.salary||"", Candidatures:j.apps?.length||0, Publié:j.posted_at||"" })))}>
                    ⬇ Export offres
                  </button>
                  <a href="/employeur" className="btn btn-green" style={{ textDecoration:"none" }}>+ Nouvelle offre</a>
                </div>
              </div>

              {filteredJobs.length === 0 ? (
                <div style={{ textAlign:"center", padding:"56px 24px", background:"white", border:"2px dashed #e5e7eb", borderRadius:14 }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>💼</div>
                  <h3 style={{ fontSize:16, fontWeight:800, marginBottom:8 }}>Aucune offre</h3>
                  <a href="/employeur" className="btn btn-green" style={{ textDecoration:"none", display:"inline-flex" }}>+ Publier une offre</a>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {filteredJobs.map(job=>(
                    <div key={job.id} className="job-card">
                      <div style={{ display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>
                        {/* Logo */}
                        <div style={{ width:46, height:46, borderRadius:10, background:"#f3f4f6", flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#9ca3af" }}>
                          {job.logo_url ? <img src={job.logo_url} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }} onError={e=>(e.currentTarget.style.display="none")}/> : job.company.charAt(0)}
                        </div>
                        {/* Info */}
                        <div style={{ flex:1, minWidth:180 }}>
                          <div style={{ fontSize:15, fontWeight:700, marginBottom:3 }}>{job.title}</div>
                          <div style={{ fontSize:12, color:"#6b7280", display:"flex", gap:10, flexWrap:"wrap" }}>
                            <span style={{ fontWeight:600, color:"#374151" }}>{job.company}</span>
                            <span>📍 {job.city}</span>
                            {job.contract_type&&<span>· {job.contract_type}</span>}
                            {job.sector&&<span>· {job.sector}</span>}
                            {job.salary&&<span style={{ color:"#16a34a", fontWeight:600 }}>💰 {job.salary}</span>}
                          </div>
                          {/* Candidature pills */}
                          {(job.apps?.length||0) > 0 && (
                            <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                              {(Object.entries(STATUS_CONFIG) as [AppStatus,any][]).map(([s,cfg])=>{
                                const n = job.apps?.filter(a=>a.status===s).length||0;
                                if (!n) return null;
                                return <span key={s} style={{ fontSize:10, fontWeight:700, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, padding:"2px 8px", borderRadius:100 }}>{cfg.label}: {n}</span>;
                              })}
                            </div>
                          )}
                        </div>
                        {/* Stats + actions */}
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0, flexWrap:"wrap" }}>
                          <div style={{ textAlign:"center", minWidth:50 }}>
                            <div style={{ fontSize:20, fontWeight:800, color:(job.apps?.length||0)>0?"#16a34a":"#d1d5db" }}>{job.apps?.length||0}</div>
                            <div style={{ fontSize:10, color:"#9ca3af" }}>candidat{(job.apps?.length||0)!==1?"s":""}</div>
                          </div>
                          <a href={`/jobs/${job.id}`} target="_blank" className="btn btn-outline" style={{ fontSize:12, padding:"7px 12px", textDecoration:"none" }}>👁 Voir</a>
                          <button className="btn btn-outline" style={{ fontSize:12, padding:"7px 12px" }} onClick={()=>downloadJobReport(job)}>⬇ CSV</button>
                          <button className="btn btn-ghost" onClick={()=>openEdit(job)} title="Modifier">✏️</button>
                          <button className="btn btn-danger" onClick={()=>setDelId(job.id)} title="Supprimer">🗑</button>
                        </div>
                      </div>
                      {/* Description preview */}
                      {job.description && (
                        <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #f3f4f6", fontSize:12, color:"#6b7280", lineHeight:1.6 }}>
                          {job.description.slice(0,180)}{job.description.length>180?"…":""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CANDIDATES TAB ── */}
          {tab==="candidates" && (
            <div className="au">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:18 }}>
                {/* Filters */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#9ca3af" }}>🔍</span>
                    <input placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}
                      style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"9px 14px 9px 32px", fontSize:13, fontFamily:"inherit", width:220, outline:"none" }}/>
                  </div>
                  {/* Job filter */}
                  <select value={jobFilter} onChange={e=>setJobFilter(e.target.value)}
                    style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"9px 12px", fontSize:12, fontFamily:"inherit", color:"#374151", outline:"none", background:"white" }}>
                    <option value="all">Toutes les offres</option>
                    {jobs.map(j=><option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                  {/* Status filter chips */}
                  {(["all","applied","interview","offer","rejected"] as const).map(s=>(
                    <button key={s} className={`chip${statusFilter===s?" active":""}`} onClick={()=>setStatusFilter(s as any)}>
                      {s==="all" ? `Tous (${allApps.length})` : `${STATUS_CONFIG[s as AppStatus]?.label} (${allApps.filter(a=>a.status===s).length})`}
                    </button>
                  ))}
                </div>
                <button className="btn btn-green" onClick={downloadAllCandidates}>⬇ Exporter CSV ({filteredApps.length})</button>
              </div>

              {filteredApps.length === 0 ? (
                <div style={{ textAlign:"center", padding:"56px", background:"white", border:"2px dashed #e5e7eb", borderRadius:14, color:"#9ca3af", fontSize:14 }}>
                  Aucune candidature trouvée.
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {/* Table header */}
                  <div className="hide-sm" style={{ display:"grid", gridTemplateColumns:"1fr 180px 140px 120px 100px", gap:12, padding:"10px 16px", fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em" }}>
                    <span>Candidature</span><span>Poste</span><span>Statut</span><span>Date</span><span>Actions</span>
                  </div>

                  {filteredApps.map(app=>{
                    const sc = STATUS_CONFIG[app.status];
                    const job = jobs.find(j=>j.id===app.job_id);
                    return (
                      <div key={app.id} className="app-row">
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 180px 140px 120px 100px", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                          {/* Candidate info */}
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:2 }}>
                              {app.candidate_name || `Candidat #${app.user_id.slice(0,8)}`}
                            </div>
                            <div style={{ fontSize:11, color:"#6b7280" }}>
                              {app.candidate_email || "Email — voir Supabase"}
                            </div>
                            {app.notes && <div style={{ fontSize:11, color:"#4b5563", marginTop:4, background:"#f9fafb", padding:"4px 8px", borderRadius:5 }}>📝 {app.notes.slice(0,60)}{app.notes.length>60?"…":""}</div>}
                            {app.cv_version && <div style={{ fontSize:10, color:"#16a34a", marginTop:3 }}>📄 CV: {app.cv_version}</div>}
                          </div>
                          {/* Job */}
                          <div>
                            <div style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{app.job_title}</div>
                            {job && <div style={{ fontSize:11, color:"#9ca3af" }}>{job.city}</div>}
                          </div>
                          {/* Status select */}
                          <div>
                            <select value={app.status} onChange={e=>updateAppStatus(app.id, e.target.value as AppStatus)}
                              style={{ border:`1.5px solid ${sc.border}`, background:sc.bg, color:sc.color, borderRadius:8, padding:"5px 10px", fontSize:11, fontWeight:700, fontFamily:"inherit", cursor:"pointer", outline:"none", width:"100%" }}>
                              {(Object.entries(STATUS_CONFIG) as [AppStatus,any][]).map(([s,c])=>(
                                <option key={s} value={s}>{c.label}</option>
                              ))}
                            </select>
                          </div>
                          {/* Date */}
                          <div style={{ fontSize:11, color:"#9ca3af" }}>
                            {app.applied_at ? new Date(app.applied_at).toLocaleDateString("fr-FR") : new Date(app.created_at).toLocaleDateString("fr-FR")}
                          </div>
                          {/* Actions */}
                          <div style={{ display:"flex", gap:4 }}>
                            {job && <a href={`/jobs/${job.id}`} target="_blank" style={{ fontSize:11, padding:"5px 8px", textDecoration:"none", background:"#f3f4f6", color:"#374151", borderRadius:6, fontWeight:600 }}>👁</a>}
                            <button onClick={()=>downloadCSV(`candidat_${app.user_id.slice(0,8)}.csv`,[{
                              "User ID": app.user_id,
                              "Poste": app.job_title,
                              "Entreprise": app.company,
                              "Statut": sc.label,
                              "Date": app.applied_at||"",
                              "Notes": app.notes||"",
                              "CV version": app.cv_version||"",
                            }])} style={{ fontSize:11, padding:"5px 8px", background:"#f3f4f6", color:"#374151", borderRadius:6, fontWeight:600, border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                              ⬇
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Info note about emails */}
              <div style={{ marginTop:16, background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:10, padding:"12px 16px", fontSize:12, color:"#92400e", lineHeight:1.6 }}>
                💡 <strong>Note sur les emails candidats :</strong> Les emails sont protégés par Supabase RLS. Pour les voir, allez dans <strong>Supabase Dashboard → Authentication → Users</strong> et utilisez le <code style={{ background:"rgba(0,0,0,.06)", padding:"1px 5px", borderRadius:3 }}>user_id</code> comme clé de correspondance avec les candidatures exportées.
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── EDIT JOB MODAL ── */}
      {editJob && (
        <div className="modal-bg" onClick={()=>setEditJob(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"20px 24px", borderBottom:"1.5px solid #f0f0f0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800 }}>Modifier l'offre</div>
                <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{editJob.title}</div>
              </div>
              <button onClick={()=>setEditJob(null)} style={{ background:"none", border:"none", fontSize:22, color:"#9ca3af", cursor:"pointer", lineHeight:1 }}>×</button>
            </div>
            <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <EField label="Titre" required><input style={EIS} value={editForm.title||""} onChange={setEF("title")}/></EField>
                <EField label="Entreprise" required><input style={EIS} value={editForm.company||""} onChange={setEF("company")}/></EField>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <EField label="Ville"><select style={EIS} value={editForm.city||""} onChange={setEF("city")}><option value="">...</option>{CITIES.map(c=><option key={c}>{c}</option>)}</select></EField>
                <EField label="Secteur"><select style={EIS} value={editForm.sector||""} onChange={setEF("sector")}><option value="">...</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select></EField>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <EField label="Contrat"><select style={EIS} value={editForm.contract_type||""} onChange={setEF("contract_type")}><option value="">...</option>{CONTRACTS.map(c=><option key={c}>{c}</option>)}</select></EField>
                <EField label="Salaire"><input style={EIS} placeholder="8 000 – 12 000 DH" value={editForm.salary||""} onChange={setEF("salary")}/></EField>
              </div>
              <EField label="Description"><textarea style={{ ...EIS, resize:"vertical", lineHeight:1.6 } as React.CSSProperties} rows={6} value={editForm.description||""} onChange={setEF("description")}/></EField>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <EField label="Lien candidature"><input style={EIS} placeholder="https://..." value={editForm.original_url||""} onChange={setEF("original_url")}/></EField>
                <EField label="URL logo"><input style={EIS} placeholder="https://..." value={editForm.logo_url||""} onChange={setEF("logo_url")}/></EField>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:10, paddingTop:4 }}>
                <button className="btn btn-outline" onClick={()=>setEditJob(null)}>Annuler</button>
                <button className="btn btn-green" onClick={saveEdit} disabled={saving}>{saving?"Sauvegarde…":"💾 Sauvegarder"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {delId && (
        <div className="modal-bg" onClick={()=>setDelId(null)}>
          <div style={{ background:"white", borderRadius:14, padding:"32px 28px", maxWidth:360, width:"100%", textAlign:"center", boxShadow:"0 20px 50px rgba(0,0,0,.2)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:36, marginBottom:14 }}>🗑</div>
            <h3 style={{ fontSize:16, fontWeight:800, marginBottom:8 }}>Supprimer cette offre ?</h3>
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:24 }}>Cette action est irréversible. L'offre sera définitivement supprimée.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button className="btn btn-outline" onClick={()=>setDelId(null)}>Annuler</button>
              <button onClick={confirmDelete} style={{ background:"#dc2626", color:"white", padding:"9px 20px", borderRadius:8, border:"none", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}