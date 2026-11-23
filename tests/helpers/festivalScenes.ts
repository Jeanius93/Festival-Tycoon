import { Grid } from '../../src/building/grid';
import type { Festival } from '../../src/visitors/festival';

/** Testgelände: Grid 20 × 12, Weg x = 10 von y = 11 bis y = 2, Zeltfläche x 11..14, y 2..5 (4 Stellplätze). */
export function camp(): Grid {
  const g = new Grid(20, 12);
  g.applyPath([2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((y) => ({ x: 10, y })), true);
  const cells = [];
  for (let y = 2; y <= 5; y++) for (let x = 11; x <= 14; x++) cells.push({ x, y, camp: true });
  g.apply(cells);
  return g;
}

/** camp() plus zwei Dixi-Klos bei (9,6) und (9,8), Rückseite E (zum Weg x = 10). */
export function campMitKlos(): Grid {
  const g = camp();
  for (const y of [6, 8]) g.addBuilding({ type: 'toilet', x: 9, y, width: 1, height: 1, facing: 'E', paidPrice: 150 });
  return g;
}

/** Ruft tick(), bis die Uhr `second` erreicht hat oder das Festival nicht mehr läuft. */
export function runUntil(f: Festival, second: number): void {
  while (f.phase === 'running' && f.clock.second < second) f.tick();
}

/**
 * Zufahrt von unten: Grid 40 × 30, Weg x = 10 von y = 21 bis y = 29, Zeltfläche x 10..20, y 10..20,
 * Dixi-Klo mitten auf der Zeltfläche bei (15, 18) (Rückseite S, Lieferweg nicht nötig).
 */
export function campFromBelow(): Grid {
  const g = new Grid(40, 30);
  g.applyPath(Array.from({ length: 9 }, (_, i) => ({ x: 10, y: 21 + i })), true);
  const cells = [];
  for (let y = 10; y <= 20; y++) for (let x = 10; x <= 20; x++) cells.push({ x, y, camp: true });
  g.apply(cells);
  g.addBuilding({ type: 'toilet', x: 15, y: 18, width: 1, height: 1, facing: 'S', paidPrice: 150 });
  return g;
}

/** Darf ein Auto auf diesem Feld stehen? Straße (unterhalb), Weg oder Zeltfläche ohne Gebäude. */
export function carMayStand(g: Grid, x: number, y: number): boolean {
  if (y >= g.height) return true;
  return g.isPath(x, y) || (g.isCamp(x, y) && !g.buildingAt(x, y));
}
