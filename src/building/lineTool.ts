import type { Cell } from './grid';

/** Felder einer Strecke auf einer Achse, beide Enden eingeschlossen. */
function span(from: number, to: number): number[] {
  const step = to >= from ? 1 : -1;
  const out: number[] = [];
  for (let v = from; v !== to + step; v += step) out.push(v);
  return out;
}

/**
 * Felder eines L-förmigen Weges vom Start- zum Endfeld, in Reihenfolge.
 * Ecke bei (end.x, start.y), wenn horizontalFirst, sonst bei (start.x, end.y).
 * Keine Lücken, keine doppelten Felder.
 */
export function lCells(start: Cell, end: Cell, horizontalFirst: boolean): Cell[] {
  const cells: Cell[] = [];
  if (horizontalFirst) {
    for (const x of span(start.x, end.x)) cells.push({ x, y: start.y });
    for (const y of span(start.y, end.y).slice(1)) cells.push({ x: end.x, y });
  } else {
    for (const y of span(start.y, end.y)) cells.push({ x: start.x, y });
    for (const x of span(start.x, end.x).slice(1)) cells.push({ x, y: end.y });
  }
  return cells;
}
