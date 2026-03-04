import { describe, test, expect } from 'vitest';
import { BlockadeSystem, BlockadeInfo } from '../BlockadeSystem';

describe('BlockadeSystem', () => {
  const blockade = new BlockadeSystem();

  // ------- checkBlockade -------

  describe('checkBlockade', () => {
    test('blockade: minimum 3 adjacent of same enemy color with 2+ armies each', () => {
      const territories: Record<string, { owner: string; armies: number }> = {
        target: { owner: 'player1', armies: 2 },
        adj1: { owner: 'player2', armies: 3 },
        adj2: { owner: 'player2', armies: 2 },
        adj3: { owner: 'player2', armies: 5 },
      };
      const result = blockade.checkBlockade(
        'target',
        'player1',
        ['adj1', 'adj2', 'adj3'],
        territories,
      );
      expect(result).not.toBeNull();
      expect(result!.blockedCountry).toBe('target');
      expect(result!.blockerPlayer).toBe('player2');
      expect(result!.blockerCountries).toEqual(['adj1', 'adj2', 'adj3']);
    });

    test('not blocked: less than 3 adjacent countries', () => {
      const territories: Record<string, { owner: string; armies: number }> = {
        target: { owner: 'player1', armies: 2 },
        adj1: { owner: 'player2', armies: 3 },
        adj2: { owner: 'player2', armies: 2 },
      };
      const result = blockade.checkBlockade(
        'target',
        'player1',
        ['adj1', 'adj2'],
        territories,
      );
      expect(result).toBeNull();
    });

    test('not blocked: adjacent countries belong to different players', () => {
      const territories: Record<string, { owner: string; armies: number }> = {
        target: { owner: 'player1', armies: 2 },
        adj1: { owner: 'player2', armies: 3 },
        adj2: { owner: 'player3', armies: 2 },
        adj3: { owner: 'player2', armies: 5 },
      };
      const result = blockade.checkBlockade(
        'target',
        'player1',
        ['adj1', 'adj2', 'adj3'],
        territories,
      );
      expect(result).toBeNull();
    });

    test('not blocked: some adjacent country has only 1 army', () => {
      const territories: Record<string, { owner: string; armies: number }> = {
        target: { owner: 'player1', armies: 2 },
        adj1: { owner: 'player2', armies: 3 },
        adj2: { owner: 'player2', armies: 1 },
        adj3: { owner: 'player2', armies: 5 },
      };
      const result = blockade.checkBlockade(
        'target',
        'player1',
        ['adj1', 'adj2', 'adj3'],
        territories,
      );
      expect(result).toBeNull();
    });

    test('not blocked: one adjacent country is own', () => {
      const territories: Record<string, { owner: string; armies: number }> = {
        target: { owner: 'player1', armies: 2 },
        adj1: { owner: 'player2', armies: 3 },
        adj2: { owner: 'player1', armies: 2 },
        adj3: { owner: 'player2', armies: 5 },
      };
      const result = blockade.checkBlockade(
        'target',
        'player1',
        ['adj1', 'adj2', 'adj3'],
        territories,
      );
      expect(result).toBeNull();
    });

    test('blockade with exactly 3 adjacent all valid', () => {
      const territories: Record<string, { owner: string; armies: number }> = {
        target: { owner: 'player1', armies: 1 },
        adj1: { owner: 'player2', armies: 2 },
        adj2: { owner: 'player2', armies: 2 },
        adj3: { owner: 'player2', armies: 2 },
      };
      const result = blockade.checkBlockade(
        'target',
        'player1',
        ['adj1', 'adj2', 'adj3'],
        territories,
      );
      expect(result).not.toBeNull();
    });

    test('blockade with more than 3 adjacent all from same enemy', () => {
      const territories: Record<string, { owner: string; armies: number }> = {
        target: { owner: 'player1', armies: 1 },
        adj1: { owner: 'player2', armies: 2 },
        adj2: { owner: 'player2', armies: 3 },
        adj3: { owner: 'player2', armies: 4 },
        adj4: { owner: 'player2', armies: 5 },
      };
      const result = blockade.checkBlockade(
        'target',
        'player1',
        ['adj1', 'adj2', 'adj3', 'adj4'],
        territories,
      );
      expect(result).not.toBeNull();
      expect(result!.blockerCountries).toHaveLength(4);
    });
  });

  // ------- isBlockadeBroken -------

  describe('isBlockadeBroken', () => {
    test('blockade broken: blocker leaves country with 1 army', () => {
      const info: BlockadeInfo = {
        blockedCountry: 'target',
        blockerPlayer: 'player2',
        blockerCountries: ['adj1', 'adj2', 'adj3'],
      };
      const territories: Record<string, { owner: string; armies: number }> = {
        adj1: { owner: 'player2', armies: 2 },
        adj2: { owner: 'player2', armies: 1 }, // only 1 army -> broken
        adj3: { owner: 'player2', armies: 3 },
      };
      expect(blockade.isBlockadeBroken(info, territories, 5)).toBe(true);
    });

    test('blockade broken: blocker country conquered by someone else', () => {
      const info: BlockadeInfo = {
        blockedCountry: 'target',
        blockerPlayer: 'player2',
        blockerCountries: ['adj1', 'adj2', 'adj3'],
      };
      const territories: Record<string, { owner: string; armies: number }> = {
        adj1: { owner: 'player2', armies: 2 },
        adj2: { owner: 'player3', armies: 5 }, // different owner -> broken
        adj3: { owner: 'player2', armies: 3 },
      };
      expect(blockade.isBlockadeBroken(info, territories, 5)).toBe(true);
    });

    test('blockade broken: only country remaining (playerCountryCount <= 1)', () => {
      const info: BlockadeInfo = {
        blockedCountry: 'target',
        blockerPlayer: 'player2',
        blockerCountries: ['adj1', 'adj2', 'adj3'],
      };
      const territories: Record<string, { owner: string; armies: number }> = {
        adj1: { owner: 'player2', armies: 5 },
        adj2: { owner: 'player2', armies: 5 },
        adj3: { owner: 'player2', armies: 5 },
      };
      // Even though blocker countries are fine, playerCountryCount = 1 means broken
      expect(blockade.isBlockadeBroken(info, territories, 1)).toBe(true);
    });

    test('blockade broken: blocker country no longer exists in territories', () => {
      const info: BlockadeInfo = {
        blockedCountry: 'target',
        blockerPlayer: 'player2',
        blockerCountries: ['adj1', 'adj2', 'adj3'],
      };
      const territories: Record<string, { owner: string; armies: number }> = {
        adj1: { owner: 'player2', armies: 5 },
        // adj2 is missing from territories
        adj3: { owner: 'player2', armies: 5 },
      };
      expect(blockade.isBlockadeBroken(info, territories, 5)).toBe(true);
    });

    test('blockade NOT broken when all conditions still met', () => {
      const info: BlockadeInfo = {
        blockedCountry: 'target',
        blockerPlayer: 'player2',
        blockerCountries: ['adj1', 'adj2', 'adj3'],
      };
      const territories: Record<string, { owner: string; armies: number }> = {
        adj1: { owner: 'player2', armies: 2 },
        adj2: { owner: 'player2', armies: 3 },
        adj3: { owner: 'player2', armies: 4 },
      };
      expect(blockade.isBlockadeBroken(info, territories, 5)).toBe(false);
    });
  });

  // ------- canReceiveReinforcements -------

  describe('canReceiveReinforcements', () => {
    test("can't receive reinforcements when blocked", () => {
      expect(blockade.canReceiveReinforcements(true, false)).toBe(false);
    });

    test('CAN receive reinforcements during initial placement even if blocked', () => {
      expect(blockade.canReceiveReinforcements(true, true)).toBe(true);
    });

    test('can receive reinforcements when not blocked', () => {
      expect(blockade.canReceiveReinforcements(false, false)).toBe(true);
    });

    test('can receive reinforcements when not blocked even during initial placement', () => {
      expect(blockade.canReceiveReinforcements(false, true)).toBe(true);
    });
  });

  // ------- checkAllBlockades -------

  describe('checkAllBlockades', () => {
    test('detects blockade across multiple territories', () => {
      const territories: Record<string, { owner: string; armies: number }> = {
        target: { owner: 'player1', armies: 1 },
        adj1: { owner: 'player2', armies: 2 },
        adj2: { owner: 'player2', armies: 2 },
        adj3: { owner: 'player2', armies: 2 },
        free: { owner: 'player3', armies: 5 },
      };
      const adjacency: Record<string, string[]> = {
        target: ['adj1', 'adj2', 'adj3'],
        adj1: ['target'],
        adj2: ['target'],
        adj3: ['target'],
        free: [],
      };
      const blockades = blockade.checkAllBlockades(territories, adjacency);
      expect(blockades).toHaveLength(1);
      expect(blockades[0].blockedCountry).toBe('target');
    });

    test('returns empty when no blockades exist', () => {
      const territories: Record<string, { owner: string; armies: number }> = {
        c1: { owner: 'player1', armies: 3 },
        c2: { owner: 'player1', armies: 2 },
        c3: { owner: 'player2', armies: 4 },
      };
      const adjacency: Record<string, string[]> = {
        c1: ['c2', 'c3'],
        c2: ['c1', 'c3'],
        c3: ['c1', 'c2'],
      };
      const blockades = blockade.checkAllBlockades(territories, adjacency);
      expect(blockades).toHaveLength(0);
    });
  });
});
