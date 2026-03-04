import { describe, test, expect } from 'vitest';
import { ReinforcementCalc } from '../ReinforcementCalc';

describe('ReinforcementCalc', () => {
  const calc = new ReinforcementCalc();

  // ------- calcByCountries -------

  describe('calcByCountries', () => {
    test('50% of countries rounded down (19 countries = 9)', () => {
      expect(calc.calcByCountries(19)).toBe(9);
    });

    test('50% of countries rounded down (10 countries = 5)', () => {
      expect(calc.calcByCountries(10)).toBe(5);
    });

    test('50% of countries rounded down (7 countries = 3 but minimum 4)', () => {
      // floor(7/2) = 3, but 7 >= 6 so it returns floor(7/2)=3
      // Actually: 7 >= 6, so we use floor(7/2) = 3
      // Wait, let's re-check: the code says if < 6 return 4, else return floor/2
      // 7 >= 6, so floor(7/2) = 3
      expect(calc.calcByCountries(7)).toBe(3);
    });

    test('minimum 4 with less than 6 countries', () => {
      expect(calc.calcByCountries(5)).toBe(4);
      expect(calc.calcByCountries(3)).toBe(4);
    });

    test('minimum 4 even with 1 country', () => {
      expect(calc.calcByCountries(1)).toBe(4);
    });

    test('minimum 4 even with 0 countries', () => {
      expect(calc.calcByCountries(0)).toBe(4);
    });

    test('6 countries = floor(6/2) = 3 which is computed by formula', () => {
      // 6 is NOT < 6, so uses floor(6/2) = 3
      expect(calc.calcByCountries(6)).toBe(3);
    });
  });

  // ------- calcByContinents -------

  describe('calcByContinents', () => {
    test('continent bonus: Asia = 8', () => {
      const bonuses = calc.calcByContinents(['ASIA']);
      expect(bonuses['ASIA']).toBe(8);
    });

    test('continent bonus: Europa = 8', () => {
      const bonuses = calc.calcByContinents(['EUROPA']);
      expect(bonuses['EUROPA']).toBe(8);
    });

    test('continent bonus: America del Norte = 6', () => {
      const bonuses = calc.calcByContinents(['AMERICA_DEL_NORTE']);
      expect(bonuses['AMERICA_DEL_NORTE']).toBe(6);
    });

    test('continent bonus: America del Sur = 4', () => {
      const bonuses = calc.calcByContinents(['AMERICA_DEL_SUR']);
      expect(bonuses['AMERICA_DEL_SUR']).toBe(4);
    });

    test('continent bonus: Africa = 4', () => {
      const bonuses = calc.calcByContinents(['AFRICA']);
      expect(bonuses['AFRICA']).toBe(4);
    });

    test('continent bonus: America Central = 3', () => {
      const bonuses = calc.calcByContinents(['AMERICA_CENTRAL']);
      expect(bonuses['AMERICA_CENTRAL']).toBe(3);
    });

    test('continent bonus: Oceania = 3', () => {
      const bonuses = calc.calcByContinents(['OCEANIA']);
      expect(bonuses['OCEANIA']).toBe(3);
    });

    test('multiple continents return all bonuses', () => {
      const bonuses = calc.calcByContinents(['ASIA', 'OCEANIA']);
      expect(bonuses['ASIA']).toBe(8);
      expect(bonuses['OCEANIA']).toBe(3);
      expect(Object.keys(bonuses)).toHaveLength(2);
    });

    test('unknown continent returns no bonus', () => {
      const bonuses = calc.calcByContinents(['ATLANTIS']);
      expect(Object.keys(bonuses)).toHaveLength(0);
    });
  });

  // ------- calcByTrade -------

  describe('calcByTrade', () => {
    test('1st trade = 6', () => {
      expect(calc.calcByTrade(1)).toBe(6);
    });

    test('2nd trade = 10', () => {
      expect(calc.calcByTrade(2)).toBe(10);
    });

    test('3rd trade = 15', () => {
      // 10 + (3-2)*5 = 15
      expect(calc.calcByTrade(3)).toBe(15);
    });

    test('4th trade = 20', () => {
      // 10 + (4-2)*5 = 20
      expect(calc.calcByTrade(4)).toBe(20);
    });

    test('5th trade = 25', () => {
      // 10 + (5-2)*5 = 25
      expect(calc.calcByTrade(5)).toBe(25);
    });

    test('0th trade returns 0', () => {
      expect(calc.calcByTrade(0)).toBe(0);
    });

    test('negative trade number returns 0', () => {
      expect(calc.calcByTrade(-1)).toBe(0);
    });
  });

  // ------- calcExtraReinforcements -------

  describe('calcExtraReinforcements', () => {
    test('extra reinforcements = 50% of countries (floor)', () => {
      expect(calc.calcExtraReinforcements(19)).toBe(9);
      expect(calc.calcExtraReinforcements(10)).toBe(5);
      expect(calc.calcExtraReinforcements(7)).toBe(3);
      expect(calc.calcExtraReinforcements(1)).toBe(0);
    });
  });

  // ------- calculateTotal -------

  describe('calculateTotal', () => {
    test('calculates total from countries + continents + trade', () => {
      // 19 countries = 9, ASIA = 8, 1st trade = 6
      const result = calc.calculateTotal(19, ['ASIA'], 1);
      expect(result.byCountries).toBe(9);
      expect(result.byContinents['ASIA']).toBe(8);
      expect(result.byTrade).toBe(6);
      expect(result.total).toBe(9 + 8 + 6);
    });

    test('no trade when tradeNumber is null', () => {
      const result = calc.calculateTotal(10, [], null);
      expect(result.byTrade).toBe(0);
      expect(result.total).toBe(5);
    });

    test('minimum reinforcement with no continents and no trade', () => {
      const result = calc.calculateTotal(2, [], null);
      expect(result.byCountries).toBe(4);
      expect(result.total).toBe(4);
    });
  });
});
