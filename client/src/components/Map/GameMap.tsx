import React, { useState, useCallback, useRef, useEffect } from 'react';
import Country from './Country';
import MapConnections from './MapConnections';
import {
  MAP_COUNTRIES,
  CONTINENT_COLORS,
  CONTINENT_LABELS,
} from '../../utils/mapData';
// colors utility is used by Country.tsx for display names

// ============================================================
// Player color mapping
// ============================================================

const PLAYER_COLORS: Record<string, string> = {
  RED: '#dc2626',
  BLUE: '#2563eb',
  YELLOW: '#eab308',
  GREEN: '#16a34a',
  BLACK: '#1e1e2e',
  WHITE: '#f0f0f0',
};

// ============================================================
// Types
// ============================================================

export interface TerritoryState {
  owner: string;        // player color key (e.g. 'RED', 'BLUE') or '' for unowned
  armies: number;
  missiles: number;
  isBlocked: boolean;
  coOwner?: string;     // for condominium territories
}

export interface GameMapProps {
  /** Map of countryId -> territory state */
  territories: Record<string, TerritoryState>;
  /** Called when a country is clicked */
  onCountryClick: (countryId: string) => void;
  /** Currently selected country (bright border) */
  selectedCountry: string | null;
  /** Countries to highlight (valid targets, etc.) */
  highlightedCountries: string[];
  /** Current game phase (for visual hints) */
  phase: string;
  /** Optional bridge connections to highlight */
  highlightedConnections?: Array<[string, string]>;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_VIEWBOX = { x: 0, y: 0, w: 1600, h: 900 };
const MIN_W = 400;
const MIN_H = 225;
const MAX_W = 1600;
const MAX_H = 900;
const PAN_MARGIN = 200;

// ============================================================
// Component
// ============================================================

const GameMap: React.FC<GameMapProps> = ({
  territories,
  onCountryClick,
  selectedCountry,
  highlightedCountries,
  phase,
  highlightedConnections,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Zoom & pan state
  const [viewBox, setViewBox] = useState(DEFAULT_VIEWBOX);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panViewBoxStartRef = useRef({ x: 0, y: 0 });

  // Touch state for pinch-zoom
  const touchesRef = useRef<React.Touch[]>([]);
  const initialPinchDistRef = useRef<number>(0);
  const initialPinchViewBoxRef = useRef(DEFAULT_VIEWBOX);

  const highlightedSet = new Set(highlightedCountries);

  // Convert screen coords to SVG coords
  const screenToSVG = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.w,
        y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.h,
      };
    },
    [viewBox],
  );

  // Clamp viewBox to valid bounds
  const clampViewBox = useCallback((vb: typeof DEFAULT_VIEWBOX) => ({
    x: Math.max(-PAN_MARGIN, Math.min(MAX_W - vb.w + PAN_MARGIN, vb.x)),
    y: Math.max(-PAN_MARGIN, Math.min(MAX_H - vb.h + PAN_MARGIN, vb.y)),
    w: vb.w,
    h: vb.h,
  }), []);

  // Mouse wheel zoom (centered on cursor)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      const pt = screenToSVG(e.clientX, e.clientY);

      setViewBox((prev) => {
        const newW = Math.max(MIN_W, Math.min(MAX_W, prev.w * zoomFactor));
        const newH = Math.max(MIN_H, Math.min(MAX_H, prev.h * zoomFactor));
        const newX = pt.x - ((pt.x - prev.x) / prev.w) * newW;
        const newY = pt.y - ((pt.y - prev.y) / prev.h) * newH;

        return clampViewBox({ x: newX, y: newY, w: newW, h: newH });
      });
    },
    [screenToSVG, clampViewBox],
  );

  // Pan with any mouse button drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Allow pan on middle-click or right-click, or left-click on empty space
      if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        panViewBoxStartRef.current = { x: viewBox.x, y: viewBox.y };
      }
    },
    [viewBox.x, viewBox.y],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = ((e.clientX - panStartRef.current.x) / rect.width) * viewBox.w;
      const dy = ((e.clientY - panStartRef.current.y) / rect.height) * viewBox.h;
      setViewBox((prev) =>
        clampViewBox({
          ...prev,
          x: panViewBoxStartRef.current.x - dx,
          y: panViewBoxStartRef.current.y - dy,
        }),
      );
    },
    [isPanning, viewBox.w, viewBox.h, clampViewBox],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Prevent context menu on SVG
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Reset zoom with double-click
  const handleDoubleClick = useCallback(() => {
    setViewBox(DEFAULT_VIEWBOX);
  }, []);

  // ── Touch support ──────────────────────────────────────────────
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch = pan
        setIsPanning(true);
        panStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        panViewBoxStartRef.current = { x: viewBox.x, y: viewBox.y };
      } else if (e.touches.length === 2) {
        // Pinch = zoom
        e.preventDefault();
        touchesRef.current = [e.touches[0], e.touches[1]];
        initialPinchDistRef.current = getTouchDistance(e.touches[0], e.touches[1]);
        initialPinchViewBoxRef.current = { ...viewBox };
      }
    },
    [viewBox],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isPanning) {
        // Pan
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const dx = ((e.touches[0].clientX - panStartRef.current.x) / rect.width) * viewBox.w;
        const dy = ((e.touches[0].clientY - panStartRef.current.y) / rect.height) * viewBox.h;
        setViewBox((prev) =>
          clampViewBox({
            ...prev,
            x: panViewBoxStartRef.current.x - dx,
            y: panViewBoxStartRef.current.y - dy,
          }),
        );
      } else if (e.touches.length === 2) {
        // Pinch zoom
        e.preventDefault();
        const dist = getTouchDistance(e.touches[0], e.touches[1]);
        if (initialPinchDistRef.current === 0) return;

        const scale = initialPinchDistRef.current / dist;
        const initVB = initialPinchViewBoxRef.current;
        const newW = Math.max(MIN_W, Math.min(MAX_W, initVB.w * scale));
        const newH = Math.max(MIN_H, Math.min(MAX_H, initVB.h * scale));

        // Center pinch on the midpoint of the two fingers
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const svgMidX = initVB.x + ((midX - rect.left) / rect.width) * initVB.w;
        const svgMidY = initVB.y + ((midY - rect.top) / rect.height) * initVB.h;

        const newX = svgMidX - ((svgMidX - initVB.x) / initVB.w) * newW;
        const newY = svgMidY - ((svgMidY - initVB.y) / initVB.h) * newH;

        setViewBox(clampViewBox({ x: newX, y: newY, w: newW, h: newH }));
      }
    },
    [isPanning, viewBox.w, viewBox.h, clampViewBox],
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    touchesRef.current = [];
    initialPinchDistRef.current = 0;
  }, []);

  // Prevent default scroll on the SVG element for wheel events
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const preventDefault = (e: WheelEvent) => e.preventDefault();
    svg.addEventListener('wheel', preventDefault, { passive: false });
    return () => svg.removeEventListener('wheel', preventDefault);
  }, []);

  return (
    <div className="game-map-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          userSelect: 'none',
          touchAction: 'none',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* ── SVG Definitions ──────────────────────────────────── */}
        <defs>
          {/* Glow filter for selected country */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial gradient for ocean background */}
          <radialGradient id="ocean-gradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0F2744" />
            <stop offset="100%" stopColor="#080F1A" />
          </radialGradient>

          {/* Subtle ocean wave pattern */}
          <pattern id="ocean-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect width="80" height="80" fill="transparent" />
            <circle cx="40" cy="40" r="0.6" fill="#1A365D" opacity="0.2" />
            <circle cx="10" cy="10" r="0.4" fill="#1A365D" opacity="0.15" />
            <circle cx="70" cy="20" r="0.3" fill="#1A365D" opacity="0.15" />
          </pattern>
        </defs>

        {/* ── Ocean background ─────────────────────────────────── */}
        <rect
          x={-PAN_MARGIN}
          y={-PAN_MARGIN}
          width={MAX_W + PAN_MARGIN * 2}
          height={MAX_H + PAN_MARGIN * 2}
          fill="url(#ocean-gradient)"
        />
        <rect
          x={-PAN_MARGIN}
          y={-PAN_MARGIN}
          width={MAX_W + PAN_MARGIN * 2}
          height={MAX_H + PAN_MARGIN * 2}
          fill="url(#ocean-pattern)"
        />

        {/* ── Continent labels (behind countries) ──────────────── */}
        {CONTINENT_LABELS.map((label) => (
          <text
            key={`continent-label-${label.id}`}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            fill={CONTINENT_COLORS[label.id] || '#CBD5E0'}
            fontSize={14}
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="3"
            opacity={0.18}
            pointerEvents="none"
          >
            {label.name.toUpperCase()}
          </text>
        ))}

        {/* ── Sea connections (dashed lines) ────────────────────── */}
        <MapConnections
          highlightedPairs={highlightedConnections}
        />

        {/* ── Countries ────────────────────────────────────────── */}
        {MAP_COUNTRIES.map((country) => {
          const territory = territories[country.id];
          const ownerKey = territory?.owner;

          // Determine owner color: player color if owned, null if unowned
          const ownerColor = ownerKey
            ? PLAYER_COLORS[ownerKey] || ownerKey
            : null;
          const coOwnerColor = territory?.coOwner
            ? PLAYER_COLORS[territory.coOwner] || territory.coOwner
            : undefined;

          return (
            <Country
              key={country.id}
              id={country.id}
              path={country.path}
              cx={country.armyX}
              cy={country.armyY}
              continentColor={CONTINENT_COLORS[country.continent] || '#4A5568'}
              ownerColor={ownerColor}
              armies={territory?.armies ?? 0}
              missiles={territory?.missiles ?? 0}
              isSelected={selectedCountry === country.id}
              isHighlighted={highlightedSet.has(country.id)}
              isBlocked={territory?.isBlocked ?? false}
              isCondominium={!!territory?.coOwner}
              coOwnerColor={coOwnerColor}
              onClick={() => onCountryClick(country.id)}
            />
          );
        })}
      </svg>

      {/* ── Zoom controls overlay ────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          zIndex: 10,
        }}
      >
        <button
          onClick={() =>
            setViewBox((prev) => {
              const newW = Math.max(MIN_W, prev.w * 0.8);
              const newH = Math.max(MIN_H, prev.h * 0.8);
              const cx = prev.x + prev.w / 2;
              const cy = prev.y + prev.h / 2;
              return clampViewBox({ x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH });
            })
          }
          style={{
            width: 32,
            height: 32,
            backgroundColor: '#2D3748',
            color: '#CBD5E0',
            border: '1px solid #4A5568',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() =>
            setViewBox((prev) => {
              const newW = Math.min(MAX_W, prev.w * 1.25);
              const newH = Math.min(MAX_H, prev.h * 1.25);
              const cx = prev.x + prev.w / 2;
              const cy = prev.y + prev.h / 2;
              return clampViewBox({ x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH });
            })
          }
          style={{
            width: 32,
            height: 32,
            backgroundColor: '#2D3748',
            color: '#CBD5E0',
            border: '1px solid #4A5568',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Zoom out"
        >
          -
        </button>
        <button
          onClick={() => setViewBox(DEFAULT_VIEWBOX)}
          style={{
            width: 32,
            height: 32,
            backgroundColor: '#2D3748',
            color: '#CBD5E0',
            border: '1px solid #4A5568',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Reset zoom"
        >
          FIT
        </button>
      </div>

      {/* ── Phase indicator ──────────────────────────────────── */}
      {phase && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: '#2D3748',
            color: '#CBD5E0',
            padding: '4px 10px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            border: '1px solid #4A5568',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {phase}
        </div>
      )}
    </div>
  );
};

export default GameMap;
