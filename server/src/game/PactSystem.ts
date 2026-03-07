import {
  Pact,
  PactType,
  PactDetails,
  Condominium,
  InternationalZone,
} from '@shared/types/Pacts';
import { PlayerId, CountryId } from '@shared/types/GameState';

export class PactSystem {
  private pacts: Map<string, Pact>;
  private condominiums: Map<CountryId, Condominium>;
  private internationalZones: Set<CountryId>;
  private pactCounter: number;

  constructor() {
    this.pacts = new Map();
    this.condominiums = new Map();
    this.internationalZones = new Set();
    this.pactCounter = 0;
  }

  // ---------------------------------------------------------------------------
  // ID generation
  // ---------------------------------------------------------------------------

  private generatePactId(): string {
    this.pactCounter++;
    return `pact_${this.pactCounter}`;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private playerPairKey(p1: PlayerId, p2: PlayerId): string {
    return [p1, p2].sort().join('::');
  }

  private pactInvolves(pact: Pact, playerId: PlayerId): boolean {
    return pact.players[0] === playerId || pact.players[1] === playerId;
  }

  private pactInvolvesBoth(pact: Pact, p1: PlayerId, p2: PlayerId): boolean {
    return this.pactInvolves(pact, p1) && this.pactInvolves(pact, p2);
  }

  private hasDuplicateActivePact(
    player1: PlayerId,
    player2: PlayerId,
    type: PactType,
    details?: PactDetails,
  ): boolean {
    for (const pact of this.pacts.values()) {
      if (!pact.active) continue;
      if (pact.type !== type) continue;
      if (!this.pactInvolvesBoth(pact, player1, player2)) continue;

      // For types that are scoped to specific countries/continents, check
      // whether the scope overlaps rather than just checking the type.
      if (details) {
        if (this.detailsOverlap(pact.details, details)) return true;
      } else {
        return true;
      }
    }
    return false;
  }

  private detailsOverlap(a: PactDetails, b: PactDetails): boolean {
    if (a.type !== b.type) return false;

    switch (a.type) {
      case 'BETWEEN_COUNTRIES': {
        const bTyped = b as { type: 'BETWEEN_COUNTRIES'; countries: [CountryId, CountryId] };
        const sortedA = [...a.countries].sort();
        const sortedB = [...bTyped.countries].sort();
        return sortedA[0] === sortedB[0] && sortedA[1] === sortedB[1];
      }
      case 'WITHIN_CONTINENT': {
        const bTyped = b as { type: 'WITHIN_CONTINENT'; continent: string };
        return a.continent === bTyped.continent;
      }
      case 'BETWEEN_CONTINENT_BORDERS': {
        const bTyped = b as { type: 'BETWEEN_CONTINENT_BORDERS'; continents: [string, string] };
        const sortedA = [...a.continents].sort();
        const sortedB = [...bTyped.continents].sort();
        return sortedA[0] === sortedB[0] && sortedA[1] === sortedB[1];
      }
      case 'WORLDWIDE':
        return true;
      case 'INTERNATIONAL_ZONE': {
        const bTyped = b as { type: 'INTERNATIONAL_ZONE'; country: CountryId };
        return a.country === bTyped.country;
      }
      case 'AGGRESSION_PACT': {
        const bTyped = b as { type: 'AGGRESSION_PACT'; target: CountryId; duringTurnOf: PlayerId };
        return a.target === bTyped.target && a.duringTurnOf === bTyped.duringTurnOf;
      }
      default:
        return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Core methods
  // ---------------------------------------------------------------------------

  proposePact(
    fromPlayer: PlayerId,
    toPlayer: PlayerId,
    type: PactType,
    details?: PactDetails,
    currentTurn: number = 0,
  ): string {
    if (fromPlayer === toPlayer) {
      throw new Error('Cannot propose a pact with yourself');
    }

    if (!details) {
      details = this.defaultDetailsForType(type, fromPlayer);
    }

    if (details.type !== type) {
      throw new Error(`Details type "${details.type}" does not match pact type "${type}"`);
    }

    if (this.hasDuplicateActivePact(fromPlayer, toPlayer, type, details)) {
      throw new Error(
        `An active pact of type "${type}" already exists between these players with the same scope`,
      );
    }

    const pactId = this.generatePactId();
    const pact: Pact = {
      id: pactId,
      type,
      players: [fromPlayer, toPlayer],
      details,
      active: false, // not active until accepted
      createdOnTurn: currentTurn,
    };

    this.pacts.set(pactId, pact);
    return pactId;
  }

  acceptPact(pactId: string, playerId: PlayerId): boolean {
    const pact = this.pacts.get(pactId);
    if (!pact) return false;
    if (pact.active) return false;

    // Only the recipient (second player) can accept
    if (pact.players[1] !== playerId) return false;

    pact.active = true;
    return true;
  }

  rejectPact(pactId: string, playerId: PlayerId): boolean {
    const pact = this.pacts.get(pactId);
    if (!pact) return false;
    if (pact.active) return false;

    // Only the recipient can reject; the proposer can also cancel
    if (!this.pactInvolves(pact, playerId)) return false;

    this.pacts.delete(pactId);
    return true;
  }

  breakPact(pactId: string, playerId: PlayerId, currentTurn: number = 0): void {
    const pact = this.pacts.get(pactId);
    if (!pact) {
      throw new Error(`Pact "${pactId}" not found`);
    }
    if (!pact.active) {
      throw new Error(`Pact "${pactId}" is not active`);
    }
    if (!this.pactInvolves(pact, playerId)) {
      throw new Error(`Player "${playerId}" is not part of pact "${pactId}"`);
    }

    pact.active = false;
    pact.breakAnnounced = { by: playerId, onTurn: currentTurn };

    // If the pact was INTERNATIONAL_ZONE, remove the zone
    if (pact.details.type === 'INTERNATIONAL_ZONE') {
      this.internationalZones.delete(pact.details.country);
    }
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  getPact(pactId: string): Pact | undefined {
    return this.pacts.get(pactId);
  }

  getPactsBetween(player1: PlayerId, player2: PlayerId): Pact[] {
    const result: Pact[] = [];
    for (const pact of this.pacts.values()) {
      if (this.pactInvolvesBoth(pact, player1, player2)) {
        result.push(pact);
      }
    }
    return result;
  }

  getPlayerPacts(playerId: PlayerId): Pact[] {
    const result: Pact[] = [];
    for (const pact of this.pacts.values()) {
      if (this.pactInvolves(pact, playerId)) {
        result.push(pact);
      }
    }
    return result;
  }

  hasActivePact(player1: PlayerId, player2: PlayerId, type: PactType): boolean {
    for (const pact of this.pacts.values()) {
      if (!pact.active) continue;
      if (pact.type !== type) continue;
      if (this.pactInvolvesBoth(pact, player1, player2)) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // NO_AGGRESSION / attack validation
  // ---------------------------------------------------------------------------

  /**
   * Checks whether an attacker can attack a defender based on pact constraints.
   *
   * The following pact types restrict attacks:
   * - BETWEEN_COUNTRIES: cannot attack between the two specified countries
   * - WITHIN_CONTINENT: cannot attack any territory of the other player within
   *   the specified continent
   * - BETWEEN_CONTINENT_BORDERS: cannot attack the other player's territories
   *   that border the two specified continents
   * - WORLDWIDE: cannot attack the other player anywhere
   *
   * If the attack would violate a pact, `wouldBreakPact` contains the pact id.
   */
  canAttack(
    attacker: PlayerId,
    defender: PlayerId,
    attackerCountry?: CountryId,
    defenderCountry?: CountryId,
    countryToContinent?: Record<CountryId, string>,
  ): { allowed: boolean; wouldBreakPact?: string } {
    for (const pact of this.pacts.values()) {
      if (!pact.active) continue;
      if (!this.pactInvolvesBoth(pact, attacker, defender)) continue;

      switch (pact.details.type) {
        case 'WORLDWIDE':
          return { allowed: false, wouldBreakPact: pact.id };

        case 'BETWEEN_COUNTRIES': {
          if (attackerCountry && defenderCountry) {
            const countries = pact.details.countries;
            const pair = [attackerCountry, defenderCountry].sort();
            const pactPair = [...countries].sort();
            if (pair[0] === pactPair[0] && pair[1] === pactPair[1]) {
              return { allowed: false, wouldBreakPact: pact.id };
            }
          }
          break;
        }

        case 'WITHIN_CONTINENT': {
          if (
            attackerCountry &&
            defenderCountry &&
            countryToContinent
          ) {
            const continent = pact.details.continent;
            if (
              countryToContinent[attackerCountry] === continent &&
              countryToContinent[defenderCountry] === continent
            ) {
              return { allowed: false, wouldBreakPact: pact.id };
            }
          }
          break;
        }

        case 'BETWEEN_CONTINENT_BORDERS': {
          if (
            attackerCountry &&
            defenderCountry &&
            countryToContinent
          ) {
            const continents = [...pact.details.continents].sort();
            const attackContinent = countryToContinent[attackerCountry];
            const defendContinent = countryToContinent[defenderCountry];
            const pair = [attackContinent, defendContinent].sort();
            if (pair[0] === continents[0] && pair[1] === continents[1]) {
              return { allowed: false, wouldBreakPact: pact.id };
            }
          }
          break;
        }

        case 'AGGRESSION_PACT':
          // AGGRESSION_PACT restricts attacking a specific target country
          if (defenderCountry && pact.details.target === defenderCountry) {
            return { allowed: false, wouldBreakPact: pact.id };
          }
          break;

        default:
          break;
      }
    }

    // Check international zones: cannot attack an international zone
    if (defenderCountry && this.isInternationalZone(defenderCountry)) {
      return { allowed: false };
    }

    return { allowed: true };
  }

  handleAttackViolation(attackerId: PlayerId, defenderId: PlayerId, currentTurn: number = 0): void {
    for (const pact of this.pacts.values()) {
      if (!pact.active) continue;
      if (!this.pactInvolvesBoth(pact, attackerId, defenderId)) continue;

      // Break all non-aggression-style pacts between the players
      const nonAggressionTypes: PactType[] = [
        'BETWEEN_COUNTRIES',
        'WITHIN_CONTINENT',
        'BETWEEN_CONTINENT_BORDERS',
        'WORLDWIDE',
        'AGGRESSION_PACT',
      ];
      if (nonAggressionTypes.includes(pact.type)) {
        pact.active = false;
        pact.breakAnnounced = { by: attackerId, onTurn: currentTurn };
      }
    }
  }

  // ---------------------------------------------------------------------------
  // PASSAGE — movement through another player's territory
  // ---------------------------------------------------------------------------

  /**
   * In the TEG pact system, passage rights are implied by WITHIN_CONTINENT
   * and WORLDWIDE pacts. If players have an active non-aggression pact at
   * a scope that covers the relevant territories, passage is permitted.
   */
  canPassThrough(
    playerId: PlayerId,
    throughPlayerId: PlayerId,
    country?: CountryId,
    countryToContinent?: Record<CountryId, string>,
  ): boolean {
    for (const pact of this.pacts.values()) {
      if (!pact.active) continue;
      if (!this.pactInvolvesBoth(pact, playerId, throughPlayerId)) continue;

      switch (pact.details.type) {
        case 'WORLDWIDE':
          return true;

        case 'WITHIN_CONTINENT':
          if (country && countryToContinent) {
            if (countryToContinent[country] === pact.details.continent) {
              return true;
            }
          } else {
            // Without location info, any continent pact grants passage
            return true;
          }
          break;

        case 'BETWEEN_CONTINENT_BORDERS':
          if (country && countryToContinent) {
            const continents = pact.details.continents;
            const cc = countryToContinent[country];
            if (cc === continents[0] || cc === continents[1]) {
              return true;
            }
          } else {
            return true;
          }
          break;

        default:
          break;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // TRADE — card trading between players
  // ---------------------------------------------------------------------------

  /**
   * Players can trade cards when they have any active pact between them.
   * The existence of an active pact of any type implies a level of cooperation
   * that enables card trading.
   */
  canTradeWith(player1: PlayerId, player2: PlayerId): boolean {
    for (const pact of this.pacts.values()) {
      if (!pact.active) continue;
      if (this.pactInvolvesBoth(pact, player1, player2)) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // SHARED_ATTACK — cooperative attack contributions
  // ---------------------------------------------------------------------------

  /**
   * Returns the partner player who could contribute armies during an attack,
   * if they have an AGGRESSION_PACT targeting the same country.
   */
  getSharedAttackPartner(
    attackerId: PlayerId,
    targetCountry: CountryId,
  ): PlayerId | null {
    for (const pact of this.pacts.values()) {
      if (!pact.active) continue;
      if (pact.details.type !== 'AGGRESSION_PACT') continue;
      if (!this.pactInvolves(pact, attackerId)) continue;

      if (pact.details.target === targetCountry) {
        // Return the other player in the pact
        return pact.players[0] === attackerId ? pact.players[1] : pact.players[0];
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // CONDOMINIUM — jointly owned territory
  // ---------------------------------------------------------------------------

  createCondominium(
    countryId: CountryId,
    player1: PlayerId,
    player2: PlayerId,
    armies: number,
  ): void {
    if (player1 === player2) {
      throw new Error('Condominium requires two different players');
    }
    if (this.isInternationalZone(countryId)) {
      throw new Error(`Cannot create condominium on international zone "${countryId}"`);
    }
    if (this.condominiums.has(countryId)) {
      throw new Error(`Country "${countryId}" is already a condominium`);
    }
    if (armies < 0) {
      throw new Error('Army count cannot be negative');
    }

    const halfArmies = Math.floor(armies / 2);
    const remainder = armies % 2;

    const condominium: Condominium = {
      country: countryId,
      owners: [player1, player2],
      armies: {
        [player1]: halfArmies + remainder,
        [player2]: halfArmies,
      },
      missiles: {
        [player1]: 0,
        [player2]: 0,
      },
    };

    this.condominiums.set(countryId, condominium);
  }

  isCondominium(countryId: CountryId): boolean {
    return this.condominiums.has(countryId);
  }

  getCondominiumOwners(countryId: CountryId): [PlayerId, PlayerId] | null {
    const condo = this.condominiums.get(countryId);
    if (!condo) return null;
    return [...condo.owners] as [PlayerId, PlayerId];
  }

  getCondominium(countryId: CountryId): Condominium | null {
    return this.condominiums.get(countryId) ?? null;
  }

  getCondominiums(): Condominium[] {
    return Array.from(this.condominiums.values());
  }

  removeCondominium(countryId: CountryId): void {
    this.condominiums.delete(countryId);
  }

  // ---------------------------------------------------------------------------
  // INTERNATIONAL ZONE — neutral territory
  // ---------------------------------------------------------------------------

  createInternationalZone(countryId: CountryId): void {
    if (this.condominiums.has(countryId)) {
      throw new Error(`Cannot create international zone on condominium "${countryId}"`);
    }
    if (this.internationalZones.has(countryId)) {
      throw new Error(`Country "${countryId}" is already an international zone`);
    }

    this.internationalZones.add(countryId);
  }

  isInternationalZone(countryId: CountryId): boolean {
    return this.internationalZones.has(countryId);
  }

  getInternationalZonesList(): CountryId[] {
    return Array.from(this.internationalZones);
  }

  removeInternationalZone(countryId: CountryId): void {
    this.internationalZones.delete(countryId);
  }

  // ---------------------------------------------------------------------------
  // Cleanup — when a player is eliminated
  // ---------------------------------------------------------------------------

  removePlayerPacts(playerId: PlayerId): void {
    const toRemove: string[] = [];

    for (const [pactId, pact] of this.pacts.entries()) {
      if (this.pactInvolves(pact, playerId)) {
        // If the pact created an international zone, remove it too
        if (pact.active && pact.details.type === 'INTERNATIONAL_ZONE') {
          this.internationalZones.delete(pact.details.country);
        }
        toRemove.push(pactId);
      }
    }

    for (const pactId of toRemove) {
      this.pacts.delete(pactId);
    }

    // Remove condominiums involving this player
    const condosToRemove: CountryId[] = [];
    for (const [countryId, condo] of this.condominiums.entries()) {
      if (condo.owners[0] === playerId || condo.owners[1] === playerId) {
        condosToRemove.push(countryId);
      }
    }
    for (const countryId of condosToRemove) {
      this.condominiums.delete(countryId);
    }
  }

  // ---------------------------------------------------------------------------
  // State serialization
  // ---------------------------------------------------------------------------

  getState(): {
    pacts: Pact[];
    condominiums: Condominium[];
    internationalZones: string[];
  } {
    return {
      pacts: Array.from(this.pacts.values()),
      condominiums: Array.from(this.condominiums.values()),
      internationalZones: Array.from(this.internationalZones),
    };
  }

  // ---------------------------------------------------------------------------
  // State restoration
  // ---------------------------------------------------------------------------

  loadState(state: {
    pacts: Pact[];
    condominiums: Condominium[];
    internationalZones: string[];
  }): void {
    this.pacts.clear();
    this.condominiums.clear();
    this.internationalZones.clear();

    for (const pact of state.pacts) {
      this.pacts.set(pact.id, pact);

      // Update the counter so new IDs don't collide
      const match = pact.id.match(/^pact_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= this.pactCounter) {
          this.pactCounter = num;
        }
      }
    }

    for (const condo of state.condominiums) {
      this.condominiums.set(condo.country, condo);
    }

    for (const zone of state.internationalZones) {
      this.internationalZones.add(zone);
    }
  }

  // ---------------------------------------------------------------------------
  // Private: default details
  // ---------------------------------------------------------------------------

  private defaultDetailsForType(type: PactType, fromPlayer: PlayerId): PactDetails {
    switch (type) {
      case 'WORLDWIDE':
        return { type: 'WORLDWIDE' };
      case 'BETWEEN_COUNTRIES':
        throw new Error('BETWEEN_COUNTRIES pact requires details with specific countries');
      case 'WITHIN_CONTINENT':
        throw new Error('WITHIN_CONTINENT pact requires details with a specific continent');
      case 'BETWEEN_CONTINENT_BORDERS':
        throw new Error('BETWEEN_CONTINENT_BORDERS pact requires details with specific continents');
      case 'INTERNATIONAL_ZONE':
        throw new Error('INTERNATIONAL_ZONE pact requires details with a specific country');
      case 'AGGRESSION_PACT':
        throw new Error('AGGRESSION_PACT pact requires details with a target country');
      default:
        throw new Error(`Unknown pact type: ${type}`);
    }
  }
}
