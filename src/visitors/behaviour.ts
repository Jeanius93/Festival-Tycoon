import type { Cell, Grid } from '../building/grid';
import type { Random } from '../core/random';
import { findPath, isWalkable } from './flowField';
import type { Guest } from './guest';
import { moveToward } from './movement';
import type { Offers } from './offers';
import { TUNING } from './tuning';

/** Was ein Gast für einen Tick über die Welt wissen muss. */
export interface GuestWorld {
  grid: Grid;
  offers: Offers;
  rng: Random;
  second: number;
  /** Zelteingang seiner Gruppe */
  door: Cell;
  /** Seine Gruppe reist ab */
  leaving: boolean;
}

const cellOf = (g: Guest): Cell => ({ x: Math.floor(g.x), y: Math.floor(g.y) });
const center = (c: Cell) => ({ x: c.x + 0.5, y: c.y + 0.5 });

/** Nächstes begehbares Feld (Breitensuche in Ringen); null, wenn es keines gibt. */
function nearestWalkable(grid: Grid, from: Cell): Cell | null {
  const max = Math.max(grid.width, grid.height);
  for (let r = 1; r <= max; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (isWalkable(grid, from.x + dx, from.y + dy)) return { x: from.x + dx, y: from.y + dy };
      }
    }
  }
  return null;
}

/** Geht einen Weg ein Stück weiter. 'blocked' = das nächste Feld ist nicht mehr begehbar. */
function walkPath(g: Guest, path: Cell[], grid: Grid): 'moving' | 'blocked' | 'done' {
  const next = path[0];
  if (!next) return 'done';
  if (!isWalkable(grid, next.x, next.y)) return 'blocked';
  if (moveToward(g, center(next), TUNING.walkPerTick)) path.shift();
  return path.length === 0 ? 'done' : 'moving';
}

/** Auf dem Weg zum Zelt: laufen, bei Hindernis neu planen, ohne Weg „eingesperrt“ (alle retrySeconds neuer Versuch). */
function goToTent(g: Guest, w: GuestWorld): void {
  const s = g.state;
  if (s.kind !== 'toTent') return;
  const here = cellOf(g);
  const atDoor = here.x === w.door.x && here.y === w.door.y;
  if (s.path.length === 0 && !atDoor) {
    if (g.stuck && w.second < g.nextSeekAt) return;
    const path = findPath(w.grid, here, w.door);
    if (!path) {
      g.stuck = true;
      g.nextSeekAt = w.second + TUNING.retrySeconds;
      return;
    }
    g.stuck = false;
    s.path = path;
  }
  const r = walkPath(g, s.path, w.grid);
  if (r === 'blocked') {
    s.path = [];
    return;
  }
  if (r === 'done' && moveToward(g, center(w.door), TUNING.walkPerTick)) {
    g.stuck = false;
    g.state = { kind: 'inTent', purpose: s.purpose };
  }
}

/** Ein Tick für einen Gast. */
export function stepGuest(g: Guest, w: GuestWorld): void {
  // 1. Auf einem Feld, das gerade blockiert wurde (Zaun, Gebäude)? Sofort daneben stellen.
  const here = cellOf(g);
  if (g.state.kind !== 'inTent' && !isWalkable(w.grid, here.x, here.y)) {
    const free = nearestWalkable(w.grid, here);
    if (free) {
      g.x = free.x + 0.5;
      g.y = free.y + 0.5;
    }
    if (g.state.kind === 'toTent' || g.state.kind === 'wander') g.state.path = [];
  }
  // 2. Abreise: aus der Schlange, ab zum Zelt
  if (w.leaving && !(g.state.kind === 'inTent' && g.state.purpose === 'leave')) {
    if (g.state.kind === 'queue') w.offers.leave(g.state.buildingId, g.id);
    if (g.state.kind !== 'toTent' || g.state.purpose !== 'leave') {
      g.state = { kind: 'toTent', path: [], purpose: 'leave' };
      g.nextSeekAt = 0;
    }
  }
  // 4. Zum Zelt laufen
  if (g.state.kind === 'toTent') goToTent(g, w);
}
