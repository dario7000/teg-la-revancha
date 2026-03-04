import type { CardSymbol } from '../data/countryCards';
import type { ContinentId } from '../data/countries';
import type { ContinentEquivalence } from './TradeCalculator';

export interface ContinentCardState {
  continent: string;
  heldBy: string | null;
  usedBy: string[];
}

const ALL_CONTINENTS: ContinentId[] = [
  'AMERICA_DEL_NORTE',
  'AMERICA_CENTRAL',
  'AMERICA_DEL_SUR',
  'EUROPA',
  'ASIA',
  'AFRICA',
  'OCEANIA',
];

export class ContinentCardManager {
  private cards: Record<string, ContinentCardState>;

  constructor() {
    this.cards = {};
    for (const continent of ALL_CONTINENTS) {
      this.cards[continent] = {
        continent,
        heldBy: null,
        usedBy: [],
      };
    }
  }

  /**
   * Award a continent card when a player conquers all countries in that continent.
   * Returns true if the card was successfully awarded.
   */
  awardCard(continent: string, playerId: string): boolean {
    const card = this.cards[continent];
    if (!card) return false;

    // Already held by this player
    if (card.heldBy === playerId) return false;

    // Another player currently holds it - this shouldn't happen
    // if the caller is correctly checking continent control,
    // but we handle it by reassigning.
    card.heldBy = playerId;
    return true;
  }

  /**
   * Remove a continent card when a player loses control of a continent.
   * The card is revoked only if it hasn't been used yet by this player.
   * Returns true if the card was successfully revoked.
   */
  revokeCard(continent: string, playerId: string): boolean {
    const card = this.cards[continent];
    if (!card) return false;
    if (card.heldBy !== playerId) return false;

    // If the player already used this card, it stays marked as used
    // but is no longer held. It cannot be used again anyway.
    card.heldBy = null;
    return true;
  }

  /**
   * Use a continent card as part of a trade.
   * A player can only use it if they currently hold it AND haven't used it before.
   * Returns true if successfully used.
   */
  useCard(continent: string, playerId: string): boolean {
    const card = this.cards[continent];
    if (!card) return false;
    if (card.heldBy !== playerId) return false;
    if (card.usedBy.includes(playerId)) return false;

    card.usedBy.push(playerId);
    return true;
  }

  /**
   * Get the trade equivalence value for a continent card.
   *
   * - Am. Norte, Europa, Asia = full trade by themselves (AVION + BARCO + TANQUE)
   * - Am. Sur = AVION + TANQUE (2 of 3)
   * - Africa = AVION + BARCO (2 of 3)
   * - Am. Central = 1 TANQUE
   * - Oceania = 1 BARCO
   */
  getTradeEquivalence(continent: string): ContinentEquivalence {
    switch (continent) {
      case 'AMERICA_DEL_NORTE':
      case 'EUROPA':
      case 'ASIA':
        return { type: 'FULL_TRADE' };
      case 'AMERICA_DEL_SUR':
        return { type: 'TWO_SYMBOLS', symbols: ['AVION', 'TANQUE'] as CardSymbol[] };
      case 'AFRICA':
        return { type: 'TWO_SYMBOLS', symbols: ['AVION', 'BARCO'] as CardSymbol[] };
      case 'AMERICA_CENTRAL':
        return { type: 'ONE_SYMBOL', symbols: ['TANQUE'] as CardSymbol[] };
      case 'OCEANIA':
        return { type: 'ONE_SYMBOL', symbols: ['BARCO'] as CardSymbol[] };
      default:
        return { type: 'ONE_SYMBOL', symbols: [] };
    }
  }

  /**
   * Check whether a player can use a specific continent card in a trade.
   */
  canUseCard(continent: string, playerId: string): boolean {
    const card = this.cards[continent];
    if (!card) return false;
    return card.heldBy === playerId && !card.usedBy.includes(playerId);
  }

  /**
   * Get the state of a continent card.
   */
  getCard(continent: string): ContinentCardState | undefined {
    const card = this.cards[continent];
    if (!card) return undefined;
    return { ...card, usedBy: [...card.usedBy] };
  }

  /**
   * Get all continent card identifiers currently held by a player.
   */
  getPlayerCards(playerId: string): string[] {
    return Object.keys(this.cards).filter(
      (continent) => this.cards[continent].heldBy === playerId,
    );
  }

  /**
   * Get all continent cards that a player can currently use in trades.
   * (held by them and not yet used by them)
   */
  getPlayerUsableCards(playerId: string): string[] {
    return Object.keys(this.cards).filter(
      (continent) =>
        this.cards[continent].heldBy === playerId &&
        !this.cards[continent].usedBy.includes(playerId),
    );
  }

  /**
   * Get all continent card states (for serialization / game state snapshot).
   */
  getAllCards(): Record<string, ContinentCardState> {
    const result: Record<string, ContinentCardState> = {};
    for (const [key, card] of Object.entries(this.cards)) {
      result[key] = { ...card, usedBy: [...card.usedBy] };
    }
    return result;
  }
}
