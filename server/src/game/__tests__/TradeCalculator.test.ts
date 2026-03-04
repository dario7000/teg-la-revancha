import { describe, test, expect } from 'vitest';
import { TradeCalculator } from '../TradeCalculator';
import type { TradeCountryCard, TradeContinentCard, TradeInput } from '../TradeCalculator';
import type { CardSymbol } from '../../data/countryCards';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function card(symbols: CardSymbol[]): TradeCountryCard {
  return { symbols };
}

function input(
  countryCards: TradeCountryCard[],
  continentCards?: TradeContinentCard[],
): TradeInput {
  return { countryCards, continentCards };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TradeCalculator', () => {
  const calc = new TradeCalculator();

  // ------- 3 same symbols -------

  describe('three same symbols', () => {
    test('3 AVION cards is valid', () => {
      expect(calc.isValidTrade(input([card(['AVION']), card(['AVION']), card(['AVION'])]))).toBe(true);
    });

    test('3 TANQUE cards is valid', () => {
      expect(calc.isValidTrade(input([card(['TANQUE']), card(['TANQUE']), card(['TANQUE'])]))).toBe(true);
    });

    test('3 GRANADA cards is valid', () => {
      expect(calc.isValidTrade(input([card(['GRANADA']), card(['GRANADA']), card(['GRANADA'])]))).toBe(true);
    });

    test('3 BARCO cards is valid', () => {
      expect(calc.isValidTrade(input([card(['BARCO']), card(['BARCO']), card(['BARCO'])]))).toBe(true);
    });
  });

  // ------- 3 different symbols -------

  describe('three different symbols', () => {
    test('AVION + TANQUE + GRANADA is valid', () => {
      expect(calc.isValidTrade(input([card(['AVION']), card(['TANQUE']), card(['GRANADA'])]))).toBe(true);
    });

    test('AVION + TANQUE + BARCO is valid', () => {
      expect(calc.isValidTrade(input([card(['AVION']), card(['TANQUE']), card(['BARCO'])]))).toBe(true);
    });

    test('AVION + GRANADA + BARCO is valid', () => {
      expect(calc.isValidTrade(input([card(['AVION']), card(['GRANADA']), card(['BARCO'])]))).toBe(true);
    });

    test('TANQUE + GRANADA + BARCO is valid', () => {
      expect(calc.isValidTrade(input([card(['TANQUE']), card(['GRANADA']), card(['BARCO'])]))).toBe(true);
    });
  });

  // ------- Invalid combinations -------

  describe('invalid combinations', () => {
    test('2 AVION + 1 TANQUE is invalid (not 3 same, not 3 different)', () => {
      expect(calc.isValidTrade(input([card(['AVION']), card(['AVION']), card(['TANQUE'])]))).toBe(false);
    });

    test('2 GRANADA + 1 BARCO is invalid', () => {
      expect(calc.isValidTrade(input([card(['GRANADA']), card(['GRANADA']), card(['BARCO'])]))).toBe(false);
    });

    test('single non-super card is invalid', () => {
      expect(calc.isValidTrade(input([card(['AVION'])]))).toBe(false);
    });

    test('two cards is not enough', () => {
      expect(calc.isValidTrade(input([card(['AVION']), card(['AVION'])]))).toBe(false);
    });

    test('empty hand is invalid', () => {
      expect(calc.isValidTrade(input([]))).toBe(false);
    });
  });

  // ------- Wildcard (SOLDADOS) -------

  describe('SOLDADOS wildcard', () => {
    test('SOLDADOS + AVION + AVION = 3 same (wildcard becomes AVION)', () => {
      expect(calc.isValidTrade(input([card(['SOLDADOS']), card(['AVION']), card(['AVION'])]))).toBe(true);
    });

    test('SOLDADOS + AVION + TANQUE = 3 different (wildcard becomes GRANADA or BARCO)', () => {
      expect(calc.isValidTrade(input([card(['SOLDADOS']), card(['AVION']), card(['TANQUE'])]))).toBe(true);
    });

    test('3 SOLDADOS is valid (3 same since wildcards can all be the same)', () => {
      expect(calc.isValidTrade(input([card(['SOLDADOS']), card(['SOLDADOS']), card(['SOLDADOS'])]))).toBe(true);
    });

    test('2 SOLDADOS + 1 BARCO is valid', () => {
      expect(calc.isValidTrade(input([card(['SOLDADOS']), card(['SOLDADOS']), card(['BARCO'])]))).toBe(true);
    });
  });

  // ------- Super-tarjeta -------

  describe('super-tarjeta', () => {
    test('single super-tarjeta (AVION+BARCO+TANQUE) is valid alone', () => {
      expect(calc.isValidTrade(input([card(['AVION', 'BARCO', 'TANQUE'])]))).toBe(true);
    });

    test('order of symbols on super-tarjeta does not matter', () => {
      expect(calc.isValidTrade(input([card(['TANQUE', 'AVION', 'BARCO'])]))).toBe(true);
    });

    test('a 3-symbol card without the right combo is NOT a super-tarjeta', () => {
      // AVION+GRANADA+TANQUE is not the super combo (needs BARCO instead of GRANADA)
      expect(calc.isValidTrade(input([card(['AVION', 'GRANADA', 'TANQUE'])]))).toBe(false);
    });
  });

  // ------- Multi-symbol cards in combinations -------

  describe('multi-symbol cards', () => {
    test('two-symbol card contributes one symbol to a 3-same trade', () => {
      // Card with AVION+GRANADA can contribute AVION to match other AVIONs
      const cards = [card(['AVION', 'GRANADA']), card(['AVION']), card(['AVION'])];
      expect(calc.isValidTrade(input(cards))).toBe(true);
    });

    test('two-symbol card contributes to a 3-different trade', () => {
      // Card with AVION+GRANADA contributes AVION, other two contribute TANQUE and BARCO
      const cards = [card(['AVION', 'GRANADA']), card(['TANQUE']), card(['BARCO'])];
      expect(calc.isValidTrade(input(cards))).toBe(true);
    });
  });

  // ------- findValidTrades -------

  describe('findValidTrades', () => {
    test('finds super-tarjeta as a single-card trade', () => {
      const hand = [card(['AVION', 'BARCO', 'TANQUE']), card(['AVION']), card(['TANQUE'])];
      const trades = calc.findValidTrades(hand);
      // At least the super-tarjeta alone should be found
      expect(trades.some((t) => t.length === 1 && t[0] === 0)).toBe(true);
    });

    test('finds 3-same combination', () => {
      const hand = [card(['AVION']), card(['AVION']), card(['AVION'])];
      const trades = calc.findValidTrades(hand);
      expect(trades.some((t) => t.length === 3)).toBe(true);
    });

    test('finds 3-different combination', () => {
      const hand = [card(['AVION']), card(['TANQUE']), card(['GRANADA'])];
      const trades = calc.findValidTrades(hand);
      expect(trades.some((t) => t.length === 3)).toBe(true);
    });

    test('returns empty array when no valid trades exist', () => {
      const hand = [card(['AVION']), card(['AVION'])];
      const trades = calc.findValidTrades(hand);
      expect(trades).toHaveLength(0);
    });

    test('finds multiple valid trades from a large hand', () => {
      const hand = [
        card(['AVION']),
        card(['AVION']),
        card(['AVION']),
        card(['TANQUE']),
        card(['GRANADA']),
      ];
      const trades = calc.findValidTrades(hand);
      // 3 AVIONs = valid, AVION+TANQUE+GRANADA = valid, etc.
      expect(trades.length).toBeGreaterThanOrEqual(2);
    });

    test('FULL_TRADE continent card is found as single-card trade', () => {
      const hand = [card(['AVION'])];
      const continentCards = [
        { continent: 'EUROPA', equivalence: { type: 'FULL_TRADE' as const } },
      ];
      const trades = calc.findValidTrades(hand, continentCards);
      // The FULL_TRADE continent card alone should be found (negative index)
      expect(trades.some((t) => t.length === 1 && t[0] < 0)).toBe(true);
    });
  });
});
