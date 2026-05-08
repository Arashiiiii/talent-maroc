import type { Lang } from "./schema";

export interface I18nStrings {
  summary:        string;
  experience:     string;
  education:      string;
  skills:         string;
  languages:      string;
  certifications: string;
  projects:       string;
  interests:      string;
  present:        string;
  contact:        string;
  achievements:   string;
  references:     string;
  executive:      string;
}

export const I18N: Record<Lang, I18nStrings> = {
  fr: {
    summary:        "Profil",
    experience:     "Expérience professionnelle",
    education:      "Formation",
    skills:         "Compétences",
    languages:      "Langues",
    certifications: "Certifications",
    projects:       "Projets",
    interests:      "Centres d'intérêt",
    present:        "Présent",
    contact:        "Contact",
    achievements:   "Réalisations",
    references:     "Références sur demande",
    executive:      "Profil exécutif",
  },
  en: {
    summary:        "Profile",
    experience:     "Professional experience",
    education:      "Education",
    skills:         "Skills",
    languages:      "Languages",
    certifications: "Certifications",
    projects:       "Projects",
    interests:      "Interests",
    present:        "Present",
    contact:        "Contact",
    achievements:   "Achievements",
    references:     "References on request",
    executive:      "Executive profile",
  },
  ar: {
    summary:        "الملف الشخصي",
    experience:     "الخبرة المهنية",
    education:      "التعليم",
    skills:         "المهارات",
    languages:      "اللغات",
    certifications: "الشهادات",
    projects:       "المشاريع",
    interests:      "الاهتمامات",
    present:        "حالياً",
    contact:        "تواصل",
    achievements:   "الإنجازات",
    references:     "المراجع عند الطلب",
    executive:      "ملف تنفيذي",
  },
};
