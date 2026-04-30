// ─────────────────────────────────────────────────────────────────────────
// app/privacy/page.tsx
// Deploy at: app/privacy/page.tsx  →  talentmaroc.shop/privacy
// ─────────────────────────────────────────────────────────────────────────

const LAST_UPDATED  = "22 mars 2026";
const SITE_URL      = "https://talentmaroc.shop";
const CONTACT_EMAIL = "contact@talentmaroc.shop";

export const metadata = {
  title: "Politique de Confidentialité | Talent Maroc",
  description: "Comment Talent Maroc collecte, utilise et protège vos données personnelles. Conforme à la loi marocaine 09-08 sur la protection des données.",
};

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    icon: "🛡",
    content: `Talent Maroc (« nous », « notre », « nos ») attache une importance capitale à la protection de votre vie privée et au respect de vos données personnelles.

La présente Politique de Confidentialité décrit de manière transparente comment nous collectons, utilisons, stockons, partageons et protégeons vos informations personnelles lorsque vous utilisez notre plateforme disponible à l'adresse ${SITE_URL}.

Elle est rédigée en conformité avec :
• La loi marocaine n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel
• Le Règlement Général sur la Protection des Données (RGPD) de l'Union Européenne, applicable à nos utilisateurs résidant en Europe
• Les recommandations de la Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP) du Maroc

En utilisant Talent Maroc, vous reconnaissez avoir lu et compris la présente politique. Si vous n'acceptez pas ces pratiques, nous vous invitons à cesser d'utiliser nos services.`,
  },
  {
    id: "controller",
    title: "2. Responsable du traitement",
    icon: "🏢",
    content: `Le responsable du traitement de vos données personnelles est :

Nom : Talent Maroc
Site web : ${SITE_URL}
Email : ${CONTACT_EMAIL}
Adresse : Tanger, Maroc

Pour toute question ou demande relative à vos données personnelles, vous pouvez nous contacter à l'adresse email indiquée ci-dessus. Nous nous engageons à répondre dans un délai maximum de 30 jours.`,
  },
  {
    id: "data-collected",
    title: "3. Données collectées",
    icon: "📋",
    content: `Nous collectons différentes catégories de données selon votre utilisation de nos services :

A. DONNÉES QUE VOUS NOUS FOURNISSEZ DIRECTEMENT

• Données de compte : adresse email, nom d'affichage, mot de passe (chiffré)
• Données de profil : ville, secteur d'activité, niveau d'expérience
• Données de CV : informations professionnelles que vous saisissez dans notre générateur (nom, coordonnées, expériences, formations, compétences, langues). Ces données peuvent inclure des données sensibles comme votre situation professionnelle.
• Données de CV uploadé : le contenu de tout fichier PDF, DOC ou TXT que vous importez pour amélioration
• Données de candidatures : les offres d'emploi que vous sauvegardez ou suivez, les notes que vous ajoutez, le statut de vos candidatures
• Communications : les messages que vous nous envoyez par email

B. DONNÉES COLLECTÉES AUTOMATIQUEMENT

• Données de navigation : pages visitées, temps passé, liens cliqués, URL de référence
• Données techniques : adresse IP, type de navigateur, système d'exploitation, résolution d'écran, langue du navigateur
• Cookies et technologies similaires (voir section 8)

C. DONNÉES DE PAIEMENT

• Nous ne collectons PAS directement vos données bancaires (numéro de carte, CVV, etc.)
• Ces données sont traitées exclusivement par notre prestataire de paiement Paddle (paddle.com), qui agit en tant que Merchant of Record. Veuillez consulter la politique de confidentialité de Paddle pour plus d'informations.
• Nous recevons uniquement une confirmation de paiement et un identifiant de transaction.`,
  },
  {
    id: "legal-basis",
    title: "4. Base légale du traitement",
    icon: "⚖",
    content: `Conformément à la loi 09-08 et au RGPD, tout traitement de données personnelles doit reposer sur une base légale. Voici les bases sur lesquelles nous fondons nos traitements :

• EXÉCUTION D'UN CONTRAT : traitement nécessaire pour vous fournir nos services (création de compte, génération de CV, suivi de candidatures)

• CONSENTEMENT : envoi de communications marketing, utilisation de cookies non essentiels. Vous pouvez retirer votre consentement à tout moment.

• INTÉRÊT LÉGITIME : amélioration de nos services, sécurité de la plateforme, prévention de la fraude, analyses statistiques anonymisées

• OBLIGATION LÉGALE : conservation de certaines données pour respecter nos obligations fiscales et légales au Maroc`,
  },
  {
    id: "how-we-use",
    title: "5. Comment nous utilisons vos données",
    icon: "🔧",
    content: `Nous utilisons vos données personnelles aux fins suivantes :

FOURNITURE DU SERVICE
• Créer et gérer votre compte utilisateur
• Vous afficher les offres d'emploi correspondant à vos critères
• Générer et améliorer votre CV grâce à l'IA (service Claude d'Anthropic)
• Gérer le suivi de vos candidatures dans votre tableau de bord
• Traiter vos paiements via Paddle

AMÉLIORATION DE NOS SERVICES
• Analyser l'utilisation de la plateforme pour l'optimiser
• Détecter et corriger les bugs techniques
• Développer de nouvelles fonctionnalités

COMMUNICATION
• Vous envoyer les emails transactionnels (confirmation d'inscription, reçus de paiement)
• Vous informer des mises à jour importantes du service
• Répondre à vos demandes de support

SÉCURITÉ ET CONFORMITÉ
• Prévenir la fraude et les abus
• Respecter nos obligations légales
• Protéger les droits et la sécurité de nos utilisateurs

IMPORTANT — DONNÉES DE CV ET IA : Lorsque vous utilisez notre générateur de CV, votre contenu est transmis à l'API d'Anthropic (Claude) pour traitement. Anthropic ne conserve pas vos données au-delà du traitement de la requête selon leur politique de confidentialité. Vos données de CV ne sont pas utilisées pour entraîner des modèles d'IA.`,
  },
  {
    id: "data-sharing",
    title: "6. Partage des données",
    icon: "🤝",
    content: `Nous ne vendons jamais vos données personnelles à des tiers. Nous partageons vos données uniquement dans les cas suivants :

PRESTATAIRES DE SERVICES (sous-traitants)
Nous faisons appel à des prestataires de confiance qui traitent vos données en notre nom :

• Supabase (supabase.com) — hébergement de base de données et authentification. Données hébergées sur des serveurs AWS en Europe (région EU).
• Anthropic (anthropic.com) — traitement IA pour la génération et l'amélioration de CV. Les données sont traitées et non conservées.
• Paddle (paddle.com) — traitement sécurisé des paiements en tant que Merchant of Record.
• n8n — automatisation des flux de données pour l'agrégation des offres d'emploi.
• Vercel (vercel.com) — hébergement de l'application web.

Tous nos prestataires sont contractuellement tenus de respecter la confidentialité de vos données et de ne les utiliser qu'aux fins pour lesquelles nous les leur avons transmises.

OBLIGATIONS LÉGALES
Nous pouvons divulguer vos données si la loi l'exige, notamment en réponse à une décision judiciaire ou à une demande d'une autorité publique compétente au Maroc.

PROTECTION DE NOS DROITS
En cas de fraude avérée, d'activité illégale ou pour défendre nos droits légaux.

TRANSFERT D'ENTREPRISE
En cas de fusion, acquisition ou cession d'actifs, vos données pourraient être transférées. Nous vous en informerons préalablement.`,
  },
  {
    id: "data-retention",
    title: "7. Durée de conservation",
    icon: "🗓",
    content: `Nous conservons vos données personnelles uniquement le temps nécessaire aux finalités pour lesquelles elles ont été collectées :

• Données de compte actif : conservées pendant toute la durée de vie de votre compte, plus 3 ans après votre dernière connexion
• Données de CV générés : conservées dans votre session active. Les données soumises à l'API IA ne sont pas stockées de manière permanente sur nos serveurs.
• Historique de candidatures : conservé tant que votre compte est actif, supprimé à la clôture du compte
• Données de paiement (références de transaction) : 10 ans conformément aux obligations fiscales marocaines
• Logs de sécurité : 12 mois
• Cookies analytiques : 13 mois maximum

À l'expiration de ces délais, vos données sont supprimées de manière sécurisée ou anonymisées de façon irréversible.`,
  },
  {
    id: "cookies",
    title: "8. Cookies et technologies de suivi",
    icon: "🍪",
    content: `Nous utilisons des cookies et technologies similaires pour faire fonctionner notre site et améliorer votre expérience.

COOKIES ESSENTIELS (nécessaires au fonctionnement)
• Cookie de session d'authentification (Supabase) — vous maintient connecté
• Cookie de préférences de langue et d'affichage
Ces cookies ne peuvent pas être désactivés sans affecter le fonctionnement du site.

COOKIES ANALYTIQUES (avec votre consentement)
• Analyse d'utilisation anonymisée pour améliorer nos services
• Mesure des performances des pages

COOKIES DE PAIEMENT
• Paddle peut déposer des cookies lors du processus de paiement

Vous pouvez gérer vos préférences cookies via les paramètres de votre navigateur. Notez que la désactivation de certains cookies peut affecter les fonctionnalités du site.

Pour les utilisateurs de l'Union Européenne, nous recueillons votre consentement explicite avant de déposer des cookies non essentiels.`,
  },
  {
    id: "your-rights",
    title: "9. Vos droits",
    icon: "✅",
    content: `Conformément à la loi marocaine 09-08 et au RGPD (pour les résidents de l'UE), vous disposez des droits suivants sur vos données personnelles :

DROIT D'ACCÈS
Vous pouvez demander une copie de toutes les données personnelles que nous détenons sur vous.

DROIT DE RECTIFICATION
Vous pouvez demander la correction de données inexactes ou incomplètes. Vous pouvez également modifier directement votre profil depuis les paramètres de votre compte.

DROIT À L'EFFACEMENT (« droit à l'oubli »)
Vous pouvez demander la suppression de vos données dans les cas prévus par la loi. Pour supprimer votre compte et toutes vos données, rendez-vous dans Paramètres → Supprimer mon compte, ou contactez-nous.

DROIT À LA LIMITATION DU TRAITEMENT
Vous pouvez demander que nous limitions le traitement de vos données dans certaines circonstances.

DROIT À LA PORTABILITÉ
Vous pouvez recevoir vos données dans un format structuré, couramment utilisé et lisible par machine.

DROIT D'OPPOSITION
Vous pouvez vous opposer au traitement de vos données à des fins de marketing direct ou basé sur notre intérêt légitime.

DROIT DE RETRAIT DU CONSENTEMENT
Lorsque le traitement est fondé sur votre consentement, vous pouvez le retirer à tout moment, sans affecter la licéité du traitement effectué avant ce retrait.

COMMENT EXERCER VOS DROITS
Envoyez votre demande à ${CONTACT_EMAIL} en précisant votre identité et le droit que vous souhaitez exercer. Nous répondons dans un délai de 30 jours.

Vous avez également le droit de déposer une plainte auprès de la CNDP (Commission Nationale de contrôle de la protection des Données à caractère Personnel) au Maroc : www.cndp.ma`,
  },
  {
    id: "data-security",
    title: "10. Sécurité des données",
    icon: "🔒",
    content: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, toute perte, destruction ou divulgation accidentelle :

MESURES TECHNIQUES
• Chiffrement HTTPS/TLS pour toutes les communications
• Mots de passe chiffrés avec un algorithme sécurisé (bcrypt via Supabase Auth)
• Row Level Security (RLS) sur notre base de données Supabase — chaque utilisateur n'accède qu'à ses propres données
• Clés API stockées uniquement côté serveur, jamais exposées côté client
• Infrastructure hébergée sur des serveurs certifiés SOC 2 (Vercel, Supabase)

MESURES ORGANISATIONNELLES
• Accès aux données restreint aux seules personnes ayant besoin d'y accéder
• Revue régulière des accès et des permissions

En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits et libertés, nous nous engageons à vous en informer dans les meilleurs délais, conformément aux exigences légales applicables.

Malgré ces mesures, aucun système de sécurité n'est infaillible. Si vous pensez que la sécurité de votre compte a été compromise, contactez-nous immédiatement.`,
  },
  {
    id: "minors",
    title: "11. Protection des mineurs",
    icon: "👦",
    content: `Talent Maroc est un service destiné exclusivement aux personnes âgées de 18 ans ou plus.

Nous ne collectons pas sciemment de données personnelles concernant des enfants de moins de 18 ans. Si vous êtes le parent ou le tuteur d'un mineur et que vous pensez que celui-ci nous a fourni des données personnelles, veuillez nous contacter immédiatement à ${CONTACT_EMAIL}.

Dès que nous aurons connaissance de la situation, nous supprimerons ces données dans les plus brefs délais.`,
  },
  {
    id: "international-transfers",
    title: "12. Transferts internationaux",
    icon: "🌍",
    content: `Vos données personnelles peuvent être transférées et traitées dans des pays en dehors du Maroc, notamment aux États-Unis (Anthropic, Vercel, Paddle) et dans l'Union Européenne (Supabase, région AWS EU).

Ces transferts sont effectués dans le respect des garanties appropriées :
• Pour les transferts vers l'UE : conformité au RGPD
• Pour les transferts vers les États-Unis : nos prestataires sont soumis à des clauses contractuelles types ou à des certifications équivalentes

Conformément à la loi marocaine 09-08, tout transfert de données vers un pays étranger n'offrant pas un niveau de protection adéquat est encadré par des garanties contractuelles appropriées.`,
  },
  {
    id: "updates",
    title: "13. Mises à jour de cette politique",
    icon: "🔄",
    content: `Nous nous réservons le droit de modifier la présente Politique de Confidentialité à tout moment pour refléter les évolutions légales, les changements dans nos pratiques de traitement ou les nouvelles fonctionnalités de notre plateforme.

En cas de modification substantielle, nous vous en informerons :
• Par email à l'adresse associée à votre compte, au moins 15 jours avant l'entrée en vigueur des changements
• Par une notification visible sur notre site

La date de la dernière mise à jour est indiquée en haut de cette page. Votre utilisation continue de nos services après l'entrée en vigueur des modifications constitue votre acceptation de la nouvelle politique.

Nous conservons les versions précédentes de cette politique disponibles sur demande.`,
  },
  {
    id: "contact-dpo",
    title: "14. Contact et réclamations",
    icon: "📬",
    content: `Pour toute question, demande d'exercice de droits ou réclamation concernant le traitement de vos données personnelles, contactez-nous :

• Email : ${CONTACT_EMAIL}
• Site web : ${SITE_URL}
• Adresse : Tanger, Maroc

Nous nous engageons à accuser réception de votre demande dans les 72 heures et à y répondre dans un délai de 30 jours.

Si vous estimez que votre demande n'a pas été traitée de manière satisfaisante, vous avez le droit de déposer une plainte auprès de l'autorité de contrôle compétente :

MAROC — Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP)
Site : www.cndp.ma
Adresse : Angle Avenue Annakhil et Mehdi Ben Barka, Hay Riad, Rabat

UE (pour les résidents européens) — Votre autorité nationale de protection des données (CNIL en France, etc.)`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #0f172a; }
        .toc-link { color: #16a34a; text-decoration: none; font-size: 13px; line-height: 2; display: block; font-weight: 500; transition: color .15s; }
        .toc-link:hover { color: #15803d; text-decoration: underline; }
        .section-content { white-space: pre-line; }
        .nl { color: #4b5563; text-decoration: none; font-size: 14px; font-weight: 600; padding: 7px 12px; border-radius: 8px; transition: all .18s; }
        .nl:hover { color: #0f172a; background: #f3f4f6; }
        @media (max-width: 768px) {
          .layout  { flex-direction: column !important; }
          .sidebar { display: none !important; }
          .content-area { padding: 0 !important; }
        }
      `}</style>

      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#f8fafc", color:"#0f172a", minHeight:"100vh" }}>

        {/* ── NAVBAR ── */}
        <nav style={{ background:"rgba(255,255,255,.96)", backdropFilter:"blur(12px)", borderBottom:"1.5px solid #f0f0f0", padding:"0 24px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:28 }}>
            <a href="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
              <div style={{ width:34, height:34, background:"#16a34a", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:"white" }}>T</div>
              <span style={{ color:"#0f172a", fontWeight:800, fontSize:16 }}>TalentMaroc</span>
            </a>
            <div style={{ display:"flex", gap:2 }}>
              <a href="/"           className="nl">Emplois</a>
              <a href="/cv"         className="nl">Mon CV</a>
              <a href="/employers"  className="nl">Recruteurs</a>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <a href="/auth/login"    className="nl">Connexion</a>
            <a href="/employers/new" style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#16a34a", color:"white", padding:"8px 16px", borderRadius:9, fontSize:13, fontWeight:700, textDecoration:"none" }}>Publier</a>
          </div>
        </nav>

        {/* ── HERO ── */}
        <div style={{ background:"white", borderBottom:"1.5px solid #f0f0f0", padding:"48px 24px 52px" }}>
          <div style={{ maxWidth:1060, margin:"0 auto" }}>
            {/* Breadcrumb */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, fontSize:13, color:"#9ca3af" }}>
              <a href="/" style={{ color:"#9ca3af", textDecoration:"none" }}>Accueil</a>
              <span>›</span>
              <span style={{ color:"#374151", fontWeight:500 }}>Politique de Confidentialité</span>
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"#f0fdf4", border:"1.5px solid #bbf7d0", color:"#15803d", fontSize:12, fontWeight:700, padding:"5px 14px", borderRadius:100, marginBottom:16 }}>
              🛡 Document légal · Conforme loi 09-08 & RGPD
            </div>
            <h1 style={{ fontSize:"clamp(26px,4vw,40px)", fontWeight:800, color:"#0f172a", lineHeight:1.15, marginBottom:12, letterSpacing:"-0.02em" }}>
              Politique de Confidentialité
            </h1>
            <p style={{ color:"#6b7280", fontSize:14, marginBottom:0 }}>
              Dernière mise à jour : <strong style={{ color:"#374151" }}>{LAST_UPDATED}</strong>
            </p>
          </div>
        </div>

        {/* ── GDPR BANNER ── */}
        <div style={{ background:"#f0fdf4", borderBottom:"1.5px solid #bbf7d0", padding:"14px 24px" }}>
          <div style={{ maxWidth:1060, margin:"0 auto", display:"flex", alignItems:"center", gap:12, fontSize:13, color:"#15803d" }}>
            <span style={{ fontSize:18, flexShrink:0 }}>✅</span>
            <span>Vos données vous appartiennent. Chez Talent Maroc, nous ne vendons jamais vos données personnelles et ne les utilisons que pour vous fournir nos services. Conforme à la <strong>loi marocaine 09-08</strong> et au <strong>RGPD européen</strong>.</span>
          </div>
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div style={{ maxWidth:1060, margin:"0 auto", padding:"40px 24px 80px" }}>
          <div className="layout" style={{ display:"flex", gap:32, alignItems:"flex-start" }}>

            {/* ── SIDEBAR ── */}
            <div className="sidebar" style={{ width:252, flexShrink:0, position:"sticky", top:80 }}>
              <div style={{ background:"white", border:"1.5px solid #f0f0f0", borderRadius:12, padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#9ca3af", marginBottom:14 }}>Sommaire</div>
                <nav>
                  {sections.map(s=>(
                    <a key={s.id} href={`#${s.id}`} className="toc-link">
                      {s.icon} {s.title.replace(/^\d+\.\s/,"")}
                    </a>
                  ))}
                </nav>
                {/* Contact card */}
                <div style={{ marginTop:20, padding:"14px", background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#15803d", marginBottom:6 }}>📬 Exercer vos droits</div>
                  <div style={{ fontSize:12, color:"#374151", marginBottom:8, lineHeight:1.5 }}>Accès, rectification, suppression…</div>
                  <a href={`mailto:${CONTACT_EMAIL}`} style={{ fontSize:12, color:"#16a34a", fontWeight:600, textDecoration:"none", wordBreak:"break-all" }}>{CONTACT_EMAIL}</a>
                </div>
              </div>
            </div>

            {/* ── CONTENT ── */}
            <div className="content-area" style={{ flex:1, minWidth:0 }}>

              {/* Intro card */}
              <div style={{ background:"white", border:"1.5px solid #f0f0f0", borderRadius:12, padding:"24px 28px", marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                <p style={{ fontSize:14, color:"#374151", lineHeight:1.85 }}>
                  Bienvenue sur <strong>Talent Maroc</strong> ({SITE_URL}), la plateforme de référence pour l'emploi au Maroc. Cette politique explique de manière claire et accessible comment nous traitons vos données personnelles, quels sont vos droits et comment les exercer.
                </p>
              </div>

              {/* Quick summary cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10, marginBottom:16 }}>
                {[
                  { icon:"🚫", title:"Pas de vente", desc:"Nous ne vendons jamais vos données à des tiers" },
                  { icon:"🔒", title:"Sécurisé", desc:"Chiffrement HTTPS et Row Level Security Supabase" },
                  { icon:"✋", title:"Vos droits", desc:"Accès, rectification, suppression sur simple demande" },
                  { icon:"🇲🇦", title:"Loi 09-08", desc:"Conforme au droit marocain et au RGPD européen" },
                ].map(c=>(
                  <div key={c.title} style={{ background:"white", border:"1.5px solid #f0f0f0", borderRadius:10, padding:"16px", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:22, marginBottom:8 }}>{c.icon}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:4 }}>{c.title}</div>
                    <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.5 }}>{c.desc}</div>
                  </div>
                ))}
              </div>

              {/* Sections */}
              {sections.map((section, idx)=>(
                <div key={section.id} id={section.id}
                  style={{ background:"white", border:"1.5px solid #f0f0f0", borderRadius:12, padding:"24px 28px", marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,.04)", scrollMarginTop:86 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                    <div style={{ width:36, height:36, background:"#f0fdf4", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                      {section.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>Article {idx+1}</div>
                      <h2 style={{ fontSize:16, fontWeight:800, color:"#0f172a", lineHeight:1.2 }}>{section.title.replace(/^\d+\.\s/,"")}</h2>
                    </div>
                  </div>
                  <div style={{ height:"1.5px", background:"#f3f4f6", marginBottom:14 }}/>
                  <div className="section-content" style={{ fontSize:14, color:"#374151", lineHeight:1.9 }}>
                    {section.content}
                  </div>
                </div>
              ))}

              {/* Bottom CTA */}
              <div style={{ background:"#0f172a", borderRadius:12, padding:"28px 32px", marginTop:16, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:20 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:"white", marginBottom:6 }}>Vous avez des questions sur vos données ?</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>Notre équipe répond dans un délai de 30 jours à toute demande.</div>
                </div>
                <a href={`mailto:${CONTACT_EMAIL}`}
                  style={{ background:"#16a34a", color:"white", textDecoration:"none", padding:"12px 24px", borderRadius:9, fontSize:14, fontWeight:700, flexShrink:0, display:"inline-flex", alignItems:"center", gap:8 }}>
                  📬 Nous écrire →
                </a>
              </div>

              {/* Related links */}
              <div style={{ display:"flex", gap:12, marginTop:16, flexWrap:"wrap" }}>
                <a href="/terms" style={{ display:"inline-flex", alignItems:"center", gap:6, background:"white", border:"1.5px solid #e5e7eb", padding:"10px 18px", borderRadius:9, fontSize:13, fontWeight:600, color:"#374151", textDecoration:"none", transition:"all .18s" }}>
                  📄 Conditions Générales d'Utilisation
                </a>
                <a href="mailto:contact@talentmaroc.shop" style={{ display:"inline-flex", alignItems:"center", gap:6, background:"white", border:"1.5px solid #e5e7eb", padding:"10px 18px", borderRadius:9, fontSize:13, fontWeight:600, color:"#374151", textDecoration:"none" }}>
                  ✉ contact@talentmaroc.shop
                </a>
              </div>

              <p style={{ fontSize:12, color:"#9ca3af", textAlign:"center", marginTop:28 }}>
                Politique de confidentialité mise à jour le {LAST_UPDATED} · Elle remplace toutes les versions précédentes.
              </p>
            </div>

          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer style={{ background:"#0f172a", color:"rgba(255,255,255,.4)", textAlign:"center", padding:24, fontSize:13 }}>
          © 2026 Talent Maroc &nbsp;·&nbsp;
          <a href="/terms"   style={{ color:"rgba(255,255,255,.55)", textDecoration:"none" }}>CGU</a> &nbsp;·&nbsp;
          <a href="/privacy" style={{ color:"white", textDecoration:"none", fontWeight:600 }}>Confidentialité</a> &nbsp;·&nbsp;
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color:"rgba(255,255,255,.55)", textDecoration:"none" }}>Contact</a>
        </footer>

      </div>
    </>
  );
}