"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart2, Eye, Users, TrendingUp, Edit3, Trash2,
  Plus, Search, CheckCircle, XCircle, Clock, Star,
  ChevronDown, X, Save, AlertCircle
} from "lucide-react";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── TYPES ──────────────────────────────────────────────────────────────────
interface Job {
  id:            string;
  title:         string;
  company:       string;
  city:          string;
  sector:        string | null;
  contract_type: string | null;
  salary:        string | null;
  description:   string | null;
  original_url:  string | null;
  logo_url:      string | null;
  featured:      boolean;
  created_at:    string;
  posted_at:     string | null;
  employer_id:   string | null;
  // virtual — we'll count from applications table
  application_count?: number;
}

interface EditForm {
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

const CITIES = ["Casablanca","Rabat","Tanger","Marrakech","Agadir","Fès","Meknès","Oujda","Kenitra","Tétouan","Autre"];
const SECTORS = ["Informatique","Finance","Commerce","Marketing","RH","Ingénierie","Santé","Logistique","Tourisme","Juridique","Éducation","BTP","Industrie","Autre"];
const CONTRACTS = ["CDI","CDD","Stage","Alternance","Freelance","Temps partiel","Intérim"];

export default function EmployeurDashboard() {
  const [user,       setUser]       = useState<any>(null);
  const [jobs,       setJobs]       = useState<Job[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterStatus, setFilter]  = useState<"all"|"active"|"featured">("all");
  const [editJob,    setEditJob]    = useState<Job|null>(null);
  const [editForm,   setEditForm]   = useState<EditForm|null>(null);
  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState<string|null>(null);
  const [deleteId,   setDeleteId]   = useState<string|null>(null);
  const [deleting,   setDeleting]   = useState(false);
  const [globalErr,  setGlobalErr]  = useState<string|null>(null);

  // ── AUTH ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/employeur"; return; }
      setUser(user);
      loadJobs(user.id);
    });
  }, []);

  // ── LOAD JOBS ─────────────────────────────────────────────────────────────
  const loadJobs = useCallback(async (uid: string) => {
    setLoading(true);
    const sb = getSupabase();

    // Load jobs created by this employer
    const { data: jobsData, error } = await sb
      .from("jobs")
      .select("*")
      .eq("employer_id", uid)
      .order("created_at", { ascending: false });

    if (error) { setGlobalErr(error.message); setLoading(false); return; }
    if (!jobsData) { setLoading(false); return; }

    // For each job, count applications
    const jobIds = jobsData.map((j: Job) => j.id);
    let counts: Record<string, number> = {};
    if (jobIds.length > 0) {
      const { data: appData } = await sb
        .from("applications")
        .select("job_id")
        .in("job_id", jobIds);
      if (appData) {
        appData.forEach((a: any) => {
          counts[a.job_id] = (counts[a.job_id] || 0) + 1;
        });
      }
    }

    setJobs(jobsData.map((j: Job) => ({ ...j, application_count: counts[j.id] || 0 })));
    setLoading(false);
  }, []);

  // ── STATS ─────────────────────────────────────────────────────────────────
  const totalJobs   = jobs.length;
  const totalApps   = jobs.reduce((s, j) => s + (j.application_count || 0), 0);
  const featuredJobs = jobs.filter(j => j.featured).length;
  const activeJobs  = jobs.filter(j => !j.featured).length;

  // ── FILTERED JOBS ─────────────────────────────────────────────────────────
  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || (j.city||"").toLowerCase().includes(q);
    const matchFilter = filterStatus === "all" || (filterStatus === "featured" && j.featured) || (filterStatus === "active" && !j.featured);
    return matchSearch && matchFilter;
  });

  // ── EDIT ──────────────────────────────────────────────────────────────────
  const openEdit = (job: Job) => {
    setEditJob(job);
    setSaveErr(null);
    setEditForm({
      title:         job.title,
      company:       job.company,
      city:          job.city || "",
      sector:        job.sector || "",
      contract_type: job.contract_type || "",
      salary:        job.salary || "",
      description:   job.description || "",
      original_url:  job.original_url || "",
      logo_url:      job.logo_url || "",
    });
  };

  const saveEdit = async () => {
    if (!editJob || !editForm) return;
    setSaveErr(null); setSaving(true);
    try {
      const sb = getSupabase();
      const { error } = await sb.from("jobs").update({
        title:         editForm.title.trim(),
        company:       editForm.company.trim(),
        city:          editForm.city,
        sector:        editForm.sector || null,
        contract_type: editForm.contract_type || null,
        salary:        editForm.salary.trim() || null,
        description:   editForm.description.trim() || null,
        original_url:  editForm.original_url.trim() || null,
        logo_url:      editForm.logo_url.trim() || null,
      }).eq("id", editJob.id).eq("employer_id", user.id);
      if (error) throw error;
      setJobs(prev => prev.map(j => j.id === editJob.id ? { ...j, ...editForm } : j));
      setEditJob(null); setEditForm(null);
    } catch(e: any) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── TOGGLE FEATURED ───────────────────────────────────────────────────────
  const toggleFeatured = async (job: Job) => {
    const sb = getSupabase();
    const { error } = await sb.from("jobs").update({ featured: !job.featured }).eq("id", job.id).eq("employer_id", user.id);
    if (!error) setJobs(prev => prev.map(j => j.id === job.id ? { ...j, featured: !j.featured } : j));
  };

  // ── DELETE ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const sb = getSupabase();
    const { error } = await sb.from("jobs").delete().eq("id", deleteId).eq("employer_id", user.id);
    if (!error) setJobs(prev => prev.filter(j => j.id !== deleteId));
    setDeleteId(null); setDeleting(false);
  };

  const inputStyle: React.CSSProperties = {
    border:"1.5px solid #e5e7eb", borderRadius:9, padding:"10px 13px",
    width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a",
    background:"white", outline:"none",
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:32, height:32, border:"3px solid #e5e7eb", borderTopColor:"#16a34a", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 12px" }}/>
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
        .job-row{background:white;border:1.5px solid #f0f0f0;border-radius:12px;padding:18px 20px;transition:all .18s;box-shadow:0 1px 3px rgba(0,0,0,.04)}
        .job-row:hover{border-color:#d1d5db;box-shadow:0 3px 12px rgba(0,0,0,.07)}
        .stat-card{background:white;border:1.5px solid #f0f0f0;border-radius:12px;padding:20px 22px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
        .btn-green{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#16a34a;color:white;padding:10px 18px;border-radius:9px;font-size:13px;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .18s}
        .btn-green:hover{background:#15803d;transform:translateY(-1px)}
        .btn-green:disabled{background:#d1d5db;cursor:not-allowed;transform:none}
        .btn-outline{display:inline-flex;align-items:center;gap:6px;background:white;color:#374151;padding:9px 16px;border-radius:9px;font-size:13px;font-weight:600;border:1.5px solid #e5e7eb;cursor:pointer;font-family:inherit;transition:all .18s}
        .btn-outline:hover{border-color:#16a34a;color:#16a34a}
        .btn-ghost{background:none;border:none;cursor:pointer;padding:7px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;color:#6b7280;font-family:inherit}
        .btn-ghost:hover{background:#f3f4f6;color:#0f172a}
        .btn-danger{background:none;border:none;cursor:pointer;padding:7px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;color:#9ca3af}
        .btn-danger:hover{background:#fef2f2;color:#dc2626}
        .chip-filter{padding:7px 14px;border-radius:100px;border:1.5px solid #e5e7eb;background:white;cursor:pointer;font-size:12px;font-weight:600;color:#374151;font-family:inherit;transition:all .18s}
        .chip-filter.active{border-color:#16a34a;color:#16a34a;background:#f0fdf4}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
        .modal-box{background:white;border-radius:16px;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.2)}
        .nl{color:#4b5563;text-decoration:none;font-size:14px;font-weight:600;padding:7px 12px;border-radius:8px;transition:all .18s}
        .nl:hover{color:#0f172a;background:#f3f4f6}
        @media(max-width:640px){.stats-grid{grid-template-columns:1fr 1fr!important}.hide-sm{display:none!important}}
      `}</style>

      <div style={{ background:"#f8fafc", minHeight:"100vh" }}>

        {/* NAVBAR */}
        <nav style={{ background:"rgba(255,255,255,.96)", backdropFilter:"blur(12px)", borderBottom:"1.5px solid #f0f0f0", padding:"0 24px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:24 }}>
            <a href="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
              <div style={{ width:34, height:34, background:"#16a34a", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:"white" }}>T</div>
              <span style={{ color:"#0f172a", fontWeight:800, fontSize:16 }}>TalentMaroc</span>
            </a>
            <span style={{ color:"#16a34a", fontSize:14, fontWeight:700, padding:"6px 12px", background:"#f0fdf4", borderRadius:8 }}>Dashboard Recruteur</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <a href="/employeur" className="nl"><Plus size={14} style={{ display:"inline" }}/> Nouvelle offre</a>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"#f0fdf4", border:"1.5px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#15803d" }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <button onClick={()=>{ getSupabase().auth.signOut(); window.location.href="/employeur"; }} className="nl" style={{ border:"none", cursor:"pointer", background:"none" }}>
              Déconnexion
            </button>
          </div>
        </nav>

        <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 20px 80px" }}>

          {/* PAGE HEADER */}
          <div className="au" style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:"clamp(20px,3vw,26px)", fontWeight:800, marginBottom:4 }}>Mes offres d'emploi</h1>
            <p style={{ fontSize:14, color:"#6b7280" }}>
              Bonjour {user?.user_metadata?.name || user?.email?.split("@")[0]} · {totalJobs} offre{totalJobs!==1?"s":""} publiée{totalJobs!==1?"s":""}
            </p>
          </div>

          {globalErr && (
            <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:10, padding:"14px 18px", marginBottom:20, fontSize:13, color:"#dc2626", display:"flex", gap:8, alignItems:"center" }}>
              <AlertCircle size={16}/> {globalErr}
            </div>
          )}

          {/* STATS */}
          <div className="au stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:28, animationDelay:".06s" }}>
            {[
              { icon:<BarChart2 size={16}/>, label:"Offres publiées", value:totalJobs,    color:"#16a34a", bg:"#f0fdf4" },
              { icon:<Users size={16}/>,    label:"Candidatures",    value:totalApps,    color:"#1d4ed8", bg:"#eff6ff" },
              { icon:<Star size={16}/>,     label:"Offres featured", value:featuredJobs, color:"#92400e", bg:"#fef3c7" },
              { icon:<TrendingUp size={16}/>,label:"Offres actives",  value:activeJobs,  color:"#065f46", bg:"#f0fdf4" },
            ].map((s,i)=>(
              <div key={i} className="stat-card" style={{ animationDelay:`${i*.05}s` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", color:s.color }}>{s.icon}</div>
                  <div style={{ fontSize:26, fontWeight:800, color:s.value>0?s.color:"#d1d5db" }}>{s.value}</div>
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* CONTROLS */}
          <div className="au" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:20, animationDelay:".1s" }}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
              {/* Search */}
              <div style={{ position:"relative" }}>
                <Search size={14} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}/>
                <input placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}
                  style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"9px 14px 9px 32px", fontSize:13, fontFamily:"inherit", width:220, outline:"none" }}/>
              </div>
              {/* Filters */}
              {[["all","Toutes"],["active","Actives"],["featured","⭐ Featured"]].map(([v,l])=>(
                <button key={v} className={`chip-filter${filterStatus===v?" active":""}`} onClick={()=>setFilter(v as any)}>{l}</button>
              ))}
            </div>
            <a href="/employeur" className="btn-green" style={{ textDecoration:"none" }}>
              <Plus size={14}/> Nouvelle offre
            </a>
          </div>

          {/* JOBS LIST */}
          {filtered.length === 0 && !loading ? (
            <div className="au" style={{ textAlign:"center", padding:"56px 24px", background:"white", border:"2px dashed #e5e7eb", borderRadius:14, animationDelay:".12s" }}>
              <div style={{ fontSize:40, marginBottom:14 }}>📋</div>
              <h3 style={{ fontSize:17, fontWeight:800, marginBottom:8 }}>
                {totalJobs === 0 ? "Aucune offre publiée" : "Aucun résultat"}
              </h3>
              <p style={{ fontSize:14, color:"#6b7280", marginBottom:20 }}>
                {totalJobs === 0 ? "Publiez votre première offre pour commencer à recruter." : "Modifiez votre recherche ou vos filtres."}
              </p>
              {totalJobs === 0 && <a href="/employeur" className="btn-green" style={{ textDecoration:"none" }}><Plus size={14}/> Publier une offre</a>}
            </div>
          ) : (
            <div className="au" style={{ display:"flex", flexDirection:"column", gap:10, animationDelay:".12s" }}>
              {filtered.map(job => (
                <div key={job.id} className="job-row">
                  <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
                    {/* Logo */}
                    <div style={{ width:44, height:44, borderRadius:10, background:"#f3f4f6", flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"#9ca3af" }}>
                      {job.logo_url
                        ? <img src={job.logo_url} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }} onError={e=>(e.currentTarget.style.display="none")}/>
                        : job.company.charAt(0)}
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                        <div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{job.title}</div>
                        {job.featured && <span style={{ fontSize:10, fontWeight:700, background:"#fef3c7", color:"#92400e", padding:"2px 8px", borderRadius:100, border:"1px solid #fde68a" }}>⭐ FEATURED</span>}
                      </div>
                      <div style={{ fontSize:12, color:"#6b7280", display:"flex", gap:12, flexWrap:"wrap" }}>
                        <span style={{ fontWeight:600, color:"#374151" }}>{job.company}</span>
                        <span>📍 {job.city}</span>
                        {job.contract_type && <span>· {job.contract_type}</span>}
                        {job.sector && <span>· {job.sector}</span>}
                        <span style={{ color:"#9ca3af" }}>· {new Date(job.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hide-sm" style={{ display:"flex", gap:16, alignItems:"center" }}>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:(job.application_count||0)>0?"#16a34a":"#d1d5db" }}>{job.application_count||0}</div>
                        <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600 }}>candidatures</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                      {/* View on site */}
                      {job.original_url && (
                        <a href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ padding:"7px 12px", fontSize:12, textDecoration:"none" }}>
                          <Eye size={13}/> Voir
                        </a>
                      )}
                      {/* Featured toggle */}
                      <button onClick={()=>toggleFeatured(job)} title={job.featured?"Retirer featured":"Mettre en avant"}
                        style={{ padding:"7px 10px", borderRadius:8, border:"1.5px solid #e5e7eb", background:job.featured?"#fef3c7":"white", cursor:"pointer", fontSize:14, transition:"all .15s" }}>
                        {job.featured ? "⭐" : "☆"}
                      </button>
                      {/* Edit */}
                      <button className="btn-ghost" onClick={()=>openEdit(job)} title="Modifier">
                        <Edit3 size={15}/>
                      </button>
                      {/* Delete */}
                      <button className="btn-danger" onClick={()=>setDeleteId(job.id)} title="Supprimer">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </div>

                  {/* Applications detail row if any */}
                  {(job.application_count||0) > 0 && (
                    <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #f3f4f6", display:"flex", gap:8, alignItems:"center" }}>
                      <div style={{ fontSize:12, color:"#6b7280" }}>
                        <Users size={12} style={{ display:"inline", marginRight:5, verticalAlign:"middle" }}/>
                        <strong style={{ color:"#16a34a" }}>{job.application_count}</strong> candidat{(job.application_count||0)>1?"s":""} ont sauvegardé cette offre
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {editJob && editForm && (
        <div className="modal-bg" onClick={()=>setEditJob(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding:"20px 24px", borderBottom:"1.5px solid #f0f0f0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800 }}>Modifier l'offre</div>
                <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{editJob.title} · {editJob.company}</div>
              </div>
              <button className="btn-ghost" onClick={()=>setEditJob(null)}><X size={18}/></button>
            </div>

            <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:16 }}>
              {/* Title + company */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:5, color:"#374151" }}>Intitulé du poste *</label>
                  <input style={{ ...{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"10px 13px", width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"white", outline:"none" } }} value={editForm.title} onChange={e=>setEditForm(p=>p?({...p,title:e.target.value}):p)}/></div>
                <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:5, color:"#374151" }}>Entreprise *</label>
                  <input style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"10px 13px", width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"white", outline:"none" }} value={editForm.company} onChange={e=>setEditForm(p=>p?({...p,company:e.target.value}):p)}/></div>
              </div>
              {/* City + sector */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:5, color:"#374151" }}>Ville *</label>
                  <select style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"10px 13px", width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"white", outline:"none" }} value={editForm.city} onChange={e=>setEditForm(p=>p?({...p,city:e.target.value}):p)}>
                    <option value="">...</option>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:5, color:"#374151" }}>Secteur</label>
                  <select style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"10px 13px", width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"white", outline:"none" }} value={editForm.sector} onChange={e=>setEditForm(p=>p?({...p,sector:e.target.value}):p)}>
                    <option value="">...</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              {/* Contract + salary */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:5, color:"#374151" }}>Contrat</label>
                  <select style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"10px 13px", width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"white", outline:"none" }} value={editForm.contract_type} onChange={e=>setEditForm(p=>p?({...p,contract_type:e.target.value}):p)}>
                    <option value="">...</option>{CONTRACTS.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:5, color:"#374151" }}>Salaire</label>
                  <input style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"10px 13px", width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"white", outline:"none" }} value={editForm.salary} onChange={e=>setEditForm(p=>p?({...p,salary:e.target.value}):p)} placeholder="8 000 – 12 000 DH"/></div>
              </div>
              {/* Description */}
              <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:5, color:"#374151" }}>Description</label>
                <textarea style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"10px 13px", width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"white", outline:"none", resize:"vertical", lineHeight:1.6 }} rows={6} value={editForm.description} onChange={e=>setEditForm(p=>p?({...p,description:e.target.value}):p)}/></div>
              {/* URLs */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:5, color:"#374151" }}>Lien de candidature</label>
                  <input style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"10px 13px", width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"white", outline:"none" }} value={editForm.original_url} onChange={e=>setEditForm(p=>p?({...p,original_url:e.target.value}):p)} placeholder="https://..."/></div>
                <div><label style={{ fontSize:12, fontWeight:600, display:"block", marginBottom:5, color:"#374151" }}>URL du logo</label>
                  <input style={{ border:"1.5px solid #e5e7eb", borderRadius:9, padding:"10px 13px", width:"100%", fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"white", outline:"none" }} value={editForm.logo_url} onChange={e=>setEditForm(p=>p?({...p,logo_url:e.target.value}):p)} placeholder="https://..."/></div>
              </div>

              {saveErr && <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#dc2626" }}>⚠ {saveErr}</div>}

              <div style={{ display:"flex", justifyContent:"flex-end", gap:10, paddingTop:4 }}>
                <button className="btn-outline" onClick={()=>setEditJob(null)}>Annuler</button>
                <button className="btn-green" onClick={saveEdit} disabled={saving}>
                  <Save size={14}/> {saving ? "Sauvegarde…" : "Sauvegarder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteId && (
        <div className="modal-bg" onClick={()=>setDeleteId(null)}>
          <div style={{ background:"white", borderRadius:14, padding:"32px 28px", maxWidth:380, width:"100%", boxShadow:"0 20px 50px rgba(0,0,0,.2)", textAlign:"center" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:36, marginBottom:14 }}>🗑</div>
            <h3 style={{ fontSize:17, fontWeight:800, marginBottom:8 }}>Supprimer cette offre ?</h3>
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:24, lineHeight:1.6 }}>Cette action est irréversible. L'offre sera définitivement supprimée de la plateforme.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button className="btn-outline" onClick={()=>setDeleteId(null)}>Annuler</button>
              <button onClick={confirmDelete} disabled={deleting}
                style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#dc2626", color:"white", padding:"10px 20px", borderRadius:9, fontSize:13, fontWeight:700, border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                <Trash2 size={14}/> {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}