import { describe, test, expect } from 'vitest';
import { CardManager } from '../CardManager';
import type { CountryCard, CardSymbol } from '../../data/countryCards';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCard(country: string, symbols: CardSymbol[]): CountryCard {
  return {
    id: `CARD_${country}`,
    country: country as any,
    symbols,
    isWildcard: symbols.includes('SOLDADOS'),
    isSuperCard:
      symbols.length === 3 &&
      symbols.includes('AVION') &&
      symbols.includes('BARCO') &&
      symbols.includes('TANQUE'),
  };
}

function makeDeck(count: number): CountryCard[] {
  const symbols: CardSymbol[] = ['AVION', 'TANQUE', 'GRANADA', 'BARCO'];
  return Array.from({ length: count }, (_, i) =>
    makeCard(`COUNTRY_${i}`, [symbols[i % symbols.length]]),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CardManager', () => {
  // ------- Drawing cards -------

  describe('drawCard', () => {
    test('drawing a card reduces the deck size by 1', () => {
      const cm = new CardManager(makeDeck(5));
      expect(cm.getDeckSize()).toBe(5);
      cm.drawCard();
      expect(cm.getDeckSize()).toBe(4);
    });

    test('drawing all cards empties the deck', () => {
      const deck = makeDeck(3);
      const cm = new CardManager(deck);
      cm.drawCard();
      cm.drawCard();
      cm.drawCard();
      expect(cm.getDeckSize()).toBe(0);
    });

    test('drawCard returns a CountryCard object', () => {
      const cm = new CardManager(makeDeck(2));
      const card = cm.drawCard();
      expect(card).not.toBeNull();
      expect(card!.id).toBeDefined();
      expect(card!.symbols).toBeDefined();
    });

    test('drawCard returns null when both deck and discard are empty', () => {
      const cm = new CardManager([]);
      expect(cm.drawCard()).toBeNull();
    });

    test('reshuffles discard pile when deck is empty', () => {
      const cards = makeDeck(2);
      const cm = new CardManager(cards);

      // Draw both cards
      const c1 = cm.drawCard()!;
      const c2 = cm.drawCard()!;
      expect(cm.getDeckSize()).toBe(0);

      // Discard them
      cm.discardCards([c1, c2]);
      expect(cm.getDiscardSize()).toBe(2);

      // Drawing again should trigger reshuffle
      const c3 = cm.drawCard();
      expect(c3).not.toBeNull();
      expect(cm.getDiscardSize()).toBe(0);
      // After reshuffle, the deck had 2 cards and we drew 1, so 1 left
      expect(cm.getDeckSize()).toBe(1);
    });
  });

  // ------- Discard -------

  describe('discardCards', () => {
    test('discard increases the discard pile size', () => {
      const cm = new CardManager(makeDeck(3));
      const c1 = cm.drawCard()!;
      cm.discardCards([c1]);
      expect(cm.getDiscardSize()).toBe(1);
    });

    test('discard multiple cards at once', () => {
      const cm = new CardManager(makeDeck(5));
      const drawn = [cm.drawCard()!, cm.drawCard()!, cm.drawCard()!];
      cm.discardCards(drawn);
      expect(cm.getDiscardSize()).toBe(3);
    });
  });

  // ------- getTradeValue -------

  describe('getTradeValue', () => {
    test('trade 0 returns 0', () => {
      const cm = new CardManager([]);
      expect(cm.getTradeValue(0)).toBe(0);
    });

    test('trade 1 returns 6 armies', () => {
      const cm = new CardManager([]);
      expect(cm.getTradeValue(1)).toBe(6);
    });

    test('trade 2 returns 10 armies', () => {
      const cm = new CardManager([]);
      expect(cm.getTradeValue(2)).toBe(10);
    });

    test('trade 3 returns 15 armies', () => {
      const cm = new CardManager([]);
      expect(cm.getTradeValue(3)).toBe(15);
    });

    test('trade 4 returns 20 armies', () => {
      const cm = new CardManager([]);
      expect(cm.getTradeValue(4)).toBe(20);
    });

    test('trade 5 returns 25 armies', () => {
      const cm = new CardManager([]);
      expect(cm.getTradeValue(5)).toBe(25);
    });

    test('negative trade number returns 0', () => {
      const cm = new CardManager([]);
      expect(cm.getTradeValue(-1)).toBe(0);
    });
  });

  // ------- canDrawCard -------

  describe('canDrawCard', () => {
    test('before 3rd trade: 1 conquest is sufficient', () => {
      const cm = new CardManager([]);
      expect(cm.canDrawCard(1, 0)).toBe(true);
      expect(cm.canDrawCard(1, 1)).toBe(true);
      expect(cm.canDrawCard(1, 2)).toBe(true);
    });

    test('before 3rd trade: 0 conquests is not sufficient', () => {
      const cm = new CardManager([]);
      expect(cm.canDrawCard(0, 0)).toBe(false);
      expect(cm.canDrawCard(0, 1)).toBe(false);
      expect(cm.canDrawCard(0, 2)).toBe(false);
    });

    test('after 3rd trade: need 2+ conquests', () => {
      const cm = new CardManager([]);
      expect(cm.canDrawCard(2, 3)).toBe(true);
      expect(cm.canDrawCard(3, 3)).toBe(true);
      expect(cm.canDrawCard(2, 5)).toBe(true);
    });

    test('after 3rd trade: 1 conquest is not enough', () => {
      const cm = new CardManager([]);
      expect(cm.canDrawCard(1, 3)).toBe(false);
      expect(cm.canDrawCard(0, 4)).toBe(false);
    });
  });

  // ------- checkCardCountryBonus -------

  describe('checkCardCountryBonus', () => {
    test('finds matching card when player owns the country', () => {
      const cm = new CardManager([]);
      const hand = [makeCard('ARGENTINA', ['SOLDADOS']), makeCard('BRASIL', ['SOLDADOS'])];
      const owned = ['ARGENTINA', 'CHILE'];
      const matches = cm.checkCardCountryBonus(hand, owned);
      expect(matches).toHaveLength(1);
      expect(matches[0].country).toBe('ARGENTINA');
    });

    test('returns empty when no cards match owned countries', () => {
      const cm = new CardManager([]);
      const hand = [makeCard('ARGENTINA', ['SOLDADOS'])];
      const owned = ['BRASIL', 'CHILE'];
      const matches = cm.checkCardCountryBonus(hand, owned);
      expect(matches).toHaveLength(0);
    });

    test('finds multiple matches', () => {
      const cm = new CardManager([]);
      const hand = [
        makeCard('ARGENTINA', ['SOLDADOS']),
        makeCard('BRASIL', ['SOLDADOS']),
        makeCard('CHILE', ['TANQUE']),
      ];
      const owned = ['ARGENTINA', 'BRASIL', 'CHILE'];
      const matches = cm.checkCardCountryBonus(hand, owned);
      expect(matches).toHaveLength(3);
    });

    test('empty hand returns no matches', () => {
      const cm = new CardManager([]);
      const matches = cm.checkCardCountryBonus([], ['ARGENTINA']);
      expect(matches).toHaveLength(0);
    });
  });

  // ------- isValidTrade (delegation) -------

  describe('isValidTrade', () => {
    test('3 same symbols is a valid trade', () => {
      const cm = new CardManager([]);
      const cards = [
        makeCard('A', ['AVION']),
        makeCard('B', ['AVION']),
        makeCard('C', ['AVION']),
      ];
      expect(cm.isValidTrade(cards)).toBe(true);
    });

    test('3 different symbols is a valid trade', () => {
      const cm = new CardManager([]);
      const cards = [
        makeCard('A', ['AVION']),
        makeCard('B', ['TANQUE']),
        makeCard('C', ['GRANADA']),
      ];
      expect(cm.isValidTrade(cards)).toBe(true);
    });

    test('super-tarjeta alone is a valid trade', () => {
      const cm = new CardManager([]);
      const cards = [makeCard('X', ['AVION', 'BARCO', 'TANQUE'])];
      expect(cm.isValidTrade(cards)).toBe(true);
    });

    test('invalid combination rejected', () => {
      const cm = new CardManager([]);
      const cards = [
        makeCard('A', ['AVION']),
        makeCard('B', ['AVION']),
        makeCard('C', ['TANQUE']),
      ];
      expect(cm.isValidTrade(cards)).toBe(false);
    });
  });
});
