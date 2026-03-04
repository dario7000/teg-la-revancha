import type { PlayerColor } from '../data/objectives';
import { GameEngine } from '../game/GameEngine';
import { CardManager } from '../game/CardManager';
import { MissileSystem } from '../game/MissileSystem';
import { SituationManager } from '../game/SituationManager';
import { ContinentCardManager } from '../game/ContinentCardManager';
import { ObjectiveChecker } from '../game/ObjectiveChecker';

// Re-export PlayerColor from shared types so consumers don't need to hunt for it
export type { PlayerColor };

export interface RoomPlayer {
  socketId: string;
  name: string;
  color: PlayerColor | null;
  ready: boolean;
}

export interface RoomSettings {
  turnTimeLimit: number;
  autoDistribute: boolean;
  enableSituationCards: boolean;
  enableMissiles: boolean;
  enablePacts: boolean;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: Map<string, RoomPlayer>;
  maxPlayers: number;
  status: 'LOBBY' | 'PLAYING' | 'FINISHED';
  gameEngine?: GameEngine;
  cardManager?: CardManager;
  missileSystem?: MissileSystem;
  situationManager?: SituationManager;
  continentCardManager?: ContinentCardManager;
  objectiveChecker?: ObjectiveChecker;
  settings: RoomSettings;
  createdAt: number;

  // Runtime game-state tracking (managed by EventRouter)
  /** Tracks the from/to of the most recent conquest awaiting a troop move. */
  pendingConquest?: { from: string; to: string };
  /** Remaining reinforcements for the current player this turn. */
  reinforcementsLeft?: number;
}

/** Tracks a disconnected player so they can reconnect within a grace period. */
export interface DisconnectedPlayer {
  roomId: string;
  playerId: string;
  playerName: string;
  color: PlayerColor | null;
  disconnectedAt: number;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

const ROOM_ID_LENGTH = 6;
const RECONNECT_WINDOW_MS = 60_000; // 60 seconds

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let id = '';
  for (let i = 0; i < ROOM_ID_LENGTH; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

const ALL_COLORS: PlayerColor[] = ['RED', 'BLUE', 'YELLOW', 'GREEN', 'BLACK', 'WHITE'];

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  /** socketId -> roomId for fast lookup */
  private socketToRoom: Map<string, string> = new Map();
  /** socketId -> playerId (the stable identifier that survives reconnects) */
  private socketToPlayer: Map<string, string> = new Map();
  /** Tracks players in the reconnect grace window. Key is playerId. */
  private disconnectedPlayers: Map<string, DisconnectedPlayer> = new Map();
  /** Called when a player's reconnect window expires. Provided by EventRouter. */
  private onPlayerExpired?: (roomId: string, playerId: string) => void;

  /**
   * Register a callback that fires when a disconnected player's
   * reconnect window expires and they are permanently removed.
   */
  setOnPlayerExpired(cb: (roomId: string, playerId: string) => void): void {
    this.onPlayerExpired = cb;
  }

  // ---------------------------------------------------------------------------
  // Room lifecycle
  // ---------------------------------------------------------------------------

  createRoom(
    hostSocketId: string,
    hostName: string,
    roomName: string,
    maxPlayers: number,
  ): Room {
    const clampedMax = Math.max(2, Math.min(6, maxPlayers));

    // Generate a unique id
    let id = generateRoomId();
    while (this.rooms.has(id)) {
      id = generateRoomId();
    }

    // The host's stable playerId is their first socketId
    const playerId = hostSocketId;

    const room: Room = {
      id,
      name: roomName,
      hostId: playerId,
      players: new Map(),
      maxPlayers: clampedMax,
      status: 'LOBBY',
      settings: {
        turnTimeLimit: 120,
        autoDistribute: true,
        enableSituationCards: true,
        enableMissiles: true,
        enablePacts: true,
      },
      createdAt: Date.now(),
    };

    room.players.set(playerId, {
      socketId: hostSocketId,
      name: hostName,
      color: ALL_COLORS[0],
      ready: false,
    });

    this.rooms.set(id, room);
    this.socketToRoom.set(hostSocketId, id);
    this.socketToPlayer.set(hostSocketId, playerId);

    return room;
  }

  joinRoom(
    roomId: string,
    socketId: string,
    playerName: string,
  ): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.status !== 'LOBBY') return null;
    if (room.players.size >= room.maxPlayers) return null;

    // Check if this is a name-based reconnection attempt during lobby
    // (in-game reconnection is handled separately via reconnectPlayer)
    const playerId = socketId;

    // Auto-assign first available color
    const takenColors = new Set<string>();
    for (const p of room.players.values()) {
      if (p.color) takenColors.add(p.color);
    }
    const autoColor = ALL_COLORS.find(c => !takenColors.has(c)) ?? null;

    room.players.set(playerId, {
      socketId,
      name: playerName,
      color: autoColor,
      ready: false,
    });

    this.socketToRoom.set(socketId, roomId);
    this.socketToPlayer.set(socketId, playerId);

    return room;
  }

  leaveRoom(roomId: string, socketId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;

    room.players.delete(playerId);
    this.socketToRoom.delete(socketId);
    this.socketToPlayer.delete(socketId);

    // If the room is now empty, remove it
    if (room.players.size === 0) {
      this.rooms.delete(roomId);
      return;
    }

    // If the host left during lobby, assign a new host
    if (room.status === 'LOBBY' && room.hostId === playerId) {
      const firstPlayer = room.players.keys().next().value as string;
      room.hostId = firstPlayer;
    }
  }

  // ---------------------------------------------------------------------------
  // Player settings (lobby)
  // ---------------------------------------------------------------------------

  setPlayerColor(
    roomId: string,
    socketId: string,
    color: PlayerColor,
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'LOBBY') return false;

    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

    // Check that no other player already has this color
    for (const [pid, p] of room.players) {
      if (pid !== playerId && p.color === color) return false;
    }

    player.color = color;
    return true;
  }

  setPlayerReady(roomId: string, socketId: string, ready: boolean): void {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'LOBBY') return;

    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;

    const player = room.players.get(playerId);
    if (player) {
      player.ready = ready;
    }
  }

  updateSettings(
    roomId: string,
    socketId: string,
    settings: Partial<RoomSettings>,
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'LOBBY') return false;

    const playerId = this.socketToPlayer.get(socketId);
    if (playerId !== room.hostId) return false;

    Object.assign(room.settings, settings);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Start game checks
  // ---------------------------------------------------------------------------

  canStartGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'LOBBY') return false;
    if (room.players.size < 2) return false;

    for (const player of room.players.values()) {
      if (!player.ready) return false;
      if (!player.color) return false;
    }

    // All players must have unique colors (enforced by setPlayerColor, but double-check)
    const colors = new Set<PlayerColor>();
    for (const player of room.players.values()) {
      if (player.color && colors.has(player.color)) return false;
      if (player.color) colors.add(player.color);
    }

    return true;
  }

  /**
   * Transition the room from LOBBY to PLAYING.
   * Returns the room if successful, null otherwise.
   */
  startGame(roomId: string, socketId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const playerId = this.socketToPlayer.get(socketId);
    if (playerId !== room.hostId) return null;
    if (!this.canStartGame(roomId)) return null;

    room.status = 'PLAYING';
    return room;
  }

  // ---------------------------------------------------------------------------
  // Lookups
  // ---------------------------------------------------------------------------

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomBySocket(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  getPlayerIdBySocket(socketId: string): string | undefined {
    return this.socketToPlayer.get(socketId);
  }

  listRooms(): Room[] {
    const result: Room[] = [];
    for (const room of this.rooms.values()) {
      if (room.status === 'LOBBY') {
        result.push(room);
      }
    }
    return result;
  }

  removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Clean up socket mappings for all players in the room
    for (const [playerId, player] of room.players) {
      this.socketToRoom.delete(player.socketId);
      this.socketToPlayer.delete(player.socketId);
    }

    // Clear any pending disconnections for this room
    for (const [pid, dc] of this.disconnectedPlayers) {
      if (dc.roomId === roomId) {
        clearTimeout(dc.timeoutHandle);
        this.disconnectedPlayers.delete(pid);
      }
    }

    this.rooms.delete(roomId);
  }

  // ---------------------------------------------------------------------------
  // Disconnect / reconnect
  // ---------------------------------------------------------------------------

  /**
   * Handle a socket disconnection. If the room is in PLAYING status the
   * player enters a reconnection window. Otherwise they are removed immediately.
   *
   * Returns info about the disconnection for the caller to broadcast.
   */
  handleDisconnect(
    socketId: string,
  ): { roomId: string; playerId: string; wasHost: boolean; removed: boolean } | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return null;

    const wasHost = room.hostId === playerId;

    if (room.status === 'PLAYING') {
      // Mark as disconnected but keep in the room for the grace period
      const player = room.players.get(playerId);
      if (!player) return null;

      // Clean socket mappings (the socket is dead)
      this.socketToRoom.delete(socketId);
      this.socketToPlayer.delete(socketId);

      const timeoutHandle = setTimeout(() => {
        this.expireDisconnectedPlayer(playerId);
      }, RECONNECT_WINDOW_MS);

      this.disconnectedPlayers.set(playerId, {
        roomId,
        playerId,
        playerName: player.name,
        color: player.color,
        disconnectedAt: Date.now(),
        timeoutHandle,
      });

      // Update the player's socketId to empty so we know they are disconnected
      player.socketId = '';

      return { roomId, playerId, wasHost, removed: false };
    }

    // In LOBBY or FINISHED: remove immediately
    this.leaveRoom(roomId, socketId);
    return { roomId, playerId, wasHost, removed: true };
  }

  /**
   * Attempt to reconnect a player who disconnected from a PLAYING room.
   * Returns the Room and playerId if successful.
   */
  reconnectPlayer(
    newSocketId: string,
    playerId: string,
  ): { room: Room; playerId: string } | null {
    const dc = this.disconnectedPlayers.get(playerId);
    if (!dc) return null;

    const room = this.rooms.get(dc.roomId);
    if (!room) return null;

    const player = room.players.get(playerId);
    if (!player) return null;

    // Cancel the expiration timeout
    clearTimeout(dc.timeoutHandle);
    this.disconnectedPlayers.delete(playerId);

    // Re-map the new socket
    player.socketId = newSocketId;
    this.socketToRoom.set(newSocketId, dc.roomId);
    this.socketToPlayer.set(newSocketId, playerId);

    return { room, playerId };
  }

  /**
   * Called when the reconnect window expires. Permanently removes the player.
   */
  private expireDisconnectedPlayer(playerId: string): void {
    const dc = this.disconnectedPlayers.get(playerId);
    if (!dc) return;

    this.disconnectedPlayers.delete(playerId);

    const room = this.rooms.get(dc.roomId);
    if (!room) return;

    room.players.delete(playerId);

    // If the room is now empty, clean it up
    if (room.players.size === 0) {
      this.rooms.delete(dc.roomId);
      return;
    }

    // Reassign host if necessary
    if (room.hostId === playerId) {
      const firstPlayer = room.players.keys().next().value as string;
      room.hostId = firstPlayer;
    }

    if (this.onPlayerExpired) {
      this.onPlayerExpired(dc.roomId, playerId);
    }
  }

  /**
   * Check whether a given playerId is currently in the disconnected-players
   * grace window (i.e. they can still reconnect).
   */
  isPlayerDisconnected(playerId: string): boolean {
    return this.disconnectedPlayers.has(playerId);
  }

  // ---------------------------------------------------------------------------
  // Serialization helpers
  // ---------------------------------------------------------------------------

  /**
   * Produce a plain-object snapshot of the room suitable for sending over
   * the wire (Maps become arrays/objects).
   */
  serializeRoom(room: Room): Record<string, unknown> {
    const players: Record<string, {
      name: string;
      color: PlayerColor | null;
      ready: boolean;
      connected: boolean;
    }> = {};

    for (const [pid, p] of room.players) {
      players[pid] = {
        name: p.name,
        color: p.color,
        ready: p.ready,
        connected: p.socketId !== '',
      };
    }

    return {
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      players,
      maxPlayers: room.maxPlayers,
      status: room.status,
      settings: { ...room.settings },
      playerCount: room.players.size,
    };
  }

  /**
   * Produce a summary list of lobbies (for the room browser).
   */
  serializeRoomList(): Record<string, unknown>[] {
    return this.listRooms().map((room) => ({
      id: room.id,
      name: room.name,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      hostName: room.players.get(room.hostId)?.name ?? 'Unknown',
    }));
  }
}
