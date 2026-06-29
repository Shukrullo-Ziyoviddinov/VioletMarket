import { useMemo } from 'react';

const COLS = 8;
const ROWS = 6;

function pseudoRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function createMessageChatDeleteShards(seed = 1) {
  const pieces = [];
  const baseSeed = Number(String(seed).replace(/\D/g, '').slice(-6)) || 1;

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const index = row * COLS + col;
      const r1 = pseudoRandom(baseSeed + index * 4 + 1);
      const r2 = pseudoRandom(baseSeed + index * 4 + 2);
      const r3 = pseudoRandom(baseSeed + index * 4 + 3);
      const r4 = pseudoRandom(baseSeed + index * 4 + 4);

      pieces.push({
        id: `${row}-${col}`,
        left: (col / COLS) * 100,
        top: (row / ROWS) * 100,
        width: 100 / COLS + 1.2,
        height: 100 / ROWS + 1.2,
        tx: `${(r1 - 0.5) * 160}px`,
        ty: `${24 + r2 * 80}px`,
        rot: `${(r3 - 0.5) * 280}deg`,
        delay: `${r4 * 0.1}s`,
        drift: `${(r2 - 0.5) * 30}px`,
      });
    }
  }

  return pieces;
}

export function useMessageChatDeleteShards(active, seed) {
  return useMemo(() => {
    if (!active) return [];
    return createMessageChatDeleteShards(seed);
  }, [active, seed]);
}
