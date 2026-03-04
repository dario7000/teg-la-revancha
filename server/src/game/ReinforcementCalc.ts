const CONTINENT_BONUS: Record<string, number> = {
  ASIA: 8,
  EUROPA: 8,
  AMERICA_DEL_NORTE: 6,
  AMERICA_DEL_SUR: 4,
  AFRICA: 4,
  AMERICA_CENTRAL: 3,
  OCEANIA: 3,
};

const MIN_REINFORCEMENTS = 4;

export class ReinforcementCalc {
  calcByCountries(countriesOwned: number): number {
    if (countriesOwned < 6) return MIN_REINFORCEMENTS;
    return Math.floor(countriesOwned / 2);
  }

  calcByContinents(ownedContinents: string[]): Record<string, number> {
    const bonuses: Record<string, number> = {};
    for (const cont of ownedContinents) {
      if (CONTINENT_BONUS[cont]) {
        bonuses[cont] = CONTINENT_BONUS[cont];
      }
    }
    return bonuses;
  }

  calcByTrade(tradeNumber: number): number {
    if (tradeNumber <= 0) return 0;
    if (tradeNumber === 1) return 6;
    if (tradeNumber === 2) return 10;
    return 10 + (tradeNumber - 2) * 5;
  }

  calcExtraReinforcements(countriesOwned: number): number {
    return Math.floor(countriesOwned / 2);
  }

  calculateTotal(
    countriesOwned: number,
    ownedContinents: string[],
    tradeNumber: number | null,
  ): { byCountries: number; byContinents: Record<string, number>; byTrade: number; total: number } {
    const byCountries = this.calcByCountries(countriesOwned);
    const byContinents = this.calcByContinents(ownedContinents);
    const continentTotal = Object.values(byContinents).reduce((a, b) => a + b, 0);
    const byTrade = tradeNumber ? this.calcByTrade(tradeNumber) : 0;

    return {
      byCountries,
      byContinents,
      byTrade,
      total: byCountries + continentTotal + byTrade,
    };
  }
}
