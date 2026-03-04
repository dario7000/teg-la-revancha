import { CountryId, ContinentId, PlayerId, PlayerColor, CardId } from './GameState';

export type CardSymbol = 'SOLDADOS' | 'AVION' | 'TANQUE' | 'GRANADA' | 'BARCO';

export interface CountryCard {
  id: CardId;
  country: CountryId;
  symbols: CardSymbol[];
}

export type SituationType =
  | 'COMBATE_CLASICO'
  | 'NIEVE'
  | 'VIENTO_A_FAVOR'
  | 'CRISIS'
  | 'REFUERZOS_EXTRAS'
  | 'FRONTERAS_ABIERTAS'
  | 'FRONTERAS_CERRADAS'
  | 'DESCANSO';

export interface SituationCard {
  id: string;
  type: SituationType;
  description: string;
  color?: PlayerColor;
}

export type ContinentTradeValue = 'FULL_TRADE' | 'TWO_SYMBOLS' | 'ONE_SYMBOL';

export interface ContinentCardState {
  continent: ContinentId;
  heldBy: PlayerId | null;
  usedBy: PlayerId[];
  tradeEquivalence: ContinentTradeValue;
  symbolEquivalence?: CardSymbol[];
}
