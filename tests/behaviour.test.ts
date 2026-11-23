import { describe, it, expect } from 'vitest';
import { Grid } from '../src/building/grid';
import { RoadNetwork } from '../src/building/roadNetwork';
import { Random } from '../src/core/random';
import { stepGuest, type GuestWorld } from '../src/visitors/behaviour';
import { isWalkable } from '../src/visitors/flowField';
import { bubbleOf, createGuest, fulfil, growNeeds, type Guest, type NeedKind } from '../src/visitors/guest';
import { Offers } from '../src/visitors/offers';

/**
 * Grid 12 × 12; Zaun über die ganze Reihe y = 6, Schleuse bei (6,6), Personal-Tor mit Weg bei (10,6);
 * Bierstand (Kennnummer 1, Rückseite N) mit Grundfläche x 2..4, y 2..3; Lieferweg (2..10, 1) und
 * Spalte x = 10 von y = 1 bis y = 11. Tür (1, 10), Uhrzeit 15:00.
 */
const world = (): GuestWorld => {
  const grid = new Grid(12, 12);
  grid.apply(Array.from({ length: 12 }, (_, x) => ({ x, y: 6, structure: 'fence' as const })));
  grid.apply([
    { x: 6, y: 6, structure: 'visitorGate', orientation: 'horizontal' },
    { x: 10, y: 6, structure: 'staffGate', orientation: 'horizontal' },
  ]);
  grid.addBuilding({ type: 'beer', x: 2, y: 2, width: 3, height: 2, facing: 'N', paidPrice: 600 });
  grid.applyPath([2, 3, 4, 5, 6, 7, 8, 9, 10].map((x) => ({ x, y: 1 })), true);
  grid.applyPath([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((y) => ({ x: 10, y })), true);
  return { grid, offers: new Offers(grid), rng: new Random(4), second: 15 * 3600, door: { x: 1, y: 10 }, leaving: false };
};

const guestAt = (x: number, y: number, needs: Partial<Record<NeedKind, number>>): Guest => {
  const g = createGuest(1, 1, { x: 1, y: 10 }, new Random(1), 36000);
  g.x = x;
  g.y = y;
  g.needs = { thirst: 0, hunger: 0, toilet: 0, music: 0, souvenir: 0, ...needs };
  g.souvenirAt = Infinity;
  return g;
};

/** Macht pro Tick, was Festival.tick für einen Gast tut. */
const simulate = (
  w: GuestWorld,
  g: Guest,
  ticks: number,
  each: () => void = () => undefined,
  opts: { stopWhenQueued?: boolean } = {},
) => {
  for (let i = 0; i < ticks; i++) {
    w.second += 2;
    if (i % 30 === 0) w.offers.refresh(new RoadNetwork(w.grid), w.second);
    if (w.offers.takeDissolved().includes(g.id)) g.state = { kind: 'wander', path: [], waitTicks: 0 };
    growNeeds(g, w.second);
    stepGuest(g, w);
    for (const s of w.offers.serve()) {
      if (s.guestId !== g.id) continue;
      fulfil(g, s.type);
      g.state = { kind: 'wander', path: [], waitTicks: 0 };
    }
    each();
    if (opts.stopWhenQueued && g.state.kind === 'queue') return;
  }
};

describe('Verhalten der Gäste', () => {
  it('durstiger Gast geht durch die Schleuse zum Bierstand und wird bedient', () => {
    const w = world();
    const g = guestAt(3.5, 9.5, { thirst: 90 });
    let wasOnFence = false;
    let served = false;
    simulate(w, g, 3000, () => {
      if (!isWalkable(w.grid, Math.floor(g.x), Math.floor(g.y))) wasOnFence = true;
      if (g.needs.thirst < 5) served = true;
    });
    expect(served).toBe(true);
    expect(wasOnFence).toBe(false);
  });
  it('Stand ohne Straßenverbindung wird nicht aufgesucht, Denkblase bleibt', () => {
    const w = world();
    w.grid.clear([{ x: 10, y: 11 }]);
    const g = guestAt(3.5, 9.5, { thirst: 90 });
    simulate(w, g, 600);
    expect(g.state.kind).toBe('wander');
    expect(bubbleOf(g, w.second)).toBe('thirst');
  });
  it('Gast aus aufgelöster Schlange sucht neu', () => {
    const w = world();
    w.grid.addBuilding({ type: 'beer', x: 6, y: 2, width: 3, height: 2, facing: 'N', paidPrice: 600 });
    const g = guestAt(3.5, 9.5, { thirst: 90 });
    simulate(w, g, 3000, undefined, { stopWhenQueued: true });
    expect(g.state).toEqual({ kind: 'queue', buildingId: 2 }); // der nähere Stand hinter der Schleuse
    // Stand 2 verliert seinen Lieferweg; Stand 1 bleibt über eine Umgehung (Reihe y = 0) angeschlossen
    w.grid.clear([6, 7, 8].map((x) => ({ x, y: 1 })));
    w.grid.applyPath([5, 6, 7, 8, 9].map((x) => ({ x, y: 0 })), true);
    simulate(w, g, 3000, undefined, { stopWhenQueued: true });
    expect(g.state).toEqual({ kind: 'queue', buildingId: 1 });
  });
  it('Gast auf blockiertem Feld weicht aus', () => {
    const w = world();
    const g = guestAt(5.5, 5.5, {});
    w.grid.apply([{ x: 5, y: 5, structure: 'fence' }]);
    stepGuest(g, w);
    expect(isWalkable(w.grid, Math.floor(g.x), Math.floor(g.y))).toBe(true);
  });
  it('um 01:00 ins Zelt, um 08:00 wieder draußen', () => {
    const w = world();
    w.second = 86400 + 3600;
    const g = guestAt(3.5, 9.5, {});
    simulate(w, g, 300);
    expect(g.state).toEqual({ kind: 'inTent', purpose: 'sleep' });
    w.second = 86400 + 8 * 3600;
    simulate(w, g, 1);
    expect(g.state.kind).toBe('wander');
  });
  it('eingesperrt: kein Weg zum Zelt → stuck und Denkblase stuck', () => {
    const w = world();
    w.second = 86400 + 3600;
    const g = guestAt(3.5, 9.5, {});
    const ring = [[2, 8], [3, 8], [4, 8], [2, 9], [4, 9], [2, 10], [3, 10], [4, 10]];
    w.grid.apply(ring.map(([x, y]) => ({ x, y, structure: 'fence' as const })));
    simulate(w, g, 5);
    expect(g.stuck).toBe(true);
    expect(bubbleOf(g, w.second)).toBe('stuck');
  });
  it('Zuschauen endet, wenn ein anderes Bedürfnis dringend wird', () => {
    const w = world();
    const g = guestAt(3.5, 9.5, { music: 40, toilet: 80 });
    g.state = { kind: 'watch', path: [] };
    stepGuest(g, w);
    expect(g.state.kind).not.toBe('watch');
  });
});

describe('Verhalten – Ausweichen auf andere Bedürfnisse', () => {
  it('ohne Bierstand geht ein durstiger Gast trotzdem aufs Klo', () => {
    const w = world();
    w.grid.addBuilding({ type: 'toilet', x: 9, y: 9, width: 1, height: 1, facing: 'E', paidPrice: 150 });
    w.grid.clear([{ x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }]); // Bierstand ohne Lieferweg
    const g = guestAt(3.5, 9.5, { thirst: 100, toilet: 80 });
    let relieved = false;
    simulate(w, g, 2000, () => {
      if (g.needs.toilet < 5) relieved = true;
    });
    expect(relieved).toBe(true);
  });
});

describe('Verhalten – Verteilung', () => {
  it('Zuschauer verteilen sich vor der Bühne statt sich auf einem Feld zu stapeln', () => {
    const grid = new Grid(20, 20);
    grid.addBuilding({ type: 'stage', x: 2, y: 2, width: 6, height: 4, facing: 'N', paidPrice: 4000 });
    grid.applyPath([2, 3, 4, 5, 6, 7, 8].map((x) => ({ x, y: 1 })), true);
    grid.applyPath(Array.from({ length: 19 }, (_, i) => ({ x: 8, y: 1 + i })), true);
    const w: GuestWorld = { grid, offers: new Offers(grid), rng: new Random(2), second: 20 * 3600, door: { x: 4, y: 18 }, leaving: false };
    const guests = Array.from({ length: 20 }, () => guestAt(4.5, 15.5, { music: 80 }));
    for (let t = 0; t < 1500; t++) {
      w.second += 2;
      if (t % 30 === 0) w.offers.refresh(new RoadNetwork(grid), w.second);
      for (const g of guests) stepGuest(g, w);
    }
    expect(guests.every((g) => g.state.kind === 'watch')).toBe(true);
    expect(new Set(guests.map((g) => `${Math.floor(g.x)},${Math.floor(g.y)}`)).size).toBeGreaterThanOrEqual(10);
  });
  it('Umherschlendern bleibt in der Nähe des eigenen Zeltes', () => {
    const grid = new Grid(40, 40);
    const w: GuestWorld = { grid, offers: new Offers(grid), rng: new Random(5), second: 10 * 3600, door: { x: 20, y: 20 }, leaving: false };
    const g = guestAt(20.5, 20.5, {});
    let farthest = 0;
    simulate(w, g, 20000, () => {
      farthest = Math.max(farthest, Math.hypot(g.x - 20.5, g.y - 20.5));
    });
    expect(farthest).toBeLessThanOrEqual(Math.SQRT2 * 5 + 0.5);
  });
});
