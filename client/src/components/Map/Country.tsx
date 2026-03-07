import React, { useState, useCallback, useId, useRef, useEffect } from 'react';
import { getCountryDisplayName } from '../../utils/colors';

export interface MissileImpactData {
  country: string;
  damage: number;
  timestamp: number;
}

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
  missileImpact?: MissileImpactData | null; // active missile impact on this country
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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
  missileImpact,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [hovered, setHovered] = useState(false);
  const uniqueId = useId();
  const patternId = `blocked-${uniqueId}`;

  // -- Conquest flash: detect owner change --
  const prevOwnerRef = useRef<string | null>(ownerColor);
  const [justConquered, setJustConquered] = useState(false);

  useEffect(() => {
    const prevOwner = prevOwnerRef.current;
    prevOwnerRef.current = ownerColor;
    // Flash only when owner changes TO a new player color (not on initial render or null -> null)
    if (ownerColor && prevOwner !== null && prevOwner !== ownerColor) {
      setJustConquered(true);
      const timer = setTimeout(() => setJustConquered(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [ownerColor]);

  // -- Missile impact: expanding red explosion + floating damage --
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPhase, setExplosionPhase] = useState(0); // 0..1 progress
  const [showDamageFloat, setShowDamageFloat] = useState(false);
  const [damageAmount, setDamageAmount] = useState(0);
  const lastImpactRef = useRef<number>(0);

  useEffect(() => {
    if (missileImpact && missileImpact.country === id && missileImpact.timestamp !== lastImpactRef.current) {
      lastImpactRef.current = missileImpact.timestamp;
      setDamageAmount(missileImpact.damage);
      setShowExplosion(true);
      setShowDamageFloat(true);
      setExplosionPhase(0);

      // Animate explosion expansion over 1.5s using requestAnimationFrame
      const start = performance.now();
      const duration = 1500;
      let animFrame: number;
      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        setExplosionPhase(progress);
        if (progress < 1) {
          animFrame = requestAnimationFrame(animate);
        } else {
          setShowExplosion(false);
        }
      };
      animFrame = requestAnimationFrame(animate);

      // Damage float disappears after 1.5s
      const floatTimer = setTimeout(() => setShowDamageFloat(false), 1500);

      return () => {
        cancelAnimationFrame(animFrame);
        clearTimeout(floatTimer);
      };
    }
  }, [missileImpact, id]);

  // Derive positions from center coordinates
  const labelX = cx;
  const labelY = cy - 14;
  const armyX = cx;
  const armyY = cy + 10;

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

  // Determine visual fill (semi-transparent overlay on background map)
  const fillOpacity = hovered
    ? (ownerColor ? 0.65 : 0.4)
    : (ownerColor ? 0.55 : 0.3);
  const strokeColor = isSelected
    ? '#FBBF24'
    : hovered
      ? 'rgba(255,255,255,0.85)'
      : 'rgba(255,255,255,0.6)';
  const strokeWidth = isSelected ? 3.0 : hovered ? 2.2 : 1.2;

  // Army badge sizing
  const armyR = armies >= 100 ? 18 : 15;
  const armyFontSize = armies >= 100 ? 10 : armies >= 10 ? 12 : 14;

  // Explosion visuals
  const explosionRadius = showExplosion ? 8 + explosionPhase * 32 : 0;
  const explosionOpacity = showExplosion ? 0.8 * (1 - explosionPhase) : 0;

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
              stroke="rgba(220, 38, 38, 0.65)"
              strokeWidth="2.5"
            />
          </pattern>
        </defs>
      )}

      {/* Country shape */}
      <path
        d={path}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Conquest flash overlay: bright white that fades to transparent */}
      {justConquered && (
        <path
          d={path}
          fill="#FFFFFF"
          stroke="none"
          pointerEvents="none"
        >
          <animate
            attributeName="opacity"
            values="0.9;0.0"
            dur="1s"
            fill="freeze"
            repeatCount="1"
          />
        </path>
      )}

      {/* Conquest flash: pulsing golden border */}
      {justConquered && (
        <path
          d={path}
          fill="none"
          stroke="#FFD700"
          strokeWidth={4}
          strokeLinejoin="round"
          pointerEvents="none"
        >
          <animate
            attributeName="stroke-opacity"
            values="1;0.2;1;0"
            dur="1s"
            fill="freeze"
            repeatCount="1"
          />
          <animate
            attributeName="stroke-width"
            values="4;2;4;0"
            dur="1s"
            fill="freeze"
            repeatCount="1"
          />
        </path>
      )}

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

      {/* Blocked: diagonal stripes overlay + red glow border */}
      {isBlocked && (
        <>
          {/* Stripes overlay */}
          <path
            d={path}
            fill={`url(#${patternId})`}
            stroke="none"
            pointerEvents="none"
          />
          {/* Pulsing red glow border */}
          <path
            d={path}
            fill="none"
            stroke="#E53E3E"
            strokeWidth={3}
            strokeLinejoin="round"
            pointerEvents="none"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.9;0.4;0.9"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </path>
          {/* Second outer glow layer */}
          <path
            d={path}
            fill="none"
            stroke="#FF4444"
            strokeWidth={5}
            strokeLinejoin="round"
            opacity={0.2}
            pointerEvents="none"
          />
          {/* Lock icon near army badge */}
          <g pointerEvents="none" transform={`translate(${armyX - 20}, ${armyY - 14})`}>
            {/* Lock body background */}
            <rect
              x={-7}
              y={0}
              width={14}
              height={11}
              rx={2}
              fill="#DC2626"
              stroke="#1A202C"
              strokeWidth={1}
            />
            {/* Lock shackle (U-shape) */}
            <path
              d="M-4,-1 L-4,-5 A4,4 0 0,1 4,-5 L4,-1"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
            />
            {/* Keyhole */}
            <circle cx={0} cy={4.5} r={2} fill="#1A202C" />
            <rect x={-0.8} y={4.5} width={1.6} height={3} rx={0.5} fill="#1A202C" />
          </g>
        </>
      )}

      {/* Missile impact: red explosion circle */}
      {showExplosion && (
        <circle
          cx={cx}
          cy={cy}
          r={explosionRadius}
          fill="rgba(220, 38, 38, 0.3)"
          stroke="#DC2626"
          strokeWidth={2}
          opacity={explosionOpacity}
          pointerEvents="none"
        />
      )}

      {/* Missile impact: inner flash */}
      {showExplosion && explosionPhase < 0.4 && (
        <circle
          cx={cx}
          cy={cy}
          r={6 + explosionPhase * 12}
          fill="#FF6B6B"
          opacity={0.9 * (1 - explosionPhase / 0.4)}
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
        fontSize={11}
        fontWeight="600"
        fontFamily="system-ui, -apple-system, sans-serif"
        pointerEvents="none"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7)' } as React.CSSProperties}
      >
        <tspan stroke="#000000" strokeWidth={3.5} strokeLinejoin="round" paintOrder="stroke">
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
            fill={ownerColor || '#FFFFFF'}
            stroke={ownerColor ? 'rgba(255,255,255,0.8)' : '#1A202C'}
            strokeWidth={1.5}
          />
          {/* Army number */}
          <text
            x={armyX}
            y={armyY}
            textAnchor="middle"
            dominantBaseline="central"
            fill={ownerColor ? '#FFFFFF' : '#1A202C'}
            fontSize={armyFontSize}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {armies}
          </text>
        </g>
      )}

      {/* Missile impact: floating damage number */}
      {showDamageFloat && (
        <text
          x={cx}
          y={armyY - 20}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FF4444"
          fontSize={18}
          fontWeight="bold"
          fontFamily="monospace"
          pointerEvents="none"
        >
          <tspan stroke="#000000" strokeWidth={3} strokeLinejoin="round" paintOrder="stroke">
            -{damageAmount}
          </tspan>
          <animate
            attributeName="y"
            values={`${armyY - 20};${armyY - 55}`}
            dur="1.5s"
            fill="freeze"
            repeatCount="1"
          />
          <animate
            attributeName="opacity"
            values="1;1;0"
            dur="1.5s"
            fill="freeze"
            repeatCount="1"
          />
        </text>
      )}

      {/* Missile indicator */}
      {missiles > 0 && (
        <g pointerEvents="none">
          {/* Outer glow ring for visibility */}
          <circle
            cx={armyX + 20}
            cy={armyY - 12}
            r={12}
            fill="none"
            stroke="#FF6B00"
            strokeWidth={1.5}
            opacity={0.6}
          >
            <animate
              attributeName="r"
              values="12;14;12"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;0.2;0.6"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Shadow */}
          <circle
            cx={armyX + 20.5}
            cy={armyY - 11.5}
            r={10.5}
            fill="rgba(0,0,0,0.5)"
          />
          {/* Badge background - gradient-like with bright border */}
          <circle
            cx={armyX + 20}
            cy={armyY - 12}
            r={10}
            fill="#DC2626"
            stroke="#FF8C00"
            strokeWidth={1.5}
          />
          {/* Rocket icon - detailed SVG missile shape */}
          {/* Rocket body */}
          <path
            d={`M${armyX + 20},${armyY - 20}
                C${armyX + 20},${armyY - 20} ${armyX + 17},${armyY - 16} ${armyX + 17},${armyY - 12}
                L${armyX + 17},${armyY - 8}
                L${armyX + 23},${armyY - 8}
                L${armyX + 23},${armyY - 12}
                C${armyX + 23},${armyY - 16} ${armyX + 20},${armyY - 20} ${armyX + 20},${armyY - 20}Z`}
            fill="#FFFFFF"
            opacity={0.95}
          />
          {/* Rocket fins */}
          <path
            d={`M${armyX + 17},${armyY - 8} L${armyX + 15},${armyY - 5} L${armyX + 17},${armyY - 6}Z`}
            fill="#FFD700"
          />
          <path
            d={`M${armyX + 23},${armyY - 8} L${armyX + 25},${armyY - 5} L${armyX + 23},${armyY - 6}Z`}
            fill="#FFD700"
          />
          {/* Rocket exhaust flame */}
          <path
            d={`M${armyX + 18},${armyY - 6} L${armyX + 20},${armyY - 3} L${armyX + 22},${armyY - 6}Z`}
            fill="#FF6B00"
            opacity={0.9}
          >
            <animate
              attributeName="opacity"
              values="0.9;0.4;0.9"
              dur="0.4s"
              repeatCount="indefinite"
            />
          </path>
          {/* Missile count badge (always shown) */}
          <circle
            cx={armyX + 28}
            cy={armyY - 20}
            r={6}
            fill="#1A202C"
            stroke="#FF6B00"
            strokeWidth={1}
          />
          <text
            x={armyX + 28}
            y={armyY - 20}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#FFFFFF"
            fontSize={8}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {missiles}
          </text>
        </g>
      )}
    </g>
  );
};

export default React.memo(Country);
