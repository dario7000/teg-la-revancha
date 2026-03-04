import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DiceRollerProps {
  attackerDice: number[];
  defenderDice: number[];
  attackerLosses: number;
  defenderLosses: number;
  onClose: () => void;
}

/** Dot positions for each face of a die, laid out in a 3x3 grid (row, col). */
const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [0, 2],
    [2, 0],
  ],
  3: [
    [0, 2],
    [1, 1],
    [2, 0],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

const DieFace: React.FC<{ value: number; color: 'red' | 'blue' }> = React.memo(
  ({ value, color }) => {
    const dots = DOT_POSITIONS[value] ?? [];
    const bgClass = color === 'red' ? 'bg-red-600' : 'bg-blue-600';
    const dotColor = 'bg-white';

    return (
      <div
        className={`${bgClass} w-14 h-14 rounded-lg shadow-lg grid grid-cols-3 grid-rows-3 p-1.5 gap-0`}
      >
        {Array.from({ length: 9 }).map((_, idx) => {
          const row = Math.floor(idx / 3);
          const col = idx % 3;
          const hasDot = dots.some(([r, c]) => r === row && c === col);
          return (
            <div key={idx} className="flex items-center justify-center">
              {hasDot && <span className={`${dotColor} w-2.5 h-2.5 rounded-full`} />}
            </div>
          );
        })}
      </div>
    );
  },
);
DieFace.displayName = 'DieFace';

const DiceRoller: React.FC<DiceRollerProps> = ({
  attackerDice,
  defenderDice,
  attackerLosses,
  defenderLosses,
  onClose,
}) => {
  const [rolling, setRolling] = useState(true);
  const [randomFaces, setRandomFaces] = useState<number[]>([]);

  // Generate random faces during the shake animation
  useEffect(() => {
    if (!rolling) return;

    const interval = setInterval(() => {
      const total = attackerDice.length + defenderDice.length;
      setRandomFaces(
        Array.from({ length: total }, () => Math.floor(Math.random() * 6) + 1),
      );
    }, 80);

    const timer = setTimeout(() => {
      setRolling(false);
      clearInterval(interval);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [rolling, attackerDice.length, defenderDice.length]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Sort dice descending for comparison
  const sortedAttacker = [...attackerDice].sort((a, b) => b - a);
  const sortedDefender = [...defenderDice].sort((a, b) => b - a);
  const pairs = Math.min(sortedAttacker.length, sortedDefender.length);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl min-w-[320px]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-center text-lg font-bold text-white mb-4">Combate</h3>

          {/* Dice rows */}
          <div className="flex flex-col gap-4">
            {/* Attacker row */}
            <div>
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1 block">
                Atacante
              </span>
              <div className="flex gap-2">
                {sortedAttacker.map((value, i) => (
                  <motion.div
                    key={`atk-${i}`}
                    animate={
                      rolling
                        ? {
                            rotate: [0, -15, 15, -10, 10, 0],
                            x: [0, -4, 4, -2, 2, 0],
                          }
                        : { rotate: 0, x: 0 }
                    }
                    transition={
                      rolling
                        ? { duration: 0.3, repeat: Infinity }
                        : { type: 'spring', damping: 12 }
                    }
                  >
                    <DieFace
                      value={rolling ? (randomFaces[i] ?? 1) : value}
                      color="red"
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Comparison arrows */}
            {!rolling && (
              <motion.div
                className="flex flex-col gap-1 items-center"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {Array.from({ length: pairs }).map((_, i) => {
                  const atkWins = sortedAttacker[i] > sortedDefender[i];
                  return (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span
                        className={`font-bold w-6 text-center ${
                          atkWins ? 'text-red-400' : 'text-red-400/40'
                        }`}
                      >
                        {sortedAttacker[i]}
                      </span>
                      <span className="text-gray-500">vs</span>
                      <span
                        className={`font-bold w-6 text-center ${
                          !atkWins ? 'text-blue-400' : 'text-blue-400/40'
                        }`}
                      >
                        {sortedDefender[i]}
                      </span>
                      <span className="text-xs">
                        {atkWins ? (
                          <span className="text-red-400">→ Defensor -1</span>
                        ) : (
                          <span className="text-blue-400">→ Atacante -1</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Defender row */}
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1 block">
                Defensor
              </span>
              <div className="flex gap-2">
                {sortedDefender.map((value, i) => (
                  <motion.div
                    key={`def-${i}`}
                    animate={
                      rolling
                        ? {
                            rotate: [0, 15, -15, 10, -10, 0],
                            x: [0, 4, -4, 2, -2, 0],
                          }
                        : { rotate: 0, x: 0 }
                    }
                    transition={
                      rolling
                        ? { duration: 0.3, repeat: Infinity }
                        : { type: 'spring', damping: 12 }
                    }
                  >
                    <DieFace
                      value={
                        rolling
                          ? (randomFaces[attackerDice.length + i] ?? 1)
                          : value
                      }
                      color="blue"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Result text */}
          {!rolling && (
            <motion.div
              className="mt-5 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm text-gray-300">
                {attackerLosses > 0 && (
                  <span className="text-red-400 font-semibold">
                    Atacante pierde {attackerLosses}
                  </span>
                )}
                {attackerLosses > 0 && defenderLosses > 0 && (
                  <span className="text-gray-500 mx-2">|</span>
                )}
                {defenderLosses > 0 && (
                  <span className="text-blue-400 font-semibold">
                    Defensor pierde {defenderLosses}
                  </span>
                )}
              </p>
              <button
                onClick={handleClose}
                className="mt-3 px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DiceRoller;
