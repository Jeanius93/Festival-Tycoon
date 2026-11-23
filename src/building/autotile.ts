import type { Grid } from './grid';

/** Richtungs-Bits für die Nachbarn eines Feldes. */
export const DIR = { N: 1, E: 2, S: 4, W: 8 } as const;

/** Summe der DIR-Bits aller Nachbarn, für die `test` zutrifft (0 … 15). */
function neighbourMask(test: (x: number, y: number) => boolean, x: number, y: number): number {
  let mask = 0;
  if (test(x, y - 1)) mask |= DIR.N;
  if (test(x + 1, y)) mask |= DIR.E;
  if (test(x, y + 1)) mask |= DIR.S;
  if (test(x - 1, y)) mask |= DIR.W;
  return mask;
}

/**
 * Welche Nachbarn eines Feldes sind Weg? Ergebnis 0 … 15 (Summe der DIR-Bits).
 * Die Zahl ist zugleich das passende Wegstück im Weg-Tileset.
 * Ein Weg auf der untersten Reihe ist nach unten an die Straße angeschlossen.
 */
export function pathMask(grid: Grid, x: number, y: number): number {
  const road = y === grid.height - 1 ? DIR.S : 0;
  return neighbourMask((nx, ny) => grid.isPath(nx, ny), x, y) | road;
}

/** Welche Nachbarn gehören zu einer Zeltfläche? Zugleich das passende Stück im Zeltflächen-Tileset. */
export function campMask(grid: Grid, x: number, y: number): number {
  return neighbourMask((nx, ny) => grid.isCamp(nx, ny), x, y);
}

/** Welche Nachbarn sind Zaun oder Durchgang? Zugleich das passende Zaunstück im Zaun-Tileset. */
export function fenceMask(grid: Grid, x: number, y: number): number {
  return neighbourMask((nx, ny) => grid.isFenceLike(nx, ny), x, y);
}
