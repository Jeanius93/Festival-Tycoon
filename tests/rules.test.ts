import { describe, it, expect } from 'vitest';
import { Grid, type CellChange } from '../src/building/grid';
import { changeFor, placementOrientation, verdict } from '../src/building/rules';

const make = (...changes: CellChange[]) => {
  const g = new Grid(10, 10);
  g.apply(changes);
  return g;
};
const fence = (x: number, y: number): CellChange => ({ x, y, structure: 'fence' });
const fenceRow = (y: number, x0: number, x1: number): CellChange[] =>
  Array.from({ length: x1 - x0 + 1 }, (_, i) => fence(x0 + i, y));
const fenceCol = (x: number, y0: number, y1: number): CellChange[] =>
  Array.from({ length: y1 - y0 + 1 }, (_, i) => fence(x, y0 + i));

describe('placementOrientation', () => {
  it('waagrecht in gerader waagrechter Zaunlinie', () => {
    expect(placementOrientation(make(...fenceRow(2, 1, 3)), 2, 2)).toBe('horizontal');
  });
  it('senkrecht in senkrechter Linie', () => {
    expect(placementOrientation(make(...fenceCol(2, 1, 3)), 2, 2)).toBe('vertical');
  });
  it('in Zaunlücke auf Wiese', () => {
    expect(placementOrientation(make(fence(1, 2), fence(3, 2)), 2, 2)).toBe('horizontal');
  });
  it('zwischen Zaun und Durchgang erlaubt', () => {
    const g = make(fence(1, 2), { x: 3, y: 2, structure: 'visitorGate', orientation: 'horizontal' });
    expect(placementOrientation(g, 2, 2)).toBe('horizontal');
  });
  it('null an Ecke, Ende, Kreuzung und ohne Zaun', () => {
    expect(placementOrientation(make(fence(1, 2), fence(2, 2), fence(2, 3)), 2, 2)).toBeNull();
    expect(placementOrientation(make(fence(1, 2), fence(2, 2)), 2, 2)).toBeNull();
    expect(placementOrientation(make(...fenceRow(2, 1, 3), fence(2, 1), fence(2, 3)), 2, 2)).toBeNull();
    expect(placementOrientation(make(), 2, 2)).toBeNull();
  });
  it('null am Rand des Grundstücks ohne Nachbar draußen', () => {
    expect(placementOrientation(make(fence(0, 0), fence(1, 0)), 0, 0)).toBeNull();
  });
});

describe('verdict', () => {
  it('Weg: Zaun und Schleuse blockieren, Tor ohne Weg erlaubt', () => {
    const g = make(
      fence(1, 1),
      { x: 2, y: 1, structure: 'visitorGate', orientation: 'horizontal' },
      { x: 3, y: 1, structure: 'staffGate', orientation: 'horizontal' },
      { x: 4, y: 1, path: true },
    );
    expect([1, 2, 3, 4, 5].map((x) => verdict(g, 'path', x, 1))).toEqual(['blocked', 'blocked', 'build', 'skip', 'build']);
  });
  it('Zaun: Weg blockiert, Zaun über Durchgang: skip', () => {
    const g = make(
      { x: 1, y: 1, path: true },
      fence(2, 1),
      { x: 3, y: 1, structure: 'visitorGate', orientation: 'horizontal' },
      { x: 4, y: 1, structure: 'staffGate', orientation: 'horizontal', path: true },
    );
    expect([1, 2, 3, 4, 5].map((x) => verdict(g, 'fence', x, 1))).toEqual(['blocked', 'skip', 'skip', 'skip', 'build']);
  });
  it('Schleuse auf Tor mit Weg ist nicht erlaubt, auf Tor ohne Weg schon', () => {
    const g = make(
      ...fenceRow(2, 1, 5),
      { x: 2, y: 2, structure: 'staffGate', orientation: 'horizontal', path: true },
      { x: 4, y: 2, structure: 'staffGate', orientation: 'horizontal' },
    );
    expect(verdict(g, 'visitorGate', 2, 2)).toBe('blocked');
    expect(verdict(g, 'visitorGate', 4, 2)).toBe('build');
  });
  it('Tor auf Schleuse erlaubt (Umwandeln)', () => {
    const g = make(...fenceRow(2, 1, 3), { x: 2, y: 2, structure: 'visitorGate', orientation: 'horizontal' });
    expect(verdict(g, 'staffGate', 2, 2)).toBe('build');
  });
  it('Tor auf Weg in Zaunlücke erlaubt, auf Weg ohne Zaun nicht', () => {
    const g = make(fence(1, 2), fence(3, 2), { x: 2, y: 2, path: true }, { x: 6, y: 6, path: true });
    expect(verdict(g, 'staffGate', 2, 2)).toBe('build');
    expect(verdict(g, 'staffGate', 6, 6)).toBe('blocked');
    expect(verdict(g, 'visitorGate', 2, 2)).toBe('blocked');
  });
  it('Schleuse auf Zaun und in Wiesenlücke erlaubt', () => {
    const g = make(...fenceRow(2, 1, 3), fence(5, 2), fence(7, 2));
    expect(verdict(g, 'visitorGate', 2, 2)).toBe('build');
    expect(verdict(g, 'visitorGate', 6, 2)).toBe('build');
  });
  it('Durchgang derselben Art: skip', () => {
    const g = make(...fenceRow(2, 1, 3), { x: 2, y: 2, structure: 'staffGate', orientation: 'horizontal' });
    expect(verdict(g, 'staffGate', 2, 2)).toBe('skip');
  });
  it('außerhalb: blocked', () => {
    expect(verdict(make(), 'fence', -1, 0)).toBe('blocked');
    expect(verdict(make(), 'path', 10, 0)).toBe('blocked');
  });
});

describe('changeFor', () => {
  it('Durchgang bekommt die Ausrichtung', () => {
    expect(changeFor(make(...fenceCol(2, 1, 3)), 'visitorGate', 2, 2)).toEqual({
      x: 2,
      y: 2,
      structure: 'visitorGate',
      orientation: 'vertical',
    });
  });
  it('Weg und Zaun', () => {
    expect(changeFor(make(), 'path', 1, 1)).toEqual({ x: 1, y: 1, path: true });
    expect(changeFor(make(), 'fence', 1, 1)).toEqual({ x: 1, y: 1, structure: 'fence' });
  });
});

describe('Umwandeln vorhandener Durchgänge', () => {
  it('klappt auch, wenn ein Nachbarzaun abgerissen wurde', () => {
    const g = make(fence(1, 2), { x: 2, y: 2, structure: 'visitorGate', orientation: 'horizontal' });
    expect(verdict(g, 'staffGate', 2, 2)).toBe('build');
    expect(changeFor(g, 'staffGate', 2, 2)).toEqual({ x: 2, y: 2, structure: 'staffGate', orientation: 'horizontal' });
  });
  it('behält die gespeicherte Ausrichtung', () => {
    const g = make(fence(2, 1), fence(2, 3), { x: 2, y: 2, structure: 'staffGate', orientation: 'horizontal' });
    expect(changeFor(g, 'visitorGate', 2, 2)).toEqual({ x: 2, y: 2, structure: 'visitorGate', orientation: 'horizontal' });
  });
  it('Tor mit Weg wird auch ohne Nachbarzaun nicht zur Schleuse', () => {
    const g = make({ x: 2, y: 2, structure: 'staffGate', orientation: 'horizontal', path: true });
    expect(verdict(g, 'visitorGate', 2, 2)).toBe('blocked');
  });
});

describe('Regeln – Gebäude', () => {
  it('Weg, Zaun, Schleuse und Tor sind auf Gebäudefeldern nicht erlaubt', () => {
    const g = new Grid(10, 10);
    g.apply([{ x: 2, y: 5, structure: 'fence' }, { x: 4, y: 5, structure: 'fence' }]);
    g.addBuilding({ type: 'toilet', x: 3, y: 5, width: 1, height: 1, facing: 'N', paidPrice: 150 });
    for (const kind of ['path', 'fence', 'visitorGate', 'staffGate'] as const) expect(verdict(g, kind, 3, 5)).toBe('blocked');
  });
});

describe('Regeln – Zeltfläche', () => {
  it('Zeltfläche: auf Wiese und Weg ja, auf Zaun/Durchgang/Gebäude nein', () => {
    const g = new Grid(10, 10);
    g.apply([{ x: 1, y: 1, path: true }, { x: 2, y: 1, structure: 'fence' }]);
    g.addBuilding({ type: 'toilet', x: 3, y: 1, width: 1, height: 1, facing: 'N', paidPrice: 150 });
    expect(verdict(g, 'camp', 0, 1)).toBe('build');
    expect(verdict(g, 'camp', 1, 1)).toBe('build');
    expect(verdict(g, 'camp', 2, 1)).toBe('blocked');
    expect(verdict(g, 'camp', 3, 1)).toBe('blocked');
    g.apply([{ x: 0, y: 1, camp: true }]);
    expect(verdict(g, 'camp', 0, 1)).toBe('skip');
    expect(changeFor(g, 'camp', 4, 4)).toEqual({ x: 4, y: 4, camp: true });
  });
  it('Zaun und Durchgänge nicht auf Zeltfläche; nichts auf belegten Feldern', () => {
    const g = new Grid(10, 10);
    g.apply([{ x: 5, y: 5, camp: true }, { x: 4, y: 5, structure: 'fence' }, { x: 6, y: 5, structure: 'fence' }]);
    expect(verdict(g, 'fence', 5, 5)).toBe('blocked');
    expect(verdict(g, 'visitorGate', 5, 5)).toBe('blocked');
    expect(verdict(g, 'staffGate', 5, 5)).toBe('blocked');
    expect(verdict(g, 'path', 5, 5)).toBe('build');
    g.setOccupied([{ x: 5, y: 5 }], true);
    for (const k of ['path', 'fence', 'visitorGate', 'staffGate', 'camp'] as const) expect(verdict(g, k, 5, 5)).toBe('blocked');
  });
});
