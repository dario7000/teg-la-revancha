import React from 'react';
import { getCountryDisplayName, CONTINENT_DISPLAY_NAMES } from '../../utils/colors';

export interface CountryLabelProps {
  countryId: string;
  cx: number;
  cy: number;
  visible: boolean;
  armies: number;
  missiles: number;
  continent: string;
}

/**
 * Tooltip-style label that appears when hovering over a country on the map.
 * Shows the country name, continent, army count, and missile count.
 */
const CountryLabel: React.FC<CountryLabelProps> = ({
  countryId,
  cx,
  cy,
  visible,
  armies,
  missiles,
  continent,
}) => {
  if (!visible) return null;

  const name = getCountryDisplayName(countryId);
  const continentName = CONTINENT_DISPLAY_NAMES[continent] || continent;

  // Position the tooltip above the country center
  const tooltipX = cx;
  const tooltipY = cy - 28;

  const lines = [
    name,
    continentName,
    `Armies: ${armies}`,
  ];
  if (missiles > 0) {
    lines.push(`Missiles: ${missiles}`);
  }

  const lineHeight = 11;
  const padding = 6;
  const boxWidth = 90;
  const boxHeight = lines.length * lineHeight + padding * 2;

  return (
    <g pointerEvents="none">
      {/* Background rectangle */}
      <rect
        x={tooltipX - boxWidth / 2}
        y={tooltipY - boxHeight}
        width={boxWidth}
        height={boxHeight}
        rx={4}
        ry={4}
        fill="rgba(26, 32, 44, 0.92)"
        stroke="#4A5568"
        strokeWidth={0.8}
      />
      {/* Text lines */}
      {lines.map((line, i) => (
        <text
          key={i}
          x={tooltipX}
          y={tooltipY - boxHeight + padding + (i + 0.7) * lineHeight}
          textAnchor="middle"
          dominantBaseline="central"
          fill={i === 0 ? '#F7FAFC' : '#CBD5E0'}
          fontSize={i === 0 ? 8 : 7}
          fontWeight={i === 0 ? 'bold' : 'normal'}
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

export default React.memo(CountryLabel);
