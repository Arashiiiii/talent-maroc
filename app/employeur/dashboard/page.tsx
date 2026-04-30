"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import * as XLSX from "xlsx";

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
type DashTab   = "overview"|"jobs"|"candidates"|"profile";

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

// Columns listed here will display a clean label in the cell but open the URL on click.
// The raw link is never visible in the spreadsheet.
const HYPERLINK_COLS: Record<string, string> = {
  "CV (lien PDF)": "📄 Voir le CV",
};

function dlExcel(filename: string, rows: Record<string,any>[]) {
  if (!rows.length) return;

  const cols = Object.keys(rows[0]);

  // Build display rows: replace URL values with clean labels
  const displayRows = rows.map(row => {
    const r: Record<string,any> = {};
    cols.forEach(c => { r[c] = HYPERLINK_COLS[c] && row[c] ? HYPERLINK_COLS[c] : row[c]; });
    return r;
  });

  const ws = XLSX.utils.json_to_sheet(displayRows);

  // Inject Excel hyperlinks so clicking the label opens the real URL
  Object.entries(HYPERLINK_COLS).forEach(([colName, label]) => {
    const colIdx = cols.indexOf(colName);
    if (colIdx === -1) return;
    rows.forEach((row, rowIdx) => {
      const url = row[colName];
      if (!url) return;
      const ref = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx }); // +1 = skip header
      if (ws[ref]) ws[ref].l = { Target: url, Tooltip: "Cliquez pour télécharger le CV" };
    });
  });

  const colWidths = cols.map(k => ({
    wch: Math.max(k.length, 18, ...rows.map(r => {
      const v = HYPERLINK_COLS[k] ? HYPERLINK_COLS[k] : String(r[k]??'');
      return Math.min(v.length, 60);
    }))
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidats");
  XLSX.writeFile(wb, filename);
}

interface AICandidate { rank:number; name:string; score:number; strengths:string[]; concerns:string[]; summary:string; }
interface AIResult { candidates:AICandidate[]; recommendation:string; top3:string[]; }

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
  const [compareResult,setCompareResult]= useState<AIResult|null>(null);
  const [compareModal, setCompareModal] = useState(false);
  const [aiScores,     setAiScores]     = useState<Record<string,number>>({}); // name→score
  // Profile form
  const [pName,     setPName]     = useState("");
  const [pCompany,  setPCompany]  = useState("");
  const [pPhone,    setPPhone]    = useState("");
  const [pWebsite,  setPWebsite]  = useState("");
  const [pLogoUrl,  setPLogoUrl]  = useState("");
  const [pSaving,   setPSaving]   = useState(false);
  const [pMsg,      setPMsg]      = useState<{type:"ok"|"err";text:string}|null>(null);
  const [token,     setToken]     = useState<string>("");

  // ── LOAD ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const sb = getSupabase();

    // Global logout listener — redirect to employer login on sign-out from any tab
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        window.location.href = "/employeur";
      }
    });

    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href="/employeur"; return; }
      const user = session.user;
      // Role guard: candidates use their own dashboard
      if (user.user_metadata?.role === "candidate") {
        window.location.href = "/dashboard"; return;
      }
      setUser(user);
      setToken(session.access_token);
      // Pre-fill profile form from user metadata
      const m = user.user_metadata || {};
      setPName(m.name || "");
      setPCompany(m.company_name || "");
      setPPhone(m.phone || "");
      setPWebsite(m.website || "");
      setPLogoUrl(m.logo_url || "");
      load(user.id, session.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  const load = useCallback(async (uid: string, token: string) => {
    setLoading(true);
    const sb = getSupabase();

    const { data: jobsData, error: jErr } = await sb
      .from("jobs")
      .select("*")
      .eq("employer_id", uid)
      .order("created_at", { ascending: false });

    if (jErr) { setErr(jErr.message); setLoading(false); return; }
    const myJobs: Job[] = jobsData || [];

    // Fetch applications via server-side API route (bypasses candidate-scoped RLS)
    let apps: Application[] = [];
    if (myJobs.length > 0) {
      try {
        const res = await fetch("/api/employer/applications", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) {
          apps = json.applications || [];
        } else {
          setErr(json.error || "Impossible de charger les candidatures.");
        }
      } catch {
        setErr("Erreur réseau lors du chargement des candidatures.");
      }
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
    // Use server-side route with service role key to bypass RLS
    const res = await fetch("/api/employer/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ applicationId: id, status }),
    });
    if (!res.ok) { const j = await res.json(); setErr(j.error || "Erreur mise à jour"); return; }
    const upd=(a:Application)=>a.id===id?{...a,status}:a;
    setAllApps(p=>p.map(upd));
    setJobs(p=>p.map(j=>({...j,apps:j.apps?.map(upd)})));
  };

  const setEF=(k:keyof Job)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>
    setEditForm(p=>({...p,[k]:e.target.value}));

  const [zipping, setZipping] = useState(false);

  const downloadCvsZip = async () => {
    const withCv = filteredApps.filter(a => a.cv_url);
    if (!withCv.length) { setErr("Aucun CV disponible parmi les candidats filtrés."); return; }

    setZipping(true);
    const zip = new JSZip();
    const folder = zip.folder("CVs_TalentMaroc")!;
    let failed = 0;

    await Promise.all(withCv.map(async (a) => {
      const slug = (a.candidate_name || `candidat_${a.user_id.slice(0,6)}`).replace(/\s+/g, "_");
      const filename = `${slug}_${a.job_title.replace(/\s+/g,"_").slice(0,30)}.pdf`;
      try {
        const res = await fetch(a.cv_url!);
        if (!res.ok) throw new Error("fetch failed");
        const blob = await res.blob();
        folder.file(filename, blob);
      } catch {
        failed++;
      }
    }));

    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    const label = jobFilter !== "all" ? jobs.find(j=>j.id===jobFilter)?.title?.replace(/\s+/g,"_").slice(0,30) || "offre" : "toutes_offres";
    a.href = url;
    a.download = `CVs_${label}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setZipping(false);
    if (failed > 0) setErr(`${failed} CV(s) n'ont pas pu être téléchargés (lien expiré ou inaccessible).`);
  };

  const signOut = async () => {
    await getSupabase().auth.signOut();
    window.location.href = "/employeur";
  };

  const saveProfile = async () => {
    if (!pName.trim() || !pCompany.trim()) {
      setPMsg({ type:"err", text:"Nom et entreprise sont requis." });
      return;
    }
    setPSaving(true); setPMsg(null);
    const { error } = await getSupabase().auth.updateUser({
      data: {
        name:         pName.trim(),
        company_name: pCompany.trim(),
        phone:        pPhone.trim() || null,
        website:      pWebsite.trim() || null,
        logo_url:     pLogoUrl.trim() || null,
      },
    });
    setPSaving(false);
    if (error) {
      setPMsg({ type:"err", text: error.message });
    } else {
      setPMsg({ type:"ok", text: "Profil mis à jour avec succès." });
      // Refresh user in state
      const { data: { user: u } } = await getSupabase().auth.getUser();
      if (u) setUser(u);
    }
  };

  // ── DOWNLOAD APPLICATION FILES ──────────────────────────────────────────
  const downloadApplicationFiles = (app: Application) => {
    if (!app.cv_url && !app.cover_letter) {
      setErr("Ce candidat n'a pas joint de CV ni de lettre de motivation.");
      return;
    }

    const name    = app.candidate_name || "Candidat";
    const date    = app.applied_at ? new Date(app.applied_at).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR");
    const letter  = (app.cover_letter || "").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>");

    const html = `<!DOCTYPE html><html lang="fr"><head>
      <meta charset="UTF-8"/>
      <title>Dossier — ${name}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;background:white}
        .page{max-width:780px;margin:0 auto;padding:48px 40px}
        .header{border-bottom:3px solid #7c3aed;padding-bottom:20px;margin-bottom:32px}
        .badge{display:inline-block;background:#7c3aed;color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;letter-spacing:.05em;margin-bottom:10px}
        h1{font-size:22px;font-weight:800;color:#1e1147;margin-bottom:6px}
        .meta{font-size:13px;color:#6b7280;display:flex;gap:24px;flex-wrap:wrap}
        .section-title{font-size:13px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px;display:flex;align-items:center;gap:8px}
        .section-title::after{content:'';flex:1;height:1px;background:#ede9fe}
        .letter-box{background:#fafaf9;border:1px solid #e5e7eb;border-radius:10px;padding:28px 32px;font-size:14px;line-height:1.85;color:#374151;white-space:pre-wrap}
        .cv-frame{width:100%;height:900px;border:1px solid #e5e7eb;border-radius:10px;margin-top:8px}
        .cv-link{display:inline-block;margin-top:10px;font-size:13px;color:#7c3aed;font-weight:600}
        .no-cv{padding:32px;text-align:center;background:#f5f3ff;border:1.5px dashed #ddd6fe;border-radius:10px;color:#6b7280;font-size:13px}
        .print-btn{position:fixed;bottom:24px;right:24px;background:#7c3aed;color:white;border:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(124,58,237,.4);font-family:inherit}
        @media print{.print-btn{display:none}.page{padding:24px 20px}.cv-frame{height:1000px}}
      </style>
    </head><body>
      <div class="page">
        <div class="header">
          <div class="badge">DOSSIER DE CANDIDATURE</div>
          <h1>${name}</h1>
          <div class="meta">
            ${app.candidate_email ? `<span>📧 ${app.candidate_email}</span>` : ""}
            <span>💼 ${app.job_title}</span>
            <span>📅 ${date}</span>
          </div>
        </div>

        ${app.cover_letter ? `
        <div style="margin-bottom:40px">
          <div class="section-title">✉️ Lettre de motivation</div>
          <div class="letter-box">${letter}</div>
        </div>` : ""}

        <div>
          <div class="section-title">📄 CV</div>
          ${app.cv_url
            ? `<embed src="${app.cv_url}" type="application/pdf" class="cv-frame"/>
               <a href="${app.cv_url}" target="_blank" class="cv-link">↗ Ouvrir le CV dans un nouvel onglet</a>`
            : `<div class="no-cv">Aucun CV joint par ce candidat.</div>`}
        </div>
      </div>
      <button class="print-btn" onclick="window.print()">🖨 Imprimer / Sauvegarder en PDF</button>
    </body></html>`;

    const win = window.open("", "_blank");
    if (!win) { setErr("Autorisez les popups pour télécharger le dossier."); return; }
    win.document.write(html);
    win.document.close();
  };

  // ── AI COMPARE ─────────────────────────────────────────────────────────
  const aiCompare = async () => {
    const candidates = filteredApps.slice(0, 10);
    if (candidates.length < 2) { setErr("Sélectionnez au moins 2 candidats (utilisez les filtres)."); return; }
    setComparing(true); setCompareResult(null); setCompareModal(true);
    const job = jobs.find(j => j.id === jobFilter) || jobs[0];
    try {
      const res = await fetch("/api/ai-compare", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
      const result: AIResult = data.result;
      setCompareResult(result);
      // Store scores by name for Excel export
      const scores: Record<string,number> = {};
      result.candidates.forEach(c => { scores[c.name] = c.score; });
      setAiScores(prev => ({ ...prev, ...scores }));
    } catch (e: any) {
      setErr(`Erreur comparaison IA : ${e.message}`);
      setCompareModal(false);
    } finally {
      setComparing(false);
    }
  };

  // ── EXCEL EXPORT ──────────────────────────────────────────────────────────
  const downloadExcel = (apps: Application[], filename: string) => {
    const rows = apps.map(a => ({
      "Nom":               a.candidate_name  || "—",
      "Email":             a.candidate_email || "—",
      "Poste":             a.job_title,
      "Ville":             a.city            || "—",
      "Date candidature":  a.applied_at ? new Date(a.applied_at).toLocaleDateString("fr-FR") : "—",
      "Statut":            STATUS_CFG[a.status].label,
      "Notes":             a.notes           || "",
      "Lettre de motivation": a.cover_letter || "",
      "CV (lien PDF)":     a.cv_url          || "",
      "Note IA / 10":      a.candidate_name ? (aiScores[a.candidate_name] ?? "") : "",
    }));
    dlExcel(filename, rows);
  };

  // Download top 10 from AI result
  const downloadTop10 = () => {
    if (!compareResult) return;
    const ranked = compareResult.candidates.slice(0, 10);
    const rows = ranked.map((c, i) => {
      const app = filteredApps.find(a => (a.candidate_name || "").includes(c.name) || c.name.includes(a.candidate_name || ""));
      return {
        "Rang":              i + 1,
        "Nom":               c.name,
        "Score IA / 10":     c.score,
        "Résumé IA":         c.summary,
        "Points forts":      c.strengths.join(" | "),
        "Points d'attention":c.concerns.join(" | "),
        "Email":             app?.candidate_email || "—",
        "Poste":             app?.job_title       || "—",
        "Ville":             app?.city            || "—",
        "Date candidature":  app?.applied_at ? new Date(app.applied_at).toLocaleDateString("fr-FR") : "—",
        "Statut":            app ? STATUS_CFG[app.status].label : "—",
        "Notes recruteur":   app?.notes           || "",
        "Lettre de motivation": app?.cover_letter || "",
        "CV (lien PDF)":     app?.cv_url          || "",
      };
    });
    dlExcel("top10_candidats_IA.xlsx", rows);
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:"3px solid #e5e7eb", borderTopColor:"#7c3aed", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 12px" }}/>
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
        input:focus,select:focus,textarea:focus{border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,.1)!important;outline:none!important}
        .tab-nav{display:flex;border-bottom:1.5px solid #ede9fe}
        .tab-item{padding:14px 18px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;font-family:inherit;color:#6b7280;border-bottom:2px solid transparent;transition:all .18s}
        .tab-item.active{color:#7c3aed;border-bottom-color:#7c3aed}
        .tab-item:hover:not(.active){color:#1e1147}
        .card{background:white;border:1.5px solid #ede9fe;border-radius:12px;box-shadow:0 1px 3px rgba(124,58,237,.06)}
        .btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;border:none;transition:all .18s;text-decoration:none;white-space:nowrap}
        .btn-green{background:linear-gradient(135deg,#7c3aed,#5b21b6);color:white;box-shadow:0 4px 12px rgba(124,58,237,.3)}.btn-green:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(124,58,237,.4)}
        .btn-outline{background:white;color:#374151;border:1.5px solid #e5e7eb}.btn-outline:hover{border-color:#7c3aed;color:#7c3aed}
        .btn-ghost{background:none;color:#6b7280;padding:6px;border-radius:7px}.btn-ghost:hover{background:#f5f3ff;color:#1e1147}
        .btn-del{background:none;color:#9ca3af;padding:6px;border-radius:7px;cursor:pointer;font-family:inherit;border:none;display:inline-flex;align-items:center}.btn-del:hover{background:#fef2f2;color:#dc2626}
        .btn-pro{background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none}.btn-pro:hover{opacity:.9}
        .chip{padding:6px 12px;border-radius:100px;border:1.5px solid #e5e7eb;background:white;cursor:pointer;font-size:11px;font-weight:600;color:#374151;font-family:inherit;transition:all .18s}
        .chip.active{border-color:#7c3aed;color:#6d28d9;background:#f5f3ff}
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
              <img src="/logo.png" alt="TalentMaroc" style={{ height:110, width:'auto', objectFit:'contain', margin:'-22px 0' }} />
            </a>
            <span style={{ fontSize:12, fontWeight:700, color:"#6d28d9", background:"#f5f3ff", padding:"4px 10px", borderRadius:7 }}>Dashboard Recruteur</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <a href="/employeur/new" className="nl">+ Nouvelle offre</a>
            <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#5b21b6)", border:"1.5px solid #ddd6fe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"white" }}>
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
            <div className="tab-nav" style={{ overflowX:"auto", scrollbarWidth:"none" }}>
              {([["overview","📊 Vue d'ensemble"],["jobs","💼 Mes offres"],["candidates","👥 Candidatures"],["profile","👤 Mon profil"]] as const).map(([t,l])=>(
                <button key={t} className={`tab-item${tab===t?" active":""}`} onClick={()=>setTab(t)} style={{ whiteSpace:"nowrap" }}>{l}</button>
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
                  {icon:"💼",label:"Mes offres",       val:jobs.length,       color:"#7c3aed", go:"jobs"       as DashTab},
                  {icon:"👥",label:"Candidatures",      val:totalApps,         color:"#1d4ed8", go:"candidates" as DashTab},
                  {icon:"🗓",label:"Entretiens",         val:interviews,        color:"#92400e", go:"candidates" as DashTab},
                  {icon:"📈",label:"Taux de réponse",   val:`${responseRate}%`, color:"#065f46", go:null},
                ].map((s,i)=>(
                  <div key={i} className="stat-card" onClick={()=>s.go&&setTab(s.go)}
                    style={{ cursor:s.go?"pointer":"default" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <span style={{ fontSize:20 }}>{s.icon}</span>
                      <span style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.val}</span>
                    </div>
                    <div style={{ fontSize:11, fontWeight:600, color:"#6b7280" }}>{s.label}</div>
                    {s.go && <div style={{ fontSize:10, color:"#9ca3af", marginTop:3 }}>Voir →</div>}
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding:"20px 22px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <h3 style={{ fontSize:14, fontWeight:800 }}>Mes offres récentes</h3>
                  <button className="btn btn-outline" onClick={()=>setTab("jobs")}>Voir tout →</button>
                </div>
                {jobs.length===0 ? (
                  <div style={{ textAlign:"center", padding:"28px", color:"#9ca3af", fontSize:13 }}>
                    Aucune offre publiée. <a href="/employeur/new" style={{ color:"#7c3aed", fontWeight:600 }}>Publier →</a>
                  </div>
                ) : jobs.slice(0,5).map(j=>(
                  <a key={j.id} href={`/jobs/${j.id}`} target="_blank" style={{ textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid #f3f4f6", flexWrap:"wrap", gap:8, color:"inherit" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{j.title}</div>
                      <div style={{ fontSize:11, color:"#6b7280" }}>{j.company} · {j.city} · {j.contract_type||"—"}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:(j.apps?.length||0)>0?"#7c3aed":"#d1d5db" }}>{j.apps?.length||0}</div>
                        <div style={{ fontSize:10, color:"#9ca3af" }}>candidat{(j.apps?.length||0)!==1?"s":""}</div>
                      </div>
                    </div>
                  </a>
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
                  <button className="btn btn-outline" onClick={()=>dlExcel("mes_offres.xlsx",jobs.map(j=>({ Titre:j.title, Entreprise:j.company, Ville:j.city, Contrat:j.contract_type||"", Secteur:j.sector||"", Salaire:j.salary||"", Candidatures:j.apps?.length||0 })))}>
                    ⬇ Excel offres
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
                            {j.salary&&<span style={{ color:"#7c3aed", fontWeight:600 }}>💰 {j.salary}</span>}
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
                            <div style={{ fontSize:18, fontWeight:800, color:(j.apps?.length||0)>0?"#7c3aed":"#d1d5db" }}>{j.apps?.length||0}</div>
                            <div style={{ fontSize:10, color:"#9ca3af" }}>candidat{(j.apps?.length||0)!==1?"s":""}</div>
                          </div>
                          <a href={`/jobs/${j.id}`} target="_blank" className="btn btn-outline" style={{ textDecoration:"none", fontSize:11 }}>👁 Voir</a>
                          <button className="btn btn-outline" style={{ fontSize:11 }} onClick={()=>downloadExcel(j.apps||[], `candidats_${j.title.slice(0,20)}.xlsx`)}>⬇ Excel</button>
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

          {/* ── PROFILE TAB ── */}
          {tab==="profile" && (
            <div className="au" style={{ maxWidth:560 }}>
              <div className="card" style={{ overflow:"hidden", marginBottom:16 }}>
                {/* Header */}
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", padding:"20px 24px", display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:"rgba(22,163,74,.25)", border:"2px solid rgba(22,163,74,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"white", flexShrink:0 }}>
                    {pCompany.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:"white" }}>{pCompany || "Votre entreprise"}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", marginTop:2 }}>{user?.email}</div>
                  </div>
                </div>

                <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.07em" }}>Informations du recruteur</div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }} className="edit-grid">
                    <EF label="Nom et prénom" required>
                      <input style={EIS} placeholder="Khadija Alaoui" value={pName} onChange={e=>setPName(e.target.value)}/>
                    </EF>
                    <EF label="Entreprise" required>
                      <input style={EIS} placeholder="Maroc Telecom" value={pCompany} onChange={e=>setPCompany(e.target.value)}/>
                    </EF>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }} className="edit-grid">
                    <EF label="Téléphone">
                      <input style={EIS} type="tel" placeholder="+212 6XX XXX XXX" value={pPhone} onChange={e=>setPPhone(e.target.value)}/>
                    </EF>
                    <EF label="Site web">
                      <input style={EIS} type="url" placeholder="https://entreprise.ma" value={pWebsite} onChange={e=>setPWebsite(e.target.value)}/>
                    </EF>
                  </div>

                  <EF label="URL du logo (optionnel)">
                    <input style={EIS} type="url" placeholder="https://..." value={pLogoUrl} onChange={e=>setPLogoUrl(e.target.value)}/>
                  </EF>

                  {pLogoUrl && (
                    <div style={{ display:"flex", alignItems:"center", gap:10, background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:9, padding:"10px 13px" }}>
                      <img src={pLogoUrl} alt="logo preview" style={{ width:36, height:36, objectFit:"contain", borderRadius:6, background:"white", border:"1px solid #e5e7eb" }} onError={e=>(e.currentTarget.style.display="none")}/>
                      <span style={{ fontSize:12, color:"#6b7280" }}>Aperçu du logo</span>
                    </div>
                  )}

                  <div style={{ height:1, background:"#f0f0f0" }}/>

                  <EF label="Email (compte)">
                    <input style={{ ...EIS, background:"#f9fafb", color:"#9ca3af" }} value={user?.email||""} disabled/>
                  </EF>

                  {pMsg && (
                    <div style={{ background:pMsg.type==="ok"?"#f5f3ff":"#fef2f2", border:`1.5px solid ${pMsg.type==="ok"?"#ddd6fe":"#fecaca"}`, borderRadius:8, padding:"10px 14px", fontSize:13, color:pMsg.type==="ok"?"#6d28d9":"#dc2626" }}>
                      {pMsg.type==="ok"?"✓":"⚠"} {pMsg.text}
                    </div>
                  )}

                  <button onClick={saveProfile} disabled={pSaving}
                    style={{ background:pSaving?"#a78bfa":"linear-gradient(135deg,#7c3aed,#5b21b6)", color:"white", padding:"12px", borderRadius:9, border:"none", fontSize:13, fontWeight:700, cursor:pSaving?"not-allowed":"pointer", fontFamily:"inherit", transition:"all .18s", boxShadow:"0 4px 14px rgba(124,58,237,.3)" }}>
                    {pSaving ? "Sauvegarde…" : "💾 Sauvegarder le profil"}
                  </button>
                </div>
              </div>

              {/* Account info */}
              <div className="card" style={{ padding:"18px 22px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Compte</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:13, color:"#374151" }}>Email</span>
                  <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{user?.email}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:13, color:"#374151" }}>Type de compte</span>
                  <span style={{ fontSize:12, fontWeight:700, background:"#f5f3ff", color:"#6d28d9", border:"1px solid #ddd6fe", padding:"3px 10px", borderRadius:100 }}>Recruteur</span>
                </div>
                <div style={{ height:1, background:"#f0f0f0", margin:"12px 0" }}/>
                <button onClick={signOut}
                  style={{ width:"100%", background:"none", border:"1.5px solid #fecaca", borderRadius:8, padding:"10px", fontSize:13, fontWeight:600, color:"#dc2626", cursor:"pointer", fontFamily:"inherit", transition:"all .18s" }}>
                  Se déconnecter
                </button>
              </div>
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
                  {(["all","interview","offer","rejected"] as const).map(s=>(
                    <button key={s} className={`chip${statusFilter===s?" active":""}`} onClick={()=>setStatusFilter(s as any)}>
                      {s==="all"?`Toutes (${allApps.length})`:`${STATUS_CFG[s as AppStatus]?.label} (${allApps.filter(a=>a.status===s).length})`}
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <button className="btn btn-outline" onClick={()=>downloadExcel(filteredApps, "candidatures.xlsx")}>
                    ⬇ Excel ({filteredApps.length})
                  </button>
                  <button className="btn btn-pro" style={{ background:"#0f172a", color:"white", opacity: zipping ? 0.7 : 1 }}
                    disabled={zipping}
                    title="Télécharger tous les CVs dans un fichier ZIP"
                    onClick={downloadCvsZip}>
                    {zipping ? "⏳ Préparation…" : `📦 CVs ZIP ✦ Pro (${filteredApps.filter(a=>a.cv_url).length})`}
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
                          <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#f5f3ff,#ede9fe)", border:"1.5px solid #ddd6fe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:"#6d28d9", flexShrink:0 }}>
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
                            {a.cover_letter&&(
                              <div style={{ fontSize:11, color:"#374151", marginTop:5, background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:6, padding:"6px 10px", lineHeight:1.6 }}>
                                <span style={{ fontWeight:700, color:"#6b7280" }}>✉️ Lettre : </span>
                                {a.cover_letter.slice(0,120)}{a.cover_letter.length>120?"…":""}
                              </div>
                            )}
                          </div>
                          {/* Status selector — recruiter-relevant statuses only */}
                          <select value={a.status} onChange={e=>updateStatus(a.id,e.target.value as AppStatus)}
                            style={{ border:`1.5px solid ${sc.border}`, background:sc.bg, color:sc.color, borderRadius:8, padding:"6px 10px", fontSize:11, fontWeight:700, fontFamily:"inherit", cursor:"pointer", outline:"none" }}>
                            {(["applied","interview","offer","rejected"] as AppStatus[]).map(s=>(
                              <option key={s} value={s}>{STATUS_CFG[s].label}</option>
                            ))}
                          </select>
                          {/* Actions */}
                          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                            {job&&<a href={`/jobs/${job.id}`} target="_blank" className="btn btn-outline" style={{ textDecoration:"none", fontSize:11, padding:"5px 8px" }}>👁 Offre</a>}
                            {a.cv_url && (
                              <a href={a.cv_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ textDecoration:"none", fontSize:11, padding:"5px 8px", color:"#7c3aed", borderColor:"#ddd6fe" }}>📄 CV</a>
                            )}
                            {displayEmail && (
                              <a href={`mailto:${displayEmail}?subject=Votre candidature pour ${a.job_title}`} className="btn btn-outline" style={{ textDecoration:"none", fontSize:11, padding:"5px 8px" }}>✉️</a>
                            )}
                            {/* Download CV + cover letter as named files */}
                            {(a.cv_url || a.cover_letter) && (
                              <button
                                onClick={()=>downloadApplicationFiles(a)}
                                title={`Télécharger CV + lettre — ${displayName}`}
                                style={{ fontSize:11, padding:"5px 8px", background:"#f5f3ff", color:"#6d28d9", borderRadius:6, fontWeight:600, border:"1px solid #ddd6fe", cursor:"pointer", fontFamily:"inherit" }}>
                                ⬇ Dossier
                              </button>
                            )}
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

      {/* ── AI COMPARE DASHBOARD MODAL ── */}
      {compareModal&&(
        <div className="modal-bg" onClick={()=>{ if(!comparing){ setCompareModal(false); setCompareResult(null); } }}>
          <div className="modal" style={{ maxWidth:820, width:"95vw", maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column" }} onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding:"20px 24px", borderBottom:"1.5px solid #f0f0f0", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:800, display:"flex", alignItems:"center", gap:8 }}>
                  🤖 Tableau de scoring IA
                  <span style={{ fontSize:10, fontWeight:700, background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"white", padding:"2px 8px", borderRadius:100 }}>PRO</span>
                </div>
                <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>Analyse de {Math.min(filteredApps.length,10)} candidats · {jobs.find(j=>j.id===jobFilter)?.title || "Tous postes"}</div>
              </div>
              {!comparing&&<button onClick={()=>{ setCompareModal(false); setCompareResult(null); }} style={{ background:"none", border:"none", fontSize:20, color:"#9ca3af", cursor:"pointer" }}>×</button>}
            </div>

            {/* Body */}
            <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
              {comparing ? (
                <div style={{ textAlign:"center", padding:"60px 40px" }}>
                  <div style={{ width:48, height:48, border:"3px solid #e5e7eb", borderTopColor:"#7c3aed", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 20px" }}/>
                  <div style={{ fontSize:15, fontWeight:700, color:"#1e1147", marginBottom:6 }}>Analyse IA en cours…</div>
                  <div style={{ fontSize:13, color:"#6b7280" }}>L'IA évalue et classe les candidats</div>
                </div>
              ) : compareResult ? (<>
                {/* Recommendation banner */}
                <div style={{ background:"linear-gradient(135deg,#f5f3ff,#ede9fe)", border:"1.5px solid #ddd6fe", borderRadius:12, padding:"16px 20px", marginBottom:24 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#7c3aed", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Recommandation IA</div>
                  <div style={{ fontSize:13, lineHeight:1.7, color:"#1e1147" }}>{compareResult.recommendation}</div>
                  {compareResult.top3.length > 0 && (
                    <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
                      {compareResult.top3.map((n,i)=>(
                        <span key={i} style={{ fontSize:12, fontWeight:700, background:["#7c3aed","#6d28d9","#5b21b6"][i], color:"white", padding:"4px 12px", borderRadius:100 }}>
                          {["🥇","🥈","🥉"][i]} {n}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scoring cards */}
                <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
                  {compareResult.candidates.map((c,i)=>{
                    const pct = (c.score / 10) * 100;
                    const color = c.score >= 8 ? "#059669" : c.score >= 6 ? "#d97706" : "#dc2626";
                    const bg    = c.score >= 8 ? "#f0fdf4" : c.score >= 6 ? "#fffbeb" : "#fef2f2";
                    const border= c.score >= 8 ? "#bbf7d0" : c.score >= 6 ? "#fde68a" : "#fecaca";
                    return (
                      <div key={i} style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:12, padding:"14px 18px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                          {/* Rank badge */}
                          <div style={{ width:32, height:32, borderRadius:"50%", background:i<3?"#7c3aed":"#e5e7eb", color:i<3?"white":"#6b7280", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, flexShrink:0 }}>
                            {i+1}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{c.name}</div>
                            <div style={{ fontSize:12, color:"#6b7280" }}>{c.summary}</div>
                          </div>
                          {/* Score */}
                          <div style={{ textAlign:"center", flexShrink:0 }}>
                            <div style={{ fontSize:26, fontWeight:800, color, lineHeight:1 }}>{c.score}</div>
                            <div style={{ fontSize:10, color:"#9ca3af" }}>/ 10</div>
                          </div>
                        </div>
                        {/* Score bar */}
                        <div style={{ height:6, background:"#e5e7eb", borderRadius:100, marginBottom:10 }}>
                          <div style={{ height:6, borderRadius:100, background:color, width:`${pct}%`, transition:"width .6s" }}/>
                        </div>
                        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                          <div style={{ flex:1, minWidth:200 }}>
                            <div style={{ fontSize:10, fontWeight:700, color:"#059669", textTransform:"uppercase", marginBottom:4 }}>Points forts</div>
                            {c.strengths.map((s,j)=><div key={j} style={{ fontSize:11, color:"#374151" }}>✓ {s}</div>)}
                          </div>
                          {c.concerns.length > 0 && (
                            <div style={{ flex:1, minWidth:200 }}>
                              <div style={{ fontSize:10, fontWeight:700, color:"#dc2626", textTransform:"uppercase", marginBottom:4 }}>Points d'attention</div>
                              {c.concerns.map((s,j)=><div key={j} style={{ fontSize:11, color:"#374151" }}>⚠ {s}</div>)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Score chart (horizontal bars) */}
                <div style={{ background:"white", border:"1.5px solid #e5e7eb", borderRadius:12, padding:"18px 20px", marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>📊 Graphique des scores</div>
                  {[...compareResult.candidates].sort((a,b)=>b.score-a.score).map((c,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <div style={{ width:130, fontSize:11, color:"#374151", textAlign:"right", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</div>
                      <div style={{ flex:1, height:20, background:"#f1f5f9", borderRadius:100, overflow:"hidden" }}>
                        <div style={{ height:20, borderRadius:100, background:`linear-gradient(90deg,#7c3aed,#a78bfa)`, width:`${(c.score/10)*100}%`, transition:"width .8s", display:"flex", alignItems:"center", paddingRight:6, justifyContent:"flex-end" }}>
                          <span style={{ fontSize:10, fontWeight:700, color:"white" }}>{c.score}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>) : null}
            </div>

            {/* Footer */}
            {!comparing && compareResult && (
              <div style={{ padding:"16px 24px", borderTop:"1.5px solid #f0f0f0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, gap:10, flexWrap:"wrap" }}>
                <div style={{ fontSize:12, color:"#6b7280" }}>Top {Math.min(compareResult.candidates.length,10)} candidats analysés</div>
                <div style={{ display:"flex", gap:10 }}>
                  <button className="btn btn-outline" onClick={downloadTop10}>⬇ Top 10 Excel</button>
                  <button className="btn btn-green" onClick={()=>{ setCompareModal(false); setCompareResult(null); }}>Fermer</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
