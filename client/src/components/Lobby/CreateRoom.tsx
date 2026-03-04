import React, { useState } from 'react';

interface CreateRoomProps {
  onCreateRoom: (name: string, maxPlayers: number) => void;
  onBack: () => void;
}

const CreateRoom: React.FC<CreateRoomProps> = ({ onCreateRoom, onBack }) => {
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      onCreateRoom(roomName.trim(), maxPlayers);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md shadow-2xl border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Crear Sala</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nombre de la sala
          </label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Ej: Partida de amigos"
            maxLength={30}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Jugadores ({maxPlayers})
          </label>
          <input
            type="range"
            min={2}
            max={6}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={!roomName.trim()}
            className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:text-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            Crear
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(CreateRoom);
