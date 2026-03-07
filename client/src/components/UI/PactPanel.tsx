import React, { useState, useCallback } from 'react';
import type { Pact, PactType } from '../../shared/types/Pacts';
import type { PublicPlayerInfo } from '../../store/gameStore';
import { PLAYER_COLORS } from '../../utils/colors';
import { getCountryDisplayName, CONTINENT_DISPLAY_NAMES } from '../../utils/colors';

// ── Type translations ────────────────────────────────────────────────────────

const PACT_TYPE_LABELS: Record<PactType, string> = {
  BETWEEN_COUNTRIES: 'Pacto entre paises',
  WITHIN_CONTINENT: 'Pacto continental',
  BETWEEN_CONTINENT_BORDERS: 'Pacto de fronteras',
  WORLDWIDE: 'Pacto mundial',
  INTERNATIONAL_ZONE: 'Zona Internacional',
  AGGRESSION_PACT: 'Pacto de agresion',
};

// ── Props ────────────────────────────────────────────────────────────────────

export interface PactPanelProps {
  pacts: Pact[];
  players: PublicPlayerInfo[];
  currentPlayerId: string | null;
  onBreakPact: (pactId: string) => void;
  onProposePact: () => void;
  onClose: () => void;
}

// ── Helper: pact detail description ──────────────────────────────────────────

function getPactDetails(pact: Pact): string {
  const details = pact.details;
  switch (details.type) {
    case 'BETWEEN_COUNTRIES':
      return `${getCountryDisplayName(details.countries[0])} - ${getCountryDisplayName(details.countries[1])}`;
    case 'WITHIN_CONTINENT':
      return CONTINENT_DISPLAY_NAMES[details.continent] ?? details.continent;
    case 'BETWEEN_CONTINENT_BORDERS': {
      const c1 = CONTINENT_DISPLAY_NAMES[details.continents[0]] ?? details.continents[0];
      const c2 = CONTINENT_DISPLAY_NAMES[details.continents[1]] ?? details.continents[1];
      return `${c1} - ${c2}`;
    }
    case 'WORLDWIDE':
      return 'Todos los territorios';
    case 'INTERNATIONAL_ZONE':
      return getCountryDisplayName(details.country);
    case 'AGGRESSION_PACT':
      return `Objetivo: ${getCountryDisplayName(details.target)}`;
    default:
      return '';
  }
}

// ── Component ────────────────────────────────────────────────────────────────

const PactPanel: React.FC<PactPanelProps> = ({
  pacts,
  players,
  currentPlayerId,
  onBreakPact,
  onProposePact,
  onClose,
}) => {
  const [confirmingBreak, setConfirmingBreak] = useState<string | null>(null);

  const activePacts = pacts.filter((p) => p.active);

  const getPlayer = useCallback(
    (id: string): PublicPlayerInfo | undefined =>
      players.find((p) => p.id === id),
    [players],
  );

  const getPlayerColorHex = useCallback(
    (id: string): string => {
      const player = getPlayer(id);
      if (!player?.color) return '#9CA3AF'; // gray fallback
      return PLAYER_COLORS[player.color] ?? '#9CA3AF';
    },
    [getPlayer],
  );

  const handleBreakClick = useCallback(
    (pactId: string) => {
      if (confirmingBreak === pactId) {
        // Second click: confirm
        onBreakPact(pactId);
        setConfirmingBreak(null);
      } else {
        // First click: ask confirmation
        setConfirmingBreak(pactId);
      }
    },
    [confirmingBreak, onBreakPact],
  );

  const handleCancelBreak = useCallback(() => {
    setConfirmingBreak(null);
  }, []);

  return (
    <div className="w-72 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-gray-800/60">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm font-bold text-gray-200">
            Pactos Activos
          </span>
          <span className="text-xs text-cyan-400 bg-cyan-900/40 px-1.5 py-0.5 rounded-full font-medium">
            {activePacts.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          title="Cerrar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Pact list ──────────────────────────────────────────────── */}
      <div className="max-h-64 overflow-y-auto">
        {activePacts.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <svg
              className="w-8 h-8 mx-auto text-gray-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            <p className="text-sm text-gray-500">No hay pactos activos</p>
          </div>
        ) : (
          activePacts.map((pact) => {
            const player1 = getPlayer(pact.players[0]);
            const player2 = getPlayer(pact.players[1]);
            const isMyPact = pact.players.includes(currentPlayerId ?? '');
            const pactLabel = PACT_TYPE_LABELS[pact.type] ?? pact.type;
            const detailText = getPactDetails(pact);
            const isConfirming = confirmingBreak === pact.id;

            return (
              <div
                key={pact.id}
                className={`px-4 py-3 border-b border-gray-800 last:border-b-0 transition-colors ${
                  isMyPact ? 'bg-cyan-950/30' : ''
                }`}
              >
                {/* Pact type label + break announced badge */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wide">
                    {pactLabel}
                  </span>
                  {pact.breakAnnounced && (
                    <span className="text-[9px] text-red-400 bg-red-900/40 px-1.5 py-0.5 rounded font-medium">
                      Rompiendose
                    </span>
                  )}
                </div>

                {/* Players involved */}
                <div className="flex items-center gap-1.5 text-xs mb-1">
                  <span
                    className="font-medium"
                    style={{ color: getPlayerColorHex(pact.players[0]) }}
                  >
                    {player1?.name ?? pact.players[0].slice(0, 8)}
                  </span>
                  <span className="text-gray-500">&harr;</span>
                  <span
                    className="font-medium"
                    style={{ color: getPlayerColorHex(pact.players[1]) }}
                  >
                    {player2?.name ?? pact.players[1].slice(0, 8)}
                  </span>
                </div>

                {/* Pact details (scope) */}
                {detailText && (
                  <div className="text-[10px] text-gray-400 mb-1.5">
                    {detailText}
                  </div>
                )}

                {/* Break pact button (only for pacts the player is part of) */}
                {isMyPact && !pact.breakAnnounced && (
                  <div className="flex items-center gap-2 mt-1.5">
                    {isConfirming ? (
                      <>
                        <span className="text-[10px] text-red-300">Confirmar?</span>
                        <button
                          onClick={() => handleBreakClick(pact.id)}
                          className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white text-[10px] rounded border border-red-600 transition-colors font-medium"
                        >
                          Si, romper
                        </button>
                        <button
                          onClick={handleCancelBreak}
                          className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded border border-gray-600 transition-colors"
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleBreakClick(pact.id)}
                        className="px-2.5 py-1 bg-red-900/50 hover:bg-red-800/70 text-red-300 hover:text-red-200 text-[10px] rounded border border-red-700/40 transition-colors"
                      >
                        Romper Pacto
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer: Propose pact button ────────────────────────────── */}
      <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/40">
        <button
          onClick={onProposePact}
          className="w-full px-3 py-2 bg-amber-700/60 hover:bg-amber-600/70 text-amber-200 hover:text-amber-100 text-xs font-medium rounded-lg border border-amber-700/50 transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Proponer Pacto
        </button>
      </div>
    </div>
  );
};

export default React.memo(PactPanel);
