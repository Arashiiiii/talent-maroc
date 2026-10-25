// Long-form CV guides — each targets a search query Moroccan job seekers use
// and funnels readers to the CV builder (/cv). Content is French, fr-MA.

export interface GuideSection { h2: string; p: string[]; list?: string[] }
export interface CVGuide {
  slug:        string;
  title:       string;   // <title> (≤ 60 chars before the site suffix)
  description: string;   // meta description (≤ 155 chars)
  h1:          string;
  intro:       string;
  updated:     string;   // ISO date
  keywords:    string[];
  sections:    GuideSection[];
  faq:         { q: string; a: string }[];
  jobsLink?:   { label: string; href: string };
  template?:   string;   // recommended template name shown in the CTA
}

export const CV_GUIDES: CVGuide[] = [
  {
    slug: "modele-cv-maroc",
    title: "Modèle de CV Maroc 2026 : structure et exemples",
    description: "La structure de CV attendue par les recruteurs marocains en 2026 : rubriques, photo, langues, longueur. Modèles gratuits à remplir en ligne.",
    h1: "Modèle de CV au Maroc : la structure que les recruteurs attendent",
    intro: "Au Maroc, un recruteur passe en moyenne moins d'une minute sur un CV avant de décider. Un bon modèle ne sert pas à faire joli : il range l'information exactement là où l'œil la cherche. Voici la structure qui fonctionne en 2026, du Casablanca Finance City aux usines de Tanger Med.",
    updated: "2026-10-25",
    keywords: ["modèle cv maroc", "cv maroc 2026", "exemple cv maroc", "cv gratuit maroc"],
    template: "Corso",
    sections: [
      {
        h2: "Les rubriques indispensables, dans cet ordre",
        p: ["L'ordre compte autant que le contenu. Les recruteurs marocains, souvent formés à l'école française, s'attendent à une structure classique :"],
        list: [
          "En-tête : nom, titre du poste visé, téléphone (+212), e-mail professionnel, ville, lien LinkedIn.",
          "Profil : 2 à 3 phrases qui résument votre valeur pour CE poste.",
          "Expérience professionnelle : de la plus récente à la plus ancienne, avec des résultats chiffrés.",
          "Formation : diplôme, établissement (ENCG, ENSA, EMSI, OFPPT…), année.",
          "Compétences : techniques d'abord, puis outils et logiciels.",
          "Langues : arabe, français, anglais, avec un niveau honnête (A2 → C2 ou « courant »).",
        ],
      },
      {
        h2: "Photo, âge, situation familiale : que mettre ?",
        p: [
          "La photo reste très courante au Maroc et souvent appréciée, notamment pour les postes en contact client (centres d'appel, commerce, hôtellerie). Choisissez une photo professionnelle, fond neutre, tenue sobre.",
          "L'âge et la situation familiale ne sont pas obligatoires. Pour les multinationales et les postes à l'international, retirez-les : beaucoup de systèmes de tri (ATS) et de recruteurs étrangers préfèrent un CV sans données personnelles inutiles.",
        ],
      },
      {
        h2: "Une page ou deux ?",
        p: [
          "Une page pour un jeune diplômé ou moins de 5 ans d'expérience. Deux pages maximum au-delà. Au-delà de deux pages, les dernières lignes ne sont généralement pas lues.",
        ],
      },
      {
        h2: "Les erreurs qui éliminent un CV au Maroc",
        p: ["Elles reviennent dans presque tous les retours de recruteurs :"],
        list: [
          "Adresse e-mail fantaisiste (ex. « bogoss2000@… ») au lieu de prenom.nom@…",
          "Liste de tâches sans aucun résultat mesurable.",
          "Niveau de langue surestimé — il sera testé en entretien.",
          "Fautes d'orthographe en français : rédhibitoires pour les postes de relation client.",
          "CV envoyé en Word avec une mise en page qui se casse : envoyez toujours un PDF.",
        ],
      },
    ],
    faq: [
      { q: "Faut-il mettre une photo sur un CV au Maroc ?", a: "Ce n'est pas obligatoire mais c'est courant et souvent apprécié, surtout pour les postes en contact client. Utilisez une photo professionnelle sur fond neutre. Pour une candidature à l'international, le CV sans photo est préférable." },
      { q: "Quel format envoyer : Word ou PDF ?", a: "Le PDF. Il conserve la mise en page sur tous les ordinateurs et téléphones, et il est lu correctement par les logiciels de tri des candidatures." },
      { q: "Le CV doit-il être en français ou en arabe ?", a: "En français dans la grande majorité des cas au Maroc. Préparez une version anglaise pour les multinationales, l'offshoring et les postes au Golfe." },
    ],
    jobsLink: { label: "Voir les offres d'emploi au Maroc", href: "/" },
  },
  {
    slug: "cv-stage-pfe",
    title: "CV pour stage PFE : exemple et conseils (Maroc)",
    description: "Comment rédiger un CV de stage PFE qui décroche des entretiens au Maroc : projets académiques, compétences, mise en page. Modèle gratuit.",
    h1: "CV pour stage PFE : décrocher son stage de fin d'études au Maroc",
    intro: "Pour un stage PFE, le recruteur ne cherche pas de l'expérience : il cherche la preuve que vous pouvez apprendre vite et livrer un projet. Votre CV doit donc mettre en avant vos projets, pas seulement vos diplômes.",
    updated: "2026-10-25",
    keywords: ["cv stage pfe", "cv pfe maroc", "cv stage fin d'études", "exemple cv stagiaire"],
    template: "Meridian",
    sections: [
      {
        h2: "Placez vos projets avant vos stages d'été",
        p: [
          "Un projet académique bien décrit vaut souvent plus qu'un stage d'observation de deux semaines. Pour chaque projet, donnez : le contexte, votre rôle, les outils utilisés et le résultat.",
          "Exemple : « Application de gestion de stock en React et Supabase — équipe de 3, j'ai conçu la base de données et l'API ; démo présentée à 40 étudiants et 2 encadrants industriels. »",
        ],
      },
      {
        h2: "Le titre du CV : soyez précis",
        p: [
          "Remplacez « Étudiant en 5e année » par « Élève ingénieur en génie industriel — recherche stage PFE de 4 à 6 mois à partir de février 2027 ». Le recruteur sait immédiatement si vous correspondez à son calendrier.",
        ],
      },
      {
        h2: "Compétences : montrez ce que vous savez faire, pas ce que vous avez survolé",
        p: ["Listez seulement les outils que vous pouvez utiliser en entretien technique. Classez-les par catégorie :"],
        list: [
          "Langages / outils métier (Python, SQL, SAP, AutoCAD, Excel avancé…)",
          "Méthodes (Lean, Agile/Scrum, AMDEC…)",
          "Certifications (Coursera, Cisco, TOEIC…) avec l'année",
        ],
      },
      {
        h2: "Où envoyer votre CV de PFE",
        p: [
          "Les grands recruteurs de stagiaires PFE au Maroc sont les multinationales de l'offshoring, les banques, les cabinets de conseil, l'automobile à Tanger et Kénitra et les entreprises tech à Casablanca et Rabat. Postulez tôt : beaucoup de stages de février sont pourvus dès novembre.",
        ],
      },
    ],
    faq: [
      { q: "Quand faut-il postuler pour un stage PFE ?", a: "Idéalement 3 à 4 mois avant le début du stage. Pour un PFE qui commence en février, envoyez vos candidatures dès octobre-novembre." },
      { q: "Mon CV de PFE doit-il tenir sur une page ?", a: "Oui. Une page suffit pour un étudiant ; privilégiez les projets et compétences les plus pertinents pour l'offre." },
      { q: "Faut-il joindre une lettre de motivation ?", a: "Si l'offre la demande, oui. Sinon, un court message d'accompagnement dans l'e-mail ou le formulaire suffit souvent." },
    ],
    jobsLink: { label: "Voir les offres de stage PFE", href: "/?q=Stage" },
  },
  {
    slug: "cv-sans-experience",
    title: "CV sans expérience : exemple pour premier emploi",
    description: "Rédiger un CV quand on n'a pas d'expérience professionnelle : quoi mettre à la place, comment valoriser études, bénévolat et projets. Modèle gratuit.",
    h1: "CV sans expérience : comment le rendre convaincant",
    intro: "Ne pas avoir d'expérience ne veut pas dire ne rien avoir à montrer. Projets, bénévolat, jobs d'été, associations, formations en ligne : tout cela prouve des compétences, à condition de le présenter comme une expérience.",
    updated: "2026-10-25",
    keywords: ["cv sans expérience", "cv premier emploi", "cv débutant maroc", "cv jeune diplômé"],
    template: "Aria",
    sections: [
      {
        h2: "Remplacez la rubrique « Expérience » par « Projets et expériences »",
        p: [
          "Une seule rubrique qui regroupe stages, projets académiques, missions associatives et petits boulots. Chaque ligne suit le même format : ce que vous avez fait, avec quoi, et quel résultat.",
        ],
      },
      {
        h2: "Les expériences qui comptent (et que l'on oublie)",
        list: [
          "Job d'été en vente ou en restauration : relation client, gestion de la caisse, travail en équipe.",
          "Bénévolat ou associations étudiantes : organisation d'événements, gestion de budget, communication.",
          "Projets personnels : site web, page Instagram d'un commerce familial, petite boutique en ligne.",
          "Formations en ligne certifiantes : Google, Coursera, OFPPT, avec l'année.",
        ],
        p: [],
      },
      {
        h2: "Le profil : votre meilleure arme",
        p: [
          "Sans expérience, le paragraphe de profil fait la différence. Annoncez le poste visé, vos deux points forts les plus utiles et votre disponibilité. Exemple : « Diplômée en commerce international, trilingue arabe-français-anglais, disponible immédiatement pour un poste de conseillère clientèle à Casablanca. »",
        ],
      },
    ],
    faq: [
      { q: "Que mettre sur un CV quand on n'a jamais travaillé ?", a: "Vos projets académiques, stages, bénévolat, jobs d'été, compétences et langues, présentés avec des résultats concrets. Un paragraphe de profil ciblé sur le poste est essentiel." },
      { q: "Peut-on mentionner un emploi informel ou familial ?", a: "Oui, si vous le décrivez de façon professionnelle (missions, responsabilités, résultats). Aider dans un commerce familial montre la relation client et la fiabilité." },
    ],
    jobsLink: { label: "Voir les dernières offres", href: "/" },
  },
  {
    slug: "cv-centre-appel",
    title: "CV centre d'appel : exemple pour téléconseiller",
    description: "Exemple de CV pour centre d'appel au Maroc : compétences recherchées, niveau de langue, mise en avant de la relation client. Créez le vôtre gratuitement.",
    h1: "CV pour centre d'appel : le modèle qui passe les présélections",
    intro: "Les centres de relation client sont parmi les premiers recruteurs du Maroc, surtout à Casablanca, Rabat, Fès et Marrakech. Ils reçoivent énormément de candidatures : votre CV doit prouver en quelques secondes votre aisance en langue et votre orientation client.",
    updated: "2026-10-25",
    keywords: ["cv centre d'appel", "cv téléconseiller", "cv call center maroc", "cv conseiller client"],
    template: "Slate",
    sections: [
      {
        h2: "Mettez la langue tout en haut",
        p: [
          "Pour un poste francophone, écrivez dès le titre : « Téléconseiller — français courant (C1) ». Pour les campagnes en anglais, espagnol, allemand ou italien, précisez le niveau ; ces profils sont rares et mieux payés.",
        ],
      },
      {
        h2: "Les compétences que les recruteurs filtrent",
        list: [
          "Expérience en émission d'appels (télévente) ou en réception (service client, SAV).",
          "Indicateurs : nombre d'appels par jour, taux de transformation, note de satisfaction.",
          "Outils : CRM (Salesforce, Zendesk), logiciels de téléphonie, saisie rapide.",
          "Disponibilité : horaires décalés, week-ends, travail en shift.",
        ],
        p: [],
      },
      {
        h2: "Chiffrez vos résultats",
        p: [
          "« Réalisé 120 appels/jour avec un taux de vente de 8 % sur une campagne énergie » est bien plus convaincant que « Prospection téléphonique ». Si vous n'avez pas de chiffres exacts, donnez un ordre de grandeur réaliste.",
        ],
      },
    ],
    faq: [
      { q: "Faut-il de l'expérience pour travailler en centre d'appel ?", a: "Pas toujours. Beaucoup de centres recrutent des débutants avec un très bon niveau de langue et forment en interne. Mettez en avant votre aisance à l'oral et toute expérience de contact client." },
      { q: "Quel niveau de français est demandé ?", a: "En général un niveau courant (B2/C1) avec une bonne prononciation. L'entretien téléphonique sert justement à le vérifier." },
    ],
    jobsLink: { label: "Voir les offres en centre d'appel", href: "/?q=centre%20d%27appel" },
  },
  {
    slug: "cv-ats",
    title: "CV compatible ATS : passer les filtres automatiques",
    description: "Comment rendre votre CV lisible par les logiciels de recrutement (ATS) utilisés par les multinationales au Maroc : format, mots-clés, mise en page.",
    h1: "CV compatible ATS : passez les filtres avant d'être lu",
    intro: "Les multinationales, banques et grands groupes installés au Maroc trient souvent les candidatures avec un ATS (Applicant Tracking System). Si le logiciel lit mal votre CV, un humain ne le verra jamais. La bonne nouvelle : quelques règles simples suffisent.",
    updated: "2026-10-25",
    keywords: ["cv ats", "cv compatible ats", "logiciel tri cv", "cv multinationale maroc"],
    template: "Corso",
    sections: [
      {
        h2: "Ce qui bloque un ATS",
        list: [
          "Texte placé dans des images ou des zones de texte flottantes.",
          "Tableaux complexes et colonnes multiples mal codées.",
          "Titres de rubriques originaux (« Mon parcours ») au lieu des standards (« Expérience professionnelle »).",
          "Polices exotiques et icônes à la place des mots (un téléphone dessiné au lieu de « Téléphone »).",
        ],
        p: [],
      },
      {
        h2: "Reprenez les mots-clés de l'offre",
        p: [
          "L'ATS compare votre CV au texte de l'annonce. Si l'offre demande « gestion de projet », « SAP » et « reporting », ces termes exacts doivent apparaître dans votre CV — s'ils correspondent vraiment à votre expérience. Adaptez votre CV à chaque candidature importante.",
        ],
      },
      {
        h2: "Le bon format de fichier",
        p: [
          "Un PDF généré à partir de texte (pas un scan ni une photo) est lu par la quasi-totalité des ATS. Nommez le fichier clairement : « CV-Prenom-Nom-Poste.pdf ».",
        ],
      },
    ],
    faq: [
      { q: "Comment savoir si une entreprise utilise un ATS ?", a: "Si vous postulez via un formulaire en ligne sur le site carrières (Workday, Taleo, SmartRecruiters, Greenhouse…), c'est presque certain. Les grandes entreprises au Maroc en utilisent majoritairement." },
      { q: "Un CV avec deux colonnes passe-t-il les ATS ?", a: "Oui s'il est généré proprement en texte, ce qui est le cas des modèles Talent Maroc. Évitez en revanche les CV conçus comme des images." },
    ],
    jobsLink: { label: "Voir les offres en multinationale", href: "/" },
  },
  {
    slug: "cv-en-anglais",
    title: "CV en anglais : exemple et traduction des rubriques",
    description: "Rédiger un CV en anglais depuis le Maroc pour l'offshoring, le Golfe ou le Canada : rubriques, formulations, erreurs de traduction à éviter.",
    h1: "CV en anglais : réussir sa candidature internationale",
    intro: "Offshoring anglophone, postes au Golfe, immigration au Canada : un CV en anglais n'est pas une traduction mot à mot de votre CV français. Les conventions changent, et les recruteurs anglophones les remarquent immédiatement.",
    updated: "2026-10-25",
    keywords: ["cv en anglais", "resume anglais", "cv anglais maroc", "cv canada maroc"],
    template: "Vertex",
    sections: [
      {
        h2: "Les différences avec un CV français",
        list: [
          "Pas de photo, pas d'âge, pas de situation familiale (surtout pour le Canada, le Royaume-Uni et les États-Unis).",
          "Un « Professional Summary » au lieu d'un titre seul.",
          "Des verbes d'action au passé : « Led », « Built », « Reduced », « Increased ».",
          "Les diplômes expliqués : « Master's degree in Finance (Bac+5) » plutôt que « Master ENCG ».",
        ],
        p: [],
      },
      {
        h2: "Traduction des rubriques",
        list: [
          "Expérience professionnelle → Work Experience",
          "Formation → Education",
          "Compétences → Skills",
          "Langues → Languages (Arabic — native, French — fluent, English — professional)",
          "Centres d'intérêt → Interests (facultatif)",
        ],
        p: [],
      },
      {
        h2: "Évitez les faux-amis",
        p: [
          "« Licence » se traduit par « Bachelor's degree », pas « License ». « Stage » se traduit par « Internship ». « Formation » au sens de cours se dit « Training ».",
        ],
      },
    ],
    faq: [
      { q: "Faut-il une photo sur un CV en anglais ?", a: "Non pour les pays anglo-saxons (Canada, États-Unis, Royaume-Uni). Au Golfe, la photo est en revanche encore courante." },
      { q: "Peut-on simplement traduire son CV avec un outil ?", a: "C'est un point de départ, mais relisez et adaptez : les conventions et formulations diffèrent. Le générateur Talent Maroc rédige directement en anglais avec l'IA." },
    ],
    jobsLink: { label: "Voir les offres en anglais", href: "/?q=English" },
  },
  {
    slug: "cv-developpeur",
    title: "CV développeur : exemple pour les métiers tech",
    description: "CV de développeur web ou data au Maroc : stack technique, projets GitHub, résultats. Modèle gratuit compatible ATS pour les ESN et startups.",
    h1: "CV de développeur : ce que regardent les recruteurs tech",
    intro: "Les ESN, l'offshoring et les startups de Casablanca et Rabat recrutent beaucoup de développeurs. Les recruteurs tech lisent vite et cherchent trois choses : votre stack, ce que vous avez livré, et une preuve (GitHub, portfolio, produit en ligne).",
    updated: "2026-10-25",
    keywords: ["cv développeur", "cv développeur web", "cv informatique maroc", "cv data analyst"],
    template: "Helix",
    sections: [
      {
        h2: "La stack en haut, groupée",
        p: ["Juste sous le profil, une ligne par catégorie :"],
        list: [
          "Langages : TypeScript, Python, Java…",
          "Frameworks : React, Next.js, Spring Boot, Django…",
          "Données & cloud : PostgreSQL, MongoDB, AWS, Docker…",
        ],
      },
      {
        h2: "Décrivez des livraisons, pas des technologies",
        p: [
          "« Développé l'API de paiement (Node.js) utilisée par 30 000 utilisateurs ; temps de réponse divisé par 3 » montre un impact. « Développement backend Node.js » ne dit rien de plus que votre ligne de stack.",
        ],
      },
      {
        h2: "Liens indispensables",
        p: [
          "GitHub (avec des README propres), portfolio ou produit en ligne, LinkedIn. Un projet personnel déployé vaut souvent plus qu'une certification.",
        ],
      },
    ],
    faq: [
      { q: "Faut-il lister tous les langages que j'ai touchés ?", a: "Non. Listez ceux que vous maîtrisez assez pour un entretien technique. Une liste trop longue fait douter de la profondeur de vos compétences." },
      { q: "Un CV de développeur doit-il être en anglais ?", a: "Pour les ESN offshore et les startups internationales, une version anglaise est souvent demandée. Gardez aussi une version française pour les entreprises locales." },
    ],
    jobsLink: { label: "Voir les offres en informatique", href: "/?q=Informatique" },
  },
  {
    slug: "cv-commercial",
    title: "CV commercial : exemple pour vendeur et chargé d'affaires",
    description: "CV de commercial au Maroc : chiffre d'affaires, portefeuille clients, objectifs atteints. Exemple et modèle gratuit pour commercial terrain et B2B.",
    h1: "CV de commercial : vos chiffres parlent pour vous",
    intro: "Un recruteur commercial lit votre CV comme un tableau de bord. Il veut savoir ce que vous avez vendu, à qui, et si vous avez atteint vos objectifs. Sans chiffres, un CV de commercial est un CV faible.",
    updated: "2026-10-25",
    keywords: ["cv commercial", "cv chargé d'affaires", "cv vendeur maroc", "cv commercial terrain"],
    template: "Dahab",
    sections: [
      {
        h2: "Les chiffres à mettre en avant",
        list: [
          "Chiffre d'affaires réalisé (ou part de l'objectif atteint : « 112 % de l'objectif annuel »).",
          "Taille du portefeuille clients et nouveaux clients signés.",
          "Secteur et type de clientèle : B2B, B2C, grands comptes, distribution.",
          "Zone géographique couverte (Grand Casablanca, Nord, national…).",
        ],
        p: [],
      },
      {
        h2: "Adaptez le CV au type de vente",
        p: [
          "Commercial terrain, télévente, grands comptes ou vente en magasin ne demandent pas les mêmes qualités. Reprenez le vocabulaire de l'annonce : « prospection », « fidélisation », « négociation », « cycle de vente long »…",
        ],
      },
      {
        h2: "Permis et mobilité",
        p: [
          "Pour un poste terrain au Maroc, indiquez « Permis B — véhiculé » et votre mobilité géographique. C'est souvent un critère éliminatoire.",
        ],
      },
    ],
    faq: [
      { q: "Et si je n'ai pas accès à mes chiffres exacts ?", a: "Donnez un ordre de grandeur honnête ou un pourcentage d'objectif. L'important est de montrer que vous pilotez votre activité par les résultats." },
      { q: "Faut-il mentionner les clients que j'ai gérés ?", a: "Le secteur et la taille suffisent souvent. Ne citez des noms de clients que s'ils sont publics et que cela ne pose pas de problème de confidentialité." },
    ],
    jobsLink: { label: "Voir les offres commerciales", href: "/?q=Commercial" },
  },
];

export function getGuide(slug: string) {
  return CV_GUIDES.find(g => g.slug === slug);
}
