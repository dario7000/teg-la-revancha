import React from 'react';

interface SituationCardModalProps {
  card: {
    type: string;
    description: string;
    color?: string;
  };
  onClose: () => void;
}

const CARD_COLORS: Record<string, string> = {
  COMBATE_CLASICO: 'border-gray-500',
  NIEVE: 'border-cyan-400',
  VIENTO_A_FAVOR: 'border-green-400',
  CRISIS: 'border-red-500',
  REFUERZOS_EXTRAS: 'border-yellow-400',
  FRONTERAS_ABIERTAS: 'border-purple-400',
  FRONTERAS_CERRADAS: 'border-orange-400',
  DESCANSO: 'border-pink-400',
};

const CARD_ICONS: Record<string, string> = {
  COMBATE_CLASICO: '⚔',
  NIEVE: '❄',
  VIENTO_A_FAVOR: '💨',
  CRISIS: '⚠',
  REFUERZOS_EXTRAS: '🛡',
  FRONTERAS_ABIERTAS: '🌐',
  FRONTERAS_CERRADAS: '🚧',
  DESCANSO: '💤',
};

const CARD_NAMES: Record<string, string> = {
  COMBATE_CLASICO: 'Combate Clasico',
  NIEVE: 'Nieve',
  VIENTO_A_FAVOR: 'Viento a Favor',
  CRISIS: 'Crisis',
  REFUERZOS_EXTRAS: 'Refuerzos Extras',
  FRONTERAS_ABIERTAS: 'Fronteras Abiertas',
  FRONTERAS_CERRADAS: 'Fronteras Cerradas',
  DESCANSO: 'Descanso',
};

const SituationCardModal: React.FC<SituationCardModalProps> = ({ card, onClose }) => {
  const borderColor = CARD_COLORS[card.type] || 'border-gray-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border-2 ${borderColor} animate-bounce-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <span className="text-4xl">{CARD_ICONS[card.type] || '?'}</span>
        </div>

        <h3 className="text-xl font-bold text-white text-center mb-1">
          Carta de Situacion
        </h3>
        <p className="text-amber-400 font-semibold text-center mb-4">
          {CARD_NAMES[card.type] || card.type}
        </p>

        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <p className="text-gray-200 text-sm leading-relaxed">{card.description}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default React.memo(SituationCardModal);
