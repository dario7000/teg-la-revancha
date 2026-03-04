import React, { useState, useCallback, useId } from 'react';
import { getCountryDisplayName } from '../../utils/colors';

export interface CountryProps {
  id: string;
  path: string;              // SVG path d attribute
  cx: number;                // center X of the country (used for label & army badge positioning)
  cy: number;                // center Y of the country
  continentColor: string;    // default continent tint color
  ownerColor: string | null; // player color if owned, null if unowned
  armies: number;
  missiles: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isBlocked: boolean;
  isCondominium?: boolean;   // true if territory has a co-owner
  coOwnerColor?: string;     // co-owner player color (for condominium)
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * Lighten a hex color by a given amount (0-1).
 */
function lightenColor(hex: string, amount: number): string {
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  const num = parseInt(hex.replace('#', ''), 16);
  const r = clamp(((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = clamp(((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = clamp((num & 0xff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const Country: React.FC<CountryProps> = ({
  id,
  path,
  cx,
  cy,
  continentColor,
  ownerColor,
  armies,
  missiles,
  isSelected,
  isHighlighted,
  isBlocked,
  isCondominium,
  coOwnerColor,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [hovered, setHovered] = useState(false);
  const uniqueId = useId();
  const patternId = `blocked-${uniqueId}`;

  // Derive positions from center coordinates
  const labelX = cx;
  const labelY = cy - 8;
  const armyX = cx;
  const armyY = cy + 6;

  // Derive fill color: use ownerColor if owned, otherwise continent default
  const fillColor = ownerColor || continentColor;

  // Get display name from id
  const name = getCountryDisplayName(id);

  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    onMouseEnter?.();
  }, [onMouseEnter]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    onMouseLeave?.();
  }, [onMouseLeave]);

  // Determine visual fill
  const activeFill = hovered ? lightenColor(fillColor, 0.12) : fillColor;
  const strokeColor = isSelected
    ? '#FBBF24'
    : hovered
      ? lightenColor(fillColor, 0.3)
      : lightenColor(fillColor, 0.15);
  const strokeWidth = isSelected ? 2.5 : hovered ? 1.8 : 0.8;

  // Army badge sizing
  const armyR = armies >= 100 ? 13 : 11;
  const armyFontSize = armies >= 100 ? 7 : armies >= 10 ? 8.5 : 10;

  return (
    <g
      className="country-group"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'pointer' }}
      data-country-id={id}
    >
      {/* Blocked diagonal stripes pattern definition */}
      {isBlocked && (
        <defs>
          <pattern
            id={patternId}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0" y1="0" x2="0" y2="6"
              stroke="rgba(220, 38, 38, 0.5)"
              strokeWidth="2"
            />
          </pattern>
        </defs>
      )}

      {/* Country shape */}
      <path
        d={path}
        fill={activeFill}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Condominium: half-fill overlay for co-owner */}
      {isCondominium && coOwnerColor && (
        <path
          d={path}
          fill={coOwnerColor}
          fillOpacity={0.35}
          stroke="none"
          pointerEvents="none"
        />
      )}

      {/* Selected glow effect */}
      {isSelected && (
        <path
          d={path}
          fill="none"
          stroke="#FBBF24"
          strokeWidth={3.5}
          strokeLinejoin="round"
          opacity={0.5}
          pointerEvents="none"
          filter="url(#glow)"
        />
      )}

      {/* Highlighted pulsing border */}
      {isHighlighted && (
        <path
          d={path}
          fill="rgba(72, 187, 120, 0.25)"
          stroke="#48BB78"
          strokeWidth={2}
          strokeLinejoin="round"
          pointerEvents="none"
        >
          <animate
            attributeName="stroke-opacity"
            values="1;0.3;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>
      )}

      {/* Blocked: diagonal stripes overlay */}
      {isBlocked && (
        <path
          d={path}
          fill={`url(#${patternId})`}
          stroke="#E53E3E"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          strokeLinejoin="round"
          pointerEvents="none"
        />
      )}

      {/* Country name label */}
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize={6.5}
        fontWeight="600"
        fontFamily="system-ui, -apple-system, sans-serif"
        pointerEvents="none"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7)' } as React.CSSProperties}
      >
        <tspan stroke="#000000" strokeWidth={2.5} strokeLinejoin="round" paintOrder="stroke">
          {name}
        </tspan>
      </text>

      {/* Army count badge */}
      {armies > 0 && (
        <g pointerEvents="none">
          {/* Shadow */}
          <circle
            cx={armyX + 0.5}
            cy={armyY + 0.5}
            r={armyR + 0.5}
            fill="rgba(0,0,0,0.4)"
          />
          {/* Badge background */}
          <circle
            cx={armyX}
            cy={armyY}
            r={armyR}
            fill="#FFFFFF"
            stroke="#1A202C"
            strokeWidth={1.5}
          />
          {/* Army number */}
          <text
            x={armyX}
            y={armyY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#1A202C"
            fontSize={armyFontSize}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {armies}
          </text>
        </g>
      )}

      {/* Missile indicator */}
      {missiles > 0 && (
        <g pointerEvents="none">
          {/* Missile badge positioned to the upper-right of army badge */}
          <circle
            cx={armyX + 14}
            cy={armyY - 10}
            r={6.5}
            fill="#DC2626"
            stroke="#1A202C"
            strokeWidth={1}
          />
          {/* Rocket icon (small triangle/arrow pointing up) */}
          <polygon
            points={`${armyX + 14},${armyY - 14} ${armyX + 11.5},${armyY - 8} ${armyX + 16.5},${armyY - 8}`}
            fill="#FFFFFF"
          />
          {/* Missile count if > 1 */}
          {missiles > 1 && (
            <text
              x={armyX + 22}
              y={armyY - 10}
              textAnchor="start"
              dominantBaseline="central"
              fill="#DC2626"
              fontSize={7}
              fontWeight="bold"
              fontFamily="monospace"
            >
              x{missiles}
            </text>
          )}
        </g>
      )}
    </g>
  );
};

export default React.memo(Country);
