import { CATALOG, type BuildingType } from './catalog';
import type { Building, Cell, Facing, Grid } from './grid';

/** Rechteck aus Feldern: linke obere Ecke plus Ausdehnung. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Ergebnis der Bauregel für ein Gebäude. „Belegt“ geht vor „zu teuer“. */
export type PlacementVerdict = 'ok' | 'blocked' | 'tooExpensive';

const NEXT_FACING: Record<Facing, Facing> = { N: 'E', E: 'S', S: 'W', W: 'N' };

/** Dreht die Rückseite um 90° im Uhrzeigersinn (N → E → S → W → N). */
export function rotateFacing(facing: Facing): Facing {
  return NEXT_FACING[facing];
}

/**
 * Grundfläche eines Gebäudes, dessen Mitte auf `center` liegt.
 * Zeigt die Rückseite nach rechts oder links, tauschen Breite und Tiefe.
 */
export function footprint(type: BuildingType, facing: Facing, center: Cell): Rect {
  const spec = CATALOG[type];
  const sideways = facing === 'E' || facing === 'W';
  const width = sideways ? spec.depth : spec.width;
  const height = sideways ? spec.width : spec.depth;
  return {
    x: center.x - Math.floor((width - 1) / 2),
    y: center.y - Math.floor((height - 1) / 2),
    width,
    height,
  };
}

/** Alle Felder eines Rechtecks, zeilenweise von oben links. */
export function rectCells(r: Rect): Cell[] {
  const cells: Cell[] = [];
  for (let y = r.y; y < r.y + r.height; y++) for (let x = r.x; x < r.x + r.width; x++) cells.push({ x, y });
  return cells;
}

/** Die Feldreihe direkt hinter der Rückseite, über die ganze Breite (darf außerhalb liegen). */
export function backCells(r: Rect, facing: Facing): Cell[] {
  switch (facing) {
    case 'N':
      return rectCells({ x: r.x, y: r.y - 1, width: r.width, height: 1 });
    case 'S':
      return rectCells({ x: r.x, y: r.y + r.height, width: r.width, height: 1 });
    case 'E':
      return rectCells({ x: r.x + r.width, y: r.y, width: 1, height: r.height });
    case 'W':
      return rectCells({ x: r.x - 1, y: r.y, width: 1, height: r.height });
  }
}

/** Beliefert, wenn mindestens ein Feld direkt hinter der Rückseite ein Weg ist. */
export function isDelivered(grid: Grid, b: Building): boolean {
  return backCells(b, b.facing).some(({ x, y }) => grid.isPath(x, y));
}

/** Die eine Bauregel für Gebäude, die Vorschau und Bauen gemeinsam nutzen. */
export function placementVerdict(grid: Grid, r: Rect, price: number, balance: number): PlacementVerdict {
  const free = rectCells(r).every(
    ({ x, y }) => grid.inBounds(x, y) && !grid.isPath(x, y) && grid.structureAt(x, y) === 'none' && !grid.buildingAt(x, y) && !grid.isOccupied(x, y),
  );
  if (!free) return 'blocked';
  return price > balance ? 'tooExpensive' : 'ok';
}
