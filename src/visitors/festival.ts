import { BORDER_TILES, FESTIVAL } from '../config';
import type { Cell, Grid } from '../building/grid';
import { RoadNetwork, vehicleRoute } from '../building/roadNetwork';
import { campRoute, findCampZones, freePlots, parkingCell, plotCells, tentDoor, type CampZone, type Plot } from '../camping/campsites';
import { GameClock } from '../core/clock';
import { Random } from '../core/random';
import { arrivalRoute, departureRoute, exitRoute, stepCar, type Car, type RouteStep } from '../vehicles/car';
import { stepGuest } from './behaviour';
import { createGuest, fulfil, growNeeds, tickSatisfaction, type Guest } from './guest';
import { Offers } from './offers';
import { CAR_COLORS, TENT_COLORS } from './palette';
import { TUNING } from './tuning';

export type FestivalPhase = 'building' | 'running' | 'finished';

/** Ein Zelt auf seinem Stellplatz (linke Spalte). */
export interface Tent {
  readonly groupId: number;
  readonly plot: Plot;
  readonly color: number;
}

/** Ergebnis am Ende des Festivals. */
export interface FestivalSummary {
  guests: number;
  /** Durchschnittliche Zufriedenheit aller Gäste beim Abreisen (gerundet) */
  satisfaction: number;
  leftEarly: number;
  /** Abgeschleppte Autos */
  towed: number;
}

/** Eine Reisegruppe: ein Auto, ein Zelt, zwei Gäste. */
interface Group {
  readonly id: number;
  readonly plot: Plot;
  readonly carId: number;
  guestIds: number[];
  leaving: boolean;
  early: boolean;
  /** Belegung des Stellplatzes schon freigegeben (Auto ist weggefahren) */
  plotFreed: boolean;
}

/** Auto mit Merker, bei welchem Stand des Grundstücks zuletzt vergeblich neu geplant wurde. */
type CarEntry = Car & { checkedVersion: number };


/**
 * Das Festival als reine Simulation ohne Grafik: Uhr, Anreise, Autos, Zelte, Gäste,
 * Angebote und Abreise. Rechnet in festen Ticks; `update` wandelt echte Zeit in Ticks um.
 */
export class Festival {
  readonly clock = new GameClock(FESTIVAL.startSecond);
  private rng: Random;
  private currentPhase: FestivalPhase = 'building';
  private readonly offers: Offers;
  private roads: RoadNetwork;
  private campZones: CampZone[] = [];
  private gridVersion = 0;
  private seenVersion = -1;
  private fieldsDirty = true;
  private tickCount = 0;
  private nextId = 1;
  private readonly groups = new Map<number, Group>();
  private readonly carMap = new Map<number, CarEntry>();
  private readonly guestMap = new Map<number, Guest>();
  private readonly tentMap = new Map<number, Tent>();
  private departureStarted = false;
  private arrived = 0;
  private departedSum = 0;
  private departedCount = 0;
  private leftEarly = 0;
  private towed = 0;
  private result: FestivalSummary | null = null;

  constructor(
    private readonly grid: Grid,
    private readonly seed = 1,
  ) {
    this.rng = new Random(seed);
    this.offers = new Offers(grid);
    this.roads = new RoadNetwork(grid);
    grid.onChange(() => this.gridVersion++);
  }

  get phase(): FestivalPhase {
    return this.currentPhase;
  }

  get summary(): FestivalSummary | null {
    return this.result;
  }

  guests(): readonly Guest[] {
    return [...this.guestMap.values()];
  }

  cars(): readonly Car[] {
    return [...this.carMap.values()];
  }

  tents(): readonly Tent[] {
    return [...this.tentMap.values()];
  }

  /** Alle Zeltflächen mit Zufahrt (für Warnschilder). */
  zones(): readonly CampZone[] {
    this.sync();
    return this.campZones;
  }

  /** Anwesende Gäste und ihre durchschnittliche Zufriedenheit (gerundet). */
  stats(): { guests: number; satisfaction: number } {
    const all = [...this.guestMap.values()];
    if (all.length === 0) return { guests: 0, satisfaction: 0 };
    return { guests: all.length, satisfaction: Math.round(all.reduce((s, g) => s + g.satisfaction, 0) / all.length) };
  }

  /** Startbar, wenn es mindestens einen freien Stellplatz auf einer angeschlossenen Zeltfläche gibt. */
  canStart(): boolean {
    return this.currentPhase === 'building' && this.startBlocker() === null;
  }

  /** Warum nicht gestartet werden kann: keine angeschlossene Zeltfläche, oder keine hat einen freien 2 × 2-Platz. */
  startBlocker(): 'missing' | 'tooSmall' | null {
    if (this.findFreePlot()) return null;
    return this.campZones.some((z) => z.access) ? 'tooSmall' : 'missing';
  }

  start(): boolean {
    if (!this.canStart()) return false;
    this.reset();
    this.currentPhase = 'running';
    return true;
  }

  /** Echte Millisekunden → so viele Ticks, wie die Uhr verlangt. */
  update(realMs: number): void {
    if (this.currentPhase !== 'running') return;
    const ticks = this.clock.consume(realMs);
    for (let i = 0; i < ticks && this.currentPhase === 'running'; i++) this.tick();
  }

  /** Ein fester Rechenschritt. */
  tick(): void {
    if (this.currentPhase !== 'running') return;
    this.sync();
    this.clock.step();
    const second = this.clock.second;

    if (!this.departureStarted && second < FESTIVAL.arrivalEndSecond && this.tickCount % TUNING.arrivalEveryTicks === 0) {
      this.spawnCar();
    }
    if (!this.departureStarted && second >= FESTIVAL.departureSecond) {
      this.departureStarted = true;
      for (const group of this.groups.values()) group.leaving = true;
    }
    if (second >= FESTIVAL.towSecond) this.towAll();
    if (this.fieldsDirty || this.tickCount % TUNING.fieldRefreshTicks === 0) {
      this.offers.refresh(this.roads, second);
      this.fieldsDirty = false;
      for (const id of this.offers.takeDissolved()) {
        const g = this.guestMap.get(id);
        if (g?.state.kind === 'queue') g.state = { kind: 'wander', path: [], waitTicks: 0 };
      }
    }

    this.moveCars();
    this.moveGuests(second);
    for (const s of this.offers.serve()) {
      const g = this.guestMap.get(s.guestId);
      if (!g) continue;
      fulfil(g, s.type);
      g.state = { kind: 'wander', path: [], waitTicks: 0 };
    }
    this.packUp();

    if (this.departureStarted && this.groups.size === 0) this.finish();
    this.tickCount++;
  }

  /** Zusammenfassung weggeklickt: zurück in den Bauzustand. */
  closeSummary(): void {
    if (this.currentPhase !== 'finished') return;
    this.reset();
    this.currentPhase = 'building';
  }

  /** Straßennetz und Zeltflächen nach Änderungen am Grundstück neu bewerten. */
  private sync(): void {
    if (this.seenVersion === this.gridVersion) return;
    this.seenVersion = this.gridVersion;
    this.roads = new RoadNetwork(this.grid);
    this.campZones = findCampZones(this.grid, this.roads);
    this.fieldsDirty = true;
  }

  private reset(): void {
    for (const group of this.groups.values()) this.freePlot(group);
    this.groups.clear();
    this.carMap.clear();
    this.guestMap.clear();
    this.tentMap.clear();
    this.offers.takeDissolved();
    this.rng = new Random(this.seed);
    this.clock.second = FESTIVAL.startSecond;
    this.clock.paused = false;
    this.clock.setSpeed(1);
    this.clock.consume(0);
    this.tickCount = 0;
    this.departureStarted = false;
    this.arrived = 0;
    this.departedSum = 0;
    this.departedCount = 0;
    this.leftEarly = 0;
    this.towed = 0;
    this.result = null;
    this.fieldsDirty = true;
  }

  private findFreePlot(): { zone: CampZone; plot: Plot } | null {
    this.sync();
    for (const zone of this.campZones) {
      if (!zone.access) continue;
      const plot = freePlots(this.grid, zone)[0];
      if (plot) return { zone, plot };
    }
    return null;
  }

  private zoneOf(plot: Plot): CampZone | null {
    this.sync();
    return this.campZones.find((z) => z.cells.some((c) => c.x === plot.x && c.y === plot.y)) ?? null;
  }

  private spawnCar(): void {
    if ((this.groups.size + 1) * FESTIVAL.guestsPerCar > FESTIVAL.maxGuests) return;
    const free = this.findFreePlot();
    if (!free || !free.zone.access) return;
    const route = arrivalRoute(this.grid, this.roads, -BORDER_TILES, free.zone.access, free.plot);
    if (!route) return;
    const groupId = this.nextId++;
    const carId = this.nextId++;
    const start = route[0];
    this.carMap.set(carId, {
      id: carId,
      groupId,
      color: this.rng.pick(CAR_COLORS),
      x: start.x + 0.5,
      y: start.y + 0.5,
      route,
      state: 'arriving',
      stuck: false,
      checkedVersion: -1,
    });
    this.groups.set(groupId, { id: groupId, plot: free.plot, carId, guestIds: [], leaving: false, early: false, plotFreed: false });
    this.grid.setOccupied(plotCells(free.plot), true);
  }

  private moveCars(): void {
    for (const car of this.carMap.values()) {
      if (car.state === 'parked') continue;
      if (car.stuck) {
        if (car.checkedVersion === this.gridVersion) continue;
        if (!this.replan(car)) continue;
      }
      const result = stepCar(car, this.grid);
      if (result === 'blocked') {
        if (!this.replan(car)) continue;
      } else if (result === 'arrived') {
        if (car.state === 'arriving') this.parked(car);
        else this.carGone(car);
        continue;
      }
      if (car.state === 'leaving') this.maybeFreePlot(car);
    }
  }

  /** Neue Route ab der aktuellen Position; ohne Route wartet das Auto bis zur nächsten Änderung am Grundstück. */
  private replan(car: CarEntry): boolean {
    const group = this.groups.get(car.groupId);
    const route = group ? this.routeFromHere(car, group) : null;
    if (!route) {
      car.stuck = true;
      car.checkedVersion = this.gridVersion;
      return false;
    }
    car.route = route;
    car.stuck = false;
    return true;
  }

  private routeFromHere(car: CarEntry, group: Group): RouteStep[] | null {
    this.sync();
    const here: Cell = { x: Math.floor(car.x), y: Math.floor(car.y) };
    const onRoad = here.y >= this.grid.height;
    const onPath = this.grid.isPath(here.x, here.y);
    const access = this.zoneOf(group.plot)?.access;
    const viaPaths = (to: Cell) => vehicleRoute(this.grid, here, to)?.map((c) => ({ ...c, needsPath: true })) ?? null;
    const overCamp = (from: Cell, to: Cell) =>
      campRoute(this.grid, from, to)?.map((c) => ({ ...c, needsPath: false })) ?? null;
    if (car.state === 'arriving') {
      if (!access) return null;
      if (onRoad) return arrivalRoute(this.grid, this.roads, here.x, access, group.plot);
      const parking = parkingCell(group.plot);
      if (!onPath) return overCamp(here, parking);
      const toAccess = viaPaths(access);
      const last = overCamp(access, parking);
      return toAccess && last ? [...toAccess, ...last] : null;
    }
    if (onRoad) return null; // auf der Rückspur gibt es nichts zu blockieren
    if (onPath && this.roads.isConnected(here.x, here.y)) return exitRoute(this.grid, this.roads, here);
    // Sonst nur über Wege bzw. die Zeltfläche zur Zufahrt, nie quer über die Wiese.
    if (!access) return null;
    const toAccess = onPath ? viaPaths(access) : overCamp(here, access);
    const exit = exitRoute(this.grid, this.roads, access);
    return toAccess && exit ? [...toAccess, ...exit] : null;
  }

  /** Auto ist angekommen: Zelt aufbauen, zwei Gäste steigen aus. */
  private parked(car: CarEntry): void {
    car.state = 'parked';
    const group = this.groups.get(car.groupId);
    if (!group) return;
    this.tentMap.set(group.id, { groupId: group.id, plot: group.plot, color: this.rng.pick(TENT_COLORS) });
    for (let i = 0; i < FESTIVAL.guestsPerCar; i++) {
      const id = this.nextId++;
      this.guestMap.set(id, createGuest(id, group.id, tentDoor(group.plot), this.rng, this.clock.second));
      group.guestIds.push(id);
      this.arrived++;
    }
  }

  private moveGuests(second: number): void {
    for (const g of this.guestMap.values()) {
      const group = this.groups.get(g.groupId);
      if (!group) continue;
      growNeeds(g, second);
      stepGuest(g, {
        grid: this.grid,
        offers: this.offers,
        rng: this.rng,
        second,
        door: tentDoor(group.plot),
        leaving: group.leaving,
      });
      // Im Zelt (Schlaf, eingepackt) ändert sich die Laune nicht.
      if (g.state.kind === 'inTent') continue;
      const mood = tickSatisfaction(g, {
        second,
        queueing: g.state.kind === 'queue',
        watchingMusic: g.state.kind === 'watch',
      });
      if (mood === 'leave' && !group.leaving) {
        group.leaving = true;
        group.early = true;
      }
    }
  }

  /** Gruppen, deren Gäste alle eingepackt im Zelt sind, fahren los. */
  private packUp(): void {
    for (const group of this.groups.values()) {
      if (!group.leaving) continue;
      const car = this.carMap.get(group.carId);
      if (!car || car.state !== 'parked') continue;
      const guests = group.guestIds.map((id) => this.guestMap.get(id)).filter((g): g is Guest => !!g);
      if (!guests.every((g) => g.state.kind === 'inTent' && g.state.purpose === 'leave')) continue;
      for (const g of guests) this.depart(g, group);
      group.guestIds = [];
      this.tentMap.delete(group.id);
      car.state = 'leaving';
      const access = this.zoneOf(group.plot)?.access;
      const route = access ? departureRoute(this.grid, this.roads, group.plot, access) : null;
      if (route) car.route = route;
      else this.replan(car);
    }
  }

  private depart(g: Guest, group: Group): void {
    this.departedSum += g.satisfaction;
    this.departedCount++;
    if (group.early) this.leftEarly++;
    this.guestMap.delete(g.id);
  }

  /** Belegung freigeben, sobald das abfahrende Auto seinen Stellplatz verlassen hat. */
  private maybeFreePlot(car: CarEntry): void {
    const group = this.groups.get(car.groupId);
    if (!group || group.plotFreed) return;
    const x = Math.floor(car.x);
    const y = Math.floor(car.y);
    if (plotCells(group.plot).some((c) => c.x === x && c.y === y)) return;
    this.freePlot(group);
  }

  private freePlot(group: Group): void {
    if (group.plotFreed) return;
    group.plotFreed = true;
    this.grid.setOccupied(plotCells(group.plot), false);
  }

  private carGone(car: CarEntry): void {
    this.carMap.delete(car.id);
    const group = this.groups.get(car.groupId);
    if (!group) return;
    this.freePlot(group);
    this.groups.delete(group.id);
  }

  /** Tag 4, 14:00: wer noch da ist, wird abgeschleppt. */
  private towAll(): void {
    for (const group of [...this.groups.values()]) {
      for (const id of group.guestIds) {
        const g = this.guestMap.get(id);
        if (g) this.depart(g, group);
      }
      this.tentMap.delete(group.id);
      this.carMap.delete(group.carId);
      this.freePlot(group);
      this.groups.delete(group.id);
      this.towed++;
    }
  }

  private finish(): void {
    this.currentPhase = 'finished';
    this.result = {
      guests: this.arrived,
      satisfaction: this.departedCount === 0 ? 0 : Math.round(this.departedSum / this.departedCount),
      leftEarly: this.leftEarly,
      towed: this.towed,
    };
  }
}
