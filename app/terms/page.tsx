"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/terms/page.tsx
// Place at: app/terms/page.tsx  →  talentmaroc.shop/terms
// ─────────────────────────────────────────────────────────────────────────────

const LAST_UPDATED = "13 mars 2026";
const SITE_URL     = "https://talentmaroc.shop";
const CONTACT_EMAIL = "contact@talentmaroc.shop";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptation des conditions",
    content: `En accédant au site Talent Maroc (talentmaroc.shop) et en utilisant nos services, vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions dans leur intégralité, vous devez cesser d'utiliser notre site immédiatement.

Ces conditions s'appliquent à tous les visiteurs, utilisateurs et toute autre personne qui accède ou utilise le Service, y compris les candidats, les recruteurs et les entreprises.`,
  },
  {
    id: "services",
    title: "2. Description des services",
    content: `Talent Maroc est une plateforme de mise en relation entre candidats et employeurs au Maroc. Nos services comprennent :

• Publication et consultation d'offres d'emploi au Maroc
• Générateur de CV assisté par intelligence artificielle (IA)
• Espace recruteur pour la publication d'offres
• Outils de candidature en ligne

Le service de génération de CV par IA est un service payant. Le contenu généré est fourni à titre indicatif et ne constitue pas un conseil professionnel. Talent Maroc ne garantit pas l'obtention d'un emploi grâce à l'utilisation de ses services.`,
  },
  {
    id: "accounts",
    title: "3. Comptes utilisateurs",
    content: `Pour accéder à certaines fonctionnalités, vous devez créer un compte. Vous vous engagez à :

• Fournir des informations exactes, complètes et à jour lors de votre inscription
• Maintenir la confidentialité de vos identifiants de connexion
• Notifier immédiatement Talent Maroc de toute utilisation non autorisée de votre compte
• Ne pas partager votre compte avec des tiers

Vous êtes seul responsable de toutes les activités effectuées sous votre compte. Talent Maroc se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU.`,
  },
  {
    id: "payments",
    title: "4. Paiements et remboursements",
    content: `Le service de génération de CV par IA est proposé aux tarifs suivants :
• Starter : 1,99 € (paiement unique)
• Professionnel : 4,99 € (paiement unique)
• Cadre : 9,99 € (paiement unique)

Les paiements sont traités de manière sécurisée via Paddle (paddle.com), qui agit en tant que Merchant of Record. Paddle gère l'ensemble de la facturation, des taxes applicables et de la sécurité des transactions. Vos données bancaires ne transitent jamais directement par les serveurs de Talent Maroc.

Politique de remboursement : En raison de la nature numérique et immédiate du service (le CV est généré dès le paiement confirmé), les paiements ne sont pas remboursables sauf en cas de défaillance technique avérée de notre part. Pour toute demande, contactez-nous à ${CONTACT_EMAIL} dans les 48 heures suivant l'achat.`,
  },
  {
    id: "ia-content",
    title: "5. Contenu généré par l'IA",
    content: `Notre service de génération de CV utilise des modèles d'intelligence artificielle (Claude d'Anthropic). En utilisant ce service, vous acceptez que :

• Le contenu généré est basé sur les informations que vous fournissez. Vous êtes responsable de l'exactitude des données saisies.
• Talent Maroc ne garantit pas que le CV généré sera accepté par un employeur ou un système ATS particulier.
• Vous conservez l'entière propriété du contenu final de votre CV généré.
• Le contenu généré ne doit pas contenir d'informations fausses ou trompeuses. Toute utilisation frauduleuse est strictement interdite.
• Nous nous réservons le droit de refuser le service si le contenu fourni est contraire à la loi marocaine ou aux présentes CGU.`,
  },
  {
    id: "prohibited",
    title: "6. Utilisations interdites",
    content: `Il vous est strictement interdit d'utiliser Talent Maroc pour :

• Publier des offres d'emploi fictives, frauduleuses ou trompeuses
• Collecter des données personnelles d'autres utilisateurs sans leur consentement
• Utiliser des robots, scripts ou tout autre moyen automatisé pour accéder au site
• Tenter de contourner les mesures de sécurité du site
• Publier du contenu illégal, diffamatoire, obscène ou portant atteinte aux droits de tiers
• Usurper l'identité d'une personne ou d'une entreprise
• Violer toute loi ou réglementation applicable au Maroc ou dans votre pays de résidence
• Utiliser le service à des fins commerciales non autorisées, notamment pour de la revente

Toute violation peut entraîner la suspension immédiate de votre accès et des poursuites légales.`,
  },
  {
    id: "privacy",
    title: "7. Protection des données personnelles",
    content: `Talent Maroc s'engage à protéger vos données personnelles conformément à la loi marocaine n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel.

Les données que nous collectons incluent : nom, adresse email, numéro de téléphone, informations professionnelles et données de navigation.

Vos données sont utilisées pour : la fourniture de nos services, l'amélioration de la plateforme, les communications liées à votre compte et, avec votre consentement, les communications marketing.

Vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition au traitement de vos données. Pour exercer ces droits, contactez-nous à ${CONTACT_EMAIL}.

Nous ne vendons jamais vos données personnelles à des tiers. Certaines données peuvent être partagées avec nos prestataires de services (hébergement, paiement) dans le strict respect de la confidentialité.`,
  },
  {
    id: "intellectual-property",
    title: "8. Propriété intellectuelle",
    content: `Tout le contenu présent sur Talent Maroc — incluant le design, les logos, les textes, les graphiques et le code source — est la propriété exclusive de Talent Maroc ou de ses partenaires, et est protégé par les lois marocaines et internationales sur la propriété intellectuelle.

Il vous est accordé une licence limitée, non exclusive et non transférable pour accéder au site à des fins personnelles et non commerciales.

Vous n'êtes pas autorisé à reproduire, distribuer, modifier, créer des œuvres dérivées, afficher publiquement ou exploiter commercialement tout contenu du site sans autorisation écrite préalable de Talent Maroc.

Le contenu de votre CV généré par notre IA vous appartient intégralement dès son téléchargement.`,
  },
  {
    id: "liability",
    title: "9. Limitation de responsabilité",
    content: `Talent Maroc fournit ses services "en l'état" sans garantie d'aucune sorte, expresse ou implicite. Nous ne garantissons pas que :

• Le service sera disponible de manière ininterrompue ou sans erreur
• Les résultats obtenus via notre service répondront à vos attentes spécifiques
• Les offres d'emploi publiées par des tiers sont exactes ou toujours disponibles

Dans toute la mesure permise par la loi applicable, Talent Maroc ne pourra être tenu responsable des dommages indirects, accessoires, spéciaux ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser le service.

Notre responsabilité totale envers vous pour tout dommage ne pourra excéder le montant que vous avez payé pour le service au cours des trois (3) derniers mois.`,
  },
  {
    id: "third-party",
    title: "10. Liens et services tiers",
    content: `Notre site peut contenir des liens vers des sites ou services tiers (offres d'emploi externes, partenaires recruteurs, etc.). Ces liens sont fournis uniquement pour votre commodité.

Talent Maroc n'exerce aucun contrôle sur le contenu, les politiques de confidentialité ou les pratiques des sites tiers et n'assume aucune responsabilité à leur égard.

Les offres d'emploi affichées sur Talent Maroc peuvent provenir de sources tierces. Nous nous efforçons d'assurer leur qualité mais ne pouvons garantir l'exactitude ou la légitimité de toutes les offres. En cas d'offre suspecte, contactez-nous immédiatement.`,
  },
  {
    id: "modifications",
    title: "11. Modifications des conditions",
    content: `Talent Maroc se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur cette page.

Nous vous informerons de tout changement significatif par email ou via une notification visible sur le site. Votre utilisation continue du service après la publication des modifications constitue votre acceptation des nouvelles conditions.

Nous vous encourageons à consulter régulièrement cette page pour rester informé des éventuelles modifications.`,
  },
  {
    id: "termination",
    title: "12. Résiliation",
    content: `Vous pouvez mettre fin à votre utilisation de nos services à tout moment en supprimant votre compte depuis vos paramètres ou en nous contactant à ${CONTACT_EMAIL}.

Talent Maroc peut suspendre ou résilier votre accès sans préavis en cas de violation des présentes CGU, d'activité frauduleuse, ou si nous estimons que votre utilisation nuit à d'autres utilisateurs ou à la plateforme.

En cas de résiliation, les dispositions des présentes CGU qui, par leur nature, devraient survivre à la résiliation (propriété intellectuelle, limitation de responsabilité, etc.) resteront en vigueur.`,
  },
  {
    id: "law",
    title: "13. Droit applicable et juridiction",
    content: `Les présentes CGU sont régies et interprétées conformément au droit marocain, sans égard aux principes de conflit de lois.

Tout litige relatif à l'utilisation de Talent Maroc sera soumis à la compétence exclusive des tribunaux compétents de Tanger, Maroc, sauf disposition légale contraire.

Si une disposition des présentes CGU est jugée invalide ou inapplicable par un tribunal compétent, les autres dispositions restent pleinement en vigueur.`,
  },
  {
    id: "contact",
    title: "14. Nous contacter",
    content: `Pour toute question relative aux présentes Conditions Générales d'Utilisation, ou pour exercer vos droits relatifs à vos données personnelles, vous pouvez nous contacter :

• Email : ${CONTACT_EMAIL}
• Site web : ${SITE_URL}
• Adresse : Tanger, Maroc

Nous nous engageons à répondre à toute demande dans un délai de 5 jours ouvrables.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        html { scroll-behavior: smooth; }
        .toc-link { color: #1a56db; text-decoration: none; font-size: 13px; line-height: 1.8; display: block; }
        .toc-link:hover { text-decoration: underline; }
        .section-content p, .section-content { white-space: pre-line; }
        @media (max-width: 768px) {
          .layout { flex-direction: column !important; }
          .sidebar { display: none !important; }
          .content-area { padding: 24px 20px !important; }
          .hero-title { font-size: 28px !important; }
        }
      `}</style>

      <div style={{ fontFamily: "'Inter', sans-serif", background: "#f3f4f6", color: "#111827", minHeight: "100vh" }}>

        {/* ── NAVBAR ── */}
        <nav style={{ background: "#0f1d36", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <a href="https://talentmaroc.shop" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, background: "#1a56db", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "white" }}>T</div>
            <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>TalentMaroc</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <a href="https://talentmaroc.shop"           style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "6px 14px", borderRadius: 6 }}>Emplois</a>
            <a href="https://talentmaroc.shop/employers" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "6px 14px", borderRadius: 6 }}>Recruteurs</a>
            <a href="/cv"                                style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "6px 14px", borderRadius: 6 }}>Mon CV</a>
            <a href="https://talentmaroc.shop/auth/login" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "6px 14px", borderRadius: 6 }}>Connexion</a>
            <a href="https://talentmaroc.shop/employers"  style={{ background: "#1a56db", color: "white", textDecoration: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, marginLeft: 4 }}>Publier</a>
          </div>
        </nav>

        {/* ── HERO ── */}
        <div style={{ background: "#0f1d36", padding: "48px 24px 52px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 50% 120%, rgba(26,86,219,0.2) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 1140, margin: "0 auto", position: "relative" }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
              <a href="https://talentmaroc.shop" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Accueil</a>
              <span>›</span>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>Conditions Générales</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(26,86,219,0.2)", border: "1px solid rgba(26,86,219,0.3)", color: "#93c5fd", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 100, marginBottom: 16 }}>
              📄 Document légal
            </div>
            <h1 className="hero-title" style={{ fontSize: 40, fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: 12 }}>
              Conditions Générales<br />d'Utilisation
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginBottom: 0 }}>
              Dernière mise à jour : <strong style={{ color: "rgba(255,255,255,0.8)" }}>{LAST_UPDATED}</strong>
            </p>
          </div>
        </div>

        {/* ── INTRO BANNER ── */}
        <div style={{ background: "#eff6ff", borderBottom: "1px solid #dbeafe", padding: "16px 24px" }}>
          <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "#1d4ed8" }}>
            <span style={{ fontSize: 18 }}>ℹ️</span>
            <span>Veuillez lire attentivement ces conditions avant d'utiliser nos services. En vous inscrivant ou en effectuant un achat, vous acceptez d'être lié par ces termes.</span>
          </div>
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 24px 80px" }}>
          <div className="layout" style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>

            {/* SIDEBAR — Table of Contents */}
            <div className="sidebar" style={{ width: 260, flexShrink: 0, position: "sticky", top: 80 }}>
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6b7280", marginBottom: 14 }}>Sommaire</div>
                <nav>
                  {sections.map((s) => (
                    <a key={s.id} href={`#${s.id}`} className="toc-link">{s.title}</a>
                  ))}
                </nav>

                {/* Quick contact card */}
                <div style={{ marginTop: 24, padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#057a55", marginBottom: 6 }}>📬 Une question ?</div>
                  <a href={`mailto:${CONTACT_EMAIL}`} style={{ fontSize: 12, color: "#057a55", wordBreak: "break-all" }}>{CONTACT_EMAIL}</a>
                </div>
              </div>
            </div>

            {/* CONTENT */}
            <div className="content-area" style={{ flex: 1, minWidth: 0 }}>

              {/* Intro card */}
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "28px 32px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
                  Bienvenue sur <strong>Talent Maroc</strong> ({SITE_URL}). Les présentes Conditions Générales d'Utilisation régissent votre accès et votre utilisation de notre plateforme d'emploi et de nos services de génération de CV par intelligence artificielle. Nous vous invitons à les lire attentivement.
                </p>
              </div>

              {/* Sections */}
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  id={section.id}
                  style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "28px 32px", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,.06)", scrollMarginTop: 90 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, background: "#eff6ff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#1a56db", flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{section.title.replace(/^\d+\.\s/, "")}</h2>
                  </div>
                  <div style={{ height: 1, background: "#f3f4f6", marginBottom: 16 }} />
                  <div className="section-content" style={{ fontSize: 14, color: "#374151", lineHeight: 1.85, whiteSpace: "pre-line" }}>
                    {section.content}
                  </div>
                </div>
              ))}

              {/* Acceptance footer card */}
              <div style={{ background: "#0f1d36", borderRadius: 10, padding: "28px 32px", marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 6 }}>Vous avez des questions ?</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Notre équipe est disponible pour répondre à vos interrogations légales.</div>
                </div>
                <a href={`mailto:${CONTACT_EMAIL}`}
                  style={{ background: "#1a56db", color: "white", textDecoration: "none", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                  Nous contacter →
                </a>
              </div>

              {/* Last updated note */}
              <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 32 }}>
                Ces conditions ont été mises à jour le {LAST_UPDATED}. Elles remplacent toutes les versions précédentes.
              </p>
            </div>

          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer style={{ background: "#0f1d36", color: "rgba(255,255,255,0.45)", textAlign: "center", padding: 24, fontSize: 13 }}>
          © 2026 Talent Maroc &nbsp;·&nbsp;
          <a href="/terms"   style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontWeight: 600 }}>Conditions Générales</a> &nbsp;·&nbsp;
          <a href="/privacy" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>Politique de confidentialité</a> &nbsp;·&nbsp;
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>Contact</a>
        </footer>

      </div>
    </>
  );
}