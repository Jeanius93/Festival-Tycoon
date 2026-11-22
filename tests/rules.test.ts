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
