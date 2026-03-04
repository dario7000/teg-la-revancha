export interface MissileAttackResult {
  success: boolean;
  damage: number;
  missileConsumed: boolean;
  error?: string;
}

export class MissileSystem {

  // Calculate distance between two countries (BFS on adjacency graph)
  getDistance(from: string, to: string, adjacency: Record<string, string[]>): number {
    if (from === to) return 0;
    const visited = new Set<string>();
    const queue: [string, number][] = [[from, 0]];
    visited.add(from);
    while (queue.length > 0) {
      const [current, dist] = queue.shift()!;
      for (const neighbor of (adjacency[current] || [])) {
        if (neighbor === to) return dist + 1;
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, dist + 1]);
        }
      }
    }
    return Infinity;
  }

  // Get missile damage based on distance
  getDamage(distance: number): number {
    switch (distance) {
      case 1: return 3;  // adjacent: 3 armies destroyed
      case 2: return 2;  // 1 country between: 2 armies
      case 3: return 1;  // 2 countries between: 1 army
      default: return 0; // out of range
    }
  }

  // Get all countries in missile range from a position
  getTargetsInRange(from: string, adjacency: Record<string, string[]>): { countryId: string; distance: number; damage: number }[] {
    const targets: { countryId: string; distance: number; damage: number }[] = [];
    const visited = new Set<string>();
    const queue: [string, number][] = [[from, 0]];
    visited.add(from);
    while (queue.length > 0) {
      const [current, dist] = queue.shift()!;
      if (dist > 0 && dist <= 3) {
        targets.push({ countryId: current, distance: dist, damage: this.getDamage(dist) });
      }
      if (dist >= 3) continue;
      for (const neighbor of (adjacency[current] || [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, dist + 1]);
        }
      }
    }
    return targets;
  }

  // Validate and execute missile attack
  fireMissile(
    fromCountry: string,
    targetCountry: string,
    territories: Record<string, { owner: string; armies: number; missiles: number }>,
    adjacency: Record<string, string[]>,
    pacts?: { countries: [string, string] }[], // active pacts for path checking
  ): MissileAttackResult {
    const from = territories[fromCountry];
    const target = territories[targetCountry];
    if (!from || !target) return { success: false, damage: 0, missileConsumed: false, error: 'Invalid countries' };

    // Must have at least 1 missile
    if (from.missiles < 1) return { success: false, damage: 0, missileConsumed: false, error: 'No missiles available' };

    // Can't attack own country
    if (from.owner === target.owner) return { success: false, damage: 0, missileConsumed: false, error: 'Cannot attack own country' };

    // Check distance (max 3 borders)
    const distance = this.getDistance(fromCountry, targetCountry, adjacency);
    if (distance > 3 || distance === 0) return { success: false, damage: 0, missileConsumed: false, error: 'Target out of range' };

    const damage = this.getDamage(distance);

    // Target must have MORE armies than damage (must survive with at least 1)
    if (target.armies <= damage) {
      return { success: false, damage: 0, missileConsumed: false, error: `Target needs more than ${damage} armies to be attacked (has ${target.armies})` };
    }

    // MISSILE vs MISSILE: enemy missile blocks attack
    if (target.missiles > 0) {
      if (from.missiles <= target.missiles) {
        return { success: false, damage: 0, missileConsumed: false, error: 'Target has missile defense (need more missiles than defender)' };
      }
      // Attacker has more missiles: can attack, defender's missile acts as shield but is NOT consumed
      // Attacker loses 1 missile, target loses armies
    }

    return { success: true, damage, missileConsumed: true };
  }

  // Apply missile attack effects to territories
  applyMissileAttack(
    fromCountry: string,
    targetCountry: string,
    damage: number,
    territories: Record<string, { owner: string; armies: number; missiles: number }>,
  ): void {
    territories[fromCountry].missiles -= 1;  // missile consumed
    territories[targetCountry].armies -= damage;
  }

  // Incorporate missile: convert 6 armies into 1 missile
  incorporateMissile(
    countryId: string,
    territories: Record<string, { owner: string; armies: number; missiles: number }>,
  ): boolean {
    const territory = territories[countryId];
    if (!territory) return false;
    if (territory.armies < 7) return false; // need 6 for missile + 1 minimum occupation
    territory.armies -= 6;
    territory.missiles += 1;
    return true;
  }

  // Regroup missile between adjacent own countries
  regroupMissile(
    from: string,
    to: string,
    count: number,
    territories: Record<string, { owner: string; armies: number; missiles: number }>,
    adjacency: Record<string, string[]>,
  ): boolean {
    const fromT = territories[from];
    const toT = territories[to];
    if (!fromT || !toT) return false;
    if (fromT.owner !== toT.owner) return false;
    if (fromT.missiles < count) return false;
    if (!(adjacency[from] || []).includes(to)) return false;
    fromT.missiles -= count;
    toT.missiles += count;
    return true;
  }
}
