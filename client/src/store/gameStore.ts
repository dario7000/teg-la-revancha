import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GamePhase,
  TurnPhase,
  TerritoryState,
  CountryId,
  PlayerId,
  PlayerColor,
} from '../shared/types/GameState';
import type { CountryCard, SituationCard, ContinentCardState } from '../shared/types/Cards';
import type { Pact } from '../shared/types/Pacts';
import type { Objective } from '../shared/types/Actions';
import type { ContinentId } from '../shared/types/GameState';

// ── Room types ──────────────────────────────────────────────────────────────

export interface RoomPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  ready: boolean;
}

export type RoomStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

export interface RoomSettings {
  enableSituationCards: boolean;
  enableMissiles: boolean;
  enablePacts: boolean;
  turnTimeLimit: number;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  enableSituationCards: true,
  enableMissiles: true,
  enablePacts: true,
  turnTimeLimit: 120,
};

export interface RoomState {
  id: string;
  name: string;
  hostId: string | null;
  players: RoomPlayer[];
  maxPlayers: number;
  status: RoomStatus;
  settings: RoomSettings;
}

// ── Sanitised game state (as sent by the server for this specific player) ───

export interface PublicPlayerInfo {
  id: string;
  name: string;
  color: PlayerColor;
  countryCount: number;
  cardCount: number;
  eliminated: boolean;
}

export interface ClientGameState {
  phase: GamePhase;
  turnPhase: TurnPhase;
  currentPlayerId: PlayerId;
  round: number;
  territories: Record<CountryId, TerritoryState>;
  players: PublicPlayerInfo[];
  myHand: CountryCard[];
  myObjective: Objective | null;
  activeSituationCard: SituationCard | null;
  pacts: Pact[];
  reinforcementsLeft: number;
  continentCards: Record<ContinentId, ContinentCardState> | null;
}

// ── UI types ────────────────────────────────────────────────────────────────

export interface LogEntry {
  timestamp: number;
  type: string;
  message: string;
  playerColor?: string;
  playerId?: string;
}

export interface DiceResult {
  attackerDice: number[];
  defenderDice: number[];
  attackerLosses: number;
  defenderLosses: number;
}

// ── Store interface ─────────────────────────────────────────────────────────

export interface GameStore {
  // Connection
  connected: boolean;
  playerId: string | null;
  playerName: string;

  // Room
  roomId: string | null;
  roomState: RoomState | null;

  // Game state (received from server, sanitised for this player)
  gameState: ClientGameState | null;

  // Local UI state
  selectedCountry: string | null;
  highlightedCountries: string[];
  selectedCards: Set<number>;
  gameLog: LogEntry[];
  showDiceResult: DiceResult | null;
  voiceRoomUrl: string | null;

  // Actions – connection
  setConnected: (connected: boolean) => void;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;

  // Actions – room
  setRoomId: (roomId: string | null) => void;
  setRoomState: (room: RoomState | null) => void;

  // Actions – game
  setGameState: (state: ClientGameState) => void;

  // Actions – UI
  selectCountry: (countryId: string | null) => void;
  setHighlightedCountries: (countries: string[]) => void;
  toggleCardSelection: (index: number) => void;
  clearCardSelection: () => void;
  addLogEntry: (entry: LogEntry) => void;
  showDice: (result: DiceResult) => void;
  hideDice: () => void;
  setVoiceRoomUrl: (url: string | null) => void;

  // Reset everything (e.g. on disconnect or when leaving a room)
  reset: () => void;
}

// ── Initial (default) state ─────────────────────────────────────────────────

const initialState: Pick<
  GameStore,
  | 'connected'
  | 'playerId'
  | 'roomId'
  | 'roomState'
  | 'gameState'
  | 'selectedCountry'
  | 'highlightedCountries'
  | 'selectedCards'
  | 'gameLog'
  | 'showDiceResult'
  | 'voiceRoomUrl'
> = {
  connected: false,
  playerId: null,
  roomId: null,
  roomState: null,
  gameState: null,
  selectedCountry: null,
  highlightedCountries: [],
  selectedCards: new Set<number>(),
  gameLog: [],
  showDiceResult: null,
  voiceRoomUrl: null,
};

// ── Store creation ──────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      // State
      ...initialState,
      playerName: '',

      // ── Connection actions ──────────────────────────────────────────────

      setConnected: (connected) => set({ connected }),

      setPlayerId: (id) => set({ playerId: id }),

      setPlayerName: (name) => set({ playerName: name }),

      // ── Room actions ────────────────────────────────────────────────────

      setRoomId: (roomId) => set({ roomId }),

      setRoomState: (room) =>
        set({
          roomState: room,
          roomId: room?.id ?? null,
        }),

      // ── Game actions ────────────────────────────────────────────────────

      setGameState: (state) => set({ gameState: state }),

      // ── UI actions ──────────────────────────────────────────────────────

      selectCountry: (countryId) => set({ selectedCountry: countryId }),

      setHighlightedCountries: (countries) =>
        set({ highlightedCountries: countries }),

      toggleCardSelection: (index) =>
        set((state) => {
          const next = new Set(state.selectedCards);
          if (next.has(index)) {
            next.delete(index);
          } else {
            next.add(index);
          }
          return { selectedCards: next };
        }),

      clearCardSelection: () => set({ selectedCards: new Set<number>() }),

      addLogEntry: (entry) =>
        set((state) => ({
          gameLog: [...state.gameLog, entry],
        })),

      showDice: (result) => set({ showDiceResult: result }),

      hideDice: () => set({ showDiceResult: null }),

      setVoiceRoomUrl: (url) => set({ voiceRoomUrl: url }),

      // ── Reset ───────────────────────────────────────────────────────────

      reset: () =>
        set({
          ...initialState,
          selectedCards: new Set<number>(),
        }),
    }),
    {
      name: 'teg-revancha-player',
      // Persist playerName, playerId & roomId so we can reconnect after page reload
      partialize: (state) => ({
        playerName: state.playerName,
        playerId: state.playerId,
        roomId: state.roomId,
      }),
    },
  ),
);
