import { BORDER_TILES } from '../config';
import type { Cell, Grid } from '../building/grid';
import { lCells } from '../building/lineTool';
import type { RoadNetwork } from '../building/roadNetwork';
import { parkingCell, type Plot } from '../camping/campsites';
import { moveToward } from '../visitors/movement';
import { TUNING } from '../visitors/tuning';

/** Ein Punkt der Route; `needsPath` = hier muss ein Weg liegen (sonst wartet das Auto). */
export interface RouteStep {
  x: number;
  y: number;
  needsPath: boolean;
}

/** Ein Auto. `x`/`y` in Feldern (Mitte = Index + 0,5); die Straße liegt bei y = Höhe und Höhe + 1. */
export interface Car {
  readonly id: number;
  readonly groupId: number;
  readonly color: number;
  x: number;
  y: number;
  route: RouteStep[];
  state: 'arriving' | 'parked' | 'leaving';
  stuck: boolean;
}

const step = (c: Cell, needsPath: boolean): RouteStep => ({ x: c.x, y: c.y, needsPath });

/** Felder auf einer Fahrspur von `fromX` bis `toX` (beide eingeschlossen). */
function lane(fromX: number, toX: number, y: number): RouteStep[] {
  const out: RouteStep[] = [];
  const dir = toX >= fromX ? 1 : -1;
  for (let x = fromX; x !== toX + dir; x += dir) out.push({ x, y, needsPath: false });
  return out;
}

/** Anfahrt: Hinspur bis zur Einfahrt, über die Wege zum Zufahrtsfeld, dann übers Gelände zum Parkplatz. */
export function arrivalRoute(
  grid: Grid,
  roads: RoadNetwork,
  fromLaneX: number,
  access: Cell,
  plot: Plot,
): RouteStep[] | null {
  const road = roads.routeFromRoad(access);
  if (!road) return null;
  return [
    ...lane(fromLaneX, road[0].x, grid.height),
    ...road.map((c) => step(c, true)),
    ...lCells(access, parkingCell(plot), true)
      .slice(1)
      .map((c) => step(c, false)),
  ];
}

/** Vom Wegfeld `from` (mit Straßenanschluss) über die Wege zur Straße und auf der Rückspur bis zum rechten Rand. */
export function exitRoute(grid: Grid, roads: RoadNetwork, from: Cell): RouteStep[] | null {
  const road = roads.routeFromRoad(from);
  if (!road) return null;
  const entry = road[0];
  return [
    ...road
      .slice(0, -1)
      .reverse()
      .map((c) => step(c, true)),
    { x: entry.x, y: grid.height, needsPath: false },
    ...lane(entry.x, grid.width + BORDER_TILES - 1, grid.height + 1),
  ];
}

/** Abfahrt vom Stellplatz: übers Gelände zum Zufahrtsfeld, dann `exitRoute`. */
export function departureRoute(grid: Grid, roads: RoadNetwork, plot: Plot, access: Cell): RouteStep[] | null {
  const exit = exitRoute(grid, roads, access);
  if (!exit) return null;
  return [
    ...lCells(parkingCell(plot), access, false)
      .slice(1)
      .map((c) => step(c, false)),
    ...exit,
  ];
}

/** Ein Tick Fahren zum nächsten Routenpunkt. 'blocked' = dort fehlt der Weg (keine Bewegung). */
export function stepCar(car: Car, grid: Grid): 'moving' | 'blocked' | 'arrived' {
  const next = car.route[0];
  if (!next) return 'arrived';
  if (next.needsPath && !grid.isPath(next.x, next.y)) return 'blocked';
  if (moveToward(car, { x: next.x + 0.5, y: next.y + 0.5 }, TUNING.carPerTick)) car.route.shift();
  return car.route.length === 0 ? 'arrived' : 'moving';
}
