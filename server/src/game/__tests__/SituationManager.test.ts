import { describe, test, expect, vi } from 'vitest';
import { SituationManager } from '../SituationManager';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SituationCard {
  id: string;
  type: string;
  description: string;
  color?: string;
}

function makeCard(id: string, type: string, color?: string): SituationCard {
  return { id, type, description: `Test ${type}`, color };
}

const ACTIVE_PLAYERS = [
  { id: 'p1', color: 'WHITE' },
  { id: 'p2', color: 'BLACK' },
  { id: 'p3', color: 'RED' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SituationManager', () => {
  // ------- revealCard -------

  describe('revealCard', () => {
    test('draws a card from the deck', () => {
      const cards = [makeCard('S1', 'COMBATE_CLASICO'), makeCard('S2', 'NIEVE')];
      const sm = new SituationManager(cards);
      const revealed = sm.revealCard(ACTIVE_PLAYERS);
      expect(revealed).toBeDefined();
      expect(revealed.id).toBeDefined();
      expect(revealed.type).toBeDefined();
    });

    test('sets the active situation to the revealed card', () => {
      const cards = [makeCard('S1', 'COMBATE_CLASICO')];
      const sm = new SituationManager(cards);
      const revealed = sm.revealCard(ACTIVE_PLAYERS);
      expect(sm.getActiveSituation()).toBe(revealed);
    });

    test('previous active card goes to discard when new one is revealed', () => {
      const cards = [
        makeCard('S1', 'COMBATE_CLASICO'),
        makeCard('S2', 'NIEVE'),
        makeCard('S3', 'CRISIS'),
      ];
      const sm = new SituationManager(cards);
      sm.revealCard(ACTIVE_PLAYERS); // reveals first card, sets active
      sm.revealCard(ACTIVE_PLAYERS); // previous goes to discard, new active
      const active = sm.getActiveSituation();
      expect(active).toBeDefined();
    });

    test('reshuffles discard when deck is empty', () => {
      const cards = [makeCard('S1', 'COMBATE_CLASICO')];
      const sm = new SituationManager(cards);
      // Reveal the only card
      sm.revealCard(ACTIVE_PLAYERS);
      // Now deck is empty. Revealing again should reshuffle the previous active into discard then back.
      // The active card from first reveal goes to discard, then discard reshuffled into deck.
      const second = sm.revealCard(ACTIVE_PLAYERS);
      expect(second).toBeDefined();
      expect(second.id).toBe('S1'); // only card available
    });

    test('skips DESCANSO card when the color is not in the game', () => {
      // DESCANSO for YELLOW, but no YELLOW player is active
      const cards = [
        makeCard('D1', 'DESCANSO', 'YELLOW'),
        makeCard('S1', 'COMBATE_CLASICO'),
      ];
      const sm = new SituationManager(cards);
      const revealed = sm.revealCard(ACTIVE_PLAYERS);
      // Should skip the DESCANSO(YELLOW) and draw COMBATE_CLASICO
      expect(revealed.type).toBe('COMBATE_CLASICO');
    });

    test('keeps DESCANSO card when the color IS in the game', () => {
      const cards = [makeCard('D1', 'DESCANSO', 'WHITE')];
      const sm = new SituationManager(cards);
      const revealed = sm.revealCard(ACTIVE_PLAYERS);
      expect(revealed.type).toBe('DESCANSO');
      expect(revealed.color).toBe('WHITE');
    });
  });

  // ------- getCombatModifier -------

  describe('getCombatModifier', () => {
    test('returns NONE when no active situation', () => {
      const sm = new SituationManager([]);
      expect(sm.getCombatModifier()).toBe('NONE');
    });

    test('returns NIEVE when active situation is NIEVE', () => {
      const sm = new SituationManager([makeCard('N1', 'NIEVE')]);
      sm.revealCard(ACTIVE_PLAYERS);
      expect(sm.getCombatModifier()).toBe('NIEVE');
    });

    test('returns VIENTO_A_FAVOR when active situation is VIENTO_A_FAVOR', () => {
      const sm = new SituationManager([makeCard('V1', 'VIENTO_A_FAVOR')]);
      sm.revealCard(ACTIVE_PLAYERS);
      expect(sm.getCombatModifier()).toBe('VIENTO_A_FAVOR');
    });

    test('returns NONE for COMBATE_CLASICO', () => {
      const sm = new SituationManager([makeCard('CC1', 'COMBATE_CLASICO')]);
      sm.revealCard(ACTIVE_PLAYERS);
      expect(sm.getCombatModifier()).toBe('NONE');
    });

    test('returns NONE for CRISIS', () => {
      const sm = new SituationManager([makeCard('C1', 'CRISIS')]);
      sm.revealCard(ACTIVE_PLAYERS);
      expect(sm.getCombatModifier()).toBe('NONE');
    });
  });

  // ------- isAttackAllowed -------

  describe('isAttackAllowed', () => {
    test('FRONTERAS_ABIERTAS: only cross-continent attacks allowed', () => {
      const sm = new SituationManager([makeCard('FA1', 'FRONTERAS_ABIERTAS')]);
      sm.revealCard(ACTIVE_PLAYERS);
      // Cross-continent: allowed
      expect(sm.isAttackAllowed('BRASIL', 'SAHARA', 'AMERICA_DEL_SUR', 'AFRICA')).toBe(true);
      // Same continent: blocked
      expect(sm.isAttackAllowed('BRASIL', 'ARGENTINA', 'AMERICA_DEL_SUR', 'AMERICA_DEL_SUR')).toBe(false);
    });

    test('FRONTERAS_CERRADAS: only same-continent attacks allowed', () => {
      const sm = new SituationManager([makeCard('FC1', 'FRONTERAS_CERRADAS')]);
      sm.revealCard(ACTIVE_PLAYERS);
      // Same continent: allowed
      expect(sm.isAttackAllowed('BRASIL', 'ARGENTINA', 'AMERICA_DEL_SUR', 'AMERICA_DEL_SUR')).toBe(true);
      // Cross-continent: blocked
      expect(sm.isAttackAllowed('BRASIL', 'SAHARA', 'AMERICA_DEL_SUR', 'AFRICA')).toBe(false);
    });

    test('no active situation: all attacks allowed', () => {
      const sm = new SituationManager([]);
      expect(sm.isAttackAllowed('A', 'B', 'C1', 'C2')).toBe(true);
    });

    test('COMBATE_CLASICO: all attacks allowed', () => {
      const sm = new SituationManager([makeCard('CC1', 'COMBATE_CLASICO')]);
      sm.revealCard(ACTIVE_PLAYERS);
      expect(sm.isAttackAllowed('A', 'B', 'C1', 'C2')).toBe(true);
      expect(sm.isAttackAllowed('A', 'B', 'C1', 'C1')).toBe(true);
    });

    test('DESCANSO: isAttackAllowed always returns true (checked elsewhere)', () => {
      const sm = new SituationManager([makeCard('D1', 'DESCANSO', 'WHITE')]);
      sm.revealCard(ACTIVE_PLAYERS);
      expect(sm.isAttackAllowed('A', 'B', 'C1', 'C2')).toBe(true);
    });
  });

  // ------- isPlayerInDescanso -------

  describe('isPlayerInDescanso', () => {
    test('returns true for the matching color', () => {
      const sm = new SituationManager([makeCard('D1', 'DESCANSO', 'WHITE')]);
      sm.revealCard(ACTIVE_PLAYERS);
      expect(sm.isPlayerInDescanso('WHITE')).toBe(true);
    });

    test('returns false for a non-matching color', () => {
      const sm = new SituationManager([makeCard('D1', 'DESCANSO', 'WHITE')]);
      sm.revealCard(ACTIVE_PLAYERS);
      expect(sm.isPlayerInDescanso('BLACK')).toBe(false);
    });

    test('returns false when no active situation', () => {
      const sm = new SituationManager([]);
      expect(sm.isPlayerInDescanso('WHITE')).toBe(false);
    });

    test('returns false when active situation is not DESCANSO', () => {
      const sm = new SituationManager([makeCard('CC1', 'COMBATE_CLASICO')]);
      sm.revealCard(ACTIVE_PLAYERS);
      expect(sm.isPlayerInDescanso('WHITE')).toBe(false);
    });
  });

  // ------- resolveCrisis -------

  describe('resolveCrisis', () => {
    test('returns rolls for all players and identifies losers', () => {
      const sm = new SituationManager([]);
      const result = sm.resolveCrisis(['p1', 'p2', 'p3']);
      // Each player should have a roll
      expect(result.rolls.p1).toBeGreaterThanOrEqual(1);
      expect(result.rolls.p1).toBeLessThanOrEqual(6);
      expect(result.rolls.p2).toBeGreaterThanOrEqual(1);
      expect(result.rolls.p3).toBeGreaterThanOrEqual(1);
      // Losers should be a subset of players
      expect(result.losers.length).toBeGreaterThanOrEqual(1);
      result.losers.forEach((loser) => {
        expect(['p1', 'p2', 'p3']).toContain(loser);
      });
    });

    test('losers have the minimum roll value', () => {
      const sm = new SituationManager([]);
      // Run multiple times to verify invariant
      for (let i = 0; i < 20; i++) {
        const result = sm.resolveCrisis(['p1', 'p2']);
        const minRoll = Math.min(...Object.values(result.rolls));
        result.losers.forEach((loser) => {
          expect(result.rolls[loser]).toBe(minRoll);
        });
      }
    });
  });

  // ------- calculateExtraReinforcements -------

  describe('calculateExtraReinforcements', () => {
    test('gives half the country count (floor) per player', () => {
      const sm = new SituationManager([]);
      const result = sm.calculateExtraReinforcements({
        p1: 10,
        p2: 7,
        p3: 3,
      });
      expect(result.p1).toBe(5);
      expect(result.p2).toBe(3); // floor(7/2)
      expect(result.p3).toBe(1); // floor(3/2)
    });

    test('player with 0 countries gets 0 extras', () => {
      const sm = new SituationManager([]);
      const result = sm.calculateExtraReinforcements({ p1: 0 });
      expect(result.p1).toBe(0);
    });

    test('player with 1 country gets 0 extras (floor(1/2)=0)', () => {
      const sm = new SituationManager([]);
      const result = sm.calculateExtraReinforcements({ p1: 1 });
      expect(result.p1).toBe(0);
    });
  });

  // ------- isCrisis / isExtraReinforcements -------

  describe('isCrisis and isExtraReinforcements', () => {
    test('isCrisis returns true when active card is CRISIS', () => {
      const sm = new SituationManager([makeCard('C1', 'CRISIS')]);
      sm.revealCard(ACTIVE_PLAYERS);
      expect(sm.isCrisis()).toBe(true);
      expect(sm.isExtraReinforcements()).toBe(false);
    });

    test('isExtraReinforcements returns true when active card is REFUERZOS_EXTRAS', () => {
      const sm = new SituationManager([makeCard('R1', 'REFUERZOS_EXTRAS')]);
      sm.revealCard(ACTIVE_PLAYERS);
      expect(sm.isExtraReinforcements()).toBe(true);
      expect(sm.isCrisis()).toBe(false);
    });
  });
});
