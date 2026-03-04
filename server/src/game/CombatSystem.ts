export interface CombatConfig {
  attackerArmies: number;
  defenderArmies: number;
  attackerMissiles: number;
  defenderMissiles: number;
  situationEffect: 'NONE' | 'NIEVE' | 'VIENTO_A_FAVOR';
}

export interface CombatResult {
  attackerLosses: number;
  defenderLosses: number;
  conquered: boolean;
  diceResults: { attacker: number[]; defender: number[] };
  comparisons: DiceComparison[];
}

export interface DiceComparison {
  attackerDie: number;
  defenderDie: number;
  winner: 'attacker' | 'defender';
}

export class CombatSystem {
  getAttackerDice(config: CombatConfig): number {
    const attackArmies = config.attackerArmies - 1;
    if (attackArmies < 1) return 0;

    let maxDice = Math.min(3, attackArmies);

    // 4 DICE RULE: defender has 3+ AND attacker has double (not counting missiles)
    if (config.defenderArmies >= 3 && config.attackerArmies >= config.defenderArmies * 2) {
      maxDice = Math.min(4, attackArmies);
    }

    // Viento a Favor: +1 die, NEVER more than 4
    if (config.situationEffect === 'VIENTO_A_FAVOR') {
      maxDice = Math.min(maxDice + 1, 4);
    }

    return maxDice;
  }

  getDefenderDice(config: CombatConfig): number {
    let maxDice = Math.min(3, config.defenderArmies);

    // Nieve: +1 die, NEVER more than 4
    if (config.situationEffect === 'NIEVE') {
      maxDice = Math.min(maxDice + 1, 4);
    }

    return maxDice;
  }

  rollDice(count: number): number[] {
    const dice: number[] = [];
    for (let i = 0; i < count; i++) {
      dice.push(Math.floor(Math.random() * 6) + 1);
    }
    return dice.sort((a, b) => b - a);
  }

  resolveCombat(attackDice: number[], defendDice: number[]): CombatResult {
    const sortedAttack = [...attackDice].sort((a, b) => b - a);
    const sortedDefend = [...defendDice].sort((a, b) => b - a);

    const comparisons: DiceComparison[] = [];
    let attackerLosses = 0;
    let defenderLosses = 0;

    const pairs = Math.min(sortedAttack.length, sortedDefend.length);
    for (let i = 0; i < pairs; i++) {
      const aD = sortedAttack[i];
      const dD = sortedDefend[i];
      // TIE goes to DEFENDER
      const winner: 'attacker' | 'defender' = aD > dD ? 'attacker' : 'defender';
      comparisons.push({ attackerDie: aD, defenderDie: dD, winner });
      if (winner === 'attacker') defenderLosses++;
      else attackerLosses++;
    }

    return {
      attackerLosses,
      defenderLosses,
      conquered: false,
      diceResults: { attacker: sortedAttack, defender: sortedDefend },
      comparisons,
    };
  }

  executeCombat(config: CombatConfig, attackerDiceCount?: number): CombatResult {
    const maxAttDice = this.getAttackerDice(config);
    const maxDefDice = this.getDefenderDice(config);
    const attDice = attackerDiceCount ? Math.min(attackerDiceCount, maxAttDice) : maxAttDice;

    const attackRoll = this.rollDice(attDice);
    const defendRoll = this.rollDice(maxDefDice);
    const result = this.resolveCombat(attackRoll, defendRoll);

    const remainingDefender = config.defenderArmies - result.defenderLosses;
    result.conquered = remainingDefender <= 0;

    return result;
  }

  canAttack(attackerArmies: number): boolean {
    return attackerArmies >= 2;
  }

  validateConquestMove(armies: number, availableArmies: number): boolean {
    if (armies < 1) return false;
    if (armies > 3) return false;
    if (armies > availableArmies - 1) return false;
    return true;
  }
}
