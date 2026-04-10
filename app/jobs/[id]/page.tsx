import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { MapPin, Briefcase, Clock, ArrowLeft, ExternalLink, Building2, Globe, Zap } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import { SaveApplyButton } from '@/components/SaveApplyButton';

export const metadata = {
  title: "Offre d'emploi | Talent Maroc",
  description: "Consultez cette offre d'emploi et postulez directement sur Talent Maroc.",
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ── SKELETON ──────────────────────────────────────────────────────────────
function JobDetailSkeleton() {
  const skel = { background:'#f3f4f6', borderRadius:8 } as const;
  return (
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ background:'white', border:'1.5px solid #f0f0f0', borderRadius:16, padding:'28px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', gap:16, marginBottom:20 }}>
          <div style={{ ...skel, width:56, height:56, borderRadius:12, flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <div style={{ ...skel, height:22, width:'55%', marginBottom:10 }}/>
            <div style={{ ...skel, height:14, width:'38%' }}/>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[80,110,90].map(w=><div key={w} style={{ ...skel, height:28, width:w, borderRadius:100 }}/>)}
        </div>
      </div>
      <div style={{ background:'white', border:'1.5px solid #f0f0f0', borderRadius:14, padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        {[100,92,96,72,85,60,88].map((w,i)=>(
          <div key={i} style={{ ...skel, height:13, width:`${w}%`, marginBottom:11 }}/>
        ))}
      </div>
    </div>
  );
}

// ── JOB DETAIL ────────────────────────────────────────────────────────────
async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  noStore();
  const { id } = await params;
  const supabase = getSupabase();

  const { data: job, error } = await supabase
    .from('jobs').select('*').eq('id', id).single();

  // Only call notFound() when the job genuinely doesn't exist (PGRST116 = 0 rows)
  // Other errors (RLS, network) should surface rather than silently 404
  if (!job) notFound();
  if (error && error.code !== 'PGRST116') notFound();

  // Use simple .eq('city') to avoid PostgREST breaking on special chars in company names
  const { data: similarJobs } = await supabase
    .from('jobs')
    .select('id,title,company,city,created_at,posted_at,logo_url')
    .neq('id', id)
    .eq('city', job.city || '')
    .order('created_at', { ascending: false })
    .limit(3);

  const posted = job.posted_at || new Date(job.created_at).toLocaleDateString('fr-FR');

  return (
    <>
      {/* ── LEFT: content ─────────────────────────────────────────── */}
      <div style={{ flex:1, minWidth:0 }}>

        {/* Header card */}
        <div style={{ background:'white', border:'1.5px solid #f0f0f0', borderRadius:16, padding:'28px 26px', marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#16a34a,#4ade80)' }}/>
          <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
            <div style={{ flexShrink:0 }}><CompanyLogo logoUrl={job.logo_url} companyName={job.company}/></div>
            <div style={{ flex:1, minWidth:0 }}>
              <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'clamp(17px,4vw,24px)', fontWeight:800, color:'#0f172a', lineHeight:1.2, marginBottom:8 }}>
                {job.title}
              </h1>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 14px', fontSize:13, color:'#6b7280', marginBottom:14 }}>
                <span style={{ display:'flex', alignItems:'center', gap:4, color:'#374151', fontWeight:700 }}>
                  <Building2 size={13} style={{ color:'#9ca3af' }}/> {job.company}
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <MapPin size={13} style={{ color:'#9ca3af' }}/> {job.city}
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <Clock size={13} style={{ color:'#9ca3af' }}/> {posted}
                </span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {job.contract_type && <span className="pill pill-green">{job.contract_type}</span>}
                {job.sector        && <span className="pill pill-blue">{job.sector}</span>}
                {job.salary        && <span className="pill pill-amber">💰 {job.salary}</span>}
                {job.experience    && <span className="pill pill-gray">📊 {job.experience}</span>}
                {job.education     && <span className="pill pill-gray">🎓 {job.education}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Meta strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:9, marginBottom:14 }}>
          {[
            { icon:<MapPin size={14}/>,    color:'#16a34a', label:'Localisation', value:job.city },
            { icon:<Briefcase size={14}/>, color:'#2563eb', label:'Contrat',      value:job.contract_type || 'Non précisé' },
            { icon:<Clock size={14}/>,     color:'#d97706', label:'Publiée',      value:posted },
            ...(job.salary ? [{ icon:<Globe size={14}/>, color:'#7c3aed', label:'Salaire', value:job.salary }] : []),
          ].map(row=>(
            <div key={row.label} className="meta-item">
              <span style={{ color:row.color, flexShrink:0 }}>{row.icon}</span>
              <div>
                <div style={{ fontSize:10, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2, fontWeight:600 }}>{row.label}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{row.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ background:'white', border:'1.5px solid #f0f0f0', borderRadius:14, padding:'24px 26px', marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:3, height:16, background:'#16a34a', borderRadius:2, display:'inline-block', flexShrink:0 }}/>
            Description du poste
          </h2>
          {job.description ? (
            <div className="job-desc" dangerouslySetInnerHTML={{ __html: job.description }}/>
          ) : (
            <div className="job-desc">
              <p><strong>{job.company}</strong> recrute un(e) <strong>{job.title}</strong> basé(e) à <strong>{job.city}</strong>.</p>
              <p style={{ marginTop:10, color:'#9ca3af', fontSize:14 }}>
                La description complète est disponible sur le site de l'entreprise. Cliquez sur le bouton ci-dessous pour postuler directement.
              </p>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="hide-sm" style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:13, padding:'22px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:18, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:3 }}>Prêt(e) à postuler ?</div>
            <div style={{ fontSize:13, color:'#4b7c59' }}>Vous allez être redirigé(e) vers le site de {job.company}.</div>
          </div>
          <SaveApplyButton job={job}/>
        </div>

        {/* Similar jobs */}
        {similarJobs && similarJobs.length > 0 && (
          <div style={{ marginTop:28 }}>
            <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:12 }}>Offres similaires</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {similarJobs.map((sj:any)=>(
                <a key={sj.id} href={`/jobs/${sj.id}`} className="sim-card">
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <CompanyLogo logoUrl={sj.logo_url} companyName={sj.company}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:2 }}>{sj.title}</div>
                      <div style={{ fontSize:12, color:'#6b7280', display:'flex', gap:10 }}>
                        <span>{sj.company}</span><span>📍 {sj.city}</span>
                      </div>
                    </div>
                    <span style={{ fontSize:11, color:'#9ca3af', flexShrink:0 }}>
                      {sj.posted_at || new Date(sj.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: sidebar ─────────────────────────────────────────── */}
      <div id="postuler" className="sidebar-col" style={{ width:268, flexShrink:0, position:'sticky', top:78, alignSelf:'flex-start' }}>

        <div style={{ background:'white', border:'1.5px solid #f0f0f0', borderRadius:14, padding:'22px 18px', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:3 }}>{job.title}</div>
          <div style={{ fontSize:12, color:'#6b7280', marginBottom:18, fontWeight:500 }}>{job.company} · {job.city}</div>

          <SaveApplyButton job={job}/>

          <div style={{ height:1, background:'#f3f4f6', margin:'16px 0' }}/>

          {[
            { label:'Ville',   value:job.city },
            { label:'Contrat', value:job.contract_type || 'Non précisé' },
            { label:'Publiée', value:posted },
            ...(job.salary ? [{ label:'Salaire', value:job.salary }] : []),
          ].map(row=>(
            <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
              <span style={{ fontSize:12, color:'#9ca3af', fontWeight:500 }}>{row.label}</span>
              <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* CV upsell */}
        <div style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1.5px solid #bbf7d0', borderRadius:12, padding:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:7 }}>
            <Zap size={12} style={{ color:'#16a34a' }}/>
            <span style={{ fontSize:10, fontWeight:700, color:'#15803d', textTransform:'uppercase', letterSpacing:'0.08em' }}>Conseil</span>
          </div>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:5, lineHeight:1.35 }}>
            Boostez votre candidature
          </div>
          <p style={{ fontSize:11, color:'#4b7c59', lineHeight:1.6, marginBottom:11 }}>
            Un CV optimisé IA double vos chances de décrocher un entretien.
          </p>
          <a href="/cv" style={{ display:'block', background:'#16a34a', color:'white', padding:'9px 12px', borderRadius:8, fontSize:12, fontWeight:700, textDecoration:'none', textAlign:'center', transition:'all .18s' }}>
            Créer mon CV IA →
          </a>
        </div>
      </div>

      {/* ── MOBILE STICKY BAR ─────────────────────────────────────── */}
      <div className="sticky-bar">
        <a href={job.original_url} target="_blank" rel="noopener noreferrer" className="cta-btn">
          Postuler sur le site <ExternalLink size={16}/>
        </a>
        <a href="#postuler"
          style={{display:'block',textAlign:'center',fontSize:12,color:'#6b7280',marginTop:6,textDecoration:'none'}}>
          📋 Sauvegarder la candidature
        </a>
      </div>
    </>
  );
}


// ── SHELL PAGE ─────────────────────────────────────────────────────────────
export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { width:100%; overflow-x:hidden; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#f8fafc; color:#111827; }

        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        /* Nav */
        .nl { color:#4b5563; text-decoration:none; font-size:14px; font-weight:600; padding:7px 12px; border-radius:8px; transition:all .18s; }
        .nl:hover { color:#111827; background:#f3f4f6; }

        /* Back */
        .back-link { display:inline-flex; align-items:center; gap:7px; color:#6b7280; text-decoration:none; font-size:13px; font-weight:600; padding:7px 11px 7px 8px; border-radius:8px; transition:all .18s; border:1.5px solid transparent; }
        .back-link:hover { color:#111827; background:white; border-color:#e5e7eb; box-shadow:0 1px 3px rgba(0,0,0,0.06); }

        /* Pills */
        .pill { display:inline-flex; align-items:center; padding:5px 12px; border-radius:100px; font-size:12px; font-weight:700; border:1.5px solid; }
        .pill-green { background:#f0fdf4; color:#15803d; border-color:#bbf7d0; }
        .pill-blue  { background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe; }
        .pill-amber { background:#fffbeb; color:#92400e; border-color:#fde68a; }
        .pill-gray  { background:#f9fafb; color:#374151; border-color:#e5e7eb; }

        /* Meta */
        .meta-item { display:flex; align-items:center; gap:8px; padding:11px 14px; background:white; border:1.5px solid #f0f0f0; border-radius:10px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }

        /* Description */
        .job-desc { font-size:15px; color:#374151; line-height:1.8; }
        .job-desc h3,.job-desc h4 { font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:800; color:#0f172a; margin:22px 0 9px; }
        .job-desc p { margin-bottom:10px; }
        .job-desc ul,.job-desc ol { padding-left:20px; margin-bottom:10px; }
        .job-desc li { margin-bottom:5px; }
        .job-desc strong { color:#0f172a; font-weight:700; }

        /* CTA */
        .cta-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; background:#16a34a; color:white; padding:14px 32px; border-radius:10px; font-size:15px; font-weight:700; text-decoration:none; font-family:'Plus Jakarta Sans',sans-serif; transition:all .2s; width:100%; border:none; cursor:pointer; }
        .cta-btn:hover { background:#15803d; transform:translateY(-2px); box-shadow:0 8px 24px rgba(22,163,74,0.3); }

        /* Similar */
        .sim-card { background:white; border:1.5px solid #f0f0f0; border-radius:11px; padding:14px 16px; transition:all .18s; text-decoration:none; display:block; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
        .sim-card:hover { border-color:#16a34a; box-shadow:0 4px 16px rgba(22,163,74,0.1); transform:translateY(-1px); }

        /* Sticky bar mobile */
        .sticky-bar { display:none; position:fixed; bottom:0; left:0; right:0; background:rgba(248,250,252,0.97); backdrop-filter:blur(12px); border-top:1.5px solid #e5e7eb; padding:12px 20px; z-index:50; }

        @media(max-width:768px) {
          .sticky-bar { display:block; }
          .sidebar-col { display:none !important; }
          .hide-sm { display:none !important; }
          body { padding-bottom:76px; }
          .main-row { flex-direction:column !important; }
        }

        /* Footer */
        .footer-link { font-size:13px; color:rgba(255,255,255,0.45); text-decoration:none; transition:color .18s; display:block; margin-bottom:8px; }
        .footer-link:hover { color:rgba(255,255,255,0.85); }
      `}</style>

      <div style={{ background:'#f8fafc', minHeight:'100vh', width:'100%' }}>

        {/* NAVBAR */}
        <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)', borderBottom:'1.5px solid #f0f0f0', padding:'0 24px', height:62, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:28 }}>
            <a href="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
              <div style={{ width:34, height:34, background:'#16a34a', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:16, color:'white' }}>T</div>
              <span style={{ color:'#0f172a', fontWeight:800, fontSize:16 }}>TalentMaroc</span>
            </a>
            <div className="hide-sm" style={{ display:'flex', gap:2 }}>
              <a href="/"          className="nl">Emplois</a>
              <a href="/employers" className="nl">Recruteurs</a>
              <a href="/cv"        className="nl" style={{ color:'#16a34a' }}>Mon CV ✦</a>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <a href="/auth/login"    className="nl hide-sm">Connexion</a>
            <a href="/employers/new" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#16a34a', color:'white', padding:'8px 16px', borderRadius:9, fontSize:13, fontWeight:700, textDecoration:'none', transition:'all .18s' }}>
              Publier
            </a>
          </div>
        </nav>

        {/* BREADCRUMB */}
        <div style={{ maxWidth:1060, margin:'0 auto', padding:'18px 24px 0' }}>
          <a href="/" className="back-link"><ArrowLeft size={14}/> Retour aux offres</a>
        </div>

        {/* MAIN */}
        <div className="main-row" style={{ maxWidth:1060, margin:'0 auto', padding:'18px 24px 72px', display:'flex', gap:24, alignItems:'flex-start' }}>
          <Suspense fallback={<JobDetailSkeleton/>}>
            <JobDetail params={params}/>
          </Suspense>
        </div>

        {/* FOOTER */}
        <footer style={{ background:'#0f172a', padding:'40px 24px 24px' }}>
          <div style={{ maxWidth:1060, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, background:'#16a34a', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color:'white' }}>T</div>
              <span style={{ color:'white', fontWeight:800, fontSize:14 }}>TalentMaroc</span>
            </div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              <a href="/"      className="footer-link" style={{ margin:'0 8px' }}>Emplois</a>
              <a href="/terms" className="footer-link" style={{ margin:'0 8px' }}>CGU</a>
              <a href="mailto:contact@talentmaroc.shop" className="footer-link" style={{ margin:'0 8px' }}>Contact</a>
            </div>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>© 2026 Talent Maroc</span>
          </div>
        </footer>

      </div>
    </>
  );
}