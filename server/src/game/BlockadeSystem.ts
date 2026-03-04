export interface BlockadeInfo {
  blockedCountry: string;
  blockerPlayer: string;
  blockerCountries: string[];
}

export class BlockadeSystem {
  checkBlockade(
    countryId: string,
    countryOwner: string,
    adjacentCountries: string[],
    territories: Record<string, { owner: string; armies: number }>,
  ): BlockadeInfo | null {
    if (adjacentCountries.length < 3) return null;

    let blockerPlayer: string | null = null;
    const blockerCountries: string[] = [];

    for (const adjId of adjacentCountries) {
      const adj = territories[adjId];
      if (!adj) return null;
      if (adj.owner === countryOwner) return null;

      if (blockerPlayer === null) {
        blockerPlayer = adj.owner;
      } else if (adj.owner !== blockerPlayer) {
        return null;
      }

      if (adj.armies < 2) return null;
      blockerCountries.push(adjId);
    }

    if (!blockerPlayer) return null;

    return { blockedCountry: countryId, blockerPlayer, blockerCountries };
  }

  checkAllBlockades(
    territories: Record<string, { owner: string; armies: number }>,
    adjacency: Record<string, string[]>,
  ): BlockadeInfo[] {
    const blockades: BlockadeInfo[] = [];
    for (const countryId of Object.keys(territories)) {
      const territory = territories[countryId];
      const adjacent = adjacency[countryId] || [];
      const blockade = this.checkBlockade(countryId, territory.owner, adjacent, territories);
      if (blockade) blockades.push(blockade);
    }
    return blockades;
  }

  isBlockadeBroken(
    blockade: BlockadeInfo,
    territories: Record<string, { owner: string; armies: number }>,
    playerCountryCount: number,
  ): boolean {
    if (playerCountryCount <= 1) return true;
    for (const blockerId of blockade.blockerCountries) {
      const blocker = territories[blockerId];
      if (!blocker) return true;
      if (blocker.owner !== blockade.blockerPlayer) return true;
      if (blocker.armies < 2) return true;
    }
    return false;
  }

  canReceiveReinforcements(isBlocked: boolean, isInitialPlacement: boolean): boolean {
    if (!isBlocked) return true;
    if (isInitialPlacement) return true;
    return false;
  }
}
