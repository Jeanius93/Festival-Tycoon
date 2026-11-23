import { describe, it, expect } from 'vitest';
import { Grid } from '../src/building/grid';
import { RoadNetwork } from '../src/building/roadNetwork';
import { arrivalRoute, departureRoute, stepCar, type Car, type RouteStep } from '../src/vehicles/car';
import { camp } from './helpers/festivalScenes';

const carAt = (x: number, y: number, route: RouteStep[]): Car => ({
  id: 1,
  groupId: 1,
  color: 0,
  x,
  y,
  route,
  state: 'arriving',
  stuck: false,
});

describe('Auto', () => {
  it('stepCar fährt nicht auf ein Feld, dessen Weg fehlt', () => {
    const g = new Grid(5, 5);
    g.applyPath([{ x: 1, y: 4 }], true);
    const car = carAt(1.5, 4.5, [{ x: 1, y: 3, needsPath: true }]);
    expect(stepCar(car, g)).toBe('blocked');
    expect([car.x, car.y]).toEqual([1.5, 4.5]);
  });
  it('stepCar fährt mit 0,15 Feldern pro Tick und meldet die Ankunft', () => {
    const g = new Grid(5, 5);
    const car = carAt(1.5, 4.5, [{ x: 1, y: 3, needsPath: false }]);
    expect(stepCar(car, g)).toBe('moving');
    expect(car.y).toBeCloseTo(4.35);
    for (let i = 0; i < 5; i++) stepCar(car, g);
    expect(stepCar(car, g)).toBe('arrived');
    expect([car.x, car.y]).toEqual([1.5, 3.5]);
    expect(car.route).toEqual([]);
  });
  it('arrivalRoute: Spur, Wege, letztes Stück zum Parkplatz', () => {
    const g = camp();
    const roads = new RoadNetwork(g);
    const r = arrivalRoute(g, roads, -3, { x: 10, y: 5 }, { x: 11, y: 4 })!;
    expect(r[0]).toEqual({ x: -3, y: 12, needsPath: false });
    expect(r.find((s) => s.x === 10 && s.y === 11)).toMatchObject({ needsPath: true });
    expect(r.at(-1)).toEqual({ x: 12, y: 5, needsPath: false });
    expect(arrivalRoute(g, roads, -3, { x: 5, y: 5 }, { x: 11, y: 4 })).toBeNull();
  });
  it('departureRoute: vom Parkplatz über die Wege auf die Rückspur bis zum rechten Rand', () => {
    const g = camp();
    const r = departureRoute(g, new RoadNetwork(g), { x: 11, y: 4 }, { x: 10, y: 5 })!;
    expect(r[0]).toEqual({ x: 11, y: 5, needsPath: false });
    expect(r).toContainEqual({ x: 10, y: 11, needsPath: true });
    expect(r).toContainEqual({ x: 10, y: 13, needsPath: false });
    expect(r.at(-1)).toEqual({ x: 22, y: 13, needsPath: false });
  });
});
