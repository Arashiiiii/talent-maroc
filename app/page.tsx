import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import { Search, MapPin, Briefcase, Clock, ChevronRight, Zap } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import NavbarAuth from '@/components/NavbarAuth';
import JobFunctionFilters from '@/components/JobFunctionFilters';

export const metadata = {
  title: 'Talent Maroc | Trouvez votre prochain job au Maroc',
  description: "Recherchez parmi les dernières offres d'emploi à Casablanca, Tanger, Rabat et Agadir.",
};

// ── STATIC DATA ────────────────────────────────────────────────────────────
const CITIES = ['Casablanca','Tanger','Rabat','Marrakech','Agadir','Fès'];
const SECTORS = ['Informatique','Commercial','Finance','Logistique','Santé','Marketing','Ingénierie','RH'];
const TRENDING = ['Développeur','Stage PFE','Télétravail','Finance','Data','Casablanca'];
const JOB_FUNCTIONS = [
  { label:'💻 Tech & IT',       q:'Informatique' },
  { label:'📊 Finance',          q:'Finance' },
  { label:'📣 Marketing',        q:'Marketing' },
  { label:'🤝 Commercial',       q:'Commercial' },
  { label:'⚙️ Ingénierie',       q:'Ingénierie' },
  { label:'🏥 Santé',            q:'Santé' },
  { label:'👥 RH',               q:'RH' },
  { label:'🎓 Stage / PFE',      q:'Stage' },
];

// Detect work type from job data
function getWorkType(job: any): { label: string; color: string; bg: string } | null {
  const text = `${job.title} ${job.description || ''} ${job.contract_type || ''}`.toLowerCase();
  if (text.includes('télétravail') || text.includes('remote') || text.includes('à distance')) {
    return { label: '🏠 Télétravail', color: '#065f46', bg: '#f0fdf4' };
  }
  if (text.includes('hybride') || text.includes('hybrid')) {
    return { label: '🔀 Hybride', color: '#1d4ed8', bg: '#eff6ff' };
  }
  return null;
}

// Check if job is new (posted within 3 days)
function isNew(job: any): boolean {
  const d = job.posted_at ? new Date(job.posted_at) : new Date(job.created_at);
  return (Date.now() - d.getTime()) < 3 * 24 * 60 * 60 * 1000;
}

// Extract 3 highlights from description
function getHighlights(job: any): string[] {
  if (!job.description) return [];
  const text = job.description.replace(/<[^>]+>/g, ' ');
  const bullets = text.match(/[•\-–]\s*([^•\-–\n]{10,80})/g);
  if (bullets && bullets.length >= 2) {
    return bullets.slice(0, 3).map((b: string) => b.replace(/^[•\-–]\s*/, '').trim());
  }
  return [];
}
const CITY_META: Record<string,{icon:string;count:string}> = {
  Casablanca:{ icon:'🏙', count:'2 400+' },
  Rabat:     { icon:'🏛', count:'1 100+' },
  Tanger:    { icon:'⚓', count:'780+'   },
  Marrakech: { icon:'🌴', count:'540+'   },
  Agadir:    { icon:'☀', count:'320+'   },
  Fès:       { icon:'🕌', count:'290+'   },
};

// ── JOB LIST WITH PAGINATION ──────────────────────────────────────────────
const PAGE_SIZE = 12;

async function JobList({ searchParams }: { searchParams: any }) {
  noStore();
  const params   = await searchParams;
  const query    = params.q || '';
  const location = params.l || '';
  const page     = Math.max(1, parseInt(params.page || '1', 10));
  const from     = (page - 1) * PAGE_SIZE;
  const to       = from + PAGE_SIZE - 1;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  let q = supabase.from('jobs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
  if (query)    q = q.or(`title.ilike.%${query}%,company.ilike.%${query}%`);
  if (location) q = q.ilike('city', `%${location}%`);

  const { data: jobs, error, count } = await q;

  if (error) return (
    <div style={{ padding:20, color:'#dc2626', fontSize:14, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10 }}>
      Erreur : {error.message}
    </div>
  );

  if (!jobs || jobs.length === 0) return (
    <div style={{ textAlign:'center', padding:'56px 24px', background:'#f9fafb', border:'2px dashed #e5e7eb', borderRadius:14 }}>
      <div style={{ fontSize:36, marginBottom:12 }}>🔍</div>
      <p style={{ color:'#6b7280', fontSize:15, fontWeight:500 }}>Aucune offre trouvée.</p>
      <a href="/" style={{ color:'#7c3aed', fontSize:14, fontWeight:600, textDecoration:'none', display:'inline-block', marginTop:8 }}>Voir toutes les offres →</a>
    </div>
  );

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  // Build pagination URL helper
  const pageUrl = (p: number) => {
    const qs = new URLSearchParams();
    if (query)    qs.set('q', query);
    if (location) qs.set('l', location);
    if (p > 1)    qs.set('page', String(p));
    const str = qs.toString();
    return str ? `/?${str}` : '/';
  };

  return (
    <div>
      {/* Results count */}
      <div style={{ fontSize:12, color:'#9ca3af', marginBottom:14, fontWeight:500 }}>
        {count} offre{(count||0)>1?'s':''} trouvée{(count||0)>1?'s':''} · Page {page} sur {totalPages}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
        {jobs.map((job: any) => {
          const workType = getWorkType(job);
          const newJob   = isNew(job);
          const highlights = getHighlights(job);
          const posted = job.posted_at || new Date(job.created_at).toLocaleDateString('fr-FR');
          return (
            <a key={job.id} href={`/jobs/${job.id}`} className="job-card"
              style={{ display:'block', textDecoration:'none', background:'white', border:'1.5px solid #ede9fe', borderRadius:14, padding:'16px 18px', transition:'all 0.2s', position:'relative', boxShadow:'0 1px 4px rgba(124,58,237,0.06)' }}>
              <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                <div style={{ flexShrink:0, paddingTop:2 }}>
                  <CompanyLogo logoUrl={job.logo_url} companyName={job.company}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  {/* Top row: title + badges */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                    <h2 style={{ fontSize:14, fontWeight:700, color:'#1e1147', lineHeight:1.35, flex:1, minWidth:160 }}>{job.title}</h2>
                    <div style={{ display:'flex', gap:5, flexShrink:0, flexWrap:'wrap' }}>
                      {newJob && <span style={{ fontSize:10, fontWeight:700, background:'linear-gradient(135deg,#f97316,#ea580c)', color:'white', padding:'2px 8px', borderRadius:100, whiteSpace:'nowrap' }}>NOUVEAU</span>}
                      {job.contract_type && <span style={{ fontSize:10, fontWeight:700, background:'#f5f3ff', color:'#7c3aed', border:'1px solid #ddd6fe', padding:'2px 8px', borderRadius:100, whiteSpace:'nowrap' }}>{job.contract_type}</span>}
                      {workType && <span style={{ fontSize:10, fontWeight:700, background:workType.bg, color:workType.color, padding:'2px 8px', borderRadius:100, whiteSpace:'nowrap' }}>{workType.label}</span>}
                    </div>
                  </div>
                  {/* Company + location + date */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'3px 14px', fontSize:12, color:'#6b7280', marginBottom: highlights.length ? 8 : 0 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontWeight:600, color:'#374151' }}>
                      <Briefcase size={11}/> {job.company}
                    </span>
                    {job.city && <span style={{ display:'flex', alignItems:'center', gap:4 }}><MapPin size={11}/> {job.city}</span>}
                    {job.salary && <span style={{ display:'flex', alignItems:'center', gap:4, color:'#7c3aed', fontWeight:600 }}>💰 {job.salary}</span>}
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={11}/> {posted}</span>
                  </div>
                  {/* Benefit highlights */}
                  {highlights.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                      {highlights.map((h, i) => (
                        <span key={i} style={{ fontSize:11, color:'#4b5563', background:'#f9fafb', border:'1px solid #f0f0f0', borderRadius:6, padding:'2px 8px', lineHeight:1.5 }}>
                          ✓ {h.slice(0, 55)}{h.length > 55 ? '…' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="apply-btn hide-sm" style={{ flexShrink:0, padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700, whiteSpace:'nowrap', transition:'all 0.2s', marginTop:2 }}>
                  Voir →
                </span>
              </div>
            </a>
          );
        })}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, flexWrap:'wrap' }}>
          {/* Previous */}
          {page > 1 ? (
            <a href={pageUrl(page - 1)} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:9, border:'1.5px solid #e5e7eb', background:'white', color:'#374151', textDecoration:'none', fontSize:13, fontWeight:600, transition:'all .18s' }}>
              ← Précédent
            </a>
          ) : (
            <span style={{ display:'inline-flex', padding:'8px 14px', borderRadius:9, border:'1.5px solid #f0f0f0', background:'#f9fafb', color:'#d1d5db', fontSize:13, fontWeight:600 }}>← Précédent</span>
          )}

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number|string)[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i-1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '...' ? (
                <span key={`dot-${i}`} style={{ padding:'8px 6px', color:'#9ca3af', fontSize:13 }}>…</span>
              ) : (
                <a key={p} href={pageUrl(p as number)}
                  style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:9, border:`1.5px solid ${p===page?'#7c3aed':'#e5e7eb'}`, background:p===page?'#7c3aed':'white', color:p===page?'white':'#374151', textDecoration:'none', fontSize:13, fontWeight:600, transition:'all .18s' }}>
                  {p}
                </a>
              )
            )}

          {/* Next */}
          {page < totalPages ? (
            <a href={pageUrl(page + 1)} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:9, border:'1.5px solid #e5e7eb', background:'white', color:'#374151', textDecoration:'none', fontSize:13, fontWeight:600, transition:'all .18s' }}>
              Suivant →
            </a>
          ) : (
            <span style={{ display:'inline-flex', padding:'8px 14px', borderRadius:9, border:'1.5px solid #f0f0f0', background:'#f9fafb', color:'#d1d5db', fontSize:13, fontWeight:600 }}>Suivant →</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── PAGE ───────────────────────────────────────────────────────────────────
export default function Index({ searchParams }: { searchParams: any }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { width:100%; overflow-x:hidden; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#f5f3ff; color:#111827; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        .au{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) both}
        .d1{animation-delay:.04s}.d2{animation-delay:.12s}.d3{animation-delay:.2s}.d4{animation-delay:.28s}.d5{animation-delay:.36s}

        /* Nav */
        .nl { color:#4b5563; text-decoration:none; font-size:14px; font-weight:600; padding:7px 13px; border-radius:8px; transition:all .18s; }
        .nl:hover { color:#6d28d9; background:#f5f3ff; }
        .nl.active { color:#7c3aed; font-weight:700; }

        /* Search */
        .sw { display:flex; background:white; border:2px solid #e5e7eb; border-radius:16px; overflow:hidden; transition:border-color .2s, box-shadow .2s; box-shadow:0 4px 20px rgba(109,40,217,0.08); }
        .sw:focus-within { border-color:#7c3aed; box-shadow:0 0 0 4px rgba(124,58,237,0.12); }
        .si { flex:1; background:transparent; border:none; outline:none; color:#111827; font-size:15px; font-family:'Plus Jakarta Sans',sans-serif; padding:16px 18px; }
        .si::placeholder { color:#9ca3af; }
        .sdiv { width:1.5px; background:#f3f4f6; margin:12px 0; flex-shrink:0; }
        .sb { background:#7c3aed; color:white; border:none; padding:0 28px; font-size:14px; font-weight:700; font-family:'Plus Jakarta Sans',sans-serif; cursor:pointer; transition:background .18s; white-space:nowrap; display:flex; align-items:center; gap:7px; }
        .sb:hover { background:#6d28d9; }

        /* Chips */
        .chip { display:inline-flex; align-items:center; padding:6px 14px; border-radius:100px; border:1.5px solid #ddd6fe; background:white; cursor:pointer; font-size:12px; font-weight:600; color:#6d28d9; white-space:nowrap; transition:all .18s; text-decoration:none; font-family:'Plus Jakarta Sans',sans-serif; }
        .chip:hover { border-color:#7c3aed; background:#f5f3ff; color:#5b21b6; }

        /* Job card */
        .job-card:hover { border-color:#7c3aed !important; box-shadow:0 6px 28px rgba(124,58,237,0.14) !important; transform:translateY(-2px); }
        .apply-btn { background:#f5f3ff; color:#7c3aed; border:1.5px solid #ddd6fe; padding:8px 16px; border-radius:8px; font-size:12px; font-weight:700; white-space:nowrap; }
        .apply-btn:hover { background:#ede9fe !important; }

        /* Sidebar links */
        .sl { display:flex; align-items:center; justify-content:space-between; font-size:13px; font-weight:600; color:#374151; text-decoration:none; padding:8px 12px; border-radius:10px; transition:all .18s; margin-bottom:2px; }
        .sl:hover { color:#7c3aed; background:#f5f3ff; }
        .sl-count { font-size:11px; color:#7c3aed; font-weight:600; background:#ede9fe; padding:2px 8px; border-radius:100px; }

        /* City card */
        .cc { background:white; border:1.5px solid #ede9fe; border-radius:14px; padding:20px 14px; text-align:center; transition:all .18s; text-decoration:none; display:block; box-shadow:0 2px 8px rgba(109,40,217,0.06); }
        .cc:hover { border-color:#7c3aed; box-shadow:0 6px 20px rgba(124,58,237,0.15); transform:translateY(-3px); }

        /* Buttons */
        .btn-green { display:inline-flex; align-items:center; gap:7px; background:#7c3aed; color:white; padding:12px 22px; border-radius:10px; font-size:14px; font-weight:700; text-decoration:none; font-family:'Plus Jakarta Sans',sans-serif; border:none; cursor:pointer; transition:all .18s; }
        .btn-green:hover { background:#6d28d9; transform:translateY(-1px); box-shadow:0 6px 24px rgba(124,58,237,0.35); }
        .btn-outline { display:inline-flex; align-items:center; gap:7px; background:white; color:#374151; padding:12px 22px; border-radius:10px; font-size:14px; font-weight:600; text-decoration:none; font-family:'Plus Jakarta Sans',sans-serif; border:1.5px solid #e5e7eb; cursor:pointer; transition:all .18s; }
        .btn-outline:hover { border-color:#7c3aed; color:#7c3aed; }

        /* Stat card */
        .stat-card { background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); border-radius:16px; padding:22px 20px; text-align:center; }

        /* Divider */
        .divider { height:1px; background:#ede9fe; margin:48px 0; }

        /* Skeleton */
        .skel { background:#ede9fe; border-radius:8px; animation:fadeIn .8s ease both; }

        /* Function filter bar */
        .fn-bar { scrollbar-width:none; -webkit-overflow-scrolling:touch; }
        .fn-bar::-webkit-scrollbar { display:none; }

        /* Footer */
        .footer-link { font-size:13px; color:rgba(255,255,255,0.45); text-decoration:none; transition:color .18s; display:block; margin-bottom:9px; }
        .footer-link:hover { color:rgba(255,255,255,0.9); }

        /* Emp card */
        .emp-card:hover { border-color:#7c3aed !important; box-shadow:0 4px 20px rgba(124,58,237,0.12) !important; transform:translateY(-2px); }

        @media(max-width:768px) {
          .main-grid { flex-direction:column !important; }
          .sidebar { width:100% !important; display:grid; grid-template-columns:1fr 1fr; gap:16px; }
          .cv-cards { display:none !important; }
        }
        @media(max-width:640px) {
          .sw { flex-direction:column; border-radius:14px; }
          .sdiv { width:auto; height:1.5px; margin:0 14px; }
          .sb { padding:14px; justify-content:center; }
          .hide-sm { display:none !important; }
          .footer-grid { grid-template-columns:1fr 1fr !important; }
          .pub-full { display:none !important; }
          .pub-short { display:inline-flex !important; }
          .sidebar { grid-template-columns:1fr !important; }
          .job-card { padding:14px 16px !important; }
          .si { font-size:16px !important; }
          header { padding:40px 20px 52px !important; }
          .apply-btn { display:none !important; }
        }
        .pub-short { display:none; }
      `}</style>

      <div style={{ background:'#f5f3ff', minHeight:'100vh', width:'100%' }}>

        {/* ══ NAVBAR ════════════════════════════════════════════════════ */}
        <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(16px)', borderBottom:'1.5px solid #ede9fe', padding:'0 24px', height:66, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:32 }}>
            <a href="/" style={{ display:'flex', alignItems:'center', textDecoration:'none' }}>
              <img src="/logo.png" alt="TalentMaroc" style={{ height:110, width:"auto", objectFit:"contain", margin:"-22px 0" }} />
            </a>
            <div className="hide-sm" style={{ display:'flex', gap:2 }}>
              <a href="/"          className="nl active">Emplois</a>
              <a href="/employeur" className="nl">Recruteurs</a>
              <a href="/cv"        className="nl" style={{ color:'#7c3aed', fontWeight:700 }}>Mon CV ✦</a>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <NavbarAuth />
            <a href="/employeur/new" className="btn-green pub-full" style={{ padding:'9px 18px', fontSize:13, borderRadius:10 }}>Publier une offre</a>
            <a href="/employeur/new" className="btn-green pub-short" style={{ padding:'9px 14px', fontSize:13, borderRadius:10 }}>Publier</a>
          </div>
        </nav>

        {/* ══ HERO ══════════════════════════════════════════════════════ */}
        <header style={{ position:'relative', overflow:'hidden', padding:'72px 24px 84px' }}>
          {/* Background image */}
          <div style={{ position:'absolute', inset:0, backgroundImage:'url("/hero-bg.jpg")', backgroundSize:'cover', backgroundPosition:'center 30%', backgroundRepeat:'no-repeat' }}/>
          {/* Dark purple overlay */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg, rgba(30,17,71,0.88) 0%, rgba(59,31,163,0.78) 55%, rgba(91,33,182,0.82) 100%)' }}/>

          <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center', position:'relative' }}>

            <div className="au d1" style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.12)', border:'1.5px solid rgba(255,255,255,0.2)', borderRadius:100, padding:'6px 16px', marginBottom:24 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#a78bfa', display:'inline-block', flexShrink:0, animation:'pulse 2s ease infinite' }}/>
              <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>18 400+ offres actives au Maroc</span>
            </div>

            <h1 className="au d2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'clamp(28px,5.5vw,54px)', fontWeight:900, color:'white', lineHeight:1.1, letterSpacing:'-0.02em', marginBottom:16 }}>
              Trouvez le job<br/>
              <span style={{ color:'#f97316' }}>qui vous correspond</span>
            </h1>

            <p className="au d3" style={{ fontSize:'clamp(14px,2vw,17px)', color:'rgba(255,255,255,0.65)', lineHeight:1.7, maxWidth:460, margin:'0 auto 32px' }}>
              Des milliers d'opportunités vérifiées à Casablanca, Tanger, Rabat et partout ailleurs.
            </p>

            <form action="/" method="GET" className="au d4" style={{ maxWidth:640, margin:'0 auto 20px' }}>
              <div className="sw">
                <div style={{ display:'flex', alignItems:'center', gap:9, padding:'0 16px', flex:1 }}>
                  <Search size={16} style={{ color:'#9ca3af', flexShrink:0 }}/>
                  <input name="q" type="text" placeholder="Poste, entreprise, compétence…" className="si" style={{ padding:'17px 0' }}/>
                </div>
                <div className="sdiv"/>
                <div style={{ display:'flex', alignItems:'center', gap:9, padding:'0 16px', flex:'0 0 185px' }}>
                  <MapPin size={15} style={{ color:'#9ca3af', flexShrink:0 }}/>
                  <input name="l" type="text" placeholder="Ville" className="si" style={{ padding:'17px 0' }}/>
                </div>
                <button type="submit" className="sb" style={{ minHeight:56 }}><Search size={14}/> Rechercher</button>
              </div>
            </form>

            <div className="au d5" style={{ display:'flex', gap:7, flexWrap:'wrap', justifyContent:'center', alignItems:'center' }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>Tendances :</span>
              {TRENDING.map(t => (
                <a key={t} href={`/?q=${encodeURIComponent(t)}`} className="chip">{t}</a>
              ))}
            </div>
          </div>
        </header>

        {/* ══ STATS ═════════════════════════════════════════════════════ */}
        <div style={{ background:'linear-gradient(90deg,#2d1b69,#1e1147)', padding:'28px 24px' }}>
          <div style={{ maxWidth:860, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
            {[['18 400+','Offres actives'],['4 200+','Entreprises'],['320K+','Candidats'],['94%','Satisfaction']].map(([v,l])=>(
              <div key={l} className="stat-card">
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'clamp(20px,3vw,28px)', fontWeight:800, color:'white', lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:5, fontWeight:500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ JOB FUNCTION QUICK FILTERS ════════════════════════════════ */}
        <JobFunctionFilters />

        {/* ══ MAIN ══════════════════════════════════════════════════════ */}
        <div style={{ maxWidth:1060, margin:'0 auto', padding:'36px 24px 72px', display:'flex', gap:28 }} className="main-grid">

          {/* ── SIDEBAR ──────────────────────────────────────────────── */}
          <aside className="sidebar" style={{ width:200, flexShrink:0 }}>

            <div style={{ marginBottom:28 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10, padding:'0 12px' }}>Villes</div>
              {CITIES.map(city => (
                <a key={city} href={`/?l=${city}`} className="sl">
                  <span><span style={{ marginRight:6 }}>{CITY_META[city]?.icon}</span>{city}</span>
                  <span className="sl-count">{CITY_META[city]?.count}</span>
                </a>
              ))}
            </div>

            <div style={{ marginBottom:28 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10, padding:'0 12px' }}>Secteurs</div>
              {SECTORS.map(s => (
                <a key={s} href={`/?q=${s}`} className="sl">{s}<ChevronRight size={13} style={{ opacity:0.3 }}/></a>
              ))}
            </div>

            {/* CV mini card */}
            <div style={{ background:'linear-gradient(135deg,#1e1147,#3b1fa3)', border:'1px solid rgba(124,58,237,0.3)', borderRadius:14, padding:'16px 14px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:-20, right:-20, width:70, height:70, borderRadius:'50%', background:'rgba(245,158,11,0.15)', filter:'blur(20px)' }}/>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, position:'relative' }}>
                <Zap size={13} style={{ color:'#f97316' }}/>
                <span style={{ fontSize:10, fontWeight:700, color:'#f97316', textTransform:'uppercase', letterSpacing:'0.08em' }}>IA · Personnalisé</span>
              </div>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:700, color:'white', marginBottom:5, lineHeight:1.35, position:'relative' }}>Créez votre CV IA</div>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.6, marginBottom:12, position:'relative' }}>Gratuit pour importer, 1,99 € pour générer.</p>
              <a href="/cv" className="btn-green" style={{ padding:'8px 14px', fontSize:12, width:'100%', justifyContent:'center', position:'relative' }}>Créer mon CV →</a>
            </div>
          </aside>

          {/* ── JOB LIST ─────────────────────────────────────────────── */}
          <section style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div>
                <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, color:'#0f172a' }}>Dernières Offres</h2>
                <p style={{ fontSize:12, color:'#9ca3af', marginTop:3, fontWeight:500 }}>Mises à jour quotidiennement</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#7c3aed', display:'inline-block', animation:'pulse 2s ease infinite' }}/>
                Live
              </div>
            </div>

            <Suspense fallback={
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[1,2,3].map(i=>(
                  <div key={i} style={{ background:'white', border:'1.5px solid #f0f0f0', borderRadius:14, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', display:'flex', gap:14, alignItems:'center' }}>
                    <div className="skel" style={{ width:44, height:44, borderRadius:10, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div className="skel" style={{ height:14, width:'55%', marginBottom:8 }}/>
                      <div className="skel" style={{ height:12, width:'38%' }}/>
                    </div>
                  </div>
                ))}
              </div>
            }>
              <JobList searchParams={searchParams}/>
            </Suspense>
          </section>
        </div>

        {/* ══ CITY GRID ═════════════════════════════════════════════════ */}
        <div style={{ maxWidth:1060, margin:'0 auto 60px', padding:'0 24px' }}>
          <div className="divider"/>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
            <div>
              <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'clamp(16px,3vw,21px)', fontWeight:800, color:'#0f172a' }}>Explorer par ville</h2>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4, fontWeight:500 }}>Les marchés de l'emploi les plus actifs</p>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:10 }}>
            {CITIES.map(city=>(
              <a key={city} href={`/?l=${city}`} className="cc">
                <div style={{ fontSize:24, marginBottom:8 }}>{CITY_META[city]?.icon}</div>
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:3 }}>{city}</div>
                <div style={{ fontSize:11, color:'#9ca3af', fontWeight:500 }}>{CITY_META[city]?.count} offres</div>
              </a>
            ))}
          </div>
        </div>

        {/* ══ CV BANNER ═════════════════════════════════════════════════ */}
        <div style={{ maxWidth:1060, margin:'0 auto 60px', padding:'0 24px' }}>
          <div style={{ background:'linear-gradient(135deg,#1e1147 0%,#3b1fa3 60%,#5b21b6 100%)', borderRadius:20, padding:'44px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:28, flexWrap:'wrap', overflow:'hidden', position:'relative' }}>
            <div style={{ position:'absolute', top:-60, right:100, width:280, height:280, borderRadius:'50%', background:'rgba(245,158,11,0.1)', filter:'blur(60px)', pointerEvents:'none' }}/>
            <div style={{ position:'absolute', bottom:-60, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(124,58,237,0.3)', filter:'blur(50px)', pointerEvents:'none' }}/>
            <div style={{ position:'relative' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:100, padding:'4px 12px', marginBottom:14 }}>
                <Zap size={11} style={{ color:'#f97316' }}/>
                <span style={{ color:'#f97316', fontSize:11, fontWeight:700 }}>Nouveau — Générateur de CV IA</span>
              </div>
              <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'clamp(17px,3vw,23px)', fontWeight:800, color:'white', lineHeight:1.25, marginBottom:10 }}>
                Un CV qui se démarque, en 3 minutes
              </h3>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.55)', maxWidth:400, lineHeight:1.65 }}>
                Importez votre CV existant gratuitement, ou laissez l'IA le créer à partir de 1,99 €.
              </p>
              <div style={{ display:'flex', gap:10, marginTop:22, flexWrap:'wrap' }}>
                <a href="/cv" className="btn-green" style={{ background:'#f97316', color:'#1e1147' }}>Créer mon CV IA →</a>
                <a href="/cv" style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', padding:'12px 22px', borderRadius:10, fontSize:14, fontWeight:600, textDecoration:'none', border:'1px solid rgba(255,255,255,0.15)', transition:'all .18s' }}>
                  Voir les modèles
                </a>
              </div>
            </div>
            <div className="cv-cards" style={{ display:'flex', gap:10, flexShrink:0, opacity:0.9 }}>
              {[{bg:'#1e293b',acc:'#3b82f6'},{bg:'#042f2e',acc:'#2dd4bf'},{bg:'#1e1b4b',acc:'#818cf8'}].map((t,i)=>(
                <div key={i} style={{ width:70, height:94, background:t.bg, border:`1px solid ${t.acc}30`, borderRadius:8, padding:7, flexShrink:0, opacity:i===1?1:0.6, transform:`rotate(${[-5,0,5][i]}deg) translateY(${[6,0,6][i]}px)` }}>
                  <div style={{ height:6, background:t.acc, borderRadius:2, width:'55%', marginBottom:3 }}/>
                  <div style={{ height:2, background:`${t.acc}50`, borderRadius:2, width:'36%', marginBottom:6 }}/>
                  {[100,80,65].map((w,j)=><div key={j} style={{ height:2, background:'rgba(255,255,255,0.12)', borderRadius:2, width:`${w}%`, marginBottom:2 }}/>)}
                  <div style={{ height:2, background:t.acc, borderRadius:2, width:'44%', marginTop:4, marginBottom:2 }}/>
                  {[100,72].map((w,j)=><div key={j} style={{ height:2, background:'rgba(255,255,255,0.12)', borderRadius:2, width:`${w}%`, marginBottom:2 }}/>)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ EMPLOYER CARDS ════════════════════════════════════════════ */}
        <div style={{ maxWidth:1060, margin:'0 auto 72px', padding:'0 24px' }}>
          <div style={{ marginBottom:20 }}>
            <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'clamp(16px,3vw,21px)', fontWeight:800, color:'#0f172a' }}>Vous recrutez ?</h2>
            <p style={{ fontSize:12, color:'#9ca3af', marginTop:4, fontWeight:500 }}>Accédez à une base de 320 000+ candidats qualifiés</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:12 }}>
            {[
              { icon:'🎯', title:'320 000+ candidats actifs', desc:'Filtrés par secteur, ville et niveau d\'expérience.', href:'/employeur' },
              { icon:'⚡', title:'Publiez en 5 minutes', desc:'Interface simple. Diffusion immédiate sur tous nos canaux.', href:'/employeur/new' },
              { icon:'📊', title:'Tableau de bord complet', desc:'Suivez vos candidatures et performances en temps réel.', href:'/employeur' },
            ].map(card=>(
              <a key={card.title} href={card.href} style={{ textDecoration:'none' }}>
                <div style={{ background:'white', border:'1.5px solid #f0f0f0', borderRadius:14, padding:'22px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', transition:'all .2s', cursor:'pointer' }} className="emp-card">
                  <div style={{ fontSize:26, marginBottom:12 }}>{card.icon}</div>
                  <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:6, lineHeight:1.3 }}>{card.title}</div>
                  <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.6 }}>{card.desc}</div>
                  <div style={{ marginTop:14, fontSize:13, color:'#7c3aed', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                    En savoir plus <ChevronRight size={13}/>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ══ FOOTER ════════════════════════════════════════════════════ */}
        <footer style={{ background:'#1e1147', padding:'48px 24px 28px' }}>
          <div style={{ maxWidth:1060, margin:'0 auto' }}>
            <div className="footer-grid" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:24, marginBottom:36 }}>
              <div>
                <div style={{ marginBottom:14 }}>
                  <img src="/logo.png" alt="TalentMaroc" style={{ height:80, width:"auto", filter:"brightness(0) invert(1)", opacity:0.85 }} />
                </div>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7, maxWidth:200 }}>La plateforme de référence pour l'emploi au Maroc.</p>
              </div>
              {[
                { title:'Candidats',  links:[['Chercher un emploi','/'],['Créer mon CV','/cv'],['Connexion','/auth/login']] },
                { title:'Recruteurs', links:[['Publier une offre','/employers/new'],['Dashboard','/employers'],['Tarifs','/pricing']] },
                { title:'Légal',      links:[['Confidentialité','#'],['CGU','/terms'],['Contact','mailto:contact@talentmaroc.shop']] },
              ].map(col=>(
                <div key={col.title}>
                  <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.1em' }}>{col.title}</div>
                  {col.links.map(([label,href])=>(
                    <a key={label} href={href} className="footer-link">{label}</a>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:20, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>© 2026 Talent Maroc</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.18)' }}>🇲🇦 Fait avec ❤️ au Maroc</span>
            </div>
          </div>
        </footer>

      </div>

    </>
  );
}