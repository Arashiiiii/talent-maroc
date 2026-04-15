import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import { Search, MapPin, Briefcase, Clock, ChevronRight, Zap } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import NavbarAuth from '@/components/NavbarAuth';

export const metadata = {
  title: 'Talent Maroc | Trouvez votre prochain job au Maroc',
  description: "Recherchez parmi les dernières offres d'emploi à Casablanca, Tanger, Rabat et Agadir.",
};

// ── STATIC DATA ────────────────────────────────────────────────────────────
const CITIES = ['Casablanca','Tanger','Rabat','Marrakech','Agadir','Fès'];
const SECTORS = ['Informatique','Commercial','Finance','Logistique','Santé','Marketing','Ingénierie','RH'];
const TRENDING = ['Développeur','Stage PFE','Télétravail','Finance','Data','Casablanca'];
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
      <a href="/" style={{ color:'#16a34a', fontSize:14, fontWeight:600, textDecoration:'none', display:'inline-block', marginTop:8 }}>Voir toutes les offres →</a>
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
        {jobs.map((job: any) => (
          <a key={job.id} href={`/jobs/${job.id}`} className="job-card"
            style={{ display:'block', textDecoration:'none', background:'white', border:'1.5px solid #f0f0f0', borderRadius:14, padding:'18px 20px', transition:'all 0.2s', position:'relative', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', gap:14, alignItems:'center' }}>
              <div style={{ flexShrink:0 }}>
                <CompanyLogo logoUrl={job.logo_url} companyName={job.company}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <h2 style={{ fontSize:14, fontWeight:700, color:'#111827', lineHeight:1.35, marginBottom:4 }}>{job.title}</h2>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'3px 14px', fontSize:12, color:'#6b7280' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontWeight:600, color:'#374151' }}>
                    <Briefcase size={11}/> {job.company}
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <MapPin size={11}/> {job.city}
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Clock size={11}/> {job.posted_at || new Date(job.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              <span className="apply-btn" style={{ flexShrink:0, background:'#f0fdf4', color:'#16a34a', border:'1.5px solid #bbf7d0', padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700, whiteSpace:'nowrap', transition:'all 0.2s' }}>
                Voir l'offre →
              </span>
            </div>
          </a>
        ))}
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
                  style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:9, border:`1.5px solid ${p===page?'#16a34a':'#e5e7eb'}`, background:p===page?'#16a34a':'white', color:p===page?'white':'#374151', textDecoration:'none', fontSize:13, fontWeight:600, transition:'all .18s' }}>
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { width:100%; overflow-x:hidden; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#f8fafc; color:#111827; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        .au{animation:fadeUp .55s cubic-bezier(.16,1,.3,1) both}
        .d1{animation-delay:.04s}.d2{animation-delay:.12s}.d3{animation-delay:.2s}.d4{animation-delay:.28s}.d5{animation-delay:.36s}

        /* Nav */
        .nl { color:#4b5563; text-decoration:none; font-size:14px; font-weight:600; padding:7px 13px; border-radius:8px; transition:all .18s; }
        .nl:hover { color:#111827; background:#f3f4f6; }
        .nl.active { color:#16a34a; }

        /* Search */
        .sw { display:flex; background:white; border:2px solid #e5e7eb; border-radius:14px; overflow:hidden; transition:border-color .2s, box-shadow .2s; box-shadow:0 2px 12px rgba(0,0,0,0.06); }
        .sw:focus-within { border-color:#16a34a; box-shadow:0 0 0 4px rgba(22,163,74,0.1); }
        .si { flex:1; background:transparent; border:none; outline:none; color:#111827; font-size:15px; font-family:'Plus Jakarta Sans',sans-serif; padding:16px 18px; }
        .si::placeholder { color:#9ca3af; }
        .sdiv { width:1.5px; background:#f3f4f6; margin:12px 0; flex-shrink:0; }
        .sb { background:#16a34a; color:white; border:none; padding:0 28px; font-size:14px; font-weight:700; font-family:'Plus Jakarta Sans',sans-serif; cursor:pointer; transition:background .18s; white-space:nowrap; display:flex; align-items:center; gap:7px; }
        .sb:hover { background:#15803d; }

        /* Chips */
        .chip { display:inline-flex; align-items:center; padding:6px 13px; border-radius:100px; border:1.5px solid #e5e7eb; background:white; cursor:pointer; font-size:12px; font-weight:600; color:#374151; white-space:nowrap; transition:all .18s; text-decoration:none; font-family:'Plus Jakarta Sans',sans-serif; }
        .chip:hover { border-color:#16a34a; color:#16a34a; background:#f0fdf4; }

        /* Job card */
        .job-card:hover { border-color:#16a34a !important; box-shadow:0 4px 20px rgba(22,163,74,0.1) !important; transform:translateY(-1px); }
        .apply-btn:hover { background:#dcfce7 !important; }

        /* Sidebar links */
        .sl { display:flex; align-items:center; justify-content:space-between; font-size:13px; font-weight:600; color:#374151; text-decoration:none; padding:8px 12px; border-radius:8px; transition:all .18s; margin-bottom:2px; }
        .sl:hover { color:#16a34a; background:#f0fdf4; }
        .sl-count { font-size:11px; color:#9ca3af; font-weight:500; background:#f3f4f6; padding:2px 7px; border-radius:100px; }

        /* City card */
        .cc { background:white; border:1.5px solid #f0f0f0; border-radius:12px; padding:18px 14px; text-align:center; transition:all .18s; text-decoration:none; display:block; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
        .cc:hover { border-color:#16a34a; box-shadow:0 4px 16px rgba(22,163,74,0.1); transform:translateY(-2px); }

        /* Buttons */
        .btn-green { display:inline-flex; align-items:center; gap:7px; background:#16a34a; color:white; padding:12px 22px; border-radius:10px; font-size:14px; font-weight:700; text-decoration:none; font-family:'Plus Jakarta Sans',sans-serif; border:none; cursor:pointer; transition:all .18s; }
        .btn-green:hover { background:#15803d; transform:translateY(-1px); box-shadow:0 6px 20px rgba(22,163,74,0.3); }
        .btn-outline { display:inline-flex; align-items:center; gap:7px; background:white; color:#374151; padding:12px 22px; border-radius:10px; font-size:14px; font-weight:600; text-decoration:none; font-family:'Plus Jakarta Sans',sans-serif; border:1.5px solid #e5e7eb; cursor:pointer; transition:all .18s; }
        .btn-outline:hover { border-color:#16a34a; color:#16a34a; }

        /* Stat card */
        .stat-card { background:white; border:1.5px solid #f0f0f0; border-radius:14px; padding:22px 20px; text-align:center; box-shadow:0 1px 4px rgba(0,0,0,0.04); }

        /* Divider */
        .divider { height:1px; background:#f0f0f0; margin:48px 0; }

        /* Skeleton */
        .skel { background:#f3f4f6; border-radius:8px; animation:fadeIn .8s ease both; }

        /* Footer */
        .footer-link { font-size:13px; color:#6b7280; text-decoration:none; transition:color .18s; display:block; margin-bottom:9px; }
        .footer-link:hover { color:#16a34a; }

        @media(max-width:768px) {
          .main-grid { flex-direction:column !important; }
          .sidebar { width:100% !important; display:grid; grid-template-columns:1fr 1fr; gap:16px; }
          .cv-cards { display:none !important; }
        }
        @media(max-width:640px) {
          .sw { flex-direction:column; border-radius:12px; }
          .sdiv { width:auto; height:1.5px; margin:0 14px; }
          .sb { padding:14px; justify-content:center; }
          .hide-sm { display:none !important; }
          .footer-grid { grid-template-columns:1fr 1fr !important; }
        }
      `}</style>

      <div style={{ background:'#f8fafc', minHeight:'100vh', width:'100%' }}>

        {/* ══ NAVBAR ════════════════════════════════════════════════════ */}
        <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1.5px solid #f0f0f0', padding:'0 24px', height:62, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:32 }}>
            <a href="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
              <div style={{ width:34, height:34, background:'#16a34a', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:16, color:'white', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>T</div>
              <span style={{ color:'#111827', fontWeight:800, fontSize:16, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>TalentMaroc</span>
            </a>
            <div className="hide-sm" style={{ display:'flex', gap:2 }}>
              <a href="/"          className="nl active">Emplois</a>
              <a href="/employeur" className="nl">Recruteurs</a>
              <a href="/cv"        className="nl" style={{ color:'#16a34a' }}>Mon CV ✦</a>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <NavbarAuth />
            <a href="/employeur/new" className="btn-green" style={{ padding:'8px 18px', fontSize:13 }}>Publier une offre</a>
          </div>
        </nav>

        {/* ══ HERO ══════════════════════════════════════════════════════ */}
        <header style={{ background:'white', borderBottom:'1.5px solid #f0f0f0', padding:'64px 24px 72px' }}>
          <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center' }}>

            <div className="au d1" style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:100, padding:'5px 14px', marginBottom:22 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#16a34a', display:'inline-block', flexShrink:0 }}/>
              <span style={{ fontSize:12, fontWeight:700, color:'#15803d' }}>18 400+ offres actives au Maroc</span>
            </div>

            <h1 className="au d2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'clamp(28px,5.5vw,52px)', fontWeight:800, color:'#0f172a', lineHeight:1.12, letterSpacing:'-0.02em', marginBottom:16 }}>
              Le job de vos rêves<br/>
              <span style={{ color:'#16a34a' }}>vous attend au Maroc</span>
            </h1>

            <p className="au d3" style={{ fontSize:'clamp(14px,2vw,17px)', color:'#6b7280', lineHeight:1.7, maxWidth:460, margin:'0 auto 30px' }}>
              Des milliers d'opportunités vérifiées à Casablanca, Tanger, Rabat et partout ailleurs.
            </p>

            <form action="/" method="GET" className="au d4" style={{ maxWidth:620, margin:'0 auto 18px' }}>
              <div className="sw">
                <div style={{ display:'flex', alignItems:'center', gap:9, padding:'0 16px', flex:1 }}>
                  <Search size={16} style={{ color:'#9ca3af', flexShrink:0 }}/>
                  <input name="q" type="text" placeholder="Poste, entreprise, compétence…" className="si" style={{ padding:'16px 0' }}/>
                </div>
                <div className="sdiv"/>
                <div style={{ display:'flex', alignItems:'center', gap:9, padding:'0 16px', flex:'0 0 185px' }}>
                  <MapPin size={15} style={{ color:'#9ca3af', flexShrink:0 }}/>
                  <input name="l" type="text" placeholder="Ville" className="si" style={{ padding:'16px 0' }}/>
                </div>
                <button type="submit" className="sb"><Search size={14}/> Rechercher</button>
              </div>
            </form>

            <div className="au d5" style={{ display:'flex', gap:7, flexWrap:'wrap', justifyContent:'center', alignItems:'center' }}>
              <span style={{ fontSize:12, color:'#9ca3af', fontWeight:600 }}>Tendances :</span>
              {TRENDING.map(t => (
                <a key={t} href={`/?q=${encodeURIComponent(t)}`} className="chip">{t}</a>
              ))}
            </div>
          </div>
        </header>

        {/* ══ STATS ═════════════════════════════════════════════════════ */}
        <div style={{ background:'white', borderBottom:'1.5px solid #f0f0f0', padding:'24px' }}>
          <div style={{ maxWidth:860, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
            {[['18 400+','Offres actives'],['4 200+','Entreprises'],['320K+','Candidats'],['94%','Satisfaction']].map(([v,l])=>(
              <div key={l} className="stat-card">
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'clamp(20px,3vw,28px)', fontWeight:800, color:'#0f172a', lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:5, fontWeight:500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ MAIN ══════════════════════════════════════════════════════ */}
        <div style={{ maxWidth:1060, margin:'0 auto', padding:'44px 24px 72px', display:'flex', gap:28 }} className="main-grid">

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
            <div style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1.5px solid #bbf7d0', borderRadius:12, padding:'16px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <Zap size={13} style={{ color:'#16a34a' }}/>
                <span style={{ fontSize:10, fontWeight:700, color:'#15803d', textTransform:'uppercase', letterSpacing:'0.08em' }}>Nouveau</span>
              </div>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:5, lineHeight:1.35 }}>Créez votre CV IA</div>
              <p style={{ fontSize:11, color:'#4b7c59', lineHeight:1.6, marginBottom:12 }}>Gratuit pour importer, 1,99 € pour générer.</p>
              <a href="/cv" className="btn-green" style={{ padding:'8px 14px', fontSize:12, width:'100%', justifyContent:'center' }}>Créer mon CV →</a>
            </div>
          </aside>

          {/* ── JOB LIST ─────────────────────────────────────────────── */}
          <section style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div>
                <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, color:'#0f172a' }}>Dernières Offres</h2>
                <p style={{ fontSize:12, color:'#9ca3af', marginTop:3, fontWeight:500 }}>Actualisées en temps réel via n8n & SerpAPI</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#16a34a', display:'inline-block', animation:'fadeIn 1s ease infinite alternate' }}/>
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
          <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)', borderRadius:18, padding:'44px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:28, flexWrap:'wrap', overflow:'hidden', position:'relative' }}>
            {/* Subtle pattern */}
            <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 70% 50%, rgba(22,163,74,0.15) 0%, transparent 60%)', pointerEvents:'none' }}/>
            <div style={{ position:'relative' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(22,163,74,0.2)', border:'1px solid rgba(22,163,74,0.35)', borderRadius:100, padding:'4px 12px', marginBottom:14 }}>
                <Zap size={11} style={{ color:'#4ade80' }}/>
                <span style={{ color:'#4ade80', fontSize:11, fontWeight:700 }}>Nouveau — Générateur de CV IA</span>
              </div>
              <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'clamp(17px,3vw,23px)', fontWeight:800, color:'white', lineHeight:1.25, marginBottom:10 }}>
                Un CV qui se démarque, en 3 minutes
              </h3>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.55)', maxWidth:400, lineHeight:1.65 }}>
                Importez votre CV existant gratuitement, ou laissez l'IA le créer à partir de 1,99 €.
              </p>
              <div style={{ display:'flex', gap:10, marginTop:22, flexWrap:'wrap' }}>
                <a href="/cv" className="btn-green">Créer mon CV IA →</a>
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
                  <div style={{ marginTop:14, fontSize:13, color:'#16a34a', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                    En savoir plus <ChevronRight size={13}/>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ══ FOOTER ════════════════════════════════════════════════════ */}
        <footer style={{ background:'#0f172a', padding:'48px 24px 28px' }}>
          <div style={{ maxWidth:1060, margin:'0 auto' }}>
            <div className="footer-grid" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:24, marginBottom:36 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <div style={{ width:30, height:30, background:'#16a34a', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'white' }}>T</div>
                  <span style={{ color:'white', fontWeight:800, fontSize:15 }}>TalentMaroc</span>
                </div>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7, maxWidth:200 }}>La plateforme de référence pour l'emploi au Maroc. Propulsé par n8n & Supabase.</p>
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
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>© 2026 Talent Maroc — Propulsé par n8n & Supabase</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.18)' }}>🇲🇦 Fait avec ❤️ au Maroc</span>
            </div>
          </div>
        </footer>

      </div>

      <style>{`
        .emp-card:hover { border-color:#16a34a !important; box-shadow:0 4px 20px rgba(22,163,74,0.1) !important; transform:translateY(-2px); }
      `}</style>
    </>
  );
}