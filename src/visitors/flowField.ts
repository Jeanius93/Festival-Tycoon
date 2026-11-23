import type { Cell, Grid } from '../building/grid';

/** Darf ein Gast hier stehen? Grundstück, kein Gebäude, kein Zaun, kein Personal-Tor. */
export function isWalkable(grid: Grid, x: number, y: number): boolean {
  if (!grid.inBounds(x, y) || grid.buildingAt(x, y)) return false;
  const s = grid.structureAt(x, y);
  return s === 'none' || s === 'visitorGate';
}

/** Ein Ziel einer Wegweiser-Karte mit Startkosten (z. B. Zuschlag für eine lange Schlange). */
export interface Goal {
  x: number;
  y: number;
  cost: number;
}

// Schritte in fester Reihenfolge: N, O, S, W, NO, SO, SW, NW (bei Gleichstand gewinnt der frühere).
const STEPS: ReadonlyArray<[number, number, number]> = [
  [0, -1, 1],
  [1, 0, 1],
  [0, 1, 1],
  [-1, 0, 1],
  [1, -1, Math.SQRT2],
  [1, 1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/** Ist der Schritt von (x, y) um (dx, dy) erlaubt? Schräg nur, wenn beide geraden Nachbarn begehbar sind. */
function canStep(grid: Grid, x: number, y: number, dx: number, dy: number): boolean {
  if (!isWalkable(grid, x + dx, y + dy)) return false;
  if (dx === 0 || dy === 0) return true;
  return isWalkable(grid, x + dx, y) && isWalkable(grid, x, y + dy);
}

/** Kleiner Binär-Heap nach Priorität (für Dijkstra und A*). */
class Heap {
  private readonly items: Array<[number, number]> = [];

  get size(): number {
    return this.items.length;
  }

  push(index: number, priority: number): void {
    const a = this.items;
    a.push([index, priority]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][1] <= a[i][1]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }

  pop(): [number, number] {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l][1] < a[m][1]) m = l;
        if (r < a.length && a[r][1] < a[m][1]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

/**
 * Wegweiser-Karte: für jedes Feld die Entfernung zum nächsten Ziel (Dijkstra von allen Zielen
 * gleichzeitig, 8er-Nachbarschaft). Gäste folgen ihr mit `nextStep` bergab.
 */
export class FlowField {
  private constructor(
    private readonly grid: Grid,
    private readonly dist: Float64Array,
  ) {}

  static build(grid: Grid, goals: readonly Goal[]): FlowField {
    const w = grid.width;
    const dist = new Float64Array(w * grid.height).fill(Infinity);
    const heap = new Heap();
    for (const g of goals) {
      if (!isWalkable(grid, g.x, g.y)) continue;
      const i = g.y * w + g.x;
      if (g.cost < dist[i]) {
        dist[i] = g.cost;
        heap.push(i, g.cost);
      }
    }
    while (heap.size > 0) {
      const [i, d] = heap.pop();
      if (d > dist[i]) continue;
      const x = i % w;
      const y = (i - x) / w;
      for (const [dx, dy, cost] of STEPS) {
        // Rückwärts gedacht: vom Nachbarn hierher muss derselbe Schritt erlaubt sein (symmetrisch).
        if (!canStep(grid, x, y, dx, dy)) continue;
        const n = (y + dy) * w + x + dx;
        const nd = d + cost;
        if (nd < dist[n]) {
          dist[n] = nd;
          heap.push(n, nd);
        }
      }
    }
    return new FlowField(grid, dist);
  }

  /** Entfernung zum nächsten Ziel (unerreichbar oder nicht begehbar → Infinity). */
  distance(x: number, y: number): number {
    return this.grid.inBounds(x, y) ? this.dist[y * this.grid.width + x] : Infinity;
  }

  /** Nächstes Feld bergab; am Ziel oder unerreichbar → null. */
  nextStep(x: number, y: number): Cell | null {
    let best: Cell | null = null;
    let bestDist = this.distance(x, y);
    if (bestDist === Infinity) return null;
    for (const [dx, dy] of STEPS) {
      if (!canStep(this.grid, x, y, dx, dy)) continue;
      const d = this.distance(x + dx, y + dy);
      if (d < bestDist) {
        bestDist = d;
        best = { x: x + dx, y: y + dy };
      }
    }
    return best;
  }
}

/** Weg für einen Gast zu einem bestimmten Feld (A*): `from` ausgeschlossen, `to` eingeschlossen; unerreichbar → null. */
export function findPath(grid: Grid, from: Cell, to: Cell): Cell[] | null {
  if (from.x === to.x && from.y === to.y) return [];
  if (!isWalkable(grid, to.x, to.y) || !grid.inBounds(from.x, from.y)) return null;
  const w = grid.width;
  const size = w * grid.height;
  const cost = new Float64Array(size).fill(Infinity);
  const parent = new Int32Array(size).fill(-1);
  const start = from.y * w + from.x;
  const goal = to.y * w + to.x;
  const h = (x: number, y: number) => {
    const dx = Math.abs(x - to.x);
    const dy = Math.abs(y - to.y);
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  };
  const heap = new Heap();
  cost[start] = 0;
  heap.push(start, h(from.x, from.y));
  while (heap.size > 0) {
    const [i] = heap.pop();
    if (i === goal) break;
    const x = i % w;
    const y = (i - x) / w;
    for (const [dx, dy, step] of STEPS) {
      if (!canStep(grid, x, y, dx, dy)) continue;
      const n = (y + dy) * w + x + dx;
      const nc = cost[i] + step;
      if (nc < cost[n]) {
        cost[n] = nc;
        parent[n] = i;
        heap.push(n, nc + h(x + dx, y + dy));
      }
    }
  }
  if (cost[goal] === Infinity) return null;
  const path: Cell[] = [];
  for (let i = goal; i !== start; i = parent[i]) path.push({ x: i % w, y: Math.floor(i / w) });
  return path.reverse();
}
