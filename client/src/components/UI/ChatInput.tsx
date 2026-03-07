import React, { useState, useCallback } from 'react';

export interface ChatInputProps {
  onSend: (text: string, isDiplomacy: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = React.memo(({ onSend }) => {
  const [text, setText] = useState('');
  const [isDiplomacy, setIsDiplomacy] = useState(false);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, isDiplomacy);
    setText('');
  }, [text, isDiplomacy, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const toggleDiplomacy = useCallback(() => {
    setIsDiplomacy((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col gap-1">
      {/* Diplomacy toggle */}
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isDiplomacy}
          onChange={toggleDiplomacy}
          className="w-3 h-3 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          Diplomacia
        </span>
      </label>

      {/* Input + send button */}
      <div className="flex gap-1">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="flex-1 min-w-0 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-[11px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
          maxLength={200}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 border border-gray-600 disabled:border-gray-700 rounded text-[11px] text-gray-300 transition-colors shrink-0"
          title="Enviar mensaje"
        >
          Enviar
        </button>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
