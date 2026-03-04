import { describe, test, expect } from 'vitest';
import { TurnManager } from '../TurnManager';

describe('TurnManager', () => {
  // ------- Rotation -------

  describe('rotation', () => {
    test('[A,B,C,D] -> [B,C,D,A] after rotation', () => {
      const tm = new TurnManager(['A', 'B', 'C', 'D']);
      tm.rotateTurnOrder();
      expect(tm.getTurnOrder()).toEqual(['B', 'C', 'D', 'A']);
    });

    test('double rotation produces [C,D,A,B]', () => {
      const tm = new TurnManager(['A', 'B', 'C', 'D']);
      tm.rotateTurnOrder();
      tm.rotateTurnOrder();
      expect(tm.getTurnOrder()).toEqual(['C', 'D', 'A', 'B']);
    });
  });

  // ------- Current player -------

  describe('getCurrentPlayer', () => {
    test('current player advances correctly', () => {
      const tm = new TurnManager(['A', 'B', 'C']);
      expect(tm.getCurrentPlayer()).toBe('A');

      tm.endTurn();
      expect(tm.getCurrentPlayer()).toBe('B');

      tm.endTurn();
      expect(tm.getCurrentPlayer()).toBe('C');
    });
  });

  // ------- New round -------

  describe('endTurn and new round', () => {
    test('new round triggers rotation', () => {
      const tm = new TurnManager(['A', 'B', 'C']);

      // End turn for A -> B
      const r1 = tm.endTurn();
      expect(r1.newRound).toBe(false);
      expect(r1.nextPlayer).toBe('B');

      // End turn for B -> C
      const r2 = tm.endTurn();
      expect(r2.newRound).toBe(false);
      expect(r2.nextPlayer).toBe('C');

      // End turn for C -> new round, rotation happens: [A,B,C] -> [B,C,A]
      const r3 = tm.endTurn();
      expect(r3.newRound).toBe(true);
      expect(tm.getRoundNumber()).toBe(2);
      // After rotation, order is [B,C,A], current index is 0 -> B
      expect(r3.nextPlayer).toBe('B');
      expect(tm.getTurnOrder()).toEqual(['B', 'C', 'A']);
    });
  });

  // ------- Turn phases -------

  describe('turn phases', () => {
    test('first player in round gets SITUATION_CARD phase', () => {
      const tm = new TurnManager(['A', 'B']);
      expect(tm.getTurnPhase()).toBe('SITUATION_CARD');
      expect(tm.isFirstPlayerInRound()).toBe(true);
    });

    test('other players start with REINFORCE phase', () => {
      const tm = new TurnManager(['A', 'B', 'C']);
      // End A's turn -> B's turn
      tm.endTurn();
      expect(tm.getTurnPhase()).toBe('REINFORCE');
    });

    test('first player of round 2+ gets SITUATION_CARD phase', () => {
      const tm = new TurnManager(['A', 'B']);
      // End A's turn -> B (REINFORCE)
      tm.endTurn();
      expect(tm.getTurnPhase()).toBe('REINFORCE');
      // End B's turn -> new round, rotation: [A,B]->[B,A], index=0 -> B
      tm.endTurn();
      expect(tm.getTurnPhase()).toBe('SITUATION_CARD');
    });

    test('advancePhase goes through phases in order', () => {
      const tm = new TurnManager(['A']);
      expect(tm.getTurnPhase()).toBe('SITUATION_CARD');
      tm.advancePhase();
      expect(tm.getTurnPhase()).toBe('REINFORCE');
      tm.advancePhase();
      expect(tm.getTurnPhase()).toBe('TRADE');
      tm.advancePhase();
      expect(tm.getTurnPhase()).toBe('ATTACK');
      tm.advancePhase();
      expect(tm.getTurnPhase()).toBe('REGROUP');
      tm.advancePhase();
      expect(tm.getTurnPhase()).toBe('DRAW_CARD');
      tm.advancePhase();
      expect(tm.getTurnPhase()).toBe('DRAW_CONTINENT_CARD');
    });

    test('advancePhase does not go past last phase', () => {
      const tm = new TurnManager(['A']);
      tm.setTurnPhase('DRAW_CONTINENT_CARD');
      tm.advancePhase();
      expect(tm.getTurnPhase()).toBe('DRAW_CONTINENT_CARD');
    });
  });

  // ------- Attack / Regroup -------

  describe('canAttack and startRegrouping', () => {
    test("can't attack after starting regroup", () => {
      const tm = new TurnManager(['A', 'B']);
      // Move to ATTACK phase
      tm.setTurnPhase('ATTACK');
      expect(tm.canAttack()).toBe(true);

      tm.startRegrouping();
      expect(tm.canAttack()).toBe(false);
      expect(tm.getTurnPhase()).toBe('REGROUP');
    });

    test('canAttack returns false if not in ATTACK phase', () => {
      const tm = new TurnManager(['A']);
      expect(tm.getTurnPhase()).toBe('SITUATION_CARD');
      expect(tm.canAttack()).toBe(false);
    });

    test('hasStartedRegrouping resets on endTurn', () => {
      const tm = new TurnManager(['A', 'B']);
      tm.setTurnPhase('ATTACK');
      tm.startRegrouping();
      expect(tm.canAttack()).toBe(false);

      tm.endTurn(); // B's turn
      tm.setTurnPhase('ATTACK');
      expect(tm.canAttack()).toBe(true);
    });
  });

  // ------- Remove player -------

  describe('removePlayer', () => {
    test('remove player adjusts order', () => {
      const tm = new TurnManager(['A', 'B', 'C', 'D']);
      tm.removePlayer('B');
      expect(tm.getTurnOrder()).toEqual(['A', 'C', 'D']);
    });

    test('removing current player wraps index if needed', () => {
      const tm = new TurnManager(['A', 'B', 'C']);
      // Advance to C (index 2)
      tm.endTurn(); // -> B
      tm.endTurn(); // -> C (index 2)
      // Now remove C (current). After removal, order=[A,B], index=2 >= length=2, wraps to 0
      tm.removePlayer('C');
      expect(tm.getCurrentPlayer()).toBe('A');
      expect(tm.getTurnOrder()).toEqual(['A', 'B']);
    });

    test('removing non-current player does not change current player', () => {
      const tm = new TurnManager(['A', 'B', 'C']);
      expect(tm.getCurrentPlayer()).toBe('A');
      tm.removePlayer('C');
      expect(tm.getCurrentPlayer()).toBe('A');
      expect(tm.getTurnOrder()).toEqual(['A', 'B']);
    });
  });

  // ------- determineInitialOrder -------

  describe('determineInitialOrder', () => {
    test('returns all players', () => {
      const players = ['p1', 'p2', 'p3', 'p4'];
      const order = TurnManager.determineInitialOrder(players);
      expect(order).toHaveLength(4);
      expect(order.sort()).toEqual(['p1', 'p2', 'p3', 'p4']);
    });

    test('returns same set of players, possibly in different order', () => {
      const players = ['alpha', 'beta', 'gamma'];
      const order = TurnManager.determineInitialOrder(players);
      expect(order).toHaveLength(3);
      for (const p of players) {
        expect(order).toContain(p);
      }
    });

    test('single player returns that player', () => {
      const order = TurnManager.determineInitialOrder(['solo']);
      expect(order).toEqual(['solo']);
    });
  });
});
