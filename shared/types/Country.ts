import { CountryId, ContinentId } from './GameState';

export interface Country {
  id: CountryId;
  name: string;
  continent: ContinentId;
  isIsland: boolean;
  adjacentCountries: CountryId[];
}

export interface Continent {
  id: ContinentId;
  name: string;
  countries: CountryId[];
  bonus: number;
}
