import { describe, test, expect } from 'vitest';
import { CombatSystem, CombatConfig } from '../CombatSystem';

describe('CombatSystem', () => {
  const combat = new CombatSystem();

  function makeConfig(overrides: Partial<CombatConfig> = {}): CombatConfig {
    return {
      attackerArmies: 5,
      defenderArmies: 3,
      attackerMissiles: 0,
      defenderMissiles: 0,
      situationEffect: 'NONE',
      ...overrides,
    };
  }

  // ------- Dice resolution -------

  describe('resolveCombat', () => {
    test('tie in dice: defender wins', () => {
      const result = combat.resolveCombat([4], [4]);
      expect(result.comparisons).toHaveLength(1);
      expect(result.comparisons[0].winner).toBe('defender');
      expect(result.attackerLosses).toBe(1);
      expect(result.defenderLosses).toBe(0);
    });

    test('3v3 dice: 3 comparisons happen', () => {
      const result = combat.resolveCombat([6, 5, 3], [5, 4, 2]);
      expect(result.comparisons).toHaveLength(3);
      // 6>5 attacker, 5>4 attacker, 3>2 attacker
      expect(result.defenderLosses).toBe(3);
      expect(result.attackerLosses).toBe(0);
    });

    test('4v3 dice: only 3 comparisons, 4th die ignored', () => {
      const result = combat.resolveCombat([6, 5, 4, 2], [6, 5, 3]);
      expect(result.comparisons).toHaveLength(3);
      // Sorted attacker: [6,5,4,2], sorted defender: [6,5,3]
      // 6 vs 6 -> defender wins (tie), 5 vs 5 -> defender wins (tie), 4 vs 3 -> attacker wins
      expect(result.attackerLosses).toBe(2);
      expect(result.defenderLosses).toBe(1);
    });

    test('example from manual: [6,5,1] vs [6,4,2] = attacker loses 2, defender loses 1', () => {
      // Already sorted descending: att=[6,5,1], def=[6,4,2]
      const result = combat.resolveCombat([6, 5, 1], [6, 4, 2]);
      // 6 vs 6 -> tie -> defender wins
      // 5 vs 4 -> attacker wins
      // 1 vs 2 -> defender wins
      expect(result.comparisons).toHaveLength(3);
      expect(result.comparisons[0].winner).toBe('defender');
      expect(result.comparisons[1].winner).toBe('attacker');
      expect(result.comparisons[2].winner).toBe('defender');
      expect(result.attackerLosses).toBe(2);
      expect(result.defenderLosses).toBe(1);
    });

    test('resolveCombat sorts dice internally even when passed unsorted', () => {
      const result = combat.resolveCombat([1, 6, 3], [2, 5, 4]);
      // Sorted att: [6,3,1], sorted def: [5,4,2]
      // 6>5 att, 3<4 def, 1<2 def
      expect(result.attackerLosses).toBe(2);
      expect(result.defenderLosses).toBe(1);
    });
  });

  // ------- Dice count rules -------

  describe('getAttackerDice', () => {
    test('4 dice rule: attacker doubles AND defender has 3+ armies', () => {
      // attacker=8, defender=3 -> 8 >= 3*2=6 AND defender >= 3 -> 4 dice rule
      // attackArmies = 8-1 = 7, min(4,7) = 4
      const config = makeConfig({ attackerArmies: 8, defenderArmies: 3 });
      expect(combat.getAttackerDice(config)).toBe(4);
    });

    test('4 dice rule: NOT triggered when defender has less than 3', () => {
      // attacker=10, defender=2 -> defender < 3, no 4 dice rule
      // attackArmies = 10-1 = 9, min(3,9) = 3
      const config = makeConfig({ attackerArmies: 10, defenderArmies: 2 });
      expect(combat.getAttackerDice(config)).toBe(3);
    });

    test('4 dice rule: NOT triggered when attacker does not double defender', () => {
      // attacker=5, defender=3 -> 5 < 3*2=6, no 4 dice rule
      const config = makeConfig({ attackerArmies: 5, defenderArmies: 3 });
      expect(combat.getAttackerDice(config)).toBe(3);
    });

    test('Viento a Favor: attacker gets +1 die', () => {
      // attacker=4, defender=2 -> attackArmies=3, min(3,3)=3, +1 for viento = 4
      const config = makeConfig({
        attackerArmies: 4,
        defenderArmies: 2,
        situationEffect: 'VIENTO_A_FAVOR',
      });
      expect(combat.getAttackerDice(config)).toBe(4);
    });

    test('maximum absolute: never more than 4 dice for attacker', () => {
      // 4 dice rule active + viento a favor, still capped at 4
      const config = makeConfig({
        attackerArmies: 20,
        defenderArmies: 5,
        situationEffect: 'VIENTO_A_FAVOR',
      });
      expect(combat.getAttackerDice(config)).toBeLessThanOrEqual(4);
    });

    test('attacker with 1 army gets 0 dice (cannot attack)', () => {
      const config = makeConfig({ attackerArmies: 1, defenderArmies: 3 });
      expect(combat.getAttackerDice(config)).toBe(0);
    });
  });

  describe('getDefenderDice', () => {
    test('Nieve: defender gets +1 die', () => {
      // defender=3, min(3,3)=3, +1 for nieve = 4
      const config = makeConfig({ defenderArmies: 3, situationEffect: 'NIEVE' });
      expect(combat.getDefenderDice(config)).toBe(4);
    });

    test('maximum absolute: never more than 4 dice for defender', () => {
      // defender=10, min(3,10)=3, +1 nieve = 4, capped at 4
      const config = makeConfig({ defenderArmies: 10, situationEffect: 'NIEVE' });
      expect(combat.getDefenderDice(config)).toBeLessThanOrEqual(4);
    });

    test('defender with 1 army gets 1 die', () => {
      const config = makeConfig({ defenderArmies: 1 });
      expect(combat.getDefenderDice(config)).toBe(1);
    });
  });

  // ------- canAttack -------

  describe('canAttack', () => {
    test('needs at least 2 armies to attack', () => {
      expect(combat.canAttack(2)).toBe(true);
      expect(combat.canAttack(5)).toBe(true);
      expect(combat.canAttack(100)).toBe(true);
    });

    test('1 army returns false', () => {
      expect(combat.canAttack(1)).toBe(false);
    });

    test('0 armies returns false', () => {
      expect(combat.canAttack(0)).toBe(false);
    });
  });

  // ------- Conquest move validation -------

  describe('validateConquestMove', () => {
    test('minimum 1 army to move', () => {
      expect(combat.validateConquestMove(0, 5)).toBe(false);
      expect(combat.validateConquestMove(1, 5)).toBe(true);
    });

    test('maximum 3 armies to move', () => {
      expect(combat.validateConquestMove(3, 10)).toBe(true);
      expect(combat.validateConquestMove(4, 10)).toBe(false);
    });

    test("can't move more than available - 1 (must leave 1 behind)", () => {
      // available=3, so max movable = 2
      expect(combat.validateConquestMove(3, 3)).toBe(false);
      expect(combat.validateConquestMove(2, 3)).toBe(true);
      expect(combat.validateConquestMove(1, 3)).toBe(true);
    });

    test('edge case: available=2, can move exactly 1', () => {
      expect(combat.validateConquestMove(1, 2)).toBe(true);
      expect(combat.validateConquestMove(2, 2)).toBe(false);
    });
  });
});
