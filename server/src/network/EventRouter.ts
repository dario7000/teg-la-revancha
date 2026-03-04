import { Server, Socket } from 'socket.io';
import { RoomManager, Room } from './RoomManager';
import { GameEngine } from '../game/GameEngine';
import { CardManager } from '../game/CardManager';
import { MissileSystem } from '../game/MissileSystem';
import { SituationManager } from '../game/SituationManager';
import { ContinentCardManager } from '../game/ContinentCardManager';
import { ObjectiveChecker } from '../game/ObjectiveChecker';
import { COUNTRIES } from '../data/countries';
import { ADJACENCY } from '../data/adjacency';
import { COUNTRY_CARDS } from '../data/countryCards';
import { SITUATION_CARDS } from '../data/situationCards';
import type { PlayerColor } from '../data/objectives';
import type { RegroupAction } from '@shared/types/Actions';

/** Precomputed continent -> country-id[] map, used for reinforcement calculation. */
const CONTINENT_COUNTRIES: Record<string, string[]> = {};
for (const country of COUNTRIES) {
  if (!CONTINENT_COUNTRIES[country.continent]) {
    CONTINENT_COUNTRIES[country.continent] = [];
  }
  CONTINENT_COUNTRIES[country.continent].push(country.id);
}

/**
 * EventRouter wires Socket.io events from clients to the RoomManager and
 * GameEngine methods, and broadcasts state updates back to all room members.
 */
export class EventRouter {
  private io: Server;
  private roomManager: RoomManager;

  constructor(io: Server, roomManager: RoomManager) {
    this.io = io;
    this.roomManager = roomManager;

    // When a player's reconnect window expires the RoomManager tells us
    // so we can broadcast the update.
    this.roomManager.setOnPlayerExpired((roomId, playerId) => {
      this.broadcastRoomState(roomId);
      this.io.to(roomId).emit('game:notification', `Player ${playerId} has been removed (reconnect timeout expired).`);
    });
  }

  // ---------------------------------------------------------------------------
  // Public: attach handlers for a newly-connected socket
  // ---------------------------------------------------------------------------

  setupSocketHandlers(socket: Socket): void {
    // ---- Lobby / Room events ----
    this.onRoomList(socket);
    this.onRoomCreate(socket);
    this.onRoomJoin(socket);
    this.onRoomLeave(socket);
    this.onRoomSetColor(socket);
    this.onRoomReady(socket);
    this.onRoomStart(socket);
    this.onRoomSettings(socket);

    // ---- Reconnection ----
    this.onReconnectAttempt(socket);

    // ---- In-game events ----
    this.onSetupPlaceArmies(socket);
    this.onTurnReinforce(socket);
    this.onTurnTrade(socket);
    this.onTurnAttack(socket);
    this.onTurnConquestMove(socket);
    this.onTurnFireMissile(socket);
    this.onTurnRegroup(socket);
    this.onTurnDrawCard(socket);
    this.onTurnSkipToRegroup(socket);
    this.onTurnEndTurn(socket);

    // ---- Pact events ----
    this.onPactPropose(socket);
    this.onPactRespond(socket);
    this.onPactBreak(socket);

    // ---- Situation events ----
    this.onSituationRollCrisis(socket);

    // ---- Chat ----
    this.onChatMessage(socket);

    // ---- Disconnect ----
    this.onDisconnect(socket);
  }

  // ===========================================================================
  // ROOM / LOBBY handlers
  // ===========================================================================

  private onRoomList(socket: Socket): void {
    socket.on('room:list', (callback?: (rooms: unknown[]) => void) => {
      const rooms = this.roomManager.serializeRoomList();
      if (typeof callback === 'function') {
        callback(rooms);
      } else {
        socket.emit('room:list', rooms);
      }
    });
  }

  private onRoomCreate(socket: Socket): void {
    socket.on(
      'lobby:create',
      (settings: { roomName?: string; maxPlayers?: number; playerName?: string }) => {
        const roomName = settings.roomName || 'TEG Room';
        const maxPlayers = settings.maxPlayers || 6;
        const playerName = settings.playerName || `Player_${socket.id.slice(0, 4)}`;

        const room = this.roomManager.createRoom(
          socket.id,
          playerName,
          roomName,
          maxPlayers,
        );

        socket.join(room.id);
        socket.emit('room:joined', this.roomManager.serializeRoom(room));
        this.broadcastRoomState(room.id);
      },
    );
  }

  private onRoomJoin(socket: Socket): void {
    socket.on('lobby:join', (roomId: string, playerName: string) => {
      const room = this.roomManager.joinRoom(roomId, socket.id, playerName);
      if (!room) {
        socket.emit('error', 'Unable to join room. It may be full, already in progress, or does not exist.');
        return;
      }

      socket.join(room.id);
      socket.emit('room:joined', this.roomManager.serializeRoom(room));
      this.broadcastRoomState(room.id);
    });
  }

  private onRoomLeave(socket: Socket): void {
    socket.on('room:leave', () => {
      const room = this.roomManager.getRoomBySocket(socket.id);
      if (!room) return;

      const roomId = room.id;
      socket.leave(roomId);
      this.roomManager.leaveRoom(roomId, socket.id);
      this.broadcastRoomState(roomId);
    });
  }

  private onRoomSetColor(socket: Socket): void {
    socket.on('lobby:selectColor', (color: PlayerColor) => {
      const room = this.roomManager.getRoomBySocket(socket.id);
      if (!room) return;

      const success = this.roomManager.setPlayerColor(room.id, socket.id, color);
      if (!success) {
        socket.emit('error', 'Color is already taken or invalid.');
        return;
      }

      this.broadcastRoomState(room.id);
    });
  }

  private onRoomReady(socket: Socket): void {
    socket.on('lobby:ready', () => {
      const room = this.roomManager.getRoomBySocket(socket.id);
      if (!room) return;

      // Toggle ready state
      const playerId = this.roomManager.getPlayerIdBySocket(socket.id);
      if (!playerId) return;
      const player = room.players.get(playerId);
      if (!player) return;

      this.roomManager.setPlayerReady(room.id, socket.id, !player.ready);
      this.broadcastRoomState(room.id);
    });
  }

  private onRoomSettings(socket: Socket): void {
    socket.on('room:settings', (settings: Record<string, unknown>) => {
      const room = this.roomManager.getRoomBySocket(socket.id);
      if (!room) return;

      const success = this.roomManager.updateSettings(room.id, socket.id, settings as any);
      if (!success) {
        socket.emit('error', 'Only the host can change room settings.');
        return;
      }
      this.broadcastRoomState(room.id);
    });
  }

  private onRoomStart(socket: Socket): void {
    socket.on('lobby:start', () => {
      const currentRoom = this.roomManager.getRoomBySocket(socket.id);
      if (!currentRoom) {
        socket.emit('error', 'You are not in a room.');
        return;
      }

      const room = this.roomManager.startGame(currentRoom.id, socket.id);
      if (!room) {
        socket.emit('error', 'Cannot start the game. Ensure all players are ready, have unique colors, and there are at least 2 players.');
        return;
      }

      this.initializeGameForRoom(room);
      this.broadcastRoomState(room.id);
      this.broadcastGameState(room.id);
      this.io.to(room.id).emit('game:notification', 'The game has started!');
    });
  }

  // ===========================================================================
  // Reconnection
  // ===========================================================================

  private onReconnectAttempt(socket: Socket): void {
    socket.on('room:reconnect', (playerId: string) => {
      const result = this.roomManager.reconnectPlayer(socket.id, playerId);
      if (!result) {
        socket.emit('error', 'Reconnection failed. The session may have expired.');
        return;
      }

      socket.join(result.room.id);
      socket.emit('room:joined', this.roomManager.serializeRoom(result.room));
      this.io.to(result.room.id).emit('game:notification', `${result.room.players.get(result.playerId)?.name ?? 'A player'} has reconnected.`);
      this.broadcastRoomState(result.room.id);

      // Send the full game state to the reconnected player
      if (result.room.status === 'PLAYING') {
        this.sendGameStateToSocket(result.room, result.playerId, socket);
      }
    });
  }

  // ===========================================================================
  // IN-GAME handlers
  // ===========================================================================

  private onSetupPlaceArmies(socket: Socket): void {
    socket.on('setup:placeArmies', (placements: Record<string, number>) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      const phase = ctx.engine.getPhase();
      const maxArmies = phase === 'SETUP_PLACE_8' ? 8 : phase === 'SETUP_PLACE_4' ? 4 : 0;
      if (maxArmies === 0) {
        socket.emit('error', 'Not in a setup phase.');
        return;
      }

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      // Initialize reinforcementsLeft for setup if not yet set
      if (ctx.room.reinforcementsLeft === undefined || ctx.room.reinforcementsLeft === null) {
        ctx.room.reinforcementsLeft = maxArmies;
      }

      // Calculate total armies being placed in this batch
      const totalPlacing = Object.values(placements).reduce((a, b) => a + b, 0);

      if (totalPlacing <= 0) {
        socket.emit('error', 'Must place at least 1 army.');
        return;
      }

      if (totalPlacing > ctx.room.reinforcementsLeft) {
        socket.emit('error', `Cannot place ${totalPlacing} armies. Only ${ctx.room.reinforcementsLeft} setup armies remaining.`);
        return;
      }

      // Validate and place armies (uses placeSetupArmies for ownership validation)
      const success = ctx.engine.placeSetupArmies(ctx.playerId, placements, totalPlacing);
      if (!success) {
        socket.emit('error', 'Invalid army placement.');
        return;
      }

      ctx.room.reinforcementsLeft -= totalPlacing;

      // When player has placed all their setup armies, advance to next player
      if (ctx.room.reinforcementsLeft <= 0) {
        ctx.room.reinforcementsLeft = undefined;

        const turnResult = ctx.engine.endTurn();
        // Check if all players have placed: if we're back to first player
        // and we were on SETUP_PLACE_8, move to SETUP_PLACE_4, etc.
        if (turnResult.newRound) {
          if (phase === 'SETUP_PLACE_8') {
            ctx.engine.setPhase('SETUP_PLACE_4');
          } else if (phase === 'SETUP_PLACE_4') {
            ctx.engine.setPhase('PLAYING');
            // Initialize reinforcements for the first player's turn
            const firstPlayer = ctx.engine.turnManager.getCurrentPlayer();
            this.initReinforcementsForCurrentPlayer(ctx.room, ctx.engine, firstPlayer);
          }
        }
      }

      this.broadcastGameState(ctx.room.id);
    });
  }

  private onTurnReinforce(socket: Socket): void {
    socket.on('turn:reinforce', (placements: Record<string, number>) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      // Initialize reinforcementsLeft if not yet set for this turn
      if (ctx.room.reinforcementsLeft === undefined || ctx.room.reinforcementsLeft === null) {
        this.initReinforcementsForCurrentPlayer(ctx.room, ctx.engine, ctx.playerId);
      }

      // Calculate total armies being placed in this batch
      const totalPlacing = Object.values(placements).reduce((a, b) => a + b, 0);

      if (totalPlacing <= 0) {
        socket.emit('error', 'Must place at least 1 army.');
        return;
      }

      if (totalPlacing > (ctx.room.reinforcementsLeft ?? 0)) {
        socket.emit('error', `Cannot place ${totalPlacing} armies. Only ${ctx.room.reinforcementsLeft} reinforcements remaining.`);
        return;
      }

      // Validate placement targets belong to the player
      for (const [countryId, count] of Object.entries(placements)) {
        const territory = ctx.engine.territoryManager.getTerritory(countryId);
        if (!territory || territory.owner !== ctx.playerId || count < 0) {
          socket.emit('error', `Invalid reinforcement target: ${countryId}`);
          return;
        }
      }

      // Place armies
      for (const [countryId, count] of Object.entries(placements)) {
        ctx.engine.territoryManager.placeArmies(countryId, count);
      }

      // Decrement remaining reinforcements
      ctx.room.reinforcementsLeft! -= totalPlacing;

      // Auto-advance to ATTACK phase when all reinforcements placed
      if (ctx.room.reinforcementsLeft! <= 0) {
        ctx.room.reinforcementsLeft = 0;
        ctx.engine.turnManager.setTurnPhase('ATTACK');
      }

      this.broadcastGameState(ctx.room.id);
    });
  }

  private onTurnTrade(socket: Socket): void {
    socket.on('turn:trade', (cardIds: string[], continentCards?: string[]) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      if (!ctx.room.cardManager) {
        socket.emit('error', 'Card manager not initialised.');
        return;
      }

      // Convert card IDs to hand indices
      const playerData = ctx.engine.getPlayer(ctx.playerId);
      if (!playerData) {
        socket.emit('error', 'Player data not found.');
        return;
      }

      const cardIndices: number[] = [];
      for (const cardId of cardIds) {
        const idx = playerData.hand.findIndex(c => c.id === cardId);
        if (idx === -1) {
          socket.emit('error', `Card not found in hand: ${cardId}`);
          return;
        }
        cardIndices.push(idx);
      }

      // Execute the trade via GameEngine
      const result = ctx.engine.tradeCards(ctx.playerId, cardIndices, continentCards);

      if (!result.success) {
        socket.emit('error', 'Invalid card trade. The selected cards do not form a valid combination.');
        return;
      }

      // Add trade armies to reinforcementsLeft
      if (ctx.room.reinforcementsLeft !== undefined) {
        ctx.room.reinforcementsLeft += result.armies;
      } else {
        ctx.room.reinforcementsLeft = result.armies;
      }

      // Notify about the trade result
      socket.emit('game:notification', `Trade successful! Received ${result.armies} armies.`);

      // Notify about card-country bonuses (3 armies placed directly)
      for (const bonus of result.bonuses) {
        this.io.to(ctx.room.id).emit('game:notification',
          `Card-country bonus: 3 armies placed on ${bonus.country}`);
      }

      this.broadcastGameState(ctx.room.id);
    });
  }

  private onTurnAttack(socket: Socket): void {
    socket.on('turn:attack', (from: string, to: string, dice: number) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      if (ctx.engine.getPhase() !== 'PLAYING') {
        socket.emit('error', 'Game is not in the PLAYING phase.');
        return;
      }

      // Determine situation combat modifier
      const situationEffect = ctx.room.situationManager
        ? ctx.room.situationManager.getCombatModifier()
        : 'NONE' as const;

      const result = ctx.engine.executeAttack(from, to, ADJACENCY, dice, situationEffect);

      if (!result.success) {
        socket.emit('error', result.error ?? 'Attack failed.');
        return;
      }

      // Broadcast combat result to all players in the room
      this.io.to(ctx.room.id).emit('combat:result', result.result);

      // If the defender's territory was conquered, notify move range
      if (result.result?.conquered) {
        // Store pending conquest so the conquestMove handler knows which territories
        ctx.room.pendingConquest = { from, to };

        const attackerTerritory = ctx.engine.territoryManager.getTerritory(from);
        const armiesAvailable = attackerTerritory ? attackerTerritory.armies - 1 : 1;
        const minMove = Math.min(dice, armiesAvailable);
        const maxMove = Math.min(armiesAvailable, 3);
        this.io.to(ctx.room.id).emit('combat:conquered', to, ctx.playerId, [minMove, Math.max(minMove, maxMove)]);
      }

      this.broadcastGameState(ctx.room.id);
    });
  }

  private onTurnConquestMove(socket: Socket): void {
    socket.on('turn:conquestMove', (armies: number) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      // Retrieve the pending conquest (from/to set during the attack handler)
      const pending = ctx.room.pendingConquest;
      if (!pending) {
        socket.emit('error', 'No pending conquest to complete.');
        return;
      }

      const { from, to } = pending;

      // Use the GameEngine's completeConquest to validate and execute
      const success = ctx.engine.completeConquest(from, to, armies);
      if (!success) {
        socket.emit('error', 'Invalid conquest move. Armies must be between 1 and 3, and you must leave at least 1 army behind.');
        return;
      }

      // Clear the pending conquest
      ctx.room.pendingConquest = undefined;

      // Check victory after conquest completion
      const victory = ctx.engine.checkVictory(ctx.playerId);
      if (victory.won) {
        ctx.engine.setPhase('FINISHED');
        ctx.room.status = 'FINISHED';
        this.io.to(ctx.room.id).emit('game:victory', ctx.playerId, victory.method as 'OBJECTIVE' | 'COMMON_45');
      }

      this.broadcastGameState(ctx.room.id);
    });
  }

  private onTurnFireMissile(socket: Socket): void {
    socket.on('turn:fireMissile', (from: string, target: string) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      if (!ctx.room.missileSystem) {
        socket.emit('error', 'Missiles are not enabled.');
        return;
      }

      // Build a territories snapshot for the missile system
      const territories = this.buildTerritoriesSnapshot(ctx.engine);

      const result = ctx.room.missileSystem.fireMissile(from, target, territories, ADJACENCY);

      if (!result.success) {
        socket.emit('missile:blocked', result.error ?? 'Missile blocked.');
        return;
      }

      // Apply the attack
      ctx.room.missileSystem.applyMissileAttack(from, target, result.damage, territories);

      // Sync the updated values back to the engine's territory manager
      this.syncTerritoriesFromSnapshot(ctx.engine, territories);

      this.io.to(ctx.room.id).emit('missile:impact', from, target, result.damage);
      this.broadcastGameState(ctx.room.id);
    });
  }

  private onTurnRegroup(socket: Socket): void {
    socket.on('turn:regroup', (moves: RegroupAction[]) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      for (const move of moves) {
        const success = ctx.engine.regroup(move.from, move.to, move.armies, ADJACENCY);
        if (!success) {
          socket.emit('error', `Invalid regroup: ${move.from} -> ${move.to}`);
          return;
        }
      }

      this.broadcastGameState(ctx.room.id);
    });
  }

  private onTurnDrawCard(socket: Socket): void {
    socket.on('turn:drawCard', () => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      if (!ctx.room.cardManager) {
        socket.emit('error', 'Card manager not initialised.');
        return;
      }

      const card = ctx.room.cardManager.drawCard();
      if (!card) {
        socket.emit('error', 'No cards available.');
        return;
      }

      // Send the drawn card only to the requesting player
      socket.emit('card:drawn', card);

      // Check card-country bonus
      const playerCountries = this.getPlayerCountries(ctx.engine, ctx.playerId);
      const bonuses = ctx.room.cardManager.checkCardCountryBonus([card], playerCountries);
      for (const bonus of bonuses) {
        socket.emit('card:bonusAvailable', bonus.country);
      }

      this.broadcastGameState(ctx.room.id);
    });
  }

  private onTurnSkipToRegroup(socket: Socket): void {
    socket.on('turn:skipToRegroup', () => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      const currentPhase = ctx.engine.turnManager.getTurnPhase();
      if (currentPhase !== 'ATTACK') {
        socket.emit('error', 'Can only skip to regroup during attack phase.');
        return;
      }

      ctx.engine.turnManager.startRegrouping();
      this.broadcastGameState(ctx.room.id);
    });
  }

  private onTurnEndTurn(socket: Socket): void {
    socket.on('turn:endTurn', () => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      // Clear pending conquest if any
      ctx.room.pendingConquest = undefined;

      const turnResult = ctx.engine.endTurn();
      this.io.to(ctx.room.id).emit('game:notification', `Turn ended. Next player: ${turnResult.nextPlayer}`);

      if (turnResult.newRound) {
        this.io.to(ctx.room.id).emit('turn:orderChanged', ctx.engine.turnManager.getTurnOrder());
      }

      // Initialize reinforcements for the next player's turn
      if (ctx.engine.getPhase() === 'PLAYING') {
        this.initReinforcementsForCurrentPlayer(ctx.room, ctx.engine, turnResult.nextPlayer);
      } else {
        // In setup phases, reinforcementsLeft is set per-placement
        ctx.room.reinforcementsLeft = undefined;
      }

      this.broadcastGameState(ctx.room.id);
    });
  }

  // ===========================================================================
  // PACT handlers
  // ===========================================================================

  private onPactPropose(socket: Socket): void {
    socket.on('pact:propose', (pact: { type: string; targetPlayer: string; details: any }) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      const pactId = `pact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const proposal = {
        id: pactId,
        from: ctx.playerId,
        ...pact,
      };

      // Send the proposal to the target player
      const targetPlayerEntry = ctx.room.players.get(pact.targetPlayer);
      if (!targetPlayerEntry || targetPlayerEntry.socketId === '') {
        socket.emit('error', 'Target player is not connected.');
        return;
      }

      this.io.to(targetPlayerEntry.socketId).emit('pact:proposed', proposal);
      socket.emit('game:notification', 'Pact proposal sent.');
    });
  }

  private onPactRespond(socket: Socket): void {
    socket.on('pact:respond', (pactId: string, accept: boolean) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      this.io.to(ctx.room.id).emit('pact:resolved', pactId, accept);
      this.broadcastGameState(ctx.room.id);
    });
  }

  private onPactBreak(socket: Socket): void {
    socket.on('pact:break', (pactId: string) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      this.io.to(ctx.room.id).emit('pact:broken', pactId, ctx.playerId);
      this.broadcastGameState(ctx.room.id);
    });
  }

  // ===========================================================================
  // SITUATION handlers
  // ===========================================================================

  private onSituationRollCrisis(socket: Socket): void {
    socket.on('situation:rollCrisis', () => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!ctx.room.situationManager) {
        socket.emit('error', 'Situation cards are not enabled.');
        return;
      }

      if (!ctx.room.situationManager.isCrisis()) {
        socket.emit('error', 'There is no active crisis.');
        return;
      }

      const playerIds = Array.from(ctx.room.players.keys());
      const result = ctx.room.situationManager.resolveCrisis(playerIds);

      for (const loserId of result.losers) {
        this.io.to(ctx.room.id).emit('situation:crisisResult', loserId);
      }

      this.broadcastGameState(ctx.room.id);
    });
  }

  // ===========================================================================
  // CHAT
  // ===========================================================================

  private onChatMessage(socket: Socket): void {
    socket.on('chat:message', (text: string, isDiplomacy: boolean) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      this.io.to(ctx.room.id).emit('chat:message', ctx.playerId, text, isDiplomacy);
    });
  }

  // ===========================================================================
  // DISCONNECT
  // ===========================================================================

  private onDisconnect(socket: Socket): void {
    socket.on('disconnect', () => {
      const result = this.roomManager.handleDisconnect(socket.id);
      if (!result) return;

      if (result.removed) {
        // Player fully removed (was in LOBBY or FINISHED)
        this.broadcastRoomState(result.roomId);
      } else {
        // Player entered reconnection window (was in PLAYING)
        const room = this.roomManager.getRoom(result.roomId);
        const playerName = room?.players.get(result.playerId)?.name ?? 'A player';
        this.io.to(result.roomId).emit(
          'game:notification',
          `${playerName} disconnected. They have 60 seconds to reconnect.`,
        );
        this.broadcastRoomState(result.roomId);
      }
    });
  }

  // ===========================================================================
  // Game initialisation (called when host starts the game)
  // ===========================================================================

  private initializeGameForRoom(room: Room): void {
    const playerIds = Array.from(room.players.keys());
    const playerNames: Record<string, string> = {};
    const playerColors: Record<string, string> = {};

    for (const [pid, p] of room.players) {
      playerNames[pid] = p.name;
      playerColors[pid] = p.color ?? 'WHITE';
    }

    const engine = new GameEngine();
    const countryIds = COUNTRIES.map((c) => c.id);

    engine.initGame(
      {
        playerIds,
        playerNames,
        playerColors,
        settings: {
          maxPlayers: room.maxPlayers,
          turnTimeLimit: room.settings.turnTimeLimit,
          enableSituationCards: room.settings.enableSituationCards,
          enableMissiles: room.settings.enableMissiles,
          enablePacts: room.settings.enablePacts,
        },
      },
      countryIds,
      ADJACENCY,
    );

    room.gameEngine = engine;
    room.cardManager = new CardManager(COUNTRY_CARDS as any);
    room.missileSystem = room.settings.enableMissiles ? new MissileSystem() : undefined;
    room.situationManager = room.settings.enableSituationCards
      ? new SituationManager(SITUATION_CARDS as any)
      : undefined;
    room.continentCardManager = new ContinentCardManager();
    room.objectiveChecker = new ObjectiveChecker();
  }

  // ===========================================================================
  // Broadcasting helpers
  // ===========================================================================

  /** Broadcast the current room state (lobby info) to all sockets in the room. */
  private broadcastRoomState(roomId: string): void {
    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    this.io.to(roomId).emit('lobby:updated', this.roomManager.serializeRoom(room));
  }

  /** Broadcast sanitised game state to every player in the room. */
  private broadcastGameState(roomId: string): void {
    const room = this.roomManager.getRoom(roomId);
    if (!room || !room.gameEngine) return;

    for (const [playerId, player] of room.players) {
      if (player.socketId === '') continue; // disconnected
      const sanitised = this.sanitizeStateForPlayer(room, playerId);
      this.io.to(player.socketId).emit('game:fullState', sanitised);
    }
  }

  /** Send game state to a single socket (used for reconnection). */
  private sendGameStateToSocket(room: Room, playerId: string, socket: Socket): void {
    if (!room.gameEngine) return;
    const sanitised = this.sanitizeStateForPlayer(room, playerId);
    socket.emit('game:fullState', sanitised);
  }

  // ===========================================================================
  // State sanitisation
  // ===========================================================================

  /**
   * Build a game state object for a specific player, mapping the server's
   * internal state to the ClientGameState interface the client expects.
   *
   * Client expects:
   *   phase, turnPhase, currentPlayerId, round, territories,
   *   players (PublicPlayerInfo[]), myHand, myObjective,
   *   activeSituationCard, pacts, reinforcementsLeft
   */
  private sanitizeStateForPlayer(room: Room, playerId: string): Record<string, unknown> {
    const engine = room.gameEngine!;

    // -- Territories (same structure, just copy) ----------------------------
    const territories: Record<string, unknown> = {};
    for (const country of COUNTRIES) {
      const t = engine.territoryManager.getTerritory(country.id);
      if (t) {
        territories[country.id] = { ...t };
      }
    }

    // -- Players (map to PublicPlayerInfo: id, name, color, countryCount, cardCount, eliminated) --
    const players: Record<string, unknown>[] = [];
    let myHand: unknown[] = [];
    let myObjective: unknown = null;

    for (const [pid, p] of room.players) {
      const isMe = pid === playerId;
      const playerData = engine.getPlayer(pid);
      const countryCount = engine.territoryManager.countPlayerCountries(pid);
      const cardCount = playerData ? playerData.hand.length : 0;
      const eliminated = playerData ? playerData.eliminated : false;

      if (isMe && playerData) {
        myHand = playerData.hand;
        myObjective = playerData.objective ?? null;
      }

      players.push({
        id: pid,
        name: p.name,
        color: p.color,
        countryCount,
        cardCount,
        eliminated,
      });
    }

    // -- Reinforcements for the current player ------------------------------
    // Use the tracked reinforcementsLeft from the room if available;
    // otherwise fall back to calculating from scratch.
    let reinforcementsLeft = 0;
    const currentPlayer = engine.turnManager.getCurrentPlayer();
    if (currentPlayer === playerId) {
      if (room.reinforcementsLeft !== undefined && room.reinforcementsLeft !== null) {
        reinforcementsLeft = room.reinforcementsLeft;
      } else {
        const playerCountries = engine.territoryManager.getPlayerCountries(playerId);
        const ownedContinents = engine.territoryManager.getOwnedContinents(
          playerId,
          CONTINENT_COUNTRIES,
        );
        const calc = engine.reinforcement.calculateTotal(
          playerCountries.length,
          ownedContinents,
          null,
        );
        reinforcementsLeft = calc.total;
      }
    }

    // -- Pacts --------------------------------------------------------------
    const pactState = engine.pactSystem.getState();

    return {
      phase: engine.getPhase(),
      turnPhase: engine.turnManager.getTurnPhase(),
      currentPlayerId: engine.turnManager.getCurrentPlayer(),
      round: engine.turnManager.getRoundNumber(),
      territories,
      players,
      myHand,
      myObjective,
      activeSituationCard: room.situationManager?.getActiveSituation() ?? null,
      pacts: pactState.pacts,
      reinforcementsLeft,
    };
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /** Utility: retrieve engine + room + playerId from a socket, or emit error. */
  private getGameContext(
    socket: Socket,
  ): { room: Room; engine: GameEngine; playerId: string } | null {
    const room = this.roomManager.getRoomBySocket(socket.id);
    if (!room) {
      socket.emit('error', 'You are not in a room.');
      return null;
    }

    const playerId = this.roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) {
      socket.emit('error', 'Player identity not found.');
      return null;
    }

    if (!room.gameEngine) {
      socket.emit('error', 'Game has not started yet.');
      return null;
    }

    return { room, engine: room.gameEngine, playerId };
  }

  /** Check if the socket's player is the current turn player. */
  private isCurrentPlayer(ctx: { engine: GameEngine; playerId: string }): boolean {
    return ctx.engine.turnManager.getCurrentPlayer() === ctx.playerId;
  }

  /**
   * Calculate and store initial reinforcements for the current player's turn.
   * This should be called when a new turn begins (after endTurn) or when
   * first needed during the REINFORCE phase.
   */
  private initReinforcementsForCurrentPlayer(room: Room, engine: GameEngine, playerId: string): void {
    const playerCountries = engine.territoryManager.getPlayerCountries(playerId);
    const ownedContinents = engine.territoryManager.getOwnedContinents(
      playerId,
      CONTINENT_COUNTRIES,
    );
    const calc = engine.reinforcement.calculateTotal(
      playerCountries.length,
      ownedContinents,
      null,
    );
    room.reinforcementsLeft = calc.total;
  }

  /** Get all country IDs owned by a player. */
  private getPlayerCountries(engine: GameEngine, playerId: string): string[] {
    const owned: string[] = [];
    for (const country of COUNTRIES) {
      const t = engine.territoryManager.getTerritory(country.id);
      if (t && t.owner === playerId) {
        owned.push(country.id);
      }
    }
    return owned;
  }

  /** Build a snapshot of territories in the format MissileSystem expects. */
  private buildTerritoriesSnapshot(
    engine: GameEngine,
  ): Record<string, { owner: string; armies: number; missiles: number }> {
    const snap: Record<string, { owner: string; armies: number; missiles: number }> = {};
    for (const country of COUNTRIES) {
      const t = engine.territoryManager.getTerritory(country.id);
      if (t) {
        snap[country.id] = { owner: t.owner, armies: t.armies, missiles: t.missiles };
      }
    }
    return snap;
  }

  /** Write snapshot values back into the engine's TerritoryManager. */
  private syncTerritoriesFromSnapshot(
    engine: GameEngine,
    snapshot: Record<string, { owner: string; armies: number; missiles: number }>,
  ): void {
    for (const [countryId, data] of Object.entries(snapshot)) {
      const t = engine.territoryManager.getTerritory(countryId);
      if (t) {
        // TerritoryManager doesn't expose a bulk setter, so we compute deltas.
        const armiesDelta = data.armies - t.armies;
        if (armiesDelta > 0) {
          engine.territoryManager.placeArmies(countryId, armiesDelta);
        } else if (armiesDelta < 0) {
          engine.territoryManager.removeArmies(countryId, -armiesDelta);
        }
        // Missiles delta would need a similar approach if TerritoryManager
        // tracks missiles; for now missile state is managed via the snapshot.
      }
    }
  }
}
