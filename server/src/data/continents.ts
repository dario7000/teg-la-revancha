// All 7 continents for TEG La Revancha

import type { ContinentId, CountryId } from './countries';

export interface Continent {
  id: ContinentId;
  countries: CountryId[];
  bonus: number;
}

export const CONTINENTS: Continent[] = [
  {
    id: 'AMERICA_DEL_NORTE',
    countries: [
      'ALASKA', 'ISLA_VICTORIA', 'GROENLANDIA', 'LABRADOR',
      'CANADA', 'TERRANOVA', 'NUEVA_YORK', 'OREGON',
      'CHICAGO', 'LAS_VEGAS', 'FLORIDA', 'CALIFORNIA',
    ],
    bonus: 6,
  },
  {
    id: 'AMERICA_CENTRAL',
    countries: [
      'MEXICO', 'CUBA', 'JAMAICA', 'HONDURAS',
      'EL_SALVADOR', 'NICARAGUA',
    ],
    bonus: 3,
  },
  {
    id: 'AMERICA_DEL_SUR',
    countries: [
      'VENEZUELA', 'COLOMBIA', 'BRASIL', 'BOLIVIA',
      'PARAGUAY', 'ARGENTINA', 'CHILE', 'URUGUAY',
    ],
    bonus: 4,
  },
  {
    id: 'EUROPA',
    countries: [
      'ISLANDIA', 'IRLANDA', 'GRAN_BRETAÑA', 'NORUEGA',
      'FINLANDIA', 'BIELORRUSIA', 'UCRANIA', 'POLONIA',
      'ALBANIA', 'ALEMANIA', 'SERBIA', 'CROACIA',
      'ITALIA', 'FRANCIA', 'ESPAÑA', 'PORTUGAL',
    ],
    bonus: 8,
  },
  {
    id: 'ASIA',
    countries: [
      'SIBERIA', 'CHECHENIA', 'RUSIA', 'CHINA',
      'CHUKCHI', 'KAMCHATKA', 'JAPON', 'COREA',
      'IRAN', 'IRAK', 'ISRAEL', 'TURQUIA',
      'ARABIA', 'INDIA', 'VIETNAM', 'MALASIA',
    ],
    bonus: 8,
  },
  {
    id: 'AFRICA',
    countries: [
      'SAHARA', 'EGIPTO', 'ETIOPIA', 'NIGERIA',
      'ANGOLA', 'MAURITANIA', 'SUDAFRICA', 'MADAGASCAR',
    ],
    bonus: 4,
  },
  {
    id: 'OCEANIA',
    countries: [
      'SUMATRA', 'FILIPINAS', 'TONGA', 'AUSTRALIA',
      'TASMANIA', 'NUEVA_ZELANDA',
    ],
    bonus: 3,
  },
];

/** Quick lookup map: ContinentId -> Continent */
export const CONTINENTS_MAP: Record<ContinentId, Continent> = CONTINENTS.reduce(
  (map, continent) => {
    map[continent.id] = continent;
    return map;
  },
  {} as Record<ContinentId, Continent>,
);
