import type { BuildingType } from '../building/catalog';
import type { Cell } from '../building/grid';
import { isStageTime } from '../core/clock';
import type { Random } from '../core/random';
import { FESTIVAL, TIME } from '../config';
import type { FlowField } from './flowField';
import { FOOD_TYPES } from './offers';
import { GUEST_COLORS } from './palette';
import { TUNING } from './tuning';

/** Bedürfnisse eines Gastes (0 … 100). Schlaf regelt der Tagesablauf, nicht ein Wert. */
export type NeedKind = 'thirst' | 'hunger' | 'toilet' | 'music' | 'souvenir';

/** Was in der Denkblase über dem Kopf steht. */
export type Bubble = NeedKind | 'sleep' | 'angry' | 'stuck';

export type GuestState =
  | { kind: 'wander'; path: Cell[]; waitTicks: number }
  | { kind: 'seek'; type: BuildingType }
  | { kind: 'queue'; buildingId: number }
  | { kind: 'watch' }
  | { kind: 'toTent'; path: Cell[]; purpose: 'sleep' | 'leave' }
  | { kind: 'inTent'; purpose: 'sleep' | 'leave' };

/** Ein Gast. `x`/`y` in Feldern; die Mitte eines Feldes liegt bei Index + 0,5. */
export interface Guest {
  readonly id: number;
  readonly groupId: number;
  readonly color: number;
  x: number;
  y: number;
  needs: Record<NeedKind, number>;
  souvenirAt: number;
  souvenirDone: boolean;
  lastFood: BuildingType | null;
  satisfaction: number;
  lowSince: number | null;
  nextSeekAt: number;
  stuck: boolean;
  state: GuestState;
}


/** Reihenfolge bei gleich dringenden Bedürfnissen. */
const PRIORITY: readonly NeedKind[] = ['toilet', 'thirst', 'hunger', 'music', 'souvenir'];

const TARGETS: Record<NeedKind, readonly BuildingType[]> = {
  thirst: ['beer'],
  hunger: FOOD_TYPES,
  toilet: ['toilet'],
  music: ['stage'],
  souvenir: ['merch'],
};

const HOURS_PER_TICK = TIME.tickSeconds / 3600;
const clamp = (v: number) => Math.min(100, Math.max(0, v));

export function createGuest(id: number, groupId: number, door: Cell, rng: Random, now: number): Guest {
  return {
    id,
    groupId,
    color: rng.pick(GUEST_COLORS),
    x: door.x + 0.5,
    y: door.y + 0.5,
    needs: { thirst: rng.int(0, 31), hunger: rng.int(0, 31), toilet: rng.int(0, 31), music: 0, souvenir: 0 },
    souvenirAt: rng.int(now, FESTIVAL.departureSecond),
    souvenirDone: false,
    lastFood: null,
    satisfaction: TUNING.satisfaction.start,
    lowSince: null,
    nextSeekAt: 0,
    stuck: false,
    state: { kind: 'wander', path: [], waitTicks: 0 },
  };
}

/** Ein Tick: Bedürfnisse wachsen (im Zelt nicht; Musik nur zur Bühnenzeit). */
export function growNeeds(g: Guest, second: number): void {
  if (g.state.kind === 'inTent') return;
  const rate = TUNING.needPerHour;
  g.needs.thirst = clamp(g.needs.thirst + rate.thirst * HOURS_PER_TICK);
  g.needs.hunger = clamp(g.needs.hunger + rate.hunger * HOURS_PER_TICK);
  g.needs.toilet = clamp(g.needs.toilet + rate.toilet * HOURS_PER_TICK);
  if (isStageTime(second)) g.needs.music = clamp(g.needs.music + rate.music * HOURS_PER_TICK);
  if (!g.souvenirDone && second >= g.souvenirAt && g.needs.souvenir < TUNING.souvenirWish) {
    g.needs.souvenir = TUNING.souvenirWish;
  }
}

/** Alle Bedürfnisse ab `seekAt`, dringendstes zuerst (Gleichstand: Reihenfolge von PRIORITY). */
export function seekableNeeds(g: Guest): NeedKind[] {
  return PRIORITY.filter((n) => g.needs[n] >= TUNING.seekAt).sort((a, b) => g.needs[b] - g.needs[a]);
}

/** Das dringendste Bedürfnis ab `seekAt`, sonst null. */
export function urgentNeed(g: Guest): NeedKind | null {
  return seekableNeeds(g)[0] ?? null;
}

/** Welche Gebäudeart der Gast für dieses Bedürfnis ansteuert (nächste erreichbare, beim Essen mit Abwechslung). */
export function chooseTarget(
  g: Guest,
  need: NeedKind,
  field: (type: BuildingType) => FlowField,
): BuildingType | null {
  const cx = Math.floor(g.x);
  const cy = Math.floor(g.y);
  let best: BuildingType | null = null;
  let bestValue = Infinity;
  for (const type of TARGETS[need]) {
    const penalty = need === 'hunger' && type === g.lastFood ? TUNING.varietyPenalty : 0;
    const value = field(type).distance(cx, cy) + penalty;
    if (value < bestValue) {
      bestValue = value;
      best = type;
    }
  }
  return best;
}

/** Der Gast wurde bedient (Stand, Klo, Merch). */
export function fulfil(g: Guest, type: BuildingType): void {
  const s = TUNING.satisfaction;
  let bonus: number = s.served;
  if (type === 'beer') g.needs.thirst = 0;
  else if (type === 'toilet') g.needs.toilet = 0;
  else if (type === 'merch') {
    g.needs.souvenir = 0;
    g.souvenirDone = true;
    bonus = s.souvenir;
  } else if ((FOOD_TYPES as readonly BuildingType[]).includes(type)) {
    const same = type === g.lastFood;
    g.needs.hunger = same ? TUNING.sameFoodHungerLeft : 0;
    bonus = same ? s.sameFood : s.newFood;
    g.lastFood = type;
  }
  g.satisfaction = clamp(g.satisfaction + bonus);
}

/** Ein Tick Laune. 'leave', wenn der Gast seit `leaveAfterSeconds` unter `leaveBelow` liegt. */
export function tickSatisfaction(
  g: Guest,
  ctx: { second: number; queueing: boolean; watchingMusic: boolean },
): 'stay' | 'leave' {
  const s = TUNING.satisfaction;
  let perHour = 0;
  for (const need of PRIORITY) if (g.needs[need] >= TUNING.urgentAt) perHour += s.urgentPerHour;
  if (ctx.queueing) perHour += s.queuePerHour;
  if (ctx.watchingMusic) {
    perHour += s.musicPerHour;
    g.needs.music = clamp(g.needs.music - TUNING.musicReliefPerHour * HOURS_PER_TICK);
  }
  if (g.stuck) perHour += s.stuckPerHour;
  g.satisfaction = clamp(g.satisfaction + perHour * HOURS_PER_TICK);
  if (g.satisfaction >= TUNING.leaveBelow) {
    g.lowSince = null;
    return 'stay';
  }
  g.lowSince ??= ctx.second;
  return ctx.second - g.lowSince >= TUNING.leaveAfterSeconds ? 'leave' : 'stay';
}

/** Die Denkblase über dem Kopf (null = keine). */
export function bubbleOf(g: Guest, _second: number): Bubble | null {
  if (g.state.kind === 'inTent') return null;
  if (g.stuck) return 'stuck';
  if (g.satisfaction < TUNING.leaveBelow) return 'angry';
  if (g.state.kind === 'toTent' && g.state.purpose === 'sleep') return 'sleep';
  let best: NeedKind | null = null;
  for (const need of PRIORITY) {
    if (g.needs[need] < TUNING.bubbleAt) continue;
    if (best === null || g.needs[need] > g.needs[best]) best = need;
  }
  return best;
}
