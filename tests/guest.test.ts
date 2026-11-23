import { describe, it, expect } from 'vitest';
import type { BuildingType } from '../src/building/catalog';
import { Random } from '../src/core/random';
import type { FlowField } from '../src/visitors/flowField';
import {
  bubbleOf,
  chooseTarget,
  createGuest,
  fulfil,
  growNeeds,
  tickSatisfaction,
  urgentNeed,
  type Guest,
  type NeedKind,
} from '../src/visitors/guest';

const guest = (needs: Partial<Record<NeedKind, number>>): Guest => {
  const g = createGuest(1, 1, { x: 2, y: 3 }, new Random(1), 36000);
  g.needs = { thirst: 0, hunger: 0, toilet: 0, music: 0, souvenir: 0, ...needs };
  g.souvenirAt = Infinity;
  return g;
};
const fieldsWithDistance = (d: Partial<Record<BuildingType, number>>) => (t: BuildingType) =>
  ({ distance: () => d[t] ?? Infinity }) as unknown as FlowField;

describe('Gast', () => {
  it('createGuest: an der Tür, Zufriedenheit 70, Musik 0, Wunsch vor der Abreise', () => {
    const g = createGuest(4, 2, { x: 2, y: 3 }, new Random(3), 36000);
    expect([g.x, g.y, g.satisfaction, g.needs.music]).toEqual([2.5, 3.5, 70, 0]);
    expect(g.needs.thirst).toBeGreaterThanOrEqual(0);
    expect(g.needs.thirst).toBeLessThanOrEqual(30);
    expect(g.souvenirAt).toBeGreaterThanOrEqual(36000);
    expect(g.souvenirAt).toBeLessThan(295200);
    expect(g.state).toEqual({ kind: 'wander', path: [], waitTicks: 0 });
  });
  it('Durst wächst um 10 pro Spielstunde, Musik nur zur Bühnenzeit', () => {
    const g = guest({ thirst: 0, music: 0 });
    for (let i = 0; i < 1800; i++) growNeeds(g, 10 * 3600 + i * 2);
    expect(g.needs.thirst).toBeCloseTo(10);
    expect(g.needs.music).toBe(0);
    for (let i = 0; i < 1800; i++) growNeeds(g, 15 * 3600 + i * 2);
    expect(g.needs.music).toBeCloseTo(15);
  });
  it('im Zelt wächst nichts; Andenken-Wunsch kommt einmal', () => {
    const g = guest({ thirst: 20 });
    g.state = { kind: 'inTent', purpose: 'sleep' };
    growNeeds(g, 3 * 3600);
    expect(g.needs.thirst).toBe(20);
    g.state = { kind: 'wander', path: [], waitTicks: 0 };
    g.souvenirAt = 50000;
    growNeeds(g, 49998);
    expect(g.needs.souvenir).toBe(0);
    growNeeds(g, 50000);
    expect(g.needs.souvenir).toBe(60);
    fulfil(g, 'merch');
    growNeeds(g, 60000);
    expect(g.needs.souvenir).toBe(0);
    expect(g.souvenirDone).toBe(true);
  });
  it('urgentNeed: Klo vor Durst bei Gleichstand, unter 50 nichts', () => {
    expect(urgentNeed(guest({ thirst: 60, toilet: 60 }))).toBe('toilet');
    expect(urgentNeed(guest({ thirst: 70, toilet: 60 }))).toBe('thirst');
    expect(urgentNeed(guest({ thirst: 49 }))).toBeNull();
  });
  it('Abwechslung: andere Sorte gewinnt bis 15 Felder Mehrweg', () => {
    const g = guest({ hunger: 80 });
    g.lastFood = 'fries';
    expect(chooseTarget(g, 'hunger', fieldsWithDistance({ fries: 5, pizza: 19 }))).toBe('pizza');
    expect(chooseTarget(g, 'hunger', fieldsWithDistance({ fries: 5, pizza: 21 }))).toBe('fries');
    expect(chooseTarget(g, 'toilet', fieldsWithDistance({}))).toBeNull();
    expect(chooseTarget(g, 'music', fieldsWithDistance({ stage: 4 }))).toBe('stage');
  });
  it('fulfil: gleiche Sorte macht nur halb satt', () => {
    const g = guest({ hunger: 80 });
    fulfil(g, 'pizza');
    expect([g.needs.hunger, g.satisfaction]).toEqual([0, 78]);
    g.needs.hunger = 80;
    fulfil(g, 'pizza');
    expect([g.needs.hunger, g.satisfaction]).toEqual([30, 80]);
    g.needs.thirst = 90;
    fulfil(g, 'beer');
    expect([g.needs.thirst, g.satisfaction]).toEqual([0, 84]);
  });
  it('Musik hebt die Laune und stillt das Bedürfnis', () => {
    const g = guest({ music: 50 });
    for (let i = 0; i < 1800; i++) tickSatisfaction(g, { second: 20 * 3600 + i * 2, queueing: false, watchingMusic: true });
    expect(g.satisfaction).toBeCloseTo(78);
    expect(g.needs.music).toBeCloseTo(10);
  });
  it('unter 25 % für 2 Spielstunden → leave', () => {
    const g = guest({});
    g.satisfaction = 20;
    let r = 'stay';
    for (let s = 0; s < 3599; s++) r = tickSatisfaction(g, { second: 36000 + s * 2, queueing: false, watchingMusic: false });
    expect(r).toBe('stay');
    r = tickSatisfaction(g, { second: 36000 + 7200, queueing: false, watchingMusic: false });
    expect(r).toBe('leave');
  });
  it('Denkblase: stuck vor angry vor Bedürfnis; im Zelt keine', () => {
    const g = guest({ toilet: 65 });
    expect(bubbleOf(g, 40000)).toBe('toilet');
    g.needs.toilet = 59;
    expect(bubbleOf(g, 40000)).toBeNull();
    g.state = { kind: 'toTent', path: [], purpose: 'sleep' };
    expect(bubbleOf(g, 40000)).toBe('sleep');
    g.satisfaction = 20;
    expect(bubbleOf(g, 40000)).toBe('angry');
    g.stuck = true;
    expect(bubbleOf(g, 40000)).toBe('stuck');
    g.state = { kind: 'inTent', purpose: 'sleep' };
    expect(bubbleOf(g, 40000)).toBeNull();
  });
});
