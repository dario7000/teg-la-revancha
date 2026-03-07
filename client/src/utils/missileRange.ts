// =============================================================================
// Missile range BFS utility (client-side)
//
// Given a source country and adjacency graph, computes all countries within
// missile range (up to 3 borders away) grouped by distance.
// =============================================================================

export interface MissileRangeResult {
  /** Countries at distance 1 (adjacent) - 3 damage */
  distance1: string[];
  /** Countries at distance 2 (1 country between) - 2 damage */
  distance2: string[];
  /** Countries at distance 3 (2 countries between) - 1 damage */
  distance3: string[];
}

/**
 * Get missile damage for a given distance.
 */
export function getMissileDamage(distance: number): number {
  switch (distance) {
    case 1: return 3;
    case 2: return 2;
    case 3: return 1;
    default: return 0;
  }
}

/**
 * BFS to find all countries within missile range (1-3 borders) from a source.
 * Only returns enemy countries (those not owned by `ownerPlayerId`).
 *
 * @param source - The country ID firing the missile
 * @param adjacency - Adjacency map (countryId -> neighbor countryId[])
 * @param territories - Territory ownership map (countryId -> { owner })
 * @param ownerPlayerId - The player ID who owns the source country
 * @returns MissileRangeResult grouped by distance
 */
export function computeMissileRange(
  source: string,
  adjacency: Record<string, string[]>,
  territories: Record<string, { owner: string }>,
  ownerPlayerId: string,
): MissileRangeResult {
  const result: MissileRangeResult = {
    distance1: [],
    distance2: [],
    distance3: [],
  };

  const visited = new Set<string>();
  const queue: [string, number][] = [[source, 0]];
  visited.add(source);

  while (queue.length > 0) {
    const [current, dist] = queue.shift()!;

    // Add enemy countries to the appropriate distance bucket
    if (dist > 0 && dist <= 3) {
      const territory = territories[current];
      if (territory && territory.owner !== ownerPlayerId) {
        if (dist === 1) result.distance1.push(current);
        else if (dist === 2) result.distance2.push(current);
        else if (dist === 3) result.distance3.push(current);
      }
    }

    // Stop expanding beyond distance 3
    if (dist >= 3) continue;

    const neighbors = adjacency[current] ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }

  return result;
}
