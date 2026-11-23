import { describe, it, expect } from 'vitest';
import { Grid } from '../src/building/grid';
import { RoadNetwork, vehicleRoute } from '../src/building/roadNetwork';

describe('RoadNetwork', () => {
  it('nur Wege mit Verbindung zur untersten Reihe sind angeschlossen', () => {
    const g = new Grid(10, 10);
    g.applyPath([{ x: 2, y: 9 }, { x: 2, y: 8 }, { x: 2, y: 7 }, { x: 6, y: 5 }], true);
    const r = new RoadNetwork(g);
    expect(r.isConnected(2, 7)).toBe(true);
    expect(r.distance(2, 7)).toBe(2);
    expect(r.isConnected(6, 5)).toBe(false);
    expect(r.distance(6, 5)).toBe(Infinity);
    expect(r.routeFromRoad({ x: 2, y: 7 })).toEqual([{ x: 2, y: 9 }, { x: 2, y: 8 }, { x: 2, y: 7 }]);
    expect(r.routeFromRoad({ x: 6, y: 5 })).toBeNull();
  });
  it('Personal-Tor mit Weg verbindet, Zaun trennt', () => {
    const g = new Grid(10, 10);
    g.applyPath([{ x: 2, y: 9 }, { x: 2, y: 8 }, { x: 2, y: 7 }], true);
    g.apply([{ x: 2, y: 8, structure: 'staffGate', orientation: 'horizontal' }]);
    expect(new RoadNetwork(g).isConnected(2, 7)).toBe(true);
    g.clear([{ x: 2, y: 8 }]);
    g.apply([{ x: 2, y: 8, structure: 'fence' }]);
    expect(new RoadNetwork(g).isConnected(2, 7)).toBe(false);
  });
  it('vehicleRoute folgt nur Wegen', () => {
    const g = new Grid(10, 10);
    g.applyPath([{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }], true);
    expect(vehicleRoute(g, { x: 1, y: 1 }, { x: 2, y: 2 })).toEqual([{ x: 2, y: 1 }, { x: 2, y: 2 }]);
    expect(vehicleRoute(g, { x: 1, y: 1 }, { x: 1, y: 1 })).toEqual([]);
    expect(vehicleRoute(g, { x: 1, y: 1 }, { x: 5, y: 5 })).toBeNull();
  });
});
