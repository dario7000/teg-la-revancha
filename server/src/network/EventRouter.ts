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
import type { CountryId } from '../data/countries';
import type { RegroupAction } from '@shared/types/Actions';
import type { PactType, PactDetails } from '@shared/types/Pacts';

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
    this.onTurnDrawContinentCard(socket);
    this.onTurnIncorporateMissile(socket);
    this.onTurnSkipToAttack(socket);
    this.onTurnSkipToRegroup(socket);
    this.onTurnEndTurn(socket);

    // ---- Pact events ----
    this.onPactPropose(socket);
    this.onPactRespond(socket);
    this.onPactBreak(socket);
    this.onAggressionAttack(socket);

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

      // Emit turn order notification so all players know who goes first
      const engine = room.gameEngine!;
      const turnOrder = engine.turnManager.getTurnOrder();
      const orderNames = turnOrder.map((pid, idx) => {
        const player = room.players.get(pid);
        return `${idx + 1}. ${player?.name ?? pid.slice(-4)}`;
      });
      this.io.to(room.id).emit('game:notification', `Orden de turno: ${orderNames.join(', ')}`);

      const firstPlayerId = turnOrder[0];
      const firstName = room.players.get(firstPlayerId)?.name ?? firstPlayerId.slice(-4);
      const phase = engine.getPhase();
      const phaseLabel = phase === 'SETUP_PLACE_18' ? 'colocacion de 18 ejercitos' : phase === 'SETUP_PLACE_8' ? 'colocacion de 8 ejercitos' : phase === 'SETUP_PLACE_4' ? 'colocacion de 4 ejercitos' : 'juego';
      this.io.to(room.id).emit('game:notification', `Turno de ${firstName} - Fase de ${phaseLabel}`);

      console.log(`[GAME START] Room ${room.id} | Turn order: ${orderNames.join(', ')} | Phase: ${phase}`);
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
      const currentPlayer = ctx.engine.turnManager.getCurrentPlayer();
      const isCurrentPlayer = this.isCurrentPlayer(ctx);
      console.log(`[SETUP] Player ${ctx.playerId} attempting placement | phase=${phase} | currentPlayer=${currentPlayer} | isCurrentPlayer=${isCurrentPlayer} | placements=${JSON.stringify(placements)}`);

      const maxArmies = phase === 'SETUP_PLACE_18' ? 18 : phase === 'SETUP_PLACE_8' ? 8 : phase === 'SETUP_PLACE_4' ? 4 : 0;
      if (maxArmies === 0) {
        console.log(`[SETUP] REJECTED: Not in a setup phase (phase=${phase})`);
        socket.emit('error', 'Not in a setup phase.');
        return;
      }

      if (!isCurrentPlayer) {
        console.log(`[SETUP] REJECTED: Not current player. ${ctx.playerId} != ${currentPlayer}`);
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
          if (phase === 'SETUP_PLACE_18') {
            // 2-player mode: single setup phase of 18 armies, then straight to PLAYING
            ctx.engine.setPhase('PLAYING');
            this.autoAdvanceSituationCard(ctx.room, ctx.engine);
            const firstPlayer = ctx.engine.turnManager.getCurrentPlayer();
            this.initReinforcementsForCurrentPlayer(ctx.room, ctx.engine, firstPlayer);
          } else if (phase === 'SETUP_PLACE_8') {
            ctx.engine.setPhase('SETUP_PLACE_4');
          } else if (phase === 'SETUP_PLACE_4') {
            ctx.engine.setPhase('PLAYING');
            // Auto-advance past SITUATION_CARD phase if needed
            this.autoAdvanceSituationCard(ctx.room, ctx.engine);
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

        // Check if this conquest is part of an active aggression pact
        const pendingAggression = ctx.room.pendingAggression;
        if (pendingAggression && to === pendingAggression.targetCountry && ctx.playerId === pendingAggression.attackerId) {
          // Mark that the attacker conquered the target — condominium will be created in conquestMove
          pendingAggression.attackerConquered = true;
        }

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

      // Allow the current player OR the ally of a pending aggression to complete conquest
      const isAllyConquest = ctx.room.pendingAggression?.allyId === ctx.playerId
        && ctx.room.pendingAggression?.attackerConquered;

      if (!this.isCurrentPlayer(ctx) && !isAllyConquest) {
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

      // Capture defender info before conquest (to detect elimination)
      const toTerritory = ctx.engine.territoryManager.getTerritory(to);
      const previousOwner = toTerritory?.owner;
      const previousOwnerData = previousOwner ? ctx.engine.getPlayer(previousOwner) : undefined;
      const previousOwnerCardCount = previousOwnerData ? previousOwnerData.hand.length : 0;

      // Use the GameEngine's completeConquest to validate and execute
      const success = ctx.engine.completeConquest(from, to, armies);
      if (!success) {
        socket.emit('error', 'Invalid conquest move. Armies must be between 1 and 3, and you must leave at least 1 army behind.');
        return;
      }

      // Clear the pending conquest
      ctx.room.pendingConquest = undefined;

      // If this was an aggression pact conquest, create a condominium
      const pendingAggression = ctx.room.pendingAggression;
      if (pendingAggression && pendingAggression.attackerConquered && to === pendingAggression.targetCountry) {
        try {
          // Create condominium: both pact partners share the territory
          // The conquering player already moved armies in via completeConquest;
          // split those armies between both partners.
          const territory = ctx.engine.territoryManager.getTerritory(to);
          const totalArmies = territory ? territory.armies : armies;
          ctx.engine.createCondominium(
            to,
            pendingAggression.attackerId,
            pendingAggression.allyId,
            totalArmies,
          );
          this.io.to(ctx.room.id).emit('pact:condominiumCreated', to, [pendingAggression.attackerId, pendingAggression.allyId]);
        } catch (err: any) {
          // Non-fatal: log but don't block the conquest
          this.io.to(ctx.room.id).emit('game:notification', `Condominium creation failed: ${err.message}`);
        }
        // Clear the pending aggression
        ctx.room.pendingAggression = undefined;
      }

      // Check if the previous owner was eliminated by this conquest
      if (previousOwner && previousOwner !== ctx.playerId) {
        const defenderAfter = ctx.engine.getPlayer(previousOwner);
        if (defenderAfter?.eliminated) {
          this.io.to(ctx.room.id).emit('player:eliminated', previousOwner, ctx.playerId);
          this.io.to(ctx.room.id).emit('game:notification', `${defenderAfter.name} has been eliminated!`);

          // Notify the eliminator about inherited cards
          if (previousOwnerCardCount > 0) {
            socket.emit('player:inheritedCards', previousOwnerCardCount);
          }
        }
      }

      // Check victory for ALL players after conquest completion.
      // A conquest by player A could fulfill player B's DESTRUCTION objective.
      const victory = ctx.engine.checkAllVictory();
      if (victory && victory.won && victory.playerId) {
        ctx.engine.setPhase('FINISHED');
        ctx.room.status = 'FINISHED';
        const winnerPlayer = ctx.engine.getPlayer(victory.playerId);
        const winnerName = winnerPlayer?.name ?? 'Desconocido';
        this.io.to(ctx.room.id).emit('game:victory', victory.playerId, victory.method as 'OBJECTIVE' | 'COMMON_45', winnerName);
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

      // Missiles can only be launched during ATTACK phase
      if (ctx.engine.turnManager.getTurnPhase() !== 'ATTACK') {
        socket.emit('error', 'Missiles can only be launched during the attack phase.');
        return;
      }

      if (!ctx.room.missileSystem) {
        socket.emit('error', 'Missiles are not enabled.');
        return;
      }

      // Validate the player owns the source country
      const fromTerritory = ctx.engine.territoryManager.getTerritory(from);
      if (!fromTerritory || fromTerritory.owner !== ctx.playerId) {
        socket.emit('error', 'You do not own the source country.');
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

      // Use engine.drawCard which validates conquest requirements, once-per-turn
      // guard, CRISIS restrictions, and adds the card to the player's hand.
      const card = ctx.engine.drawCard(ctx.playerId);
      if (!card) {
        socket.emit('error', 'Cannot draw a card right now.');
        return;
      }

      // Send the drawn card only to the requesting player
      socket.emit('card:drawn', card);

      // Check card-country bonus: +3 armies if the drawn card matches an owned country
      const playerCountries = this.getPlayerCountries(ctx.engine, ctx.playerId);
      const bonuses = ctx.engine.cardManager.checkCardCountryBonus([card], playerCountries);
      for (const bonus of bonuses) {
        ctx.engine.territoryManager.placeArmies(bonus.country, 3);
        socket.emit('card:bonusAvailable', bonus.country);
      }

      this.broadcastGameState(ctx.room.id);
    });
  }

  private onTurnDrawContinentCard(socket: Socket): void {
    socket.on('turn:drawContinentCard', (continent: string) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      const turnPhase = ctx.engine.turnManager.getTurnPhase();
      if (turnPhase !== 'DRAW_CONTINENT_CARD') {
        socket.emit('error', 'Not in the DRAW_CONTINENT_CARD phase.');
        return;
      }

      const result = ctx.engine.checkContinentCards(ctx.playerId);

      for (const award of result.awarded) {
        this.io.to(ctx.room.id).emit('continentCard:acquired', award.continent);
        this.io.to(ctx.room.id).emit('game:notification',
          `${ctx.engine.getPlayer(ctx.playerId)?.name ?? ctx.playerId} acquired continent card for ${award.continent}`);
      }

      // Advance the turn (DRAW_CONTINENT_CARD is the last phase)
      const turnResult = ctx.engine.endTurn();
      this.io.to(ctx.room.id).emit('game:notification', `Turn ended. Next player: ${turnResult.nextPlayer}`);

      if (turnResult.newRound) {
        this.io.to(ctx.room.id).emit('turn:orderChanged', ctx.engine.turnManager.getTurnOrder());
      }

      if (ctx.engine.getPhase() === 'PLAYING') {
        // Auto-advance past SITUATION_CARD phase if needed
        this.autoAdvanceSituationCard(ctx.room, ctx.engine);
        this.initReinforcementsForCurrentPlayer(ctx.room, ctx.engine, turnResult.nextPlayer);
      } else {
        ctx.room.reinforcementsLeft = undefined;
      }

      this.broadcastGameState(ctx.room.id);
    });
  }

  private onTurnIncorporateMissile(socket: Socket): void {
    socket.on('turn:incorporateMissile', (countryId: string) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      const success = ctx.engine.incorporateMissile(ctx.playerId, countryId);
      if (!success) {
        socket.emit('error', 'Cannot incorporate missile. Country must have at least 7 armies and belong to you.');
        return;
      }

      this.io.to(ctx.room.id).emit('game:notification',
        `${ctx.engine.getPlayer(ctx.playerId)?.name ?? ctx.playerId} incorporated a missile at ${countryId}`);

      this.broadcastGameState(ctx.room.id);
    });
  }

  private onTurnSkipToAttack(socket: Socket): void {
    socket.on('turn:skipToAttack', () => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      if (!this.isCurrentPlayer(ctx)) {
        socket.emit('error', 'It is not your turn.');
        return;
      }

      if (ctx.engine.getPhase() !== 'PLAYING') {
        socket.emit('error', 'Cannot skip to attack during setup phase.');
        return;
      }

      const currentPhase = ctx.engine.turnManager.getTurnPhase();
      if (currentPhase !== 'REINFORCE') {
        socket.emit('error', 'Can only skip to attack during reinforce phase.');
        return;
      }

      // Allow skipping even if reinforcements remain (player chooses to skip)
      ctx.room.reinforcementsLeft = 0;
      ctx.engine.turnManager.setTurnPhase('ATTACK');
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

      // Reject endTurn during setup phases — setup turn advancement is handled by onSetupPlaceArmies
      if (ctx.engine.getPhase() !== 'PLAYING') {
        socket.emit('error', 'Cannot end turn during setup phase.');
        return;
      }

      // Clear pending conquest and aggression pact if any
      ctx.room.pendingConquest = undefined;
      ctx.room.pendingAggression = undefined;

      const turnResult = ctx.engine.endTurn();
      this.io.to(ctx.room.id).emit('game:notification', `Turn ended. Next player: ${turnResult.nextPlayer}`);

      if (turnResult.newRound) {
        this.io.to(ctx.room.id).emit('turn:orderChanged', ctx.engine.turnManager.getTurnOrder());
      }

      // Initialize reinforcements for the next player's turn
      if (ctx.engine.getPhase() === 'PLAYING') {
        // Auto-advance past SITUATION_CARD phase if needed
        this.autoAdvanceSituationCard(ctx.room, ctx.engine);
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
    socket.on('pact:propose', (pact: { type: string; targetPlayer: string; details?: PactDetails }) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      // Send the proposal to the target player
      const targetPlayerEntry = ctx.room.players.get(pact.targetPlayer);
      if (!targetPlayerEntry || targetPlayerEntry.socketId === '') {
        socket.emit('error', 'Target player is not connected.');
        return;
      }

      // Register the pact proposal in PactSystem (creates it as inactive)
      let pactId: string;
      try {
        pactId = ctx.engine.proposePact(
          ctx.playerId,
          pact.targetPlayer,
          pact.type as PactType,
          pact.details,
        );
      } catch (err: any) {
        socket.emit('error', err.message ?? 'Failed to propose pact.');
        return;
      }

      const proposal = {
        id: pactId,
        from: ctx.playerId,
        type: pact.type,
        targetPlayer: pact.targetPlayer,
        details: pact.details,
      };

      this.io.to(targetPlayerEntry.socketId).emit('pact:proposed', proposal);
      socket.emit('game:notification', 'Pact proposal sent.');
    });
  }

  private onPactRespond(socket: Socket): void {
    socket.on('pact:respond', (pactId: string, accept: boolean) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      // Retrieve the pact BEFORE responding so we can inspect its type
      const pact = ctx.engine.pactSystem.getPact(pactId);
      if (!pact) {
        socket.emit('error', 'Pact not found.');
        return;
      }

      // Register acceptance or rejection in PactSystem
      try {
        ctx.engine.respondPact(pactId, ctx.playerId, accept);
      } catch (err: any) {
        socket.emit('error', err.message ?? 'Failed to respond to pact.');
        return;
      }

      this.io.to(ctx.room.id).emit('pact:resolved', pactId, accept);

      // --- Wire special pact types on acceptance ---
      if (accept) {
        if (pact.details.type === 'INTERNATIONAL_ZONE') {
          // Validate: both players must be adjacent to the target country, target must have 1 army
          const targetCountry = pact.details.country;
          const territory = ctx.engine.territoryManager.getTerritory(targetCountry);
          const adj = ADJACENCY[targetCountry as CountryId] ?? [];
          const player1Countries = ctx.engine.territoryManager.getPlayerCountries(pact.players[0]);
          const player2Countries = ctx.engine.territoryManager.getPlayerCountries(pact.players[1]);
          const p1Adjacent = adj.some((c: string) => player1Countries.includes(c));
          const p2Adjacent = adj.some((c: string) => player2Countries.includes(c));

          if (!p1Adjacent || !p2Adjacent) {
            socket.emit('error', 'Both players must be adjacent to the target country for an international zone.');
          } else if (!territory || territory.armies > 1) {
            socket.emit('error', 'International zone target must have exactly 1 army.');
          } else {
            try {
              ctx.engine.createInternationalZone(targetCountry, pact.players[0], pact.players[1]);
              this.io.to(ctx.room.id).emit('pact:internationalZoneCreated', targetCountry, pact.players);
            } catch (err: any) {
              socket.emit('error', err.message ?? 'Failed to create international zone.');
            }
          }
        }

        if (pact.details.type === 'AGGRESSION_PACT') {
          // Set up pending aggression so the ally can participate in attacks on the target
          const targetCountry = pact.details.target;
          const attackerId = pact.details.duringTurnOf;
          const allyId = pact.players[0] === attackerId ? pact.players[1] : pact.players[0];

          ctx.room.pendingAggression = {
            pactId,
            targetCountry,
            attackerId,
            allyId,
            attackerConquered: false,
          };

          this.io.to(ctx.room.id).emit('pact:aggressionActive', {
            pactId,
            targetCountry,
            attackerId,
            allyId,
          });
        }
      }

      this.broadcastGameState(ctx.room.id);
    });
  }

  private onPactBreak(socket: Socket): void {
    socket.on('pact:break', (pactId: string) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      // Break the pact in PactSystem
      try {
        ctx.engine.breakPact(pactId, ctx.playerId);
      } catch (err: any) {
        socket.emit('error', err.message ?? 'Failed to break pact.');
        return;
      }

      this.io.to(ctx.room.id).emit('pact:broken', pactId, ctx.playerId);
      this.broadcastGameState(ctx.room.id);
    });
  }

  // ===========================================================================
  // AGGRESSION PACT — ally cooperative attack
  // ===========================================================================

  private onAggressionAttack(socket: Socket): void {
    socket.on('pact:aggressionAttack', (from: string, dice: number) => {
      const ctx = this.getGameContext(socket);
      if (!ctx) return;

      const pending = ctx.room.pendingAggression;
      if (!pending) {
        socket.emit('error', 'No active aggression pact.');
        return;
      }

      // Only the ally can use this event
      if (ctx.playerId !== pending.allyId) {
        socket.emit('error', 'Only the pact ally can use aggression attack.');
        return;
      }

      // Must be during the attacker's turn and in ATTACK phase
      const currentPlayer = ctx.engine.turnManager.getCurrentPlayer();
      if (currentPlayer !== pending.attackerId) {
        socket.emit('error', 'Aggression attack is only valid during the pact attacker\'s turn.');
        return;
      }

      if (ctx.engine.turnManager.getTurnPhase() !== 'ATTACK') {
        socket.emit('error', 'Aggression attacks can only happen during the attack phase.');
        return;
      }

      if (ctx.engine.getPhase() !== 'PLAYING') {
        socket.emit('error', 'Game is not in the PLAYING phase.');
        return;
      }

      const targetCountry = pending.targetCountry;

      // Determine situation combat modifier
      const situationEffect = ctx.room.situationManager
        ? ctx.room.situationManager.getCombatModifier()
        : 'NONE' as const;

      const result = ctx.engine.executeAllyAttack(
        ctx.playerId,
        from,
        targetCountry,
        ADJACENCY,
        dice,
        situationEffect,
      );

      if (!result.success) {
        socket.emit('error', result.error ?? 'Aggression attack failed.');
        return;
      }

      // Broadcast combat result
      this.io.to(ctx.room.id).emit('combat:result', result.result);

      // If conquered, store pending conquest with condominium flag
      if (result.result?.conquered) {
        ctx.room.pendingConquest = { from, to: targetCountry };
        // Mark that this conquest creates a condominium
        pending.attackerConquered = true;

        const attackerTerritory = ctx.engine.territoryManager.getTerritory(from);
        const armiesAvailable = attackerTerritory ? attackerTerritory.armies - 1 : 1;
        const minMove = Math.min(dice, armiesAvailable);
        const maxMove = Math.min(armiesAvailable, 3);
        this.io.to(ctx.room.id).emit('combat:conquered', targetCountry, ctx.playerId, [minMove, Math.max(minMove, maxMove)]);
      }

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
      (sanitised as any).yourPlayerId = playerId;
      this.io.to(player.socketId).emit('game:fullState', sanitised);
    }
  }

  /** Send game state to a single socket (used for reconnection). */
  private sendGameStateToSocket(room: Room, playerId: string, socket: Socket): void {
    if (!room.gameEngine) return;
    const sanitised = this.sanitizeStateForPlayer(room, playerId);
    (sanitised as any).yourPlayerId = playerId;
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
   *   activeSituationCard, pacts, condominiums, internationalZones,
   *   pendingAggression, reinforcementsLeft
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
        // Support both single objective (legacy) and multiple objectives (2-3 player rules)
        myObjective = playerData.objectives ?? null;
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
    const phase = engine.getPhase();
    if (currentPlayer === playerId) {
      if (room.reinforcementsLeft !== undefined && room.reinforcementsLeft !== null) {
        reinforcementsLeft = room.reinforcementsLeft;
      } else if (phase === 'SETUP_PLACE_18') {
        reinforcementsLeft = 18;
      } else if (phase === 'SETUP_PLACE_8') {
        reinforcementsLeft = 8;
      } else if (phase === 'SETUP_PLACE_4') {
        reinforcementsLeft = 4;
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
      condominiums: pactState.condominiums,
      internationalZones: pactState.internationalZones,
      pendingAggression: room.pendingAggression
        ? {
            pactId: room.pendingAggression.pactId,
            targetCountry: room.pendingAggression.targetCountry,
            attackerId: room.pendingAggression.attackerId,
            allyId: room.pendingAggression.allyId,
          }
        : null,
      reinforcementsLeft,
      continentCards: engine.continentCardManager.getAllCards(),
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
   * Auto-advance past the SITUATION_CARD turn phase.
   *
   * When a new turn starts in PLAYING phase, the TurnManager may set
   * turnPhase to SITUATION_CARD (for the first player of each round).
   * This method draws a situation card (if enabled) and advances the
   * turnPhase to REINFORCE so the game doesn't get stuck.
   *
   * Does NOT broadcast — the caller is responsible for that.
   */
  private autoAdvanceSituationCard(room: Room, engine: GameEngine): void {
    // Only advance during the PLAYING phase — during SETUP phases this must be a no-op
    if (engine.getPhase() !== 'PLAYING') return;
    if (engine.turnManager.getTurnPhase() !== 'SITUATION_CARD') return;

    // Draw a situation card if situation cards are enabled
    if (room.situationManager) {
      const activePlayers = engine.getActivePlayers().map(p => ({ id: p.id, color: p.color }));
      const card = room.situationManager.revealCard(activePlayers);

      if (card) {
        console.log(`[SITUATION] Drew card: ${card.type} - ${card.description}`);
        this.io.to(room.id).emit('game:notification',
          `Carta de Situacion: ${card.type} - ${card.description}`);
      }
    }

    // Advance past SITUATION_CARD to REINFORCE
    engine.turnManager.setTurnPhase('REINFORCE');
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

    // Add extra reinforcements if REFUERZOS_EXTRAS situation card is active
    let extraSituation = 0;
    if (room.situationManager && room.situationManager.isExtraReinforcements()) {
      extraSituation = engine.reinforcement.calcExtraReinforcements(playerCountries.length);
    }

    room.reinforcementsLeft = calc.total + extraSituation;
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
        // Sync armies delta
        const armiesDelta = data.armies - t.armies;
        if (armiesDelta > 0) {
          engine.territoryManager.placeArmies(countryId, armiesDelta);
        } else if (armiesDelta < 0) {
          engine.territoryManager.removeArmies(countryId, -armiesDelta);
        }
        // Sync missiles delta directly on the territory state
        if (t.missiles !== data.missiles) {
          t.missiles = data.missiles;
        }
      }
    }
  }
}
