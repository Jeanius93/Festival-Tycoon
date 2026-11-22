import type { Grid } from './grid';

/** Richtungs-Bits für die Nachbarn eines Wegfeldes. */
export const DIR = { N: 1, E: 2, S: 4, W: 8 } as const;

/**
 * Welche Nachbarn eines Feldes sind Weg? Ergebnis 0 … 15 (Summe der DIR-Bits).
 * Die Zahl ist zugleich das passende Wegstück im Weg-Tileset.
 */
export function pathMask(grid: Grid, x: number, y: number): number {
  let mask = 0;
  if (grid.isPath(x, y - 1)) mask |= DIR.N;
  if (grid.isPath(x + 1, y)) mask |= DIR.E;
  if (grid.isPath(x, y + 1)) mask |= DIR.S;
  if (grid.isPath(x - 1, y)) mask |= DIR.W;
  return mask;
}
