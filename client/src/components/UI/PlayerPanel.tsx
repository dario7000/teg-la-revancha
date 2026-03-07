import React from 'react';
import { Player } from '../../shared/types/Player';
import { PlayerId, TerritoryState, CountryId } from '../../shared/types/GameState';
import { PLAYER_COLORS } from '../../shared/constants';

export interface PlayerPanelProps {
  players: Player[];
  currentPlayerId: PlayerId;
  turnOrder: PlayerId[];
  territories: Record<CountryId, TerritoryState>;
}

function getPlayerHex(color: string): string {
  const entry = PLAYER_COLORS.find((c) => c.id === color);
  return entry?.hex ?? '#888888';
}

function getPlayerBorder(color: string): string | undefined {
  const entry = PLAYER_COLORS.find((c) => c.id === color);
  return entry?.border;
}

function countPlayerCountries(
  playerId: PlayerId,
  territories: Record<CountryId, TerritoryState>,
): number {
  return Object.values(territories).filter((t) => t.owner === playerId).length;
}

function countPlayerArmies(
  playerId: PlayerId,
  territories: Record<CountryId, TerritoryState>,
): number {
  return Object.values(territories)
    .filter((t) => t.owner === playerId)
    .reduce((sum, t) => sum + t.armies, 0);
}

const PlayerPanel: React.FC<PlayerPanelProps> = React.memo(
  ({ players, currentPlayerId, turnOrder, territories }) => {
    const sortedPlayers = turnOrder
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined);

    return (
      <div className="absolute left-2 top-2 z-20 flex flex-col gap-1 w-56">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
          Jugadores
        </h3>
        {sortedPlayers.map((player, index) => {
          const isCurrent = player.id === currentPlayerId;
          const hex = getPlayerHex(player.color);
          const border = getPlayerBorder(player.color);
          const countries = countPlayerCountries(player.id, territories);
          const armies = countPlayerArmies(player.id, territories);
          const cardCount = player.hand.length;

          return (
            <div
              key={player.id}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                ${player.eliminated ? 'opacity-40 bg-gray-800/60' : 'bg-gray-800/80 backdrop-blur-sm'}
                ${isCurrent && !player.eliminated ? 'ring-2 ring-offset-1 ring-offset-gray-900 shadow-lg' : ''}
              `}
              style={
                isCurrent && !player.eliminated
                  ? {
                      boxShadow: `0 0 12px ${hex}66, 0 0 4px ${hex}33`,
                      outline: `2px solid ${hex}`,
                      outlineOffset: '1px',
                    }
                  : undefined
              }
            >
              {/* Turn order number */}
              <span className="text-[10px] text-gray-500 font-mono w-3 shrink-0">
                {index + 1}
              </span>

              {/* Color dot */}
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 border"
                style={{
                  backgroundColor: hex,
                  borderColor: border ?? hex,
                }}
              />

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm font-medium truncate block ${
                    player.eliminated ? 'line-through text-gray-500' : 'text-gray-100'
                  }`}
                >
                  {player.name}
                </span>
                {!player.eliminated && (
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                    <span title="Paises">
                      🏴 {countries}
                    </span>
                    <span title="Ejercitos">
                      ⚔ {armies}
                    </span>
                    <span title="Tarjetas">
                      🃏 {cardCount}
                    </span>
                  </div>
                )}
                {player.eliminated && (
                  <span className="text-[10px] text-red-400/70">Eliminado</span>
                )}
              </div>

              {/* Connection status dot */}
              {!player.eliminated && (
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    player.connected ? 'bg-green-400' : 'bg-red-400'
                  }`}
                  title={player.connected ? 'Conectado' : 'Desconectado'}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

PlayerPanel.displayName = 'PlayerPanel';

export default PlayerPanel;
