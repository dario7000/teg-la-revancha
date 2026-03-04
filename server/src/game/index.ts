// ---------------------------------------------------------------------------
// Game module barrel exports
// ---------------------------------------------------------------------------

// CombatSystem
export { CombatSystem } from './CombatSystem';
export type { CombatConfig, CombatResult, DiceComparison } from './CombatSystem';

// ReinforcementCalc
export { ReinforcementCalc } from './ReinforcementCalc';

// BlockadeSystem
export { BlockadeSystem } from './BlockadeSystem';
export type { BlockadeInfo } from './BlockadeSystem';

// TurnManager
export { TurnManager } from './TurnManager';
export type { TurnPhase } from './TurnManager';

// TerritoryManager
export { TerritoryManager } from './TerritoryManager';
export type { TerritoryState } from './TerritoryManager';

// GameEngine
export { GameEngine } from './GameEngine';

// CardManager
export { CardManager } from './CardManager';

// ContinentCardManager
export { ContinentCardManager } from './ContinentCardManager';
export type { ContinentCardState } from './ContinentCardManager';

// TradeCalculator
export { TradeCalculator } from './TradeCalculator';
export type { ContinentEquivalence, TradeCountryCard, TradeContinentCard, TradeInput } from './TradeCalculator';

// ObjectiveChecker
export { ObjectiveChecker } from './ObjectiveChecker';

// MissileSystem
export { MissileSystem } from './MissileSystem';
export type { MissileAttackResult } from './MissileSystem';

// SituationManager
export { SituationManager } from './SituationManager';

// PactSystem
export { PactSystem } from './PactSystem';
