import { describe, test, expect } from 'vitest';
import { TerritoryManager, TerritoryState } from '../TerritoryManager';

describe('TerritoryManager', () => {
  function makeTerritories(data: Record<string, Partial<TerritoryState>>): Record<string, TerritoryState> {
    const result: Record<string, TerritoryState> = {};
    for (const [id, partial] of Object.entries(data)) {
      result[id] = {
        owner: partial.owner ?? 'nobody',
        armies: partial.armies ?? 1,
        missiles: partial.missiles ?? 0,
        isBlocked: partial.isBlocked ?? false,
      };
    }
    return result;
  }

  // ------- distributeCountries -------

  describe('distributeCountries', () => {
    test('assigns all countries', () => {
      const countries = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
      const players = ['p1', 'p2', 'p3'];
      const result = TerritoryManager.distributeCountries(countries, players);

      expect(Object.keys(result)).toHaveLength(6);
      for (const c of countries) {
        expect(result[c]).toBeDefined();
      }
    });

    test('each country starts with 1 army', () => {
      const countries = ['c1', 'c2', 'c3', 'c4'];
      const players = ['p1', 'p2'];
      const result = TerritoryManager.distributeCountries(countries, players);

      for (const c of countries) {
        expect(result[c].armies).toBe(1);
      }
    });

    test('each country has 0 missiles and is not blocked', () => {
      const countries = ['c1', 'c2', 'c3'];
      const players = ['p1'];
      const result = TerritoryManager.distributeCountries(countries, players);

      for (const c of countries) {
        expect(result[c].missiles).toBe(0);
        expect(result[c].isBlocked).toBe(false);
      }
    });

    test('countries are distributed among all players', () => {
      const countries = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
      const players = ['p1', 'p2', 'p3'];
      const result = TerritoryManager.distributeCountries(countries, players);

      const owners = Object.values(result).map(t => t.owner);
      // Each player should own at least one country (6 countries / 3 players = 2 each)
      for (const p of players) {
        expect(owners.filter(o => o === p).length).toBeGreaterThanOrEqual(1);
      }
      // Total ownership = total countries
      expect(owners).toHaveLength(6);
    });
  });

  // ------- getPlayerCountries / countPlayerCountries -------

  describe('getPlayerCountries and countPlayerCountries', () => {
    test('getPlayerCountries returns correct list', () => {
      const territories = makeTerritories({
        argentina: { owner: 'p1' },
        brasil: { owner: 'p2' },
        chile: { owner: 'p1' },
        peru: { owner: 'p3' },
      });
      const tm = new TerritoryManager(territories);
      const p1Countries = tm.getPlayerCountries('p1');
      expect(p1Countries).toHaveLength(2);
      expect(p1Countries).toContain('argentina');
      expect(p1Countries).toContain('chile');
    });

    test('countPlayerCountries is accurate', () => {
      const territories = makeTerritories({
        c1: { owner: 'p1' },
        c2: { owner: 'p1' },
        c3: { owner: 'p1' },
        c4: { owner: 'p2' },
        c5: { owner: 'p2' },
      });
      const tm = new TerritoryManager(territories);
      expect(tm.countPlayerCountries('p1')).toBe(3);
      expect(tm.countPlayerCountries('p2')).toBe(2);
      expect(tm.countPlayerCountries('p3')).toBe(0);
    });
  });

  // ------- ownsContinent -------

  describe('ownsContinent', () => {
    test('returns true when all countries owned', () => {
      const territories = makeTerritories({
        c1: { owner: 'p1' },
        c2: { owner: 'p1' },
        c3: { owner: 'p1' },
        other: { owner: 'p2' },
      });
      const tm = new TerritoryManager(territories);
      expect(tm.ownsContinent('p1', ['c1', 'c2', 'c3'])).toBe(true);
    });

    test('returns false when missing one', () => {
      const territories = makeTerritories({
        c1: { owner: 'p1' },
        c2: { owner: 'p2' }, // enemy owns this one
        c3: { owner: 'p1' },
      });
      const tm = new TerritoryManager(territories);
      expect(tm.ownsContinent('p1', ['c1', 'c2', 'c3'])).toBe(false);
    });

    test('returns false when country does not exist in territories', () => {
      const territories = makeTerritories({
        c1: { owner: 'p1' },
      });
      const tm = new TerritoryManager(territories);
      // c2 doesn't exist
      expect(tm.ownsContinent('p1', ['c1', 'c2'])).toBe(false);
    });
  });

  // ------- getOwnedContinents -------

  describe('getOwnedContinents', () => {
    test('returns continents where player owns all countries', () => {
      const territories = makeTerritories({
        a1: { owner: 'p1' },
        a2: { owner: 'p1' },
        b1: { owner: 'p1' },
        b2: { owner: 'p2' },
      });
      const tm = new TerritoryManager(territories);
      const continentsMap = {
        CONT_A: ['a1', 'a2'],
        CONT_B: ['b1', 'b2'],
      };
      const owned = tm.getOwnedContinents('p1', continentsMap);
      expect(owned).toEqual(['CONT_A']);
    });
  });

  // ------- placeArmies / removeArmies -------

  describe('placeArmies', () => {
    test('increases army count', () => {
      const territories = makeTerritories({ c1: { owner: 'p1', armies: 3 } });
      const tm = new TerritoryManager(territories);
      tm.placeArmies('c1', 5);
      expect(tm.getTerritory('c1')!.armies).toBe(8);
    });

    test('increases by 1', () => {
      const territories = makeTerritories({ c1: { owner: 'p1', armies: 1 } });
      const tm = new TerritoryManager(territories);
      tm.placeArmies('c1', 1);
      expect(tm.getTerritory('c1')!.armies).toBe(2);
    });
  });

  describe('removeArmies', () => {
    test('decreases army count', () => {
      const territories = makeTerritories({ c1: { owner: 'p1', armies: 5 } });
      const tm = new TerritoryManager(territories);
      tm.removeArmies('c1', 3);
      expect(tm.getTerritory('c1')!.armies).toBe(2);
    });

    test('never goes below 0', () => {
      const territories = makeTerritories({ c1: { owner: 'p1', armies: 2 } });
      const tm = new TerritoryManager(territories);
      tm.removeArmies('c1', 10);
      expect(tm.getTerritory('c1')!.armies).toBe(0);
    });
  });

  // ------- moveArmies -------

  describe('moveArmies', () => {
    test('success between own adjacent countries', () => {
      const territories = makeTerritories({
        from: { owner: 'p1', armies: 5 },
        to: { owner: 'p1', armies: 2 },
      });
      const tm = new TerritoryManager(territories);
      const result = tm.moveArmies('from', 'to', 3);
      expect(result).toBe(true);
      expect(tm.getTerritory('from')!.armies).toBe(2);
      expect(tm.getTerritory('to')!.armies).toBe(5);
    });

    test('fails if not enough armies (must leave 1)', () => {
      const territories = makeTerritories({
        from: { owner: 'p1', armies: 3 },
        to: { owner: 'p1', armies: 1 },
      });
      const tm = new TerritoryManager(territories);
      // Trying to move 3 from a territory with 3 armies -> 3-3=0 < 1 -> false
      const result = tm.moveArmies('from', 'to', 3);
      expect(result).toBe(false);
      // armies should remain unchanged
      expect(tm.getTerritory('from')!.armies).toBe(3);
      expect(tm.getTerritory('to')!.armies).toBe(1);
    });

    test('can move exactly armies-1', () => {
      const territories = makeTerritories({
        from: { owner: 'p1', armies: 4 },
        to: { owner: 'p1', armies: 1 },
      });
      const tm = new TerritoryManager(territories);
      const result = tm.moveArmies('from', 'to', 3);
      expect(result).toBe(true);
      expect(tm.getTerritory('from')!.armies).toBe(1);
      expect(tm.getTerritory('to')!.armies).toBe(4);
    });

    test('fails between different owners', () => {
      const territories = makeTerritories({
        from: { owner: 'p1', armies: 5 },
        to: { owner: 'p2', armies: 2 },
      });
      const tm = new TerritoryManager(territories);
      const result = tm.moveArmies('from', 'to', 2);
      expect(result).toBe(false);
    });

    test('fails if source territory does not exist', () => {
      const territories = makeTerritories({
        to: { owner: 'p1', armies: 2 },
      });
      const tm = new TerritoryManager(territories);
      const result = tm.moveArmies('nonexistent', 'to', 1);
      expect(result).toBe(false);
    });

    test('fails if destination territory does not exist', () => {
      const territories = makeTerritories({
        from: { owner: 'p1', armies: 5 },
      });
      const tm = new TerritoryManager(territories);
      const result = tm.moveArmies('from', 'nonexistent', 1);
      expect(result).toBe(false);
    });
  });

  // ------- conquer -------

  describe('conquer', () => {
    test('transfers ownership', () => {
      const territories = makeTerritories({
        target: { owner: 'p2', armies: 0 },
      });
      const tm = new TerritoryManager(territories);
      tm.conquer('target', 'p1', 3);
      const t = tm.getTerritory('target')!;
      expect(t.owner).toBe('p1');
      expect(t.armies).toBe(3);
      expect(t.isBlocked).toBe(false);
    });

    test('clears coOwner data on conquest', () => {
      const territories: Record<string, TerritoryState> = {
        target: {
          owner: 'p2',
          armies: 0,
          missiles: 0,
          isBlocked: true,
          coOwner: 'p3',
          coOwnerArmies: 2,
          coOwnerMissiles: 1,
        },
      };
      const tm = new TerritoryManager(territories);
      tm.conquer('target', 'p1', 2);
      const t = tm.getTerritory('target')!;
      expect(t.owner).toBe('p1');
      expect(t.isBlocked).toBe(false);
      expect(t.coOwner).toBeUndefined();
      expect(t.coOwnerArmies).toBeUndefined();
      expect(t.coOwnerMissiles).toBeUndefined();
    });
  });

  // ------- convertToMissile -------

  describe('convertToMissile', () => {
    test('needs 7+ armies (6 for missile + 1 minimum remaining)', () => {
      const territories = makeTerritories({
        c1: { owner: 'p1', armies: 7, missiles: 0 },
      });
      const tm = new TerritoryManager(territories);
      const result = tm.convertToMissile('c1');
      expect(result).toBe(true);
      expect(tm.getTerritory('c1')!.armies).toBe(1);
      expect(tm.getTerritory('c1')!.missiles).toBe(1);
    });

    test('reduces armies by 6 and increases missiles by 1', () => {
      const territories = makeTerritories({
        c1: { owner: 'p1', armies: 10, missiles: 2 },
      });
      const tm = new TerritoryManager(territories);
      const result = tm.convertToMissile('c1');
      expect(result).toBe(true);
      expect(tm.getTerritory('c1')!.armies).toBe(4);
      expect(tm.getTerritory('c1')!.missiles).toBe(3);
    });

    test('fails with less than 7 armies', () => {
      const territories = makeTerritories({
        c1: { owner: 'p1', armies: 6, missiles: 0 },
      });
      const tm = new TerritoryManager(territories);
      const result = tm.convertToMissile('c1');
      expect(result).toBe(false);
      expect(tm.getTerritory('c1')!.armies).toBe(6);
      expect(tm.getTerritory('c1')!.missiles).toBe(0);
    });

    test('fails with exactly 1 army', () => {
      const territories = makeTerritories({
        c1: { owner: 'p1', armies: 1, missiles: 0 },
      });
      const tm = new TerritoryManager(territories);
      expect(tm.convertToMissile('c1')).toBe(false);
    });

    test('fails if territory does not exist', () => {
      const tm = new TerritoryManager({});
      expect(tm.convertToMissile('nonexistent')).toBe(false);
    });

    test('can convert multiple times if enough armies', () => {
      const territories = makeTerritories({
        c1: { owner: 'p1', armies: 14, missiles: 0 },
      });
      const tm = new TerritoryManager(territories);

      expect(tm.convertToMissile('c1')).toBe(true);
      expect(tm.getTerritory('c1')!.armies).toBe(8);
      expect(tm.getTerritory('c1')!.missiles).toBe(1);

      expect(tm.convertToMissile('c1')).toBe(true);
      expect(tm.getTerritory('c1')!.armies).toBe(2);
      expect(tm.getTerritory('c1')!.missiles).toBe(2);

      // Now only 2 armies left, can't convert again
      expect(tm.convertToMissile('c1')).toBe(false);
    });
  });

  // ------- setBlocked -------

  describe('setBlocked', () => {
    test('sets blocked status on territory', () => {
      const territories = makeTerritories({ c1: { owner: 'p1' } });
      const tm = new TerritoryManager(territories);
      expect(tm.getTerritory('c1')!.isBlocked).toBe(false);
      tm.setBlocked('c1', true);
      expect(tm.getTerritory('c1')!.isBlocked).toBe(true);
      tm.setBlocked('c1', false);
      expect(tm.getTerritory('c1')!.isBlocked).toBe(false);
    });
  });

  // ------- moveMissiles -------

  describe('moveMissiles', () => {
    test('moves missiles between own territories', () => {
      const territories = makeTerritories({
        from: { owner: 'p1', armies: 3, missiles: 2 },
        to: { owner: 'p1', armies: 2, missiles: 0 },
      });
      const tm = new TerritoryManager(territories);
      const result = tm.moveMissiles('from', 'to', 1);
      expect(result).toBe(true);
      expect(tm.getTerritory('from')!.missiles).toBe(1);
      expect(tm.getTerritory('to')!.missiles).toBe(1);
    });

    test('fails if not enough missiles', () => {
      const territories = makeTerritories({
        from: { owner: 'p1', armies: 3, missiles: 1 },
        to: { owner: 'p1', armies: 2, missiles: 0 },
      });
      const tm = new TerritoryManager(territories);
      const result = tm.moveMissiles('from', 'to', 2);
      expect(result).toBe(false);
    });

    test('fails between different owners', () => {
      const territories = makeTerritories({
        from: { owner: 'p1', armies: 3, missiles: 2 },
        to: { owner: 'p2', armies: 2, missiles: 0 },
      });
      const tm = new TerritoryManager(territories);
      const result = tm.moveMissiles('from', 'to', 1);
      expect(result).toBe(false);
    });
  });
});
