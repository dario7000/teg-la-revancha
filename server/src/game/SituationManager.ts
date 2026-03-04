interface SituationCard {
  id: string;
  type: string;
  description: string;
  color?: string;
}

interface CrisisResult {
  rolls: Record<string, number>;  // playerId -> roll
  losers: string[];               // playerIds who can't draw cards
}

export class SituationManager {
  private deck: SituationCard[];
  private discard: SituationCard[];
  private activeSituation: SituationCard | null;

  constructor(cards: SituationCard[]) {
    this.deck = this.shuffle([...cards]);
    this.discard = [];
    this.activeSituation = null;
  }

  private shuffle<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Draw and reveal a situation card (called at start of each round by first player)
  revealCard(activePlayers: { id: string; color: string }[]): SituationCard {
    // Move previous active card to discard before drawing
    if (this.activeSituation) {
      this.discard.push(this.activeSituation);
      this.activeSituation = null;
    }

    if (this.deck.length === 0) {
      this.deck = this.shuffle([...this.discard]);
      this.discard = [];
    }

    let card = this.deck.pop()!;

    // DESCANSO: if the color is not in the game, draw another
    while (card.type === 'DESCANSO' && card.color &&
           !activePlayers.some(p => p.color === card.color)) {
      this.discard.push(card);
      if (this.deck.length === 0) {
        this.deck = this.shuffle([...this.discard]);
        this.discard = [];
      }
      card = this.deck.pop()!;
    }

    this.activeSituation = card;
    return card;
  }

  getActiveSituation(): SituationCard | null {
    return this.activeSituation;
  }

  // Get combat modifier based on active situation
  getCombatModifier(): 'NONE' | 'NIEVE' | 'VIENTO_A_FAVOR' {
    if (!this.activeSituation) return 'NONE';
    if (this.activeSituation.type === 'NIEVE') return 'NIEVE';
    if (this.activeSituation.type === 'VIENTO_A_FAVOR') return 'VIENTO_A_FAVOR';
    return 'NONE';
  }

  // Check if attack is valid given current situation
  isAttackAllowed(
    attackerCountry: string,
    defenderCountry: string,
    attackerContinent: string,
    defenderContinent: string,
  ): boolean {
    if (!this.activeSituation) return true;

    switch (this.activeSituation.type) {
      case 'FRONTERAS_ABIERTAS':
        // Only attacks FROM one continent TO another
        return attackerContinent !== defenderContinent;

      case 'FRONTERAS_CERRADAS':
        // Only attacks WITHIN same continent
        return attackerContinent === defenderContinent;

      case 'DESCANSO':
        // The specified color can't attack (checked elsewhere)
        return true;

      default:
        return true;
    }
  }

  // Check if a player is in DESCANSO (can only reinforce, no attack/regroup)
  isPlayerInDescanso(playerColor: string): boolean {
    if (!this.activeSituation) return false;
    return this.activeSituation.type === 'DESCANSO' && this.activeSituation.color === playerColor;
  }

  // Resolve CRISIS: each player rolls, lowest can't draw card
  resolveCrisis(playerIds: string[]): CrisisResult {
    const rolls: Record<string, number> = {};
    for (const id of playerIds) {
      rolls[id] = Math.floor(Math.random() * 6) + 1;
    }

    const minRoll = Math.min(...Object.values(rolls));
    const losers = Object.entries(rolls)
      .filter(([_, roll]) => roll === minRoll)
      .map(([id]) => id);

    return { rolls, losers };
  }

  // Calculate extra reinforcements (for REFUERZOS_EXTRAS)
  calculateExtraReinforcements(playerCountries: Record<string, number>): Record<string, number> {
    const extras: Record<string, number> = {};
    for (const [playerId, count] of Object.entries(playerCountries)) {
      extras[playerId] = Math.floor(count / 2);
    }
    return extras;
  }

  // Check if current situation is CRISIS
  isCrisis(): boolean {
    return this.activeSituation?.type === 'CRISIS';
  }

  // Check if current situation gives extra reinforcements
  isExtraReinforcements(): boolean {
    return this.activeSituation?.type === 'REFUERZOS_EXTRAS';
  }
}
