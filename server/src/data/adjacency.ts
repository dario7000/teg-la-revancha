// Complete adjacency matrix for all 72 countries in TEG La Revancha
//
// Cross-continent bridges:
//   ALASKA <-> KAMCHATKA  (N.America <-> Asia, Bering Strait)
//   ALASKA <-> CHUKCHI  (N.America <-> Asia)
//   GROENLANDIA <-> ISLANDIA  (N.America <-> Europe)
//   CALIFORNIA <-> FILIPINAS, TONGA  (N.America <-> Oceania, Pacific bridge)
//   CALIFORNIA, FLORIDA <-> MEXICO  (N.America <-> C.America)
//   NICARAGUA <-> COLOMBIA, VENEZUELA  (C.America <-> S.America)
//   URUGUAY <-> MAURITANIA  (S.America <-> Africa, Atlantic bridge)
//   BRASIL <-> NIGERIA  (S.America <-> Africa, Atlantic bridge)
//   BRASIL <-> SAHARA  (S.America <-> Africa, Atlantic bridge)
//   ESPAÑA <-> SAHARA  (Europe <-> Africa)
//   POLONIA <-> EGIPTO  (Europe <-> Africa)
//   MALASIA <-> SUMATRA, FILIPINAS  (Asia <-> Oceania)
//   INDIA <-> SUMATRA  (Asia <-> Oceania)
//   CHILE <-> AUSTRALIA  (S.America <-> Oceania, Pacific bridge)

import type { CountryId } from './countries';

export const ADJACENCY: Record<CountryId, CountryId[]> = {
  // ===================================
  // AMERICA DEL NORTE (12)
  // ===================================
  ALASKA: ['CANADA', 'OREGON', 'ISLA_VICTORIA', 'CHUKCHI', 'KAMCHATKA'],
  ISLA_VICTORIA: ['ALASKA', 'CANADA', 'GROENLANDIA', 'LABRADOR'],
  GROENLANDIA: ['ISLA_VICTORIA', 'LABRADOR', 'ISLANDIA'],
  LABRADOR: ['ISLA_VICTORIA', 'GROENLANDIA', 'CANADA', 'TERRANOVA', 'NUEVA_YORK'],
  CANADA: ['ALASKA', 'ISLA_VICTORIA', 'LABRADOR', 'TERRANOVA', 'OREGON', 'CHICAGO', 'NUEVA_YORK'],
  TERRANOVA: ['LABRADOR', 'CANADA', 'NUEVA_YORK'],
  NUEVA_YORK: ['LABRADOR', 'CANADA', 'CHICAGO', 'TERRANOVA', 'FLORIDA'],
  OREGON: ['ALASKA', 'CANADA', 'CHICAGO', 'LAS_VEGAS', 'CALIFORNIA'],
  CHICAGO: ['CANADA', 'OREGON', 'NUEVA_YORK', 'LAS_VEGAS', 'FLORIDA'],
  LAS_VEGAS: ['OREGON', 'CHICAGO', 'CALIFORNIA', 'FLORIDA', 'MEXICO'],
  CALIFORNIA: ['OREGON', 'LAS_VEGAS', 'MEXICO', 'TONGA', 'FILIPINAS'],
  FLORIDA: ['CHICAGO', 'NUEVA_YORK', 'LAS_VEGAS', 'MEXICO', 'CUBA'],

  // ===================================
  // AMERICA CENTRAL (6)
  // ===================================
  MEXICO: ['LAS_VEGAS', 'CALIFORNIA', 'FLORIDA', 'CUBA', 'HONDURAS', 'EL_SALVADOR'],
  CUBA: ['FLORIDA', 'MEXICO', 'HONDURAS', 'JAMAICA'],
  JAMAICA: ['CUBA', 'NICARAGUA'],
  HONDURAS: ['MEXICO', 'CUBA', 'EL_SALVADOR', 'NICARAGUA'],
  EL_SALVADOR: ['MEXICO', 'HONDURAS', 'NICARAGUA', 'COLOMBIA'],
  NICARAGUA: ['HONDURAS', 'EL_SALVADOR', 'COLOMBIA', 'VENEZUELA', 'JAMAICA'],

  // ===================================
  // AMERICA DEL SUR (8)
  // ===================================
  COLOMBIA: ['EL_SALVADOR', 'NICARAGUA', 'VENEZUELA', 'BRASIL', 'BOLIVIA', 'CHILE'],
  VENEZUELA: ['NICARAGUA', 'COLOMBIA', 'BRASIL'],
  BRASIL: ['COLOMBIA', 'VENEZUELA', 'BOLIVIA', 'PARAGUAY', 'URUGUAY', 'ARGENTINA', 'NIGERIA', 'SAHARA'],
  BOLIVIA: ['COLOMBIA', 'BRASIL', 'PARAGUAY', 'CHILE', 'ARGENTINA'],
  PARAGUAY: ['BRASIL', 'BOLIVIA', 'ARGENTINA', 'URUGUAY'],
  ARGENTINA: ['BOLIVIA', 'PARAGUAY', 'CHILE', 'URUGUAY', 'BRASIL'],
  CHILE: ['BOLIVIA', 'ARGENTINA', 'AUSTRALIA', 'COLOMBIA'],
  URUGUAY: ['BRASIL', 'PARAGUAY', 'ARGENTINA', 'MAURITANIA'],

  // ===================================
  // EUROPA (16)
  // ===================================
  ISLANDIA: ['IRLANDA', 'GRAN_BRETAÑA', 'NORUEGA', 'GROENLANDIA'],
  IRLANDA: ['ISLANDIA', 'GRAN_BRETAÑA'],
  GRAN_BRETAÑA: ['ISLANDIA', 'IRLANDA', 'NORUEGA', 'FRANCIA', 'ALEMANIA'],
  NORUEGA: ['ISLANDIA', 'GRAN_BRETAÑA', 'FINLANDIA', 'ALEMANIA', 'POLONIA'],
  FINLANDIA: ['NORUEGA', 'BIELORRUSIA', 'POLONIA'],
  BIELORRUSIA: ['FINLANDIA', 'POLONIA', 'UCRANIA'],
  UCRANIA: ['BIELORRUSIA', 'POLONIA', 'SERBIA', 'ALBANIA', 'RUSIA'],
  POLONIA: ['NORUEGA', 'FINLANDIA', 'BIELORRUSIA', 'UCRANIA', 'ALEMANIA', 'SERBIA', 'EGIPTO'],
  ALEMANIA: ['GRAN_BRETAÑA', 'NORUEGA', 'POLONIA', 'FRANCIA', 'CROACIA', 'SERBIA'],
  FRANCIA: ['GRAN_BRETAÑA', 'ALEMANIA', 'ITALIA', 'ESPAÑA'],
  ESPAÑA: ['FRANCIA', 'PORTUGAL', 'SAHARA'],
  PORTUGAL: ['ESPAÑA'],
  ITALIA: ['FRANCIA', 'CROACIA', 'ALBANIA'],
  CROACIA: ['ALEMANIA', 'SERBIA', 'ITALIA', 'ALBANIA'],
  SERBIA: ['ALEMANIA', 'POLONIA', 'UCRANIA', 'CROACIA', 'ALBANIA'],
  ALBANIA: ['UCRANIA', 'SERBIA', 'CROACIA', 'ITALIA'],

  // ===================================
  // ASIA (16)
  // ===================================
  TURQUIA: ['RUSIA', 'IRAN', 'IRAK', 'ISRAEL'],
  ISRAEL: ['TURQUIA', 'IRAK', 'ARABIA', 'EGIPTO'],
  ARABIA: ['ISRAEL', 'IRAK', 'IRAN', 'INDIA'],
  IRAK: ['TURQUIA', 'ISRAEL', 'ARABIA', 'IRAN', 'EGIPTO'],
  IRAN: ['TURQUIA', 'IRAK', 'ARABIA', 'RUSIA', 'INDIA'],
  RUSIA: ['TURQUIA', 'UCRANIA', 'IRAN', 'CHECHENIA', 'CHINA'],
  CHECHENIA: ['RUSIA', 'SIBERIA', 'CHINA'],
  SIBERIA: ['CHECHENIA', 'CHUKCHI', 'KAMCHATKA', 'CHINA', 'COREA'],
  CHUKCHI: ['SIBERIA', 'KAMCHATKA', 'ALASKA'],
  KAMCHATKA: ['SIBERIA', 'CHUKCHI', 'JAPON', 'COREA', 'ALASKA'],
  JAPON: ['KAMCHATKA', 'COREA'],
  COREA: ['SIBERIA', 'KAMCHATKA', 'JAPON', 'CHINA'],
  CHINA: ['RUSIA', 'CHECHENIA', 'SIBERIA', 'COREA', 'INDIA', 'VIETNAM', 'MALASIA'],
  INDIA: ['ARABIA', 'IRAN', 'CHINA', 'VIETNAM', 'MALASIA', 'SUMATRA'],
  VIETNAM: ['CHINA', 'INDIA', 'MALASIA'],
  MALASIA: ['CHINA', 'INDIA', 'VIETNAM', 'SUMATRA', 'FILIPINAS'],

  // ===================================
  // AFRICA (8)
  // ===================================
  SAHARA: ['EGIPTO', 'ETIOPIA', 'NIGERIA', 'ESPAÑA', 'BRASIL'],
  EGIPTO: ['SAHARA', 'ETIOPIA', 'POLONIA', 'IRAK', 'ISRAEL', 'MADAGASCAR'],
  ETIOPIA: ['SAHARA', 'EGIPTO', 'NIGERIA', 'ANGOLA'],
  NIGERIA: ['SAHARA', 'ETIOPIA', 'ANGOLA', 'MAURITANIA', 'BRASIL'],
  ANGOLA: ['ETIOPIA', 'NIGERIA', 'MAURITANIA', 'SUDAFRICA', 'MADAGASCAR'],
  MAURITANIA: ['NIGERIA', 'ANGOLA', 'SUDAFRICA', 'URUGUAY'],
  SUDAFRICA: ['ANGOLA', 'MAURITANIA', 'MADAGASCAR'],
  MADAGASCAR: ['ANGOLA', 'SUDAFRICA', 'EGIPTO'],

  // ===================================
  // OCEANIA (6)
  // ===================================
  SUMATRA: ['INDIA', 'MALASIA', 'FILIPINAS', 'AUSTRALIA'],
  FILIPINAS: ['MALASIA', 'SUMATRA', 'TONGA', 'CALIFORNIA'],
  TONGA: ['FILIPINAS', 'AUSTRALIA', 'NUEVA_ZELANDA', 'CALIFORNIA'],
  AUSTRALIA: ['SUMATRA', 'TASMANIA', 'NUEVA_ZELANDA', 'TONGA', 'CHILE'],
  TASMANIA: ['AUSTRALIA', 'NUEVA_ZELANDA'],
  NUEVA_ZELANDA: ['AUSTRALIA', 'TASMANIA', 'TONGA'],
};

/**
 * Check whether two countries are adjacent on the board.
 * The check is symmetric: areAdjacent(a, b) === areAdjacent(b, a).
 */
export function areAdjacent(a: CountryId, b: CountryId): boolean {
  const neighbors = ADJACENCY[a];
  if (!neighbors) return false;
  return neighbors.includes(b);
}

/**
 * BFS to find shortest path distance (in borders) between two countries.
 * Used for missile range calculations.
 */
export function getDistance(from: CountryId, to: CountryId): number {
  if (from === to) return 0;
  const visited = new Set<string>();
  const queue: [string, number][] = [[from, 0]];
  visited.add(from);

  while (queue.length > 0) {
    const [current, dist] = queue.shift()!;
    const neighbors = ADJACENCY[current as CountryId] || [];
    for (const neighbor of neighbors) {
      if (neighbor === to) return dist + 1;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }

  return Infinity;
}

/**
 * Get all countries within a given distance (for missile range overlay).
 * Returns a map of countryId -> distance.
 */
export function getCountriesInRange(from: CountryId, maxDistance: number = 3): Record<string, number> {
  const result: Record<string, number> = {};
  const visited = new Set<string>();
  const queue: [string, number][] = [[from, 0]];
  visited.add(from);

  while (queue.length > 0) {
    const [current, dist] = queue.shift()!;
    if (dist > 0) result[current] = dist;
    if (dist >= maxDistance) continue;
    const neighbors = ADJACENCY[current as CountryId] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }

  return result;
}

/**
 * Get missile damage at a given distance.
 * Distance 1 (adjacent): 3 armies destroyed
 * Distance 2 (1 country between): 2 armies destroyed
 * Distance 3 (2 countries between): 1 army destroyed
 * Distance 4+: out of range
 */
export function getMissileDamage(distance: number): number {
  switch (distance) {
    case 1: return 3;
    case 2: return 2;
    case 3: return 1;
    default: return 0;
  }
}
