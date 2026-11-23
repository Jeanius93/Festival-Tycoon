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
