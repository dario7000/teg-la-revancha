import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MAP_COUNTRIES, MapCountryData } from '../../utils/mapData';

// =============================================================================
// Types
// =============================================================================

export interface EditorState {
  selectedCountryId: string | null;
  editingVertices: boolean;
  dragging: boolean;
  dragStartPoint: { x: number; y: number } | null;
  polygonOverrides: Record<string, [number, number][]>;
  activeVertexIndex: number | null;
  labelOverrides: Record<
    string,
    { labelX: number; labelY: number; armyX: number; armyY: number }
  >;
}

// =============================================================================
// Utility: Parse SVG path "d" string into an array of [x,y] points
// =============================================================================

export function pathToPoints(pathD: string): [number, number][] {
  const points: [number, number][] = [];
  const regex = /[ML]\s*([\d.\-]+)\s+([\d.\-]+)/g;
  let match;
  while ((match = regex.exec(pathD)) !== null) {
    points.push([parseFloat(match[1]), parseFloat(match[2])]);
  }
  return points;
}

export function pointsToPath(points: [number, number][]): string {
  return (
    points
      .map(
        (p, i) =>
          `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(0)} ${p[1].toFixed(0)}`,
      )
      .join(' ') + ' Z'
  );
}

// =============================================================================
// Compute centroid of a polygon
// =============================================================================

function computeCentroid(points: [number, number][]): { x: number; y: number } {
  let sumX = 0;
  let sumY = 0;
  for (const [px, py] of points) {
    sumX += px;
    sumY += py;
  }
  return { x: sumX / points.length, y: sumY / points.length };
}

// =============================================================================
// useMapEditor hook - manages all editor state and logic
// =============================================================================

// Gameplay phases where the editor must NOT be active
const GAMEPLAY_PHASES = new Set([
  'SETUP_DISTRIBUTE', 'SETUP_PLACE_8', 'SETUP_PLACE_4', 'PLAYING', 'FINISHED',
]);

export function useMapEditor(
  screenToSVG: (clientX: number, clientY: number) => { x: number; y: number },
  svgRef: React.RefObject<SVGSVGElement | null>,
  gamePhase?: string,
) {
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [state, setState] = useState<EditorState>({
    selectedCountryId: null,
    editingVertices: false,
    dragging: false,
    dragStartPoint: null,
    polygonOverrides: {},
    activeVertexIndex: null,
    labelOverrides: {},
  });

  // Determine if we are in a gameplay phase where the editor must be blocked
  const isGameplayPhase = !!(gamePhase && GAMEPLAY_PHASES.has(gamePhase));

  // Auto-disable editor when entering a gameplay phase
  useEffect(() => {
    if (isGameplayPhase && editorEnabled) {
      setEditorEnabled(false);
    }
  }, [isGameplayPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const stateRef = useRef(state);
  stateRef.current = state;
  const editorEnabledRef = useRef(editorEnabled);
  editorEnabledRef.current = editorEnabled;

  // Helper to update state AND ref synchronously (avoids React 18 batching delay)
  const setStateImmediate = useCallback((updater: (prev: EditorState) => EditorState) => {
    setState((prev) => {
      const next = updater(prev);
      stateRef.current = next;
      return next;
    });
  }, []);

  // Initialize overrides from MAP_COUNTRIES on first mount
  useEffect(() => {
    const overrides: Record<string, [number, number][]> = {};
    const labels: Record<
      string,
      { labelX: number; labelY: number; armyX: number; armyY: number }
    > = {};
    for (const c of MAP_COUNTRIES) {
      overrides[c.id] = pathToPoints(c.path);
      labels[c.id] = {
        labelX: c.labelX,
        labelY: c.labelY,
        armyX: c.armyX,
        armyY: c.armyY,
      };
    }
    setState((prev) => ({
      ...prev,
      polygonOverrides: overrides,
      labelOverrides: labels,
    }));
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getPointsForCountry = useCallback(
    (countryId: string): [number, number][] => {
      if (stateRef.current.polygonOverrides[countryId]) {
        return stateRef.current.polygonOverrides[countryId];
      }
      const country = MAP_COUNTRIES.find((c) => c.id === countryId);
      return country ? pathToPoints(country.path) : [];
    },
    [],
  );

  const pointInPolygon = useCallback(
    (px: number, py: number, points: [number, number][]): boolean => {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i][0],
          yi = points[i][1];
        const xj = points[j][0],
          yj = points[j][1];
        const intersect =
          yi > py !== yj > py &&
          px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    },
    [],
  );

  const findCountryAtPoint = useCallback(
    (px: number, py: number): string | null => {
      for (let i = MAP_COUNTRIES.length - 1; i >= 0; i--) {
        const c = MAP_COUNTRIES[i];
        const pts = getPointsForCountry(c.id);
        if (pointInPolygon(px, py, pts)) return c.id;
      }
      return null;
    },
    [getPointsForCountry, pointInPolygon],
  );

  // ── Get path for a country (with overrides) ─────────────────────────────

  const getPathForCountry = useCallback(
    (countryId: string): string => {
      const pts = state.polygonOverrides[countryId];
      if (pts && pts.length > 0) return pointsToPath(pts);
      const country = MAP_COUNTRIES.find((c) => c.id === countryId);
      return country?.path || '';
    },
    [state.polygonOverrides],
  );

  const getArmyPosForCountry = useCallback(
    (countryId: string): { x: number; y: number } => {
      const lbl = state.labelOverrides[countryId];
      if (lbl) return { x: lbl.armyX, y: lbl.armyY };
      const country = MAP_COUNTRIES.find((c) => c.id === countryId);
      return country ? { x: country.armyX, y: country.armyY } : { x: 0, y: 0 };
    },
    [state.labelOverrides],
  );

  // ── Toggle editor ───────────────────────────────────────────────────────

  // Keep a ref for isGameplayPhase so event handlers always see latest value
  const isGameplayPhaseRef = useRef(isGameplayPhase);
  isGameplayPhaseRef.current = isGameplayPhase;

  const toggleEditor = useCallback(() => {
    // Block enabling editor during gameplay
    if (isGameplayPhaseRef.current) return;
    setEditorEnabled((prev) => !prev);
  }, []);

  // ── Scale (mouse wheel) ─────────────────────────────────────────────────

  const handleEditorWheel = useCallback(
    (e: WheelEvent) => {
      if (!editorEnabledRef.current) return;
      const s = stateRef.current;
      if (!s.selectedCountryId) return;

      e.preventDefault();
      e.stopPropagation();

      const factor = e.deltaY > 0 ? 0.95 : 1.05;
      const points = getPointsForCountry(s.selectedCountryId);
      const centroid = computeCentroid(points);

      const newPoints: [number, number][] = points.map(([px, py]) => [
        centroid.x + (px - centroid.x) * factor,
        centroid.y + (py - centroid.y) * factor,
      ]);

      setStateImmediate((prev) => ({
        ...prev,
        polygonOverrides: {
          ...prev.polygonOverrides,
          [s.selectedCountryId!]: newPoints,
        },
      }));
    },
    [getPointsForCountry, setStateImmediate],
  );

  // ── Keyboard shortcuts ──────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // "E" key toggles editor mode (unless typing in an input or during gameplay)
      if (
        (e.key === 'e' || e.key === 'E') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        // Block enabling editor during gameplay; always allow disabling
        if (!editorEnabledRef.current && isGameplayPhaseRef.current) return;
        setEditorEnabled((prev) => !prev);
        return;
      }

      if (!editorEnabledRef.current) return;
      const s = stateRef.current;

      if (e.key === 'Escape') {
        if (s.editingVertices) {
          setStateImmediate((prev) => ({
            ...prev,
            editingVertices: false,
            activeVertexIndex: null,
          }));
        } else {
          setStateImmediate((prev) => ({ ...prev, selectedCountryId: null }));
        }
        return;
      }

      // +/- keys for scale
      if (s.selectedCountryId && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        const factor = 1.05;
        const points = getPointsForCountry(s.selectedCountryId);
        const centroid = computeCentroid(points);
        const newPoints: [number, number][] = points.map(([px, py]) => [
          centroid.x + (px - centroid.x) * factor,
          centroid.y + (py - centroid.y) * factor,
        ]);
        setStateImmediate((prev) => ({
          ...prev,
          polygonOverrides: {
            ...prev.polygonOverrides,
            [s.selectedCountryId!]: newPoints,
          },
        }));
        return;
      }

      if (s.selectedCountryId && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        const factor = 0.95;
        const points = getPointsForCountry(s.selectedCountryId);
        const centroid = computeCentroid(points);
        const newPoints: [number, number][] = points.map(([px, py]) => [
          centroid.x + (px - centroid.x) * factor,
          centroid.y + (py - centroid.y) * factor,
        ]);
        setStateImmediate((prev) => ({
          ...prev,
          polygonOverrides: {
            ...prev.polygonOverrides,
            [s.selectedCountryId!]: newPoints,
          },
        }));
        return;
      }

      // R key -> rotate
      if (s.selectedCountryId && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        const angleDeg = e.shiftKey ? -5 : 5;
        const angleRad = (angleDeg * Math.PI) / 180;
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);
        const points = getPointsForCountry(s.selectedCountryId);
        const centroid = computeCentroid(points);
        const newPoints: [number, number][] = points.map(([px, py]) => {
          const dx = px - centroid.x;
          const dy = py - centroid.y;
          return [
            centroid.x + dx * cosA - dy * sinA,
            centroid.y + dx * sinA + dy * cosA,
          ];
        });
        setStateImmediate((prev) => ({
          ...prev,
          polygonOverrides: {
            ...prev.polygonOverrides,
            [s.selectedCountryId!]: newPoints,
          },
        }));
        return;
      }
    },
    [getPointsForCountry, setStateImmediate],
  );

  // ── Attach/detach global listeners ──────────────────────────────────────

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener('wheel', handleEditorWheel, { passive: false });
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (svg) {
        svg.removeEventListener('wheel', handleEditorWheel);
      }
    };
  }, [handleKeyDown, handleEditorWheel, svgRef]);

  // ── SVG mouse event handlers ────────────────────────────────────────────

  const handleEditorMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const svgPt = screenToSVG(e.clientX, e.clientY);
      const s = stateRef.current;

      // If in vertex editing mode, check if we clicked a vertex
      if (s.editingVertices && s.selectedCountryId) {
        const points = getPointsForCountry(s.selectedCountryId);
        const VERTEX_HIT_RADIUS = 12;
        for (let i = 0; i < points.length; i++) {
          const dx = svgPt.x - points[i][0];
          const dy = svgPt.y - points[i][1];
          if (dx * dx + dy * dy < VERTEX_HIT_RADIUS * VERTEX_HIT_RADIUS) {
            setStateImmediate((prev) => ({
              ...prev,
              activeVertexIndex: i,
              dragging: true,
              dragStartPoint: { x: svgPt.x, y: svgPt.y },
            }));
            return;
          }
        }
        // Clicked outside vertices -> exit vertex mode
        setStateImmediate((prev) => ({
          ...prev,
          editingVertices: false,
          activeVertexIndex: null,
        }));
        return;
      }

      // Check if we clicked a country
      const countryId = findCountryAtPoint(svgPt.x, svgPt.y);
      if (countryId) {
        setStateImmediate((prev) => ({
          ...prev,
          selectedCountryId: countryId,
          dragging: true,
          dragStartPoint: { x: svgPt.x, y: svgPt.y },
          editingVertices: false,
          activeVertexIndex: null,
        }));
      } else {
        setStateImmediate((prev) => ({
          ...prev,
          selectedCountryId: null,
          editingVertices: false,
          activeVertexIndex: null,
        }));
      }
    },
    [screenToSVG, findCountryAtPoint, getPointsForCountry, setStateImmediate],
  );

  const handleEditorMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const s = stateRef.current;
      if (!s.dragging || !s.dragStartPoint || !s.selectedCountryId) return;

      e.stopPropagation();
      const svgPt = screenToSVG(e.clientX, e.clientY);
      const dx = svgPt.x - s.dragStartPoint.x;
      const dy = svgPt.y - s.dragStartPoint.y;

      if (s.editingVertices && s.activeVertexIndex !== null) {
        // Dragging a single vertex
        const points = getPointsForCountry(s.selectedCountryId);
        const newPoints: [number, number][] = points.map((p, i) => {
          if (i === s.activeVertexIndex) {
            return [p[0] + dx, p[1] + dy];
          }
          return p;
        });

        setStateImmediate((prev) => ({
          ...prev,
          polygonOverrides: {
            ...prev.polygonOverrides,
            [s.selectedCountryId!]: newPoints,
          },
          dragStartPoint: { x: svgPt.x, y: svgPt.y },
        }));
      } else {
        // Dragging entire country
        const points = getPointsForCountry(s.selectedCountryId);
        const newPoints: [number, number][] = points.map(([px, py]) => [
          px + dx,
          py + dy,
        ]);

        const labels = s.labelOverrides[s.selectedCountryId] || {
          labelX: 0,
          labelY: 0,
          armyX: 0,
          armyY: 0,
        };

        setStateImmediate((prev) => ({
          ...prev,
          polygonOverrides: {
            ...prev.polygonOverrides,
            [s.selectedCountryId!]: newPoints,
          },
          labelOverrides: {
            ...prev.labelOverrides,
            [s.selectedCountryId!]: {
              labelX: labels.labelX + dx,
              labelY: labels.labelY + dy,
              armyX: labels.armyX + dx,
              armyY: labels.armyY + dy,
            },
          },
          dragStartPoint: { x: svgPt.x, y: svgPt.y },
        }));
      }
    },
    [screenToSVG, getPointsForCountry, setStateImmediate],
  );

  const handleEditorMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setStateImmediate((prev) => ({
      ...prev,
      dragging: false,
      dragStartPoint: null,
      activeVertexIndex: null,
    }));
  }, [setStateImmediate]);

  const handleEditorDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const svgPt = screenToSVG(e.clientX, e.clientY);
      const s = stateRef.current;

      const countryId = findCountryAtPoint(svgPt.x, svgPt.y);
      if (countryId) {
        if (s.selectedCountryId === countryId && s.editingVertices) {
          setStateImmediate((prev) => ({
            ...prev,
            editingVertices: false,
            activeVertexIndex: null,
          }));
        } else {
          setStateImmediate((prev) => ({
            ...prev,
            selectedCountryId: countryId,
            editingVertices: true,
            activeVertexIndex: null,
          }));
        }
      }
    },
    [screenToSVG, findCountryAtPoint, setStateImmediate],
  );

  // ── Export ───────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const s = stateRef.current;
    const lines: string[] = [];

    const continentOrder = [
      'AMERICA_DEL_NORTE',
      'AMERICA_CENTRAL',
      'AMERICA_DEL_SUR',
      'EUROPA',
      'ASIA',
      'AFRICA',
      'OCEANIA',
    ];

    const continentNames: Record<string, string> = {
      AMERICA_DEL_NORTE: 'AMERICA DEL NORTE',
      AMERICA_CENTRAL: 'AMERICA CENTRAL',
      AMERICA_DEL_SUR: 'AMERICA DEL SUR',
      EUROPA: 'EUROPA',
      ASIA: 'ASIA',
      AFRICA: 'AFRICA',
      OCEANIA: 'OCEANIA',
    };

    for (const continent of continentOrder) {
      const countriesInContinent = MAP_COUNTRIES.filter(
        (c) => c.continent === continent,
      );
      if (countriesInContinent.length === 0) continue;

      lines.push('');
      lines.push(
        `// =============================================================================`,
      );
      lines.push(
        `// ${continentNames[continent]} (${countriesInContinent.length} countries)`,
      );
      lines.push(
        `// =============================================================================`,
      );
      lines.push('');
      lines.push(`const ${continent}: MapCountryData[] = [`);

      for (const country of countriesInContinent) {
        const pts =
          s.polygonOverrides[country.id] || pathToPoints(country.path);
        const pathStr = pointsToPath(pts);
        const lbl = s.labelOverrides[country.id] || {
          labelX: country.labelX,
          labelY: country.labelY,
          armyX: country.armyX,
          armyY: country.armyY,
        };

        lines.push(`  {`);
        lines.push(`    id: '${country.id}',`);
        lines.push(`    name: '${country.name}',`);
        lines.push(`    continent: '${country.continent}',`);
        lines.push(`    path: '${pathStr}',`);
        lines.push(`    labelX: ${Math.round(lbl.labelX)},`);
        lines.push(`    labelY: ${Math.round(lbl.labelY)},`);
        lines.push(`    armyX: ${Math.round(lbl.armyX)},`);
        lines.push(`    armyY: ${Math.round(lbl.armyY)},`);
        lines.push(`  },`);
      }

      lines.push(`];`);
    }

    const output = lines.join('\n');

    console.log('=== MAP EDITOR EXPORT ===');
    console.log(output);

    navigator.clipboard
      .writeText(output)
      .then(() => {
        alert(
          'Exported! Data copied to clipboard and logged to console.\nPaste directly into mapData.ts.',
        );
      })
      .catch(() => {
        alert(
          'Exported to console (clipboard copy failed). Check developer console for the output.',
        );
      });
  }, []);

  return {
    editorEnabled,
    isGameplayPhase,
    toggleEditor,
    state,
    getPathForCountry,
    getArmyPosForCountry,
    // SVG event handlers
    handleEditorMouseDown,
    handleEditorMouseMove,
    handleEditorMouseUp,
    handleEditorDoubleClick,
    // Export
    handleExport,
  };
}

// =============================================================================
// MapEditorSvgLayer - renders inside the <svg> element
// =============================================================================

export interface MapEditorSvgLayerProps {
  state: EditorState;
  getPathForCountry: (countryId: string) => string;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
}

export const MapEditorSvgLayer: React.FC<MapEditorSvgLayerProps> = ({
  state,
  getPathForCountry,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onDoubleClick,
}) => {
  const selectedPoints = state.selectedCountryId
    ? state.polygonOverrides[state.selectedCountryId] || []
    : [];

  return (
    <g className="map-editor-svg-layer">
      {/* Invisible full-area rect to capture mouse events */}
      <rect
        x={-300}
        y={-300}
        width={3288}
        height={2168}
        fill="transparent"
        pointerEvents="all"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDoubleClick}
        style={{ cursor: state.dragging ? 'grabbing' : 'default' }}
      />

      {/* Editor outlines for all countries */}
      {MAP_COUNTRIES.map((country) => {
        const path = getPathForCountry(country.id);
        const isSelected = state.selectedCountryId === country.id;
        const isDragging =
          isSelected && state.dragging && !state.editingVertices;

        return (
          <path
            key={`editor-outline-${country.id}`}
            d={path}
            fill="transparent"
            stroke={
              isDragging
                ? '#FBBF24'
                : isSelected
                  ? '#FF4444'
                  : 'rgba(255,255,255,0.5)'
            }
            strokeWidth={isSelected ? 2.5 : 1.5}
            strokeLinejoin="round"
            pointerEvents="none"
          />
        );
      })}

      {/* Vertex editing: edges and vertex circles */}
      {state.editingVertices && state.selectedCountryId && (
        <>
          {selectedPoints.map(([px, py], idx) => {
            const next =
              selectedPoints[(idx + 1) % selectedPoints.length];
            return (
              <line
                key={`edge-${idx}`}
                x1={px}
                y1={py}
                x2={next[0]}
                y2={next[1]}
                stroke="#FF4444"
                strokeWidth={1}
                strokeDasharray="4 2"
                pointerEvents="none"
              />
            );
          })}
          {selectedPoints.map(([px, py], idx) => (
            <circle
              key={`vertex-${idx}`}
              cx={px}
              cy={py}
              r={8}
              fill={
                state.activeVertexIndex === idx ? '#FF4444' : '#FFFFFF'
              }
              stroke={
                state.activeVertexIndex === idx ? '#FFFFFF' : '#FF4444'
              }
              strokeWidth={2}
              pointerEvents="none"
            />
          ))}
        </>
      )}
    </g>
  );
};

// =============================================================================
// MapEditorPanel - HTML overlay (renders outside <svg>, in the container div)
// =============================================================================

export interface MapEditorPanelProps {
  state: EditorState;
  onExport: () => void;
  onToggle: () => void;
}

export const MapEditorPanel: React.FC<MapEditorPanelProps> = ({
  state,
  onExport,
  onToggle,
}) => {
  const selectedCountry = state.selectedCountryId
    ? MAP_COUNTRIES.find((c) => c.id === state.selectedCountryId)
    : null;
  const selectedPoints = state.selectedCountryId
    ? state.polygonOverrides[state.selectedCountryId] || []
    : [];

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 50,
        backgroundColor: 'rgba(20, 20, 30, 0.92)',
        border: '2px solid #FF4444',
        borderRadius: 8,
        padding: 12,
        color: '#FFFFFF',
        fontFamily: 'monospace',
        fontSize: 12,
        zIndex: 20,
        minWidth: 220,
        maxWidth: 320,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          borderBottom: '1px solid #FF4444',
          paddingBottom: 4,
        }}
      >
        <span
          style={{ fontWeight: 'bold', fontSize: 14, color: '#FF6666' }}
        >
          MODO EDITOR
        </span>
        <button
          onClick={onToggle}
          style={{
            backgroundColor: '#333',
            color: '#FF6666',
            border: '1px solid #FF4444',
            borderRadius: 4,
            padding: '2px 8px',
            cursor: 'pointer',
            fontSize: 10,
            fontFamily: 'monospace',
          }}
        >
          CERRAR (E)
        </button>
      </div>

      {selectedCountry ? (
        <div>
          <div style={{ marginBottom: 4 }}>
            <strong>Pais:</strong> {selectedCountry.name} (
            {selectedCountry.id})
          </div>
          <div style={{ marginBottom: 4 }}>
            <strong>Continente:</strong> {selectedCountry.continent}
          </div>
          <div style={{ marginBottom: 4 }}>
            <strong>Vertices:</strong> {selectedPoints.length}
          </div>
          <div style={{ marginBottom: 4 }}>
            <strong>Modo:</strong>{' '}
            {state.editingVertices ? (
              <span style={{ color: '#FF8888' }}>
                Editando vertices
              </span>
            ) : (
              <span style={{ color: '#88FF88' }}>
                Arrastrar pais
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{ color: '#AAAAAA', marginBottom: 4 }}>
          No hay pais seleccionado
        </div>
      )}

      <div
        style={{
          marginTop: 8,
          borderTop: '1px solid #555',
          paddingTop: 8,
          fontSize: 10,
          color: '#999',
          lineHeight: 1.5,
        }}
      >
        <div>Click: seleccionar pais</div>
        <div>Arrastrar: mover pais completo</div>
        <div>Doble-click: editar vertices</div>
        <div>Scroll / +/-: escalar</div>
        <div>R: rotar (Shift+R: inverso)</div>
        <div>Escape: deseleccionar</div>
      </div>

      <button
        onClick={onExport}
        style={{
          marginTop: 12,
          width: '100%',
          padding: '10px 0',
          backgroundColor: '#FF4444',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 6,
          fontWeight: 'bold',
          fontSize: 14,
          cursor: 'pointer',
          fontFamily: 'monospace',
          letterSpacing: 1,
        }}
        onMouseOver={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor =
            '#FF6666';
        }}
        onMouseOut={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor =
            '#FF4444';
        }}
      >
        EXPORTAR
      </button>
    </div>
  );
};

// =============================================================================
// Editor toggle button (shown when editor is OFF)
// =============================================================================

export const MapEditorToggleButton: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      position: 'absolute',
      top: 8,
      right: 50,
      backgroundColor: '#2D3748',
      color: '#CBD5E0',
      border: '1px solid #4A5568',
      borderRadius: 4,
      padding: '4px 10px',
      fontSize: 11,
      fontWeight: 600,
      cursor: 'pointer',
      zIndex: 10,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    }}
    title="Toggle Map Editor (E)"
  >
    Editor (E)
  </button>
);
