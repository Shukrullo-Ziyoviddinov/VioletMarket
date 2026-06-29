const DEFAULT_COLS = 8;
const DEFAULT_ROWS = 6;

function pseudoRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function createMessageChatDeleteShards(seed = 1, cols = DEFAULT_COLS, rows = DEFAULT_ROWS) {
  const pieces = [];
  const baseSeed = Number(String(seed).replace(/\D/g, '').slice(-6)) || 1;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const r1 = pseudoRandom(baseSeed + index * 4 + 1);
      const r2 = pseudoRandom(baseSeed + index * 4 + 2);
      const r3 = pseudoRandom(baseSeed + index * 4 + 3);
      const r4 = pseudoRandom(baseSeed + index * 4 + 4);

      pieces.push({
        id: `${row}-${col}`,
        tx: `${(r1 - 0.5) * 90}px`,
        ty: `${18 + r2 * 70}px`,
        rot: `${(r3 - 0.5) * 240}deg`,
        delay: `${r4 * 0.08}s`,
      });
    }
  }

  return pieces;
}

export function useMessageChatDeleteShards(active, seed, cols, rows) {
  if (!active) return [];
  return createMessageChatDeleteShards(seed, cols, rows);
}
