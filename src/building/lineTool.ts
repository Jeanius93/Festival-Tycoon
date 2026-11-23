import type { Cell } from './grid';

/** Felder einer Strecke auf einer Achse, beide Enden eingeschlossen. */
function span(from: number, to: number): number[] {
  const step = to >= from ? 1 : -1;
  const out: number[] = [];
  for (let v = from; v !== to + step; v += step) out.push(v);
  return out;
}

/** Alle Felder des Rechtecks mit den Ecken `a` und `b`, zeilenweise von oben links. */
export function rectBetween(a: Cell, b: Cell): Cell[] {
  const cells: Cell[] = [];
  for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) {
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) cells.push({ x, y });
  }
  return cells;
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
