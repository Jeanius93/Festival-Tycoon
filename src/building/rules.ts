import type { CellChange, Grid, Orientation } from './grid';

/** Was gebaut werden soll ('camp' = Zeltfläche markieren). */
export type BuildKind = 'path' | 'fence' | 'visitorGate' | 'staffGate' | 'camp';

/** Ergebnis für ein Feld: bauen, nichts zu tun oder nicht erlaubt. */
export type Verdict = 'build' | 'skip' | 'blocked';

/**
 * Ausrichtung, die ein Durchgang auf diesem Feld hätte: Zaun (oder Durchgang)
 * links und rechts → waagrecht, oben und unten → senkrecht. Beides oder keins → null.
 */
export function placementOrientation(grid: Grid, x: number, y: number): Orientation | null {
  const horizontal = grid.isFenceLike(x - 1, y) && grid.isFenceLike(x + 1, y);
  const vertical = grid.isFenceLike(x, y - 1) && grid.isFenceLike(x, y + 1);
  if (horizontal === vertical) return null;
  return horizontal ? 'horizontal' : 'vertical';
}

/** Die eine Bauregel, die Vorschau und Bauen gemeinsam nutzen. */
export function verdict(grid: Grid, kind: BuildKind, x: number, y: number): Verdict {
  if (!grid.inBounds(x, y)) return 'blocked';
  // Auf Gebäudefeldern wird weder Weg noch Zaun noch Durchgang gebaut.
  if (grid.buildingAt(x, y)) return 'blocked';
  // Auf Stellplätzen mit Zelt oder Auto wird nichts gebaut.
  if (grid.isOccupied(x, y)) return 'blocked';
  const structure = grid.structureAt(x, y);
  const path = grid.isPath(x, y);
  // Zeltflächen sind kein Platz für Zäune und Durchgänge (Wege und Gebäude dürfen darauf).
  if (kind !== 'path' && kind !== 'camp' && grid.isCamp(x, y)) return 'blocked';
  switch (kind) {
    case 'camp':
      if (structure !== 'none') return 'blocked';
      return grid.isCamp(x, y) ? 'skip' : 'build';
    case 'path':
      if (structure === 'fence' || structure === 'visitorGate') return 'blocked';
      return path ? 'skip' : 'build';
    case 'fence':
      // Zuerst „skip“: Ein Zaun über einen Durchgang (auch ein Tor mit Weg) ist nicht rot.
      if (structure !== 'none') return 'skip';
      return path ? 'blocked' : 'build';
    case 'visitorGate':
    case 'staffGate':
      if (structure === kind) return 'skip';
      if (kind === 'visitorGate' && path) return 'blocked';
      // Umwandeln eines vorhandenen Durchgangs: Die Regel „Zaun auf zwei Seiten“ gilt nur beim Setzen.
      if (structure === 'visitorGate' || structure === 'staffGate') return 'build';
      return placementOrientation(grid, x, y) === null ? 'blocked' : 'build';
  }
}

/** Die Änderung, die `kind` auf diesem Feld bewirkt (nur bei verdict === 'build' aufrufen). */
export function changeFor(grid: Grid, kind: BuildKind, x: number, y: number): CellChange {
  if (kind === 'path') return { x, y, path: true };
  if (kind === 'fence') return { x, y, structure: 'fence' };
  if (kind === 'camp') return { x, y, camp: true };
  // Ein vorhandener Durchgang behält beim Umwandeln seine Ausrichtung.
  const orientation = grid.gateOrientationAt(x, y) ?? placementOrientation(grid, x, y);
  if (!orientation) throw new Error('Durchgang ohne Zaun auf zwei gegenüberliegenden Seiten');
  return { x, y, structure: kind, orientation };
}
