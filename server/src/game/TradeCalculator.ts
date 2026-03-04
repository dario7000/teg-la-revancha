import type { CardSymbol } from '../data/countryCards';

export interface ContinentEquivalence {
  type: 'FULL_TRADE' | 'TWO_SYMBOLS' | 'ONE_SYMBOL';
  symbols?: CardSymbol[];
}

export interface TradeCountryCard {
  symbols: CardSymbol[];
}

export interface TradeContinentCard {
  continent: string;
  equivalence: ContinentEquivalence;
}

export interface TradeInput {
  countryCards: TradeCountryCard[];
  continentCards?: TradeContinentCard[];
}

const TRADE_SYMBOLS: CardSymbol[] = ['AVION', 'TANQUE', 'GRANADA', 'BARCO'];

export class TradeCalculator {
  /**
   * Check if a trade combination is valid.
   *
   * Valid trades:
   *   1. A single super-tarjeta (has AVION + BARCO + TANQUE)
   *   2. A single continent card worth a FULL_TRADE
   *   3. 3 country cards with the same symbol (SOLDADOS is wildcard)
   *   4. 3 country cards with all different symbols (SOLDADOS is wildcard)
   *   5. Mix of country cards + continent cards that combine to 3 same or 3 different
   */
  isValidTrade(input: TradeInput): boolean {
    const { countryCards, continentCards } = input;
    const continents = continentCards ?? [];

    // Case 1: Single super-tarjeta (3 symbols: AVION, BARCO, TANQUE)
    if (countryCards.length === 1 && continents.length === 0) {
      const card = countryCards[0];
      if (this.isSuperCard(card)) return true;
    }

    // Case 2: Single continent card worth a FULL_TRADE
    if (countryCards.length === 0 && continents.length === 1) {
      if (continents[0].equivalence.type === 'FULL_TRADE') return true;
    }

    // For combination cases, gather all symbol contributions.
    // Each country card contributes its symbols. SOLDADOS is a wildcard (can be any symbol).
    // Continent cards contribute their equivalent symbols.
    // We need to check if we can reach exactly 3 same or 3 different.

    // Also check: a FULL_TRADE continent card combined with country cards -
    // the FULL_TRADE alone is a valid trade, so any combination including it is valid.
    for (const cc of continents) {
      if (cc.equivalence.type === 'FULL_TRADE') return true;
    }

    // Collect fixed symbols and wildcard count
    const fixedSymbols: CardSymbol[] = [];
    let wildcardCount = 0;

    for (const card of countryCards) {
      if (this.isSuperCard(card)) {
        // Super-tarjeta alone is valid (handled above).
        // In combination, it contributes AVION, BARCO, TANQUE (all different).
        // Treat as 3 fixed symbols contributing to the pool.
        fixedSymbols.push('AVION', 'BARCO', 'TANQUE');
      } else if (card.symbols.includes('SOLDADOS')) {
        wildcardCount++;
      } else {
        // Single or dual symbol card - pick ONE symbol to contribute.
        // We'll handle multi-symbol cards by trying all possibilities.
        // For now, mark them as choices.
        fixedSymbols.push(...card.symbols);
      }
    }

    for (const cc of continents) {
      if (cc.equivalence.symbols) {
        fixedSymbols.push(...(cc.equivalence.symbols as CardSymbol[]));
      }
    }

    const totalContributions = countryCards.length + continents.length;

    // For cards that contribute multiple symbols, we need to pick ONE per card.
    // We build choice arrays for each card, then brute-force check combinations.
    // This handles the complexity of multi-symbol cards and wildcards.

    const choices: CardSymbol[][] = [];

    for (const card of countryCards) {
      if (this.isSuperCard(card)) {
        // Super card contributes one of its symbols in a combination context
        choices.push(['AVION', 'BARCO', 'TANQUE']);
      } else if (card.symbols.includes('SOLDADOS')) {
        // Wildcard can be any trade symbol
        choices.push([...TRADE_SYMBOLS]);
      } else {
        // Card contributes one of its symbols
        choices.push([...card.symbols]);
      }
    }

    for (const cc of continents) {
      const eq = cc.equivalence;
      if (eq.type === 'TWO_SYMBOLS' && eq.symbols) {
        // Contributes two symbol slots - add two choice entries
        for (const sym of eq.symbols) {
          choices.push([sym as CardSymbol]);
        }
      } else if (eq.type === 'ONE_SYMBOL' && eq.symbols && eq.symbols.length > 0) {
        choices.push([eq.symbols[0] as CardSymbol]);
      }
    }

    const totalSlots = choices.length;

    // We need exactly 3 symbols that form a valid combination
    if (totalSlots < 3) return false;

    // Try all subsets of exactly 3 slots and check if any assignment is valid
    // For reasonable hand sizes (< 15 cards), this is fine
    return this.checkSubsets(choices, 3, totalContributions);
  }

  /**
   * Check if any subset of 3 from `choices` can form a valid trade
   * (3 same or 3 all-different).
   * `minCards` is the minimum total card contributions required (not used for subset check
   * but tracked for context).
   */
  private checkSubsets(choices: CardSymbol[][], targetSize: number, _totalCards: number): boolean {
    const n = choices.length;
    if (n < targetSize) return false;

    // Generate all combinations of `targetSize` indices from choices
    const indices: number[] = [];
    for (let i = 0; i < targetSize; i++) indices.push(i);

    while (true) {
      // For this combination of slots, try all assignments
      if (this.canFormValidFromSlots(choices, indices)) return true;

      // Next combination
      let i = targetSize - 1;
      while (i >= 0 && indices[i] === n - targetSize + i) i--;
      if (i < 0) break;
      indices[i]++;
      for (let j = i + 1; j < targetSize; j++) indices[j] = indices[j - 1] + 1;
    }

    return false;
  }

  /**
   * Given selected slot indices, check if there is an assignment of symbols
   * (one from each slot's choices) that forms 3-same or 3-all-different.
   */
  private canFormValidFromSlots(choices: CardSymbol[][], slotIndices: number[]): boolean {
    const slots = slotIndices.map(i => choices[i]);

    // Try all assignments via recursive enumeration
    const assigned: CardSymbol[] = [];
    return this.tryAssign(slots, 0, assigned);
  }

  private tryAssign(slots: CardSymbol[][], idx: number, assigned: CardSymbol[]): boolean {
    if (idx === slots.length) {
      return this.isThreeSame(assigned) || this.isThreeDifferent(assigned);
    }

    for (const sym of slots[idx]) {
      assigned.push(sym);
      if (this.tryAssign(slots, idx + 1, assigned)) return true;
      assigned.pop();
    }

    return false;
  }

  private isThreeSame(symbols: CardSymbol[]): boolean {
    return symbols[0] === symbols[1] && symbols[1] === symbols[2];
  }

  private isThreeDifferent(symbols: CardSymbol[]): boolean {
    return symbols[0] !== symbols[1] && symbols[1] !== symbols[2] && symbols[0] !== symbols[2];
  }

  private isSuperCard(card: TradeCountryCard): boolean {
    return (
      card.symbols.length === 3 &&
      card.symbols.includes('AVION') &&
      card.symbols.includes('BARCO') &&
      card.symbols.includes('TANQUE')
    );
  }

  /**
   * Find all valid trade combinations from a hand.
   * Returns arrays of indices (into the hand) that form valid trades.
   * Includes trades using only country cards and trades mixing continent cards.
   */
  findValidTrades(
    hand: TradeCountryCard[],
    continentCards?: { continent: string; equivalence: ContinentEquivalence }[],
  ): number[][] {
    const results: number[][] = [];
    const cCards = continentCards ?? [];

    // Check single super-tarjetas
    for (let i = 0; i < hand.length; i++) {
      if (this.isSuperCard(hand[i])) {
        results.push([i]);
      }
    }

    // Check all 3-card combinations from hand (country cards only)
    if (hand.length >= 3) {
      for (let i = 0; i < hand.length - 2; i++) {
        for (let j = i + 1; j < hand.length - 1; j++) {
          for (let k = j + 1; k < hand.length; k++) {
            const input: TradeInput = {
              countryCards: [hand[i], hand[j], hand[k]],
              continentCards: [],
            };
            if (this.isValidTrade(input)) {
              results.push([i, j, k]);
            }
          }
        }
      }
    }

    // Check combinations involving continent cards
    // A FULL_TRADE continent card by itself
    for (let ci = 0; ci < cCards.length; ci++) {
      if (cCards[ci].equivalence.type === 'FULL_TRADE') {
        // Use negative indices for continent cards: -(ci+1)
        results.push([-(ci + 1)]);
      }
    }

    // Continent card TWO_SYMBOLS + 1 country card
    for (let ci = 0; ci < cCards.length; ci++) {
      const eq = cCards[ci].equivalence;
      if (eq.type === 'TWO_SYMBOLS') {
        for (let i = 0; i < hand.length; i++) {
          const input: TradeInput = {
            countryCards: [hand[i]],
            continentCards: [cCards[ci]],
          };
          if (this.isValidTrade(input)) {
            results.push([i, -(ci + 1)]);
          }
        }
      }
    }

    // Continent card ONE_SYMBOL + 2 country cards
    for (let ci = 0; ci < cCards.length; ci++) {
      const eq = cCards[ci].equivalence;
      if (eq.type === 'ONE_SYMBOL') {
        if (hand.length >= 2) {
          for (let i = 0; i < hand.length - 1; i++) {
            for (let j = i + 1; j < hand.length; j++) {
              const input: TradeInput = {
                countryCards: [hand[i], hand[j]],
                continentCards: [cCards[ci]],
              };
              if (this.isValidTrade(input)) {
                results.push([i, j, -(ci + 1)]);
              }
            }
          }
        }
      }
    }

    // Two ONE_SYMBOL continent cards + 1 country card
    if (cCards.length >= 2) {
      for (let ci = 0; ci < cCards.length - 1; ci++) {
        for (let cj = ci + 1; cj < cCards.length; cj++) {
          if (
            cCards[ci].equivalence.type === 'ONE_SYMBOL' &&
            cCards[cj].equivalence.type === 'ONE_SYMBOL'
          ) {
            for (let i = 0; i < hand.length; i++) {
              const input: TradeInput = {
                countryCards: [hand[i]],
                continentCards: [cCards[ci], cCards[cj]],
              };
              if (this.isValidTrade(input)) {
                results.push([i, -(ci + 1), -(cj + 1)]);
              }
            }
          }
        }
      }
    }

    // ONE_SYMBOL + TWO_SYMBOLS continent cards (no country cards needed)
    for (let ci = 0; ci < cCards.length - 1; ci++) {
      for (let cj = ci + 1; cj < cCards.length; cj++) {
        const types = [cCards[ci].equivalence.type, cCards[cj].equivalence.type];
        if (types.includes('ONE_SYMBOL') && types.includes('TWO_SYMBOLS')) {
          const input: TradeInput = {
            countryCards: [],
            continentCards: [cCards[ci], cCards[cj]],
          };
          if (this.isValidTrade(input)) {
            results.push([-(ci + 1), -(cj + 1)]);
          }
        }
      }
    }

    // Two TWO_SYMBOLS continent cards (provides 4 symbols, easily 3)
    for (let ci = 0; ci < cCards.length - 1; ci++) {
      for (let cj = ci + 1; cj < cCards.length; cj++) {
        if (
          cCards[ci].equivalence.type === 'TWO_SYMBOLS' &&
          cCards[cj].equivalence.type === 'TWO_SYMBOLS'
        ) {
          const input: TradeInput = {
            countryCards: [],
            continentCards: [cCards[ci], cCards[cj]],
          };
          if (this.isValidTrade(input)) {
            results.push([-(ci + 1), -(cj + 1)]);
          }
        }
      }
    }

    // Three ONE_SYMBOL continent cards
    if (cCards.length >= 3) {
      for (let ci = 0; ci < cCards.length - 2; ci++) {
        for (let cj = ci + 1; cj < cCards.length - 1; cj++) {
          for (let ck = cj + 1; ck < cCards.length; ck++) {
            if (
              cCards[ci].equivalence.type === 'ONE_SYMBOL' &&
              cCards[cj].equivalence.type === 'ONE_SYMBOL' &&
              cCards[ck].equivalence.type === 'ONE_SYMBOL'
            ) {
              const input: TradeInput = {
                countryCards: [],
                continentCards: [cCards[ci], cCards[cj], cCards[ck]],
              };
              if (this.isValidTrade(input)) {
                results.push([-(ci + 1), -(cj + 1), -(ck + 1)]);
              }
            }
          }
        }
      }
    }

    return results;
  }
}
