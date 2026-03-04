import React from 'react';

interface ObjectiveModalProps {
  objective: {
    type: string;
    description: string;
    targetColor?: string;
  };
  onClose: () => void;
}

const ObjectiveModal: React.FC<ObjectiveModalProps> = ({ objective, onClose }) => {
  const typeLabel =
    objective.type === 'OCCUPATION'
      ? 'Ocupacion'
      : objective.type === 'DESTRUCTION'
        ? 'Destruccion'
        : 'Destruir al de la izquierda';

  const typeBg =
    objective.type === 'OCCUPATION'
      ? 'bg-blue-900 text-blue-300'
      : 'bg-red-900 text-red-300';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Tu Objetivo Secreto</h3>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${typeBg}`}>
            {typeLabel}
          </span>
        </div>

        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <p className="text-gray-200 leading-relaxed">{objective.description}</p>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Recuerda: si no puedes cumplir tu objetivo, la victoria comun es ocupar 45 paises.
        </p>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default React.memo(ObjectiveModal);
