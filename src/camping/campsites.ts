import type { Cell, Grid } from '../building/grid';
import type { RoadNetwork } from '../building/roadNetwork';

/**
 * Ein Stellplatz: linke obere Ecke eines 2 × 2-Quadrats.
 * Zelt = linke Spalte, Auto = rechte Spalte.
 */
export interface Plot {
  x: number;
  y: number;
}

/**
 * Eine zusammenhängende Zeltfläche. `id` = Index des ersten Feldes in Lesereihenfolge.
 * `access` = angeschlossenes Wegfeld in oder direkt neben der Fläche (null = nicht angeschlossen).
 */
export interface CampZone {
  id: number;
  cells: Cell[];
  access: Cell | null;
}

const STEPS: ReadonlyArray<[number, number]> = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/** Die vier Felder eines Stellplatzes, zeilenweise. */
export function plotCells(p: Plot): Cell[] {
  return [
    { x: p.x, y: p.y },
    { x: p.x + 1, y: p.y },
    { x: p.x, y: p.y + 1 },
    { x: p.x + 1, y: p.y + 1 },
  ];
}

/** Zelteingang: hierhin laufen die Gäste. */
export function tentDoor(p: Plot): Cell {
  return { x: p.x, y: p.y + 1 };
}

/** Parkplatz des Autos: hier endet die Anfahrt. */
export function parkingCell(p: Plot): Cell {
  return { x: p.x + 1, y: p.y + 1 };
}

/** Alle Zeltflächen (4er-Nachbarschaft), sortiert nach `id`, mit ihrer Zufahrt. */
export function findCampZones(grid: Grid, roads: RoadNetwork): CampZone[] {
  const w = grid.width;
  const seen = new Uint8Array(w * grid.height);
  const zones: CampZone[] = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < w; x++) {
      if (!grid.isCamp(x, y) || seen[y * w + x]) continue;
      const cells: Cell[] = [];
      const queue: Cell[] = [{ x, y }];
      seen[y * w + x] = 1;
      while (queue.length > 0) {
        const c = queue.pop()!;
        cells.push(c);
        for (const [dx, dy] of STEPS) {
          const nx = c.x + dx;
          const ny = c.y + dy;
          if (!grid.isCamp(nx, ny) || seen[ny * w + nx]) continue;
          seen[ny * w + nx] = 1;
          queue.push({ x: nx, y: ny });
        }
      }
      cells.sort((a, b) => a.y - b.y || a.x - b.x);
      zones.push({ id: y * w + x, cells, access: findAccess(grid, roads, cells) });
    }
  }
  return zones;
}

/** Angeschlossenes Wegfeld in oder neben der Fläche mit kürzestem Weg zur Straße. */
function findAccess(grid: Grid, roads: RoadNetwork, cells: Cell[]): Cell | null {
  const candidates = new Map<number, Cell>();
  for (const c of cells) {
    for (const [dx, dy] of [[0, 0], ...STEPS]) {
      const x = c.x + dx;
      const y = c.y + dy;
      if (roads.isConnected(x, y)) candidates.set(y * grid.width + x, { x, y });
    }
  }
  let best: Cell | null = null;
  let bestKey = Infinity;
  let bestDist = Infinity;
  for (const [key, c] of candidates) {
    const d = roads.distance(c.x, c.y);
    if (d < bestDist || (d === bestDist && key < bestKey)) {
      best = c;
      bestDist = d;
      bestKey = key;
    }
  }
  return best;
}

/** Freie Stellplätze einer Zone, nächster zur Zufahrt zuerst. */
export function freePlots(grid: Grid, zone: CampZone): Plot[] {
  const usable = (x: number, y: number) =>
    grid.isCamp(x, y) && !grid.isPath(x, y) && !grid.buildingAt(x, y) && !grid.isOccupied(x, y);
  const used = new Set<number>();
  const key = (x: number, y: number) => y * grid.width + x;
  const plots: Plot[] = [];
  // Die Zellen der Zone sind in Lesereihenfolge sortiert; jede ist ein möglicher linker oberer Eckpunkt.
  for (const { x, y } of zone.cells) {
    const cells = plotCells({ x, y });
    if (cells.every((c) => usable(c.x, c.y) && !used.has(key(c.x, c.y)))) {
      for (const c of cells) used.add(key(c.x, c.y));
      plots.push({ x, y });
    }
  }
  const access = zone.access;
  if (!access) return plots;
  const dist = (p: Plot) => {
    const park = parkingCell(p);
    return Math.abs(park.x - access.x) + Math.abs(park.y - access.y);
  };
  // Array.sort ist stabil: bei Gleichstand bleibt die Lesereihenfolge.
  return plots.sort((a, b) => dist(a) - dist(b));
}
