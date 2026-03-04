export type TurnPhase = 'SITUATION_CARD' | 'REINFORCE' | 'TRADE' | 'ATTACK' | 'REGROUP' | 'DRAW_CARD' | 'DRAW_CONTINENT_CARD';

export class TurnManager {
  private turnOrder: string[];
  private currentPlayerIndex: number;
  private roundNumber: number;
  private turnPhase: TurnPhase;
  private hasStartedRegrouping: boolean;

  constructor(turnOrder: string[]) {
    this.turnOrder = [...turnOrder];
    this.currentPlayerIndex = 0;
    this.roundNumber = 1;
    this.turnPhase = 'SITUATION_CARD';
    this.hasStartedRegrouping = false;
  }

  getCurrentPlayer(): string {
    return this.turnOrder[this.currentPlayerIndex];
  }

  getTurnOrder(): string[] {
    return [...this.turnOrder];
  }

  getRoundNumber(): number {
    return this.roundNumber;
  }

  getTurnPhase(): TurnPhase {
    return this.turnPhase;
  }

  setTurnPhase(phase: TurnPhase): void {
    this.turnPhase = phase;
  }

  advancePhase(): TurnPhase {
    const phases: TurnPhase[] = [
      'SITUATION_CARD', 'REINFORCE', 'TRADE', 'ATTACK', 'REGROUP', 'DRAW_CARD', 'DRAW_CONTINENT_CARD',
    ];
    const currentIndex = phases.indexOf(this.turnPhase);
    if (currentIndex < phases.length - 1) {
      this.turnPhase = phases[currentIndex + 1];
    }
    return this.turnPhase;
  }

  canAttack(): boolean {
    return !this.hasStartedRegrouping && this.turnPhase === 'ATTACK';
  }

  startRegrouping(): void {
    this.hasStartedRegrouping = true;
    this.turnPhase = 'REGROUP';
  }

  endTurn(): { nextPlayer: string; newRound: boolean } {
    this.hasStartedRegrouping = false;
    this.currentPlayerIndex++;

    let newRound = false;

    if (this.currentPlayerIndex >= this.turnOrder.length) {
      this.currentPlayerIndex = 0;
      this.roundNumber++;
      newRound = true;
      this.rotateTurnOrder();
    }

    this.turnPhase = (this.currentPlayerIndex === 0 && this.roundNumber > 1)
      ? 'SITUATION_CARD'
      : 'REINFORCE';

    return { nextPlayer: this.getCurrentPlayer(), newRound };
  }

  rotateTurnOrder(): void {
    const first = this.turnOrder.shift();
    if (first) {
      this.turnOrder.push(first);
    }
  }

  removePlayer(playerId: string): void {
    const wasCurrent = this.getCurrentPlayer() === playerId;
    this.turnOrder = this.turnOrder.filter(id => id !== playerId);
    if (wasCurrent && this.currentPlayerIndex >= this.turnOrder.length) {
      this.currentPlayerIndex = 0;
    }
  }

  isFirstPlayerInRound(): boolean {
    return this.currentPlayerIndex === 0;
  }

  static determineInitialOrder(playerIds: string[]): string[] {
    const rolls = playerIds.map(id => ({
      id,
      roll: Math.floor(Math.random() * 6) + 1,
    }));
    rolls.sort((a, b) => b.roll - a.roll);
    return rolls.map(r => r.id);
  }
}
