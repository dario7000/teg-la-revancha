import { describe, test, expect } from 'vitest';
import { ObjectiveChecker } from '../ObjectiveChecker';
import type { Objective, OccupationRequirement } from '../../data/objectives';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CountryData {
  id: string;
  continent: string;
  isIsland: boolean;
}

function makeCountries(continent: string, count: number, isIsland = false): CountryData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${continent}_${i}`,
    continent,
    isIsland,
  }));
}

function makeIslands(continent: string, count: number): CountryData[] {
  return makeCountries(continent, count, true);
}

// Builds a minimal list of player-owned country IDs from CountryData[]
function ids(countries: CountryData[]): string[] {
  return countries.map((c) => c.id);
}

function makePlayers(overrides?: Partial<{ id: string; color: string; eliminated: boolean }>[]) {
  const defaults = [
    { id: 'p1', color: 'WHITE', eliminated: false },
    { id: 'p2', color: 'BLACK', eliminated: false },
    { id: 'p3', color: 'RED', eliminated: false },
    { id: 'p4', color: 'BLUE', eliminated: false },
  ];
  if (!overrides) return defaults;
  return defaults.map((d, i) => ({ ...d, ...(overrides[i] || {}) }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ObjectiveChecker', () => {
  const checker = new ObjectiveChecker();

  // ------- Occupation objectives -------

  describe('checkOccupationObjective', () => {
    test('continent count requirement: met when player owns enough countries', () => {
      const europeCountries = makeCountries('EUROPA', 6);
      const reqs: OccupationRequirement[] = [{ continent: 'EUROPA', count: 4 }];
      expect(checker.checkOccupationObjective(reqs, ids(europeCountries), europeCountries)).toBe(true);
    });

    test('continent count requirement: not met when player owns too few', () => {
      const europeCountries = makeCountries('EUROPA', 3);
      const reqs: OccupationRequirement[] = [{ continent: 'EUROPA', count: 4 }];
      expect(checker.checkOccupationObjective(reqs, ids(europeCountries), europeCountries)).toBe(false);
    });

    test('multiple continent requirements must all be satisfied', () => {
      const europe = makeCountries('EUROPA', 4);
      const asia = makeCountries('ASIA', 2);
      const all = [...europe, ...asia];
      const reqs: OccupationRequirement[] = [
        { continent: 'EUROPA', count: 4 },
        { continent: 'ASIA', count: 4 },
      ];
      // Europe met (4>=4), Asia not met (2<4)
      expect(checker.checkOccupationObjective(reqs, ids(all), all)).toBe(false);
    });

    test('fullContinent requires ALL countries of that continent', () => {
      // Simulate a continent with 16 countries; player owns only 15
      const allEurope = makeCountries('EUROPA', 16);
      const ownedEurope = allEurope.slice(0, 15);
      const reqs: OccupationRequirement[] = [{ continent: 'EUROPA', count: 16, fullContinent: true }];
      // count check: 15 < 16 -> fails
      expect(checker.checkOccupationObjective(reqs, ids(ownedEurope), allEurope)).toBe(false);

      // Now own all 16
      expect(checker.checkOccupationObjective(reqs, ids(allEurope), allEurope)).toBe(true);
    });

    test('island requirement: need N islands total', () => {
      const islands = [
        ...makeIslands('EUROPA', 2),
        ...makeIslands('OCEANIA', 2),
        ...makeIslands('ASIA', 2),
      ];
      const reqs: OccupationRequirement[] = [{ isIsland: true, count: 6, minContinents: 3 }];
      expect(checker.checkOccupationObjective(reqs, ids(islands), islands)).toBe(true);
    });

    test('island requirement: fails when not enough islands', () => {
      const islands = makeIslands('EUROPA', 3);
      const reqs: OccupationRequirement[] = [{ isIsland: true, count: 6, minContinents: 2 }];
      expect(checker.checkOccupationObjective(reqs, ids(islands), islands)).toBe(false);
    });

    test('island requirement: fails when too few continents', () => {
      // 6 islands but only from 2 continents, need 3
      const islands = [...makeIslands('EUROPA', 3), ...makeIslands('OCEANIA', 3)];
      const reqs: OccupationRequirement[] = [{ isIsland: true, count: 6, minContinents: 3 }];
      expect(checker.checkOccupationObjective(reqs, ids(islands), islands)).toBe(false);
    });

    test('general count: 35 countries anywhere', () => {
      const countries = makeCountries('MIXED', 35);
      const reqs: OccupationRequirement[] = [{ count: 35 }];
      expect(checker.checkOccupationObjective(reqs, ids(countries), countries)).toBe(true);
    });

    test('general count: fails with fewer than required', () => {
      const countries = makeCountries('MIXED', 34);
      const reqs: OccupationRequirement[] = [{ count: 35 }];
      expect(checker.checkOccupationObjective(reqs, ids(countries), countries)).toBe(false);
    });
  });

  // ------- Destruction objectives -------

  describe('checkDestructionObjective', () => {
    test('returns true when target was eliminated by the checking player', () => {
      const eliminated = [{ id: 'target', eliminatedBy: 'checker' }];
      expect(checker.checkDestructionObjective('RED', 'target', eliminated, 'checker')).toBe(true);
    });

    test('returns false when target was eliminated by someone else', () => {
      const eliminated = [{ id: 'target', eliminatedBy: 'other_player' }];
      expect(checker.checkDestructionObjective('RED', 'target', eliminated, 'checker')).toBe(false);
    });

    test('returns false when target is not eliminated', () => {
      expect(checker.checkDestructionObjective('RED', 'target', [], 'checker')).toBe(false);
    });

    test('returns false when targetPlayerId is null', () => {
      expect(checker.checkDestructionObjective('RED', null, [], 'checker')).toBe(false);
    });
  });

  // ------- Common victory -------

  describe('checkCommonVictory', () => {
    test('returns true with 45 countries', () => {
      expect(checker.checkCommonVictory(45)).toBe(true);
    });

    test('returns true with more than 45 countries', () => {
      expect(checker.checkCommonVictory(50)).toBe(true);
    });

    test('returns false with 44 countries', () => {
      expect(checker.checkCommonVictory(44)).toBe(false);
    });
  });

  // ------- resolveDestructionTarget -------

  describe('resolveDestructionTarget', () => {
    test('returns the player with the target color when active', () => {
      const players = makePlayers();
      // target RED, player is WHITE (index 0), RED is at index 2
      const result = checker.resolveDestructionTarget('RED', 'WHITE', players, 0);
      expect(result).toBe('p3');
    });

    test('falls back to player to the right when target color is own color', () => {
      const players = makePlayers();
      // Player p1 (WHITE) targets WHITE -> fallback to right (p2)
      const result = checker.resolveDestructionTarget('WHITE', 'WHITE', players, 0);
      expect(result).toBe('p2');
    });

    test('falls back to player to the right when target is eliminated', () => {
      const players = makePlayers([
        {}, // p1 WHITE
        {}, // p2 BLACK
        { eliminated: true }, // p3 RED eliminated
        {}, // p4 BLUE
      ]);
      // Target RED (p3) but p3 is eliminated. Player is p1 (index 0) -> next non-eliminated is p2
      const result = checker.resolveDestructionTarget('RED', 'WHITE', players, 0);
      expect(result).toBe('p2');
    });

    test('wraps around turn order for the right player', () => {
      const players = makePlayers([
        { eliminated: true }, // p1 eliminated
        { eliminated: true }, // p2 eliminated
        { eliminated: true }, // p3 eliminated
        {}, // p4 active
      ]);
      // Only p4 is alive. Target some missing color -> fallback to right from p4 index 3:
      // (3+1)%4=0(elim), (3+2)%4=1(elim), (3+3)%4=2(elim) -> returns self p4
      const result = checker.resolveDestructionTarget('YELLOW', 'BLUE', players, 3);
      expect(result).toBe('p4');
    });
  });

  // ------- resolveDestroyLeftTarget -------

  describe('resolveDestroyLeftTarget', () => {
    test('returns the player to the left (counter-clockwise)', () => {
      const players = makePlayers();
      // Player p2 at index 1 -> left is index 0 = p1
      const result = checker.resolveDestroyLeftTarget(players, 1);
      expect(result).toBe('p1');
    });

    test('wraps around for player at index 0', () => {
      const players = makePlayers();
      // Player p1 at index 0 -> left is (0-1+4)%4 = 3 = p4
      const result = checker.resolveDestroyLeftTarget(players, 0);
      expect(result).toBe('p4');
    });

    test('skips eliminated players to the left', () => {
      const players = makePlayers([
        {},
        {},
        { eliminated: true }, // p3 eliminated
        {},
      ]);
      // Player p4 at index 3 -> left is (3-1)%4=2 (p3 elim), (3-2)%4=1 (p2) -> p2
      const result = checker.resolveDestroyLeftTarget(players, 3);
      expect(result).toBe('p2');
    });
  });

  // ------- checkVictory (full) -------

  describe('checkVictory', () => {
    test('common victory with 45+ countries overrides any objective', () => {
      const countries = makeCountries('MIXED', 45);
      const objective: Objective = {
        id: 'OBJ_01',
        type: 'OCCUPATION',
        description: 'test',
        requirements: [{ continent: 'EUROPA', count: 99 }], // impossible
      };
      const result = checker.checkVictory(objective, ids(countries), countries, [], 'p1');
      expect(result.won).toBe(true);
      expect(result.method).toBe('COMMON_45');
    });

    test('occupation objective victory', () => {
      const europe = makeCountries('EUROPA', 4);
      const asia = makeCountries('ASIA', 4);
      const all = [...europe, ...asia];
      const objective: Objective = {
        id: 'OBJ_TEST',
        type: 'OCCUPATION',
        description: 'test',
        requirements: [
          { continent: 'EUROPA', count: 4 },
          { continent: 'ASIA', count: 4 },
        ],
      };
      const result = checker.checkVictory(objective, ids(all), all, [], 'p1');
      expect(result.won).toBe(true);
      expect(result.method).toBe('OBJECTIVE');
    });

    test('destruction objective victory', () => {
      const objective: Objective = {
        id: 'OBJ_DESTROY_RED',
        type: 'DESTRUCTION',
        description: 'test',
        targetColor: 'RED',
      };
      const eliminated = [{ id: 'p3', eliminatedBy: 'p1' }];
      const result = checker.checkVictory(objective, [], [], eliminated, 'p1', 'p3');
      expect(result.won).toBe(true);
      expect(result.method).toBe('OBJECTIVE');
    });

    test('DESTROY_LEFT objective victory', () => {
      const objective: Objective = {
        id: 'OBJ_DESTROY_LEFT',
        type: 'DESTROY_LEFT',
        description: 'test',
      };
      const eliminated = [{ id: 'p4', eliminatedBy: 'p1' }];
      const result = checker.checkVictory(objective, [], [], eliminated, 'p1', 'p4');
      expect(result.won).toBe(true);
      expect(result.method).toBe('OBJECTIVE');
    });

    test('returns not won when objective is not met', () => {
      const objective: Objective = {
        id: 'OBJ_TEST',
        type: 'OCCUPATION',
        description: 'test',
        requirements: [{ count: 99 }],
      };
      const result = checker.checkVictory(objective, ['c1', 'c2'], [], [], 'p1');
      expect(result.won).toBe(false);
      expect(result.method).toBe('');
    });
  });
});
