import { describe, test, expect } from 'vitest';
import { MissileSystem } from '../MissileSystem';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Territory = { owner: string; armies: number; missiles: number };

function makeTerritories(defs: Record<string, Territory>): Record<string, Territory> {
  return { ...defs };
}

// Simple linear adjacency: A -- B -- C -- D -- E
const LINEAR_ADJACENCY: Record<string, string[]> = {
  A: ['B'],
  B: ['A', 'C'],
  C: ['B', 'D'],
  D: ['C', 'E'],
  E: ['D'],
};

// Branching adjacency for more complex tests
const BRANCHED_ADJACENCY: Record<string, string[]> = {
  X: ['Y', 'Z'],
  Y: ['X', 'W'],
  Z: ['X'],
  W: ['Y'],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MissileSystem', () => {
  const ms = new MissileSystem();

  // ------- getDistance -------

  describe('getDistance', () => {
    test('distance to self is 0', () => {
      expect(ms.getDistance('A', 'A', LINEAR_ADJACENCY)).toBe(0);
    });

    test('adjacent countries have distance 1', () => {
      expect(ms.getDistance('A', 'B', LINEAR_ADJACENCY)).toBe(1);
    });

    test('countries 2 apart have distance 2', () => {
      expect(ms.getDistance('A', 'C', LINEAR_ADJACENCY)).toBe(2);
    });

    test('countries 3 apart have distance 3', () => {
      expect(ms.getDistance('A', 'D', LINEAR_ADJACENCY)).toBe(3);
    });

    test('unreachable country returns Infinity', () => {
      const disconnected: Record<string, string[]> = { A: [], B: [] };
      expect(ms.getDistance('A', 'B', disconnected)).toBe(Infinity);
    });
  });

  // ------- getDamage -------

  describe('getDamage', () => {
    test('distance 1 deals 3 damage', () => {
      expect(ms.getDamage(1)).toBe(3);
    });

    test('distance 2 deals 2 damage', () => {
      expect(ms.getDamage(2)).toBe(2);
    });

    test('distance 3 deals 1 damage', () => {
      expect(ms.getDamage(3)).toBe(1);
    });

    test('distance 4+ deals 0 damage (out of range)', () => {
      expect(ms.getDamage(4)).toBe(0);
      expect(ms.getDamage(5)).toBe(0);
      expect(ms.getDamage(100)).toBe(0);
    });

    test('distance 0 deals 0 damage', () => {
      expect(ms.getDamage(0)).toBe(0);
    });
  });

  // ------- getTargetsInRange -------

  describe('getTargetsInRange', () => {
    test('returns all countries within distance 1-3', () => {
      const targets = ms.getTargetsInRange('A', LINEAR_ADJACENCY);
      const targetIds = targets.map((t) => t.countryId);
      expect(targetIds).toContain('B'); // dist 1
      expect(targetIds).toContain('C'); // dist 2
      expect(targetIds).toContain('D'); // dist 3
      expect(targetIds).not.toContain('E'); // dist 4, out of range
      expect(targetIds).not.toContain('A'); // self
    });

    test('includes correct damage for each target', () => {
      const targets = ms.getTargetsInRange('A', LINEAR_ADJACENCY);
      const bTarget = targets.find((t) => t.countryId === 'B');
      const cTarget = targets.find((t) => t.countryId === 'C');
      const dTarget = targets.find((t) => t.countryId === 'D');
      expect(bTarget!.damage).toBe(3);
      expect(cTarget!.damage).toBe(2);
      expect(dTarget!.damage).toBe(1);
    });
  });

  // ------- incorporateMissile -------

  describe('incorporateMissile', () => {
    test('succeeds when territory has 7+ armies: costs 6 armies, gains 1 missile', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 8, missiles: 0 },
      });
      const result = ms.incorporateMissile('A', territories);
      expect(result).toBe(true);
      expect(territories.A.armies).toBe(2); // 8 - 6
      expect(territories.A.missiles).toBe(1);
    });

    test('fails when territory has exactly 7 armies (leaves 1 after spending 6)', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 7, missiles: 0 },
      });
      const result = ms.incorporateMissile('A', territories);
      expect(result).toBe(true);
      expect(territories.A.armies).toBe(1);
      expect(territories.A.missiles).toBe(1);
    });

    test('fails when territory has fewer than 7 armies', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 6, missiles: 0 },
      });
      const result = ms.incorporateMissile('A', territories);
      expect(result).toBe(false);
      expect(territories.A.armies).toBe(6); // unchanged
      expect(territories.A.missiles).toBe(0);
    });

    test('fails for invalid territory', () => {
      const result = ms.incorporateMissile('NONEXISTENT', {});
      expect(result).toBe(false);
    });

    test('can incorporate multiple missiles if enough armies', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 14, missiles: 0 },
      });
      ms.incorporateMissile('A', territories);
      // After first: 14-6=8 armies, 1 missile. 8>=7, so can do again
      ms.incorporateMissile('A', territories);
      expect(territories.A.armies).toBe(2); // 14-12
      expect(territories.A.missiles).toBe(2);
    });
  });

  // ------- fireMissile -------

  describe('fireMissile', () => {
    test('successful attack at distance 1: deals 3 damage', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 1 },
        B: { owner: 'p2', armies: 5, missiles: 0 },
      });
      const result = ms.fireMissile('A', 'B', territories, LINEAR_ADJACENCY);
      expect(result.success).toBe(true);
      expect(result.damage).toBe(3);
      expect(result.missileConsumed).toBe(true);
    });

    test('successful attack at distance 2: deals 2 damage', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 1 },
        B: { owner: 'other', armies: 2, missiles: 0 },
        C: { owner: 'p2', armies: 5, missiles: 0 },
      });
      const result = ms.fireMissile('A', 'C', territories, LINEAR_ADJACENCY);
      expect(result.success).toBe(true);
      expect(result.damage).toBe(2);
    });

    test('successful attack at distance 3: deals 1 damage', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 1 },
        B: { owner: 'other', armies: 2, missiles: 0 },
        C: { owner: 'other', armies: 2, missiles: 0 },
        D: { owner: 'p2', armies: 5, missiles: 0 },
      });
      const result = ms.fireMissile('A', 'D', territories, LINEAR_ADJACENCY);
      expect(result.success).toBe(true);
      expect(result.damage).toBe(1);
    });

    test('fails when target is out of range (distance 4+)', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 1 },
        B: { owner: 'other', armies: 2, missiles: 0 },
        C: { owner: 'other', armies: 2, missiles: 0 },
        D: { owner: 'other', armies: 2, missiles: 0 },
        E: { owner: 'p2', armies: 5, missiles: 0 },
      });
      const result = ms.fireMissile('A', 'E', territories, LINEAR_ADJACENCY);
      expect(result.success).toBe(false);
      expect(result.error).toContain('out of range');
    });

    test('fails when attacker has no missiles', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 0 },
        B: { owner: 'p2', armies: 5, missiles: 0 },
      });
      const result = ms.fireMissile('A', 'B', territories, LINEAR_ADJACENCY);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No missiles');
    });

    test('fails when attacking own country', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 1 },
        B: { owner: 'p1', armies: 5, missiles: 0 },
      });
      const result = ms.fireMissile('A', 'B', territories, LINEAR_ADJACENCY);
      expect(result.success).toBe(false);
      expect(result.error).toContain('own country');
    });

    test('fails when target has too few armies to survive', () => {
      // Distance 1 = 3 damage; target needs more than 3 armies
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 1 },
        B: { owner: 'p2', armies: 3, missiles: 0 },
      });
      const result = ms.fireMissile('A', 'B', territories, LINEAR_ADJACENCY);
      expect(result.success).toBe(false);
      expect(result.error).toContain('needs more than');
    });

    test('missile-vs-missile defense: fails when defender has equal missiles', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 1 },
        B: { owner: 'p2', armies: 5, missiles: 1 },
      });
      const result = ms.fireMissile('A', 'B', territories, LINEAR_ADJACENCY);
      expect(result.success).toBe(false);
      expect(result.error).toContain('missile defense');
    });

    test('missile-vs-missile: attacker succeeds when having more missiles than defender', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 2 },
        B: { owner: 'p2', armies: 5, missiles: 1 },
      });
      const result = ms.fireMissile('A', 'B', territories, LINEAR_ADJACENCY);
      expect(result.success).toBe(true);
      expect(result.damage).toBe(3);
    });

    test('fails for invalid countries', () => {
      const result = ms.fireMissile('NOPE', 'ALSO_NOPE', {}, LINEAR_ADJACENCY);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });

  // ------- applyMissileAttack -------

  describe('applyMissileAttack', () => {
    test('consumes 1 missile from attacker and reduces target armies', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 2 },
        B: { owner: 'p2', armies: 6, missiles: 0 },
      });
      ms.applyMissileAttack('A', 'B', 3, territories);
      expect(territories.A.missiles).toBe(1);
      expect(territories.B.armies).toBe(3);
    });
  });

  // ------- regroupMissile -------

  describe('regroupMissile', () => {
    test('successfully moves missile between adjacent owned territories', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 2 },
        B: { owner: 'p1', armies: 2, missiles: 0 },
      });
      const result = ms.regroupMissile('A', 'B', 1, territories, LINEAR_ADJACENCY);
      expect(result).toBe(true);
      expect(territories.A.missiles).toBe(1);
      expect(territories.B.missiles).toBe(1);
    });

    test('fails when territories are not adjacent', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 2 },
        C: { owner: 'p1', armies: 2, missiles: 0 },
      });
      const result = ms.regroupMissile('A', 'C', 1, territories, LINEAR_ADJACENCY);
      expect(result).toBe(false);
    });

    test('fails when territories belong to different owners', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 2 },
        B: { owner: 'p2', armies: 2, missiles: 0 },
      });
      const result = ms.regroupMissile('A', 'B', 1, territories, LINEAR_ADJACENCY);
      expect(result).toBe(false);
    });

    test('fails when source has insufficient missiles', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 1 },
        B: { owner: 'p1', armies: 2, missiles: 0 },
      });
      const result = ms.regroupMissile('A', 'B', 2, territories, LINEAR_ADJACENCY);
      expect(result).toBe(false);
    });

    test('can move multiple missiles at once', () => {
      const territories = makeTerritories({
        A: { owner: 'p1', armies: 3, missiles: 3 },
        B: { owner: 'p1', armies: 2, missiles: 0 },
      });
      const result = ms.regroupMissile('A', 'B', 3, territories, LINEAR_ADJACENCY);
      expect(result).toBe(true);
      expect(territories.A.missiles).toBe(0);
      expect(territories.B.missiles).toBe(3);
    });
  });
});
