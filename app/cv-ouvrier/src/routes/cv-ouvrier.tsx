import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Check, Star, X, Download, Pencil } from "lucide-react";

export const Route = createFileRoute("/cv-ouvrier")({
  component: CVOuvrierPage,
  validateSearch: (s: Record<string, unknown>) => ({
    success: typeof s.success === "string" ? s.success : undefined,
  }),
  head: () => ({
    meta: [
      { title: "CVs Prêts à l'Emploi · 29 DH · Talent Maroc" },
      {
        name: "description",
        content:
          "CV professionnel prêt en 2 minutes pour les métiers du Maroc — chauffeur, électricien, soudeur, agent de sécurité… 29 DH, téléchargement immédiat.",
      },
      { property: "og:title", content: "CVs Prêts à l'Emploi · 29 DH" },
      {
        property: "og:description",
        content:
          "Des modèles de CV prêts à l'emploi pour les ouvriers et employés au Maroc.",
      },
    ],
  }),
});

// ─────────────────────────── Types ───────────────────────────

type Sector =
  | "Transport"
  | "Industrie"
  | "Sécurité"
  | "BTP"
  | "Services"
  | "Hôtellerie"
  | "Agriculture"
  | "Logistique";

type TemplateId =
  | "corso"
  | "meridian"
  | "aria"
  | "dahab"
  | "medina"
  | "vertex"
  | "atlas"
  | "lumen"
  | "helix"
  | "slate";

interface CVData {
  profile: {
    firstName: string;
    lastName: string;
    title: string;
    email: string;
    phone: string;
    city: string;
  };
  summary: string;
  experience: Array<{
    id: string;
    role: string;
    company: string;
    city?: string;
    start: string;
    end?: string;
    bullets: string[];
  }>;
  education: Array<{ id: string; degree: string; school: string; start: string; end: string }>;
  skills: Array<{ id: string; group: string; items: string[] }>;
  languages: Array<{ id: string; name: string; level: string; dots: number }>;
  certifications: Array<{ id: string; name: string; issuer: string; year: string }>;
  projects: Array<{ id: string; name: string; role: string; detail: string }>;
  interests: string[];
}

interface Job {
  id: string;
  title: string;
  icon: string;
  sector: Sector;
  bullets: [string, string, string];
  suggestedTemplate: TemplateId;
  accentColor: string;
  prefilledCV: CVData;
}

// ─────────────────────────── Constants ───────────────────────────

const DODO_URL = "https://test.checkout.dodopayments.com/buy/pdt_0NeCdmQE5gOZo2WER3XE2";
const PRICE_DH = 29;

const CITIES = ["Casablanca", "Rabat", "Tanger", "Marrakech", "Agadir", "Fès", "Oujda", "Autre"];
const EXPERIENCES = [
  { v: "0-1", label: "Débutant (0-1 an)" },
  { v: "2-4", label: "Junior (2-4 ans)" },
  { v: "5-9", label: "Confirmé (5-9 ans)" },
  { v: "10+", label: "Expert (10+ ans)" },
];

const SECTORS: { id: Sector | "Tous"; label: string; icon: string }[] = [
  { id: "Tous", label: "Tous", icon: "✨" },
  { id: "Transport", label: "Transport", icon: "🚗" },
  { id: "Industrie", label: "Industrie", icon: "🔧" },
  { id: "Sécurité", label: "Sécurité", icon: "🛡" },
  { id: "BTP", label: "BTP", icon: "🏗" },
  { id: "Services", label: "Services", icon: "🛎" },
  { id: "Hôtellerie", label: "Hôtellerie", icon: "🏨" },
  { id: "Agriculture", label: "Agriculture", icon: "🌿" },
  { id: "Logistique", label: "Logistique", icon: "📦" },
];

const SECTOR_BADGE: Record<Sector, string> = {
  Transport: "bg-blue-50 text-blue-700 border-blue-200",
  Industrie: "bg-green-50 text-green-700 border-green-200",
  Sécurité: "bg-amber-50 text-amber-700 border-amber-200",
  BTP: "bg-red-50 text-red-700 border-red-200",
  Services: "bg-violet-50 text-violet-700 border-violet-200",
  Hôtellerie: "bg-orange-50 text-orange-700 border-orange-200",
  Agriculture: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Logistique: "bg-sky-50 text-sky-700 border-sky-200",
};

const TEMPLATE_OPTIONS: { id: TemplateId; name: string; accent: string }[] = [
  { id: "corso", name: "Corso", accent: "#7c3aed" },
  { id: "meridian", name: "Meridian", accent: "#0f766e" },
  { id: "aria", name: "Aria", accent: "#db2777" },
  { id: "dahab", name: "Dahab", accent: "#ca8a04" },
  { id: "medina", name: "Medina", accent: "#16a34a" },
  { id: "vertex", name: "Vertex", accent: "#1e40af" },
  { id: "atlas", name: "Atlas", accent: "#9a3412" },
  { id: "lumen", name: "Lumen", accent: "#0891b2" },
  { id: "helix", name: "Helix", accent: "#475569" },
  { id: "slate", name: "Slate", accent: "#0f172a" },
];

// ─────────────────────────── CV factory ───────────────────────────

function makeCV(opts: {
  title: string;
  city?: string;
  summary: string;
  expRole: string;
  expCompany: string;
  bullets: string[];
  degree: string;
  school: string;
  skillGroup: string;
  skills: string[];
  interests: string[];
  cert?: { name: string; issuer: string; year: string };
}): CVData {
  return {
    profile: {
      firstName: "Prénom",
      lastName: "Nom",
      title: opts.title,
      email: "email@example.com",
      phone: "+212 6XX XXX XXX",
      city: opts.city || "Casablanca",
    },
    summary: opts.summary,
    experience: [
      {
        id: "exp1",
        role: opts.expRole,
        company: opts.expCompany,
        city: opts.city || "Casablanca",
        start: "2020",
        end: "2024",
        bullets: opts.bullets,
      },
      {
        id: "exp2",
        role: opts.expRole,
        company: "Précédent employeur",
        city: opts.city || "Casablanca",
        start: "2017",
        end: "2020",
        bullets: opts.bullets.slice(0, 2),
      },
    ],
    education: [
      { id: "edu1", degree: opts.degree, school: opts.school, start: "2015", end: "2017" },
    ],
    skills: [{ id: "sk1", group: opts.skillGroup, items: opts.skills }],
    languages: [
      { id: "l1", name: "Arabe", level: "Natif", dots: 5 },
      { id: "l2", name: "Français", level: "Intermédiaire", dots: 3 },
    ],
    certifications: opts.cert
      ? [{ id: "c1", name: opts.cert.name, issuer: opts.cert.issuer, year: opts.cert.year }]
      : [],
    projects: [],
    interests: opts.interests,
  };
}

// ─────────────────────────── Jobs catalog (32) ───────────────────────────

const JOBS: Job[] = [
  // TRANSPORT
  {
    id: "chauffeur-camion",
    title: "Chauffeur de camion",
    icon: "🚚",
    sector: "Transport",
    bullets: [
      "Transport longue distance national",
      "Permis CE, gestion des documents de bord",
      "Respect des délais et de la sécurité routière",
    ],
    suggestedTemplate: "vertex",
    accentColor: "#1e40af",
    prefilledCV: makeCV({
      title: "Chauffeur de camion",
      summary:
        "Chauffeur poids lourd expérimenté, spécialisé dans le transport national de marchandises. Sérieux, ponctuel et respectueux des règles de sécurité routière.",
      expRole: "Chauffeur Poids Lourd",
      expCompany: "Société de Transport",
      bullets: [
        "Transport de marchandises sur tout le territoire marocain",
        "Respect des délais de livraison et de la réglementation routière",
        "Entretien préventif du véhicule et gestion des documents de bord",
      ],
      degree: "Permis de conduire catégorie CE",
      school: "Auto-école Professionnelle",
      skillGroup: "Conduite & Sécurité",
      skills: ["Permis CE", "GPS", "Code de la route", "Logistique"],
      interests: ["Sécurité routière", "Mécanique automobile"],
      cert: { name: "FIMO Marchandises", issuer: "Ministère du Transport", year: "2020" },
    }),
  },
  {
    id: "chauffeur-vtc",
    title: "Chauffeur VTC / Taxi",
    icon: "🚕",
    sector: "Transport",
    bullets: [
      "Connaissance parfaite des grandes villes",
      "Service client soigné et ponctuel",
      "Permis B + carte professionnelle",
    ],
    suggestedTemplate: "vertex",
    accentColor: "#1e40af",
    prefilledCV: makeCV({
      title: "Chauffeur VTC",
      summary:
        "Chauffeur VTC professionnel, ponctuel et courtois. Excellente connaissance des grandes villes et sens du service client.",
      expRole: "Chauffeur VTC / Taxi",
      expCompany: "Société de Transport Privé",
      bullets: [
        "Transport de clients dans le respect du confort et de la sécurité",
        "Maintien du véhicule propre et en parfait état de fonctionnement",
        "Gestion des courses via application mobile (Careem, InDrive)",
      ],
      degree: "Permis de conduire catégorie B",
      school: "Auto-école Casablanca",
      skillGroup: "Service client",
      skills: ["GPS", "Applications VTC", "Service client", "Anglais de base"],
      interests: ["Voyages", "Découverte des villes"],
    }),
  },
  {
    id: "livreur",
    title: "Livreur moto / vélo",
    icon: "🛵",
    sector: "Transport",
    bullets: [
      "Livraisons rapides en milieu urbain",
      "Maîtrise des applications de livraison",
      "Excellente connaissance du quartier",
    ],
    suggestedTemplate: "lumen",
    accentColor: "#0891b2",
    prefilledCV: makeCV({
      title: "Livreur moto",
      summary:
        "Livreur dynamique et fiable, habitué aux livraisons rapides en zone urbaine. Disponible et flexible.",
      expRole: "Livreur indépendant",
      expCompany: "Glovo / Jumia Food",
      bullets: [
        "Livraison de repas et colis dans les délais impartis",
        "Gestion des paiements en espèces et par carte",
        "Maintenance régulière du véhicule (moto/vélo)",
      ],
      degree: "Permis A1 (motocyclette)",
      school: "Auto-école",
      skillGroup: "Livraison",
      skills: ["Glovo", "Jumia Food", "GPS", "Gestion du temps"],
      interests: ["Cyclisme", "Sport"],
    }),
  },
  {
    id: "conducteur-engin",
    title: "Conducteur d'engin BTP",
    icon: "🚜",
    sector: "Transport",
    bullets: [
      "Conduite d'engins de chantier (pelle, bull)",
      "Respect strict des consignes de sécurité",
      "CACES catégories R482",
    ],
    suggestedTemplate: "atlas",
    accentColor: "#9a3412",
    prefilledCV: makeCV({
      title: "Conducteur d'engin BTP",
      summary:
        "Conducteur d'engins de chantier expérimenté, titulaire des CACES nécessaires. Précis et soucieux de la sécurité.",
      expRole: "Conducteur de pelle hydraulique",
      expCompany: "Entreprise de BTP",
      bullets: [
        "Conduite de pelles, bulldozers et chargeuses sur chantier",
        "Travaux de terrassement et de nivellement",
        "Vérification quotidienne et entretien des engins",
      ],
      degree: "CACES catégorie B1 (pelles)",
      school: "Centre de formation BTP",
      skillGroup: "Engins de chantier",
      skills: ["Pelle hydraulique", "Bulldozer", "Chargeuse", "Lecture de plans"],
      interests: ["Mécanique lourde"],
      cert: { name: "CACES R482", issuer: "OFPPT", year: "2019" },
    }),
  },
  {
    id: "grutier",
    title: "Grutier",
    icon: "🏗️",
    sector: "Transport",
    bullets: [
      "Manipulation de grues à tour et mobiles",
      "Coordination avec les équipes au sol",
      "Habilitation CACES R487",
    ],
    suggestedTemplate: "atlas",
    accentColor: "#9a3412",
    prefilledCV: makeCV({
      title: "Grutier",
      summary:
        "Grutier qualifié avec une grande expérience sur grands chantiers. Précis, attentif aux consignes de sécurité.",
      expRole: "Grutier",
      expCompany: "Entreprise de construction",
      bullets: [
        "Manipulation de grues à tour pour le levage de matériaux",
        "Communication permanente avec le chef de chantier",
        "Inspection quotidienne des câbles et systèmes hydrauliques",
      ],
      degree: "CACES R487 catégorie 1",
      school: "Centre de formation",
      skillGroup: "Levage",
      skills: ["Grue à tour", "Grue mobile", "Lecture de signaux", "Sécurité"],
      interests: ["Construction"],
    }),
  },

  // INDUSTRIE
  {
    id: "mecanicien-auto",
    title: "Mécanicien auto",
    icon: "🔧",
    sector: "Industrie",
    bullets: [
      "Diagnostic et réparation toutes marques",
      "Vidange, freins, distribution, embrayage",
      "Diagnostic électronique OBD",
    ],
    suggestedTemplate: "helix",
    accentColor: "#475569",
    prefilledCV: makeCV({
      title: "Mécanicien automobile",
      summary:
        "Mécanicien automobile polyvalent, capable d'intervenir sur tous types de véhicules. Rigoureux et passionné.",
      expRole: "Mécanicien Auto",
      expCompany: "Garage Auto",
      bullets: [
        "Diagnostic et réparation de moteurs essence et diesel",
        "Remplacement des pièces d'usure (freins, embrayage, distribution)",
        "Diagnostic électronique avec valise OBD",
      ],
      degree: "Diplôme de Technicien en Mécanique Automobile",
      school: "OFPPT",
      skillGroup: "Mécanique",
      skills: ["Moteur thermique", "Freinage", "Diagnostic OBD", "Embrayage"],
      interests: ["Tuning", "Course automobile"],
    }),
  },
  {
    id: "mecanicien-industriel",
    title: "Mécanicien industriel",
    icon: "⚙️",
    sector: "Industrie",
    bullets: [
      "Maintenance préventive et corrective",
      "Lecture de plans techniques",
      "Soudure et usinage de base",
    ],
    suggestedTemplate: "helix",
    accentColor: "#475569",
    prefilledCV: makeCV({
      title: "Mécanicien industriel",
      summary:
        "Mécanicien industriel rigoureux, expérimenté sur lignes de production. Esprit d'équipe et autonomie.",
      expRole: "Mécanicien de maintenance",
      expCompany: "Usine de production",
      bullets: [
        "Maintenance préventive et corrective des machines de production",
        "Diagnostic des pannes mécaniques et hydrauliques",
        "Réalisation de petits travaux de soudure et d'usinage",
      ],
      degree: "BTS Maintenance Industrielle",
      school: "OFPPT",
      skillGroup: "Maintenance",
      skills: ["Hydraulique", "Pneumatique", "Soudure", "Lecture de plans"],
      interests: ["Bricolage", "Automatisme"],
    }),
  },
  {
    id: "electricien",
    title: "Électricien",
    icon: "⚡",
    sector: "Industrie",
    bullets: [
      "Installation électrique résidentielle et industrielle",
      "Lecture de schémas, normes NF C 15-100",
      "Habilitation électrique B1V/B2V",
    ],
    suggestedTemplate: "helix",
    accentColor: "#475569",
    prefilledCV: makeCV({
      title: "Électricien",
      summary:
        "Électricien qualifié intervenant en résidentiel et industriel. Respect strict des normes de sécurité.",
      expRole: "Électricien",
      expCompany: "Entreprise d'électricité générale",
      bullets: [
        "Installation et raccordement d'équipements électriques",
        "Diagnostic et dépannage d'installations existantes",
        "Mise aux normes selon NF C 15-100",
      ],
      degree: "BTS Électrotechnique",
      school: "OFPPT",
      skillGroup: "Électricité",
      skills: ["Schémas", "Tableaux électriques", "Domotique", "Normes NF"],
      interests: ["Énergie solaire"],
      cert: { name: "Habilitation B1V/B2V", issuer: "Centre de formation", year: "2021" },
    }),
  },
  {
    id: "technicien-maintenance",
    title: "Technicien de maintenance",
    icon: "🛠️",
    sector: "Industrie",
    bullets: [
      "Maintenance multi-technique (méca, élec, hydra)",
      "Suivi GMAO et reporting",
      "Astreinte et interventions urgentes",
    ],
    suggestedTemplate: "helix",
    accentColor: "#475569",
    prefilledCV: makeCV({
      title: "Technicien de maintenance",
      summary:
        "Technicien polyvalent, à l'aise en mécanique, électricité et hydraulique. Réactif et autonome.",
      expRole: "Technicien de maintenance",
      expCompany: "Site industriel",
      bullets: [
        "Diagnostic multi-technique des pannes",
        "Mise à jour des fiches GMAO après chaque intervention",
        "Participation à la maintenance préventive planifiée",
      ],
      degree: "BTS Maintenance des Systèmes",
      school: "OFPPT",
      skillGroup: "Multi-technique",
      skills: ["GMAO", "Hydraulique", "Électricité", "Reporting"],
      interests: ["Nouvelles technologies"],
    }),
  },
  {
    id: "soudeur",
    title: "Soudeur",
    icon: "🔥",
    sector: "Industrie",
    bullets: [
      "Soudure MIG/MAG, TIG et à l'arc",
      "Lecture de plans et tracés",
      "Respect strict des EPI",
    ],
    suggestedTemplate: "atlas",
    accentColor: "#9a3412",
    prefilledCV: makeCV({
      title: "Soudeur qualifié",
      summary:
        "Soudeur qualifié maîtrisant les procédés MIG/MAG, TIG et à l'arc. Précision, sécurité et qualité.",
      expRole: "Soudeur",
      expCompany: "Atelier de chaudronnerie",
      bullets: [
        "Soudure MIG/MAG sur acier et inox",
        "Soudure TIG fine sur pièces de précision",
        "Contrôle visuel des cordons et reprises éventuelles",
      ],
      degree: "Qualification soudeur (DMOS/QMOS)",
      school: "Centre de formation",
      skillGroup: "Soudure",
      skills: ["MIG/MAG", "TIG", "Arc", "Lecture de plans"],
      interests: ["Métallerie d'art"],
    }),
  },
  {
    id: "operateur-prod",
    title: "Opérateur de production",
    icon: "🏭",
    sector: "Industrie",
    bullets: [
      "Travail sur ligne de production en 3x8",
      "Contrôle qualité visuel",
      "Respect des cadences et procédures",
    ],
    suggestedTemplate: "helix",
    accentColor: "#475569",
    prefilledCV: makeCV({
      title: "Opérateur de production",
      summary:
        "Opérateur fiable et rigoureux, habitué au travail en équipes alternantes. Soucieux de la qualité.",
      expRole: "Opérateur de production",
      expCompany: "Usine agroalimentaire",
      bullets: [
        "Conduite de ligne de conditionnement",
        "Contrôle qualité visuel des produits",
        "Renseignement des fiches de production",
      ],
      degree: "Bac Pro / Qualification professionnelle",
      school: "OFPPT",
      skillGroup: "Production",
      skills: ["Ligne automatisée", "Qualité", "5S", "Travail en équipe"],
      interests: ["Sport collectif"],
    }),
  },
  {
    id: "operateur-cnc",
    title: "Opérateur CNC",
    icon: "🤖",
    sector: "Industrie",
    bullets: [
      "Programmation et conduite de machines CNC",
      "Lecture de plans et contrôle dimensionnel",
      "Maîtrise FANUC / SIEMENS",
    ],
    suggestedTemplate: "helix",
    accentColor: "#475569",
    prefilledCV: makeCV({
      title: "Opérateur sur machine CNC",
      summary:
        "Opérateur CNC précis, formé aux commandes FANUC et SIEMENS. Souci permanent de la qualité.",
      expRole: "Opérateur CNC",
      expCompany: "Atelier d'usinage",
      bullets: [
        "Programmation et conduite de tours et fraiseuses CNC",
        "Lecture de plans techniques et contrôle au pied à coulisse",
        "Maintenance de premier niveau des machines",
      ],
      degree: "BTS Productique Mécanique",
      school: "OFPPT",
      skillGroup: "Usinage",
      skills: ["FANUC", "SIEMENS", "Tour CNC", "Fraiseuse CNC"],
      interests: ["CAO/DAO"],
    }),
  },
  {
    id: "operateur-tri",
    title: "Opérateur tri / recyclage",
    icon: "♻️",
    sector: "Industrie",
    bullets: [
      "Tri manuel et mécanisé des déchets",
      "Respect des consignes de sécurité et d'hygiène",
      "Travail en environnement bruyant",
    ],
    suggestedTemplate: "helix",
    accentColor: "#475569",
    prefilledCV: makeCV({
      title: "Opérateur de tri / recyclage",
      summary:
        "Opérateur de tri rigoureux, soucieux du respect des consignes d'hygiène et sécurité.",
      expRole: "Opérateur de tri",
      expCompany: "Centre de tri",
      bullets: [
        "Tri sélectif des matières recyclables sur tapis",
        "Conditionnement et étiquetage des balles de matières",
        "Application stricte des règles HSE",
      ],
      degree: "Niveau Bac",
      school: "Lycée",
      skillGroup: "Tri & Recyclage",
      skills: ["Tri manuel", "Conditionnement", "HSE", "Travail en équipe"],
      interests: ["Écologie"],
    }),
  },

  // SÉCURITÉ
  {
    id: "agent-securite",
    title: "Agent de sécurité",
    icon: "🛡️",
    sector: "Sécurité",
    bullets: [
      "Surveillance de sites et contrôle d'accès",
      "Carte professionnelle CNAPS / autorisation",
      "Gestion des situations conflictuelles",
    ],
    suggestedTemplate: "vertex",
    accentColor: "#1e40af",
    prefilledCV: makeCV({
      title: "Agent de sécurité",
      summary:
        "Agent de sécurité professionnel, vigilant et discret. Excellente présentation et sens du contact.",
      expRole: "Agent de sécurité",
      expCompany: "Société de gardiennage",
      bullets: [
        "Surveillance de centres commerciaux et sites industriels",
        "Contrôle d'accès et vérification des badges",
        "Rédaction de rapports d'incidents",
      ],
      degree: "CQP Agent de Prévention et de Sécurité",
      school: "Centre de formation agréé",
      skillGroup: "Sécurité",
      skills: ["Contrôle d'accès", "Vidéosurveillance", "SST", "Rapport d'incident"],
      interests: ["Sport de combat"],
      cert: { name: "Carte professionnelle", issuer: "DGSN", year: "2022" },
    }),
  },
  {
    id: "gardien-immeuble",
    title: "Gardien d'immeuble",
    icon: "🏢",
    sector: "Sécurité",
    bullets: [
      "Surveillance de la résidence et des accès",
      "Petit entretien et propreté des parties communes",
      "Relations courtoises avec les résidents",
    ],
    suggestedTemplate: "slate",
    accentColor: "#0f172a",
    prefilledCV: makeCV({
      title: "Gardien d'immeuble",
      summary:
        "Gardien d'immeuble sérieux et discret, attentif au bien-être des résidents et à la propreté des lieux.",
      expRole: "Gardien d'immeuble",
      expCompany: "Résidence privée",
      bullets: [
        "Surveillance des accès et rondes régulières",
        "Petit entretien et nettoyage des parties communes",
        "Réception des colis et gestion des relations résidents",
      ],
      degree: "CAP Gardien d'immeuble",
      school: "Centre de formation",
      skillGroup: "Gardiennage",
      skills: ["Surveillance", "Entretien", "Petit bricolage", "Relationnel"],
      interests: ["Jardinage"],
    }),
  },

  // BTP
  {
    id: "macon",
    title: "Maçon",
    icon: "🧱",
    sector: "BTP",
    bullets: [
      "Construction de murs et fondations",
      "Coffrage, ferraillage, coulage béton",
      "Lecture de plans simples",
    ],
    suggestedTemplate: "atlas",
    accentColor: "#9a3412",
    prefilledCV: makeCV({
      title: "Maçon",
      summary:
        "Maçon qualifié, expérimenté en construction neuve et rénovation. Travail soigné et respect des délais.",
      expRole: "Maçon",
      expCompany: "Entreprise de bâtiment",
      bullets: [
        "Réalisation de fondations, murs et dalles béton",
        "Coffrage, ferraillage et coulage du béton",
        "Lecture de plans et implantation des ouvrages",
      ],
      degree: "CAP Maçon",
      school: "OFPPT",
      skillGroup: "Maçonnerie",
      skills: ["Béton", "Coffrage", "Parpaings", "Lecture de plans"],
      interests: ["Architecture traditionnelle"],
    }),
  },
  {
    id: "carreleur",
    title: "Carreleur",
    icon: "🔲",
    sector: "BTP",
    bullets: [
      "Pose de carrelage sol et mur",
      "Préparation des supports, joints",
      "Travail soigné et précis",
    ],
    suggestedTemplate: "atlas",
    accentColor: "#9a3412",
    prefilledCV: makeCV({
      title: "Carreleur",
      summary:
        "Carreleur précis et minutieux, spécialisé dans la pose de carrelage et faïence haut de gamme.",
      expRole: "Carreleur",
      expCompany: "Entreprise de second œuvre",
      bullets: [
        "Préparation des supports (ragréage, primaire)",
        "Pose de carrelage sol et mur, faïences murales",
        "Réalisation des joints et finitions",
      ],
      degree: "CAP Carreleur Mosaïste",
      school: "OFPPT",
      skillGroup: "Carrelage",
      skills: ["Pose droite/diagonale", "Faïence", "Ragréage", "Joints"],
      interests: ["Décoration"],
    }),
  },
  {
    id: "peintre",
    title: "Peintre en bâtiment",
    icon: "🎨",
    sector: "BTP",
    bullets: [
      "Préparation des supports et peinture",
      "Travaux intérieurs et extérieurs",
      "Pose de papier peint et enduits décoratifs",
    ],
    suggestedTemplate: "atlas",
    accentColor: "#9a3412",
    prefilledCV: makeCV({
      title: "Peintre en bâtiment",
      summary:
        "Peintre en bâtiment soigneux, à l'aise sur tous types de chantiers, du résidentiel au tertiaire.",
      expRole: "Peintre en bâtiment",
      expCompany: "Entreprise de peinture",
      bullets: [
        "Préparation des surfaces (ponçage, enduit, sous-couche)",
        "Application de peinture intérieure et extérieure",
        "Pose de revêtements muraux et enduits décoratifs",
      ],
      degree: "CAP Peintre Applicateur de Revêtements",
      school: "OFPPT",
      skillGroup: "Peinture",
      skills: ["Enduits", "Peinture acrylique/glycéro", "Papier peint", "Façades"],
      interests: ["Peinture artistique"],
    }),
  },
  {
    id: "plombier",
    title: "Plombier",
    icon: "🚰",
    sector: "BTP",
    bullets: [
      "Installation et dépannage sanitaire",
      "Soudure cuivre et raccords PER",
      "Recherche de fuites",
    ],
    suggestedTemplate: "atlas",
    accentColor: "#9a3412",
    prefilledCV: makeCV({
      title: "Plombier",
      summary:
        "Plombier expérimenté, intervenant en installation neuve et dépannage. Disponible et fiable.",
      expRole: "Plombier",
      expCompany: "Entreprise de plomberie",
      bullets: [
        "Installation complète de salles de bains et cuisines",
        "Dépannage de fuites et changement de robinetterie",
        "Soudure cuivre et raccordement PER/multicouche",
      ],
      degree: "CAP Installateur Sanitaire",
      school: "OFPPT",
      skillGroup: "Plomberie",
      skills: ["Cuivre", "PER", "Sanitaire", "Recherche de fuites"],
      interests: ["Bricolage"],
    }),
  },

  // LOGISTIQUE
  {
    id: "magasinier",
    title: "Magasinier / Cariste",
    icon: "📦",
    sector: "Logistique",
    bullets: [
      "Réception, stockage et expédition",
      "Conduite de chariots élévateurs (CACES 1/3/5)",
      "Inventaires et gestion ERP",
    ],
    suggestedTemplate: "vertex",
    accentColor: "#1e40af",
    prefilledCV: makeCV({
      title: "Magasinier Cariste",
      summary:
        "Magasinier-cariste rigoureux, titulaire des CACES 1, 3 et 5. Habitué aux outils ERP.",
      expRole: "Magasinier Cariste",
      expCompany: "Plateforme logistique",
      bullets: [
        "Réception et contrôle des marchandises entrantes",
        "Préparation et expédition des commandes clients",
        "Conduite quotidienne de chariots élévateurs",
      ],
      degree: "Titre Pro Cariste d'Entrepôt",
      school: "OFPPT",
      skillGroup: "Logistique",
      skills: ["CACES 1/3/5", "ERP SAP", "Inventaire", "Picking"],
      interests: ["Football"],
      cert: { name: "CACES R489 cat. 1, 3, 5", issuer: "Centre agréé", year: "2022" },
    }),
  },
  {
    id: "preparateur-cmd",
    title: "Préparateur de commandes",
    icon: "📋",
    sector: "Logistique",
    bullets: [
      "Picking via scan / vocal",
      "Emballage et étiquetage",
      "Respect des cadences",
    ],
    suggestedTemplate: "vertex",
    accentColor: "#1e40af",
    prefilledCV: makeCV({
      title: "Préparateur de commandes",
      summary:
        "Préparateur de commandes rapide et précis, à l'aise avec les outils de picking vocal.",
      expRole: "Préparateur de commandes",
      expCompany: "Entrepôt e-commerce",
      bullets: [
        "Préparation de commandes via scanner et vocale",
        "Emballage soigné et étiquetage des colis",
        "Respect des objectifs de productivité quotidiens",
      ],
      degree: "Niveau Bac",
      school: "Lycée",
      skillGroup: "Préparation",
      skills: ["Scanner", "Vocale", "Emballage", "Cadences"],
      interests: ["Course à pied"],
    }),
  },
  {
    id: "facteur",
    title: "Facteur / Agent postal",
    icon: "📮",
    sector: "Logistique",
    bullets: [
      "Tri et distribution du courrier",
      "Excellente connaissance du secteur",
      "Permis B exigé",
    ],
    suggestedTemplate: "slate",
    accentColor: "#0f172a",
    prefilledCV: makeCV({
      title: "Facteur",
      summary:
        "Facteur consciencieux, habitué à la distribution en milieu urbain et rural. Ponctuel et fiable.",
      expRole: "Facteur",
      expCompany: "Service postal",
      bullets: [
        "Tri du courrier en début de tournée",
        "Distribution du courrier et colis aux particuliers et entreprises",
        "Encaissement de petits envois recommandés",
      ],
      degree: "Niveau Bac",
      school: "Lycée",
      skillGroup: "Distribution",
      skills: ["Tri", "Lecture d'adresses", "Conduite", "Relationnel"],
      interests: ["Marche", "Vélo"],
    }),
  },

  // SERVICES
  {
    id: "tech-surface",
    title: "Technicien de surface",
    icon: "🧹",
    sector: "Services",
    bullets: [
      "Nettoyage de bureaux et espaces communs",
      "Utilisation des produits selon protocoles",
      "Discrétion et fiabilité",
    ],
    suggestedTemplate: "lumen",
    accentColor: "#0891b2",
    prefilledCV: makeCV({
      title: "Technicien de surface",
      summary:
        "Agent d'entretien rigoureux, respectueux des protocoles d'hygiène et discret en milieu professionnel.",
      expRole: "Agent d'entretien",
      expCompany: "Société de nettoyage",
      bullets: [
        "Nettoyage quotidien de bureaux et espaces communs",
        "Utilisation correcte des produits selon les protocoles",
        "Gestion des stocks de produits d'entretien",
      ],
      degree: "Formation hygiène & propreté",
      school: "Centre de formation",
      skillGroup: "Nettoyage",
      skills: ["Protocoles HACCP", "Auto-laveuse", "Vitrerie", "Désinfection"],
      interests: ["Cuisine"],
    }),
  },
  {
    id: "aide-domicile",
    title: "Aide à domicile",
    icon: "🏠",
    sector: "Services",
    bullets: [
      "Aide aux personnes âgées et dépendantes",
      "Ménage, courses, préparation des repas",
      "Bienveillance et patience",
    ],
    suggestedTemplate: "lumen",
    accentColor: "#0891b2",
    prefilledCV: makeCV({
      title: "Aide à domicile",
      summary:
        "Aide à domicile bienveillante, expérimentée auprès des personnes âgées. Patience et écoute.",
      expRole: "Auxiliaire de vie",
      expCompany: "Service à la personne",
      bullets: [
        "Aide à la toilette et à l'habillage des personnes âgées",
        "Préparation de repas adaptés et accompagnement",
        "Entretien du domicile et des courses courantes",
      ],
      degree: "DEAES (Accompagnant Éducatif et Social)",
      school: "Centre de formation sanitaire et sociale",
      skillGroup: "Aide à la personne",
      skills: ["Toilette", "Préparation de repas", "Écoute", "Gestes d'urgence"],
      interests: ["Lecture", "Cuisine traditionnelle"],
    }),
  },
  {
    id: "call-center",
    title: "Agent de call center",
    icon: "🎧",
    sector: "Services",
    bullets: [
      "Réception et émission d'appels",
      "Maîtrise du français (et arabe)",
      "Outils CRM et scripts de vente",
    ],
    suggestedTemplate: "corso",
    accentColor: "#7c3aed",
    prefilledCV: makeCV({
      title: "Agent de call center",
      summary:
        "Téléconseiller expérimenté en relation client B2C. Excellente élocution et sens commercial.",
      expRole: "Téléconseiller",
      expCompany: "Centre d'appels",
      bullets: [
        "Réception des appels entrants et traitement des demandes clients",
        "Émission d'appels sortants pour campagnes de vente",
        "Saisie et mise à jour des fiches clients sur CRM",
      ],
      degree: "Bac + 2 (équivalent BTS)",
      school: "Université",
      skillGroup: "Relation client",
      skills: ["Téléphonie", "CRM", "Vente", "Français courant"],
      interests: ["Cinéma"],
    }),
  },
  {
    id: "caissier",
    title: "Caissier(ère)",
    icon: "💳",
    sector: "Services",
    bullets: [
      "Encaissement et tenue de caisse",
      "Accueil client et fidélisation",
      "Connaissance des moyens de paiement",
    ],
    suggestedTemplate: "lumen",
    accentColor: "#0891b2",
    prefilledCV: makeCV({
      title: "Caissier(ère)",
      summary:
        "Caissier(ère) souriant(e) et rigoureux(se), à l'aise avec tous les moyens de paiement.",
      expRole: "Hôte(sse) de caisse",
      expCompany: "Grande surface",
      bullets: [
        "Encaissement des achats clients (espèces, CB, chèque)",
        "Accueil et orientation des clients en magasin",
        "Comptage de caisse et remise en banque",
      ],
      degree: "Bac Pro Commerce",
      school: "Lycée Professionnel",
      skillGroup: "Caisse",
      skills: ["TPE", "Espèces", "Accueil", "Fidélisation"],
      interests: ["Mode"],
    }),
  },
  {
    id: "vendeur-magasin",
    title: "Vendeur(se) en magasin",
    icon: "🛍️",
    sector: "Services",
    bullets: [
      "Conseil client et vente",
      "Mise en rayon et merchandising",
      "Atteinte des objectifs commerciaux",
    ],
    suggestedTemplate: "corso",
    accentColor: "#7c3aed",
    prefilledCV: makeCV({
      title: "Vendeur(se) en magasin",
      summary:
        "Vendeur dynamique et à l'écoute, capable d'identifier les besoins clients pour proposer les bons produits.",
      expRole: "Vendeur(se)",
      expCompany: "Boutique de prêt-à-porter",
      bullets: [
        "Accueil et conseil personnalisé des clients",
        "Mise en valeur des produits et merchandising",
        "Suivi des stocks et inventaires mensuels",
      ],
      degree: "Bac Pro Commerce",
      school: "Lycée Professionnel",
      skillGroup: "Vente",
      skills: ["Conseil", "Merchandising", "Encaissement", "Fidélisation"],
      interests: ["Mode", "Tendances"],
    }),
  },

  // HÔTELLERIE
  {
    id: "femme-chambre",
    title: "Femme de chambre / Valet",
    icon: "🛏️",
    sector: "Hôtellerie",
    bullets: [
      "Nettoyage des chambres selon les standards hôteliers",
      "Discrétion et présentation soignée",
      "Respect du linge et des produits d'accueil",
    ],
    suggestedTemplate: "corso",
    accentColor: "#7c3aed",
    prefilledCV: makeCV({
      title: "Femme de chambre",
      summary:
        "Femme de chambre expérimentée en hôtellerie 4-5*, soigneuse et respectueuse des standards.",
      expRole: "Femme de chambre",
      expCompany: "Hôtel 4* à Marrakech",
      bullets: [
        "Nettoyage et mise en état des chambres selon les standards",
        "Réapprovisionnement du linge et des produits d'accueil",
        "Signalement de tout problème technique à la maintenance",
      ],
      degree: "Formation Hôtellerie",
      school: "Institut Spécialisé Hôtelier",
      skillGroup: "Hôtellerie",
      skills: ["Standards 4/5*", "Linge", "Discrétion", "Rapidité"],
      interests: ["Voyage", "Décoration"],
    }),
  },
  {
    id: "serveur",
    title: "Serveur de restaurant",
    icon: "🍽️",
    sector: "Hôtellerie",
    bullets: [
      "Service en salle et conseil clients",
      "Prise de commandes et encaissement",
      "Maîtrise des règles d'hygiène",
    ],
    suggestedTemplate: "corso",
    accentColor: "#7c3aed",
    prefilledCV: makeCV({
      title: "Serveur de restaurant",
      summary:
        "Serveur dynamique et souriant, expérimenté en restauration traditionnelle et brasserie.",
      expRole: "Serveur",
      expCompany: "Restaurant traditionnel",
      bullets: [
        "Accueil et placement des clients en salle",
        "Prise de commandes et service à l'assiette",
        "Encaissement et clôture de caisse en fin de service",
      ],
      degree: "CAP Restaurant",
      school: "ISTAH",
      skillGroup: "Service",
      skills: ["Service à l'assiette", "Plateau", "HACCP", "Anglais service"],
      interests: ["Œnologie", "Cuisine"],
    }),
  },
  {
    id: "cuisinier",
    title: "Cuisinier / Chef de partie",
    icon: "👨‍🍳",
    sector: "Hôtellerie",
    bullets: [
      "Préparation des plats selon les fiches techniques",
      "Respect strict des normes HACCP",
      "Cuisine marocaine et internationale",
    ],
    suggestedTemplate: "dahab",
    accentColor: "#ca8a04",
    prefilledCV: makeCV({
      title: "Cuisinier / Chef de partie",
      summary:
        "Cuisinier passionné, formé en cuisine marocaine traditionnelle et cuisine internationale.",
      expRole: "Chef de partie",
      expCompany: "Hôtel-restaurant",
      bullets: [
        "Préparation des plats selon les fiches techniques",
        "Gestion d'une partie (entrées, viandes ou poissons)",
        "Respect strict des normes HACCP et de la traçabilité",
      ],
      degree: "CAP Cuisine",
      school: "ISTAH",
      skillGroup: "Cuisine",
      skills: ["Cuisine marocaine", "Cuisine française", "HACCP", "Pâtisserie"],
      interests: ["Cuisine du monde", "Pâtisserie marocaine"],
    }),
  },

  // AGRICULTURE
  {
    id: "ouvrier-agricole",
    title: "Ouvrier agricole",
    icon: "🌾",
    sector: "Agriculture",
    bullets: [
      "Travaux des champs (plantation, récolte)",
      "Entretien des cultures et irrigation",
      "Conduite de tracteur",
    ],
    suggestedTemplate: "medina",
    accentColor: "#16a34a",
    prefilledCV: makeCV({
      title: "Ouvrier agricole",
      summary:
        "Ouvrier agricole polyvalent, habitué aux travaux des champs et à la conduite de tracteur.",
      expRole: "Ouvrier agricole",
      expCompany: "Exploitation agricole",
      bullets: [
        "Plantation, entretien et récolte des cultures saisonnières",
        "Mise en place et surveillance du système d'irrigation goutte-à-goutte",
        "Conduite de tracteur pour les travaux du sol",
      ],
      degree: "Formation agricole",
      school: "Institut Agricole",
      skillGroup: "Agriculture",
      skills: ["Tracteur", "Irrigation", "Récolte", "Phytosanitaire"],
      interests: ["Agriculture biologique"],
    }),
  },
  {
    id: "cueilleur",
    title: "Cueilleur saisonnier",
    icon: "🍓",
    sector: "Agriculture",
    bullets: [
      "Cueillette de fruits et légumes",
      "Tri et conditionnement sur place",
      "Travail en équipe en plein air",
    ],
    suggestedTemplate: "medina",
    accentColor: "#16a34a",
    prefilledCV: makeCV({
      title: "Cueilleur saisonnier",
      summary:
        "Cueilleur saisonnier rapide et soigneux, disponible pour les campagnes de récolte.",
      expRole: "Cueilleur",
      expCompany: "Exploitation maraîchère",
      bullets: [
        "Cueillette de fraises, tomates et agrumes selon la saison",
        "Tri et conditionnement direct dans les caisses",
        "Respect des consignes du chef d'équipe et des cadences",
      ],
      degree: "Niveau collège",
      school: "Collège",
      skillGroup: "Cueillette",
      skills: ["Rapidité", "Tri", "Endurance", "Travail en équipe"],
      interests: ["Nature", "Plein air"],
    }),
  },
];

// ─────────────────────────── Page ───────────────────────────

function CVOuvrierPage() {
  const { success } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [activeSector, setActiveSector] = useState<Sector | "Tous">("Tous");
  const [openJob, setOpenJob] = useState<Job | null>(null);
  const [showSuccess, setShowSuccess] = useState(!!success);

  useEffect(() => {
    setShowSuccess(!!success);
  }, [success]);

  const filteredJobs = useMemo(() => {
    return JOBS.filter((j) => {
      if (activeSector !== "Tous" && j.sector !== activeSector) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return j.title.toLowerCase().includes(q) || j.sector.toLowerCase().includes(q);
      }
      return true;
    });
  }, [query, activeSector]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      {showSuccess && success && <SuccessBanner cvId={success} onClose={() => setShowSuccess(false)} />}

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-slate-900 to-violet-950 text-white px-4 py-14 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(249,115,22,0.3), transparent 40%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <span className="inline-block bg-orange-500 text-white font-extrabold text-sm px-4 py-1.5 rounded-full mb-5 shadow-lg">
            29 DH seulement
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
            CV Professionnel Prêt en{" "}
            <span className="text-orange-400">2 Minutes</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mt-5 max-w-2xl mx-auto">
            Choisissez votre métier · Ajoutez vos infos · Téléchargez
          </p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 mt-7 text-sm">
            <TrustBadge>✓ Créé par des pros RH</TrustBadge>
            <TrustBadge>✓ Format A4 imprimable</TrustBadge>
            <TrustBadge>✓ 29 DH · Paiement unique</TrustBadge>
          </div>

          {/* Search */}
          <div className="mt-9 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cherchez votre métier (ex: chauffeur, soudeur…)"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 shadow-xl focus:outline-none focus:ring-4 focus:ring-violet-400/40"
            />
          </div>
        </div>
      </section>

      {/* SECTOR PILLS */}
      <section className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {SECTORS.map((s) => {
              const active = activeSector === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSector(s.id)}
                  className={[
                    "px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition",
                    active
                      ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700",
                  ].join(" ")}
                >
                  <span className="mr-1.5">{s.icon}</span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* JOB GRID */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {filteredJobs.length} CVs disponibles
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Cliquez sur un métier pour personnaliser votre CV
            </p>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            Aucun métier ne correspond à votre recherche.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredJobs.map((j) => (
              <JobCard key={j.id} job={j} onClick={() => setOpenJob(j)} />
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white border-y border-slate-200 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">
            Comment ça marche ?
          </h2>
          <p className="text-center text-slate-500 mb-10">3 étapes simples</p>
          <div className="grid md:grid-cols-3 gap-6">
            <Step n={1} title="Choisissez votre métier" desc="32 modèles prêts à l'emploi adaptés aux métiers du Maroc." />
            <Step n={2} title="Entrez vos infos" desc="Nom, téléphone, ville, expérience — c'est tout." />
            <Step n={3} title="Payez & téléchargez" desc="29 DH, paiement sécurisé, PDF disponible immédiatement." />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-10">
          Ils ont trouvé un emploi grâce à leur CV
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          <Testimonial
            name="Youssef E."
            role="Chauffeur poids lourd · Casablanca"
            text="J'ai téléchargé mon CV en 5 minutes et j'ai été appelé pour un entretien la semaine suivante. Très professionnel."
          />
          <Testimonial
            name="Fatima B."
            role="Femme de chambre · Marrakech"
            text="Très simple à utiliser. Le CV est beau et adapté à mon métier. Recommandé à toutes mes amies."
          />
          <Testimonial
            name="Omar A."
            role="Soudeur · Tanger"
            text="29 DH bien dépensés. J'ai eu trois propositions d'embauche en un mois. Merci !"
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-100 py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
            Questions fréquentes
          </h2>
          <Accordion type="single" collapsible className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6">
            <AccordionItem value="q1">
              <AccordionTrigger>Puis-je modifier le CV après achat ?</AccordionTrigger>
              <AccordionContent>
                Oui, vous accédez à un éditeur en ligne pour modifier toutes les informations à
                tout moment, et re-télécharger votre PDF gratuitement.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>Le CV est-il en arabe ou en français ?</AccordionTrigger>
              <AccordionContent>
                Vous choisissez la langue (français ou arabe) au moment de la personnalisation.
                Vous pouvez aussi créer une deuxième version dans l'autre langue.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>Comment télécharger le PDF ?</AccordionTrigger>
              <AccordionContent>
                Après le paiement, vous êtes redirigé sur une page avec le bouton « Télécharger
                ». Le PDF s'ouvre dans un nouvel onglet, prêt à imprimer ou enregistrer.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-sm">
        © {new Date().getFullYear()} Talent Maroc · CVs Prêts à l'Emploi
      </footer>

      {/* WIZARD */}
      {openJob && (
        <Wizard job={openJob} onClose={() => setOpenJob(null)} />
      )}
    </div>
  );
}

// ─────────────────────────── Sub-components ───────────────────────────

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/20 rounded-full px-3.5 py-1.5 text-slate-100">
      {children}
    </span>
  );
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-md shadow-sm transition-all duration-200 overflow-hidden flex flex-col group"
    >
      <div className="p-5 flex-1">
        <div className="text-4xl mb-2">{job.icon}</div>
        <span
          className={[
            "inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border mb-2.5",
            SECTOR_BADGE[job.sector],
          ].join(" ")}
        >
          {job.sector}
        </span>
        <h3 className="font-semibold text-slate-900 leading-tight">{job.title}</h3>
        <ul className="mt-2.5 space-y-1">
          {job.bullets.map((b, i) => (
            <li key={i} className="text-xs text-slate-500 flex gap-1.5">
              <span className="text-violet-400">•</span>
              <span className="line-clamp-1">{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50/60 group-hover:bg-violet-50/60 transition">
        <span className="text-sm font-medium text-violet-700 group-hover:text-violet-800">
          Créer mon CV →
        </span>
        <span className="text-xs font-bold bg-orange-500 text-white px-2.5 py-1 rounded-full">
          {PRICE_DH} DH
        </span>
      </div>
    </button>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-violet-600 text-white flex items-center justify-center text-2xl font-bold mb-3">
        {n}
      </div>
      <h3 className="font-semibold text-slate-900 text-lg">{title}</h3>
      <p className="text-sm text-slate-500 mt-1.5">{desc}</p>
    </div>
  );
}

function Testimonial({ name, role, text }: { name: string; role: string; text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex gap-0.5 text-amber-400 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-current" />
        ))}
      </div>
      <p className="text-slate-700 text-sm leading-relaxed">"{text}"</p>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="font-semibold text-slate-900 text-sm">{name}</p>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
    </div>
  );
}

function SuccessBanner({ cvId, onClose }: { cvId: string; onClose: () => void }) {
  return (
    <div className="bg-emerald-500 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold">
          🎉 Votre CV est prêt !
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/cv/${cvId}/print?autoprint=1`}
            target="_blank"
            rel="noreferrer"
            className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-4 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Télécharger le PDF
          </a>
          <Link
            to="/cv/$id"
            params={{ id: cvId }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5"
          >
            <Pencil className="w-4 h-4" /> Modifier
          </Link>
          <button onClick={onClose} className="ml-1 p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Wizard (Personalise + Checkout) ───────────────────────────

function Wizard({ job, onClose }: { job: Job; onClose: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Casablanca");
  const [exp, setExp] = useState("2-4");
  const [lang, setLang] = useState<"fr" | "ar">("fr");
  const [template, setTemplate] = useState<TemplateId>(job.suggestedTemplate);
  const [accent, setAccent] = useState<string>(job.accentColor);
  const [submitting, setSubmitting] = useState(false);

  const recommendedTemplates = useMemo(() => {
    // pick 4 templates: suggested + 3 others
    const others = TEMPLATE_OPTIONS.filter((t) => t.id !== job.suggestedTemplate).slice(0, 3);
    const suggested = TEMPLATE_OPTIONS.find((t) => t.id === job.suggestedTemplate)!;
    return [suggested, ...others];
  }, [job]);

  const mergedCV: CVData = useMemo(() => {
    const cv = JSON.parse(JSON.stringify(job.prefilledCV)) as CVData;
    cv.profile.firstName = firstName || cv.profile.firstName;
    cv.profile.lastName = lastName || cv.profile.lastName;
    cv.profile.phone = phone || cv.profile.phone;
    cv.profile.city = city || cv.profile.city;
    // adjust summary slightly based on exp
    const expLabel = EXPERIENCES.find((e) => e.v === exp)?.label ?? "";
    cv.summary = `${cv.summary} Profil : ${expLabel}.`;
    return cv;
  }, [job, firstName, lastName, phone, city, exp]);

  const formValid = firstName.trim() && lastName.trim() && phone.trim() && city && exp;

  async function handlePay() {
    if (!formValid) return;
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Créez un compte gratuit pour continuer");
        navigate({ to: "/login", search: { redirect: "/cv-ouvrier" } });
        return;
      }
      const { data: cvRow, error } = await supabase
        .from("cvs")
        .insert({
          user_id: userData.user.id,
          name: `CV ${job.title}`,
          data: mergedCV as any,
          template,
          accent,
          lang,
        })
        .select("id")
        .single();
      if (error) throw error;
      const cvId = cvRow.id;
      const redirectUrl = `${window.location.origin}/cv-ouvrier?success=${cvId}`;
      const url = `${DODO_URL}?quantity=1&redirect_url=${encodeURIComponent(redirectUrl)}`;
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'enregistrement");
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Personnaliser le CV — {job.title}</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 flex items-center gap-3 bg-white sticky top-0 z-10">
          <div className="text-3xl">{job.icon}</div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider font-semibold text-violet-600">
              Étape {step}/2 · {step === 1 ? "Personnalisation" : "Paiement"}
            </p>
            <h2 className="font-bold text-slate-900">{job.title}</h2>
          </div>
          <span
            className={[
              "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border hidden md:inline-block",
              SECTOR_BADGE[job.sector],
            ].join(" ")}
          >
            {job.sector}
          </span>
        </div>

        {step === 1 ? (
          <div className="grid md:grid-cols-5 gap-0">
            {/* Form */}
            <div className="md:col-span-2 p-6 space-y-4 bg-white">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Mohammed" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Nom *</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="El Alaoui" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212 6XX XXX XXX" />
              </div>
              <div className="space-y-1.5">
                <Label>Ville *</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expérience *</Label>
                <Select value={exp} onValueChange={setExp}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCES.map((e) => (
                      <SelectItem key={e.v} value={e.v}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Langue du CV</Label>
                <div className="flex gap-2">
                  {(["fr", "ar"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={[
                        "flex-1 py-2 rounded-lg border text-sm font-medium transition",
                        lang === l
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-white text-slate-700 border-slate-200 hover:border-violet-300",
                      ].join(" ")}
                    >
                      {l === "fr" ? "🇫🇷 Français" : "🇲🇦 العربية"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Modèle</Label>
                <div className="grid grid-cols-4 gap-2">
                  {recommendedTemplates.map((t) => {
                    const active = template === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTemplate(t.id);
                          setAccent(t.accent);
                        }}
                        className={[
                          "rounded-lg p-2 border text-center transition",
                          active
                            ? "border-violet-500 ring-2 ring-violet-300 bg-violet-50"
                            : "border-slate-200 bg-white hover:border-violet-300",
                        ].join(" ")}
                      >
                        <div
                          className="h-10 rounded mb-1.5"
                          style={{ background: t.accent }}
                        />
                        <p className="text-[10px] font-medium text-slate-700">{t.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="md:col-span-3 bg-slate-100 p-4 md:p-6 border-l border-slate-200">
              <CVPreview cv={mergedCV} accent={accent} />
              <p className="text-center text-xs text-slate-500 mt-3">
                Votre CV sera personnalisé avec vos informations
              </p>
            </div>
          </div>
        ) : (
          <CheckoutStep
            job={job}
            mergedCV={mergedCV}
            accent={accent}
            template={template}
            submitting={submitting}
            onPay={handlePay}
          />
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-white sticky bottom-0">
          <Button
            variant="ghost"
            onClick={() => (step === 1 ? onClose() : setStep(1))}
          >
            ← {step === 1 ? "Annuler" : "Retour"}
          </Button>
          {step === 1 ? (
            <Button
              disabled={!formValid}
              onClick={() => setStep(2)}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Continuer vers le paiement →
            </Button>
          ) : (
            <Button
              disabled={submitting}
              onClick={handlePay}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {submitting ? "..." : `Payer ${PRICE_DH} DH →`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CheckoutStep({
  job,
  mergedCV,
  accent,
  template,
  submitting,
  onPay,
}: {
  job: Job;
  mergedCV: CVData;
  accent: string;
  template: TemplateId;
  submitting: boolean;
  onPay: () => void;
}) {
  const tName = TEMPLATE_OPTIONS.find((t) => t.id === template)?.name ?? template;
  return (
    <div className="grid md:grid-cols-2 gap-0">
      {/* Order summary */}
      <div className="p-6 bg-slate-50">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Récapitulatif
        </h3>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">{job.icon}</div>
            <div>
              <p className="font-semibold text-slate-900">{job.title}</p>
              <p className="text-xs text-slate-500">Modèle : {tName}</p>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden border border-slate-200">
            <CVPreview cv={mergedCV} accent={accent} compact />
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="p-6 bg-white">
        <div className="mb-6">
          <p className="text-sm text-slate-500">Total à payer</p>
          <p className="text-5xl font-extrabold text-slate-900 tracking-tight">
            {PRICE_DH} <span className="text-2xl text-slate-500">DH</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Paiement unique · Téléchargement immédiat</p>
        </div>

        <ul className="space-y-2.5 mb-6">
          {[
            "CV PDF haute qualité prêt à imprimer",
            "Format A4 professionnel",
            "Personnalisé avec vos informations",
            "Modifiable à tout moment dans l'éditeur",
            "Téléchargement immédiat après paiement",
          ].map((it) => (
            <li key={it} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{it}</span>
            </li>
          ))}
        </ul>

        <button
          disabled={submitting}
          onClick={onPay}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-lg py-4 rounded-2xl transition shadow-lg shadow-orange-500/30"
        >
          {submitting ? "Préparation..." : `Payer ${PRICE_DH} DH →`}
        </button>
        <p className="text-center text-xs text-slate-500 mt-3">
          🔒 Paiement sécurisé · Remboursé si problème
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────── Live CV Preview (mockup) ───────────────────────────

function CVPreview({
  cv,
  accent,
  compact = false,
}: {
  cv: CVData;
  accent: string;
  compact?: boolean;
}) {
  return (
    <div
      className="bg-white shadow-md mx-auto"
      style={{
        aspectRatio: "210 / 297",
        width: "100%",
        maxWidth: compact ? 240 : 480,
      }}
    >
      <div
        className="h-full w-full overflow-hidden"
        style={{
          padding: compact ? "10px 12px" : "20px 22px",
          fontSize: compact ? 6 : 9,
          lineHeight: 1.3,
        }}
      >
        <div style={{ borderBottom: `3px solid ${accent}`, paddingBottom: compact ? 4 : 8, marginBottom: compact ? 5 : 10 }}>
          <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: compact ? 11 : 16, margin: 0 }}>
            {cv.profile.firstName} {cv.profile.lastName}
          </h3>
          <p style={{ color: accent, fontWeight: 600, margin: 0, fontSize: compact ? 7 : 10 }}>
            {cv.profile.title}
          </p>
          <p style={{ color: "#64748b", margin: "2px 0 0 0", fontSize: compact ? 5 : 7 }}>
            {cv.profile.phone} · {cv.profile.city}
          </p>
        </div>

        <SectionMini accent={accent} title="Profil" compact={compact}>
          <p style={{ color: "#334155", margin: 0 }}>{cv.summary}</p>
        </SectionMini>

        <SectionMini accent={accent} title="Expérience" compact={compact}>
          {cv.experience.slice(0, 2).map((e) => (
            <div key={e.id} style={{ marginBottom: compact ? 3 : 5 }}>
              <p style={{ fontWeight: 600, color: "#0f172a", margin: 0 }}>
                {e.role} · <span style={{ color: "#64748b", fontWeight: 400 }}>{e.company}</span>
              </p>
              <p style={{ color: "#94a3b8", margin: 0, fontStyle: "italic" }}>
                {e.start} – {e.end}
              </p>
              <ul style={{ margin: "2px 0 0 12px", padding: 0, color: "#475569" }}>
                {e.bullets.slice(0, compact ? 1 : 3).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </SectionMini>

        <SectionMini accent={accent} title="Compétences" compact={compact}>
          {cv.skills.map((s) => (
            <p key={s.id} style={{ margin: 0, color: "#475569" }}>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>{s.group} :</span>{" "}
              {s.items.join(" · ")}
            </p>
          ))}
        </SectionMini>

        <SectionMini accent={accent} title="Langues" compact={compact}>
          {cv.languages.map((l) => (
            <span key={l.id} style={{ color: "#475569", marginRight: 8 }}>
              {l.name} ({l.level})
            </span>
          ))}
        </SectionMini>
      </div>
    </div>
  );
}

function SectionMini({
  title,
  accent,
  children,
  compact,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
  compact: boolean;
}) {
  return (
    <div style={{ marginBottom: compact ? 4 : 7 }}>
      <p
        style={{
          color: accent,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontSize: compact ? 5 : 7,
          margin: "0 0 2px 0",
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}
