import React, { useState, useEffect } from 'react';
import { TurnPhase } from '../../shared/types/GameState';

export interface TurnControlsProps {
  currentPhase: TurnPhase;
  reinforcementsLeft: number;
  onEndTurn: () => void;
  onSkipToAttack?: () => void;
  onSkipToRegroup?: () => void;
  onIncorporateMissile?: () => void;
  onCancelMissileMode?: () => void;
  missileIncorporating?: boolean;
  canIncorporateMissile?: boolean;
  activeSituationCard?: { type: string; description: string };
  isMyTurn: boolean;
  turnTimeLimit?: number;
  turnStartedAt?: number;
}

const PHASE_NAMES: Record<TurnPhase, string> = {
  SITUATION_CARD: 'Carta de Situacion',
  REINFORCE: 'Incorporar Ejercitos',
  TRADE: 'Canje de Tarjetas',
  ATTACK: 'Ataque',
  REGROUP: 'Reagrupamiento',
  DRAW_CARD: 'Robar Tarjeta',
  DRAW_CONTINENT_CARD: 'Tarjeta Continental',
};

const PHASE_ORDER: TurnPhase[] = [
  'SITUATION_CARD',
  'REINFORCE',
  'TRADE',
  'ATTACK',
  'REGROUP',
  'DRAW_CARD',
  'DRAW_CONTINENT_CARD',
];

function getPhaseIndex(phase: TurnPhase): number {
  return PHASE_ORDER.indexOf(phase);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TurnControls: React.FC<TurnControlsProps> = React.memo(
  ({
    currentPhase,
    reinforcementsLeft,
    onEndTurn,
    onSkipToAttack,
    onSkipToRegroup,
    onIncorporateMissile,
    onCancelMissileMode,
    missileIncorporating,
    canIncorporateMissile,
    activeSituationCard,
    isMyTurn,
    turnTimeLimit,
    turnStartedAt,
  }) => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Timer logic
    useEffect(() => {
      if (!turnTimeLimit || !turnStartedAt || !isMyTurn) {
        setTimeLeft(null);
        return;
      }

      const tick = () => {
        const elapsed = Math.floor((Date.now() - turnStartedAt) / 1000);
        const remaining = Math.max(0, turnTimeLimit - elapsed);
        setTimeLeft(remaining);
      };

      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }, [turnTimeLimit, turnStartedAt, isMyTurn]);

    const currentIndex = getPhaseIndex(currentPhase);

    // Determine button states
    const isReinforcePhase = currentPhase === 'REINFORCE';
    const isAttackPhase = currentPhase === 'ATTACK';
    const isRegroupPhase = currentPhase === 'REGROUP';

    // "Atacar" button: clickable during REINFORCE to skip to attack phase
    const canSkipToAttack =
      isMyTurn && isReinforcePhase && !!onSkipToAttack;

    // "Reagrupar" button: clickable during ATTACK phase to skip to regroup
    const canSkipToRegroup =
      isMyTurn && isAttackPhase && !!onSkipToRegroup;

    // "Terminar Turno" enabled during REINFORCE, ATTACK or REGROUP
    const canEndTurn =
      isMyTurn && (isReinforcePhase || isAttackPhase || isRegroupPhase);

    return (
      <>
        {/* ===== DESKTOP: top-center panel (hidden on mobile) ===== */}
        <div className="hidden md:block absolute top-2 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-2xl px-5 py-3 shadow-xl min-w-[400px]">
            {/* Turn status + current phase display */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Fase actual
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {PHASE_NAMES[currentPhase]}
                  </h3>
                  {isMyTurn ? (
                    <span className="text-[10px] font-semibold text-green-400 bg-green-900/40 border border-green-700/40 px-1.5 py-0.5 rounded">
                      Tu turno
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                      Esperando...
                    </span>
                  )}
                </div>
              </div>

              {/* Timer */}
              {timeLeft !== null && (
                <div
                  className={`text-lg font-mono font-bold ${
                    timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-gray-300'
                  }`}
                >
                  {formatTime(timeLeft)}
                </div>
              )}
            </div>

            {/* Reinforcements info */}
            {isReinforcePhase && isMyTurn && (
              <div className="mb-2 text-xs text-green-400 bg-green-900/30 border border-green-800/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span>Ejercitos disponibles:</span>
                <span className="font-bold text-lg text-green-300 leading-none">
                  {reinforcementsLeft}
                </span>
                {reinforcementsLeft === 0 && (
                  <span className="text-green-500/70 ml-1">
                    (todos colocados)
                  </span>
                )}
              </div>
            )}

            {/* Missile incorporation mode banner */}
            {missileIncorporating && isMyTurn && (
              <div className="mb-2 text-xs text-orange-400 bg-orange-900/30 border border-orange-800/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span>&#x1F680;</span>
                <span>Selecciona un pais propio con 7+ ejercitos para incorporar misil</span>
              </div>
            )}

            {/* Situation card display */}
            {activeSituationCard && (
              <div className="mb-2 text-xs bg-purple-900/30 border border-purple-700/40 rounded-lg px-3 py-1.5">
                <span className="text-purple-300 font-semibold">
                  Situacion: {activeSituationCard.type}
                </span>
                <p className="text-purple-400/80 mt-0.5">
                  {activeSituationCard.description}
                </p>
              </div>
            )}

            {/* Phase buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Incorporar (+) */}
              <div
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-150
                  ${
                    isReinforcePhase && isMyTurn
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : ''
                  }
                  ${getPhaseIndex('REINFORCE') < currentIndex ? 'bg-gray-800 text-gray-500' : ''}
                  ${getPhaseIndex('REINFORCE') > currentIndex ? 'bg-gray-800/50 text-gray-600' : ''}
                  cursor-default
                `}
              >
                <span>+</span>
                <span>Incorporar</span>
                {isReinforcePhase && reinforcementsLeft > 0 && (
                  <span className="bg-green-500 text-white text-[10px] px-1.5 rounded-full font-bold">
                    {reinforcementsLeft}
                  </span>
                )}
              </div>

              {/* Atacar */}
              <button
                onClick={canSkipToAttack ? onSkipToAttack : undefined}
                disabled={!canSkipToAttack && !isAttackPhase}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-150
                  ${
                    isAttackPhase && isMyTurn
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : ''
                  }
                  ${
                    canSkipToAttack
                      ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-md shadow-amber-600/30'
                      : ''
                  }
                  ${
                    !canSkipToAttack && !isAttackPhase && getPhaseIndex('ATTACK') < currentIndex
                      ? 'bg-gray-800 text-gray-500 cursor-default'
                      : ''
                  }
                  ${
                    !canSkipToAttack && !isAttackPhase && getPhaseIndex('ATTACK') > currentIndex
                      ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                      : ''
                  }
                `}
              >
                <span>&#x2694;</span>
                <span>Atacar</span>
              </button>

              {/* Reagrupar */}
              <button
                onClick={canSkipToRegroup ? onSkipToRegroup : undefined}
                disabled={!canSkipToRegroup && !isRegroupPhase}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-150
                  ${
                    isRegroupPhase && isMyTurn
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : ''
                  }
                  ${
                    canSkipToRegroup
                      ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-md shadow-amber-600/30'
                      : ''
                  }
                  ${
                    !canSkipToRegroup && !isRegroupPhase && getPhaseIndex('REGROUP') < currentIndex
                      ? 'bg-gray-800 text-gray-500 cursor-default'
                      : ''
                  }
                  ${
                    !canSkipToRegroup && !isRegroupPhase && getPhaseIndex('REGROUP') > currentIndex
                      ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                      : ''
                  }
                `}
              >
                <span>&#x2194;</span>
                <span>Reagrupar</span>
              </button>

              {/* Incorporar Misil - only during REINFORCE phase */}
              {isReinforcePhase && isMyTurn && (
                missileIncorporating ? (
                  <button
                    onClick={onCancelMissileMode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 bg-gray-600 hover:bg-gray-500 text-gray-200 cursor-pointer shadow-md"
                  >
                    <span>&#x2715;</span>
                    <span>Cancelar Misil</span>
                  </button>
                ) : (
                  <button
                    onClick={canIncorporateMissile ? onIncorporateMissile : undefined}
                    disabled={!canIncorporateMissile}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                      transition-all duration-150
                      ${
                        canIncorporateMissile
                          ? 'bg-orange-700 hover:bg-orange-600 text-white cursor-pointer shadow-md shadow-orange-700/30'
                          : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                      }
                    `}
                    title={canIncorporateMissile
                      ? 'Convierte 6 ejercitos en 1 misil (pais con 7+ ejercitos)'
                      : 'Necesitas un pais con 7+ ejercitos'}
                  >
                    <span>&#x1F680;</span>
                    <span>Misil (6 ej.)</span>
                  </button>
                )
              )}

              {/* Divider */}
              <div className="w-px h-6 bg-gray-700 mx-1" />

              {/* End turn button */}
              <button
                onClick={onEndTurn}
                disabled={!canEndTurn}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-150
                  ${
                    canEndTurn
                      ? 'bg-red-700 hover:bg-red-600 text-white shadow-md shadow-red-700/20'
                      : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                <span>&#x23F9;</span>
                <span>Terminar Turno</span>
              </button>
            </div>

            {/* Phase progress dots */}
            <div className="flex items-center justify-center gap-1 mt-2">
              {PHASE_ORDER.map((phase, i) => (
                <div
                  key={phase}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentIndex
                      ? 'bg-indigo-400'
                      : i < currentIndex
                        ? 'bg-gray-500'
                        : 'bg-gray-700'
                  }`}
                  title={PHASE_NAMES[phase]}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ===== MOBILE: fixed bottom action bar (hidden on desktop) ===== */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700">
          {/* Situation card / missile banner strip - sits above the bar */}
          {isMyTurn && (missileIncorporating || activeSituationCard) && (
            <div className="absolute bottom-14 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 px-3 py-1.5">
              {missileIncorporating && (
                <div className="text-[10px] text-orange-400 flex items-center gap-1">
                  <span>&#x1F680;</span>
                  <span>Toca un pais propio con 7+ ejercitos</span>
                </div>
              )}
              {activeSituationCard && (
                <div className="text-[10px] text-purple-300 truncate">
                  Situacion: {activeSituationCard.description}
                </div>
              )}
            </div>
          )}

          {/* Timer strip above bar when active */}
          {timeLeft !== null && (
            <div className="absolute bottom-14 left-0 right-0 flex justify-center pointer-events-none"
              style={{ marginBottom: isMyTurn && (missileIncorporating || activeSituationCard) ? '28px' : '0' }}
            >
              <div
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-t-md ${
                  timeLeft <= 30
                    ? 'text-red-400 bg-red-900/80 animate-pulse'
                    : 'text-gray-300 bg-gray-800/90'
                }`}
              >
                {formatTime(timeLeft)}
              </div>
            </div>
          )}

          {/* Phase indicator strip */}
          <div className="absolute -top-[3px] left-0 right-0 flex">
            {PHASE_ORDER.map((phase, i) => (
              <div
                key={phase}
                className={`flex-1 h-[3px] transition-colors ${
                  i === currentIndex
                    ? 'bg-indigo-400'
                    : i < currentIndex
                      ? 'bg-gray-600'
                      : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          <div className="flex items-stretch h-full">
            {/* Refuerzo tab */}
            <button
              disabled={true}
              className={`
                flex-1 flex flex-col items-center justify-center gap-0.5 relative
                transition-colors duration-150
                ${
                  isReinforcePhase && isMyTurn
                    ? 'text-amber-400 border-t-2 border-amber-400 -mt-[2px]'
                    : isReinforcePhase
                      ? 'text-gray-300'
                      : getPhaseIndex('REINFORCE') < currentIndex
                        ? 'text-gray-600'
                        : 'text-gray-500'
                }
              `}
            >
              <span className="text-base leading-none">
                {isReinforcePhase && isMyTurn && reinforcementsLeft > 0
                  ? `+${reinforcementsLeft}`
                  : '▲'}
              </span>
              <span className="text-[10px] leading-none font-medium">Refuerzo</span>
            </button>

            {/* Atacar tab */}
            <button
              onClick={canSkipToAttack ? onSkipToAttack : undefined}
              disabled={!canSkipToAttack && !isAttackPhase}
              className={`
                flex-1 flex flex-col items-center justify-center gap-0.5 relative
                transition-colors duration-150
                ${
                  isAttackPhase && isMyTurn
                    ? 'text-amber-400 border-t-2 border-amber-400 -mt-[2px]'
                    : isAttackPhase
                      ? 'text-gray-300'
                      : canSkipToAttack
                        ? 'text-amber-500 active:bg-amber-900/30'
                        : getPhaseIndex('ATTACK') < currentIndex
                          ? 'text-gray-600'
                          : 'text-gray-500'
                }
              `}
            >
              <span className="text-base leading-none">&#x2694;</span>
              <span className="text-[10px] leading-none font-medium">Atacar</span>
            </button>

            {/* Reagrupar tab */}
            <button
              onClick={canSkipToRegroup ? onSkipToRegroup : undefined}
              disabled={!canSkipToRegroup && !isRegroupPhase}
              className={`
                flex-1 flex flex-col items-center justify-center gap-0.5 relative
                transition-colors duration-150
                ${
                  isRegroupPhase && isMyTurn
                    ? 'text-amber-400 border-t-2 border-amber-400 -mt-[2px]'
                    : isRegroupPhase
                      ? 'text-gray-300'
                      : canSkipToRegroup
                        ? 'text-amber-500 active:bg-amber-900/30'
                        : getPhaseIndex('REGROUP') < currentIndex
                          ? 'text-gray-600'
                          : 'text-gray-500'
                }
              `}
            >
              <span className="text-base leading-none">&#x2194;</span>
              <span className="text-[10px] leading-none font-medium">Reagrupar</span>
            </button>

            {/* Misil tab - only during REINFORCE when player's turn */}
            {isReinforcePhase && isMyTurn && (
              <button
                onClick={
                  missileIncorporating
                    ? onCancelMissileMode
                    : canIncorporateMissile
                      ? onIncorporateMissile
                      : undefined
                }
                disabled={!missileIncorporating && !canIncorporateMissile}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-0.5 relative
                  transition-colors duration-150
                  ${
                    missileIncorporating
                      ? 'text-orange-400 bg-orange-900/20 border-t-2 border-orange-400 -mt-[2px]'
                      : canIncorporateMissile
                        ? 'text-orange-400 active:bg-orange-900/30'
                        : 'text-gray-600'
                  }
                `}
              >
                <span className="text-base leading-none">&#x1F680;</span>
                <span className="text-[10px] leading-none font-medium">
                  {missileIncorporating ? 'Cancel' : 'Misil'}
                </span>
              </button>
            )}

            {/* Divider */}
            <div className="w-px bg-gray-700 my-2" />

            {/* Fin Turno tab */}
            <button
              onClick={canEndTurn ? onEndTurn : undefined}
              disabled={!canEndTurn}
              className={`
                flex-1 flex flex-col items-center justify-center gap-0.5 relative
                transition-colors duration-150
                ${
                  canEndTurn
                    ? 'text-red-400 active:bg-red-900/30'
                    : 'text-gray-600'
                }
              `}
            >
              <span className="text-base leading-none">&#x2713;</span>
              <span className="text-[10px] leading-none font-medium">Fin Turno</span>
            </button>
          </div>
        </div>
      </>
    );
  },
);

TurnControls.displayName = 'TurnControls';

export default TurnControls;
