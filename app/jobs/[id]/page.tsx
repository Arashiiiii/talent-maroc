import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { MapPin, Briefcase, Clock, ArrowLeft, ExternalLink, Building2, Globe, Calendar } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';

// ── TYPES ─────────────────────────────────────────────────────────────────
interface Job {
  id: string;
  title: string;
  company: string;
  city: string;
  logo_url?: string;
  description?: string;
  contract_type?: string;
  salary?: string;
  sector?: string;
  experience?: string;
  education?: string;
  original_url: string;
  created_at: string;
  posted_at?: string;
}

// ── DYNAMIC SEO ────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: job } = await supabase.from('jobs').select('title,company,city').eq('id', params.id).single();
  if (!job) return { title: 'Offre introuvable | Talent Maroc' };
  return {
    title: `${job.title} chez ${job.company} — ${job.city} | Talent Maroc`,
    description: `Postulez pour le poste de ${job.title} chez ${job.company} à ${job.city}. Offre d'emploi publiée sur Talent Maroc.`,
  };
}

// ── PAGE ───────────────────────────────────────────────────────────────────
export default async function JobPage({ params }: { params: { id: string } }) {
  noStore(); // always fetch fresh — job data changes at request time
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !job) notFound();

  // Fetch 3 similar jobs from same company or sector
  const { data: similarJobs } = await supabase
    .from('jobs')
    .select('id,title,company,city,created_at,posted_at,logo_url')
    .neq('id', params.id)
    .or(`company.eq.${job.company},city.eq.${job.city}`)
    .order('created_at', { ascending: false })
    .limit(3);

  const postedDate = job.posted_at || new Date(job.created_at).toLocaleDateString('fr-FR');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { width:100%; overflow-x:hidden; }
        body { font-family:'DM Sans',sans-serif; background:#060d1a; color:#e2e8f0; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

        .au{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) both}
        .d1{animation-delay:.05s}.d2{animation-delay:.14s}.d3{animation-delay:.23s}.d4{animation-delay:.32s}

        /* Nav */
        .nl{color:rgba(255,255,255,.55);text-decoration:none;font-size:14px;font-weight:500;padding:7px 12px;border-radius:8px;transition:all .2s}
        .nl:hover{color:white;background:rgba(255,255,255,.06)}

        /* Back link */
        .back-link{display:inline-flex;align-items:center;gap:7px;color:rgba(255,255,255,.4);text-decoration:none;font-size:13px;font-weight:500;padding:8px 12px 8px 8px;border-radius:8px;transition:all .2s;border:1px solid transparent}
        .back-link:hover{color:white;background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.08)}

        /* Pill badges */
        .pill{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:100px;font-size:12px;font-weight:600;border:1px solid}
        .pill-blue{background:rgba(26,86,219,.12);color:#93c5fd;border-color:rgba(26,86,219,.25)}
        .pill-green{background:rgba(5,122,85,.12);color:#34d399;border-color:rgba(5,122,85,.22)}
        .pill-amber{background:rgba(180,83,9,.12);color:#fbbf24;border-color:rgba(180,83,9,.22)}
        .pill-gray{background:rgba(255,255,255,.05);color:rgba(255,255,255,.55);border-color:rgba(255,255,255,.1)}

        /* Meta row items */
        .meta-item{display:flex;align-items:center;gap:8px;padding:12px 16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.065);border-radius:10px}

        /* Description */
        .job-desc{font-size:15px;color:rgba(255,255,255,.7);line-height:1.8}
        .job-desc h3,.job-desc h4{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:white;margin:24px 0 10px}
        .job-desc p{margin-bottom:12px}
        .job-desc ul,.job-desc ol{padding-left:20px;margin-bottom:12px}
        .job-desc li{margin-bottom:6px}
        .job-desc strong{color:rgba(255,255,255,.9);font-weight:600}

        /* CTA button */
        .cta-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;background:#1a56db;color:white;padding:16px 36px;border-radius:11px;font-size:16px;font-weight:700;text-decoration:none;font-family:'DM Sans',sans-serif;transition:all .25s;width:100%;border:none;cursor:pointer}
        .cta-btn:hover{background:#1e40af;transform:translateY(-2px);box-shadow:0 10px 30px rgba(26,86,219,.4)}

        /* Similar job card */
        .sim-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.065);border-radius:11px;padding:16px;transition:all .2s;text-decoration:none;display:block}
        .sim-card:hover{background:rgba(255,255,255,.045);border-color:rgba(26,86,219,.38);transform:translateY(-1px)}

        /* Sticky apply bar on mobile */
        .sticky-bar{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(6,13,26,.95);backdrop-filter:blur(16px);border-top:1px solid rgba(255,255,255,.07);padding:14px 20px;z-index:50}
        @media(max-width:768px){
          .sticky-bar{display:block}
          .sidebar-col{display:none}
          .hide-sm{display:none!important}
          body{padding-bottom:80px}
        }

        /* Blobs */
        .blob{position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none}

        /* Footer links */
        .footer-link{font-size:12px;color:rgba(255,255,255,.3);text-decoration:none;transition:color .2s;margin:0 8px}
        .footer-link:hover{color:rgba(255,255,255,.65)}
      `}</style>

      <div style={{ background:'#060d1a', minHeight:'100vh', width:'100%' }}>

        {/* ── NAVBAR ────────────────────────────────────────────────── */}
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
            <a href="/employers/new" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#1a56db', color:'white', padding:'8px 15px', borderRadius:9, fontSize:13, fontWeight:600, textDecoration:'none' }}>
              Publier
            </a>
          </div>
        </nav>

        {/* ── BREADCRUMB ────────────────────────────────────────────── */}
        <div style={{ maxWidth:1060, margin:'0 auto', padding:'20px 24px 0' }}>
          <a href="/" className="back-link">
            <ArrowLeft size={15}/> Retour aux offres
          </a>
        </div>

        {/* ── MAIN ──────────────────────────────────────────────────── */}
        <div style={{ maxWidth:1060, margin:'0 auto', padding:'24px 24px 72px', display:'flex', gap:28, alignItems:'flex-start' }}>

          {/* ── LEFT COLUMN: JOB DETAIL ─────────────────────────────── */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* Header card */}
            <div className="au d1" style={{ position:'relative', overflow:'hidden', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'32px 28px', marginBottom:20 }}>
              {/* Blue accent top */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#1a56db,#60a5fa,#a78bfa)' }}/>
              {/* Background blob */}
              <div className="blob" style={{ width:300, height:200, background:'rgba(26,86,219,0.08)', top:-60, right:-40, filter:'blur(50px)' }}/>

              <div style={{ position:'relative', display:'flex', gap:18, alignItems:'flex-start', flexWrap:'wrap' }}>
                <div style={{ flexShrink:0 }}>
                  <CompanyLogo logoUrl={job.logo_url} companyName={job.company} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(20px,4vw,28px)', fontWeight:800, color:'white', lineHeight:1.2, marginBottom:8 }}>
                    {job.title}
                  </h1>
                  <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'6px 16px', fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:16 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:5, color:'rgba(255,255,255,0.75)', fontWeight:600 }}>
                      <Building2 size={14} style={{ opacity:0.6 }}/> {job.company}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <MapPin size={14} style={{ opacity:0.5 }}/> {job.city}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <Calendar size={14} style={{ opacity:0.5 }}/> {postedDate}
                    </span>
                  </div>
                  {/* Badges */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
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
            <div className="au d2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10, marginBottom:24 }}>
              <div className="meta-item">
                <MapPin size={15} style={{ color:'#60a5fa', flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>Localisation</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'white' }}>{job.city}</div>
                </div>
              </div>
              <div className="meta-item">
                <Briefcase size={15} style={{ color:'#34d399', flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>Contrat</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'white' }}>{job.contract_type || 'Non précisé'}</div>
                </div>
              </div>
              <div className="meta-item">
                <Clock size={15} style={{ color:'#fbbf24', flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>Publiée</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'white' }}>{postedDate}</div>
                </div>
              </div>
              {job.salary && (
                <div className="meta-item">
                  <Globe size={15} style={{ color:'#c084fc', flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>Salaire</div>
                    <div style={{ fontSize:13, fontWeight:600, color:'white' }}>{job.salary}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="au d3" style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'28px 28px', marginBottom:20 }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:'white', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:18, background:'#1a56db', borderRadius:2, display:'inline-block' }}/>
                Description du poste
              </h2>

              {job.description ? (
                <div
                  className="job-desc"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              ) : (
                /* Fallback when no description in DB */
                <div className="job-desc">
                  <p>
                    <strong>{job.company}</strong> recrute un(e) <strong>{job.title}</strong> basé(e) à <strong>{job.city}</strong>.
                  </p>
                  <p style={{ marginTop:12, color:'rgba(255,255,255,0.45)', fontSize:14 }}>
                    La description complète de ce poste est disponible sur le site de l'entreprise. Cliquez sur le bouton ci-dessous pour accéder à l'annonce originale et postuler directement.
                  </p>
                </div>
              )}
            </div>

            {/* CTA bottom (desktop) */}
            <div className="au d4 hide-sm" style={{ background:'rgba(26,86,219,0.06)', border:'1px solid rgba(26,86,219,0.18)', borderRadius:14, padding:'24px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:'white', marginBottom:4 }}>
                  Prêt(e) à postuler ?
                </div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.42)' }}>
                  Vous allez être redirigé(e) vers le site de {job.company}.
                </div>
              </div>
              <a
                href={job.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-btn"
                style={{ width:'auto', padding:'14px 32px' }}
              >
                Postuler sur le site <ExternalLink size={16}/>
              </a>
            </div>

            {/* Similar jobs */}
            {similarJobs && similarJobs.length > 0 && (
              <div style={{ marginTop:36 }}>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:'white', marginBottom:14 }}>
                  Offres similaires
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {similarJobs.map(sj => (
                    <a key={sj.id} href={`/jobs/${sj.id}`} className="sim-card">
                      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                        <CompanyLogo logoUrl={sj.logo_url} companyName={sj.company} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:3 }}>{sj.title}</div>
                          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', display:'flex', gap:12 }}>
                            <span>{sj.company}</span>
                            <span>📍 {sj.city}</span>
                          </div>
                        </div>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.28)', flexShrink:0 }}>
                          {sj.posted_at || new Date(sj.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: STICKY SIDEBAR ────────────────────────── */}
          <div className="sidebar-col" style={{ width:280, flexShrink:0, position:'sticky', top:82 }}>

            {/* Apply card */}
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'24px 20px', marginBottom:16 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:'white', marginBottom:6 }}>
                {job.title}
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:20 }}>
                {job.company} · {job.city}
              </div>

              <a
                href={job.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-btn"
                style={{ marginBottom:12, fontSize:15 }}
              >
                Postuler maintenant <ExternalLink size={15}/>
              </a>

              <p style={{ fontSize:11, color:'rgba(255,255,255,0.28)', textAlign:'center', lineHeight:1.5 }}>
                Vous serez redirigé(e) vers {job.company}.<br/>Annonce originale sur leur site.
              </p>

              <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'18px 0' }}/>

              {/* Quick facts */}
              {[
                { icon:<MapPin size={13}/>,      label:'Ville',    value:job.city },
                { icon:<Briefcase size={13}/>,   label:'Contrat',  value:job.contract_type || 'Non précisé' },
                { icon:<Clock size={13}/>,       label:'Publiée',  value:postedDate },
                ...(job.salary ? [{ icon:<Globe size={13}/>, label:'Salaire', value:job.salary }] : []),
              ].map(row => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(255,255,255,0.35)' }}>
                    <span style={{ color:'rgba(255,255,255,0.25)' }}>{row.icon}</span> {row.label}
                  </span>
                  <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* CV upsell */}
            <div style={{ background:'linear-gradient(135deg,rgba(26,86,219,0.14),rgba(8,16,36,0.97))', border:'1px solid rgba(26,86,219,0.2)', borderRadius:12, padding:'18px 18px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#93c5fd', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.08em' }}>✦ Conseil</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'white', marginBottom:6, lineHeight:1.35 }}>
                Boostez votre candidature
              </div>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.38)', lineHeight:1.6, marginBottom:12 }}>
                Un CV optimisé IA double vos chances de décrocher un entretien.
              </p>
              <a href="/cv" style={{ display:'block', background:'rgba(26,86,219,0.25)', color:'#93c5fd', padding:'9px 14px', borderRadius:8, fontSize:12, fontWeight:600, textDecoration:'none', textAlign:'center', transition:'all .2s', border:'1px solid rgba(26,86,219,0.3)' }}>
                Créer mon CV IA →
              </a>
            </div>
          </div>
        </div>

        {/* ── MOBILE STICKY BAR ─────────────────────────────────────── */}
        <div className="sticky-bar">
          <a
            href={job.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-btn"
          >
            Postuler sur le site <ExternalLink size={16}/>
          </a>
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.22)', padding:'24px', textAlign:'center' }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.18)' }}>© 2026 Talent Maroc</span>
          <a href="/" className="footer-link">Emplois</a>
          <a href="/terms" className="footer-link">CGU</a>
          <a href="mailto:contact@talentmaroc.shop" className="footer-link">Contact</a>
        </footer>

      </div>
    </>
  );
}