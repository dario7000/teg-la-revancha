import React from 'react';

interface VictoryModalProps {
  winnerName: string;
  winnerColor: string;
  objectiveDescription: string;
  isMe: boolean;
  onClose: () => void;
}

const COLOR_BG: Record<string, string> = {
  WHITE: 'from-gray-100 to-gray-300',
  BLACK: 'from-gray-700 to-gray-900',
  RED: 'from-red-500 to-red-700',
  BLUE: 'from-blue-500 to-blue-700',
  YELLOW: 'from-yellow-400 to-yellow-600',
  GREEN: 'from-green-500 to-green-700',
};

const VictoryModal: React.FC<VictoryModalProps> = ({
  winnerName,
  winnerColor,
  objectiveDescription,
  isMe,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-600 text-center">
        <div
          className={`w-20 h-20 rounded-full bg-gradient-to-br ${COLOR_BG[winnerColor] || 'from-gray-400 to-gray-600'} mx-auto mb-4 flex items-center justify-center`}
        >
          <span className="text-3xl">&#9813;</span>
        </div>

        <h2 className="text-3xl font-bold text-amber-400 mb-2">
          {isMe ? 'Victoria!' : 'Fin de la partida'}
        </h2>
        <p className="text-xl text-white mb-4">
          {isMe ? 'Felicitaciones, ganaste!' : `${winnerName} ha ganado la partida`}
        </p>

        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400 mb-1">Objetivo completado:</p>
          <p className="text-gray-200">{objectiveDescription}</p>
        </div>

        <button
          onClick={onClose}
          className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
        >
          Volver al Lobby
        </button>
      </div>
    </div>
  );
};

export default React.memo(VictoryModal);
