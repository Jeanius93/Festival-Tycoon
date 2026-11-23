import type { Cell, Grid } from '../building/grid';

/** Darf ein Gast hier stehen? Grundstück, kein Gebäude, kein Zaun, kein Personal-Tor. */
export function isWalkable(grid: Grid, x: number, y: number): boolean {
  if (!grid.inBounds(x, y) || grid.buildingAt(x, y)) return false;
  const s = grid.structureAt(x, y);
  return s === 'none' || s === 'visitorGate';
}

/** Begehbarkeit aller Felder auf einmal (1 = begehbar), damit Karten und Wegsuche schnell bleiben. */
export function walkMask(grid: Grid): Uint8Array {
  const mask = new Uint8Array(grid.width * grid.height);
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) if (isWalkable(grid, x, y)) mask[y * grid.width + x] = 1;
  }
  return mask;
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

/** Begehbar laut Maske (außerhalb des Grundstücks nie). */
function open(mask: Uint8Array, w: number, h: number, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
}

/** Ist der Schritt von (x, y) um (dx, dy) erlaubt? Schräg nur, wenn beide geraden Nachbarn begehbar sind. */
function canStep(mask: Uint8Array, w: number, h: number, x: number, y: number, dx: number, dy: number): boolean {
  if (!open(mask, w, h, x + dx, y + dy)) return false;
  if (dx === 0 || dy === 0) return true;
  return open(mask, w, h, x + dx, y) && open(mask, w, h, x, y + dy);
}

/** Kleiner Binär-Heap nach Priorität (für Dijkstra und A*), ohne Objekte pro Eintrag. */
class Heap {
  private idx = new Int32Array(256);
  private prio = new Float64Array(256);
  size = 0;
  /** Zuletzt mit pop() entnommene Priorität */
  lastPriority = 0;

  push(index: number, priority: number): void {
    if (this.size === this.idx.length) {
      const idx = new Int32Array(this.size * 2);
      const prio = new Float64Array(this.size * 2);
      idx.set(this.idx);
      prio.set(this.prio);
      this.idx = idx;
      this.prio = prio;
    }
    let i = this.size++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.prio[p] <= priority) break;
      this.idx[i] = this.idx[p];
      this.prio[i] = this.prio[p];
      i = p;
    }
    this.idx[i] = index;
    this.prio[i] = priority;
  }

  /** Entnimmt den Eintrag mit kleinster Priorität (Priorität danach in `lastPriority`). */
  pop(): number {
    const top = this.idx[0];
    this.lastPriority = this.prio[0];
    const n = --this.size;
    if (n > 0) {
      const li = this.idx[n];
      const lp = this.prio[n];
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        if (l >= n) break;
        const r = l + 1;
        const m = r < n && this.prio[r] < this.prio[l] ? r : l;
        if (this.prio[m] >= lp) break;
        this.idx[i] = this.idx[m];
        this.prio[i] = this.prio[m];
        i = m;
      }
      this.idx[i] = li;
      this.prio[i] = lp;
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
    private readonly mask: Uint8Array,
  ) {}

  /** `mask` darf übergeben werden, wenn mehrere Karten für denselben Stand des Grundstücks entstehen. */
  static build(grid: Grid, goals: readonly Goal[], mask: Uint8Array = walkMask(grid)): FlowField {
    const w = grid.width;
    const h = grid.height;
    const dist = new Float64Array(w * grid.height).fill(Infinity);
    const heap = new Heap();
    for (const g of goals) {
      if (!open(mask, w, h, g.x, g.y)) continue;
      const i = g.y * w + g.x;
      if (g.cost < dist[i]) {
        dist[i] = g.cost;
        heap.push(i, g.cost);
      }
    }
    while (heap.size > 0) {
      const i = heap.pop();
      const d = heap.lastPriority;
      if (d > dist[i]) continue;
      const x = i % w;
      const y = (i - x) / w;
      for (const [dx, dy, cost] of STEPS) {
        // Rückwärts gedacht: vom Nachbarn hierher muss derselbe Schritt erlaubt sein (symmetrisch).
        if (!canStep(mask, w, h, x, y, dx, dy)) continue;
        const n = (y + dy) * w + x + dx;
        const nd = d + cost;
        if (nd < dist[n]) {
          dist[n] = nd;
          heap.push(n, nd);
        }
      }
    }
    return new FlowField(grid, dist, mask);
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
      if (!canStep(this.mask, this.grid.width, this.grid.height, x, y, dx, dy)) continue;
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
  const hgt = grid.height;
  // Nur die besuchten Felder werden geprüft (die Suche bleibt meist klein), daher ohne Vorab-Maske.
  const seen = new Int8Array(w * hgt); // 0 = ungeprüft, 1 = begehbar, -1 = nicht begehbar
  const walk = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= w || y >= hgt) return false;
    const i = y * w + x;
    if (seen[i] === 0) seen[i] = isWalkable(grid, x, y) ? 1 : -1;
    return seen[i] === 1;
  };
  const step = (x: number, y: number, dx: number, dy: number): boolean =>
    walk(x + dx, y + dy) && (dx === 0 || dy === 0 || (walk(x + dx, y) && walk(x, y + dy)));
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
    const i = heap.pop();
    if (i === goal) break;
    const x = i % w;
    const y = (i - x) / w;
    for (const [dx, dy, len] of STEPS) {
      if (!step(x, y, dx, dy)) continue;
      const n = (y + dy) * w + x + dx;
      const nc = cost[i] + len;
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
