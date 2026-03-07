import { PlayerId, CountryId, ContinentId, PlayerColor, CardId } from './GameState';
import { CountryCard, SituationCard } from './Cards';
import { Condominium, Blockade } from './Pacts';
import { CombatResult, RegroupAction } from './Actions';
import { GameSettings, CommunicationStyle } from '../constants';

export interface ClientEvents {
  'lobby:create': (settings: { roomName?: string; maxPlayers?: number; playerName?: string }) => void;
  'lobby:join': (roomId: string, playerName: string) => void;
  'lobby:ready': () => void;
  'lobby:start': () => void;
  'lobby:selectColor': (color: PlayerColor) => void;
  'room:list': (callback?: (rooms: any[]) => void) => void;
  'room:leave': () => void;
  'room:settings': (settings: Partial<GameSettings>) => void;
  'room:reconnect': (playerId: string) => void;
  'setup:placeArmies': (placements: Record<CountryId, number>) => void;
  'turn:reinforce': (placements: Record<CountryId, number>) => void;
  'turn:trade': (cards: CardId[], continentCards?: ContinentId[]) => void;
  'turn:attack': (from: CountryId, to: CountryId, dice: number) => void;
  'turn:conquestMove': (armies: number) => void;
  'turn:fireMissile': (from: CountryId, target: CountryId) => void;
  'turn:incorporateMissile': (countryId: CountryId) => void;
  'turn:regroup': (moves: RegroupAction[]) => void;
  'turn:drawCard': () => void;
  'turn:drawContinentCard': (continent: ContinentId) => void;
  'turn:endTurn': () => void;
  'turn:skipToRegroup': () => void;
  'pact:propose': (pact: { type: string; targetPlayer: PlayerId; details: any }) => void;
  'pact:respond': (pactId: string, accept: boolean) => void;
  'pact:break': (pactId: string) => void;
  'pact:proposeAggression': (ally: PlayerId, target: CountryId) => void;
  'pact:proposeInternationalZone': (target: PlayerId, country: CountryId) => void;
  'situation:rollCrisis': () => void;
  'chat:message': (text: string, isDiplomacy: boolean) => void;
}

export interface ServerEvents {
  'game:fullState': (state: any) => void;
  'game:update': (patch: any) => void;
  'combat:result': (result: CombatResult) => void;
  'combat:conquered': (country: CountryId, by: PlayerId, moveRange: [number, number]) => void;
  'missile:impact': (from: CountryId, target: CountryId, damage: number) => void;
  'missile:blocked': (reason: string) => void;
  'card:drawn': (card: CountryCard) => void;
  'card:bonusAvailable': (country: CountryId) => void;
  'continentCard:acquired': (continent: ContinentId) => void;
  'situation:revealed': (card: SituationCard) => void;
  'situation:crisisResult': (loser: PlayerId) => void;
  'situation:extraReinforcements': (amounts: Record<PlayerId, number>) => void;
  'pact:proposed': (pact: any) => void;
  'pact:resolved': (pactId: string, accepted: boolean) => void;
  'pact:broken': (pactId: string, by: PlayerId) => void;
  'condominium:created': (condominium: Condominium) => void;
  'blockade:created': (blockade: Blockade) => void;
  'blockade:broken': (country: CountryId) => void;
  'player:eliminated': (playerId: PlayerId, by: PlayerId) => void;
  'player:inheritedCards': (count: number) => void;
  'game:victory': (winnerId: PlayerId, method: 'OBJECTIVE' | 'COMMON_45', winnerName: string) => void;
  'turn:orderChanged': (newOrder: PlayerId[]) => void;
  'lobby:updated': (lobby: any) => void;
  'room:joined': (room: any) => void;
  'room:list': (rooms: any[]) => void;
  'chat:message': (from: PlayerId, text: string, isDiplomacy: boolean) => void;
  'game:notification': (message: string) => void;
  'error': (message: string) => void;
}
