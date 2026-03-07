import React, { useState, useCallback, useRef, useEffect } from 'react';
import Country from './Country';
import type { MissileImpactData } from './Country';
import MapConnections from './MapConnections';
import MissileRange from './MissileRange';
import type { MissileRangeProps } from './MissileRange';
import {
  MAP_COUNTRIES,
  CONTINENT_COLORS,
  CONTINENT_LABELS,
} from '../../utils/mapData';
import {
  useMapEditor,
  MapEditorSvgLayer,
  MapEditorPanel,
  MapEditorToggleButton,
} from './MapEditor';
import {
  getCountryDisplayName,
  CONTINENT_DISPLAY_NAMES,
} from '../../utils/colors';

// ============================================================
// Player color mapping
// ============================================================

export const PLAYER_COLORS: Record<string, string> = {
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

/** Data for the animated missile launch line between two countries */
export interface MissileLaunchLineData {
  fromCountryId: string;
  toCountryId: string;
  timestamp: number;
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
  /** Mapping from player socket ID to hex color code */
  playerColors?: Record<string, string>;
  /** Missile range overlay data (when player is in missile firing mode) */
  missileRange?: MissileRangeProps | null;
  /** Mapping from player color key to player display name (for tooltips) */
  playerNames?: Record<string, string>;
  /** Active missile impact data (for explosion effect on target country) */
  missileImpact?: MissileImpactData | null;
  /** Active missile launch line (animated line from source to target) */
  missileLaunchLine?: MissileLaunchLineData | null;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_VIEWBOX = { x: 0, y: 0, w: 2688, h: 1568 };
const MIN_W = 672;
const MIN_H = 392;
const MAX_W = 2688;
const MAX_H = 1568;
const PAN_MARGIN = 300;

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
  playerColors = {},
  missileRange = null,
  playerNames = {},
  missileImpact = null,
  missileLaunchLine = null,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    countryId: string;
    x: number;
    y: number;
  } | null>(null);

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

  // -- Missile launch line animation state --
  const [showLaunchLine, setShowLaunchLine] = useState(false);
  const lastLaunchTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (missileLaunchLine && missileLaunchLine.timestamp !== lastLaunchTimestampRef.current) {
      lastLaunchTimestampRef.current = missileLaunchLine.timestamp;
      setShowLaunchLine(true);
      const timer = setTimeout(() => setShowLaunchLine(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [missileLaunchLine]);

  // Convert screen coords to SVG coords using getScreenCTM for accurate mapping
  const screenToSVG = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const CTM = svg.getScreenCTM();
      if (!CTM) return { x: 0, y: 0 };
      return {
        x: (clientX - CTM.e) / CTM.a,
        y: (clientY - CTM.f) / CTM.d,
      };
    },
    [],
  );

  // Clamp viewBox to valid bounds
  const clampViewBox = useCallback((vb: typeof DEFAULT_VIEWBOX) => ({
    x: Math.max(-PAN_MARGIN, Math.min(MAX_W - vb.w + PAN_MARGIN, vb.x)),
    y: Math.max(-PAN_MARGIN, Math.min(MAX_H - vb.h + PAN_MARGIN, vb.y)),
    w: vb.w,
    h: vb.h,
  }), []);

  // ── Map Editor ────────────────────────────────────────────────
  const editor = useMapEditor(screenToSVG, svgRef, phase);

  // Mouse wheel zoom (centered on cursor) - only when editor is OFF or no country selected
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // When editor is on and a country is selected, let editor handle scroll for scaling
      if (editor.editorEnabled && editor.state.selectedCountryId) return;

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
    [screenToSVG, clampViewBox, editor.editorEnabled, editor.state.selectedCountryId],
  );

  // Pan with any mouse button drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (editor.editorEnabled) return; // editor handles mouse events
      // Allow pan on middle-click or right-click, or left-click on empty space
      if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        panViewBoxStartRef.current = { x: viewBox.x, y: viewBox.y };
      }
    },
    [viewBox.x, viewBox.y, editor.editorEnabled],
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

  // Reset zoom with double-click (only when editor is off)
  const handleDoubleClick = useCallback(() => {
    if (editor.editorEnabled) return;
    setViewBox(DEFAULT_VIEWBOX);
  }, [editor.editorEnabled]);

  // ── Touch support ──────────────────────────────────────────────
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (editor.editorEnabled) return;
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
    [viewBox, editor.editorEnabled],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (editor.editorEnabled) return;
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
    [isPanning, viewBox.w, viewBox.h, clampViewBox, editor.editorEnabled],
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    touchesRef.current = [];
    initialPinchDistRef.current = 0;
  }, []);

  // Tooltip mouse tracking: update position on mouse move over container
  const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltip((prev) => {
      if (!prev) return prev;
      return { ...prev, x: e.clientX, y: e.clientY };
    });
  }, []);

  // Country hover handlers for tooltip
  const handleCountryMouseEnter = useCallback(
    (countryId: string, e?: React.MouseEvent) => {
      if (editor.editorEnabled) return;
      setTooltip({
        countryId,
        x: 0,
        y: 0,
      });
    },
    [editor.editorEnabled],
  );

  const handleCountryMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  // Prevent default scroll on the SVG element for wheel events
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const preventDefault = (e: WheelEvent) => {
      // Only prevent default if editor is not handling it
      if (!editor.editorEnabled || !editor.state.selectedCountryId) {
        e.preventDefault();
      }
    };
    svg.addEventListener('wheel', preventDefault, { passive: false });
    return () => svg.removeEventListener('wheel', preventDefault);
  }, [editor.editorEnabled, editor.state.selectedCountryId]);

  return (
    <div
      ref={containerRef}
      className="game-map-container"
      onMouseMove={handleContainerMouseMove}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        border: editor.editorEnabled ? '3px solid #FF4444' : 'none',
        boxSizing: 'border-box',
      }}
    >
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

        </defs>

        {/* ── Dark background ──────────────────────────────────── */}
        <rect
          x={-PAN_MARGIN}
          y={-PAN_MARGIN}
          width={MAX_W + PAN_MARGIN * 2}
          height={MAX_H + PAN_MARGIN * 2}
          fill="#0a1628"
        />

        {/* ── Background map image ────────────────────────────── */}
        <image
          href="/map-background.png"
          xlinkHref="/map-background.png"
          x={0}
          y={0}
          width={2688}
          height={1568}
          preserveAspectRatio="xMidYMid meet"
          style={{ pointerEvents: 'none' }}
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

          // Determine owner color: check playerColors (socket ID -> hex) first,
          // then fall back to PLAYER_COLORS (color name -> hex), then null
          const ownerColor = ownerKey
            ? playerColors[ownerKey] || PLAYER_COLORS[ownerKey] || null
            : null;
          const coOwnerColor = territory?.coOwner
            ? playerColors[territory.coOwner] || PLAYER_COLORS[territory.coOwner] || undefined
            : undefined;

          // When editor is enabled, use the overridden path and army position
          const countryPath = editor.editorEnabled
            ? editor.getPathForCountry(country.id)
            : country.path;
          const armyPos = editor.editorEnabled
            ? editor.getArmyPosForCountry(country.id)
            : { x: country.armyX, y: country.armyY };

          return (
            <Country
              key={country.id}
              id={country.id}
              path={countryPath}
              cx={armyPos.x}
              cy={armyPos.y}
              continentColor={CONTINENT_COLORS[country.continent] || '#4A5568'}
              ownerColor={ownerColor}
              armies={territory?.armies ?? 0}
              missiles={territory?.missiles ?? 0}
              isSelected={!editor.editorEnabled && selectedCountry === country.id}
              isHighlighted={!editor.editorEnabled && highlightedSet.has(country.id)}
              isBlocked={territory?.isBlocked ?? false}
              isCondominium={!!territory?.coOwner}
              coOwnerColor={coOwnerColor}
              missileImpact={missileImpact?.country === country.id ? missileImpact : null}
              onClick={() => {
                if (!editor.editorEnabled) {
                  onCountryClick(country.id);
                }
              }}
              onMouseEnter={() => handleCountryMouseEnter(country.id)}
              onMouseLeave={handleCountryMouseLeave}
            />
          );
        })}

        {/* ── Missile range overlay (on top of countries, below editor) ── */}
        {missileRange && (
          <MissileRange
            distance1={missileRange.distance1}
            distance2={missileRange.distance2}
            distance3={missileRange.distance3}
          />
        )}

        {/* ── Missile launch line (animated arc from source to target) ── */}
        {showLaunchLine && missileLaunchLine && (() => {
          const fromCountry = MAP_COUNTRIES.find((c) => c.id === missileLaunchLine.fromCountryId);
          const toCountry = MAP_COUNTRIES.find((c) => c.id === missileLaunchLine.toCountryId);
          if (!fromCountry || !toCountry) return null;
          const x1 = fromCountry.armyX;
          const y1 = fromCountry.armyY;
          const x2 = toCountry.armyX;
          const y2 = toCountry.armyY;
          // Create an arc by offsetting the midpoint upward
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          const arcHeight = Math.min(dist * 0.3, 120);
          const controlY = midY - arcHeight;
          const pathD = `M${x1},${y1} Q${midX},${controlY} ${x2},${y2}`;
          const pathLength = dist * 1.3; // approximate arc length

          return (
            <g pointerEvents="none">
              {/* Glow trail behind the missile line */}
              <path
                d={pathD}
                fill="none"
                stroke="#FF6B00"
                strokeWidth={6}
                opacity={0.3}
                strokeLinecap="round"
              >
                <animate
                  attributeName="opacity"
                  values="0.3;0.1;0"
                  dur="1.2s"
                  fill="freeze"
                  repeatCount="1"
                />
              </path>
              {/* Main missile trail line with dash animation */}
              <path
                d={pathD}
                fill="none"
                stroke="#FF4444"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={`${pathLength}`}
                strokeDashoffset={`${pathLength}`}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values={`${pathLength};0`}
                  dur="0.6s"
                  fill="freeze"
                  repeatCount="1"
                />
                <animate
                  attributeName="opacity"
                  values="1;1;0"
                  dur="1.2s"
                  fill="freeze"
                  repeatCount="1"
                />
              </path>
              {/* Bright leading dot that travels along the path */}
              <circle r={5} fill="#FFDD44" opacity={0.9}>
                <animateMotion
                  path={pathD}
                  dur="0.6s"
                  fill="freeze"
                  repeatCount="1"
                />
                <animate
                  attributeName="opacity"
                  values="0.9;0.9;0"
                  dur="0.8s"
                  fill="freeze"
                  repeatCount="1"
                />
                <animate
                  attributeName="r"
                  values="5;3;0"
                  dur="0.8s"
                  fill="freeze"
                  repeatCount="1"
                />
              </circle>
            </g>
          );
        })()}

        {/* ── Editor SVG layer (on top of countries) ─────────── */}
        {editor.editorEnabled && (
          <MapEditorSvgLayer
            state={editor.state}
            getPathForCountry={editor.getPathForCountry}
            onMouseDown={editor.handleEditorMouseDown}
            onMouseMove={editor.handleEditorMouseMove}
            onMouseUp={editor.handleEditorMouseUp}
            onDoubleClick={editor.handleEditorDoubleClick}
          />
        )}
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
      {phase && !editor.editorEnabled && (
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

      {/* ── Editor mode indicator (top-left, when editor is on) ── */}
      {editor.editorEnabled && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: 'rgba(255, 68, 68, 0.9)',
            color: '#FFFFFF',
            padding: '4px 12px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            pointerEvents: 'none',
            zIndex: 10,
            fontFamily: 'monospace',
          }}
        >
          MODO EDITOR
        </div>
      )}

      {/* ── Editor panel or toggle button (hidden during gameplay) ── */}
      {editor.editorEnabled ? (
        <MapEditorPanel
          state={editor.state}
          onExport={editor.handleExport}
          onToggle={editor.toggleEditor}
        />
      ) : (
        !editor.isGameplayPhase && (
          <MapEditorToggleButton onClick={editor.toggleEditor} />
        )
      )}

      {/* ── Country tooltip on hover ─────────────────────────── */}
      {tooltip && !editor.editorEnabled && (() => {
        const countryData = MAP_COUNTRIES.find((c) => c.id === tooltip.countryId);
        const territory = territories[tooltip.countryId];
        if (!countryData) return null;
        const ownerKey = territory?.owner || '';
        const ownerName = ownerKey
          ? playerNames[ownerKey] || ownerKey
          : 'Sin dueño';
        const ownerHex = ownerKey
          ? playerColors[ownerKey] || PLAYER_COLORS[ownerKey] || '#9CA3AF'
          : '#9CA3AF';
        const continentName = CONTINENT_DISPLAY_NAMES[countryData.continent] || countryData.continent;
        const displayName = getCountryDisplayName(tooltip.countryId);

        return (
          <div
            style={{
              position: 'fixed',
              left: tooltip.x + 14,
              top: tooltip.y - 10,
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              color: '#F3F4F6',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: 1.6,
              pointerEvents: 'none',
              zIndex: 50,
              border: '1px solid rgba(75, 85, 99, 0.6)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              maxWidth: 220,
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
              {displayName}
            </div>
            <div style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 4 }}>
              {continentName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: ownerHex,
                  border: '1px solid rgba(255,255,255,0.3)',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: ownerHex, fontWeight: 600 }}>{ownerName}</span>
            </div>
            <div style={{ color: '#D1D5DB' }}>
              Ejércitos: <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{territory?.armies ?? 0}</span>
            </div>
            {(territory?.missiles ?? 0) > 0 && (
              <div style={{ color: '#FCA5A5' }}>
                Misiles: <span style={{ fontWeight: 700, color: '#EF4444' }}>{territory!.missiles}</span>
              </div>
            )}
            {territory?.isBlocked && (
              <div style={{ color: '#F87171', fontWeight: 600, marginTop: 2 }}>
                BLOQUEADO
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default GameMap;
