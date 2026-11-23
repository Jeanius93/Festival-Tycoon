import type { Cell, Grid } from './grid';

// Nachbarn in fester Reihenfolge (N, O, S, W), damit Routen bei gleicher Länge stabil sind.
const STEPS: ReadonlyArray<[number, number]> = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/**
 * Welche Wege hängen an der Zufahrtsstraße? Die Straße liegt unterhalb des Grundstücks;
 * angeschlossen ist jeder Weg auf der untersten Reihe und alles, was über Wege
 * (auch durch Personal-Tore) damit verbunden ist. Wird nach jeder Änderung neu erzeugt.
 */
export class RoadNetwork {
  private readonly dist: Int32Array;
  private readonly parent: Int32Array;

  constructor(private readonly grid: Grid) {
    const size = grid.width * grid.height;
    this.dist = new Int32Array(size).fill(-1);
    this.parent = new Int32Array(size).fill(-1);
    const queue: number[] = [];
    const bottom = grid.height - 1;
    for (let x = 0; x < grid.width; x++) {
      if (!grid.isPath(x, bottom)) continue;
      const i = bottom * grid.width + x;
      this.dist[i] = 0;
      queue.push(i);
    }
    for (let head = 0; head < queue.length; head++) {
      const i = queue[head];
      const x = i % grid.width;
      const y = Math.floor(i / grid.width);
      for (const [dx, dy] of STEPS) {
        const nx = x + dx;
        const ny = y + dy;
        if (!grid.isPath(nx, ny)) continue;
        const n = ny * grid.width + nx;
        if (this.dist[n] !== -1) continue;
        this.dist[n] = this.dist[i] + 1;
        this.parent[n] = i;
        queue.push(n);
      }
    }
  }

  /** Ist das Feld ein Weg mit Verbindung zur Straße? */
  isConnected(x: number, y: number): boolean {
    return this.grid.inBounds(x, y) && this.dist[y * this.grid.width + x] !== -1;
  }

  /** Wegfelder bis zur untersten Reihe (unverbunden → Infinity). */
  distance(x: number, y: number): number {
    return this.isConnected(x, y) ? this.dist[y * this.grid.width + x] : Infinity;
  }

  /** Kürzester Weg vom Einfahrtsfeld (unterste Reihe) bis einschließlich `target`; unverbunden → null. */
  routeFromRoad(target: Cell): Cell[] | null {
    if (!this.isConnected(target.x, target.y)) return null;
    const w = this.grid.width;
    const route: Cell[] = [];
    for (let i = target.y * w + target.x; i !== -1; i = this.parent[i]) route.push({ x: i % w, y: Math.floor(i / w) });
    return route.reverse();
  }
}

/** Kürzester Weg nur über Wegfelder: `from` ausgeschlossen, `to` eingeschlossen; unerreichbar → null. */
export function vehicleRoute(grid: Grid, from: Cell, to: Cell): Cell[] | null {
  if (from.x === to.x && from.y === to.y) return [];
  if (!grid.isPath(to.x, to.y) || !grid.inBounds(from.x, from.y)) return null;
  const w = grid.width;
  const parent = new Int32Array(w * grid.height).fill(-2);
  const start = from.y * w + from.x;
  const goal = to.y * w + to.x;
  parent[start] = -1;
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head];
    if (i === goal) break;
    const x = i % w;
    const y = Math.floor(i / w);
    for (const [dx, dy] of STEPS) {
      const nx = x + dx;
      const ny = y + dy;
      if (!grid.isPath(nx, ny)) continue;
      const n = ny * w + nx;
      if (parent[n] !== -2) continue;
      parent[n] = i;
      queue.push(n);
    }
  }
  if (parent[goal] === -2) return null;
  const route: Cell[] = [];
  for (let i = goal; i !== start; i = parent[i]) route.push({ x: i % w, y: Math.floor(i / w) });
  return route.reverse();
}
