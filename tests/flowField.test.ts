import { describe, it, expect } from 'vitest';
import { Grid } from '../src/building/grid';
import { FlowField, findPath, isWalkable } from '../src/visitors/flowField';

describe('Wegweiser-Karten', () => {
  it('Zaun ist eine Wand, Schleuse ein Durchgang, Personal-Tor nicht', () => {
    const g = new Grid(10, 10);
    g.apply([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => ({ x, y: 5, structure: 'fence' as const })));
    expect(FlowField.build(g, [{ x: 5, y: 8, cost: 0 }]).distance(5, 2)).toBe(Infinity);
    g.apply([{ x: 5, y: 5, structure: 'staffGate', orientation: 'horizontal' }]);
    expect(FlowField.build(g, [{ x: 5, y: 8, cost: 0 }]).distance(5, 2)).toBe(Infinity);
    g.apply([{ x: 5, y: 5, structure: 'visitorGate', orientation: 'horizontal' }]);
    const f = FlowField.build(g, [{ x: 5, y: 8, cost: 0 }]);
    expect(f.distance(5, 2)).toBe(6);
    expect(f.nextStep(5, 4)).toEqual({ x: 5, y: 5 });
    expect(f.nextStep(5, 8)).toBeNull();
  });
  it('Startkosten verschieben das Ziel (Schlangen-Zuschlag)', () => {
    const g = new Grid(10, 1);
    const f = FlowField.build(g, [{ x: 0, y: 0, cost: 0 }, { x: 9, y: 0, cost: 6 }]);
    expect(f.nextStep(6, 0)).toEqual({ x: 5, y: 0 });
    expect(f.nextStep(8, 0)).toEqual({ x: 9, y: 0 });
  });
  it('keine Diagonale an einer Zaunecke vorbei', () => {
    const g = new Grid(3, 3);
    g.apply([{ x: 1, y: 0, structure: 'fence' }]);
    const f = FlowField.build(g, [{ x: 2, y: 0, cost: 0 }]);
    expect(f.nextStep(1, 1)).toEqual({ x: 2, y: 1 });
    expect(f.distance(0, 0)).toBe(4);
  });
  it('findPath um ein Gebäude herum; unerreichbar → null', () => {
    const g = new Grid(5, 5);
    g.addBuilding({ type: 'toilet', x: 2, y: 2, width: 1, height: 1, facing: 'N', paidPrice: 150 });
    const p = findPath(g, { x: 2, y: 1 }, { x: 2, y: 3 })!;
    expect(p.at(-1)).toEqual({ x: 2, y: 3 });
    expect(p.some((c) => c.x === 2 && c.y === 2)).toBe(false);
    expect(findPath(g, { x: 0, y: 0 }, { x: 2, y: 2 })).toBeNull();
    expect(findPath(g, { x: 1, y: 1 }, { x: 1, y: 1 })).toEqual([]);
  });
  it('isWalkable: Wiese, Weg, Zeltfläche und Schleuse ja; Zaun, Tor, Gebäude, außerhalb nein', () => {
    const g = new Grid(6, 1);
    g.apply([
      { x: 1, y: 0, path: true, camp: true },
      { x: 2, y: 0, structure: 'visitorGate', orientation: 'vertical' },
      { x: 3, y: 0, structure: 'staffGate', orientation: 'vertical' },
      { x: 4, y: 0, structure: 'fence' },
    ]);
    g.addBuilding({ type: 'toilet', x: 5, y: 0, width: 1, height: 1, facing: 'N', paidPrice: 150 });
    expect([0, 1, 2, 3, 4, 5, 6].map((x) => isWalkable(g, x, 0))).toEqual([true, true, true, false, false, false, false]);
  });
});
