import { createClient } from '@supabase/supabase-js';
import { Suspense } from 'react';
import { Search, MapPin, Briefcase, Clock, PlusCircle, Zap } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';

// ── SEO ────────────────────────────────────────────────────────────────────
export const metadata = {
  title: 'Talent Maroc | Trouvez votre prochain job au Maroc',
  description: "Recherchez parmi les dernières offres d'emploi à Casablanca, Tanger, Rabat et Agadir. Postulez directement aux meilleures opportunités.",
};

// ── STATIC DATA ────────────────────────────────────────────────────────────
const CITIES   = ['Casablanca','Tanger','Rabat','Marrakech','Agadir','Fès'];
const SECTORS  = ['Informatique','Commercial','Logistique','Finance','Santé','Marketing','Ingénierie','RH'];
const TRENDING = ['Développeur','Stage PFE','Télétravail','Finance','Data','Casablanca'];

const CITY_META: Record<string,{icon:string;count:string}> = {
  Casablanca:{ icon:'🏙', count:'2 400+' },
  Rabat:     { icon:'🏛', count:'1 100+' },
  Tanger:    { icon:'⚓', count:'780+'   },
  Marrakech: { icon:'🌴', count:'540+'   },
  Agadir:    { icon:'☀', count:'320+'   },
  Fès:       { icon:'🕌', count:'290+'   },
};

// ── JOB LIST (SERVER COMPONENT) ────────────────────────────────────────────
async function JobList({ searchParams }: { searchParams: any }) {
  const params   = await searchParams;
  const query    = params.q || '';
  const location = params.l || '';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  let q = supabase.from('jobs').select('*').order('created_at', { ascending: false });
  if (query)    q = q.or(`title.ilike.%${query}%,company.ilike.%${query}%`);
  if (location) q = q.ilike('city', `%${location}%`);

  const { data: jobs, error } = await q;

  if (error) return (
    <div style={{ padding:'20px', color:'#f87171', fontSize:14, background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:10 }}>
      Erreur de connexion : {error.message}
    </div>
  );

  if (!jobs || jobs.length === 0) return (
    <div style={{ textAlign:'center', padding:'56px 24px', background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(255,255,255,0.08)', borderRadius:14 }}>
      <div style={{ fontSize:34, marginBottom:10 }}>🔍</div>
      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14, fontWeight:500 }}>Aucune offre trouvée pour votre recherche.</p>
      <a href="/" style={{ color:'#60a5fa', fontSize:13, fontWeight:600, textDecoration:'none', display:'inline-block', marginTop:10 }}>Voir tout le catalogue →</a>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
      {jobs.map((job: any, i: number) => (
        <div key={job.id} className="job-card" style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.065)', borderRadius:13, padding:'18px 20px', transition:'all 0.22s', position:'relative', overflow:'hidden' }}>
          {/* Accent line for first 3 */}
          {i < 3 && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#1a56db,#60a5fa)' }}/>}

          <div style={{ display:'flex', gap:13, alignItems:'center' }}>
            <div style={{ flexShrink:0 }}>
              <CompanyLogo logoUrl={job.logo_url} companyName={job.company} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <h2 style={{ fontSize:14, fontWeight:700, color:'white', lineHeight:1.35, marginBottom:5 }}>{job.title}</h2>
              <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'4px 14px', fontSize:12, color:'rgba(255,255,255,0.38)' }}>
                <span style={{ display:'flex', alignItems:'center', gap:4, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>
                  <Briefcase size={12} style={{ opacity:0.5 }}/> {job.company}
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <MapPin size={12} style={{ opacity:0.5 }}/> {job.city}
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <Clock size={12} style={{ opacity:0.5 }}/> {job.posted_at || new Date(job.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
            <a href={job.original_url} target="_blank" rel="noopener noreferrer" className="apply-btn"
              style={{ flexShrink:0, background:'#1a56db', color:'white', padding:'9px 20px', borderRadius:8, fontSize:12, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap', transition:'all 0.2s', alignSelf:'center' }}>
              Postuler →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── PAGE ───────────────────────────────────────────────────────────────────
export default function Index({ searchParams }: { searchParams: any }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { width:100%; overflow-x:hidden; }
        body { font-family:'DM Sans',sans-serif; background:#060d1a; color:#e2e8f0; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.5} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse    { 0%,100%{opacity:.04} 50%{opacity:.08} }

        .au{animation:fadeUp .65s cubic-bezier(.16,1,.3,1) both}
        .d1{animation-delay:.05s}.d2{animation-delay:.15s}.d3{animation-delay:.25s}.d4{animation-delay:.36s}.d5{animation-delay:.48s}

        /* Nav */
        .nl{color:rgba(255,255,255,.55);text-decoration:none;font-size:14px;font-weight:500;padding:7px 12px;border-radius:8px;transition:all .2s}
        .nl:hover{color:white;background:rgba(255,255,255,.06)}

        /* Search */
        .sw{display:flex;background:rgba(15,29,54,.95);border:1.5px solid rgba(255,255,255,.1);border-radius:14px;overflow:hidden;transition:border-color .3s,box-shadow .3s}
        .sw:focus-within{border-color:rgba(26,86,219,.65);box-shadow:0 0 0 4px rgba(26,86,219,.12)}
        .si{flex:1;background:transparent;border:none;outline:none;color:#f1f5f9;font-size:15px;font-family:'DM Sans',sans-serif;padding:18px 16px}
        .si::placeholder{color:rgba(255,255,255,.28)}
        .sdiv{width:1px;background:rgba(255,255,255,.07);margin:14px 0;flex-shrink:0}
        .sb{background:#1a56db;color:white;border:none;padding:0 26px;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:background .2s;white-space:nowrap;display:flex;align-items:center;gap:7px}
        .sb:hover{background:#1e40af}

        /* Chips */
        .chip{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:100px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);cursor:pointer;font-size:12px;font-weight:500;color:rgba(255,255,255,.5);white-space:nowrap;transition:all .2s;text-decoration:none;font-family:'DM Sans',sans-serif}
        .chip:hover{background:rgba(26,86,219,.1);border-color:rgba(26,86,219,.35);color:#93c5fd}

        /* Sidebar */
        .sl{display:block;font-size:13px;font-weight:500;color:rgba(255,255,255,.38);text-decoration:none;padding:6px 11px;border-radius:7px;transition:all .2s;margin-bottom:2px}
        .sl:hover{color:white;background:rgba(26,86,219,.1);padding-left:15px}

        /* Job card */
        .job-card:hover{background:rgba(255,255,255,.045)!important;border-color:rgba(26,86,219,.42)!important;transform:translateY(-1px);box-shadow:0 8px 26px rgba(0,0,0,.4)}
        .apply-btn:hover{background:#1e40af!important;box-shadow:0 5px 18px rgba(26,86,219,.35)}

        /* City card */
        .cc{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.065);border-radius:11px;padding:18px 14px;text-align:center;transition:all .2s;text-decoration:none;display:block}
        .cc:hover{background:rgba(26,86,219,.08);border-color:rgba(26,86,219,.3);transform:translateY(-2px)}

        /* Buttons */
        .btn-b{display:inline-flex;align-items:center;gap:7px;background:#1a56db;color:white;padding:11px 22px;border-radius:9px;font-size:14px;font-weight:600;text-decoration:none;font-family:'DM Sans',sans-serif;border:none;cursor:pointer;transition:all .2s}
        .btn-b:hover{background:#1e40af;transform:translateY(-1px);box-shadow:0 7px 22px rgba(26,86,219,.35)}
        .btn-g{display:inline-flex;align-items:center;gap:7px;background:transparent;color:rgba(255,255,255,.5);padding:11px 22px;border-radius:9px;font-size:14px;font-weight:500;text-decoration:none;font-family:'DM Sans',sans-serif;border:1px solid rgba(255,255,255,.11);cursor:pointer;transition:all .2s}
        .btn-g:hover{color:white;border-color:rgba(255,255,255,.26)}

        /* Blobs / layout */
        .blob{position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none}
        .divider{height:1px;background:linear-gradient(to right,transparent,rgba(255,255,255,.07),transparent);margin:48px 0}
        .live-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;animation:pulseDot 1.8s ease-in-out infinite;flex-shrink:0}
        .skeleton{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.05);border-radius:13px;height:72px}
        .footer-link{font-size:12px;color:rgba(255,255,255,.3);text-decoration:none;transition:color .2s;display:block;margin-bottom:8px}
        .footer-link:hover{color:rgba(255,255,255,.65)}

        @media(max-width:768px){
          .main-grid{flex-direction:column!important}
          .sidebar{width:100%!important;display:grid;grid-template-columns:1fr 1fr;gap:20px}
          .cv-mini-cards{display:none!important}
        }
        @media(max-width:640px){
          .sw{flex-direction:column;border-radius:12px}
          .sdiv{width:auto;height:1px;margin:0 14px}
          .sb{padding:14px;justify-content:center}
          .hide-sm{display:none!important}
          .footer-grid{grid-template-columns:1fr 1fr!important}
        }
      `}</style>

      <div style={{ background:'#060d1a', minHeight:'100vh', width:'100%' }}>

        {/* ══ NAVBAR ════════════════════════════════════════════════════ */}
        <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(6,13,26,0.88)', backdropFilter:'blur(18px)', borderBottom:'1px solid rgba(255,255,255,0.055)', padding:'0 24px', height:62, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:28 }}>
            <a href="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
              <div style={{ width:34, height:34, background:'#1a56db', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:16, color:'white', fontFamily:"'Syne',sans-serif", boxShadow:'0 0 16px rgba(26,86,219,0.5)' }}>T</div>
              <span style={{ color:'white', fontWeight:700, fontSize:15, fontFamily:"'Syne',sans-serif" }}>TalentMaroc</span>
            </a>
            <div className="hide-sm" style={{ display:'flex', gap:2 }}>
              <a href="/"          className="nl" style={{ color:'white' }}>Emplois</a>
              <a href="/employers" className="nl">Recruteurs</a>
              <a href="/cv"        className="nl" style={{ color:'#93c5fd' }}>Mon CV ✦</a>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <a href="/auth/login"    className="nl hide-sm">Connexion</a>
            <a href="/employers/new" className="btn-b" style={{ padding:'8px 15px', fontSize:13 }}>
              <PlusCircle size={14}/> Publier
            </a>
          </div>
        </nav>

        {/* ══ HERO ══════════════════════════════════════════════════════ */}
        <header style={{ position:'relative', overflow:'hidden', padding:'76px 24px 84px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="blob" style={{ width:580, height:420, background:'rgba(26,86,219,0.19)', top:-160, left:'50%', transform:'translateX(-12%)' }}/>
          <div className="blob" style={{ width:300, height:240, background:'rgba(5,122,85,0.1)', bottom:-70, right:'7%' }}/>
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize:'52px 52px', pointerEvents:'none' }}/>

          <div style={{ position:'relative', maxWidth:700, width:'100%', textAlign:'center' }}>

            <div className="au d1" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(26,86,219,0.1)', border:'1px solid rgba(26,86,219,0.22)', borderRadius:100, padding:'5px 15px 5px 9px', marginBottom:22 }}>
              <span className="live-dot"/>
              <span style={{ fontSize:12, fontWeight:500, color:'#93c5fd' }}>18 400+ offres actives aujourd'hui au Maroc</span>
            </div>

            <h1 className="au d2" style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(30px,6vw,58px)', fontWeight:800, color:'white', lineHeight:1.1, letterSpacing:'-0.03em', marginBottom:16 }}>
              Le job de vos rêves{' '}
              <span style={{ WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent', backgroundImage:'linear-gradient(135deg,#60a5fa 0%,#a78bfa 100%)' }}>vous attend</span>
              <br/>au Maroc
            </h1>

            <p className="au d3" style={{ fontSize:'clamp(14px,2vw,16px)', color:'rgba(255,255,255,0.44)', lineHeight:1.7, maxWidth:440, margin:'0 auto 30px' }}>
              Des milliers d'opportunités vérifiées à Tanger, Casablanca et partout ailleurs.
            </p>

            {/* Real GET form — server-side filtering preserved */}
            <form action="/" method="GET" className="au d4" style={{ maxWidth:620, margin:'0 auto 18px' }}>
              <div className="sw">
                <div style={{ display:'flex', alignItems:'center', gap:9, padding:'0 16px', flex:1 }}>
                  <Search size={16} style={{ color:'rgba(255,255,255,0.26)', flexShrink:0 }}/>
                  <input name="q" type="text" placeholder="Poste, entreprise, compétence…" className="si" style={{ padding:'18px 0' }}/>
                </div>
                <div className="sdiv"/>
                <div style={{ display:'flex', alignItems:'center', gap:9, padding:'0 16px', flex:'0 0 180px' }}>
                  <MapPin size={15} style={{ color:'rgba(255,255,255,0.26)', flexShrink:0 }}/>
                  <input name="l" type="text" placeholder="Ville (ex: Tanger)" className="si" style={{ padding:'18px 0' }}/>
                </div>
                <button type="submit" className="sb">
                  <Search size={14}/> Rechercher
                </button>
              </div>
            </form>

            <div className="au d5" style={{ display:'flex', gap:7, flexWrap:'wrap', justifyContent:'center', alignItems:'center' }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.26)' }}>Tendances :</span>
              {TRENDING.map(t => (
                <a key={t} href={`/?q=${encodeURIComponent(t)}`} className="chip">{t}</a>
              ))}
            </div>
          </div>
        </header>

        {/* ══ STATS BAR ═════════════════════════════════════════════════ */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.012)', padding:'26px 24px' }}>
          <div style={{ maxWidth:860, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:14, textAlign:'center' }}>
            {[['18 400+','Offres actives'],['4 200+','Entreprises'],['320K+','Candidats'],['94%','Satisfaction']].map(([v,l])=>(
              <div key={l}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(20px,3vw,28px)', fontWeight:800, color:'white', lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.33)', marginTop:5 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ MAIN GRID ═════════════════════════════════════════════════ */}
        <div style={{ maxWidth:1060, margin:'0 auto', padding:'52px 24px 72px', display:'flex', gap:32 }} className="main-grid">

          {/* ── SIDEBAR ──────────────────────────────────────────────── */}
          <aside className="sidebar" style={{ width:196, flexShrink:0 }}>

            <div style={{ marginBottom:32 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12, fontFamily:"'Syne',sans-serif", padding:'0 11px' }}>Villes</div>
              {CITIES.map(city => (
                <a key={city} href={`/?l=${city}`} className="sl">
                  <span style={{ marginRight:5 }}>{CITY_META[city]?.icon}</span>{city}
                  <span style={{ float:'right', fontSize:10, color:'rgba(255,255,255,0.2)' }}>{CITY_META[city]?.count}</span>
                </a>
              ))}
            </div>

            <div style={{ marginBottom:32 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12, fontFamily:"'Syne',sans-serif", padding:'0 11px' }}>Secteurs</div>
              {SECTORS.map(s => (
                <a key={s} href={`/?q=${s}`} className="sl">{s}</a>
              ))}
            </div>

            {/* CV mini card */}
            <div style={{ background:'linear-gradient(135deg,rgba(26,86,219,0.15),rgba(10,20,40,0.85))', border:'1px solid rgba(26,86,219,0.22)', borderRadius:11, padding:'16px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#93c5fd', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.08em' }}>✦ Nouveau</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'white', marginBottom:5, lineHeight:1.35 }}>Créez votre CV IA</div>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', lineHeight:1.6, marginBottom:12 }}>Gratuit pour importer, 1,99 € pour générer.</p>
              <a href="/cv" className="btn-b" style={{ padding:'8px 14px', fontSize:12, width:'100%', justifyContent:'center' }}>Créer mon CV →</a>
            </div>
          </aside>

          {/* ── JOB LIST ─────────────────────────────────────────────── */}
          <section style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:19, fontWeight:700, color:'white' }}>Dernières Offres</h2>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.32)', marginTop:3 }}>Actualisées en temps réel via n8n & SerpAPI</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'#22c55e', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                <span className="live-dot" style={{ width:6, height:6 }}/>Live
              </div>
            </div>

            <Suspense fallback={
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ animationDelay:`${i*0.1}s` }}/>)}
              </div>
            }>
              <JobList searchParams={searchParams}/>
            </Suspense>
          </section>
        </div>

        {/* ══ CITY GRID ═════════════════════════════════════════════════ */}
        <div style={{ maxWidth:1060, margin:'0 auto 64px', padding:'0 24px' }}>
          <div className="divider"/>
          <div style={{ marginBottom:22 }}>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(17px,3vw,22px)', fontWeight:700, color:'white' }}>Explorer par ville</h2>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.33)', marginTop:4 }}>Les marchés de l'emploi les plus actifs</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:10 }}>
            {CITIES.map(city => (
              <a key={city} href={`/?l=${city}`} className="cc">
                <div style={{ fontSize:22, marginBottom:8 }}>{CITY_META[city]?.icon}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'white', marginBottom:3 }}>{city}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>{CITY_META[city]?.count} offres</div>
              </a>
            ))}
          </div>
        </div>

        {/* ══ CV BANNER ═════════════════════════════════════════════════ */}
        <div style={{ maxWidth:1060, margin:'0 auto 64px', padding:'0 24px' }}>
          <div style={{ position:'relative', overflow:'hidden', background:'linear-gradient(135deg,rgba(26,86,219,0.13) 0%,rgba(8,16,36,0.97) 100%)', border:'1px solid rgba(26,86,219,0.22)', borderRadius:16, padding:'40px 36px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
            <div className="blob" style={{ width:260, height:240, background:'rgba(26,86,219,0.18)', top:-50, right:70, filter:'blur(52px)' }}/>
            <div style={{ position:'relative' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(26,86,219,0.18)', border:'1px solid rgba(26,86,219,0.28)', borderRadius:100, padding:'3px 11px', marginBottom:12 }}>
                <Zap size={10} style={{ color:'#93c5fd' }}/>
                <span style={{ color:'#93c5fd', fontSize:11, fontWeight:600 }}>Nouveau — Générateur de CV IA</span>
              </div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(16px,3vw,22px)', fontWeight:700, color:'white', lineHeight:1.25, marginBottom:9 }}>
                Un CV qui se démarque, en 3 minutes
              </h3>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', maxWidth:380, lineHeight:1.65 }}>
                Importez votre CV existant gratuitement, ou laissez l'IA le créer de A à Z à partir de 1,99 €.
              </p>
              <div style={{ display:'flex', gap:10, marginTop:20, flexWrap:'wrap' }}>
                <a href="/cv" className="btn-b">Créer mon CV IA →</a>
                <a href="/cv" className="btn-g">Voir les modèles</a>
              </div>
            </div>
            {/* Floating mini CV previews */}
            <div className="cv-mini-cards" style={{ display:'flex', gap:9, animation:'float 5s ease-in-out infinite', flexShrink:0 }}>
              {[{bg:'#0f172a',acc:'#3b82f6'},{bg:'#042f2e',acc:'#2dd4bf'},{bg:'#1e1b4b',acc:'#818cf8'}].map((t,i) => (
                <div key={i} style={{ width:68, height:90, background:t.bg, border:`1px solid ${t.acc}30`, borderRadius:7, padding:6, flexShrink:0, opacity:i===1?1:0.6, transform:`rotate(${[-5,0,5][i]}deg) translateY(${[6,0,6][i]}px)` }}>
                  <div style={{ height:6, background:t.acc, borderRadius:2, width:'55%', marginBottom:3 }}/>
                  <div style={{ height:2, background:`${t.acc}50`, borderRadius:2, width:'36%', marginBottom:6 }}/>
                  {[100,80,65].map((w,j) => <div key={j} style={{ height:2, background:'rgba(255,255,255,0.09)', borderRadius:2, width:`${w}%`, marginBottom:2 }}/>)}
                  <div style={{ height:2, background:t.acc, borderRadius:2, width:'44%', marginTop:4, marginBottom:2 }}/>
                  {[100,72].map((w,j) => <div key={j} style={{ height:2, background:'rgba(255,255,255,0.09)', borderRadius:2, width:`${w}%`, marginBottom:2 }}/>)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ FOOTER ════════════════════════════════════════════════════ */}
        <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.22)', padding:'40px 24px 24px' }}>
          <div style={{ maxWidth:1060, margin:'0 auto' }}>
            <div className="footer-grid" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:22, marginBottom:32 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <div style={{ width:28, height:28, background:'#1a56db', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color:'white', fontFamily:"'Syne',sans-serif" }}>T</div>
                  <span style={{ color:'white', fontWeight:700, fontSize:13, fontFamily:"'Syne',sans-serif" }}>TalentMaroc</span>
                </div>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.26)', lineHeight:1.7, maxWidth:190 }}>La plateforme de référence pour l'emploi au Maroc. Propulsé par n8n & Supabase.</p>
              </div>
              {[
                { title:'Candidats',  links:[['Chercher un emploi','/'],['Créer mon CV','/cv'],['Connexion','/auth/login']] },
                { title:'Recruteurs', links:[['Publier une offre','/employers/new'],['Dashboard','/employers'],['Tarifs','/pricing']] },
                { title:'Légal',      links:[['Politique de conf.','#'],['CGU','/terms'],['Contact','mailto:contact@talentmaroc.shop']] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)', marginBottom:11, textTransform:'uppercase', letterSpacing:'0.12em', fontFamily:"'Syne',sans-serif" }}>{col.title}</div>
                  {col.links.map(([label,href]) => (
                    <a key={label} href={href} className="footer-link">{label}</a>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:18, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.16)' }}>© 2026 Talent Maroc — Propulsé par n8n & Supabase</span>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.12)' }}>🇲🇦 Fait avec ❤️ au Maroc</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
