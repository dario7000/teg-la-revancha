import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import type { PublicPlayerInfo } from '../store/gameStore';
import { useSocket } from './useSocket';

/**
 * Higher-level hook that combines Zustand store state with socket actions
 * and derives useful computed properties for the game UI.
 */
export function useGameActions() {
  const socket = useSocket();

  const playerId = useGameStore((s) => s.playerId);
  const gameState = useGameStore((s) => s.gameState);
  const connected = useGameStore((s) => s.connected);
  const roomState = useGameStore((s) => s.roomState);
  const selectedCountry = useGameStore((s) => s.selectedCountry);

  // ── Derived / computed state ──────────────────────────────────────────

  const isMyTurn = useMemo<boolean>(() => {
    if (!gameState || !playerId) return false;
    return gameState.currentPlayerId === playerId;
  }, [gameState, playerId]);

  const myPlayer = useMemo<PublicPlayerInfo | null>(() => {
    if (!gameState || !playerId) return null;
    return gameState.players.find((p) => p.id === playerId) ?? null;
  }, [gameState, playerId]);

  const canAttack = useMemo<boolean>(() => {
    if (!isMyTurn || !gameState) return false;
    return gameState.turnPhase === 'ATTACK';
  }, [isMyTurn, gameState]);

  const canRegroup = useMemo<boolean>(() => {
    if (!isMyTurn || !gameState) return false;
    return gameState.turnPhase === 'REGROUP';
  }, [isMyTurn, gameState]);

  const canReinforce = useMemo<boolean>(() => {
    if (!isMyTurn || !gameState) return false;
    return gameState.turnPhase === 'REINFORCE';
  }, [isMyTurn, gameState]);

  const canTrade = useMemo<boolean>(() => {
    if (!isMyTurn || !gameState) return false;
    return gameState.turnPhase === 'TRADE' || gameState.turnPhase === 'REINFORCE';
  }, [isMyTurn, gameState]);

  const canEndTurn = useMemo<boolean>(() => {
    if (!isMyTurn || !gameState) return false;
    // The player can end the turn during attack or regroup phases
    return (
      gameState.turnPhase === 'ATTACK' ||
      gameState.turnPhase === 'REGROUP'
    );
  }, [isMyTurn, gameState]);

  const availableReinforcements = useMemo<number>(() => {
    if (!gameState) return 0;
    return gameState.reinforcementsLeft;
  }, [gameState]);

  const isInGame = useMemo<boolean>(() => {
    return gameState !== null && gameState.phase !== 'LOBBY' && gameState.phase !== 'FINISHED';
  }, [gameState]);

  const isGameOver = useMemo<boolean>(() => {
    return gameState?.phase === 'FINISHED';
  }, [gameState]);

  const isInLobby = useMemo<boolean>(() => {
    return roomState !== null && roomState.status === 'LOBBY';
  }, [roomState]);

  const myColor = useMemo<string | undefined>(() => {
    if (!gameState || !playerId) return undefined;
    return gameState.players.find((p) => p.id === playerId)?.color;
  }, [gameState, playerId]);

  const myCountries = useMemo<string[]>(() => {
    if (!gameState || !myColor) return [];
    return Object.entries(gameState.territories)
      .filter(([, t]) => t.owner === myColor)
      .map(([id]) => id);
  }, [gameState, myColor]);

  const selectedTerritory = useMemo(() => {
    if (!gameState || !selectedCountry) return null;
    return gameState.territories[selectedCountry] ?? null;
  }, [gameState, selectedCountry]);

  const canPlaceArmies = useMemo<boolean>(() => {
    if (!isMyTurn || !gameState) return false;
    return (
      (gameState.phase === 'SETUP_DISTRIBUTE' ||
        gameState.phase === 'SETUP_PLACE_8' ||
        gameState.phase === 'SETUP_PLACE_4' ||
        gameState.turnPhase === 'REINFORCE') &&
      gameState.reinforcementsLeft > 0
    );
  }, [isMyTurn, gameState]);

  // ── Public API ────────────────────────────────────────────────────────

  return {
    // Socket actions
    ...socket,

    // Connection
    connected,

    // Computed state
    isMyTurn,
    myPlayer,
    canAttack,
    canRegroup,
    canReinforce,
    canTrade,
    canEndTurn,
    availableReinforcements,
    isInGame,
    isGameOver,
    isInLobby,
    myColor,
    myCountries,
    selectedTerritory,
    canPlaceArmies,

    // Raw state (for convenience)
    playerId,
    gameState,
    roomState,
  };
}
