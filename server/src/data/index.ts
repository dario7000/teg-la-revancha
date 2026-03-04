// Barrel export for all game data

export { COUNTRIES, COUNTRIES_MAP } from './countries';
export type { Country, CountryId, ContinentId } from './countries';

export { CONTINENTS, CONTINENTS_MAP } from './continents';
export type { Continent } from './continents';

export { ADJACENCY, areAdjacent } from './adjacency';

export { OBJECTIVES } from './objectives';
export type {
  Objective,
  OccupationObjective,
  DestructionObjective,
  DestroyLeftObjective,
  OccupationRequirement,
  ObjectiveType,
  PlayerColor,
} from './objectives';

export { SITUATION_CARDS } from './situationCards';
export type { SituationCard, SituationCardType } from './situationCards';

export { COUNTRY_CARDS, COUNTRY_CARDS_MAP } from './countryCards';
export type { CountryCard, CardSymbol } from './countryCards';
