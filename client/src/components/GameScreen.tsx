import React, { useState, useCallback } from 'react';
import { GameMap } from './Map';
import type { FC } from 'react';

interface Territory {
  owner: string;
  armies: number;
  missiles: number;
  isBlocked: boolean;
  coOwner?: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  color: string;
  countryCount: number;
  cardCount: number;
  eliminated: boolean;
}

interface GameScreenProps {
  gameState: {
    phase: string;
    turnPhase: string;
    currentPlayerId: string;
    round: number;
    territories: Record<string, Territory>;
    players: PlayerInfo[];
    myHand: any[];
    myObjective: any;
    activeSituationCard: any;
    reinforcementsLeft: number;
    pacts: any[];
  };
  playerId: string;
  onCountryClick: (countryId: string) => void;
  onAttack: (from: string, to: string) => void;
  onPlaceArmies: (countryId: string, count: number) => void;
  onRegroup: (from: string, to: string, armies: number) => void;
  onEndTurn: () => void;
  onTradeCards: (indices: number[]) => void;
  onFireMissile: (from: string, target: string) => void;
}

const GameScreen: FC<GameScreenProps> = ({
  gameState,
  playerId,
  onCountryClick,
  onEndTurn,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [highlightedCountries, setHighlightedCountries] = useState<string[]>([]);

  const isMyTurn = gameState.currentPlayerId === playerId;

  const handleCountryClick = useCallback(
    (countryId: string) => {
      if (!isMyTurn) return;

      if (selectedCountry === countryId) {
        setSelectedCountry(null);
        setHighlightedCountries([]);
      } else {
        setSelectedCountry(countryId);
        onCountryClick(countryId);
      }
    },
    [isMyTurn, selectedCountry, onCountryClick],
  );

  const currentPlayer = gameState.players.find((p) => p.id === gameState.currentPlayerId);

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-amber-400 font-bold text-sm">TEG La Revancha</span>
          <span className="text-gray-400 text-xs">Ronda {gameState.round}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-300 text-sm">
            Turno:{' '}
            <span className="text-white font-semibold">{currentPlayer?.name || '...'}</span>
          </span>
          {isMyTurn && (
            <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded font-semibold">
              TU TURNO
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isMyTurn && (
            <button
              onClick={onEndTurn}
              className="px-3 py-1 text-xs bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
            >
              Terminar Turno
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Players */}
        <div className="w-48 bg-gray-800 border-r border-gray-700 p-2 space-y-1 overflow-y-auto shrink-0">
          <h3 className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2">Jugadores</h3>
          {gameState.players.map((player, idx) => {
            const isCurrent = player.id === gameState.currentPlayerId;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                  player.eliminated
                    ? 'opacity-40'
                    : isCurrent
                      ? 'bg-gray-700 ring-1 ring-amber-500'
                      : 'hover:bg-gray-700/50'
                }`}
              >
                <span className="text-gray-500 text-xs w-3">{idx + 1}</span>
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      player.color === 'WHITE' ? '#ffffff' :
                      player.color === 'BLACK' ? '#1a1a2e' :
                      player.color === 'RED' ? '#dc2626' :
                      player.color === 'BLUE' ? '#2563eb' :
                      player.color === 'YELLOW' ? '#eab308' :
                      player.color === 'GREEN' ? '#16a34a' : '#6b7280',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-white truncate ${player.eliminated ? 'line-through' : ''}`}>
                    {player.name}
                    {player.id === playerId && (
                      <span className="text-gray-500 text-xs"> (tu)</span>
                    )}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {player.countryCount}p · {player.cardCount}c
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map */}
        <div className="flex-1">
          <GameMap
            territories={gameState.territories}
            onCountryClick={handleCountryClick}
            selectedCountry={selectedCountry}
            highlightedCountries={highlightedCountries}
            phase={gameState.turnPhase}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(GameScreen);
