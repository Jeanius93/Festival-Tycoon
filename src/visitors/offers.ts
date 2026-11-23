import { BUILDING_TYPES, type BuildingType } from '../building/catalog';
import type { Building, Cell, Facing, Grid } from '../building/grid';
import { backCells, isDelivered } from '../building/placement';
import type { RoadNetwork } from '../building/roadNetwork';
import { isStageTime } from '../core/clock';
import { FlowField, isWalkable, walkMask, type Goal } from './flowField';
import { TUNING } from './tuning';

/** Essensstände (Abwechslung zählt). */
export const FOOD_TYPES = ['fries', 'bratwurst', 'pizza'] as const;

const OPPOSITE: Record<Facing, Facing> = { N: 'S', E: 'W', S: 'N', W: 'E' };
/** Richtung „von der Theke nach außen“, je nachdem, wohin die Rückseite zeigt. */
const OUTWARD: Record<Facing, [number, number]> = { N: [0, 1], E: [-1, 0], S: [0, -1], W: [1, 0] };

/** Die Feldreihe direkt vor der Vorderseite. */
export function frontCells(b: Building): Cell[] {
  return backCells(b, OPPOSITE[b.facing]);
}

/** Das Feld vor der Mitte der Theke: hier wird bedient. */
export function serviceCell(b: Building): Cell {
  const cells = frontCells(b);
  return cells[Math.floor((cells.length - 1) / 2)];
}

/** Zuschauerbereich vor der Bühne (nur begehbare Felder). */
export function audienceCells(grid: Grid, b: Building): Cell[] {
  const [ox, oy] = OUTWARD[b.facing];
  const cells: Cell[] = [];
  for (let d = 0; d < TUNING.audienceDepth; d++) {
    for (const c of frontCells(b)) {
      const x = c.x + ox * d;
      const y = c.y + oy * d;
      if (isWalkable(grid, x, y)) cells.push({ x, y });
    }
  }
  return cells;
}

/** Wo der Gast auf Platz `index` der Schlange steht (Feldmitte; Platz 0 = an der Theke). */
export function queueSpot(b: Building, index: number): { x: number; y: number } {
  const s = serviceCell(b);
  const [ox, oy] = OUTWARD[b.facing];
  return { x: s.x + 0.5 + ox * index, y: s.y + 0.5 + oy * index };
}

/**
 * Was das Gelände den Gästen gerade bietet: welche Gebäude offen sind, die Schlangen
 * und für jede Gebäudeart eine Wegweiser-Karte zum nächsten erreichbaren Angebot.
 */
export class Offers {
  private readonly fields = new Map<BuildingType, FlowField>();
  private readonly open = new Map<number, Building>();
  private readonly queues = new Map<number, number[]>();
  private readonly progress = new Map<number, number>();
  private readonly services = new Map<number, Building>();
  /** Feld → Zuschauerbereich der offenen Bühne, zu der es gehört */
  private readonly audiences = new Map<number, Cell[]>();
  private dissolved: number[] = [];
  private maskKey = '';
  private readonly goalKeys = new Map<BuildingType, string>();

  constructor(private readonly grid: Grid) {
    const empty = FlowField.build(grid, []);
    for (const type of BUILDING_TYPES) this.fields.set(type, empty);
  }

  /** Neu bewerten: offen/geschlossen, Schlangen auflösen, Karten neu bauen. */
  refresh(roads: RoadNetwork, second: number): void {
    this.open.clear();
    this.services.clear();
    this.audiences.clear();
    for (const b of this.grid.buildings()) {
      const open = isDelivered(this.grid, b, roads) && (b.type !== 'stage' || isStageTime(second));
      if (!open) continue;
      this.open.set(b.id, b);
      if (b.type !== 'stage') {
        const s = serviceCell(b);
        this.services.set(s.y * this.grid.width + s.x, b);
      } else {
        const cells = audienceCells(this.grid, b);
        for (const c of cells) this.audiences.set(c.y * this.grid.width + c.x, cells);
      }
    }
    for (const [id, queue] of this.queues) {
      if (this.open.has(id)) continue;
      this.dissolved.push(...queue);
      this.queues.delete(id);
      this.progress.delete(id);
    }
    const goals = new Map<BuildingType, Goal[]>();
    for (const b of this.open.values()) {
      const list = goals.get(b.type) ?? [];
      goals.set(b.type, list);
      if (b.type === 'stage') {
        for (const c of audienceCells(this.grid, b)) list.push({ ...c, cost: 0 });
        continue;
      }
      const waiting = this.queue(b.id).length;
      if (waiting >= TUNING.maxQueue) continue;
      list.push({ ...serviceCell(b), cost: waiting * TUNING.queueCostPerGuest });
    }
    // Karten nur neu bauen, wenn sich Begehbarkeit oder Ziele (inkl. Schlangen-Zuschlag) geändert haben.
    const mask = walkMask(this.grid);
    const maskKey = mask.join('');
    if (maskKey !== this.maskKey) {
      this.maskKey = maskKey;
      this.goalKeys.clear();
    }
    for (const type of BUILDING_TYPES) {
      const list = goals.get(type) ?? [];
      const key = list.map((g) => `${g.x},${g.y},${g.cost}`).join(';');
      if (this.goalKeys.get(type) === key) continue;
      this.goalKeys.set(type, key);
      this.fields.set(type, FlowField.build(this.grid, list, mask));
    }
  }

  field(type: BuildingType): FlowField {
    return this.fields.get(type)!;
  }

  /** Offenes Gebäude mit dieser Kennnummer (sonst null). */
  building(id: number): Building | null {
    return this.open.get(id) ?? null;
  }

  isOpen(id: number): boolean {
    return this.open.has(id);
  }

  /** Offener Stand bzw. offenes Klo, dessen Theke auf diesem Feld liegt. */
  buildingAtService(x: number, y: number): Building | null {
    return this.grid.inBounds(x, y) ? (this.services.get(y * this.grid.width + x) ?? null) : null;
  }

  /** Zuschauerbereich der offenen Bühne, zu dem dieses Feld gehört (sonst null). */
  audienceAt(x: number, y: number): readonly Cell[] | null {
    return this.grid.inBounds(x, y) ? (this.audiences.get(y * this.grid.width + x) ?? null) : null;
  }

  queue(id: number): readonly number[] {
    return this.queues.get(id) ?? [];
  }

  /** In die Schlange stellen; false, wenn geschlossen, Bühne oder voll. */
  join(id: number, guestId: number): boolean {
    const b = this.open.get(id);
    if (!b || b.type === 'stage') return false;
    const queue = this.queues.get(id) ?? [];
    if (queue.length >= TUNING.maxQueue) return false;
    queue.push(guestId);
    this.queues.set(id, queue);
    return true;
  }

  leave(id: number, guestId: number): void {
    const queue = this.queues.get(id);
    if (!queue) return;
    const i = queue.indexOf(guestId);
    if (i < 0) return;
    queue.splice(i, 1);
    if (i === 0) this.progress.delete(id);
  }

  /** Ein Tick Bedienen: liefert die Gäste, die gerade fertig bedient wurden. */
  serve(): Array<{ guestId: number; type: BuildingType }> {
    const served: Array<{ guestId: number; type: BuildingType }> = [];
    for (const [id, queue] of this.queues) {
      const b = this.open.get(id);
      if (!b || queue.length === 0) continue;
      const done = (this.progress.get(id) ?? 0) + 1;
      const needed = b.type === 'toilet' ? TUNING.serviceTicks.toilet : TUNING.serviceTicks.stall;
      if (done < needed) {
        this.progress.set(id, done);
        continue;
      }
      this.progress.delete(id);
      served.push({ guestId: queue.shift()!, type: b.type });
    }
    return served;
  }

  /** Gäste aus aufgelösten Schlangen (einmal abholbar). */
  takeDissolved(): number[] {
    const out = this.dissolved;
    this.dissolved = [];
    return out;
  }
}
