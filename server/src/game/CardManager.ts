import type { CountryCard, CardSymbol } from '../data/countryCards';
import type { ContinentCardState } from './ContinentCardManager';
import { ContinentCardManager } from './ContinentCardManager';
import { TradeCalculator } from './TradeCalculator';
import type { TradeCountryCard, TradeContinentCard } from './TradeCalculator';

export class CardManager {
  private deck: CountryCard[];
  private discard: CountryCard[];
  private tradeCalculator: TradeCalculator;

  constructor(cards: CountryCard[]) {
    this.deck = this.shuffle([...cards]);
    this.discard = [];
    this.tradeCalculator = new TradeCalculator();
  }

  /**
   * Fisher-Yates shuffle.
   */
  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  /**
   * Draw a card from the deck.
   * If the deck is empty, reshuffle the discard pile into the deck.
   * Returns null if both deck and discard are empty (should not happen in normal play).
   */
  drawCard(): CountryCard | null {
    if (this.deck.length === 0) {
      if (this.discard.length === 0) return null;
      this.deck = this.shuffle([...this.discard]);
      this.discard = [];
    }
    return this.deck.pop() ?? null;
  }

  /**
   * Return cards to the discard pile (after a trade).
   */
  discardCards(cards: CountryCard[]): void {
    this.discard.push(...cards);
  }

  /**
   * Check if a set of cards forms a valid trade.
   *
   * Valid combinations:
   *   1. A single super-tarjeta (has AVION + BARCO + TANQUE)
   *   2. 3 cards with same symbol (SOLDADOS acts as wildcard for any)
   *   3. 3 cards with all different symbols (excluding SOLDADOS which is wildcard)
   *   4. Continent card equivalences can supplement country cards
   */
  isValidTrade(cards: CountryCard[], continentCards?: ContinentCardState[]): boolean {
    const countryTradeCards: TradeCountryCard[] = cards.map((c) => ({
      symbols: c.symbols,
    }));

    let continentTradeCards: TradeContinentCard[] | undefined;
    if (continentCards && continentCards.length > 0) {
      const ccm = new ContinentCardManager();
      continentTradeCards = continentCards.map((cc) => ({
        continent: cc.continent,
        equivalence: ccm.getTradeEquivalence(cc.continent),
      }));
    }

    return this.tradeCalculator.isValidTrade({
      countryCards: countryTradeCards,
      continentCards: continentTradeCards,
    });
  }

  /**
   * Get the reinforcement value for a trade based on the player's trade count.
   *   Trade 1 = 6 armies
   *   Trade 2 = 10 armies
   *   Trade 3+ = 10 + (tradeNumber - 2) * 5
   */
  getTradeValue(tradeNumber: number): number {
    if (tradeNumber <= 0) return 0;
    if (tradeNumber === 1) return 6;
    if (tradeNumber === 2) return 10;
    return 10 + (tradeNumber - 2) * 5;
  }

  /**
   * Check if a player is allowed to draw a card this turn.
   *   - Before the 3rd trade: need 1+ countries conquered this turn
   *   - After the 3rd trade: need 2+ countries conquered this turn
   */
  canDrawCard(conqueredThisTurn: number, playerTradeCount: number): boolean {
    if (playerTradeCount >= 3) return conqueredThisTurn >= 2;
    return conqueredThisTurn >= 1;
  }

  /**
   * Check for the card-country bonus: if a player holds a country card
   * matching a country they own, they receive 3 extra armies on that country.
   *
   * Returns a list of matching (country, card) pairs.
   */
  checkCardCountryBonus(
    playerHand: CountryCard[],
    playerCountries: string[],
  ): { country: string; card: CountryCard }[] {
    const playerCountrySet = new Set(playerCountries);
    const matches: { country: string; card: CountryCard }[] = [];

    for (const card of playerHand) {
      if (playerCountrySet.has(card.country)) {
        matches.push({ country: card.country, card });
      }
    }

    return matches;
  }

  /**
   * Find all valid trade combinations from a player's hand.
   * Returns arrays of card indices. Negative indices represent continent cards:
   * -(continentIndex + 1).
   */
  findValidTrades(
    hand: CountryCard[],
    continentCardManager?: ContinentCardManager,
    playerId?: string,
  ): number[][] {
    const tradeCards: TradeCountryCard[] = hand.map((c) => ({ symbols: c.symbols }));

    let continentTradeCards: TradeContinentCard[] | undefined;
    if (continentCardManager && playerId) {
      const usable = continentCardManager.getPlayerUsableCards(playerId);
      if (usable.length > 0) {
        continentTradeCards = usable.map((continent) => ({
          continent,
          equivalence: continentCardManager.getTradeEquivalence(continent),
        }));
      }
    }

    return this.tradeCalculator.findValidTrades(tradeCards, continentTradeCards);
  }

  getDeckSize(): number {
    return this.deck.length;
  }

  getDiscardSize(): number {
    return this.discard.length;
  }
}
