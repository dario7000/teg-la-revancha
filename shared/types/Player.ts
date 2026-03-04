import { PlayerId, PlayerColor, ContinentId } from './GameState';
import { CountryCard } from './Cards';
import { Objective } from './Actions';

export interface Player {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  hand: CountryCard[];
  continentCards: ContinentId[];
  objective: Objective;
  tradeCount: number;
  connected: boolean;
  eliminated: boolean;
  eliminatedBy: PlayerId | null;
}
