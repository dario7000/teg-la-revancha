import { describe, test, expect } from 'vitest';
import { PactSystem } from '../PactSystem';
import type { PactDetails, PactType, Pact, Condominium } from '@shared/types/Pacts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function worldwideDetails(): PactDetails {
  return { type: 'WORLDWIDE' };
}

function betweenCountriesDetails(c1: string, c2: string): PactDetails {
  return { type: 'BETWEEN_COUNTRIES', countries: [c1, c2] };
}

function withinContinentDetails(continent: string): PactDetails {
  return { type: 'WITHIN_CONTINENT', continent } as PactDetails;
}

function betweenContinentBordersDetails(c1: string, c2: string): PactDetails {
  return { type: 'BETWEEN_CONTINENT_BORDERS', continents: [c1, c2] } as PactDetails;
}

function internationalZoneDetails(country: string): PactDetails {
  return { type: 'INTERNATIONAL_ZONE', country };
}

function aggressionPactDetails(target: string, duringTurnOf: string): PactDetails {
  return { type: 'AGGRESSION_PACT', target, duringTurnOf };
}

function proposePactHelper(
  ps: PactSystem,
  from: string,
  to: string,
  type: PactType,
  details?: PactDetails,
): string {
  return ps.proposePact(from, to, type, details);
}

function proposeAndAccept(
  ps: PactSystem,
  from: string,
  to: string,
  type: PactType,
  details?: PactDetails,
): string {
  const id = ps.proposePact(from, to, type, details);
  ps.acceptPact(id, to);
  return id;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PactSystem', () => {
  // ------- proposePact -------

  describe('proposePact', () => {
    test('creates a pending (inactive) pact and returns its id', () => {
      const ps = new PactSystem();
      const pactId = ps.proposePact('p1', 'p2', 'WORLDWIDE');
      expect(pactId).toBeDefined();
      expect(typeof pactId).toBe('string');

      const pacts = ps.getPactsBetween('p1', 'p2');
      expect(pacts).toHaveLength(1);
      expect(pacts[0].active).toBe(false);
      expect(pacts[0].type).toBe('WORLDWIDE');
    });

    test('throws when proposing a pact with yourself', () => {
      const ps = new PactSystem();
      expect(() => ps.proposePact('p1', 'p1', 'WORLDWIDE')).toThrow('yourself');
    });

    test('generates unique pact IDs', () => {
      const ps = new PactSystem();
      const id1 = ps.proposePact('p1', 'p2', 'WORLDWIDE');
      const id2 = ps.proposePact('p1', 'p3', 'WORLDWIDE');
      expect(id1).not.toBe(id2);
    });

    test('stores pact details correctly', () => {
      const ps = new PactSystem();
      const details = betweenCountriesDetails('ARGENTINA', 'BRASIL');
      const pactId = ps.proposePact('p1', 'p2', 'BETWEEN_COUNTRIES', details);
      const pacts = ps.getPactsBetween('p1', 'p2');
      expect(pacts[0].details).toEqual(details);
    });

    test('throws for BETWEEN_COUNTRIES without details', () => {
      const ps = new PactSystem();
      expect(() => ps.proposePact('p1', 'p2', 'BETWEEN_COUNTRIES')).toThrow('requires details');
    });
  });

  // ------- acceptPact -------

  describe('acceptPact', () => {
    test('activates the pact when accepted by the recipient', () => {
      const ps = new PactSystem();
      const pactId = ps.proposePact('p1', 'p2', 'WORLDWIDE');
      const result = ps.acceptPact(pactId, 'p2');
      expect(result).toBe(true);

      const pacts = ps.getPactsBetween('p1', 'p2');
      expect(pacts[0].active).toBe(true);
    });

    test('fails when accepted by the proposer (wrong player)', () => {
      const ps = new PactSystem();
      const pactId = ps.proposePact('p1', 'p2', 'WORLDWIDE');
      const result = ps.acceptPact(pactId, 'p1');
      expect(result).toBe(false);
    });

    test('fails for an already active pact', () => {
      const ps = new PactSystem();
      const pactId = proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');
      const result = ps.acceptPact(pactId, 'p2');
      expect(result).toBe(false);
    });

    test('fails for non-existent pact', () => {
      const ps = new PactSystem();
      expect(ps.acceptPact('nonexistent', 'p1')).toBe(false);
    });
  });

  // ------- rejectPact -------

  describe('rejectPact', () => {
    test('removes the pending pact', () => {
      const ps = new PactSystem();
      const pactId = ps.proposePact('p1', 'p2', 'WORLDWIDE');
      const result = ps.rejectPact(pactId, 'p2');
      expect(result).toBe(true);
      expect(ps.getPactsBetween('p1', 'p2')).toHaveLength(0);
    });

    test('proposer can also cancel a pending pact', () => {
      const ps = new PactSystem();
      const pactId = ps.proposePact('p1', 'p2', 'WORLDWIDE');
      const result = ps.rejectPact(pactId, 'p1');
      expect(result).toBe(true);
      expect(ps.getPactsBetween('p1', 'p2')).toHaveLength(0);
    });

    test('cannot reject an active pact', () => {
      const ps = new PactSystem();
      const pactId = proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');
      const result = ps.rejectPact(pactId, 'p2');
      expect(result).toBe(false);
    });

    test('third party cannot reject', () => {
      const ps = new PactSystem();
      const pactId = ps.proposePact('p1', 'p2', 'WORLDWIDE');
      const result = ps.rejectPact(pactId, 'p3');
      expect(result).toBe(false);
    });
  });

  // ------- canAttack -------

  describe('canAttack', () => {
    test('WORLDWIDE pact prevents all attacks between the two players', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');
      const result = ps.canAttack('p1', 'p2');
      expect(result.allowed).toBe(false);
      expect(result.wouldBreakPact).toBeDefined();
    });

    test('BETWEEN_COUNTRIES pact blocks attacks between the specific countries', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'BETWEEN_COUNTRIES', betweenCountriesDetails('ARGENTINA', 'BRASIL'));
      const result = ps.canAttack('p1', 'p2', 'ARGENTINA', 'BRASIL');
      expect(result.allowed).toBe(false);
    });

    test('BETWEEN_COUNTRIES pact does not block attacks on other countries', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'BETWEEN_COUNTRIES', betweenCountriesDetails('ARGENTINA', 'BRASIL'));
      const result = ps.canAttack('p1', 'p2', 'CHILE', 'COLOMBIA');
      expect(result.allowed).toBe(true);
    });

    test('WITHIN_CONTINENT pact blocks attacks within that continent', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'WITHIN_CONTINENT', withinContinentDetails('EUROPA'));
      const countryToContinent: Record<string, string> = {
        FRANCIA: 'EUROPA',
        ALEMANIA: 'EUROPA',
        BRASIL: 'AMERICA_DEL_SUR',
      };
      const result = ps.canAttack('p1', 'p2', 'FRANCIA', 'ALEMANIA', countryToContinent);
      expect(result.allowed).toBe(false);

      // Cross-continent attack is still allowed
      const result2 = ps.canAttack('p1', 'p2', 'FRANCIA', 'BRASIL', countryToContinent);
      expect(result2.allowed).toBe(true);
    });

    test('BETWEEN_CONTINENT_BORDERS pact blocks cross-border attacks', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'BETWEEN_CONTINENT_BORDERS', betweenContinentBordersDetails('EUROPA', 'ASIA'));
      const countryToContinent: Record<string, string> = {
        TURQUIA: 'ASIA',
        SERBIA: 'EUROPA',
      };
      const result = ps.canAttack('p1', 'p2', 'SERBIA', 'TURQUIA', countryToContinent);
      expect(result.allowed).toBe(false);
    });

    test('allows attack when no relevant pact exists', () => {
      const ps = new PactSystem();
      const result = ps.canAttack('p1', 'p2');
      expect(result.allowed).toBe(true);
    });

    test('inactive pact does not block attacks', () => {
      const ps = new PactSystem();
      ps.proposePact('p1', 'p2', 'WORLDWIDE'); // not accepted
      const result = ps.canAttack('p1', 'p2');
      expect(result.allowed).toBe(true);
    });

    test('international zone blocks attacks regardless of pacts', () => {
      const ps = new PactSystem();
      ps.createInternationalZone('ARGENTINA');
      const result = ps.canAttack('p1', 'p2', undefined, 'ARGENTINA');
      expect(result.allowed).toBe(false);
    });
  });

  // ------- handleAttackViolation -------

  describe('handleAttackViolation', () => {
    test('breaks all non-aggression pacts between the two players', () => {
      const ps = new PactSystem();
      const pactId = proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');
      ps.handleAttackViolation('p1', 'p2', 5);

      const pacts = ps.getPactsBetween('p1', 'p2');
      expect(pacts[0].active).toBe(false);
      expect(pacts[0].breakAnnounced).toBeDefined();
      expect(pacts[0].breakAnnounced!.by).toBe('p1');
      expect(pacts[0].breakAnnounced!.onTurn).toBe(5);
    });

    test('breaks BETWEEN_COUNTRIES pacts on violation', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'BETWEEN_COUNTRIES', betweenCountriesDetails('A', 'B'));
      ps.handleAttackViolation('p1', 'p2');

      const pacts = ps.getPactsBetween('p1', 'p2');
      expect(pacts.every((p) => !p.active)).toBe(true);
    });

    test('does not affect pacts with third parties', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');
      proposeAndAccept(ps, 'p1', 'p3', 'WORLDWIDE');

      ps.handleAttackViolation('p1', 'p2');

      const p1p2 = ps.getPactsBetween('p1', 'p2');
      const p1p3 = ps.getPactsBetween('p1', 'p3');
      expect(p1p2[0].active).toBe(false);
      expect(p1p3[0].active).toBe(true);
    });
  });

  // ------- canPassThrough -------

  describe('canPassThrough', () => {
    test('WORLDWIDE pact grants passage', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');
      expect(ps.canPassThrough('p1', 'p2')).toBe(true);
    });

    test('WITHIN_CONTINENT pact grants passage within that continent', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'WITHIN_CONTINENT', withinContinentDetails('EUROPA'));
      const countryToContinent: Record<string, string> = {
        FRANCIA: 'EUROPA',
        BRASIL: 'AMERICA_DEL_SUR',
      };
      expect(ps.canPassThrough('p1', 'p2', 'FRANCIA', countryToContinent)).toBe(true);
      expect(ps.canPassThrough('p1', 'p2', 'BRASIL', countryToContinent)).toBe(false);
    });

    test('no pact means no passage', () => {
      const ps = new PactSystem();
      expect(ps.canPassThrough('p1', 'p2')).toBe(false);
    });

    test('inactive pact does not grant passage', () => {
      const ps = new PactSystem();
      ps.proposePact('p1', 'p2', 'WORLDWIDE'); // not accepted
      expect(ps.canPassThrough('p1', 'p2')).toBe(false);
    });
  });

  // ------- canTradeWith -------

  describe('canTradeWith', () => {
    test('any active pact enables card trading', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');
      expect(ps.canTradeWith('p1', 'p2')).toBe(true);
    });

    test('no pact means no trading', () => {
      const ps = new PactSystem();
      expect(ps.canTradeWith('p1', 'p2')).toBe(false);
    });

    test('pending (inactive) pact does not enable trading', () => {
      const ps = new PactSystem();
      ps.proposePact('p1', 'p2', 'WORLDWIDE');
      expect(ps.canTradeWith('p1', 'p2')).toBe(false);
    });

    test('a scoped pact still enables trading', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'BETWEEN_COUNTRIES', betweenCountriesDetails('A', 'B'));
      expect(ps.canTradeWith('p1', 'p2')).toBe(true);
    });
  });

  // ------- Condominium -------

  describe('condominium', () => {
    test('createCondominium marks a country as condominium', () => {
      const ps = new PactSystem();
      ps.createCondominium('ARGENTINA', 'p1', 'p2', 10);
      expect(ps.isCondominium('ARGENTINA')).toBe(true);
    });

    test('getCondominiumOwners returns both owners', () => {
      const ps = new PactSystem();
      ps.createCondominium('ARGENTINA', 'p1', 'p2', 10);
      const owners = ps.getCondominiumOwners('ARGENTINA');
      expect(owners).toBeDefined();
      expect(owners!.sort()).toEqual(['p1', 'p2']);
    });

    test('armies are split evenly (remainder to first player)', () => {
      const ps = new PactSystem();
      ps.createCondominium('ARGENTINA', 'p1', 'p2', 11);
      const condo = ps.getCondominium('ARGENTINA');
      expect(condo).toBeDefined();
      expect(condo!.armies['p1']).toBe(6); // 11/2 = 5.5 -> 5 + remainder 1
      expect(condo!.armies['p2']).toBe(5);
    });

    test('armies are split evenly when count is even', () => {
      const ps = new PactSystem();
      ps.createCondominium('ARGENTINA', 'p1', 'p2', 10);
      const condo = ps.getCondominium('ARGENTINA');
      expect(condo!.armies['p1']).toBe(5);
      expect(condo!.armies['p2']).toBe(5);
    });

    test('cannot create condominium with self', () => {
      const ps = new PactSystem();
      expect(() => ps.createCondominium('ARGENTINA', 'p1', 'p1', 10)).toThrow('different players');
    });

    test('cannot create condominium on an international zone', () => {
      const ps = new PactSystem();
      ps.createInternationalZone('ARGENTINA');
      expect(() => ps.createCondominium('ARGENTINA', 'p1', 'p2', 10)).toThrow('international zone');
    });

    test('cannot create duplicate condominium', () => {
      const ps = new PactSystem();
      ps.createCondominium('ARGENTINA', 'p1', 'p2', 10);
      expect(() => ps.createCondominium('ARGENTINA', 'p3', 'p4', 10)).toThrow('already a condominium');
    });

    test('removeCondominium clears the condominium', () => {
      const ps = new PactSystem();
      ps.createCondominium('ARGENTINA', 'p1', 'p2', 10);
      ps.removeCondominium('ARGENTINA');
      expect(ps.isCondominium('ARGENTINA')).toBe(false);
    });

    test('isCondominium returns false for non-condominium', () => {
      const ps = new PactSystem();
      expect(ps.isCondominium('NOWHERE')).toBe(false);
    });
  });

  // ------- International Zone -------

  describe('internationalZone', () => {
    test('createInternationalZone marks a country as international zone', () => {
      const ps = new PactSystem();
      ps.createInternationalZone('ARGENTINA');
      expect(ps.isInternationalZone('ARGENTINA')).toBe(true);
    });

    test('isInternationalZone returns false for regular countries', () => {
      const ps = new PactSystem();
      expect(ps.isInternationalZone('ARGENTINA')).toBe(false);
    });

    test('cannot create international zone on condominium', () => {
      const ps = new PactSystem();
      ps.createCondominium('ARGENTINA', 'p1', 'p2', 10);
      expect(() => ps.createInternationalZone('ARGENTINA')).toThrow('condominium');
    });

    test('cannot create duplicate international zone', () => {
      const ps = new PactSystem();
      ps.createInternationalZone('ARGENTINA');
      expect(() => ps.createInternationalZone('ARGENTINA')).toThrow('already an international zone');
    });

    test('removeInternationalZone clears the zone', () => {
      const ps = new PactSystem();
      ps.createInternationalZone('ARGENTINA');
      ps.removeInternationalZone('ARGENTINA');
      expect(ps.isInternationalZone('ARGENTINA')).toBe(false);
    });
  });

  // ------- removePlayerPacts -------

  describe('removePlayerPacts', () => {
    test('removes all pacts involving the eliminated player', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');
      proposeAndAccept(ps, 'p2', 'p3', 'WORLDWIDE');
      proposeAndAccept(ps, 'p1', 'p3', 'WORLDWIDE');

      ps.removePlayerPacts('p2');

      expect(ps.getPactsBetween('p1', 'p2')).toHaveLength(0);
      expect(ps.getPactsBetween('p2', 'p3')).toHaveLength(0);
      // p1-p3 pact should remain
      expect(ps.getPactsBetween('p1', 'p3')).toHaveLength(1);
    });

    test('removes condominiums involving the eliminated player', () => {
      const ps = new PactSystem();
      ps.createCondominium('ARGENTINA', 'p1', 'p2', 10);
      ps.createCondominium('BRASIL', 'p2', 'p3', 8);
      ps.createCondominium('CHILE', 'p1', 'p3', 6);

      ps.removePlayerPacts('p2');

      expect(ps.isCondominium('ARGENTINA')).toBe(false);
      expect(ps.isCondominium('BRASIL')).toBe(false);
      expect(ps.isCondominium('CHILE')).toBe(true); // p1-p3, unaffected
    });

    test('removes international zones from pacts with INTERNATIONAL_ZONE details', () => {
      const ps = new PactSystem();
      const details = internationalZoneDetails('ARGENTINA');
      const pactId = proposeAndAccept(ps, 'p1', 'p2', 'INTERNATIONAL_ZONE', details);
      ps.createInternationalZone('ARGENTINA');

      ps.removePlayerPacts('p2');

      // The international zone from the pact should also be cleaned up
      // (the pact had details.type === 'INTERNATIONAL_ZONE' and was active)
      expect(ps.isInternationalZone('ARGENTINA')).toBe(false);
    });
  });

  // ------- Cannot duplicate active pacts -------

  describe('duplicate pact prevention', () => {
    test('cannot propose duplicate active WORLDWIDE pact between same players', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');
      expect(() => ps.proposePact('p1', 'p2', 'WORLDWIDE')).toThrow('already exists');
    });

    test('can propose same type pact with different scope', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'BETWEEN_COUNTRIES', betweenCountriesDetails('A', 'B'));
      // Different countries, so not a duplicate
      expect(() =>
        ps.proposePact('p1', 'p2', 'BETWEEN_COUNTRIES', betweenCountriesDetails('C', 'D')),
      ).not.toThrow();
    });

    test('cannot duplicate BETWEEN_COUNTRIES with same country pair', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'BETWEEN_COUNTRIES', betweenCountriesDetails('A', 'B'));
      expect(() =>
        ps.proposePact('p1', 'p2', 'BETWEEN_COUNTRIES', betweenCountriesDetails('A', 'B')),
      ).toThrow('already exists');
    });
  });

  // ------- breakPact -------

  describe('breakPact', () => {
    test('deactivates the pact and records who broke it', () => {
      const ps = new PactSystem();
      const pactId = proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');
      ps.breakPact(pactId, 'p1', 10);

      const pacts = ps.getPactsBetween('p1', 'p2');
      expect(pacts[0].active).toBe(false);
      expect(pacts[0].breakAnnounced!.by).toBe('p1');
      expect(pacts[0].breakAnnounced!.onTurn).toBe(10);
    });

    test('throws for non-existent pact', () => {
      const ps = new PactSystem();
      expect(() => ps.breakPact('nope', 'p1')).toThrow('not found');
    });

    test('throws for inactive pact', () => {
      const ps = new PactSystem();
      const pactId = ps.proposePact('p1', 'p2', 'WORLDWIDE');
      expect(() => ps.breakPact(pactId, 'p1')).toThrow('not active');
    });

    test('throws when breaker is not part of the pact', () => {
      const ps = new PactSystem();
      const pactId = proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');
      expect(() => ps.breakPact(pactId, 'p3')).toThrow('not part of pact');
    });

    test('breaking INTERNATIONAL_ZONE pact removes the zone', () => {
      const ps = new PactSystem();
      const details = internationalZoneDetails('ARGENTINA');
      const pactId = proposeAndAccept(ps, 'p1', 'p2', 'INTERNATIONAL_ZONE', details);
      ps.createInternationalZone('ARGENTINA');
      expect(ps.isInternationalZone('ARGENTINA')).toBe(true);

      ps.breakPact(pactId, 'p1');
      expect(ps.isInternationalZone('ARGENTINA')).toBe(false);
    });
  });

  // ------- Serialization roundtrip -------

  describe('getState / loadState', () => {
    test('roundtrip preserves pacts', () => {
      const ps1 = new PactSystem();
      proposeAndAccept(ps1, 'p1', 'p2', 'WORLDWIDE');
      ps1.proposePact('p1', 'p3', 'WORLDWIDE');

      const state = ps1.getState();

      const ps2 = new PactSystem();
      ps2.loadState(state);

      expect(ps2.getPactsBetween('p1', 'p2')).toHaveLength(1);
      expect(ps2.getPactsBetween('p1', 'p2')[0].active).toBe(true);
      expect(ps2.getPactsBetween('p1', 'p3')).toHaveLength(1);
      expect(ps2.getPactsBetween('p1', 'p3')[0].active).toBe(false);
    });

    test('roundtrip preserves condominiums', () => {
      const ps1 = new PactSystem();
      ps1.createCondominium('ARGENTINA', 'p1', 'p2', 10);

      const state = ps1.getState();

      const ps2 = new PactSystem();
      ps2.loadState(state);

      expect(ps2.isCondominium('ARGENTINA')).toBe(true);
      const condo = ps2.getCondominium('ARGENTINA');
      expect(condo!.armies['p1']).toBe(5);
      expect(condo!.armies['p2']).toBe(5);
    });

    test('roundtrip preserves international zones', () => {
      const ps1 = new PactSystem();
      ps1.createInternationalZone('ARGENTINA');
      ps1.createInternationalZone('BRASIL');

      const state = ps1.getState();

      const ps2 = new PactSystem();
      ps2.loadState(state);

      expect(ps2.isInternationalZone('ARGENTINA')).toBe(true);
      expect(ps2.isInternationalZone('BRASIL')).toBe(true);
      expect(ps2.isInternationalZone('CHILE')).toBe(false);
    });

    test('loadState clears previous state', () => {
      const ps = new PactSystem();
      ps.createInternationalZone('ARGENTINA');
      proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');

      // Load empty state
      ps.loadState({ pacts: [], condominiums: [], internationalZones: [] });

      expect(ps.isInternationalZone('ARGENTINA')).toBe(false);
      expect(ps.getPactsBetween('p1', 'p2')).toHaveLength(0);
    });

    test('new pact IDs do not collide after loadState', () => {
      const ps1 = new PactSystem();
      proposeAndAccept(ps1, 'p1', 'p2', 'WORLDWIDE');
      const state = ps1.getState();
      const existingId = state.pacts[0].id;

      const ps2 = new PactSystem();
      ps2.loadState(state);
      // Propose a new pact; its ID should be different from the loaded one
      const newId = ps2.proposePact('p3', 'p4', 'WORLDWIDE');
      expect(newId).not.toBe(existingId);
    });
  });

  // ------- getSharedAttackPartner -------

  describe('getSharedAttackPartner', () => {
    test('returns partner when AGGRESSION_PACT targets the same country', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'AGGRESSION_PACT', aggressionPactDetails('ARGENTINA', 'p1'));
      const partner = ps.getSharedAttackPartner('p1', 'ARGENTINA');
      expect(partner).toBe('p2');
    });

    test('returns null when no matching AGGRESSION_PACT', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'WORLDWIDE');
      const partner = ps.getSharedAttackPartner('p1', 'ARGENTINA');
      expect(partner).toBeNull();
    });

    test('returns null when AGGRESSION_PACT targets different country', () => {
      const ps = new PactSystem();
      proposeAndAccept(ps, 'p1', 'p2', 'AGGRESSION_PACT', aggressionPactDetails('BRASIL', 'p1'));
      const partner = ps.getSharedAttackPartner('p1', 'ARGENTINA');
      expect(partner).toBeNull();
    });
  });
});
