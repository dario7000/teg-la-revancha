import React, { useState } from 'react';

interface NameInputProps {
  initialName: string;
  onSubmit: (name: string) => void;
}

const NameInput: React.FC<NameInputProps> = ({ initialName, onSubmit }) => {
  const [name, setName] = useState(initialName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-8 w-full max-w-sm shadow-2xl border border-gray-700 text-center">
      <h1 className="text-3xl font-bold text-amber-400 mb-2">TEG La Revancha</h1>
      <p className="text-gray-400 mb-8">Online</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 text-left">
            Tu nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ingresa tu nombre"
            maxLength={20}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:text-gray-400 text-white text-lg font-semibold rounded-lg transition-colors"
        >
          Jugar
        </button>
      </form>
    </div>
  );
};

export default React.memo(NameInput);
