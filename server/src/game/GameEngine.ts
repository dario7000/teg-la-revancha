import { CombatSystem } from './CombatSystem';
import type { CombatResult } from './CombatSystem';
import { ReinforcementCalc } from './ReinforcementCalc';
import { BlockadeSystem } from './BlockadeSystem';
import { TurnManager } from './TurnManager';
import type { TurnPhase } from './TurnManager';
import { TerritoryManager } from './TerritoryManager';
import type { TerritoryState } from './TerritoryManager';
import { CardManager } from './CardManager';
import { ContinentCardManager } from './ContinentCardManager';
import type { ContinentCardState } from './ContinentCardManager';
import { MissileSystem } from './MissileSystem';
import type { MissileAttackResult } from './MissileSystem';
import { SituationManager } from './SituationManager';
import { PactSystem } from './PactSystem';
import { ObjectiveChecker } from './ObjectiveChecker';
import type { CountryCard } from '../data/countryCards';
import { COUNTRY_CARDS } from '../data/countryCards';
import { COUNTRIES, COUNTRIES_MAP } from '../data/countries';
import type { Country, CountryId, ContinentId } from '../data/countries';
import { ADJACENCY } from '../data/adjacency';
import { SITUATION_CARDS } from '../data/situationCards';
import { OBJECTIVES } from '../data/objectives';
import type { Objective, PlayerColor } from '../data/objectives';
import type { PactType, PactDetails } from '../shared/types/Pacts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GamePhase = 'LOBBY' | 'SETUP_DISTRIBUTE' | 'SETUP_PLACE_18' | 'SETUP_PLACE_8' | 'SETUP_PLACE_4' | 'PLAYING' | 'FINISHED';

interface GameConfig {
  playerIds: string[];
  playerNames: Record<string, string>;
  playerColors: Record<string, string>;
  settings: {
    maxPlayers: number;
    turnTimeLimit: number;
    enableSituationCards: boolean;
    enableMissiles: boolean;
    enablePacts: boolean;
  };
}

interface PlayerData {
  id: string;
  name: string;
  color: string;
  hand: CountryCard[];
  objectives: Objective[];
  tradeCount: number;
  eliminated: boolean;
  eliminatedBy?: string;
}

interface LogEntry {
  timestamp: number;
  type: string;
  message: string;
}

interface TurnStartResult {
  situationCard: { id: string; type: string; description: string; color?: string } | null;
  reinforcements: {
    byCountries: number;
    byContinents: Record<string, number>;
    extraSituation: number;
    total: number;
  };
  descanso: boolean;
  crisisResult: { rolls: Record<string, number>; losers: string[] } | null;
}

interface EndTurnResult {
  nextPlayer: string;
  newRound: boolean;
  continentCardChanges: { awarded: { continent: string; player: string }[]; revoked: { continent: string; player: string }[] };
  blockades: { blockedCountry: string; blockerPlayer: string; blockerCountries: string[] }[];
}

interface VictoryResult {
  won: boolean;
  method: string;
  playerId?: string;
}

interface FullGameState {
  phase: GamePhase;
  turnPhase: TurnPhase;
  currentPlayer: string;
  turnOrder: string[];
  roundNumber: number;
  territories: Record<string, TerritoryState>;
  players: {
    id: string;
    name: string;
    color: string;
    handCount: number;
    hand: CountryCard[];
    objectives: Objective[];
    tradeCount: number;
    eliminated: boolean;
    eliminatedBy?: string;
  }[];
  conqueredThisTurn: number;
  canDrawCardThisTurn: boolean;
  activeSituation: { id: string; type: string; description: string; color?: string } | null;
  continentCards: Record<string, ContinentCardState>;
  pacts: ReturnType<PactSystem['getState']>;
  deckSize: number;
  log: LogEntry[];
}

interface SanitizedGameState {
  phase: GamePhase;
  turnPhase: TurnPhase;
  currentPlayer: string;
  turnOrder: string[];
  roundNumber: number;
  territories: Record<string, TerritoryState>;
  players: {
    id: string;
    name: string;
    color: string;
    handCount: number;
    hand?: CountryCard[];
    objectives?: Objective[];
    tradeCount: number;
    eliminated: boolean;
    eliminatedBy?: string;
  }[];
  conqueredThisTurn: number;
  canDrawCardThisTurn: boolean;
  activeSituation: { id: string; type: string; description: string; color?: string } | null;
  continentCards: Record<string, ContinentCardState>;
  pacts: ReturnType<PactSystem['getState']>;
  deckSize: number;
  log: LogEntry[];
}

// ---------------------------------------------------------------------------
// Lookup helpers (built once at module load)
// ---------------------------------------------------------------------------

/** Map of continent -> array of country IDs belonging to it. */
const CONTINENT_COUNTRIES: Record<string, string[]> = {};
for (const country of COUNTRIES) {
  if (!CONTINENT_COUNTRIES[country.continent]) {
    CONTINENT_COUNTRIES[country.continent] = [];
  }
  CONTINENT_COUNTRIES[country.continent].push(country.id);
}

/** Map of countryId -> continentId for quick lookup. */
const COUNTRY_TO_CONTINENT: Record<string, string> = {};
for (const country of COUNTRIES) {
  COUNTRY_TO_CONTINENT[country.id] = country.continent;
}

// ---------------------------------------------------------------------------
// GameEngine
// ---------------------------------------------------------------------------

export class GameEngine {
  // Existing subsystems
  public combat: CombatSystem;
  public reinforcement: ReinforcementCalc;
  public blockade: BlockadeSystem;
  public turnManager: TurnManager;
  public territoryManager: TerritoryManager;

  // New subsystems
  public cardManager: CardManager;
  public continentCardManager: ContinentCardManager;
  public missileSystem: MissileSystem;
  public situationManager: SituationManager;
  public pactSystem: PactSystem;
  public objectiveChecker: ObjectiveChecker;

  // Player data
  private players: Map<string, PlayerData>;

  // Game state
  private phase: GamePhase;
  private conqueredThisTurn: number;
  private canDrawCardThisTurn: boolean;
  private crisisLosers: Set<string>;
  private crisisResolvedThisTurn: boolean;
  private log: LogEntry[];

  // Settings (cached for runtime use)
  private enableSituationCards: boolean;
  private enableMissiles: boolean;
  private enablePacts: boolean;

  constructor() {
    this.combat = new CombatSystem();
    this.reinforcement = new ReinforcementCalc();
    this.blockade = new BlockadeSystem();
    this.turnManager = new TurnManager([]);
    this.territoryManager = new TerritoryManager({});

    this.cardManager = new CardManager(COUNTRY_CARDS);
    this.continentCardManager = new ContinentCardManager();
    this.missileSystem = new MissileSystem();
    this.situationManager = new SituationManager(SITUATION_CARDS as any);
    this.pactSystem = new PactSystem();
    this.objectiveChecker = new ObjectiveChecker();

    this.players = new Map();
    this.phase = 'LOBBY';
    this.conqueredThisTurn = 0;
    this.canDrawCardThisTurn = false;
    this.crisisLosers = new Set();
    this.crisisResolvedThisTurn = false;
    this.log = [];
    this.enableSituationCards = false;
    this.enableMissiles = false;
    this.enablePacts = false;
  }

  // =========================================================================
  // Game Initialisation
  // =========================================================================

  /**
   * Initialise the game: distribute countries, assign objectives, shuffle
   * cards, and set up all subsystems.
   *
   * This is the single entry point called when a room starts a game.
   * The `countryIds` and `adjacency` parameters are kept in the signature
   * for backward compatibility with EventRouter.
   */
  initGame(config: GameConfig, countryIds: string[], adjacency: Record<string, string[]>): void {
    this.enableSituationCards = config.settings.enableSituationCards;
    this.enableMissiles = config.settings.enableMissiles;
    this.enablePacts = config.settings.enablePacts;

    // -- Turn order ----------------------------------------------------------
    const turnOrder = TurnManager.determineInitialOrder(config.playerIds);
    this.turnManager = new TurnManager(turnOrder);

    // -- Distribute 72 countries ---------------------------------------------
    const territories = TerritoryManager.distributeCountries(countryIds, config.playerIds);
    this.territoryManager = new TerritoryManager(territories);

    // -- Assign objectives (20 total, shuffled) ------------------------------
    // For 2-3 player games, filter out destruction objectives and the 35-countries objective
    const playerCount = config.playerIds.length;
    let availableObjectives = [...OBJECTIVES];
    if (playerCount <= 3) {
      availableObjectives = availableObjectives.filter(obj => {
        if (obj.type === 'DESTRUCTION' || obj.type === 'DESTROY_LEFT') return false;
        if (obj.type === 'OCCUPATION' && obj.id === 'OBJ_12') return false; // 35 countries objective
        return true;
      });
    }
    const shuffledObjectives = this.shuffleArray(availableObjectives);

    // For 2 players: assign 2 objectives each; for 3+: assign 1
    const objectivesPerPlayer = playerCount === 2 ? 2 : 1;
    const assignedObjectives = this.assignObjectives(
      shuffledObjectives,
      config.playerIds,
      config.playerColors,
      turnOrder,
      objectivesPerPlayer,
    );

    // -- Create player data --------------------------------------------------
    this.players = new Map();
    for (const pid of config.playerIds) {
      this.players.set(pid, {
        id: pid,
        name: config.playerNames[pid] ?? pid,
        color: config.playerColors[pid] ?? 'WHITE',
        hand: [],
        objectives: assignedObjectives.get(pid)!,
        tradeCount: 0,
        eliminated: false,
      });
    }

    // -- Card subsystems -----------------------------------------------------
    this.cardManager = new CardManager(COUNTRY_CARDS);
    this.continentCardManager = new ContinentCardManager();

    // -- Situation cards (only if enabled) ------------------------------------
    if (this.enableSituationCards) {
      this.situationManager = new SituationManager(SITUATION_CARDS as any);
    } else {
      // Create with empty deck so methods don't crash, but no cards are drawn
      this.situationManager = new SituationManager([]);
    }

    // -- Pact system (always created, but canAttack/propose respect toggle) --
    this.pactSystem = new PactSystem();

    // -- Missile system ------------------------------------------------------
    this.missileSystem = new MissileSystem();

    // -- Objective checker ---------------------------------------------------
    this.objectiveChecker = new ObjectiveChecker();

    // -- Set phase -----------------------------------------------------------
    // 2 players: single setup phase of 18 armies; 3+: standard 8+4 setup
    this.phase = playerCount === 2 ? 'SETUP_PLACE_18' : 'SETUP_PLACE_8';
    this.conqueredThisTurn = 0;
    this.canDrawCardThisTurn = false;
    this.crisisLosers = new Set();
    this.crisisResolvedThisTurn = false;

    this.addLog('GAME_START', `Game started with ${config.playerIds.length} players`);
  }

  // =========================================================================
  // Setup Phase
  // =========================================================================

  placeSetupArmies(playerId: string, placements: Record<string, number>, maxArmies: number): boolean {
    const total = Object.values(placements).reduce((a, b) => a + b, 0);
    if (total > maxArmies) return false;

    // Validate all placements first
    for (const [countryId, count] of Object.entries(placements)) {
      const territory = this.territoryManager.getTerritory(countryId);
      if (!territory || territory.owner !== playerId) return false;
      if (count < 0) return false;
    }

    // Apply placements
    for (const [countryId, count] of Object.entries(placements)) {
      this.territoryManager.placeArmies(countryId, count);
    }

    return true;
  }

  // =========================================================================
  // Turn Flow
  // =========================================================================

  /**
   * Start a new turn for the current player.
   *
   * If this is the first player of the round and situation cards are enabled,
   * a situation card is revealed. Then reinforcements are calculated.
   */
  startTurn(): TurnStartResult {
    const currentPlayer = this.turnManager.getCurrentPlayer();
    const player = this.players.get(currentPlayer);

    // Reset per-turn state
    this.conqueredThisTurn = 0;
    this.canDrawCardThisTurn = false;
    this.crisisResolvedThisTurn = false;

    let situationCard: TurnStartResult['situationCard'] = null;
    let crisisResult: TurnStartResult['crisisResult'] = null;
    let descanso = false;

    // -- Situation card (first player of the round) --------------------------
    if (this.enableSituationCards && this.turnManager.isFirstPlayerInRound()) {
      const activePlayers = this.getActivePlayers().map(p => ({ id: p.id, color: p.color }));
      const card = this.situationManager.revealCard(activePlayers);
      situationCard = card;

      // Handle CRISIS: all players roll, losers can't draw cards this round
      if (this.situationManager.isCrisis()) {
        const activeIds = activePlayers.map(p => p.id);
        const result = this.situationManager.resolveCrisis(activeIds);
        crisisResult = result;
        this.crisisLosers = new Set(result.losers);
        this.crisisResolvedThisTurn = true;
        this.addLog('SITUATION', `Crisis! Losers: ${result.losers.join(', ')}`);
      } else {
        this.crisisLosers = new Set();
      }
    }

    // -- Check DESCANSO for current player -----------------------------------
    if (player && this.situationManager.isPlayerInDescanso(player.color)) {
      descanso = true;
      this.addLog('SITUATION', `${player.name} is in DESCANSO - can only reinforce`);
    }

    // -- Calculate reinforcements --------------------------------------------
    const playerCountries = this.territoryManager.getPlayerCountries(currentPlayer);
    const ownedContinents = this.territoryManager.getOwnedContinents(currentPlayer, CONTINENT_COUNTRIES);

    const baseReinforcement = this.reinforcement.calculateTotal(
      playerCountries.length,
      ownedContinents,
      null, // trade reinforcements are separate
    );

    // Extra reinforcements from REFUERZOS_EXTRAS situation card
    let extraSituation = 0;
    if (this.situationManager.isExtraReinforcements()) {
      extraSituation = this.reinforcement.calcExtraReinforcements(playerCountries.length);
    }

    const totalReinforcements = baseReinforcement.total + extraSituation;

    this.addLog('TURN_START', `${player?.name ?? currentPlayer}'s turn. Reinforcements: ${totalReinforcements}`);

    return {
      situationCard,
      reinforcements: {
        byCountries: baseReinforcement.byCountries,
        byContinents: baseReinforcement.byContinents,
        extraSituation,
        total: totalReinforcements,
      },
      descanso,
      crisisResult,
    };
  }

  /**
   * Place reinforcements on the map for the current player.
   *
   * Validates that:
   *   - All target countries belong to the player
   *   - No negative placement values
   *   - Blocked countries cannot receive reinforcements (unless in setup)
   */
  placeReinforcements(playerId: string, placements: Record<string, number>): boolean {
    // Validate targets
    for (const [countryId, count] of Object.entries(placements)) {
      const territory = this.territoryManager.getTerritory(countryId);
      if (!territory || territory.owner !== playerId) return false;
      if (count < 0) return false;

      // Blocked countries cannot receive reinforcements during normal play
      if (territory.isBlocked && this.phase === 'PLAYING') {
        if (!this.blockade.canReceiveReinforcements(true, false)) {
          return false;
        }
      }
    }

    // Apply placements
    for (const [countryId, count] of Object.entries(placements)) {
      this.territoryManager.placeArmies(countryId, count);
    }

    this.addLog('REINFORCE', `${playerId} placed reinforcements`);
    return true;
  }

  // =========================================================================
  // Cards
  // =========================================================================

  /**
   * Execute a card trade for a player.
   *
   * `cardIndices` are indices into the player's hand.
   * Negative indices represent continent cards: -(continentIndex + 1).
   *
   * Returns the number of armies received, or an error.
   */
  tradeCards(
    playerId: string,
    cardIndices: number[],
    continentCardIds?: string[],
  ): { success: boolean; armies: number; bonuses: { country: string; card: CountryCard }[] } {
    const player = this.players.get(playerId);
    if (!player) return { success: false, armies: 0, bonuses: [] };

    // Separate country card indices from continent card indices
    const handIndices = cardIndices.filter(i => i >= 0);
    const continentIndices = cardIndices.filter(i => i < 0).map(i => -(i + 1));

    // Get the actual country cards from the player's hand
    const tradedCards: CountryCard[] = [];
    for (const idx of handIndices) {
      if (idx < 0 || idx >= player.hand.length) {
        return { success: false, armies: 0, bonuses: [] };
      }
      tradedCards.push(player.hand[idx]);
    }

    // Get continent card states for validation
    const continentCardStates: ContinentCardState[] = [];
    const usedContinentIds = continentCardIds ?? [];
    for (const cid of usedContinentIds) {
      const cc = this.continentCardManager.getCard(cid);
      if (!cc || !this.continentCardManager.canUseCard(cid, playerId)) {
        return { success: false, armies: 0, bonuses: [] };
      }
      continentCardStates.push(cc);
    }

    // Validate the trade
    if (!this.cardManager.isValidTrade(tradedCards, continentCardStates)) {
      return { success: false, armies: 0, bonuses: [] };
    }

    // Increment trade count and calculate value
    player.tradeCount++;
    const armies = this.cardManager.getTradeValue(player.tradeCount);

    // Check card-country bonus (3 extra armies if card matches owned country)
    const playerCountries = this.territoryManager.getPlayerCountries(playerId);
    const bonuses = this.cardManager.checkCardCountryBonus(tradedCards, playerCountries);

    // Apply card-country bonuses
    for (const bonus of bonuses) {
      this.territoryManager.placeArmies(bonus.country, 3);
      this.addLog('CARD_BONUS', `${player.name} receives 3 bonus armies on ${bonus.country}`);
    }

    // Use continent cards
    for (const cid of usedContinentIds) {
      this.continentCardManager.useCard(cid, playerId);
    }

    // Remove traded cards from hand and discard them
    // Remove in reverse index order to avoid index shifting
    const sortedIndices = [...handIndices].sort((a, b) => b - a);
    for (const idx of sortedIndices) {
      player.hand.splice(idx, 1);
    }
    this.cardManager.discardCards(tradedCards);

    this.addLog('TRADE', `${player.name} traded cards (trade #${player.tradeCount}) for ${armies} armies`);

    return { success: true, armies, bonuses };
  }

  /**
   * Draw a country card for the player.
   *
   * Respects:
   *   - Must have conquered at least 1 country this turn (2 after 3rd trade)
   *   - CRISIS losers cannot draw
   *   - Can only draw once per turn
   */
  drawCard(playerId: string): CountryCard | null {
    const player = this.players.get(playerId);
    if (!player) return null;

    // Already drew this turn
    if (this.canDrawCardThisTurn) return null;

    // Check conquest requirement
    if (!this.cardManager.canDrawCard(this.conqueredThisTurn, player.tradeCount)) {
      return null;
    }

    // CRISIS: losers cannot draw cards this round
    if (this.crisisLosers.has(playerId)) {
      return null;
    }

    const card = this.cardManager.drawCard();
    if (!card) return null;

    player.hand.push(card);
    this.canDrawCardThisTurn = true;

    this.addLog('DRAW_CARD', `${player.name} drew a card`);
    return card;
  }

  /**
   * Check and update continent cards based on current continent ownership.
   *
   * Awards continent cards to players who own all countries in a continent,
   * and revokes them from players who lose control.
   */
  checkContinentCards(playerId: string): {
    awarded: { continent: string; player: string }[];
    revoked: { continent: string; player: string }[];
  } {
    const awarded: { continent: string; player: string }[] = [];
    const revoked: { continent: string; player: string }[] = [];

    for (const [continent, countries] of Object.entries(CONTINENT_COUNTRIES)) {
      const ownsAll = this.territoryManager.ownsContinent(playerId, countries);
      const currentCard = this.continentCardManager.getCard(continent);

      if (ownsAll && currentCard?.heldBy !== playerId) {
        // Player now owns the entire continent -- award card
        if (this.continentCardManager.awardCard(continent, playerId)) {
          awarded.push({ continent, player: playerId });
          this.addLog('CONTINENT_CARD', `${playerId} awarded continent card for ${continent}`);
        }
      } else if (!ownsAll && currentCard?.heldBy === playerId) {
        // Player lost control -- revoke card
        if (this.continentCardManager.revokeCard(continent, playerId)) {
          revoked.push({ continent, player: playerId });
          this.addLog('CONTINENT_CARD', `${playerId} lost continent card for ${continent}`);
        }
      }
    }

    return { awarded, revoked };
  }

  // =========================================================================
  // Combat
  // =========================================================================

  /**
   * Execute an attack from one country to another.
   *
   * Checks:
   *   - Adjacency
   *   - PactSystem constraints (canAttack)
   *   - SituationManager restrictions (FRONTERAS, DESCANSO)
   *   - Combat modifier (NIEVE, VIENTO_A_FAVOR)
   */
  executeAttack(
    attackerCountry: string,
    defenderCountry: string,
    adjacency: Record<string, string[]>,
    diceCount?: number,
    situationEffect?: 'NONE' | 'NIEVE' | 'VIENTO_A_FAVOR',
  ): { success: boolean; result?: CombatResult; error?: string } {
    // -- Adjacency check -----------------------------------------------------
    const adj = adjacency[attackerCountry];
    if (!adj || !adj.includes(defenderCountry)) {
      return { success: false, error: 'Countries are not adjacent' };
    }

    const attacker = this.territoryManager.getTerritory(attackerCountry);
    const defender = this.territoryManager.getTerritory(defenderCountry);
    if (!attacker || !defender) return { success: false, error: 'Invalid countries' };
    if (attacker.owner === defender.owner) return { success: false, error: 'Cannot attack own country' };

    // -- Condominium checks --------------------------------------------------
    // Cannot attack a condominium you co-own
    if (this.enablePacts && this.pactSystem.isCondominium(defenderCountry)) {
      const owners = this.pactSystem.getCondominiumOwners(defenderCountry);
      if (owners && (owners[0] === attacker.owner || owners[1] === attacker.owner)) {
        return { success: false, error: 'Cannot attack a condominium you co-own' };
      }
    }

    // -- DESCANSO check ------------------------------------------------------
    const attackerPlayer = this.players.get(attacker.owner);
    if (attackerPlayer && this.situationManager.isPlayerInDescanso(attackerPlayer.color)) {
      return { success: false, error: 'Player is in DESCANSO and cannot attack' };
    }

    // -- Pact check ----------------------------------------------------------
    if (this.enablePacts) {
      const pactResult = this.pactSystem.canAttack(
        attacker.owner,
        defender.owner,
        attackerCountry,
        defenderCountry,
        COUNTRY_TO_CONTINENT,
      );
      if (!pactResult.allowed) {
        return {
          success: false,
          error: pactResult.wouldBreakPact
            ? `Attack would break pact ${pactResult.wouldBreakPact}`
            : 'Attack blocked by international zone',
        };
      }
    }

    // -- Situation card: FRONTERAS check -------------------------------------
    if (this.enableSituationCards) {
      const attackerContinent = COUNTRY_TO_CONTINENT[attackerCountry] ?? '';
      const defenderContinent = COUNTRY_TO_CONTINENT[defenderCountry] ?? '';
      if (!this.situationManager.isAttackAllowed(attackerCountry, defenderCountry, attackerContinent, defenderContinent)) {
        return { success: false, error: 'Attack not allowed by current situation card (FRONTERAS)' };
      }
    }

    // -- Determine effective armies for combat --------------------------------
    // When attacking FROM a condominium, only use the current player's armies
    let effectiveAttackerArmies = attacker.armies;
    if (this.enablePacts && this.pactSystem.isCondominium(attackerCountry)) {
      const condo = this.pactSystem.getCondominium(attackerCountry);
      if (condo) {
        effectiveAttackerArmies = condo.armies[attacker.owner] ?? attacker.armies;
      }
    }

    // -- Army check ----------------------------------------------------------
    if (!this.combat.canAttack(effectiveAttackerArmies)) {
      return { success: false, error: 'Need at least 2 armies to attack' };
    }

    // -- Determine situation effect ------------------------------------------
    const effect = situationEffect ?? (this.enableSituationCards
      ? this.situationManager.getCombatModifier()
      : 'NONE');

    // -- Execute combat ------------------------------------------------------
    const config = {
      attackerArmies: effectiveAttackerArmies,
      defenderArmies: defender.armies,
      attackerMissiles: attacker.missiles,
      defenderMissiles: defender.missiles,
      situationEffect: effect,
    };

    const result = this.combat.executeCombat(config, diceCount);
    this.territoryManager.removeArmies(attackerCountry, result.attackerLosses);
    this.territoryManager.removeArmies(defenderCountry, result.defenderLosses);

    this.addLog(
      'COMBAT',
      `${attackerCountry} attacks ${defenderCountry}: att -${result.attackerLosses}, def -${result.defenderLosses}${result.conquered ? ' CONQUERED' : ''}`,
    );

    if (result.conquered) {
      this.conqueredThisTurn++;

      // Check if the defender lost their last country
      const defenderCountries = this.territoryManager.countPlayerCountries(defender.owner);
      if (defenderCountries === 0) {
        // Defender may have just been eliminated (after conquest move completes the takeover)
        // Actual elimination happens in completeConquest
      }
    }

    return { success: true, result };
  }

  /**
   * Complete a conquest by moving armies into the conquered territory.
   *
   * After a successful attack that conquered a territory, the attacker must
   * move between 1 and 3 armies (at most armies-1 from the source).
   *
   * If the defender is eliminated (0 countries after this), triggers
   * player elimination.
   */
  completeConquest(fromCountry: string, toCountry: string, armies: number): boolean {
    const fromTerritory = this.territoryManager.getTerritory(fromCountry);
    const toTerritory = this.territoryManager.getTerritory(toCountry);
    if (!fromTerritory || !toTerritory) return false;
    if (!this.combat.validateConquestMove(armies, fromTerritory.armies)) return false;

    const previousOwner = toTerritory.owner;

    // If the conquered territory was a condominium, remove it from PactSystem
    if (this.enablePacts && this.pactSystem.isCondominium(toCountry)) {
      this.pactSystem.removeCondominium(toCountry);
      this.addLog('PACT', `Condominium on ${toCountry} dissolved by conquest`);
    }

    this.territoryManager.conquer(toCountry, fromTerritory.owner, armies);
    this.territoryManager.removeArmies(fromCountry, armies);

    // Check if defender has been eliminated
    const defenderCountryCount = this.territoryManager.countPlayerCountries(previousOwner);
    if (defenderCountryCount === 0) {
      this.eliminatePlayer(previousOwner, fromTerritory.owner);
    }

    return true;
  }

  // =========================================================================
  // Missiles
  // =========================================================================

  /**
   * Convert 6 armies into 1 missile at the specified country.
   * The country must have at least 7 armies (6 convert + 1 minimum occupation).
   */
  incorporateMissile(playerId: string, countryId: string): boolean {
    if (!this.enableMissiles) return false;

    const territory = this.territoryManager.getTerritory(countryId);
    if (!territory || territory.owner !== playerId) return false;

    const success = this.territoryManager.convertToMissile(countryId);
    if (success) {
      this.addLog('MISSILE', `${playerId} incorporated a missile at ${countryId}`);
    }
    return success;
  }

  /**
   * Fire a missile from one country at a target.
   */
  fireMissile(
    playerId: string,
    from: string,
    target: string,
  ): MissileAttackResult {
    if (!this.enableMissiles) {
      return { success: false, damage: 0, missileConsumed: false, error: 'Missiles are not enabled' };
    }

    const fromTerritory = this.territoryManager.getTerritory(from);
    if (!fromTerritory || fromTerritory.owner !== playerId) {
      return { success: false, damage: 0, missileConsumed: false, error: 'Not your country' };
    }

    // Build territories snapshot for the missile system
    const territories = this.buildTerritoriesSnapshot();
    const result = this.missileSystem.fireMissile(from, target, territories, ADJACENCY);

    if (result.success) {
      this.missileSystem.applyMissileAttack(from, target, result.damage, territories);
      this.syncTerritoriesFromSnapshot(territories);
      this.addLog('MISSILE', `${playerId} fired missile from ${from} at ${target}: ${result.damage} damage`);
    }

    return result;
  }

  // =========================================================================
  // Regroup
  // =========================================================================

  /**
   * Move armies between adjacent countries owned by the same player.
   */
  regroup(from: string, to: string, armies: number, adjacency: Record<string, string[]>): boolean {
    const adj = adjacency[from];
    if (!adj || !adj.includes(to)) return false;

    const fromT = this.territoryManager.getTerritory(from);
    const toT = this.territoryManager.getTerritory(to);
    if (!fromT || !toT || fromT.owner !== toT.owner) return false;

    // DESCANSO check: player in descanso cannot regroup
    const player = this.players.get(fromT.owner);
    if (player && this.situationManager.isPlayerInDescanso(player.color)) {
      return false;
    }

    this.turnManager.startRegrouping();
    return this.territoryManager.moveArmies(from, to, armies);
  }

  // =========================================================================
  // End Turn
  // =========================================================================

  /**
   * End the current player's turn.
   *
   * - Check continent card awards/revocations for all players
   * - Update blockades
   * - Rotate turn
   */
  endTurn(): EndTurnResult {
    const currentPlayer = this.turnManager.getCurrentPlayer();

    // -- Continent card checks for the current player and any affected -------
    const allContinentChanges: EndTurnResult['continentCardChanges'] = { awarded: [], revoked: [] };
    for (const [pid] of this.players) {
      const player = this.players.get(pid);
      if (!player || player.eliminated) continue;
      const changes = this.checkContinentCards(pid);
      allContinentChanges.awarded.push(...changes.awarded);
      allContinentChanges.revoked.push(...changes.revoked);
    }

    // -- Update blockades ----------------------------------------------------
    const allTerritories = this.territoryManager.getAllTerritories();
    const blockadeList = this.blockade.checkAllBlockades(allTerritories, ADJACENCY);
    // Apply blockade status to territories
    for (const country of COUNTRIES) {
      this.territoryManager.setBlocked(country.id, false);
    }
    for (const b of blockadeList) {
      this.territoryManager.setBlocked(b.blockedCountry, true);
    }

    // -- Reset per-turn state ------------------------------------------------
    this.conqueredThisTurn = 0;
    this.canDrawCardThisTurn = false;

    // -- Advance turn --------------------------------------------------------
    const turnResult = this.turnManager.endTurn();

    this.addLog('TURN_END', `${currentPlayer}'s turn ended. Next: ${turnResult.nextPlayer}`);

    return {
      nextPlayer: turnResult.nextPlayer,
      newRound: turnResult.newRound,
      continentCardChanges: allContinentChanges,
      blockades: blockadeList,
    };
  }

  // =========================================================================
  // Victory
  // =========================================================================

  /**
   * Check if a specific player has won.
   *
   * Special rules by player count:
   *   - 2 players: player must complete ALL objectives (2) to win
   *   - 3 players: player must complete objective AND hold 10+ extra countries
   *               beyond what the objective requires
   *   - 4+ players: standard rules (single objective OR 45 countries)
   */
  checkVictory(playerId: string): VictoryResult {
    const player = this.players.get(playerId);
    if (!player || player.eliminated) return { won: false, method: '' };

    const playerCountries = this.territoryManager.getPlayerCountries(playerId);
    const countriesData = COUNTRIES.map(c => ({ id: c.id, continent: c.continent, isIsland: c.isIsland }));
    const eliminatedPlayers = this.getEliminatedPlayers();
    const totalPlayers = this.players.size;

    // Common victory check (45+ countries wins regardless for all modes)
    if (this.objectiveChecker.checkCommonVictory(playerCountries.length)) {
      return { won: true, method: 'COMMON_45', playerId };
    }

    // --- 2 players: must complete ALL objectives ---
    if (totalPlayers === 2) {
      const allMet = player.objectives.every(obj => {
        const result = this.checkSingleObjective(obj, player, playerCountries, countriesData, eliminatedPlayers, playerId);
        return result.won;
      });
      if (allMet) {
        return { won: true, method: 'OBJECTIVE', playerId };
      }
      return { won: false, method: '' };
    }

    // --- 3 players: must complete objective + 10 extra countries ---
    if (totalPlayers === 3) {
      const obj = player.objectives[0];
      if (!obj) return { won: false, method: '' };
      const objResult = this.checkSingleObjective(obj, player, playerCountries, countriesData, eliminatedPlayers, playerId);
      if (objResult.won) {
        // Calculate how many countries the objective requires
        const requiredCountries = this.objectiveChecker.countRequiredCountries(obj, countriesData);
        const extraCountries = playerCountries.length - requiredCountries;
        if (extraCountries >= 10) {
          return { won: true, method: 'OBJECTIVE', playerId };
        }
      }
      return { won: false, method: '' };
    }

    // --- 4+ players: standard single objective ---
    const obj = player.objectives[0];
    if (!obj) return { won: false, method: '' };

    const result = this.checkSingleObjective(obj, player, playerCountries, countriesData, eliminatedPlayers, playerId);
    if (result.won) {
      return { won: true, method: result.method, playerId };
    }

    return { won: false, method: '' };
  }

  /**
   * Check a single objective for a player (helper for checkVictory).
   */
  private checkSingleObjective(
    objective: Objective,
    player: PlayerData,
    playerCountries: string[],
    countriesData: { id: string; continent: string; isIsland: boolean }[],
    eliminatedPlayers: { id: string; eliminatedBy: string | null }[],
    playerId: string,
  ): { won: boolean; method: string } {
    let resolvedTargetId: string | null = null;
    if (objective.type === 'DESTRUCTION') {
      const allPlayersInfo = this.getAllPlayersInfo();
      const playerIndex = allPlayersInfo.findIndex(p => p.id === playerId);
      resolvedTargetId = this.objectiveChecker.resolveDestructionTarget(
        objective.targetColor,
        player.color,
        allPlayersInfo,
        playerIndex,
      );
    } else if (objective.type === 'DESTROY_LEFT') {
      const allPlayersInfo = this.getAllPlayersInfo();
      const playerIndex = allPlayersInfo.findIndex(p => p.id === playerId);
      resolvedTargetId = this.objectiveChecker.resolveDestroyLeftTarget(allPlayersInfo, playerIndex);
    }

    return this.objectiveChecker.checkVictory(
      objective,
      playerCountries,
      countriesData,
      eliminatedPlayers,
      playerId,
      resolvedTargetId,
    );
  }

  /**
   * Check all players for victory conditions.
   * Returns the first winner found, or null.
   */
  checkAllVictory(): VictoryResult | null {
    for (const [pid, player] of this.players) {
      if (player.eliminated) continue;
      const result = this.checkVictory(pid);
      if (result.won) {
        return { won: true, method: result.method, playerId: pid };
      }
    }
    return null;
  }

  // =========================================================================
  // Pacts (delegated to PactSystem)
  // =========================================================================

  proposePact(
    fromPlayer: string,
    toPlayer: string,
    type: PactType,
    details?: PactDetails,
    currentTurn?: number,
  ): string {
    if (!this.enablePacts) throw new Error('Pacts are not enabled');
    return this.pactSystem.proposePact(
      fromPlayer,
      toPlayer,
      type,
      details,
      currentTurn ?? this.turnManager.getRoundNumber(),
    );
  }

  respondPact(pactId: string, playerId: string, accept: boolean): void {
    if (!this.enablePacts) return;
    if (accept) {
      this.pactSystem.acceptPact(pactId, playerId);
      this.addLog('PACT', `Pact ${pactId} accepted by ${playerId}`);
    } else {
      this.pactSystem.rejectPact(pactId, playerId);
      this.addLog('PACT', `Pact ${pactId} rejected by ${playerId}`);
    }
  }

  breakPact(pactId: string, playerId: string): void {
    if (!this.enablePacts) return;
    this.pactSystem.breakPact(pactId, playerId, this.turnManager.getRoundNumber());
    this.addLog('PACT', `Pact ${pactId} broken by ${playerId}`);
  }

  // =========================================================================
  // Condominiums & International Zones
  // =========================================================================

  /**
   * Create a condominium on a conquered territory.
   * Sets the territory's co-owner fields so the client can render both colors.
   */
  createCondominium(
    countryId: string,
    player1: string,
    player2: string,
    totalArmies: number,
  ): void {
    this.pactSystem.createCondominium(countryId, player1, player2, totalArmies);

    // Mirror the condominium into TerritoryManager so territories carry co-owner info
    const condo = this.pactSystem.getCondominium(countryId);
    if (condo) {
      const territory = this.territoryManager.getTerritory(countryId);
      if (territory) {
        territory.owner = player1;
        territory.armies = condo.armies[player1] ?? 0;
        territory.coOwner = player2;
        territory.coOwnerArmies = condo.armies[player2] ?? 0;
        territory.coOwnerMissiles = 0;
      }
    }

    this.addLog('PACT', `Condominium created on ${countryId} between ${player1} and ${player2}`);
  }

  /**
   * Create an international zone — a neutral territory that cannot be attacked.
   */
  createInternationalZone(
    countryId: string,
    player1: string,
    player2: string,
  ): void {
    this.pactSystem.createInternationalZone(countryId);

    // Set territory to 1 army, owned nominally by the original owner (it is protected)
    const territory = this.territoryManager.getTerritory(countryId);
    if (territory) {
      territory.armies = 1;
    }

    this.addLog('PACT', `International zone created on ${countryId} between ${player1} and ${player2}`);
  }

  /**
   * Execute an attack as an ally during an aggression pact.
   * The ally is not the current turn player but has permission to attack the target.
   */
  executeAllyAttack(
    allyId: string,
    attackerCountry: string,
    targetCountry: string,
    adjacency: Record<string, string[]>,
    diceCount?: number,
    situationEffect?: 'NONE' | 'NIEVE' | 'VIENTO_A_FAVOR',
  ): { success: boolean; result?: CombatResult; error?: string } {
    // Adjacency check
    const adj = adjacency[attackerCountry];
    if (!adj || !adj.includes(targetCountry)) {
      return { success: false, error: 'Countries are not adjacent' };
    }

    const attacker = this.territoryManager.getTerritory(attackerCountry);
    const defender = this.territoryManager.getTerritory(targetCountry);
    if (!attacker || !defender) return { success: false, error: 'Invalid countries' };
    if (attacker.owner !== allyId) return { success: false, error: 'You do not own the attacking country' };

    // Army check
    if (!this.combat.canAttack(attacker.armies)) {
      return { success: false, error: 'Need at least 2 armies to attack' };
    }

    const effect = situationEffect ?? 'NONE';

    const config = {
      attackerArmies: attacker.armies,
      defenderArmies: defender.armies,
      attackerMissiles: attacker.missiles,
      defenderMissiles: defender.missiles,
      situationEffect: effect,
    };

    const result = this.combat.executeCombat(config, diceCount);
    this.territoryManager.removeArmies(attackerCountry, result.attackerLosses);
    this.territoryManager.removeArmies(targetCountry, result.defenderLosses);

    this.addLog(
      'COMBAT',
      `ALLY ATTACK: ${attackerCountry} attacks ${targetCountry}: att -${result.attackerLosses}, def -${result.defenderLosses}${result.conquered ? ' CONQUERED' : ''}`,
    );

    if (result.conquered) {
      this.conqueredThisTurn++;
    }

    return { success: true, result };
  }

  // =========================================================================
  // Player Elimination
  // =========================================================================

  /**
   * Eliminate a player.
   *
   * - Transfer all their country cards to the eliminator
   * - Remove from turn order
   * - Clean up pacts involving this player
   */
  eliminatePlayer(playerId: string, eliminatedBy: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    if (player.eliminated) return;

    player.eliminated = true;
    player.eliminatedBy = eliminatedBy;

    // Transfer cards to the eliminator
    const eliminator = this.players.get(eliminatedBy);
    if (eliminator) {
      eliminator.hand.push(...player.hand);
      this.addLog('ELIMINATION', `${player.name}'s ${player.hand.length} cards transferred to ${eliminator.name}`);
    }
    player.hand = [];

    // Remove from turn order
    this.turnManager.removePlayer(playerId);

    // Clean up pacts
    this.pactSystem.removePlayerPacts(playerId);

    this.addLog('ELIMINATION', `${player.name} (${player.color}) eliminated by ${eliminator?.name ?? eliminatedBy}`);
  }

  // =========================================================================
  // State Serialization
  // =========================================================================

  /**
   * Get the complete game state (for internal/admin use).
   */
  getFullState(): FullGameState {
    const playersData = [];
    for (const [_, player] of this.players) {
      playersData.push({
        id: player.id,
        name: player.name,
        color: player.color,
        handCount: player.hand.length,
        hand: [...player.hand],
        objectives: [...player.objectives],
        tradeCount: player.tradeCount,
        eliminated: player.eliminated,
        eliminatedBy: player.eliminatedBy,
      });
    }

    return {
      phase: this.phase,
      turnPhase: this.turnManager.getTurnPhase(),
      currentPlayer: this.turnManager.getCurrentPlayer(),
      turnOrder: this.turnManager.getTurnOrder(),
      roundNumber: this.turnManager.getRoundNumber(),
      territories: this.territoryManager.getAllTerritories(),
      players: playersData,
      conqueredThisTurn: this.conqueredThisTurn,
      canDrawCardThisTurn: this.canDrawCardThisTurn,
      activeSituation: this.situationManager.getActiveSituation(),
      continentCards: this.continentCardManager.getAllCards(),
      pacts: this.pactSystem.getState(),
      deckSize: this.cardManager.getDeckSize(),
      log: [...this.log],
    };
  }

  /**
   * Get a sanitized game state for a specific player.
   *
   * Hides:
   *   - Other players' cards (only shows count)
   *   - Other players' objectives
   */
  getStateForPlayer(playerId: string): SanitizedGameState {
    const playersData = [];
    for (const [_, player] of this.players) {
      const isMe = player.id === playerId;
      playersData.push({
        id: player.id,
        name: player.name,
        color: player.color,
        handCount: player.hand.length,
        hand: isMe ? [...player.hand] : undefined,
        objectives: isMe ? [...player.objectives] : undefined,
        tradeCount: player.tradeCount,
        eliminated: player.eliminated,
        eliminatedBy: player.eliminatedBy,
      });
    }

    return {
      phase: this.phase,
      turnPhase: this.turnManager.getTurnPhase(),
      currentPlayer: this.turnManager.getCurrentPlayer(),
      turnOrder: this.turnManager.getTurnOrder(),
      roundNumber: this.turnManager.getRoundNumber(),
      territories: this.territoryManager.getAllTerritories(),
      players: playersData,
      conqueredThisTurn: this.conqueredThisTurn,
      canDrawCardThisTurn: this.canDrawCardThisTurn,
      activeSituation: this.situationManager.getActiveSituation(),
      continentCards: this.continentCardManager.getAllCards(),
      pacts: this.pactSystem.getState(),
      deckSize: this.cardManager.getDeckSize(),
      log: [...this.log],
    };
  }

  // =========================================================================
  // Accessors (backward compatibility with EventRouter)
  // =========================================================================

  getConqueredThisTurn(): number {
    return this.conqueredThisTurn;
  }

  canDrawCard(playerTradeCount: number): boolean {
    if (playerTradeCount >= 3) return this.conqueredThisTurn >= 2;
    return this.conqueredThisTurn >= 1;
  }

  getLog(): LogEntry[] {
    return [...this.log];
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  setPhase(phase: GamePhase): void {
    this.phase = phase;
  }

  getPlayer(playerId: string): PlayerData | undefined {
    const player = this.players.get(playerId);
    return player ? { ...player, hand: [...player.hand] } : undefined;
  }

  getPlayerHand(playerId: string): CountryCard[] {
    const player = this.players.get(playerId);
    return player ? [...player.hand] : [];
  }

  getActivePlayers(): PlayerData[] {
    const result: PlayerData[] = [];
    for (const [_, player] of this.players) {
      if (!player.eliminated) result.push(player);
    }
    return result;
  }

  isPlayerEliminated(playerId: string): boolean {
    const player = this.players.get(playerId);
    return player?.eliminated ?? false;
  }

  getSettings(): { enableSituationCards: boolean; enableMissiles: boolean; enablePacts: boolean } {
    return {
      enableSituationCards: this.enableSituationCards,
      enableMissiles: this.enableMissiles,
      enablePacts: this.enablePacts,
    };
  }

  // =========================================================================
  // Private Helpers
  // =========================================================================

  private addLog(type: string, message: string): void {
    this.log.push({ timestamp: Date.now(), type, message });
  }

  /**
   * Assign objectives to players, respecting the rule that a player
   * should not receive a destruction objective targeting their own color.
   * If that happens, the objective is put back and another is drawn.
   */
  private assignObjectives(
    shuffledObjectives: Objective[],
    playerIds: string[],
    playerColors: Record<string, string>,
    turnOrder: string[],
    objectivesPerPlayer: number = 1,
  ): Map<string, Objective[]> {
    const assignments = new Map<string, Objective[]>();
    const available = [...shuffledObjectives];

    for (const pid of playerIds) {
      const playerColor = playerColors[pid] ?? 'WHITE';
      const playerObjectives: Objective[] = [];

      for (let n = 0; n < objectivesPerPlayer; n++) {
        let assignedIdx = -1;
        for (let i = 0; i < available.length; i++) {
          const obj = available[i];

          // Rule: a DESTRUCTION objective cannot target the player's own color.
          // The player would get the fallback (player to the right), but we
          // prefer to assign a different objective entirely.
          if (obj.type === 'DESTRUCTION' && obj.targetColor === playerColor) {
            continue;
          }

          assignedIdx = i;
          break;
        }

        if (assignedIdx === -1) {
          // Fallback: if all remaining objectives conflict (very unlikely with
          // 20 objectives and <=6 players), just assign the first one anyway.
          assignedIdx = 0;
        }

        playerObjectives.push(available[assignedIdx]);
        available.splice(assignedIdx, 1);
      }

      assignments.set(pid, playerObjectives);
    }

    return assignments;
  }

  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  private getEliminatedPlayers(): { id: string; eliminatedBy: string | null }[] {
    const result: { id: string; eliminatedBy: string | null }[] = [];
    for (const [_, player] of this.players) {
      if (player.eliminated) {
        result.push({ id: player.id, eliminatedBy: player.eliminatedBy ?? null });
      }
    }
    return result;
  }

  private getAllPlayersInfo(): { id: string; color: string; eliminated?: boolean; objective: Objective; countries: string[] }[] {
    const result: { id: string; color: string; eliminated?: boolean; objective: Objective; countries: string[] }[] = [];
    for (const [_, player] of this.players) {
      result.push({
        id: player.id,
        color: player.color,
        eliminated: player.eliminated || undefined,
        objective: player.objectives[0],
        countries: this.territoryManager.getPlayerCountries(player.id),
      });
    }
    return result;
  }

  /** Build a snapshot of territories in the format MissileSystem expects. */
  private buildTerritoriesSnapshot(): Record<string, { owner: string; armies: number; missiles: number }> {
    const snap: Record<string, { owner: string; armies: number; missiles: number }> = {};
    for (const country of COUNTRIES) {
      const t = this.territoryManager.getTerritory(country.id);
      if (t) {
        snap[country.id] = { owner: t.owner, armies: t.armies, missiles: t.missiles };
      }
    }
    return snap;
  }

  /** Write snapshot values back into the engine's TerritoryManager. */
  private syncTerritoriesFromSnapshot(
    snapshot: Record<string, { owner: string; armies: number; missiles: number }>,
  ): void {
    for (const [countryId, data] of Object.entries(snapshot)) {
      const t = this.territoryManager.getTerritory(countryId);
      if (t) {
        const armiesDelta = data.armies - t.armies;
        if (armiesDelta > 0) {
          this.territoryManager.placeArmies(countryId, armiesDelta);
        } else if (armiesDelta < 0) {
          this.territoryManager.removeArmies(countryId, -armiesDelta);
        }

        const missileDelta = data.missiles - t.missiles;
        if (missileDelta > 0) {
          // Add missiles directly (move from nowhere -- special sync case)
          for (let i = 0; i < missileDelta; i++) {
            // TerritoryManager doesn't have addMissile, so we use the raw approach:
            // place 6 armies then convert, or adjust via moveMissiles.
            // Since this is a sync operation, we'll just accept the snapshot state.
          }
        }
        // For missile sync, we work with the snapshot data directly on territory
        // The MissileSystem already mutated the snapshot in-place, and the
        // TerritoryManager's convertToMissile handles the normal flow.
        // For the delta sync after missile fire, missiles are decremented on
        // the source. We handle this by directly adjusting:
        if (missileDelta !== 0) {
          // Access internal state through a territory re-read after armies sync
          const updated = this.territoryManager.getTerritory(countryId);
          if (updated && updated.missiles !== data.missiles) {
            // Use moveMissiles as a workaround or accept the state
            // Since TerritoryManager doesn't expose a raw missile setter,
            // and the only missile operation that reduces count is firing,
            // we rely on the territory state being consistent via the snapshot.
            // The actual missile decrement/increment needs a setter.
            // For now, handle via direct armies/missiles through the territory:
            const diff = data.missiles - updated.missiles;
            if (diff < 0) {
              // Missiles were consumed (fired). We need to reduce.
              // TerritoryManager.removeArmies won't work for missiles.
              // We'll use the territory object directly since getAllTerritories
              // returns a copy but getTerritory returns the reference.
              // Actually TerritoryManager returns the actual reference.
              updated.missiles = data.missiles;
            } else if (diff > 0) {
              updated.missiles = data.missiles;
            }
          }
        }
      }
    }
  }
}
