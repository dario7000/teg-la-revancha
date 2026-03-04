import { PlayerColor, ContinentId } from './types/GameState';

export interface GameSettings {
  maxPlayers: number;
  turnTimeLimit: number;
  communicationStyle: CommunicationStyle;
  enableSituationCards: boolean;
  enableMissiles: boolean;
  enablePacts: boolean;
  enableCondominiums: boolean;
  enableInternationalZones: boolean;
}

export type CommunicationStyle = 'VALE_TODO' | 'FAIR_PLAY';

export interface LogEntry {
  timestamp: number;
  type: string;
  message: string;
  data?: any;
}

export const PLAYER_COLORS: { id: PlayerColor; hex: string; name: string; border?: string }[] = [
  { id: 'WHITE', hex: '#F7FAFC', name: 'Blanco', border: '#CBD5E0' },
  { id: 'BLACK', hex: '#2D3748', name: 'Negro' },
  { id: 'RED', hex: '#E53E3E', name: 'Rojo' },
  { id: 'BLUE', hex: '#3182CE', name: 'Azul' },
  { id: 'YELLOW', hex: '#ECC94B', name: 'Amarillo' },
  { id: 'GREEN', hex: '#38A169', name: 'Verde' },
];

export const CONTINENT_BONUS: Record<ContinentId, number> = {
  ASIA: 8,
  EUROPA: 8,
  AMERICA_DEL_NORTE: 6,
  AMERICA_DEL_SUR: 4,
  AFRICA: 4,
  AMERICA_CENTRAL: 3,
  OCEANIA: 3,
};

export function getTradeValue(tradeNumber: number): number {
  if (tradeNumber === 1) return 6;
  if (tradeNumber === 2) return 10;
  return 10 + (tradeNumber - 2) * 5;
}

export const MIN_REINFORCEMENTS = 4;
export const MAX_CONQUEST_MOVE = 3;
export const MISSILE_COST = 6;
export const MISSILE_DAMAGE: Record<number, number> = { 1: 3, 2: 2, 3: 1 };
export const MAX_DICE = 4;
export const COMMON_VICTORY_COUNTRIES = 45;
