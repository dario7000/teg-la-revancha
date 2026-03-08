import React from 'react';

interface RoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: 'LOBBY' | 'PLAYING' | 'FINISHED';
}

interface RoomListProps {
  rooms: RoomInfo[];
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  onRefresh: () => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onJoinRoom, onCreateRoom, onRefresh }) => {
  const lobbyRooms = rooms.filter((r) => r.status === 'LOBBY');

  return (
    <div className="bg-gray-800 rounded-xl p-8 w-[calc(100vw-2rem)] sm:max-w-lg shadow-2xl border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Salas Disponibles</h2>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          title="Actualizar"
        >
          ↻ Actualizar
        </button>
      </div>

      {lobbyRooms.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay salas disponibles</p>
          <p className="text-sm">Crea una nueva sala para empezar a jugar</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto pr-1">
          {lobbyRooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between bg-gray-700 hover:bg-gray-650 rounded-lg px-4 py-3 transition-colors"
            >
              <div>
                <p className="text-white font-medium">{room.name}</p>
                <p className="text-sm text-gray-400">
                  {room.playerCount}/{room.maxPlayers} jugadores
                </p>
              </div>
              <button
                onClick={() => onJoinRoom(room.id)}
                disabled={room.playerCount >= room.maxPlayers}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:text-gray-400 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {room.playerCount >= room.maxPlayers ? 'Llena' : 'Unirse'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onCreateRoom}
          className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
        >
          + Crear Sala
        </button>
      </div>
    </div>
  );
};

export default React.memo(RoomList);
