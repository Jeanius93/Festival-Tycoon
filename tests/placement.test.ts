import { describe, it, expect } from 'vitest';
import { Grid, type Facing } from '../src/building/grid';
import { backCells, footprint, isDelivered, placementVerdict, rectCells, rotateFacing } from '../src/building/placement';

describe('Platzierung', () => {
  it('rotateFacing dreht im Uhrzeigersinn', () => {
    expect((['N', 'E', 'S', 'W'] as Facing[]).map(rotateFacing)).toEqual(['E', 'S', 'W', 'N']);
  });
  it('footprint: Maus auf der Mitte, gedreht tauschen Breite und Tiefe', () => {
    expect(footprint('beer', 'N', { x: 5, y: 5 })).toEqual({ x: 4, y: 5, width: 3, height: 2 });
    expect(footprint('beer', 'E', { x: 5, y: 5 })).toEqual({ x: 5, y: 4, width: 2, height: 3 });
    expect(footprint('stage', 'N', { x: 10, y: 10 })).toEqual({ x: 8, y: 9, width: 6, height: 4 });
    expect(footprint('stage', 'W', { x: 10, y: 10 })).toEqual({ x: 9, y: 8, width: 4, height: 6 });
    expect(footprint('toilet', 'S', { x: 5, y: 5 })).toEqual({ x: 5, y: 5, width: 1, height: 1 });
  });
  it('rectCells zeilenweise von oben links', () => {
    expect(rectCells({ x: 1, y: 2, width: 2, height: 2 })).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
    ]);
  });
  it('backCells liegt direkt hinter der Rückseite', () => {
    expect(backCells({ x: 4, y: 5, width: 3, height: 2 }, 'N')).toEqual([{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }]);
    expect(backCells({ x: 4, y: 5, width: 3, height: 2 }, 'S')).toEqual([{ x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }]);
    expect(backCells({ x: 4, y: 5, width: 2, height: 3 }, 'E')).toEqual([{ x: 6, y: 5 }, { x: 6, y: 6 }, { x: 6, y: 7 }]);
    expect(backCells({ x: 4, y: 5, width: 2, height: 3 }, 'W')).toEqual([{ x: 3, y: 5 }, { x: 3, y: 6 }, { x: 3, y: 7 }]);
  });
  it('isDelivered folgt dem Weg (Weg unter Personal-Tor zählt, Tor ohne Weg nicht)', () => {
    const g = new Grid(10, 10);
    const b = g.addBuilding({ type: 'beer', x: 4, y: 5, width: 3, height: 2, facing: 'N', paidPrice: 600 });
    expect(isDelivered(g, b)).toBe(false);
    g.apply([{ x: 6, y: 4, structure: 'staffGate', orientation: 'horizontal' }]);
    expect(isDelivered(g, b)).toBe(false);
    g.apply([{ x: 6, y: 4, path: true }]);
    expect(isDelivered(g, b)).toBe(true);
    g.clear([{ x: 6, y: 4 }]);
    expect(isDelivered(g, b)).toBe(false);
    g.applyPath([{ x: 5, y: 7 }], true); // Weg vorne zählt nicht
    expect(isDelivered(g, b)).toBe(false);
  });
  it('Gebäude mit Rückseite am Grundstücksrand ist nie beliefert, ohne Fehler', () => {
    const g = new Grid(10, 10);
    const b = g.addBuilding({ type: 'beer', x: 0, y: 0, width: 3, height: 2, facing: 'N', paidPrice: 600 });
    expect(isDelivered(g, b)).toBe(false);
  });
});

describe('placementVerdict', () => {
  const r = { x: 2, y: 2, width: 3, height: 2 };
  it('freie Wiese und genug Geld → ok', () => expect(placementVerdict(new Grid(10, 10), r, 600, 600)).toBe('ok'));
  it('zu wenig Geld → tooExpensive', () => expect(placementVerdict(new Grid(10, 10), r, 600, 599)).toBe('tooExpensive'));
  it('Grundfläche teils außerhalb ist blocked', () =>
    expect(placementVerdict(new Grid(10, 10), { ...r, x: 8 }, 600, 10000)).toBe('blocked'));
  it('Weg, Zaun, Durchgang oder Gebäude auf einem Feld → blocked, auch wenn zu teuer', () => {
    for (const setup of [
      (g: Grid) => g.applyPath([{ x: 4, y: 3 }], true),
      (g: Grid) => g.apply([{ x: 4, y: 3, structure: 'fence' }]),
      (g: Grid) => g.apply([{ x: 4, y: 3, structure: 'visitorGate', orientation: 'vertical' }]),
      (g: Grid) => g.addBuilding({ type: 'toilet', x: 4, y: 3, width: 1, height: 1, facing: 'N', paidPrice: 150 }),
    ]) {
      const g = new Grid(10, 10);
      setup(g);
      expect(placementVerdict(g, r, 600, 0)).toBe('blocked');
    }
  });
});

describe('Platzierung – Zeltfläche', () => {
  it('placementVerdict: belegtes Feld ist blocked, Zeltfläche allein nicht', () => {
    const g = new Grid(10, 10);
    g.apply([{ x: 5, y: 5, camp: true }]);
    expect(placementVerdict(g, { x: 5, y: 5, width: 1, height: 1 }, 150, 1000)).toBe('ok');
    g.setOccupied([{ x: 5, y: 5 }], true);
    expect(placementVerdict(g, { x: 5, y: 5, width: 1, height: 1 }, 150, 1000)).toBe('blocked');
  });
});
