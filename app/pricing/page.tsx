import NavbarAuth from "@/components/NavbarAuth";

export const metadata = {
  title: "Tarifs | Talent Maroc",
  description: "Découvrez les offres candidat et recruteur de Talent Maroc.",
};

const CHECK = "✓";
const CROSS  = "—";

export default function PricingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f5f3ff;color:#0f172a}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .au{animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both}
        .plan{background:white;border:2px solid #ede9fe;border-radius:18px;padding:32px 28px;display:flex;flex-direction:column;gap:0;transition:transform .18s,box-shadow .18s}
        .plan:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(124,58,237,.1)}
        .plan.featured{border-color:#7c3aed;box-shadow:0 8px 32px rgba(124,58,237,.2)}
        .plan.pro-employer{border-color:#7c3aed;box-shadow:0 8px 32px rgba(124,58,237,.12)}
        .feature-row{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #f5f3ff;font-size:13px}
        .feature-row:last-child{border-bottom:none}
        .check{color:#7c3aed;font-weight:700;flex-shrink:0;margin-top:1px}
        .check.purple{color:#7c3aed}
        .cross{color:#d1d5db;flex-shrink:0;margin-top:1px}
        .tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px}
        .nl{color:#4b5563;text-decoration:none;font-size:13px;font-weight:600;padding:6px 10px;border-radius:7px;transition:all .18s}
        .nl:hover{color:#1e1147;background:#f5f3ff}
        @media(max-width:900px){.plans-grid{grid-template-columns:1fr!important}.compare-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* NAVBAR */}
      <nav style={{ background:"rgba(255,255,255,.96)", backdropFilter:"blur(12px)", borderBottom:"1.5px solid #f0f0f0", padding:"0 24px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <a href="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
          <img src="/logo.png" alt="TalentMaroc" style={{ height:42, width:'auto', objectFit:'contain' }} />
        </a>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <a href="/" className="nl">Emplois</a>
          <a href="/employeur" className="nl">Recruteurs</a>
          <NavbarAuth />
        </div>
      </nav>

      <div style={{ background:"#f5f3ff", minHeight:"100vh", paddingBottom:80 }}>

        {/* HERO */}
        <header style={{ background:"white", borderBottom:"1.5px solid #ede9fe", padding:"64px 24px 56px", textAlign:"center" }}>
          <div style={{ maxWidth:640, margin:"0 auto" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"#f5f3ff", border:"1.5px solid #ddd6fe", borderRadius:100, padding:"5px 16px", marginBottom:18 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#7c3aed", display:"inline-block" }}/>
              <span style={{ fontSize:12, fontWeight:700, color:"#6d28d9" }}>Tarifs simples et transparents</span>
            </div>
            <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:"clamp(28px,5vw,46px)", fontWeight:800, lineHeight:1.12, letterSpacing:"-.02em", marginBottom:14, color:"#1e1147" }}>
              Investissez dans<br/>
              <span style={{ color:"#7c3aed" }}>votre carrière ou vos recrutements</span>
            </h1>
            <p style={{ fontSize:15, color:"#6b7280", lineHeight:1.7 }}>
              Accès gratuit pour tous. Les fonctionnalités Pro débloqueront l'IA et les outils avancés.
            </p>
          </div>
        </header>

        <div style={{ maxWidth:1080, margin:"0 auto", padding:"48px 20px 0" }}>

          {/* ── CANDIDATS ── */}
          <div style={{ marginBottom:56 }}>
            <div style={{ textAlign:"center", marginBottom:32 }}>
              <h2 style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Pour les candidats</h2>
              <p style={{ fontSize:14, color:"#6b7280" }}>Trouvez votre emploi idéal au Maroc</p>
            </div>

            <div className="plans-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }}>

              {/* FREE CANDIDAT */}
              <div className="plan au" style={{ animationDelay:".05s" }}>
                <div style={{ marginBottom:24 }}>
                  <span className="tag" style={{ background:"#f3f4f6", color:"#374151", marginBottom:12 }}>Gratuit</span>
                  <div style={{ fontSize:28, fontWeight:800, marginBottom:4 }}>0 MAD</div>
                  <div style={{ fontSize:13, color:"#6b7280" }}>Pour toujours</div>
                </div>
                <div style={{ marginBottom:24, flex:1 }}>
                  {[
                    [CHECK, "Recherche d'offres illimitée"],
                    [CHECK, "Sauvegarder des offres"],
                    [CHECK, "Suivi des candidatures"],
                    [CHECK, "Import de CV (PDF)"],
                    [CHECK, "1 CV généré par IA"],
                    [CROSS, "CV amélioré par IA"],
                    [CROSS, "Modèles Pro (Exécutif, Créatif…)"],
                    [CROSS, "Lettre de motivation IA"],
                    [CROSS, "Adaptation CV au poste"],
                  ].map(([icon, label], i) => (
                    <div key={i} className="feature-row">
                      <span className={icon === CHECK ? "check" : "cross"}>{icon}</span>
                      <span style={{ color: icon === CROSS ? "#9ca3af" : "#374151" }}>{label}</span>
                    </div>
                  ))}
                </div>
                <a href="/auth/login" style={{ display:"block", background:"#f3f4f6", color:"#374151", padding:"12px", borderRadius:10, textAlign:"center", textDecoration:"none", fontWeight:700, fontSize:13, transition:"all .18s" }}>
                  Commencer gratuitement →
                </a>
              </div>

              {/* PRO CANDIDAT */}
              <div className="plan featured au" style={{ animationDelay:".12s" }}>
                <div style={{ marginBottom:24 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <span className="tag" style={{ background:"linear-gradient(135deg,#7c3aed,#5b21b6)", color:"white" }}>✦ Pro</span>
                    <span style={{ fontSize:11, fontWeight:700, color:"#6d28d9", background:"#f5f3ff", padding:"2px 8px", borderRadius:100 }}>Le plus populaire</span>
                  </div>
                  <div style={{ fontSize:28, fontWeight:800, marginBottom:4 }}>
                    49 MAD <span style={{ fontSize:14, fontWeight:500, color:"#6b7280" }}>/mois</span>
                  </div>
                  <div style={{ fontSize:13, color:"#6b7280" }}>Ou 399 MAD/an · Économisez 32%</div>
                </div>
                <div style={{ marginBottom:24, flex:1 }}>
                  {[
                    [CHECK, "Tout le plan Gratuit"],
                    [CHECK, "CV amélioré par IA"],
                    [CHECK, "5 modèles Pro (Exécutif, Créatif…)"],
                    [CHECK, "Lettre de motivation générée par IA"],
                    [CHECK, "Adaptation du CV au poste ciblé"],
                    [CHECK, "Export PDF + Word"],
                    [CHECK, "Résumé LinkedIn généré par IA"],
                    [CROSS, "Modèles premium illimités"],
                    [CROSS, "Support prioritaire"],
                  ].map(([icon, label], i) => (
                    <div key={i} className="feature-row">
                      <span className={icon === CHECK ? "check" : "cross"}>{icon}</span>
                      <span style={{ color: icon === CROSS ? "#9ca3af" : "#374151" }}>{label}</span>
                    </div>
                  ))}
                </div>
                <a href="/cv" style={{ display:"block", background:"linear-gradient(135deg,#7c3aed,#5b21b6)", color:"white", padding:"12px", borderRadius:10, textAlign:"center", textDecoration:"none", fontWeight:700, fontSize:13, transition:"all .18s", boxShadow:"0 4px 14px rgba(124,58,237,.35)" }}>
                  Commencer avec Pro →
                </a>
              </div>

              {/* CADRE CANDIDAT */}
              <div className="plan au" style={{ animationDelay:".19s" }}>
                <div style={{ marginBottom:24 }}>
                  <span className="tag" style={{ background:"#0f172a", color:"white", marginBottom:12 }}>Cadre</span>
                  <div style={{ fontSize:28, fontWeight:800, marginBottom:4 }}>
                    99 MAD <span style={{ fontSize:14, fontWeight:500, color:"#6b7280" }}>/mois</span>
                  </div>
                  <div style={{ fontSize:13, color:"#6b7280" }}>Ou 799 MAD/an · Économisez 33%</div>
                </div>
                <div style={{ marginBottom:24, flex:1 }}>
                  {[
                    [CHECK, "Tout le plan Pro"],
                    [CHECK, "Modèles premium illimités"],
                    [CHECK, "Coaching entretien par IA"],
                    [CHECK, "Analyse de votre profil vs. le marché"],
                    [CHECK, "Alertes emploi personnalisées"],
                    [CHECK, "Export multi-formats"],
                    [CHECK, "Support prioritaire 24h"],
                    [CHECK, "Accès anticipé aux nouvelles fonctions"],
                  ].map(([icon, label], i) => (
                    <div key={i} className="feature-row">
                      <span className="check">{icon}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <a href="/cv" style={{ display:"block", background:"#0f172a", color:"white", padding:"12px", borderRadius:10, textAlign:"center", textDecoration:"none", fontWeight:700, fontSize:13, transition:"all .18s" }}>
                  Choisir Cadre →
                </a>
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <div style={{ height:1, background:"linear-gradient(90deg,transparent,#e5e7eb,transparent)", margin:"0 0 56px" }}/>

          {/* ── RECRUTEURS ── */}
          <div style={{ marginBottom:56 }}>
            <div style={{ textAlign:"center", marginBottom:32 }}>
              <h2 style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Pour les recruteurs</h2>
              <p style={{ fontSize:14, color:"#6b7280" }}>Trouvez et gérez les meilleurs talents</p>
            </div>

            <div className="plans-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }}>

              {/* FREE EMPLOYER */}
              <div className="plan au" style={{ animationDelay:".05s" }}>
                <div style={{ marginBottom:24 }}>
                  <span className="tag" style={{ background:"#f3f4f6", color:"#374151", marginBottom:12 }}>Gratuit</span>
                  <div style={{ fontSize:28, fontWeight:800, marginBottom:4 }}>0 MAD</div>
                  <div style={{ fontSize:13, color:"#6b7280" }}>Pour toujours</div>
                </div>
                <div style={{ marginBottom:24, flex:1 }}>
                  {[
                    [CHECK, "3 offres d'emploi actives"],
                    [CHECK, "Dashboard de candidatures"],
                    [CHECK, "Voir nom et email des candidats"],
                    [CHECK, "Modifier le statut des candidatures"],
                    [CHECK, "Export CSV basique"],
                    [CROSS, "Offres en vedette (featured)"],
                    [CROSS, "Comparaison IA des candidats"],
                    [CROSS, "Téléchargement CV en lot"],
                    [CROSS, "Statistiques avancées"],
                  ].map(([icon, label], i) => (
                    <div key={i} className="feature-row">
                      <span className={icon === CHECK ? "check" : "cross"}>{icon}</span>
                      <span style={{ color: icon === CROSS ? "#9ca3af" : "#374151" }}>{label}</span>
                    </div>
                  ))}
                </div>
                <a href="/employeur" style={{ display:"block", background:"#f3f4f6", color:"#374151", padding:"12px", borderRadius:10, textAlign:"center", textDecoration:"none", fontWeight:700, fontSize:13 }}>
                  Créer un compte →
                </a>
              </div>

              {/* PRO EMPLOYER */}
              <div className="plan pro-employer au" style={{ animationDelay:".12s" }}>
                <div style={{ marginBottom:24 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <span className="tag" style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"white" }}>✦ Pro Recruteur</span>
                  </div>
                  <div style={{ fontSize:28, fontWeight:800, marginBottom:4 }}>
                    299 MAD <span style={{ fontSize:14, fontWeight:500, color:"#6b7280" }}>/mois</span>
                  </div>
                  <div style={{ fontSize:13, color:"#6b7280" }}>Ou 2 490 MAD/an · Économisez 31%</div>
                </div>
                <div style={{ marginBottom:24, flex:1 }}>
                  {[
                    [CHECK, "Offres d'emploi illimitées"],
                    [CHECK, "Dashboard complet"],
                    [CHECK, "Comparaison IA des candidats 🤖"],
                    [CHECK, "Téléchargement CV en lot"],
                    [CHECK, "Email direct aux candidats"],
                    [CHECK, "Export CSV complet (nom, email, CV)"],
                    [CHECK, "Offres mises en avant"],
                    [CROSS, "Marque employeur personnalisée"],
                    [CROSS, "API d'intégration"],
                  ].map(([icon, label], i) => (
                    <div key={i} className="feature-row">
                      <span className={icon === CHECK ? "check purple" : "cross"}>{icon}</span>
                      <span style={{ color: icon === CROSS ? "#9ca3af" : "#374151" }}>{label}</span>
                    </div>
                  ))}
                </div>
                <a href="/employeur" style={{ display:"block", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"white", padding:"12px", borderRadius:10, textAlign:"center", textDecoration:"none", fontWeight:700, fontSize:13 }}>
                  Démarrer Pro Recruteur →
                </a>
              </div>

              {/* ENTERPRISE */}
              <div className="plan au" style={{ animationDelay:".19s", background:"linear-gradient(160deg,#0f172a 0%,#1e3a5f 100%)", borderColor:"#1e3a5f" }}>
                <div style={{ marginBottom:24 }}>
                  <span className="tag" style={{ background:"rgba(255,255,255,.15)", color:"white", marginBottom:12 }}>Entreprise</span>
                  <div style={{ fontSize:28, fontWeight:800, marginBottom:4, color:"white" }}>Sur devis</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>Adapté à vos besoins</div>
                </div>
                <div style={{ marginBottom:24, flex:1 }}>
                  {[
                    "Tout le plan Pro Recruteur",
                    "Marque employeur dédiée",
                    "Intégration ATS / API",
                    "Tableau de bord multi-utilisateurs",
                    "Rapports RH personnalisés",
                    "Account manager dédié",
                    "SLA garanti",
                    "Formation équipe RH",
                  ].map((label, i) => (
                    <div key={i} className="feature-row" style={{ borderBottomColor:"rgba(255,255,255,.08)" }}>
                      <span style={{ color:"#a78bfa", flexShrink:0, fontWeight:700 }}>✓</span>
                      <span style={{ color:"rgba(255,255,255,.8)", fontSize:13 }}>{label}</span>
                    </div>
                  ))}
                </div>
                <a href="mailto:contact@talentmaroc.shop" style={{ display:"block", background:"rgba(255,255,255,.1)", color:"white", border:"1.5px solid rgba(255,255,255,.2)", padding:"12px", borderRadius:10, textAlign:"center", textDecoration:"none", fontWeight:700, fontSize:13 }}>
                  Nous contacter →
                </a>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div style={{ maxWidth:680, margin:"0 auto" }}>
            <h2 style={{ fontSize:20, fontWeight:800, textAlign:"center", marginBottom:24 }}>Questions fréquentes</h2>
            {[
              ["Comment fonctionne la comparaison IA ?", "Notre IA (Claude par Anthropic) analyse les profils des candidats, leur lettre de motivation, leurs notes et leur statut pour produire une analyse comparative structurée. Disponible pour les recruteurs Pro."],
              ["Mon CV importé est-il visible par les recruteurs ?", "Votre CV est joint automatiquement lorsque vous postulez à une offre d'un recruteur inscrit sur TalentMaroc. Pour les offres externes, vous postulez directement sur le site de l'entreprise."],
              ["Puis-je utiliser le même compte pour candidater et recruter ?", "Non. Les comptes candidat et recruteur sont séparés pour protéger la vie privée et garantir la cohérence de l'expérience. Créez deux comptes avec des emails différents si besoin."],
              ["Comment annuler mon abonnement ?", "Vous pouvez annuler à tout moment depuis votre tableau de bord. Vous conservez l'accès jusqu'à la fin de la période payée."],
            ].map(([q, a], i) => (
              <div key={i} style={{ background:"white", border:"1.5px solid #f0f0f0", borderRadius:12, padding:"18px 22px", marginBottom:10 }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>{q}</div>
                <div style={{ fontSize:13, color:"#6b7280", lineHeight:1.7 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer style={{ background:"#0f172a", padding:"24px", textAlign:"center" }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,.25)" }}>© 2026 Talent Maroc · <a href="/terms" style={{ color:"rgba(255,255,255,.25)", textDecoration:"none" }}>CGU</a> · <a href="/privacy" style={{ color:"rgba(255,255,255,.25)", textDecoration:"none" }}>Confidentialité</a></span>
      </footer>
    </>
  );
}
