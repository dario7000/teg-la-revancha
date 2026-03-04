// Complete adjacency matrix for all 72 countries in TEG La Revancha
//
// Cross-continent bridges:
//   ALASKA <-> CHUKCHI  (N.America <-> Asia)
//   GROENLANDIA <-> ISLANDIA  (N.America <-> Europe)
//   CALIFORNIA, FLORIDA <-> MEXICO  (N.America <-> C.America)
//   NICARAGUA <-> COLOMBIA, VENEZUELA  (C.America <-> S.America)
//   URUGUAY <-> MAURITANIA  (S.America <-> Africa, Atlantic bridge)
//   BRASIL <-> SAHARA, NIGERIA  (S.America <-> Africa, Atlantic bridge)
//   ESPAÑA, PORTUGAL <-> SAHARA  (Europe <-> Africa)
//   TURQUIA, ISRAEL <-> EGIPTO  (Asia <-> Africa)
//   MALASIA <-> SUMATRA, FILIPINAS  (Asia <-> Oceania)
//   CHILE <-> AUSTRALIA  (S.America <-> Oceania, Pacific bridge)
//   FINLANDIA <-> SIBERIA  (Europe <-> Asia)
//   UCRANIA <-> RUSIA, CHECHENIA  (Europe <-> Asia)
//   SERBIA <-> TURQUIA  (Europe <-> Asia)

import type { CountryId } from './countries';

export const ADJACENCY: Record<CountryId, CountryId[]> = {
  // ===================================
  // AMERICA DEL NORTE (12)
  // ===================================
  ALASKA: ['ISLA_VICTORIA', 'CANADA', 'OREGON', 'CHUKCHI'],
  ISLA_VICTORIA: ['ALASKA', 'GROENLANDIA', 'CANADA'],
  GROENLANDIA: ['ISLA_VICTORIA', 'LABRADOR', 'ISLANDIA'],
  LABRADOR: ['GROENLANDIA', 'CANADA', 'TERRANOVA'],
  CANADA: ['ALASKA', 'ISLA_VICTORIA', 'LABRADOR', 'OREGON', 'NUEVA_YORK', 'CHICAGO'],
  TERRANOVA: ['LABRADOR', 'NUEVA_YORK'],
  NUEVA_YORK: ['CANADA', 'TERRANOVA', 'CHICAGO', 'FLORIDA'],
  OREGON: ['ALASKA', 'CANADA', 'CHICAGO', 'LAS_VEGAS', 'CALIFORNIA'],
  CHICAGO: ['CANADA', 'NUEVA_YORK', 'OREGON', 'LAS_VEGAS', 'FLORIDA'],
  LAS_VEGAS: ['OREGON', 'CHICAGO', 'CALIFORNIA'],
  FLORIDA: ['NUEVA_YORK', 'CHICAGO', 'CALIFORNIA', 'MEXICO'],
  CALIFORNIA: ['OREGON', 'LAS_VEGAS', 'FLORIDA', 'MEXICO'],

  // ===================================
  // AMERICA CENTRAL (6)
  // ===================================
  MEXICO: ['CALIFORNIA', 'FLORIDA', 'CUBA', 'HONDURAS'],
  CUBA: ['MEXICO', 'JAMAICA', 'HONDURAS', 'EL_SALVADOR'],
  JAMAICA: ['CUBA', 'NICARAGUA', 'HONDURAS'],
  HONDURAS: ['MEXICO', 'CUBA', 'JAMAICA', 'EL_SALVADOR', 'NICARAGUA'],
  EL_SALVADOR: ['CUBA', 'HONDURAS', 'NICARAGUA'],
  NICARAGUA: ['JAMAICA', 'HONDURAS', 'EL_SALVADOR', 'COLOMBIA', 'VENEZUELA'],

  // ===================================
  // AMERICA DEL SUR (8)
  // ===================================
  VENEZUELA: ['NICARAGUA', 'COLOMBIA', 'BRASIL'],
  COLOMBIA: ['NICARAGUA', 'VENEZUELA', 'BRASIL', 'BOLIVIA', 'CHILE'],
  BRASIL: ['VENEZUELA', 'COLOMBIA', 'BOLIVIA', 'PARAGUAY', 'ARGENTINA', 'URUGUAY', 'SAHARA', 'NIGERIA'],
  BOLIVIA: ['COLOMBIA', 'BRASIL', 'PARAGUAY', 'ARGENTINA', 'CHILE'],
  PARAGUAY: ['BRASIL', 'BOLIVIA', 'ARGENTINA', 'URUGUAY'],
  ARGENTINA: ['COLOMBIA', 'BRASIL', 'BOLIVIA', 'PARAGUAY', 'CHILE', 'URUGUAY'],
  CHILE: ['COLOMBIA', 'BOLIVIA', 'ARGENTINA', 'AUSTRALIA'],
  URUGUAY: ['BRASIL', 'PARAGUAY', 'ARGENTINA', 'MAURITANIA'],

  // ===================================
  // EUROPA (16)
  // ===================================
  ISLANDIA: ['GROENLANDIA', 'IRLANDA', 'GRAN_BRETAÑA', 'NORUEGA'],
  IRLANDA: ['ISLANDIA', 'GRAN_BRETAÑA'],
  GRAN_BRETAÑA: ['ISLANDIA', 'IRLANDA', 'NORUEGA', 'FRANCIA', 'ALEMANIA'],
  NORUEGA: ['ISLANDIA', 'GRAN_BRETAÑA', 'FINLANDIA', 'ALEMANIA', 'POLONIA'],
  FINLANDIA: ['NORUEGA', 'SIBERIA', 'BIELORRUSIA', 'POLONIA'],
  BIELORRUSIA: ['FINLANDIA', 'UCRANIA', 'POLONIA'],
  UCRANIA: ['BIELORRUSIA', 'RUSIA', 'CHECHENIA', 'POLONIA', 'SERBIA', 'CROACIA'],
  POLONIA: ['NORUEGA', 'FINLANDIA', 'BIELORRUSIA', 'UCRANIA', 'ALEMANIA', 'SERBIA', 'CROACIA'],
  ALBANIA: ['SERBIA', 'CROACIA', 'ITALIA', 'FRANCIA', 'ESPAÑA'],
  ALEMANIA: ['GRAN_BRETAÑA', 'NORUEGA', 'POLONIA', 'CROACIA', 'ITALIA', 'FRANCIA'],
  SERBIA: ['UCRANIA', 'POLONIA', 'ALBANIA', 'CROACIA', 'TURQUIA'],
  CROACIA: ['UCRANIA', 'POLONIA', 'ALBANIA', 'ALEMANIA', 'SERBIA', 'ITALIA'],
  ITALIA: ['ALBANIA', 'ALEMANIA', 'CROACIA', 'FRANCIA'],
  FRANCIA: ['GRAN_BRETAÑA', 'ALBANIA', 'ALEMANIA', 'ITALIA', 'ESPAÑA'],
  ESPAÑA: ['ALBANIA', 'FRANCIA', 'PORTUGAL', 'SAHARA'],
  PORTUGAL: ['ESPAÑA', 'SAHARA'],

  // ===================================
  // ASIA (16)
  // ===================================
  SIBERIA: ['FINLANDIA', 'CHECHENIA', 'RUSIA', 'CHINA', 'CHUKCHI'],
  CHECHENIA: ['SIBERIA', 'RUSIA', 'UCRANIA', 'IRAN', 'TURQUIA'],
  RUSIA: ['SIBERIA', 'CHECHENIA', 'CHINA', 'UCRANIA'],
  CHINA: ['SIBERIA', 'RUSIA', 'CHUKCHI', 'KAMCHATKA', 'COREA', 'INDIA', 'VIETNAM'],
  CHUKCHI: ['SIBERIA', 'CHINA', 'KAMCHATKA', 'ALASKA'],
  KAMCHATKA: ['CHINA', 'CHUKCHI', 'JAPON', 'COREA'],
  JAPON: ['KAMCHATKA', 'COREA'],
  COREA: ['CHINA', 'KAMCHATKA', 'JAPON', 'VIETNAM'],
  IRAN: ['CHECHENIA', 'IRAK', 'TURQUIA', 'INDIA'],
  IRAK: ['IRAN', 'TURQUIA', 'ISRAEL', 'ARABIA'],
  ISRAEL: ['IRAK', 'TURQUIA', 'ARABIA', 'EGIPTO'],
  TURQUIA: ['CHECHENIA', 'IRAN', 'IRAK', 'ISRAEL', 'SERBIA', 'EGIPTO'],
  ARABIA: ['IRAK', 'ISRAEL', 'INDIA'],
  INDIA: ['CHINA', 'IRAN', 'ARABIA', 'VIETNAM', 'MALASIA'],
  VIETNAM: ['CHINA', 'COREA', 'INDIA', 'MALASIA'],
  MALASIA: ['INDIA', 'VIETNAM', 'SUMATRA', 'FILIPINAS'],

  // ===================================
  // AFRICA (8)
  // ===================================
  SAHARA: ['BRASIL', 'ESPAÑA', 'PORTUGAL', 'EGIPTO', 'ETIOPIA', 'NIGERIA', 'MAURITANIA'],
  EGIPTO: ['SAHARA', 'TURQUIA', 'ISRAEL', 'ETIOPIA'],
  ETIOPIA: ['SAHARA', 'EGIPTO', 'NIGERIA', 'ANGOLA', 'MADAGASCAR'],
  NIGERIA: ['SAHARA', 'BRASIL', 'ETIOPIA', 'ANGOLA', 'MAURITANIA'],
  ANGOLA: ['ETIOPIA', 'NIGERIA', 'MAURITANIA', 'SUDAFRICA', 'MADAGASCAR'],
  MAURITANIA: ['URUGUAY', 'SAHARA', 'NIGERIA', 'ANGOLA', 'SUDAFRICA'],
  SUDAFRICA: ['ANGOLA', 'MAURITANIA', 'MADAGASCAR'],
  MADAGASCAR: ['ETIOPIA', 'ANGOLA', 'SUDAFRICA'],

  // ===================================
  // OCEANIA (6)
  // ===================================
  SUMATRA: ['MALASIA', 'FILIPINAS', 'AUSTRALIA'],
  FILIPINAS: ['MALASIA', 'SUMATRA', 'TONGA'],
  TONGA: ['FILIPINAS', 'AUSTRALIA'],
  AUSTRALIA: ['SUMATRA', 'TONGA', 'TASMANIA', 'CHILE'],
  TASMANIA: ['AUSTRALIA', 'NUEVA_ZELANDA'],
  NUEVA_ZELANDA: ['TASMANIA'],
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
