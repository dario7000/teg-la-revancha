import React from 'react';

const PLAYER_COLOR_CLASSES: Record<string, string> = {
  WHITE: 'bg-white',
  BLACK: 'bg-gray-900 border border-gray-600',
  RED: 'bg-red-600',
  BLUE: 'bg-blue-600',
  YELLOW: 'bg-yellow-400',
  GREEN: 'bg-green-600',
};

const PLAYER_COLOR_NAMES: Record<string, string> = {
  WHITE: 'Blanco',
  BLACK: 'Negro',
  RED: 'Rojo',
  BLUE: 'Azul',
  YELLOW: 'Amarillo',
  GREEN: 'Verde',
};

const ALL_COLORS = ['WHITE', 'BLACK', 'RED', 'BLUE', 'YELLOW', 'GREEN'];

interface PlayerSlot {
  id: string;
  name: string;
  color: string;
  ready: boolean;
}

interface WaitingRoomProps {
  roomName: string;
  roomId: string;
  players: PlayerSlot[];
  maxPlayers: number;
  myId: string;
  isHost: boolean;
  onSetColor: (color: string) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeave: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomName,
  roomId,
  players,
  maxPlayers,
  myId,
  isHost,
  onSetColor,
  onToggleReady,
  onStartGame,
  onLeave,
}) => {
  const myPlayer = players.find((p) => p.id === myId);
  const takenColors = new Set(players.map((p) => p.color));
  const allReady = players.length >= 2 && players.every((p) => p.ready);

  return (
    <div className="bg-gray-800 rounded-xl p-8 w-full max-w-lg shadow-2xl border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-white">{roomName}</h2>
        <span className="text-sm text-gray-400 font-mono">#{roomId}</span>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        {players.length}/{maxPlayers} jugadores
      </p>

      {/* Player slots */}
      <div className="space-y-2 mb-6">
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center justify-between rounded-lg px-4 py-3 ${
              player.id === myId ? 'bg-gray-600' : 'bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full ${PLAYER_COLOR_CLASSES[player.color] || 'bg-gray-500'}`} />
              <span className="text-white font-medium">
                {player.name}
                {player.id === myId && <span className="text-gray-400 text-sm ml-1">(tu)</span>}
              </span>
            </div>
            <span
              className={`text-sm font-semibold px-2 py-0.5 rounded ${
                player.ready
                  ? 'bg-green-900 text-green-300'
                  : 'bg-gray-900 text-gray-400'
              }`}
            >
              {player.ready ? 'Listo' : 'Esperando'}
            </span>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center justify-center rounded-lg px-4 py-3 bg-gray-700/50 border border-dashed border-gray-600"
          >
            <span className="text-gray-500 text-sm">Esperando jugador...</span>
          </div>
        ))}
      </div>

      {/* Color picker */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Tu color</label>
        <div className="flex gap-2">
          {ALL_COLORS.map((color) => {
            const isTaken = takenColors.has(color) && myPlayer?.color !== color;
            const isSelected = myPlayer?.color === color;
            return (
              <button
                key={color}
                onClick={() => !isTaken && onSetColor(color)}
                disabled={isTaken}
                title={PLAYER_COLOR_NAMES[color]}
                className={`w-10 h-10 rounded-full ${PLAYER_COLOR_CLASSES[color]} transition-transform ${
                  isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-gray-800 scale-110' : ''
                } ${isTaken ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onLeave}
          className="px-4 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          Salir
        </button>
        <button
          onClick={onToggleReady}
          className={`flex-1 px-4 py-2.5 font-semibold rounded-lg transition-colors ${
            myPlayer?.ready
              ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
              : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          {myPlayer?.ready ? 'No estoy listo' : 'Estoy listo'}
        </button>
        <button
          onClick={onStartGame}
          disabled={!allReady}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:text-gray-400 text-white font-semibold rounded-lg transition-colors"
        >
          Iniciar
        </button>
      </div>
    </div>
  );
};

export default React.memo(WaitingRoom);
