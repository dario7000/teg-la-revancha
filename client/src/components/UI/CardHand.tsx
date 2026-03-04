import React, { useCallback } from 'react';
import { CountryCard, CardSymbol } from '@shared/types/Cards';
import { getCountryDisplayName } from '../../utils/colors';

export interface CardHandProps {
  cards: CountryCard[];
  selectedCards: Set<number>;
  onCardToggle: (index: number) => void;
  onTrade: () => void;
  canTrade: boolean;
}

const SYMBOL_ICONS: Record<CardSymbol, string> = {
  AVION: '\u2708',      // ✈
  TANQUE: '\u2B21',     // ⬡
  GRANADA: '\uD83D\uDCA3', // 💣
  BARCO: '\uD83D\uDEA2',   // 🚢
  SOLDADOS: '\u2B50',   // ⭐
};

const SYMBOL_BG_COLORS: Record<CardSymbol, string> = {
  AVION: '#1E3A5F',
  TANQUE: '#3B1F2B',
  GRANADA: '#2D3319',
  BARCO: '#1A3333',
  SOLDADOS: '#3D3310',
};

function isWildcard(card: CountryCard): boolean {
  return card.symbols.includes('SOLDADOS');
}

function isSuperTarjeta(card: CountryCard): boolean {
  return card.symbols.length >= 3;
}

function getPrimarySymbol(card: CountryCard): CardSymbol {
  // Prefer non-SOLDADOS symbol for background coloring, fallback to first
  return card.symbols.find((s) => s !== 'SOLDADOS') ?? card.symbols[0] ?? 'SOLDADOS';
}

const CardItem: React.FC<{
  card: CountryCard;
  index: number;
  isSelected: boolean;
  onToggle: (index: number) => void;
}> = React.memo(({ card, index, isSelected, onToggle }) => {
  const primary = getPrimarySymbol(card);
  const bgColor = SYMBOL_BG_COLORS[primary];
  const wildcard = isWildcard(card);
  const superCard = isSuperTarjeta(card);

  const handleClick = useCallback(() => {
    onToggle(index);
  }, [onToggle, index]);

  let borderClass = 'border-gray-600';
  let borderStyle: React.CSSProperties = {};

  if (isSelected) {
    borderClass = 'border-yellow-400';
    borderStyle = { boxShadow: '0 0 10px rgba(250, 204, 21, 0.5)' };
  } else if (superCard) {
    borderClass = 'border-transparent';
    borderStyle = {
      backgroundImage:
        'linear-gradient(135deg, #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #8800ff)',
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box',
      border: '2px solid transparent',
    };
  } else if (wildcard) {
    borderClass = 'border-yellow-500';
    borderStyle = { boxShadow: '0 0 6px rgba(234, 179, 8, 0.3)' };
  }

  return (
    <button
      onClick={handleClick}
      className={`
        relative flex-shrink-0 w-28 h-40 rounded-xl border-2 overflow-hidden
        cursor-pointer transition-all duration-150 hover:-translate-y-1 hover:shadow-xl
        ${borderClass}
        ${isSelected ? '-translate-y-2' : ''}
      `}
      style={borderStyle}
    >
      {/* Super-tarjeta rainbow gradient overlay */}
      {superCard && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none rounded-xl"
          style={{
            background:
              'linear-gradient(135deg, #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #8800ff)',
          }}
        />
      )}

      {/* Card background */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: bgColor }}
      />

      {/* Wildcard gold shimmer */}
      {wildcard && !superCard && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #ffd700 0%, transparent 50%, #ffd700 100%)',
          }}
        />
      )}

      {/* Card content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-2 px-1.5">
        {/* Country name */}
        <span className="text-[10px] font-semibold text-gray-200 text-center leading-tight">
          {getCountryDisplayName(card.country)}
        </span>

        {/* Symbols */}
        <div className="flex gap-1 text-xl">
          {card.symbols.map((symbol, sIdx) => (
            <span key={sIdx} title={symbol}>
              {SYMBOL_ICONS[symbol]}
            </span>
          ))}
        </div>

        {/* Symbol type label */}
        <span className="text-[9px] text-gray-400 uppercase tracking-wider">
          {wildcard ? 'Comodin' : primary.toLowerCase()}
        </span>
      </div>

      {/* Selected check overlay */}
      {isSelected && (
        <div className="absolute top-1 right-1 z-20 bg-yellow-400 text-gray-900 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">
          ✓
        </div>
      )}
    </button>
  );
});
CardItem.displayName = 'CardItem';

const CardHand: React.FC<CardHandProps> = React.memo(
  ({ cards, selectedCards, onCardToggle, onTrade, canTrade }) => {
    if (cards.length === 0) return null;

    const selectedCount = selectedCards.size;

    return (
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-gray-900/90 backdrop-blur-sm border-t border-gray-700 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Cards scroll area */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-2 pb-1">
                {cards.map((card, index) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    index={index}
                    isSelected={selectedCards.has(index)}
                    onToggle={onCardToggle}
                  />
                ))}
              </div>
            </div>

            {/* Trade button */}
            <div className="flex flex-col items-center gap-1 shrink-0 ml-2">
              <button
                onClick={onTrade}
                disabled={!canTrade || selectedCount < 3}
                className={`
                  px-4 py-2 rounded-lg font-semibold text-sm transition-all
                  ${
                    canTrade && selectedCount >= 3
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-500/20'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Canjear
              </button>
              {selectedCount > 0 && (
                <span className="text-[10px] text-gray-400">
                  {selectedCount} seleccionadas
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

CardHand.displayName = 'CardHand';

export default CardHand;
