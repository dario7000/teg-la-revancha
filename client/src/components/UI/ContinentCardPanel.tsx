import React, { useCallback } from 'react';
import type { ContinentCardState } from '../../shared/types/Cards';
import type { ContinentId } from '../../shared/types/GameState';

export interface ContinentCardPanelProps {
  /** All continent card states from the game */
  continentCards: Record<string, ContinentCardState> | null;
  /** The current player's ID */
  playerId: string | null;
  /** Whether the player can currently use continent cards (REINFORCE or TRADE phase + it's their turn) */
  canUse: boolean;
  /** Callback when a continent card is selected for trade use */
  onUseContinentCard: (continentId: ContinentId) => void;
  /** Set of continent IDs currently selected for trade */
  selectedContinentCards: Set<string>;
}

/** Display names in Spanish for each continent */
const CONTINENT_DISPLAY_NAMES: Record<string, string> = {
  AMERICA_DEL_NORTE: 'America del Norte',
  AMERICA_CENTRAL: 'America Central',
  AMERICA_DEL_SUR: 'America del Sur',
  EUROPA: 'Europa',
  ASIA: 'Asia',
  AFRICA: 'Africa',
  OCEANIA: 'Oceania',
};

/** Trade equivalence descriptions in Spanish */
const TRADE_EQUIVALENCE_TEXT: Record<string, string> = {
  AMERICA_DEL_NORTE: 'Canje completo',
  EUROPA: 'Canje completo',
  ASIA: 'Canje completo',
  AMERICA_DEL_SUR: 'Avion + Tanque',
  AFRICA: 'Avion + Barco',
  AMERICA_CENTRAL: '1 Tanque',
  OCEANIA: '1 Barco',
};

/** Background colors for each continent card */
const CONTINENT_COLORS: Record<string, string> = {
  AMERICA_DEL_NORTE: '#1a3a5c',
  AMERICA_CENTRAL: '#2d4a1e',
  AMERICA_DEL_SUR: '#4a2d1e',
  EUROPA: '#3b1f4a',
  ASIA: '#4a3b1e',
  AFRICA: '#1e3b3b',
  OCEANIA: '#1e2d4a',
};

/** Border accent colors for each continent card */
const CONTINENT_BORDER_COLORS: Record<string, string> = {
  AMERICA_DEL_NORTE: '#3b82f6',
  AMERICA_CENTRAL: '#22c55e',
  AMERICA_DEL_SUR: '#f97316',
  EUROPA: '#a855f7',
  ASIA: '#eab308',
  AFRICA: '#14b8a6',
  OCEANIA: '#6366f1',
};

/** Icons/emoji for each continent */
const CONTINENT_ICONS: Record<string, string> = {
  AMERICA_DEL_NORTE: '\uD83C\uDDFA\uD83C\uDDF8',
  AMERICA_CENTRAL: '\uD83C\uDF0E',
  AMERICA_DEL_SUR: '\uD83C\uDDE7\uD83C\uDDF7',
  EUROPA: '\uD83C\uDDEA\uD83C\uDDFA',
  ASIA: '\uD83C\uDDEF\uD83C\uDDF5',
  AFRICA: '\uD83C\uDF0D',
  OCEANIA: '\uD83C\uDDE6\uD83C\uDDFA',
};

const ContinentCardItem: React.FC<{
  continentId: string;
  card: ContinentCardState;
  isHeldByMe: boolean;
  isUsedByMe: boolean;
  canUse: boolean;
  isSelected: boolean;
  onUse: (continentId: ContinentId) => void;
}> = React.memo(({ continentId, card, isHeldByMe, isUsedByMe, canUse, isSelected, onUse }) => {
  const handleClick = useCallback(() => {
    if (isHeldByMe && !isUsedByMe && canUse) {
      onUse(continentId as ContinentId);
    }
  }, [continentId, isHeldByMe, isUsedByMe, canUse, onUse]);

  const displayName = CONTINENT_DISPLAY_NAMES[continentId] ?? continentId;
  const equivalenceText = TRADE_EQUIVALENCE_TEXT[continentId] ?? '';
  const bgColor = CONTINENT_COLORS[continentId] ?? '#1e1e2e';
  const borderColor = CONTINENT_BORDER_COLORS[continentId] ?? '#555';
  const isDisabled = !isHeldByMe || isUsedByMe;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled || !canUse}
      className={`
        relative flex-shrink-0 w-36 h-28 rounded-xl border-2 overflow-hidden
        transition-all duration-150
        ${isSelected ? '-translate-y-1 shadow-lg' : ''}
        ${isDisabled ? 'opacity-40 cursor-not-allowed' : canUse ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl' : 'cursor-default'}
      `}
      style={{
        backgroundColor: bgColor,
        borderColor: isSelected ? '#facc15' : isDisabled ? '#555' : borderColor,
        boxShadow: isSelected ? `0 0 12px ${borderColor}80` : undefined,
      }}
    >
      {/* Used overlay (strikethrough) */}
      {isUsedByMe && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="bg-red-900/70 text-red-300 text-xs font-bold px-2 py-1 rounded rotate-[-12deg]">
            USADA
          </div>
        </div>
      )}

      {/* Card content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-2 px-2">
        {/* Continent name */}
        <span className="text-[11px] font-bold text-gray-100 text-center leading-tight">
          {displayName}
        </span>

        {/* Equivalence */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-gray-300 text-center leading-tight">
            Equivale a:
          </span>
          <span
            className="text-[11px] font-semibold text-center leading-tight"
            style={{ color: borderColor }}
          >
            {equivalenceText}
          </span>
        </div>

        {/* Status label */}
        <span className="text-[9px] text-gray-400 uppercase tracking-wider">
          {isUsedByMe ? 'Agotada' : isHeldByMe ? 'Disponible' : 'No controlado'}
        </span>
      </div>

      {/* Selected check */}
      {isSelected && (
        <div className="absolute top-1 right-1 z-20 bg-yellow-400 text-gray-900 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">
          \u2713
        </div>
      )}
    </button>
  );
});
ContinentCardItem.displayName = 'ContinentCardItem';

const ALL_CONTINENTS: string[] = [
  'AMERICA_DEL_NORTE',
  'AMERICA_CENTRAL',
  'AMERICA_DEL_SUR',
  'EUROPA',
  'ASIA',
  'AFRICA',
  'OCEANIA',
];

const ContinentCardPanel: React.FC<ContinentCardPanelProps> = React.memo(
  ({ continentCards, playerId, canUse, onUseContinentCard, selectedContinentCards }) => {
    if (!continentCards || !playerId) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 w-full max-w-2xl">
          <h3 className="text-sm font-bold text-gray-300 mb-2">Cartas de Continente</h3>
          <p className="text-xs text-gray-500">No tienes cartas de continente</p>
        </div>
      );
    }

    // Find continent cards held by the current player
    const myCards = ALL_CONTINENTS.filter(
      (cId) => continentCards[cId as ContinentId]?.heldBy === playerId,
    );

    // Also include cards that were held and used by me (to show them as greyed out)
    const usedByMe = ALL_CONTINENTS.filter(
      (cId) =>
        continentCards[cId as ContinentId]?.usedBy?.includes(playerId) &&
        continentCards[cId as ContinentId]?.heldBy !== playerId,
    );

    const allRelevant = [...new Set([...myCards, ...usedByMe])];

    if (allRelevant.length === 0) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 w-full max-w-2xl">
          <h3 className="text-sm font-bold text-gray-300 mb-2">Cartas de Continente</h3>
          <p className="text-xs text-gray-500">No tienes cartas de continente</p>
        </div>
      );
    }

    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 w-full max-w-2xl">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Cartas de Continente</h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allRelevant.map((cId) => {
            const card = continentCards[cId as ContinentId];
            if (!card) return null;
            const isHeldByMe = card.heldBy === playerId;
            const isUsedByMe = card.usedBy?.includes(playerId) ?? false;
            return (
              <ContinentCardItem
                key={cId}
                continentId={cId}
                card={card}
                isHeldByMe={isHeldByMe}
                isUsedByMe={isUsedByMe}
                canUse={canUse}
                isSelected={selectedContinentCards.has(cId)}
                onUse={onUseContinentCard}
              />
            );
          })}
        </div>
        {canUse && myCards.some((cId) => !(continentCards[cId as ContinentId]?.usedBy?.includes(playerId))) && (
          <p className="text-[10px] text-gray-500 mt-2">
            Selecciona cartas de continente para usar en tu proximo canje. Se combinan con tus cartas de pais.
          </p>
        )}
      </div>
    );
  },
);

ContinentCardPanel.displayName = 'ContinentCardPanel';

export default ContinentCardPanel;
