import React, { useMemo } from 'react';
import { BRIDGE_CONNECTIONS, MAP_DATA } from '../../utils/mapData';

export interface MapConnectionsProps {
  /** Optional: highlight specific connection pairs (e.g. during attack phase) */
  highlightedPairs?: Array<[string, string]>;
}

/**
 * Generate a straight-line SVG path between two country centers.
 */
function connectionPath(fromId: string, toId: string): string | null {
  const from = MAP_DATA[fromId];
  const to = MAP_DATA[toId];
  if (!from || !to) return null;
  return `M ${from.cx},${from.cy} L ${to.cx},${to.cy}`;
}

const MapConnections: React.FC<MapConnectionsProps> = ({ highlightedPairs }) => {
  const isHighlighted = (from: string, to: string): boolean => {
    if (!highlightedPairs) return false;
    return highlightedPairs.some(
      ([a, b]) => (a === from && b === to) || (a === to && b === from),
    );
  };

  const connections = useMemo(
    () =>
      BRIDGE_CONNECTIONS.map((bc) => ({
        from: bc.from,
        to: bc.to,
        path: connectionPath(bc.from, bc.to),
      })).filter((c): c is { from: string; to: string; path: string } => c.path !== null),
    [],
  );

  return (
    <g className="map-connections" pointerEvents="none">
      {connections.map(({ from, to, path }) => {
        const highlighted = isHighlighted(from, to);

        return (
          <path
            key={`${from}-${to}`}
            d={path}
            fill="none"
            stroke={highlighted ? '#FBBF24' : 'rgba(203, 213, 225, 0.35)'}
            strokeWidth={highlighted ? 2 : 1.2}
            strokeDasharray={highlighted ? '8 4' : '5 4'}
            strokeLinecap="round"
            opacity={highlighted ? 0.9 : 0.6}
          />
        );
      })}
    </g>
  );
};

export default React.memo(MapConnections);
