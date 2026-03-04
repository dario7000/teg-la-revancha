import React, { useState } from 'react';

const PACT_TYPES = [
  { value: 'NO_AGGRESSION', label: 'No Agresion', desc: 'Ambos acuerdan no atacarse mutuamente.' },
  { value: 'PASSAGE', label: 'Paso', desc: 'Permitir mover ejercitos a traves del territorio del otro.' },
  { value: 'TRADE', label: 'Comercio', desc: 'Intercambiar tarjetas de pais entre ambos.' },
  { value: 'SHARED_ATTACK', label: 'Ataque Compartido', desc: 'Contribuir ejercitos al ataque del aliado.' },
  { value: 'CONDOMINIUM', label: 'Condominio', desc: 'Propiedad conjunta de un territorio.' },
  { value: 'INTERNATIONAL_ZONE', label: 'Zona Internacional', desc: 'Un territorio se vuelve neutral.' },
];

interface PactProposalModalProps {
  targetPlayerName: string;
  targetPlayerId: string;
  onPropose: (type: string, details?: { countryId?: string }) => void;
  onClose: () => void;
  countries?: { id: string; name: string }[];
}

const PactProposalModal: React.FC<PactProposalModalProps> = ({
  targetPlayerName,
  onPropose,
  onClose,
  countries,
}) => {
  const [selectedType, setSelectedType] = useState('NO_AGGRESSION');
  const [selectedCountry, setSelectedCountry] = useState('');

  const needsCountry = selectedType === 'CONDOMINIUM' || selectedType === 'INTERNATIONAL_ZONE';

  const handlePropose = () => {
    const details = needsCountry && selectedCountry ? { countryId: selectedCountry } : undefined;
    onPropose(selectedType, details);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-1">Proponer Pacto</h3>
        <p className="text-sm text-gray-400 mb-5">con {targetPlayerName}</p>

        <div className="space-y-2 mb-5">
          {PACT_TYPES.map((pt) => (
            <label
              key={pt.value}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedType === pt.value
                  ? 'bg-amber-900/40 border border-amber-600'
                  : 'bg-gray-700 border border-transparent hover:bg-gray-650'
              }`}
            >
              <input
                type="radio"
                name="pactType"
                value={pt.value}
                checked={selectedType === pt.value}
                onChange={() => setSelectedType(pt.value)}
                className="mt-1 accent-amber-500"
              />
              <div>
                <span className="text-white font-medium">{pt.label}</span>
                <p className="text-xs text-gray-400 mt-0.5">{pt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {needsCountry && countries && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-1">Territorio</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Seleccionar...</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handlePropose}
            disabled={needsCountry && !selectedCountry}
            className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:text-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            Proponer
          </button>
        </div>
      </div>
    </div>
  );
};

interface PactResponseModalProps {
  fromPlayerName: string;
  pactType: string;
  description: string;
  countryName?: string;
  onAccept: () => void;
  onReject: () => void;
}

export const PactResponseModal: React.FC<PactResponseModalProps> = ({
  fromPlayerName,
  pactType,
  description,
  countryName,
  onAccept,
  onReject,
}) => {
  const typeLabel = PACT_TYPES.find((t) => t.value === pactType)?.label || pactType;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-amber-700">
        <h3 className="text-lg font-bold text-amber-400 mb-1">Propuesta de Pacto</h3>
        <p className="text-sm text-gray-300 mb-4">
          {fromPlayerName} te propone un pacto de <strong className="text-white">{typeLabel}</strong>
        </p>

        <div className="bg-gray-700 rounded-lg p-3 mb-4">
          <p className="text-gray-200 text-sm">{description}</p>
          {countryName && (
            <p className="text-amber-300 text-sm mt-1">Territorio: {countryName}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
          >
            Rechazar
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PactProposalModal);
