import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import { useGameActions } from './hooks/useGameActions';
import {
  NameInput,
  CreateRoom,
  RoomList,
  WaitingRoom,
} from './components/Lobby';
import { GameMap } from './components/Map';
import {
  DiceRoller,
  CardHand,
  TurnControls,
  GameLog,
} from './components/UI';
import {
  VictoryModal,
  ObjectiveModal,
  SituationCardModal,
} from './components/Modals';
import { PactResponseModal } from './components/Modals';
import type { PlayerColor } from '@shared/types/GameState';

// ============================================================
// Client-side adjacency map (mirrors server/src/data/adjacency.ts)
// ============================================================

const ADJACENCY: Record<string, string[]> = {
  // AMERICA DEL NORTE (12)
  ALASKA: ['ISLA_VICTORIA', 'CANADA', 'OREGON', 'CHUKCHI'],
  ISLA_VICTORIA: ['ALASKA', 'GROENLANDIA', 'CANADA'],
  GROENLANDIA: ['ISLA_VICTORIA', 'LABRADOR', 'ISLANDIA'],
  LABRADOR: ['GROENLANDIA', 'CANADA', 'TERRANOVA'],
  CANADA: ['ALASKA', 'ISLA_VICTORIA', 'LABRADOR', 'OREGON', 'NUEVA_YORK', 'CHICAGO'],
  TERRANOVA: ['LABRADOR', 'NUEVA_YORK'],
  NUEVA_YORK: ['CANADA', 'TERRANOVA', 'CHICAGO', 'FLORIDA'],
  OREGON: ['ALASKA', 'CANADA', 'CHICAGO', 'LAS_VEGAS', 'CALIFORNIA'],
  CHICAGO: ['CANADA', 'NUEVA_YORK', 'OREGON', 'LAS_VEGAS', 'FLORIDA'],
  LAS_VEGAS: ['OREGON', 'CHICAGO', 'CALIFORNIA'],
  FLORIDA: ['NUEVA_YORK', 'CHICAGO', 'CALIFORNIA', 'MEXICO'],
  CALIFORNIA: ['OREGON', 'LAS_VEGAS', 'FLORIDA', 'MEXICO'],

  // AMERICA CENTRAL (6)
  MEXICO: ['CALIFORNIA', 'FLORIDA', 'CUBA', 'HONDURAS'],
  CUBA: ['MEXICO', 'JAMAICA', 'HONDURAS', 'EL_SALVADOR'],
  JAMAICA: ['CUBA', 'NICARAGUA', 'HONDURAS'],
  HONDURAS: ['MEXICO', 'CUBA', 'JAMAICA', 'EL_SALVADOR', 'NICARAGUA'],
  EL_SALVADOR: ['CUBA', 'HONDURAS', 'NICARAGUA'],
  NICARAGUA: ['JAMAICA', 'HONDURAS', 'EL_SALVADOR', 'COLOMBIA', 'VENEZUELA'],

  // AMERICA DEL SUR (8)
  VENEZUELA: ['NICARAGUA', 'COLOMBIA', 'BRASIL'],
  COLOMBIA: ['NICARAGUA', 'VENEZUELA', 'BRASIL', 'BOLIVIA', 'CHILE'],
  BRASIL: ['VENEZUELA', 'COLOMBIA', 'BOLIVIA', 'PARAGUAY', 'ARGENTINA', 'URUGUAY', 'SAHARA', 'NIGERIA'],
  BOLIVIA: ['COLOMBIA', 'BRASIL', 'PARAGUAY', 'ARGENTINA', 'CHILE'],
  PARAGUAY: ['BRASIL', 'BOLIVIA', 'ARGENTINA', 'URUGUAY'],
  ARGENTINA: ['COLOMBIA', 'BRASIL', 'BOLIVIA', 'PARAGUAY', 'CHILE', 'URUGUAY'],
  CHILE: ['COLOMBIA', 'BOLIVIA', 'ARGENTINA', 'AUSTRALIA'],
  URUGUAY: ['BRASIL', 'PARAGUAY', 'ARGENTINA', 'MAURITANIA'],

  // EUROPA (16)
  ISLANDIA: ['GROENLANDIA', 'IRLANDA', 'GRAN_BRETAÑA', 'NORUEGA'],
  IRLANDA: ['ISLANDIA', 'GRAN_BRETAÑA'],
  'GRAN_BRETAÑA': ['ISLANDIA', 'IRLANDA', 'NORUEGA', 'FRANCIA', 'ALEMANIA'],
  NORUEGA: ['ISLANDIA', 'GRAN_BRETAÑA', 'FINLANDIA', 'ALEMANIA', 'POLONIA'],
  FINLANDIA: ['NORUEGA', 'SIBERIA', 'BIELORRUSIA', 'POLONIA'],
  BIELORRUSIA: ['FINLANDIA', 'UCRANIA', 'POLONIA'],
  UCRANIA: ['BIELORRUSIA', 'RUSIA', 'CHECHENIA', 'POLONIA', 'SERBIA', 'CROACIA'],
  POLONIA: ['NORUEGA', 'FINLANDIA', 'BIELORRUSIA', 'UCRANIA', 'ALEMANIA', 'SERBIA', 'CROACIA'],
  ALBANIA: ['SERBIA', 'CROACIA', 'ITALIA', 'FRANCIA', 'ESPAÑA'],
  ALEMANIA: ['GRAN_BRETAÑA', 'NORUEGA', 'POLONIA', 'CROACIA', 'ITALIA', 'FRANCIA'],
  SERBIA: ['UCRANIA', 'POLONIA', 'ALBANIA', 'CROACIA', 'TURQUIA'],
  CROACIA: ['UCRANIA', 'POLONIA', 'ALBANIA', 'ALEMANIA', 'SERBIA', 'ITALIA'],
  ITALIA: ['ALBANIA', 'ALEMANIA', 'CROACIA', 'FRANCIA'],
  FRANCIA: ['GRAN_BRETAÑA', 'ALBANIA', 'ALEMANIA', 'ITALIA', 'ESPAÑA'],
  'ESPAÑA': ['ALBANIA', 'FRANCIA', 'PORTUGAL', 'SAHARA'],
  PORTUGAL: ['ESPAÑA', 'SAHARA'],

  // ASIA (16)
  SIBERIA: ['FINLANDIA', 'CHECHENIA', 'RUSIA', 'CHINA', 'CHUKCHI'],
  CHECHENIA: ['SIBERIA', 'RUSIA', 'UCRANIA', 'IRAN', 'TURQUIA'],
  RUSIA: ['SIBERIA', 'CHECHENIA', 'CHINA', 'UCRANIA'],
  CHINA: ['SIBERIA', 'RUSIA', 'CHUKCHI', 'KAMCHATKA', 'COREA', 'INDIA', 'VIETNAM'],
  CHUKCHI: ['SIBERIA', 'CHINA', 'KAMCHATKA', 'ALASKA'],
  KAMCHATKA: ['CHINA', 'CHUKCHI', 'JAPON', 'COREA'],
  JAPON: ['KAMCHATKA', 'COREA'],
  COREA: ['CHINA', 'KAMCHATKA', 'JAPON', 'VIETNAM'],
  IRAN: ['CHECHENIA', 'IRAK', 'TURQUIA', 'INDIA'],
  IRAK: ['IRAN', 'TURQUIA', 'ISRAEL', 'ARABIA'],
  ISRAEL: ['IRAK', 'TURQUIA', 'ARABIA', 'EGIPTO'],
  TURQUIA: ['CHECHENIA', 'IRAN', 'IRAK', 'ISRAEL', 'SERBIA', 'EGIPTO'],
  ARABIA: ['IRAK', 'ISRAEL', 'INDIA'],
  INDIA: ['CHINA', 'IRAN', 'ARABIA', 'VIETNAM', 'MALASIA'],
  VIETNAM: ['CHINA', 'COREA', 'INDIA', 'MALASIA'],
  MALASIA: ['INDIA', 'VIETNAM', 'SUMATRA', 'FILIPINAS'],

  // AFRICA (8)
  SAHARA: ['BRASIL', 'ESPAÑA', 'PORTUGAL', 'EGIPTO', 'ETIOPIA', 'NIGERIA', 'MAURITANIA'],
  EGIPTO: ['SAHARA', 'TURQUIA', 'ISRAEL', 'ETIOPIA'],
  ETIOPIA: ['SAHARA', 'EGIPTO', 'NIGERIA', 'ANGOLA', 'MADAGASCAR'],
  NIGERIA: ['SAHARA', 'BRASIL', 'ETIOPIA', 'ANGOLA', 'MAURITANIA'],
  ANGOLA: ['ETIOPIA', 'NIGERIA', 'MAURITANIA', 'SUDAFRICA', 'MADAGASCAR'],
  MAURITANIA: ['URUGUAY', 'SAHARA', 'NIGERIA', 'ANGOLA', 'SUDAFRICA'],
  SUDAFRICA: ['ANGOLA', 'MAURITANIA', 'MADAGASCAR'],
  MADAGASCAR: ['ETIOPIA', 'ANGOLA', 'SUDAFRICA'],

  // OCEANIA (6)
  SUMATRA: ['MALASIA', 'FILIPINAS', 'AUSTRALIA'],
  FILIPINAS: ['MALASIA', 'SUMATRA', 'TONGA'],
  TONGA: ['FILIPINAS', 'AUSTRALIA'],
  AUSTRALIA: ['SUMATRA', 'TONGA', 'TASMANIA', 'CHILE'],
  TASMANIA: ['AUSTRALIA', 'NUEVA_ZELANDA'],
  NUEVA_ZELANDA: ['TASMANIA'],
};

/** Returns all adjacent country IDs (including sea bridges). */
function getAdjacentCountries(countryId: string): string[] {
  return ADJACENCY[countryId] ?? [];
}

/** Check if two countries are adjacent. */
function areAdjacent(a: string, b: string): boolean {
  const neighbors = ADJACENCY[a];
  if (!neighbors) return false;
  return neighbors.includes(b);
}

// ============================================================
// Sub-view type for the pre-game flow
// ============================================================

type LobbyView = 'rooms' | 'create';

// ============================================================
// Conquest pending state
// ============================================================

interface ConquestPending {
  from: string;
  to: string;
  minArmies: number;
  maxArmies: number;
}

// ============================================================
// App
// ============================================================

function App() {
  // -- Socket hook (creates and manages the connection) --------
  const socket = useSocket();

  // -- Derived / computed helpers ------------------------------
  const actions = useGameActions();

  // -- Store selectors -----------------------------------------
  const connected = useGameStore((s) => s.connected);
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const playerId = useGameStore((s) => s.playerId);
  const roomState = useGameStore((s) => s.roomState);
  const gameState = useGameStore((s) => s.gameState);
  const selectedCountry = useGameStore((s) => s.selectedCountry);
  const selectCountry = useGameStore((s) => s.selectCountry);
  const setHighlightedCountries = useGameStore((s) => s.setHighlightedCountries);
  const highlightedCountries = useGameStore((s) => s.highlightedCountries);
  const selectedCards = useGameStore((s) => s.selectedCards);
  const toggleCardSelection = useGameStore((s) => s.toggleCardSelection);
  const gameLog = useGameStore((s) => s.gameLog);
  const showDiceResult = useGameStore((s) => s.showDiceResult);
  const hideDice = useGameStore((s) => s.hideDice);

  // -- Local UI state ------------------------------------------
  const [lobbyView, setLobbyView] = useState<LobbyView>('rooms');
  const [rooms, setRooms] = useState<
    { id: string; name: string; playerCount: number; maxPlayers: number; status: 'LOBBY' | 'PLAYING' | 'FINISHED' }[]
  >([]);
  const [showObjective, setShowObjective] = useState(false);
  const [showSituationCard, setShowSituationCard] = useState(false);
  const [pendingPact, setPendingPact] = useState<{
    pactId: string;
    fromPlayerName: string;
    pactType: string;
    description: string;
    countryName?: string;
  } | null>(null);
  const [victoryInfo, setVictoryInfo] = useState<{
    winnerName: string;
    winnerColor: string;
    objectiveDescription: string;
    isMe: boolean;
  } | null>(null);

  // -- Game interaction state ----------------------------------
  const [attackSource, setAttackSource] = useState<string | null>(null);
  const [regroupSource, setRegroupSource] = useState<string | null>(null);
  const [conquestPending, setConquestPending] = useState<ConquestPending | null>(null);
  const [conquestArmies, setConquestArmies] = useState<number>(1);
  // Track accumulated reinforcement placements before sending to server
  const [reinforcePlacements, setReinforcePlacements] = useState<Record<string, number>>({});
  const [reinforcementsSpent, setReinforcementsSpent] = useState(0);
  // Ref to hold current attackSource for the conquest callback
  const attackSourceRef = useRef<string | null>(null);
  attackSourceRef.current = attackSource;

  // Track previous situation card so we can auto-show when a new one appears
  const prevSituationCardRef = useRef(gameState?.activeSituationCard ?? null);

  // -- Computed values -----------------------------------------
  const isMyTurn = useMemo(() => {
    if (!gameState || !playerId) return false;
    return gameState.currentPlayerId === playerId;
  }, [gameState, playerId]);

  const myTerritoryIds = useMemo(() => {
    if (!gameState || !playerId) return new Set<string>();
    const ids = new Set<string>();
    for (const [id, t] of Object.entries(gameState.territories)) {
      if (t.owner === playerId) {
        ids.add(id);
      }
    }
    return ids;
  }, [gameState, playerId]);

  const effectiveReinforcementsLeft = useMemo(() => {
    if (!gameState) return 0;
    return gameState.reinforcementsLeft - reinforcementsSpent;
  }, [gameState, reinforcementsSpent]);

  // -- Listen for combat:conquered events ----------------------
  useEffect(() => {
    const rawSocket = socket.getSocket();
    if (!rawSocket) return;

    const handleConquered = (country: string, by: string, moveRange: [number, number]) => {
      // Only show conquest UI to the conquering player
      if (by === playerId) {
        const source = attackSourceRef.current ?? '';
        setConquestPending({
          from: source,
          to: country,
          minArmies: moveRange[0],
          maxArmies: moveRange[1],
        });
        setConquestArmies(moveRange[0]);
      }
    };

    rawSocket.on('combat:conquered', handleConquered);
    return () => {
      rawSocket.off('combat:conquered', handleConquered);
    };
  }, [socket, playerId]);

  // -- Reset interaction state on phase/turn changes -----------
  useEffect(() => {
    setAttackSource(null);
    setRegroupSource(null);
    selectCountry(null);
    setReinforcePlacements({});
    setReinforcementsSpent(0);
    // Don't clear conquestPending - it persists across state updates
  }, [gameState?.turnPhase, gameState?.currentPlayerId, selectCountry]);

  // -- Auto-show situation card when a new one is revealed -----
  useEffect(() => {
    const current = gameState?.activeSituationCard ?? null;
    const prev = prevSituationCardRef.current;
    if (current && current !== prev) {
      setShowSituationCard(true);
    }
    prevSituationCardRef.current = current;
  }, [gameState?.activeSituationCard]);

  // -- Auto-hide dice after 3 seconds --------------------------
  useEffect(() => {
    if (!showDiceResult) return;
    const timer = setTimeout(() => {
      hideDice();
    }, 3000);
    return () => clearTimeout(timer);
  }, [showDiceResult, hideDice]);

  // -- Auto-show victory modal ---------------------------------
  useEffect(() => {
    if (gameState?.phase === 'FINISHED' && !victoryInfo) {
      const victoryLog = gameLog.find((e) => e.type === 'victory');
      const winnerPlayer = gameState.players.find(
        (p) => !p.eliminated,
      );
      setVictoryInfo({
        winnerName: winnerPlayer?.name ?? 'Desconocido',
        winnerColor: winnerPlayer?.color ?? 'WHITE',
        objectiveDescription:
          victoryLog?.message ?? 'Objetivo completado',
        isMe: winnerPlayer?.id === playerId,
      });
    }
  }, [gameState?.phase, gameState?.players, victoryInfo, gameLog, playerId]);

  // -- Keyboard shortcuts --------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        selectCountry(null);
        setAttackSource(null);
        setRegroupSource(null);
      }
      if (e.key === 'o' || e.key === 'O') {
        if (gameState?.myObjective) {
          setShowObjective((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectCountry, gameState?.myObjective]);

  // -- Room list refresh ---------------------------------------
  const handleRefreshRooms = useCallback(() => {
    socket.listRooms((list: any[]) => {
      setRooms(
        list.map((r: any) => ({
          id: r.id,
          name: r.name ?? 'Sala',
          playerCount: r.playerCount ?? 0,
          maxPlayers: r.maxPlayers ?? 6,
          status: 'LOBBY' as const,
        })),
      );
    });
  }, [socket]);

  useEffect(() => {
    if (playerName.trim() && !roomState) {
      handleRefreshRooms();
      const interval = setInterval(handleRefreshRooms, 3000);
      return () => clearInterval(interval);
    }
  }, [playerName, roomState, handleRefreshRooms]);

  // ============================================================
  // COMPUTE HIGHLIGHTED COUNTRIES based on phase + selection
  // ============================================================
  useEffect(() => {
    if (!gameState || !playerId || !isMyTurn) {
      setHighlightedCountries([]);
      return;
    }

    const phase = gameState.phase;
    const turnPhase = gameState.turnPhase;

    // Setup phase: highlight own territories
    if (phase === 'SETUP_PLACE_8' || phase === 'SETUP_PLACE_4') {
      const myTerrs = Object.entries(gameState.territories)
        .filter(([, t]) => t.owner === playerId)
        .map(([id]) => id);
      setHighlightedCountries(myTerrs);
      return;
    }

    if (phase !== 'PLAYING') {
      setHighlightedCountries([]);
      return;
    }

    switch (turnPhase) {
      case 'REINFORCE': {
        // Highlight own territories as valid placement targets
        setHighlightedCountries(Array.from(myTerritoryIds));
        break;
      }

      case 'ATTACK': {
        if (attackSource) {
          // Highlight valid attack targets: adjacent enemy territories
          const adjacent = getAdjacentCountries(attackSource);
          const validTargets = adjacent.filter((id) => {
            const t = gameState.territories[id];
            return t && t.owner !== playerId;
          });
          setHighlightedCountries(validTargets);
        } else {
          // Highlight own territories with 2+ armies (valid attack sources)
          const sources = Object.entries(gameState.territories)
            .filter(([, t]) => t.owner === playerId && t.armies >= 2)
            .map(([id]) => id);
          setHighlightedCountries(sources);
        }
        break;
      }

      case 'REGROUP': {
        if (regroupSource) {
          // Highlight own adjacent territories as valid destinations
          const adjacent = getAdjacentCountries(regroupSource);
          const validDests = adjacent.filter((id) => {
            const t = gameState.territories[id];
            return t && t.owner === playerId;
          });
          setHighlightedCountries(validDests);
        } else {
          // Highlight own territories with 2+ armies (valid regroup sources)
          const sources = Object.entries(gameState.territories)
            .filter(([, t]) => t.owner === playerId && t.armies >= 2)
            .map(([id]) => id);
          setHighlightedCountries(sources);
        }
        break;
      }

      default:
        setHighlightedCountries([]);
        break;
    }
  }, [
    gameState,
    playerId,
    isMyTurn,
    attackSource,
    regroupSource,
    myTerritoryIds,
    setHighlightedCountries,
  ]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleNameSubmit = useCallback(
    (name: string) => {
      setPlayerName(name);
    },
    [setPlayerName],
  );

  const handleCreateRoom = useCallback(
    (name: string, maxPlayers: number) => {
      socket.createRoom(name, maxPlayers);
      setLobbyView('rooms');
    },
    [socket],
  );

  const handleJoinRoom = useCallback(
    (roomId: string) => {
      socket.joinRoom(roomId);
    },
    [socket],
  );

  const handleLeaveRoom = useCallback(() => {
    socket.leaveRoom();
    setVictoryInfo(null);
  }, [socket]);

  const handleSetColor = useCallback(
    (color: string) => {
      socket.setColor(color as PlayerColor);
    },
    [socket],
  );

  const handleToggleReady = useCallback(() => {
    socket.setReady(true);
  }, [socket]);

  const handleStartGame = useCallback(() => {
    socket.startGame();
  }, [socket]);

  // ============================================================
  // COUNTRY CLICK - Core game interaction
  // ============================================================
  const handleCountryClick = useCallback(
    (countryId: string) => {
      if (!gameState || !playerId) return;

      const territory = gameState.territories[countryId];
      if (!territory) return;

      const phase = gameState.phase;
      const turnPhase = gameState.turnPhase;
      const isMine = territory.owner === playerId;

      // If conquest is pending, ignore regular clicks
      if (conquestPending) return;

      // -- SETUP PHASE ------------------------------------------
      if (phase === 'SETUP_PLACE_8' || phase === 'SETUP_PLACE_4') {
        if (!isMyTurn) return;
        // Can only place on own territories
        if (!isMine) return;
        socket.placeArmies(countryId, 1);
        return;
      }

      // -- NOT PLAYING or NOT MY TURN: just toggle info select --
      if (phase !== 'PLAYING' || !isMyTurn) {
        selectCountry(selectedCountry === countryId ? null : countryId);
        return;
      }

      switch (turnPhase) {
        // -- REINFORCE -------------------------------------------
        case 'REINFORCE': {
          if (!isMine) return;
          if (effectiveReinforcementsLeft <= 0) return;

          // Accumulate 1 reinforcement on this territory
          const newPlacements = { ...reinforcePlacements };
          newPlacements[countryId] = (newPlacements[countryId] ?? 0) + 1;
          setReinforcePlacements(newPlacements);
          setReinforcementsSpent((prev) => prev + 1);

          // If all reinforcements placed, send them all to the server
          const totalRemaining = gameState.reinforcementsLeft - (reinforcementsSpent + 1);
          if (totalRemaining <= 0) {
            socket.reinforce(newPlacements);
            setReinforcePlacements({});
            setReinforcementsSpent(0);
          }

          selectCountry(countryId);
          break;
        }

        // -- ATTACK ----------------------------------------------
        case 'ATTACK': {
          if (!attackSource) {
            // First click: select attack source
            if (!isMine) return;
            if (territory.armies < 2) return;
            setAttackSource(countryId);
            selectCountry(countryId);
          } else {
            // Second click
            if (countryId === attackSource) {
              // Clicking same territory deselects
              setAttackSource(null);
              selectCountry(null);
              return;
            }

            if (isMine) {
              // Clicking another own territory: switch source if valid
              if (territory.armies >= 2) {
                setAttackSource(countryId);
                selectCountry(countryId);
              } else {
                setAttackSource(null);
                selectCountry(null);
              }
              return;
            }

            // Clicking enemy territory: attempt attack if adjacent
            if (!areAdjacent(attackSource, countryId)) {
              setAttackSource(null);
              selectCountry(null);
              return;
            }

            // Calculate dice: min(3, source armies - 1)
            const sourceTerritory = gameState.territories[attackSource];
            if (!sourceTerritory) return;
            const numDice = Math.min(3, sourceTerritory.armies - 1);

            // Keep selectedCountry as attackSource so conquest handler finds it
            selectCountry(attackSource);
            socket.attack(attackSource, countryId, numDice);
            // Don't reset attackSource: keep it for potential conquest move
          }
          break;
        }

        // -- REGROUP ---------------------------------------------
        case 'REGROUP': {
          if (!regroupSource) {
            // First click: select regroup source
            if (!isMine) return;
            if (territory.armies < 2) return;
            setRegroupSource(countryId);
            selectCountry(countryId);
          } else {
            // Second click
            if (countryId === regroupSource) {
              // Clicking same territory deselects
              setRegroupSource(null);
              selectCountry(null);
              return;
            }

            if (!isMine) {
              // Can only regroup to own territories
              setRegroupSource(null);
              selectCountry(null);
              return;
            }

            if (!areAdjacent(regroupSource, countryId)) {
              // Not adjacent, deselect
              setRegroupSource(null);
              selectCountry(null);
              return;
            }

            // Move 1 army from source to destination
            socket.regroup([{ from: regroupSource, to: countryId, armies: 1 }]);
            // Keep source selected for continued regrouping
            selectCountry(regroupSource);
          }
          break;
        }

        // -- OTHER PHASES (TRADE, SITUATION_CARD, etc.) ----------
        default: {
          selectCountry(selectedCountry === countryId ? null : countryId);
          break;
        }
      }
    },
    [
      gameState,
      playerId,
      isMyTurn,
      conquestPending,
      selectedCountry,
      attackSource,
      regroupSource,
      reinforcePlacements,
      reinforcementsSpent,
      effectiveReinforcementsLeft,
      selectCountry,
      socket,
    ],
  );

  // ============================================================
  // CONQUEST COMPLETION
  // ============================================================
  const handleConquestConfirm = useCallback(() => {
    if (!conquestPending) return;
    socket.completeConquest(conquestPending.from, conquestPending.to, conquestArmies);
    setConquestPending(null);
    setConquestArmies(1);
    setAttackSource(null);
    selectCountry(null);
  }, [conquestPending, conquestArmies, socket, selectCountry]);

  // ============================================================
  // END TURN
  // ============================================================
  const handleEndTurn = useCallback(() => {
    socket.endTurn();
    setAttackSource(null);
    setRegroupSource(null);
    selectCountry(null);
  }, [socket, selectCountry]);

  // ============================================================
  // SKIP TO ATTACK (from REINFORCE when all reinforcements placed)
  // ============================================================
  const handleSkipToAttack = useCallback(() => {
    // If there are unsent reinforcements, send them first
    if (reinforcementsSpent > 0 && Object.keys(reinforcePlacements).length > 0) {
      socket.reinforce(reinforcePlacements);
      setReinforcePlacements({});
      setReinforcementsSpent(0);
    } else {
      socket.skipToAttack();
    }
  }, [reinforcementsSpent, reinforcePlacements, socket]);

  // ============================================================
  // SKIP TO REGROUP (from ATTACK)
  // ============================================================
  const handleSkipToRegroup = useCallback(() => {
    socket.skipToRegroup();
    setAttackSource(null);
    selectCountry(null);
  }, [socket, selectCountry]);

  // ============================================================
  // CARD TRADING
  // ============================================================
  const handleTradeCards = useCallback(() => {
    const cardIndices = Array.from(selectedCards);
    if (cardIndices.length < 3 || !gameState?.myHand) return;
    const cardIds = cardIndices.map((i) => gameState.myHand[i]?.id).filter(Boolean);
    if (cardIds.length >= 3) {
      socket.tradeCards(cardIds);
      useGameStore.getState().clearCardSelection();
    }
  }, [selectedCards, gameState?.myHand, socket]);

  const handleVictoryClose = useCallback(() => {
    setVictoryInfo(null);
    handleLeaveRoom();
  }, [handleLeaveRoom]);

  const handlePactAccept = useCallback(() => {
    if (pendingPact) {
      socket.respondPact(pendingPact.pactId, true);
      setPendingPact(null);
    }
  }, [pendingPact, socket]);

  const handlePactReject = useCallback(() => {
    if (pendingPact) {
      socket.respondPact(pendingPact.pactId, false);
      setPendingPact(null);
    }
  }, [pendingPact, socket]);

  // ============================================================
  // Determine which view to render
  // ============================================================

  const hasName = playerName.trim().length > 0;
  const inRoom = roomState !== null;
  const roomStatus = roomState?.status ?? null;
  const isPlaying = roomStatus === 'PLAYING' || (gameState !== null && gameState.phase !== 'FINISHED');

  // ================================================================
  // RENDER: No name set -> NameInput
  // ================================================================
  if (!hasName) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <NameInput initialName="" onSubmit={handleNameSubmit} />
      </div>
    );
  }

  // ================================================================
  // RENDER: Name set, not in a room -> Room list / Create room
  // ================================================================
  if (!inRoom) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        {/* Connection status */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}
          />
          <span className="text-xs text-gray-400">
            {connected ? 'Conectado' : 'Conectando...'}
          </span>
        </div>

        {/* Player name badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="text-sm text-gray-300">
            Jugando como <strong className="text-white">{playerName}</strong>
          </span>
          <button
            onClick={() => setPlayerName('')}
            className="text-xs text-gray-500 hover:text-gray-300 underline"
          >
            Cambiar
          </button>
        </div>

        {lobbyView === 'rooms' ? (
          <RoomList
            rooms={rooms}
            onJoinRoom={handleJoinRoom}
            onCreateRoom={() => setLobbyView('create')}
            onRefresh={handleRefreshRooms}
          />
        ) : (
          <CreateRoom
            onCreateRoom={handleCreateRoom}
            onBack={() => setLobbyView('rooms')}
          />
        )}
      </div>
    );
  }

  // ================================================================
  // RENDER: In room, LOBBY status -> Waiting room
  // ================================================================
  if (roomStatus === 'LOBBY' && !isPlaying) {
    const isHost = roomState.hostId === playerId ||
      (roomState.players.length > 0 && roomState.players[0].id === playerId);

    const allReady = roomState.players.length >= 2 && roomState.players.every(p => p.ready);

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        {/* Connection status */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}
          />
          <span className="text-xs text-gray-400">
            {connected ? 'Conectado' : 'Reconectando...'}
          </span>
        </div>

        {/* Debug info - temporary */}
        <div className="absolute bottom-4 left-4 text-[10px] text-gray-600 font-mono">
          pid:{playerId?.slice(0,8)} host:{roomState.hostId?.slice(0,8)} isHost:{String(isHost)}
        </div>

        <WaitingRoom
          roomName={roomState.name}
          roomId={roomState.id}
          players={roomState.players}
          maxPlayers={roomState.maxPlayers}
          myId={playerId ?? ''}
          isHost={isHost}
          onSetColor={handleSetColor}
          onToggleReady={handleToggleReady}
          onStartGame={handleStartGame}
          onLeave={handleLeaveRoom}
        />
      </div>
    );
  }

  // ================================================================
  // RENDER: In game (PLAYING or SETUP status) -> Full game view
  // ================================================================
  if (gameState) {
    // Determine if we're in setup
    const isSetupPhase = gameState.phase === 'SETUP_PLACE_8' || gameState.phase === 'SETUP_PLACE_4';
    const setupArmiesCount = gameState.phase === 'SETUP_PLACE_8' ? 8 : gameState.phase === 'SETUP_PLACE_4' ? 4 : 0;

    // Build contextual status message
    let statusMessage = '';
    if (isSetupPhase) {
      if (isMyTurn) {
        statusMessage = `Fase de colocacion: coloca ${setupArmiesCount} ejercitos en tus territorios`;
      } else {
        const currentPlayer = gameState.players.find((p) => p.id === gameState.currentPlayerId);
        statusMessage = `Esperando a ${currentPlayer?.name ?? 'otro jugador'} que coloque ejercitos...`;
      }
    } else if (gameState.phase === 'PLAYING' && isMyTurn) {
      switch (gameState.turnPhase) {
        case 'REINFORCE':
          statusMessage = `Haz clic en tus territorios para colocar refuerzos (${effectiveReinforcementsLeft} restantes)`;
          break;
        case 'ATTACK':
          if (conquestPending) {
            statusMessage = `Conquista: selecciona cuantos ejercitos mover a ${conquestPending.to}`;
          } else if (attackSource) {
            statusMessage = `Atacando desde ${attackSource} - selecciona territorio enemigo adyacente`;
          } else {
            statusMessage = 'Selecciona un territorio propio con 2+ ejercitos para atacar';
          }
          break;
        case 'REGROUP':
          if (regroupSource) {
            statusMessage = `Reagrupando desde ${regroupSource} - selecciona territorio propio adyacente`;
          } else {
            statusMessage = 'Selecciona un territorio propio con 2+ ejercitos para reagrupar';
          }
          break;
        default:
          break;
      }
    }

    return (
      <div className="h-screen w-screen bg-gray-900 flex flex-col overflow-hidden relative">
        {/* -- Map (full background) -------------------------------- */}
        <div className="absolute inset-0">
          <GameMap
            territories={gameState.territories}
            onCountryClick={handleCountryClick}
            selectedCountry={selectedCountry}
            highlightedCountries={highlightedCountries}
            phase={isSetupPhase ? 'REINFORCE' : gameState.turnPhase}
          />
        </div>

        {/* -- Setup phase banner (shown instead of TurnControls during SETUP) -- */}
        {isSetupPhase && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-gray-900/90 backdrop-blur-sm border border-amber-700 rounded-2xl px-5 py-3 shadow-xl min-w-[400px]">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-[10px] text-amber-500 uppercase tracking-wider">
                    Fase de Preparacion
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Colocar {setupArmiesCount} Ejercitos
                  </h3>
                </div>
                {isMyTurn ? (
                  <span className="text-[10px] font-semibold text-green-400 bg-green-900/40 border border-green-700/40 px-1.5 py-0.5 rounded">
                    Tu turno
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                    Esperando turno...
                  </span>
                )}
              </div>
              {isMyTurn && (
                <div className="text-xs text-amber-400 bg-amber-900/30 border border-amber-800/40 rounded-lg px-3 py-1.5">
                  Haz clic en tus territorios para colocar ejercitos de a uno
                </div>
              )}
            </div>
          </div>
        )}

        {/* -- Turn controls (top center, overlaid) - only during PLAYING phase -- */}
        {!isSetupPhase && (
          <TurnControls
            currentPhase={gameState.turnPhase}
            reinforcementsLeft={effectiveReinforcementsLeft}
            onEndTurn={handleEndTurn}
            onSkipToAttack={handleSkipToAttack}
            onSkipToRegroup={handleSkipToRegroup}
            activeSituationCard={
              gameState.activeSituationCard
                ? {
                    type: gameState.activeSituationCard.type,
                    description: gameState.activeSituationCard.description,
                  }
                : undefined
            }
            isMyTurn={isMyTurn}
          />
        )}

        {/* -- Status message bar ----------------------------------- */}
        {statusMessage && (
          <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-600 rounded-xl px-4 py-2 shadow-lg">
              <span className="text-sm text-gray-200">{statusMessage}</span>
            </div>
          </div>
        )}

        {/* -- Conquest modal --------------------------------------- */}
        {conquestPending && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-gray-900 border border-amber-600 rounded-2xl px-6 py-5 shadow-2xl min-w-[340px]">
              <h3 className="text-lg font-bold text-white mb-2">Territorio Conquistado</h3>
              <p className="text-sm text-gray-300 mb-4">
                Mueve ejercitos de{' '}
                <strong className="text-amber-400">{conquestPending.from}</strong> a{' '}
                <strong className="text-green-400">{conquestPending.to}</strong>
              </p>
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm text-gray-400">Ejercitos a mover:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConquestArmies(Math.max(conquestPending.minArmies, conquestArmies - 1))}
                    className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={conquestArmies <= conquestPending.minArmies}
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-white w-8 text-center">
                    {conquestArmies}
                  </span>
                  <button
                    onClick={() => setConquestArmies(Math.min(conquestPending.maxArmies, conquestArmies + 1))}
                    className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={conquestArmies >= conquestPending.maxArmies}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Minimo: {conquestPending.minArmies} | Maximo: {conquestPending.maxArmies}
              </div>
              <button
                onClick={handleConquestConfirm}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors"
              >
                Confirmar Movimiento
              </button>
            </div>
          </div>
        )}

        {/* -- Player panel (top-left, overlaid) -------------------- */}
        <div className="absolute left-2 top-2 z-20 flex flex-col gap-1 w-56">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
            Jugadores
          </h3>
          {gameState.players.map((player, idx) => {
            const isCurrent = player.id === gameState.currentPlayerId;
            return (
              <div
                key={player.id}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                  ${player.eliminated ? 'opacity-40 bg-gray-800/60' : 'bg-gray-800/80 backdrop-blur-sm'}
                  ${isCurrent && !player.eliminated ? 'ring-2 ring-offset-1 ring-offset-gray-900 ring-amber-500 shadow-lg' : ''}
                `}
              >
                <span className="text-[10px] text-gray-500 font-mono w-3 shrink-0">
                  {idx + 1}
                </span>
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-gray-600"
                  style={{
                    backgroundColor:
                      player.color === 'WHITE' ? '#F7FAFC' :
                      player.color === 'BLACK' ? '#2D3748' :
                      player.color === 'RED' ? '#E53E3E' :
                      player.color === 'BLUE' ? '#3182CE' :
                      player.color === 'YELLOW' ? '#ECC94B' :
                      player.color === 'GREEN' ? '#38A169' : '#888888',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm font-medium truncate block ${
                      player.eliminated ? 'line-through text-gray-500' : 'text-gray-100'
                    }`}
                  >
                    {player.name}
                    {player.id === playerId && (
                      <span className="text-gray-500 text-xs ml-1">(tu)</span>
                    )}
                  </span>
                  {!player.eliminated && (
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      <span title="Paises">{player.countryCount}p</span>
                      <span title="Tarjetas">{player.cardCount}c</span>
                    </div>
                  )}
                  {player.eliminated && (
                    <span className="text-[10px] text-red-400/70">Eliminado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* -- Game log (top-right, overlaid) ----------------------- */}
        <GameLog events={gameLog} />

        {/* -- Card hand (bottom, overlaid) ------------------------- */}
        <CardHand
          cards={gameState.myHand}
          selectedCards={selectedCards}
          onCardToggle={toggleCardSelection}
          onTrade={handleTradeCards}
          canTrade={actions.canTrade}
        />

        {/* -- Objective button (bottom-right, above cards) --------- */}
        {gameState.myObjective && (
          <button
            onClick={() => setShowObjective((prev) => !prev)}
            className="absolute bottom-48 right-4 z-30 px-3 py-2 bg-gray-800/90 backdrop-blur-sm border border-gray-700 hover:border-amber-600 rounded-lg text-xs text-gray-300 hover:text-amber-400 transition-colors"
            title="Ver objetivo (O)"
          >
            Objetivo (O)
          </button>
        )}

        {/* -- Connection indicator --------------------------------- */}
        {!connected && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-700 rounded-lg px-4 py-2 text-sm text-red-200">
            Conexion perdida. Reconectando...
          </div>
        )}

        {/* -- MODALS ----------------------------------------------- */}

        {/* Dice roller */}
        {showDiceResult && (
          <DiceRoller
            attackerDice={showDiceResult.attackerDice}
            defenderDice={showDiceResult.defenderDice}
            attackerLosses={showDiceResult.attackerLosses}
            defenderLosses={showDiceResult.defenderLosses}
            onClose={hideDice}
          />
        )}

        {/* Objective modal */}
        {showObjective && gameState.myObjective && (
          <ObjectiveModal
            objective={gameState.myObjective}
            onClose={() => setShowObjective(false)}
          />
        )}

        {/* Situation card modal */}
        {showSituationCard && gameState.activeSituationCard && (
          <SituationCardModal
            card={gameState.activeSituationCard}
            onClose={() => setShowSituationCard(false)}
          />
        )}

        {/* Pact response modal */}
        {pendingPact && (
          <PactResponseModal
            fromPlayerName={pendingPact.fromPlayerName}
            pactType={pendingPact.pactType}
            description={pendingPact.description}
            countryName={pendingPact.countryName}
            onAccept={handlePactAccept}
            onReject={handlePactReject}
          />
        )}

        {/* Victory modal */}
        {victoryInfo && (
          <VictoryModal
            winnerName={victoryInfo.winnerName}
            winnerColor={victoryInfo.winnerColor}
            objectiveDescription={victoryInfo.objectiveDescription}
            isMe={victoryInfo.isMe}
            onClose={handleVictoryClose}
          />
        )}
      </div>
    );
  }

  // ================================================================
  // RENDER: Fallback (room exists but no game state yet -- loading)
  // ================================================================
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Cargando partida...</p>
      </div>
    </div>
  );
}

export default App;
