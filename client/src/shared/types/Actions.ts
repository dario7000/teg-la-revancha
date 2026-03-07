import { PlayerId, CountryId, ContinentId } from './GameState';

export interface Objective {
  id: string;
  type: 'OCCUPATION' | 'DESTRUCTION' | 'DESTROY_LEFT' | 'COMMON_45';
  description: string;
  targetColor?: string;
  requirements?: OccupationRequirement[];
}

export interface OccupationRequirement {
  continent?: ContinentId;
  count: number;
  fullContinent?: boolean;
  isIsland?: boolean;
  minContinents?: number;
}

export interface RegroupAction {
  from: CountryId;
  to: CountryId;
  armies: number;
  missiles?: number;
}

export interface CombatResult {
  attackerLosses: number;
  defenderLosses: number;
  conquered: boolean;
  diceResults: {
    attacker: number[];
    defender: number[];
  };
  comparisons: DiceComparison[];
}

export interface DiceComparison {
  attackerDie: number;
  defenderDie: number;
  winner: 'attacker' | 'defender';
}

export interface ReinforcementBreakdown {
  byCountries: number;
  byContinents: Record<ContinentId, number>;
  byTrade: number;
  total: number;
}
