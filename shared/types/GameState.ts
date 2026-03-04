export type PlayerId = string;
export type CountryId = string;
export type ContinentId = 'AMERICA_DEL_NORTE' | 'AMERICA_CENTRAL' | 'AMERICA_DEL_SUR' | 'EUROPA' | 'ASIA' | 'AFRICA' | 'OCEANIA';
export type CardId = string;
export type PlayerColor = 'WHITE' | 'BLACK' | 'RED' | 'BLUE' | 'YELLOW' | 'GREEN';

export type GamePhase = 'LOBBY' | 'SETUP_DISTRIBUTE' | 'SETUP_PLACE_8' | 'SETUP_PLACE_4' | 'PLAYING' | 'FINISHED';
export type TurnPhase = 'SITUATION_CARD' | 'REINFORCE' | 'TRADE' | 'ATTACK' | 'REGROUP' | 'DRAW_CARD' | 'DRAW_CONTINENT_CARD';

export interface TerritoryState {
  owner: PlayerId;
  armies: number;
  missiles: number;
  coOwner?: PlayerId;
  coOwnerArmies?: number;
  coOwnerMissiles?: number;
  isBlocked: boolean;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  turnPhase: TurnPhase;
  currentPlayer: PlayerId;
  turnOrder: PlayerId[];
  turnNumber: number;
  roundNumber: number;
  players: import('./Player').Player[];
  territories: Record<CountryId, TerritoryState>;
  condominiums: import('./Pacts').Condominium[];
  blockades: import('./Pacts').Blockade[];
  countryCardDeck: import('./Cards').CountryCard[];
  countryCardDiscard: import('./Cards').CountryCard[];
  situationCardDeck: import('./Cards').SituationCard[];
  situationCardDiscard: import('./Cards').SituationCard[];
  continentCards: Record<ContinentId, import('./Cards').ContinentCardState>;
  activeSituation: import('./Cards').SituationCard | null;
  pacts: import('./Pacts').Pact[];
  internationalZones: import('./Pacts').InternationalZone[];
  conqueredThisTurn: number;
  tradedThisRound: boolean;
  settings: import('../constants').GameSettings;
  communicationStyle: import('../constants').CommunicationStyle;
  log: import('../constants').LogEntry[];
}
