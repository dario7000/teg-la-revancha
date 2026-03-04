// All 72 countries for TEG La Revancha

export type ContinentId =
  | 'AMERICA_DEL_NORTE'
  | 'AMERICA_CENTRAL'
  | 'AMERICA_DEL_SUR'
  | 'EUROPA'
  | 'ASIA'
  | 'AFRICA'
  | 'OCEANIA';

export type CountryId =
  // America del Norte (12)
  | 'ALASKA' | 'ISLA_VICTORIA' | 'GROENLANDIA' | 'LABRADOR'
  | 'CANADA' | 'TERRANOVA' | 'NUEVA_YORK' | 'OREGON'
  | 'CHICAGO' | 'LAS_VEGAS' | 'FLORIDA' | 'CALIFORNIA'
  // America Central (6)
  | 'MEXICO' | 'CUBA' | 'JAMAICA' | 'HONDURAS'
  | 'EL_SALVADOR' | 'NICARAGUA'
  // America del Sur (8)
  | 'VENEZUELA' | 'COLOMBIA' | 'BRASIL' | 'BOLIVIA'
  | 'PARAGUAY' | 'ARGENTINA' | 'CHILE' | 'URUGUAY'
  // Europa (16)
  | 'ISLANDIA' | 'IRLANDA' | 'GRAN_BRETAÑA' | 'NORUEGA'
  | 'FINLANDIA' | 'BIELORRUSIA' | 'UCRANIA' | 'POLONIA'
  | 'ALBANIA' | 'ALEMANIA' | 'SERBIA' | 'CROACIA'
  | 'ITALIA' | 'FRANCIA' | 'ESPAÑA' | 'PORTUGAL'
  // Asia (16)
  | 'SIBERIA' | 'CHECHENIA' | 'RUSIA' | 'CHINA'
  | 'CHUKCHI' | 'KAMCHATKA' | 'JAPON' | 'COREA'
  | 'IRAN' | 'IRAK' | 'ISRAEL' | 'TURQUIA'
  | 'ARABIA' | 'INDIA' | 'VIETNAM' | 'MALASIA'
  // Africa (8)
  | 'SAHARA' | 'EGIPTO' | 'ETIOPIA' | 'NIGERIA'
  | 'ANGOLA' | 'MAURITANIA' | 'SUDAFRICA' | 'MADAGASCAR'
  // Oceania (6)
  | 'SUMATRA' | 'FILIPINAS' | 'TONGA' | 'AUSTRALIA'
  | 'TASMANIA' | 'NUEVA_ZELANDA';

export interface Country {
  id: CountryId;
  continent: ContinentId;
  isIsland: boolean;
}

const ISLAND_IDS: ReadonlySet<CountryId> = new Set<CountryId>([
  'CUBA',
  'JAMAICA',
  'ISLA_VICTORIA',
  'LABRADOR',
  'GROENLANDIA',
  'ISLANDIA',
  'IRLANDA',
  'GRAN_BRETAÑA',
  'JAPON',
  'TONGA',
  'FILIPINAS',
  'SUMATRA',
  'TASMANIA',
  'NUEVA_ZELANDA',
  'MADAGASCAR',
]);

export const COUNTRIES: Country[] = [
  // -- America del Norte (12) --
  { id: 'ALASKA', continent: 'AMERICA_DEL_NORTE', isIsland: false },
  { id: 'ISLA_VICTORIA', continent: 'AMERICA_DEL_NORTE', isIsland: true },
  { id: 'GROENLANDIA', continent: 'AMERICA_DEL_NORTE', isIsland: true },
  { id: 'LABRADOR', continent: 'AMERICA_DEL_NORTE', isIsland: true },
  { id: 'CANADA', continent: 'AMERICA_DEL_NORTE', isIsland: false },
  { id: 'TERRANOVA', continent: 'AMERICA_DEL_NORTE', isIsland: false },
  { id: 'NUEVA_YORK', continent: 'AMERICA_DEL_NORTE', isIsland: false },
  { id: 'OREGON', continent: 'AMERICA_DEL_NORTE', isIsland: false },
  { id: 'CHICAGO', continent: 'AMERICA_DEL_NORTE', isIsland: false },
  { id: 'LAS_VEGAS', continent: 'AMERICA_DEL_NORTE', isIsland: false },
  { id: 'FLORIDA', continent: 'AMERICA_DEL_NORTE', isIsland: false },
  { id: 'CALIFORNIA', continent: 'AMERICA_DEL_NORTE', isIsland: false },

  // -- America Central (6) --
  { id: 'MEXICO', continent: 'AMERICA_CENTRAL', isIsland: false },
  { id: 'CUBA', continent: 'AMERICA_CENTRAL', isIsland: true },
  { id: 'JAMAICA', continent: 'AMERICA_CENTRAL', isIsland: true },
  { id: 'HONDURAS', continent: 'AMERICA_CENTRAL', isIsland: false },
  { id: 'EL_SALVADOR', continent: 'AMERICA_CENTRAL', isIsland: false },
  { id: 'NICARAGUA', continent: 'AMERICA_CENTRAL', isIsland: false },

  // -- America del Sur (8) --
  { id: 'VENEZUELA', continent: 'AMERICA_DEL_SUR', isIsland: false },
  { id: 'COLOMBIA', continent: 'AMERICA_DEL_SUR', isIsland: false },
  { id: 'BRASIL', continent: 'AMERICA_DEL_SUR', isIsland: false },
  { id: 'BOLIVIA', continent: 'AMERICA_DEL_SUR', isIsland: false },
  { id: 'PARAGUAY', continent: 'AMERICA_DEL_SUR', isIsland: false },
  { id: 'ARGENTINA', continent: 'AMERICA_DEL_SUR', isIsland: false },
  { id: 'CHILE', continent: 'AMERICA_DEL_SUR', isIsland: false },
  { id: 'URUGUAY', continent: 'AMERICA_DEL_SUR', isIsland: false },

  // -- Europa (16) --
  { id: 'ISLANDIA', continent: 'EUROPA', isIsland: true },
  { id: 'IRLANDA', continent: 'EUROPA', isIsland: true },
  { id: 'GRAN_BRETAÑA', continent: 'EUROPA', isIsland: true },
  { id: 'NORUEGA', continent: 'EUROPA', isIsland: false },
  { id: 'FINLANDIA', continent: 'EUROPA', isIsland: false },
  { id: 'BIELORRUSIA', continent: 'EUROPA', isIsland: false },
  { id: 'UCRANIA', continent: 'EUROPA', isIsland: false },
  { id: 'POLONIA', continent: 'EUROPA', isIsland: false },
  { id: 'ALBANIA', continent: 'EUROPA', isIsland: false },
  { id: 'ALEMANIA', continent: 'EUROPA', isIsland: false },
  { id: 'SERBIA', continent: 'EUROPA', isIsland: false },
  { id: 'CROACIA', continent: 'EUROPA', isIsland: false },
  { id: 'ITALIA', continent: 'EUROPA', isIsland: false },
  { id: 'FRANCIA', continent: 'EUROPA', isIsland: false },
  { id: 'ESPAÑA', continent: 'EUROPA', isIsland: false },
  { id: 'PORTUGAL', continent: 'EUROPA', isIsland: false },

  // -- Asia (16) --
  { id: 'SIBERIA', continent: 'ASIA', isIsland: false },
  { id: 'CHECHENIA', continent: 'ASIA', isIsland: false },
  { id: 'RUSIA', continent: 'ASIA', isIsland: false },
  { id: 'CHINA', continent: 'ASIA', isIsland: false },
  { id: 'CHUKCHI', continent: 'ASIA', isIsland: false },
  { id: 'KAMCHATKA', continent: 'ASIA', isIsland: false },
  { id: 'JAPON', continent: 'ASIA', isIsland: true },
  { id: 'COREA', continent: 'ASIA', isIsland: false },
  { id: 'IRAN', continent: 'ASIA', isIsland: false },
  { id: 'IRAK', continent: 'ASIA', isIsland: false },
  { id: 'ISRAEL', continent: 'ASIA', isIsland: false },
  { id: 'TURQUIA', continent: 'ASIA', isIsland: false },
  { id: 'ARABIA', continent: 'ASIA', isIsland: false },
  { id: 'INDIA', continent: 'ASIA', isIsland: false },
  { id: 'VIETNAM', continent: 'ASIA', isIsland: false },
  { id: 'MALASIA', continent: 'ASIA', isIsland: false },

  // -- Africa (8) --
  { id: 'SAHARA', continent: 'AFRICA', isIsland: false },
  { id: 'EGIPTO', continent: 'AFRICA', isIsland: false },
  { id: 'ETIOPIA', continent: 'AFRICA', isIsland: false },
  { id: 'NIGERIA', continent: 'AFRICA', isIsland: false },
  { id: 'ANGOLA', continent: 'AFRICA', isIsland: false },
  { id: 'MAURITANIA', continent: 'AFRICA', isIsland: false },
  { id: 'SUDAFRICA', continent: 'AFRICA', isIsland: false },
  { id: 'MADAGASCAR', continent: 'AFRICA', isIsland: true },

  // -- Oceania (6) --
  { id: 'SUMATRA', continent: 'OCEANIA', isIsland: true },
  { id: 'FILIPINAS', continent: 'OCEANIA', isIsland: true },
  { id: 'TONGA', continent: 'OCEANIA', isIsland: true },
  { id: 'AUSTRALIA', continent: 'OCEANIA', isIsland: false },
  { id: 'TASMANIA', continent: 'OCEANIA', isIsland: true },
  { id: 'NUEVA_ZELANDA', continent: 'OCEANIA', isIsland: true },
];

/** Quick lookup map: CountryId -> Country */
export const COUNTRIES_MAP: Record<CountryId, Country> = COUNTRIES.reduce(
  (map, country) => {
    map[country.id] = country;
    return map;
  },
  {} as Record<CountryId, Country>,
);
