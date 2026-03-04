import type { OccupationRequirement, Objective } from '../data/objectives';

interface CountryData {
  id: string;
  continent: string;
  isIsland: boolean;
}

interface EliminatedPlayer {
  id: string;
  eliminatedBy: string | null;
}

interface PlayerInfo {
  id: string;
  color: string;
  eliminated?: boolean;
}

export class ObjectiveChecker {
  /**
   * Check if an occupation objective is met.
   *
   * Each requirement can be:
   *   - A continent requirement: need N countries in that continent
   *   - An island requirement: need N islands across M continents
   *   - A general count: need N countries total (anywhere on the map)
   */
  checkOccupationObjective(
    requirements: OccupationRequirement[],
    playerCountries: string[],
    countriesData: CountryData[],
  ): boolean {
    const playerCountrySet = new Set(playerCountries);

    for (const req of requirements) {
      if (req.isIsland) {
        // Special: need N islands across M continents
        const ownedIslands = countriesData.filter(
          (cd) => cd.isIsland && playerCountrySet.has(cd.id),
        );

        if (ownedIslands.length < req.count) return false;

        if (req.minContinents) {
          const continentsWithIslands = new Set(
            ownedIslands.map((cd) => cd.continent),
          );
          if (continentsWithIslands.size < req.minContinents) return false;
        }
      } else if (req.continent) {
        // Continent-specific requirement: own N countries in this continent
        const owned = countriesData.filter(
          (cd) => cd.continent === req.continent && playerCountrySet.has(cd.id),
        );
        if (owned.length < req.count) return false;
      } else {
        // General count: own N countries anywhere
        if (playerCountries.length < req.count) return false;
      }
    }

    return true;
  }

  /**
   * Check if a destruction objective is met.
   *
   * The target player must have been eliminated, and specifically eliminated
   * by the checking player.
   */
  checkDestructionObjective(
    targetColor: string,
    targetPlayerId: string | null,
    eliminatedPlayers: EliminatedPlayer[],
    checkingPlayerId: string,
  ): boolean {
    if (!targetPlayerId) return false;

    const target = eliminatedPlayers.find((p) => p.id === targetPlayerId);
    return target !== undefined && target.eliminatedBy === checkingPlayerId;
  }

  /**
   * Check the common victory condition: own 45 or more countries.
   */
  checkCommonVictory(playerCountryCount: number): boolean {
    return playerCountryCount >= 45;
  }

  /**
   * Resolve which player is the actual target for a destruction objective.
   *
   * Rules:
   *   - If the target color is the player's own color, fallback to player to the right.
   *   - If the target color is not in the game (no player has it), fallback to player to the right.
   *   - If the target color player is already eliminated, fallback to player to the right.
   *   - "Player to the right" means the next player in turn order (clockwise).
   */
  resolveDestructionTarget(
    objectiveTargetColor: string,
    playerColor: string,
    players: PlayerInfo[],
    playerIndex: number,
  ): string {
    // Find active (non-eliminated) player with the target color
    if (objectiveTargetColor !== playerColor) {
      const target = players.find(
        (p) => p.color === objectiveTargetColor && !p.eliminated,
      );
      if (target) return target.id;
    }

    // Fallback: find the next non-eliminated player to the right (clockwise)
    for (let offset = 1; offset < players.length; offset++) {
      const idx = (playerIndex + offset) % players.length;
      if (!players[idx].eliminated) {
        return players[idx].id;
      }
    }

    // Should not happen in a valid game, but return self as last resort
    return players[playerIndex].id;
  }

  /**
   * Resolve the target for a DESTROY_LEFT objective.
   * "Left" means the previous player in turn order (counter-clockwise).
   */
  resolveDestroyLeftTarget(
    players: PlayerInfo[],
    playerIndex: number,
  ): string {
    for (let offset = 1; offset < players.length; offset++) {
      const idx = (playerIndex - offset + players.length) % players.length;
      if (!players[idx].eliminated) {
        return players[idx].id;
      }
    }

    return players[playerIndex].id;
  }

  /**
   * Full victory check for a player.
   *
   * Checks in order:
   *   1. Common victory (45+ countries)
   *   2. Specific objective (OCCUPATION, DESTRUCTION, or DESTROY_LEFT)
   *
   * Returns { won, method } where method describes the victory type.
   */
  checkVictory(
    objective: Objective,
    playerCountries: string[],
    countriesData: CountryData[],
    eliminatedPlayers: EliminatedPlayer[],
    playerId: string,
    resolvedTargetId?: string | null,
  ): { won: boolean; method: string } {
    // Check common victory first (45 countries wins regardless of objective)
    if (this.checkCommonVictory(playerCountries.length)) {
      return { won: true, method: 'COMMON_45' };
    }

    // Check specific objective
    switch (objective.type) {
      case 'OCCUPATION': {
        if (
          this.checkOccupationObjective(
            objective.requirements,
            playerCountries,
            countriesData,
          )
        ) {
          return { won: true, method: 'OBJECTIVE' };
        }
        break;
      }

      case 'DESTRUCTION': {
        const targetId = resolvedTargetId ?? null;
        if (
          this.checkDestructionObjective(
            objective.targetColor,
            targetId,
            eliminatedPlayers,
            playerId,
          )
        ) {
          return { won: true, method: 'OBJECTIVE' };
        }
        break;
      }

      case 'DESTROY_LEFT': {
        // DESTROY_LEFT uses the same logic as DESTRUCTION but with
        // the target being the player to the left.
        // The resolvedTargetId should already be set by the caller.
        const targetId = resolvedTargetId ?? null;
        if (targetId) {
          const target = eliminatedPlayers.find((p) => p.id === targetId);
          if (target && target.eliminatedBy === playerId) {
            return { won: true, method: 'OBJECTIVE' };
          }
        }
        break;
      }
    }

    return { won: false, method: '' };
  }

  /**
   * Check all players for victory conditions.
   * Returns the first player found to have won, or null.
   */
  checkAllPlayersVictory(
    players: {
      id: string;
      color: string;
      eliminated?: boolean;
      objective: Objective;
      countries: string[];
    }[],
    countriesData: CountryData[],
    eliminatedPlayers: EliminatedPlayer[],
  ): { playerId: string; method: string } | null {
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (player.eliminated) continue;

      // Resolve destruction target if needed
      let resolvedTargetId: string | null = null;
      if (player.objective.type === 'DESTRUCTION') {
        resolvedTargetId = this.resolveDestructionTarget(
          player.objective.targetColor,
          player.color,
          players,
          i,
        );
      } else if (player.objective.type === 'DESTROY_LEFT') {
        resolvedTargetId = this.resolveDestroyLeftTarget(players, i);
      }

      const result = this.checkVictory(
        player.objective,
        player.countries,
        countriesData,
        eliminatedPlayers,
        player.id,
        resolvedTargetId,
      );

      if (result.won) {
        return { playerId: player.id, method: result.method };
      }
    }

    return null;
  }
}
