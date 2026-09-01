export interface Country {
  name: string;
  flag: string;
}

export interface Region {
  name: string;
  countries: Country[];
}

export const REGIONS: Region[] = [
  {
    name: 'Maghreb',
    countries: [
      { name: 'Maroc',   flag: '🇲🇦' },
      { name: 'Algérie', flag: '🇩🇿' },
      { name: 'Tunisie', flag: '🇹🇳' },
    ],
  },
  {
    name: 'Europe',
    countries: [
      { name: 'France',     flag: '🇫🇷' },
      { name: 'Belgique',   flag: '🇧🇪' },
      { name: 'Espagne',    flag: '🇪🇸' },
      { name: 'Allemagne',  flag: '🇩🇪' },
      { name: 'Pays-Bas',   flag: '🇳🇱' },
      { name: 'Italie',     flag: '🇮🇹' },
    ],
  },
  {
    name: 'Golfe & Moyen-Orient',
    countries: [
      { name: 'Émirats Arabes Unis', flag: '🇦🇪' },
      { name: 'Arabie Saoudite',     flag: '🇸🇦' },
      { name: 'Qatar',               flag: '🇶🇦' },
    ],
  },
  {
    name: 'Amérique du Nord',
    countries: [
      { name: 'Canada',        flag: '🇨🇦' },
      { name: 'États-Unis',    flag: '🇺🇸' },
    ],
  },
];

export const ALL_COUNTRIES: Country[] = REGIONS.flatMap(r => r.countries);

export const COUNTRY_FLAGS: Record<string, string> =
  Object.fromEntries(ALL_COUNTRIES.map(c => [c.name, c.flag]));
