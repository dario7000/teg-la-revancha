import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import type { ClientEvents, ServerEvents } from '@shared/types/Events';
import type { CombatResult } from '@shared/types/Actions';
import type { CountryId, PlayerColor, ContinentId } from '@shared/types/GameState';
import type { DiceResult, LogEntry } from '../store/gameStore';

const SERVER_URL = 'http://localhost:3001';

/**
 * Custom hook that manages a singleton Socket.io connection to the game
 * server.  It listens for server events, updates the Zustand store
 * accordingly, and exposes action functions that components can call to
 * communicate with the server.
 */
export function useSocket() {
  const socketRef = useRef<Socket<ServerEvents, ClientEvents> | null>(null);

  // ── Grab store setters (stable references) ──────────────────────────────

  const setConnected = useGameStore((s) => s.setConnected);
  const setPlayerId = useGameStore((s) => s.setPlayerId);
  const setRoomState = useGameStore((s) => s.setRoomState);
  const setGameState = useGameStore((s) => s.setGameState);
  const showDice = useGameStore((s) => s.showDice);
  const addLogEntry = useGameStore((s) => s.addLogEntry);
  const reset = useGameStore((s) => s.reset);

  // ── Socket lifecycle ────────────────────────────────────────────────────

  useEffect(() => {
    // Only create the socket once
    if (socketRef.current) return;

    const socket: Socket<ServerEvents, ClientEvents> = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // ── Connection events ───────────────────────────────────────────────

    socket.on('connect', () => {
      setConnected(true);
      if (socket.id) {
        setPlayerId(socket.id);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // ── Room / lobby events ─────────────────────────────────────────────

    // Transform server room format { players: { [id]: {...} } }
    // into client format { players: [{ id, name, color, ready }] }
    const normalizeRoom = (raw: any): any => {
      if (!raw) return null;
      const playersObj = raw.players ?? {};
      const playersArr = Array.isArray(playersObj)
        ? playersObj
        : Object.entries(playersObj).map(([id, p]: [string, any]) => ({
            id,
            name: p.name ?? 'Jugador',
            color: p.color ?? 'WHITE',
            ready: p.ready ?? false,
          }));
      return {
        id: raw.id,
        name: raw.name ?? 'Sala',
        hostId: raw.hostId ?? null,
        players: playersArr,
        maxPlayers: raw.maxPlayers ?? 6,
        status: raw.status ?? 'LOBBY',
      };
    };

    socket.on('lobby:updated', (lobby: any) => {
      setRoomState(normalizeRoom(lobby));
    });

    socket.on('room:joined' as any, (room: any) => {
      setRoomState(normalizeRoom(room));
    });

    socket.on('error', (message: string) => {
      console.error('[TEG Server Error]', message);
      addLogEntry({ timestamp: Date.now(), type: 'error', message });
    });

    (socket as any).on('game:notification', (message: string) => {
      console.log('[TEG Notification]', message);
      addLogEntry({ timestamp: Date.now(), type: 'info', message });
    });

    // ── Game state events ───────────────────────────────────────────────

    socket.on('game:fullState', (state: any) => {
      setGameState(state);
    });

    socket.on('game:update', (patch: any) => {
      // Apply partial update on top of the current game state
      const current = useGameStore.getState().gameState;
      if (current) {
        setGameState({ ...current, ...patch });
      }
    });

    // ── Combat ──────────────────────────────────────────────────────────

    socket.on('combat:result', (result: CombatResult) => {
      const diceResult: DiceResult = {
        attackerDice: result.diceResults.attacker,
        defenderDice: result.diceResults.defender,
        attackerLosses: result.attackerLosses,
        defenderLosses: result.defenderLosses,
      };
      showDice(diceResult);

      addLogEntry({
        timestamp: Date.now(),
        type: 'combat',
        message: `Combate: atacante pierde ${result.attackerLosses}, defensor pierde ${result.defenderLosses}`,
      });
    });

    socket.on('combat:conquered', (country, by, moveRange) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'conquest',
        message: `${country} fue conquistado por ${by} (mover ${moveRange[0]}-${moveRange[1]} ejercitos)`,
      });
    });

    // ── Missiles ────────────────────────────────────────────────────────

    socket.on('missile:impact', (from, target, damage) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'missile',
        message: `Misil lanzado desde ${from} impacta en ${target} (${damage} danio)`,
      });
    });

    socket.on('missile:blocked', (reason) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'missile',
        message: `Misil bloqueado: ${reason}`,
      });
    });

    // ── Cards ───────────────────────────────────────────────────────────

    socket.on('card:drawn', (card) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'card',
        message: `Carta obtenida: ${card.country}`,
      });
    });

    socket.on('card:bonusAvailable', (country) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'card',
        message: `Bonus disponible en ${country}: colocar 2 ejercitos extra`,
      });
    });

    socket.on('continentCard:acquired', (continent) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'card',
        message: `Tarjeta de continente adquirida: ${continent}`,
      });
    });

    // ── Situation cards ─────────────────────────────────────────────────

    socket.on('situation:revealed', (card) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'situation',
        message: `Carta de situacion revelada: ${card.type}`,
      });
    });

    socket.on('situation:crisisResult', (loser) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'situation',
        message: `Crisis resuelta. Perdedor: ${loser}`,
      });
    });

    socket.on('situation:extraReinforcements', (amounts) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'situation',
        message: `Refuerzos extras distribuidos`,
      });
    });

    // ── Pacts ───────────────────────────────────────────────────────────

    socket.on('pact:proposed', (pact) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'pact',
        message: `Pacto propuesto: ${pact.type}`,
      });
    });

    socket.on('pact:resolved', (pactId, accepted) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'pact',
        message: accepted ? `Pacto ${pactId} aceptado` : `Pacto ${pactId} rechazado`,
      });
    });

    socket.on('pact:broken', (pactId, by) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'pact',
        message: `Pacto ${pactId} roto por ${by}`,
      });
    });

    socket.on('condominium:created', (condo) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'pact',
        message: `Condominio creado en ${condo.country}`,
      });
    });

    socket.on('blockade:created', (blockade) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'pact',
        message: `Bloqueo creado en ${blockade.blockedCountry}`,
      });
    });

    socket.on('blockade:broken', (country) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'pact',
        message: `Bloqueo roto en ${country}`,
      });
    });

    // ── Player events ───────────────────────────────────────────────────

    socket.on('player:eliminated', (playerId, by) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'elimination',
        message: `Jugador ${playerId} eliminado por ${by}`,
      });
    });

    socket.on('player:inheritedCards', (count) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'card',
        message: `Heredaste ${count} carta(s) del jugador eliminado`,
      });
    });

    // ── Victory ─────────────────────────────────────────────────────────

    socket.on('game:victory', (winnerId, method) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'victory',
        message:
          method === 'COMMON_45'
            ? `${winnerId} gana por objetivo comun (45 paises)!`
            : `${winnerId} completa su objetivo secreto y gana!`,
      });
    });

    // ── Turn order ──────────────────────────────────────────────────────

    socket.on('turn:orderChanged', (newOrder) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'turn',
        message: `Nuevo orden de turno establecido`,
      });
    });

    // ── Chat ────────────────────────────────────────────────────────────

    socket.on('chat:message', (from, text, isDiplomacy) => {
      addLogEntry({
        timestamp: Date.now(),
        type: isDiplomacy ? 'diplomacy' : 'chat',
        message: `${from}: ${text}`,
      });
    });

    // ── Errors ──────────────────────────────────────────────────────────

    socket.on('error', (message: string) => {
      addLogEntry({
        timestamp: Date.now(),
        type: 'error',
        message: `Error: ${message}`,
      });
    });

    // ── Cleanup on unmount ──────────────────────────────────────────────

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Emit helpers (stable callbacks) ─────────────────────────────────────

  const getSocket = useCallback(() => {
    return socketRef.current;
  }, []);

  // ── Room / lobby actions ──────────────────────────────────────────────

  const createRoom = useCallback(
    (name: string, maxPlayers: number) => {
      const socket = getSocket();
      if (!socket) return;
      const playerName = useGameStore.getState().playerName;
      socket.emit('lobby:create', {
        roomName: name,
        maxPlayers,
        playerName,
      });
    },
    [getSocket],
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      const socket = getSocket();
      if (!socket) return;
      const playerName = useGameStore.getState().playerName;
      socket.emit('lobby:join' as any, roomId, playerName);
    },
    [getSocket],
  );

  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('room:leave' as any);
    useGameStore.getState().setRoomState(null);
  }, [getSocket]);

  const setColor = useCallback(
    (color: PlayerColor) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('lobby:selectColor', color);
    },
    [getSocket],
  );

  const setReady = useCallback(
    (_ready: boolean) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('lobby:ready');
    },
    [getSocket],
  );

  const startGame = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('lobby:start');
  }, [getSocket]);

  // ── Setup actions ─────────────────────────────────────────────────────

  const placeArmies = useCallback(
    (countryId: CountryId, count: number) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('setup:placeArmies', { [countryId]: count });
    },
    [getSocket],
  );

  // ── Turn actions ──────────────────────────────────────────────────────

  const reinforce = useCallback(
    (placements: Record<CountryId, number>) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('turn:reinforce', placements);
    },
    [getSocket],
  );

  const attack = useCallback(
    (from: CountryId, to: CountryId, dice?: number) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('turn:attack', from, to, dice ?? 3);
    },
    [getSocket],
  );

  const completeConquest = useCallback(
    (from: CountryId, to: CountryId, armies: number) => {
      const socket = getSocket();
      if (!socket) return;
      // The server event only takes the number of armies to move
      socket.emit('turn:conquestMove', armies);
    },
    [getSocket],
  );

  const regroup = useCallback(
    (moves: { from: CountryId; to: CountryId; armies: number }[]) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('turn:regroup', moves);
    },
    [getSocket],
  );

  const endTurn = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('turn:endTurn');
  }, [getSocket]);

  const skipToAttack = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    // Sending empty placements advances the server to ATTACK phase
    socket.emit('turn:reinforce', {});
  }, [getSocket]);

  const skipToRegroup = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('turn:skipToRegroup');
  }, [getSocket]);

  const tradeCards = useCallback(
    (cardIds: string[], continentCards?: ContinentId[]) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('turn:trade', cardIds, continentCards);
    },
    [getSocket],
  );

  const drawCard = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('turn:drawCard');
  }, [getSocket]);

  const drawContinentCard = useCallback(
    (continent: ContinentId) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('turn:drawContinentCard', continent);
    },
    [getSocket],
  );

  // ── Missile actions ───────────────────────────────────────────────────

  const fireMissile = useCallback(
    (from: CountryId, target: CountryId) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('turn:fireMissile', from, target);
    },
    [getSocket],
  );

  // ── Pact actions ──────────────────────────────────────────────────────

  const proposePact = useCallback(
    (toPlayer: string, type: string, details?: any) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('pact:propose', {
        type,
        targetPlayer: toPlayer,
        details: details ?? {},
      });
    },
    [getSocket],
  );

  const respondPact = useCallback(
    (pactId: string, accept: boolean) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('pact:respond', pactId, accept);
    },
    [getSocket],
  );

  const breakPact = useCallback(
    (pactId: string) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('pact:break', pactId);
    },
    [getSocket],
  );

  // ── Situation card actions ────────────────────────────────────────────

  const rollCrisis = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('situation:rollCrisis');
  }, [getSocket]);

  // ── Chat ──────────────────────────────────────────────────────────────

  const sendChat = useCallback(
    (text: string, isDiplomacy = false) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('chat:message', text, isDiplomacy);
    },
    [getSocket],
  );

  const listRooms = useCallback(
    (callback: (rooms: any[]) => void) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('room:list' as any, callback);
    },
    [getSocket],
  );

  // ── Public API ────────────────────────────────────────────────────────

  return {
    // Room / lobby
    createRoom,
    joinRoom,
    leaveRoom,
    listRooms,
    setColor,
    setReady,
    startGame,

    // Setup
    placeArmies,

    // Turn
    reinforce,
    attack,
    completeConquest,
    regroup,
    endTurn,
    skipToAttack,
    skipToRegroup,
    tradeCards,
    drawCard,
    drawContinentCard,

    // Missiles
    fireMissile,

    // Pacts
    proposePact,
    respondPact,
    breakPact,

    // Situation
    rollCrisis,

    // Chat
    sendChat,

    // Raw socket access (escape hatch)
    getSocket,
  };
}
