// 72 country cards for TEG La Revancha
// Each card corresponds to a country and carries 1-3 symbols.
//
// Symbols: SOLDADOS (wildcard), AVION, TANQUE, GRANADA, BARCO
//   - SOLDADOS cards act as wildcards when forming card sets.
//   - "Super-tarjeta" cards carry three symbols: AVION + BARCO + TANQUE.
//   - Remaining cards carry 1 or 2 symbols distributed roughly evenly.

import type { CountryId } from './countries';

export type CardSymbol = 'SOLDADOS' | 'AVION' | 'TANQUE' | 'GRANADA' | 'BARCO';

export interface CountryCard {
  id: string;
  country: CountryId;
  symbols: CardSymbol[];
  isWildcard: boolean;
  isSuperCard: boolean;
}

interface CardDef {
  country: CountryId;
  symbols: CardSymbol[];
}

const cardDefinitions: CardDef[] = [
  // -- SOLDADOS wildcards (10) --
  { country: 'ALASKA', symbols: ['SOLDADOS'] },
  { country: 'CUBA', symbols: ['SOLDADOS'] },
  { country: 'BRASIL', symbols: ['SOLDADOS'] },
  { country: 'ISLANDIA', symbols: ['SOLDADOS'] },
  { country: 'SIBERIA', symbols: ['SOLDADOS'] },
  { country: 'SAHARA', symbols: ['SOLDADOS'] },
  { country: 'AUSTRALIA', symbols: ['SOLDADOS'] },
  { country: 'IRAN', symbols: ['SOLDADOS'] },
  { country: 'ARGENTINA', symbols: ['SOLDADOS'] },
  { country: 'FRANCIA', symbols: ['SOLDADOS'] },

  // -- Super-tarjetas: AVION + BARCO + TANQUE (4) --
  { country: 'CHINA', symbols: ['AVION', 'BARCO', 'TANQUE'] },
  { country: 'ALEMANIA', symbols: ['AVION', 'BARCO', 'TANQUE'] },
  { country: 'NUEVA_YORK', symbols: ['AVION', 'BARCO', 'TANQUE'] },
  { country: 'SUDAFRICA', symbols: ['AVION', 'BARCO', 'TANQUE'] },

  // -- Two-symbol cards (14) --
  { country: 'GROENLANDIA', symbols: ['AVION', 'GRANADA'] },
  { country: 'CANADA', symbols: ['TANQUE', 'BARCO'] },
  { country: 'OREGON', symbols: ['AVION', 'TANQUE'] },
  { country: 'MEXICO', symbols: ['GRANADA', 'BARCO'] },
  { country: 'COLOMBIA', symbols: ['AVION', 'GRANADA'] },
  { country: 'CHILE', symbols: ['TANQUE', 'BARCO'] },
  { country: 'GRAN_BRETAÑA', symbols: ['BARCO', 'GRANADA'] },
  { country: 'NORUEGA', symbols: ['AVION', 'BARCO'] },
  { country: 'TURQUIA', symbols: ['TANQUE', 'GRANADA'] },
  { country: 'JAPON', symbols: ['AVION', 'BARCO'] },
  { country: 'INDIA', symbols: ['TANQUE', 'GRANADA'] },
  { country: 'EGIPTO', symbols: ['AVION', 'TANQUE'] },
  { country: 'MADAGASCAR', symbols: ['BARCO', 'GRANADA'] },
  { country: 'FILIPINAS', symbols: ['AVION', 'BARCO'] },

  // -- Single-symbol cards (44) --
  // AVION (11)
  { country: 'ISLA_VICTORIA', symbols: ['AVION'] },
  { country: 'CALIFORNIA', symbols: ['AVION'] },
  { country: 'JAMAICA', symbols: ['AVION'] },
  { country: 'VENEZUELA', symbols: ['AVION'] },
  { country: 'IRLANDA', symbols: ['AVION'] },
  { country: 'FINLANDIA', symbols: ['AVION'] },
  { country: 'CHUKCHI', symbols: ['AVION'] },
  { country: 'COREA', symbols: ['AVION'] },
  { country: 'ETIOPIA', symbols: ['AVION'] },
  { country: 'SUMATRA', symbols: ['AVION'] },
  { country: 'TONGA', symbols: ['AVION'] },

  // TANQUE (11)
  { country: 'LABRADOR', symbols: ['TANQUE'] },
  { country: 'CHICAGO', symbols: ['TANQUE'] },
  { country: 'HONDURAS', symbols: ['TANQUE'] },
  { country: 'BOLIVIA', symbols: ['TANQUE'] },
  { country: 'BIELORRUSIA', symbols: ['TANQUE'] },
  { country: 'POLONIA', symbols: ['TANQUE'] },
  { country: 'CHECHENIA', symbols: ['TANQUE'] },
  { country: 'KAMCHATKA', symbols: ['TANQUE'] },
  { country: 'IRAK', symbols: ['TANQUE'] },
  { country: 'NIGERIA', symbols: ['TANQUE'] },
  { country: 'ANGOLA', symbols: ['TANQUE'] },

  // GRANADA (11)
  { country: 'TERRANOVA', symbols: ['GRANADA'] },
  { country: 'LAS_VEGAS', symbols: ['GRANADA'] },
  { country: 'EL_SALVADOR', symbols: ['GRANADA'] },
  { country: 'PARAGUAY', symbols: ['GRANADA'] },
  { country: 'UCRANIA', symbols: ['GRANADA'] },
  { country: 'ALBANIA', symbols: ['GRANADA'] },
  { country: 'RUSIA', symbols: ['GRANADA'] },
  { country: 'ISRAEL', symbols: ['GRANADA'] },
  { country: 'VIETNAM', symbols: ['GRANADA'] },
  { country: 'MAURITANIA', symbols: ['GRANADA'] },
  { country: 'NUEVA_ZELANDA', symbols: ['GRANADA'] },

  // BARCO (11)
  { country: 'FLORIDA', symbols: ['BARCO'] },
  { country: 'NICARAGUA', symbols: ['BARCO'] },
  { country: 'URUGUAY', symbols: ['BARCO'] },
  { country: 'ESPAÑA', symbols: ['BARCO'] },
  { country: 'PORTUGAL', symbols: ['BARCO'] },
  { country: 'SERBIA', symbols: ['BARCO'] },
  { country: 'CROACIA', symbols: ['BARCO'] },
  { country: 'ITALIA', symbols: ['BARCO'] },
  { country: 'ARABIA', symbols: ['BARCO'] },
  { country: 'MALASIA', symbols: ['BARCO'] },
  { country: 'TASMANIA', symbols: ['BARCO'] },
];

export const COUNTRY_CARDS: CountryCard[] = cardDefinitions.map((def) => ({
  id: `CARD_${def.country}`,
  country: def.country,
  symbols: def.symbols,
  isWildcard: def.symbols.includes('SOLDADOS'),
  isSuperCard:
    def.symbols.length === 3 &&
    def.symbols.includes('AVION') &&
    def.symbols.includes('BARCO') &&
    def.symbols.includes('TANQUE'),
}));

/** Quick lookup map: CountryId -> CountryCard */
export const COUNTRY_CARDS_MAP: Record<CountryId, CountryCard> = COUNTRY_CARDS.reduce(
  (map, card) => {
    map[card.country] = card;
    return map;
  },
  {} as Record<CountryId, CountryCard>,
);
