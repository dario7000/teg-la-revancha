import { PlayerId, CountryId, ContinentId } from './GameState';

export type PactType =
  | 'BETWEEN_COUNTRIES'
  | 'WITHIN_CONTINENT'
  | 'BETWEEN_CONTINENT_BORDERS'
  | 'WORLDWIDE'
  | 'INTERNATIONAL_ZONE'
  | 'AGGRESSION_PACT';

export interface Pact {
  id: string;
  type: PactType;
  players: [PlayerId, PlayerId];
  details: PactDetails;
  active: boolean;
  createdOnTurn: number;
  breakAnnounced?: { by: PlayerId; onTurn: number };
}

export type PactDetails =
  | { type: 'BETWEEN_COUNTRIES'; countries: [CountryId, CountryId] }
  | { type: 'WITHIN_CONTINENT'; continent: ContinentId }
  | { type: 'BETWEEN_CONTINENT_BORDERS'; continents: [ContinentId, ContinentId] }
  | { type: 'WORLDWIDE' }
  | { type: 'INTERNATIONAL_ZONE'; country: CountryId }
  | { type: 'AGGRESSION_PACT'; target: CountryId; duringTurnOf: PlayerId };

export interface Condominium {
  country: CountryId;
  owners: [PlayerId, PlayerId];
  armies: Record<PlayerId, number>;
  missiles: Record<PlayerId, number>;
}

export interface InternationalZone {
  country: CountryId;
  players: [PlayerId, PlayerId];
  active: boolean;
}

export interface Blockade {
  blockedCountry: CountryId;
  blockerPlayer: PlayerId;
  blockerCountries: CountryId[];
}
