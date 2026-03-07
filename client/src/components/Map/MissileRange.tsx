import React, { useId } from 'react';
import { MAP_DATA } from '../../utils/mapData';
import { getMissileDamage } from '../../utils/missileRange';

// =============================================================================
// MissileRange - SVG overlay showing missile range when firing
//
// Renders semi-transparent colored overlays on enemy countries within range:
//   - Distance 1 (3 damage): red overlay
//   - Distance 2 (2 damage): orange overlay
//   - Distance 3 (1 damage): yellow overlay
//
// Also displays a damage badge on each country in range.
// =============================================================================

export interface MissileRangeProps {
  /** Countries at distance 1 (adjacent) - 3 damage */
  distance1: string[];
  /** Countries at distance 2 (1 country between) - 2 damage */
  distance2: string[];
  /** Countries at distance 3 (2 countries between) - 1 damage */
  distance3: string[];
}

// Colors and opacities per distance
const RANGE_STYLES: Record<number, { fill: string; stroke: string; fillOpacity: number }> = {
  1: { fill: '#ef4444', stroke: '#dc2626', fillOpacity: 0.35 },  // red - 3 damage
  2: { fill: '#f97316', stroke: '#ea580c', fillOpacity: 0.30 },  // orange - 2 damage
  3: { fill: '#eab308', stroke: '#ca8a04', fillOpacity: 0.25 },  // yellow - 1 damage
};

const MissileRange: React.FC<MissileRangeProps> = ({
  distance1,
  distance2,
  distance3,
}) => {
  const uniqueId = useId();

  const renderOverlay = (countryIds: string[], distance: number) => {
    const style = RANGE_STYLES[distance];
    if (!style || countryIds.length === 0) return null;
    const damage = getMissileDamage(distance);

    return countryIds.map((countryId) => {
      const data = MAP_DATA[countryId];
      if (!data) return null;

      return (
        <g key={`missile-range-${uniqueId}-${countryId}`} pointerEvents="none">
          {/* Colored overlay on the country path */}
          <path
            d={data.path}
            fill={style.fill}
            fillOpacity={style.fillOpacity}
            stroke={style.stroke}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeDasharray="6 3"
          >
            {/* Pulsing animation */}
            <animate
              attributeName="fill-opacity"
              values={`${style.fillOpacity};${style.fillOpacity * 0.5};${style.fillOpacity}`}
              dur="1.5s"
              repeatCount="indefinite"
            />
          </path>

          {/* Damage badge */}
          <g>
            {/* Badge background circle */}
            <circle
              cx={data.cx}
              cy={data.cy - 28}
              r={11}
              fill={style.fill}
              stroke="#1a1a2e"
              strokeWidth={1.5}
              opacity={0.9}
            />
            {/* Damage number */}
            <text
              x={data.cx}
              y={data.cy - 28}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#FFFFFF"
              fontSize={11}
              fontWeight="bold"
              fontFamily="monospace"
            >
              -{damage}
            </text>
          </g>
        </g>
      );
    });
  };

  return (
    <g className="missile-range-overlay">
      {/* Render distance 3 first (bottom), then 2, then 1 (top) so closer = more prominent */}
      {renderOverlay(distance3, 3)}
      {renderOverlay(distance2, 2)}
      {renderOverlay(distance1, 1)}
    </g>
  );
};

export default React.memo(MissileRange);
