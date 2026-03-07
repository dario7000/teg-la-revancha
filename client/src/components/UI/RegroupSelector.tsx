import { useState } from 'react';

interface RegroupSelectorProps {
  from: string;
  to: string;
  maxArmies: number; // source armies - 1
  onConfirm: (armies: number) => void;
  onCancel: () => void;
}

export default function RegroupSelector({
  from,
  to,
  maxArmies,
  onConfirm,
  onCancel,
}: RegroupSelectorProps) {
  const [armies, setArmies] = useState(1);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 border border-cyan-600 rounded-2xl px-6 py-5 shadow-2xl min-w-[340px]">
        <h3 className="text-lg font-bold text-white mb-2">Reagrupar Ejercitos</h3>
        <p className="text-sm text-gray-300 mb-4">
          Mover ejercitos de{' '}
          <strong className="text-cyan-400">{from}</strong> a{' '}
          <strong className="text-green-400">{to}</strong>
        </p>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-gray-400">Ejercitos a mover:</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setArmies(Math.max(1, armies - 1))}
              className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={armies <= 1}
            >
              -
            </button>
            <span className="text-xl font-bold text-white w-8 text-center">
              {armies}
            </span>
            <button
              onClick={() => setArmies(Math.min(maxArmies, armies + 1))}
              className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={armies >= maxArmies}
            >
              +
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-gray-500">
            Minimo: 1 | Maximo: {maxArmies}
          </div>
          {maxArmies > 1 && (
            <button
              onClick={() => setArmies(maxArmies)}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline"
            >
              Mover todos
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(armies)}
            className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
