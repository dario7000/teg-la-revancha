import React, { useRef, useEffect, useState, useCallback } from 'react';
import ChatInput from './ChatInput';

export interface GameLogEvent {
  timestamp: number;
  type: string;
  message: string;
  playerColor?: string;
}

export interface GameLogProps {
  events: GameLogEvent[];
  onSendChat?: (text: string, isDiplomacy: boolean) => void;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  attack: 'text-red-400',
  reinforce: 'text-green-400',
  trade: 'text-yellow-400',
  pact: 'text-blue-400',
  conquer: 'text-orange-400',
  eliminate: 'text-red-300',
  regroup: 'text-cyan-400',
  system: 'text-gray-400',
  card: 'text-purple-400',
  error: 'text-red-500',
  info: 'text-blue-300',
  turn: 'text-amber-400',
  chat: 'text-gray-300',
  diplomacy: 'text-amber-300',
};

function getEventColor(type: string): string {
  return EVENT_TYPE_COLORS[type] ?? 'text-gray-400';
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const GameLog: React.FC<GameLogProps> = React.memo(({ events, onSendChat }) => {
  const [collapsed, setCollapsed] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (scrollRef.current && !collapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length, collapsed]);

  return (
    <div
      className={`absolute right-2 top-2 z-20 flex flex-col transition-all duration-200 ${
        collapsed ? 'w-10' : 'w-[calc(100vw-4rem)] sm:w-64'
      }`}
    >
      {/* Header / toggle button */}
      <button
        onClick={toggleCollapsed}
        className="flex items-center justify-between bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-t-lg px-3 py-2 min-w-10 min-h-10 hover:bg-gray-750 transition-colors"
      >
        {!collapsed && (
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Registro
          </span>
        )}
        <span className="text-gray-400 text-sm">
          {collapsed ? '◀' : '▶'}
        </span>
      </button>

      {/* Event list */}
      {!collapsed && (
        <div
          ref={scrollRef}
          className={`bg-gray-900/90 backdrop-blur-sm border border-t-0 border-gray-700 overflow-y-auto max-h-80 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent ${
            onSendChat ? '' : 'rounded-b-lg'
          }`}
        >
          {events.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-gray-600">
              Sin eventos
            </div>
          )}
          {events.map((event, i) => (
            <div
              key={i}
              className="flex gap-2 px-3 py-1.5 border-b border-gray-800/50 last:border-b-0 hover:bg-gray-800/30"
            >
              {/* Timestamp */}
              <span className="text-[10px] sm:text-[9px] text-gray-600 font-mono shrink-0 pt-0.5">
                {formatTimestamp(event.timestamp)}
              </span>

              {/* Player color dot */}
              {event.playerColor && (
                <span
                  className="w-2 h-2 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: event.playerColor }}
                />
              )}

              {/* Message */}
              <span className={`text-xs sm:text-[11px] leading-tight ${getEventColor(event.type)}`}>
                {event.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chat input */}
      {!collapsed && onSendChat && (
        <div className="bg-gray-900/90 backdrop-blur-sm border border-t-0 border-gray-700 rounded-b-lg p-2">
          <ChatInput onSend={onSendChat} />
        </div>
      )}

      {/* Unread indicator when collapsed */}
      {collapsed && events.length > 0 && (
        <div className="bg-gray-900/90 border border-t-0 border-gray-700 rounded-b-lg px-2 py-1 text-center">
          <span className="text-[10px] text-gray-500">{events.length}</span>
        </div>
      )}
    </div>
  );
});

GameLog.displayName = 'GameLog';

export default GameLog;
