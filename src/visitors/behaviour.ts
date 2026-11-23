import type { Cell, Grid } from '../building/grid';
import { isSleepTime } from '../core/clock';
import type { Random } from '../core/random';
import { findPath, isWalkable } from './flowField';
import { chooseTarget, seekableNeeds, type Guest } from './guest';
import { moveToward } from './movement';
import { queueSpot, type Offers } from './offers';
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

const wander = (w: GuestWorld): Guest['state'] => ({
  kind: 'wander',
  path: [],
  waitTicks: w.rng.int(TUNING.wanderWaitTicks.min, TUNING.wanderWaitTicks.max + 1),
});

/** Kein passendes Angebot erreichbar: umherschlendern und später erneut versuchen. */
function giveUp(g: Guest, w: GuestWorld): void {
  g.nextSeekAt = w.second + TUNING.retrySeconds;
  g.state = wander(w);
}

/** Einer Wegweiser-Karte folgen; am Ziel anstellen bzw. zuschauen. */
function seek(g: Guest, w: GuestWorld): void {
  if (g.state.kind !== 'seek') return;
  const type = g.state.type;
  const field = w.offers.field(type);
  const here = cellOf(g);
  if (field.distance(here.x, here.y) === Infinity) {
    giveUp(g, w);
    return;
  }
  const next = field.nextStep(here.x, here.y);
  if (next) {
    moveToward(g, center(next), TUNING.walkPerTick);
    return;
  }
  // Am Ziel: erst in die Feldmitte, dann anstellen bzw. zuschauen.
  if (!moveToward(g, center(here), TUNING.walkPerTick)) return;
  if (type === 'stage') {
    // Einen zufälligen Platz im Zuschauerbereich suchen, damit sich die Menge verteilt.
    const spots = w.offers.audienceAt(here.x, here.y) ?? [here];
    const spot = w.rng.pick(spots);
    g.state = { kind: 'watch', path: findPath(w.grid, here, spot) ?? [] };
    return;
  }
  const b = w.offers.buildingAtService(here.x, here.y);
  if (b && b.type === type && w.offers.join(b.id, g.id)) g.state = { kind: 'queue', buildingId: b.id };
  else giveUp(g, w);
}

/** Umherschlendern: kurz warten, dann ein zufälliges Feld in der Nähe ansteuern. */
function stroll(g: Guest, w: GuestWorld): void {
  if (g.state.kind !== 'wander') return;
  const s = g.state;
  if (s.path.length > 0) {
    if (walkPath(g, s.path, w.grid) === 'blocked') s.path = [];
    return;
  }
  if (s.waitTicks > 0) {
    s.waitTicks--;
    return;
  }
  // Ziel in der Nähe des eigenen Zeltes: Der Zeltplatz ist das Zuhause der Gäste.
  const here = cellOf(g);
  const r = TUNING.wanderRadius;
  const target = { x: w.door.x + w.rng.int(-r, r + 1), y: w.door.y + w.rng.int(-r, r + 1) };
  s.path = (isWalkable(w.grid, target.x, target.y) && findPath(w.grid, here, target)) || [];
  s.waitTicks = w.rng.int(TUNING.wanderWaitTicks.min, TUNING.wanderWaitTicks.max + 1);
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
  // 3. Schlafenszeit: ins Zelt; morgens wieder raus
  const sleepTime = isSleepTime(w.second);
  const k = g.state.kind;
  if (sleepTime && (k === 'wander' || k === 'seek' || k === 'watch')) {
    g.state = { kind: 'toTent', path: [], purpose: 'sleep' };
  } else if (!sleepTime && g.state.kind === 'inTent' && g.state.purpose === 'sleep') {
    g.state = wander(w);
  } else if (!sleepTime && g.state.kind === 'toTent' && g.state.purpose === 'sleep') {
    g.stuck = false;
    g.state = wander(w);
  }
  // 4. Zum Zelt laufen
  if (g.state.kind === 'toTent') {
    goToTent(g, w);
    return;
  }
  if (g.state.kind === 'inTent') return;
  // 5. Dringende Bedürfnisse: das dringendste, für das es ein erreichbares Angebot gibt
  if (g.state.kind === 'wander' && w.second >= g.nextSeekAt) {
    const needs = seekableNeeds(g);
    for (const need of needs) {
      const type = chooseTarget(g, need, (t) => w.offers.field(t));
      if (!type) continue;
      g.state = { kind: 'seek', type };
      break;
    }
    if (needs.length > 0 && g.state.kind === 'wander') g.nextSeekAt = w.second + TUNING.retrySeconds;
  }
  switch (g.state.kind) {
    case 'seek':
      seek(g, w); // 6.
      return;
    case 'queue': {
      // 7. In der Schlange zum eigenen Platz aufrücken
      const id = g.state.buildingId;
      const b = w.offers.building(id);
      const index = w.offers.queue(id).indexOf(g.id);
      if (!b || index < 0) {
        g.state = wander(w);
        return;
      }
      moveToward(g, queueSpot(b, index), TUNING.walkPerTick);
      return;
    }
    case 'watch': {
      // 8. Zuschauen, bis die Bühne zu ist, die Musik reicht oder etwas anderes drängt
      // Steht der Gast nicht mehr im Zuschauerbereich einer offenen Bühne (abgerissen, geschlossen)?
      const stageGone = w.offers.audienceAt(here.x, here.y) === null;
      const other = (['thirst', 'hunger', 'toilet', 'souvenir'] as const).some((n) => g.needs[n] >= TUNING.urgentAt);
      if (stageGone || g.needs.music <= 0 || other) {
        g.state = wander(w);
        return;
      }
      if (g.state.path.length > 0 && walkPath(g, g.state.path, w.grid) === 'blocked') g.state.path = [];
      return;
    }
    case 'wander':
      stroll(g, w); // 9.
      return;
  }
}
