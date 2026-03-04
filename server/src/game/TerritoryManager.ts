export interface TerritoryState {
  owner: string;
  armies: number;
  missiles: number;
  coOwner?: string;
  coOwnerArmies?: number;
  coOwnerMissiles?: number;
  isBlocked: boolean;
}

export class TerritoryManager {
  private territories: Record<string, TerritoryState>;

  constructor(territories: Record<string, TerritoryState>) {
    this.territories = territories;
  }

  getTerritory(countryId: string): TerritoryState | undefined {
    return this.territories[countryId];
  }

  getAllTerritories(): Record<string, TerritoryState> {
    return { ...this.territories };
  }

  getPlayerCountries(playerId: string): string[] {
    return Object.entries(this.territories)
      .filter(([_, t]) => t.owner === playerId)
      .map(([id]) => id);
  }

  countPlayerCountries(playerId: string): number {
    return this.getPlayerCountries(playerId).length;
  }

  ownsContinent(playerId: string, continentCountries: string[]): boolean {
    return continentCountries.every(c => {
      const t = this.territories[c];
      return t && t.owner === playerId;
    });
  }

  getOwnedContinents(playerId: string, continentsMap: Record<string, string[]>): string[] {
    return Object.entries(continentsMap)
      .filter(([_, countries]) => this.ownsContinent(playerId, countries))
      .map(([id]) => id);
  }

  placeArmies(countryId: string, count: number): void {
    const t = this.territories[countryId];
    if (t) t.armies += count;
  }

  removeArmies(countryId: string, count: number): void {
    const t = this.territories[countryId];
    if (t) t.armies = Math.max(0, t.armies - count);
  }

  conquer(countryId: string, newOwner: string, armiesMoved: number): void {
    const t = this.territories[countryId];
    if (t) {
      t.owner = newOwner;
      t.armies = armiesMoved;
      t.isBlocked = false;
      delete t.coOwner;
      delete t.coOwnerArmies;
      delete t.coOwnerMissiles;
    }
  }

  moveArmies(from: string, to: string, count: number): boolean {
    const fromT = this.territories[from];
    const toT = this.territories[to];
    if (!fromT || !toT) return false;
    if (fromT.armies - count < 1) return false;
    if (fromT.owner !== toT.owner) return false;
    fromT.armies -= count;
    toT.armies += count;
    return true;
  }

  moveMissiles(from: string, to: string, count: number): boolean {
    const fromT = this.territories[from];
    const toT = this.territories[to];
    if (!fromT || !toT) return false;
    if (fromT.missiles < count) return false;
    if (fromT.owner !== toT.owner) return false;
    fromT.missiles -= count;
    toT.missiles += count;
    return true;
  }

  convertToMissile(countryId: string): boolean {
    const t = this.territories[countryId];
    if (!t) return false;
    if (t.armies < 7) return false;
    t.armies -= 6;
    t.missiles += 1;
    return true;
  }

  setBlocked(countryId: string, blocked: boolean): void {
    const t = this.territories[countryId];
    if (t) t.isBlocked = blocked;
  }

  static distributeCountries(countryIds: string[], playerIds: string[]): Record<string, TerritoryState> {
    const territories: Record<string, TerritoryState> = {};
    const shuffled = [...countryIds].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i++) {
      territories[shuffled[i]] = {
        owner: playerIds[i % playerIds.length],
        armies: 1,
        missiles: 0,
        isBlocked: false,
      };
    }
    return territories;
  }
}
