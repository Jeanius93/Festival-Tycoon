import { describe, it, expect, vi } from 'vitest';
import { Grid } from '../src/building/grid';

describe('Grid', () => {
  it('startet als leere Wiese', () => {
    const g = new Grid(64, 48);
    expect(g.isPath(0, 0)).toBe(false);
    expect(g.isPath(63, 47)).toBe(false);
  });
  it('inBounds erkennt Grenzen', () => {
    const g = new Grid(64, 48);
    expect(g.inBounds(0, 0)).toBe(true);
    expect(g.inBounds(63, 47)).toBe(true);
    expect(g.inBounds(64, 0)).toBe(false);
    expect(g.inBounds(0, 48)).toBe(false);
    expect(g.inBounds(-1, 5)).toBe(false);
  });
  it('applyPath setzt Wege und liefert geänderte Felder', () => {
    const g = new Grid(64, 48);
    const changed = g.applyPath([{ x: 1, y: 1 }, { x: 2, y: 1 }], true);
    expect(changed).toEqual([{ x: 1, y: 1 }, { x: 2, y: 1 }]);
    expect(g.isPath(1, 1)).toBe(true);
  });
  it('überspringt vorhandene Wege und Felder außerhalb', () => {
    const g = new Grid(64, 48);
    g.applyPath([{ x: 1, y: 1 }], true);
    const changed = g.applyPath([{ x: 1, y: 1 }, { x: -1, y: 0 }, { x: 64, y: 0 }, { x: 3, y: 3 }], true);
    expect(changed).toEqual([{ x: 3, y: 3 }]);
  });
  it('entfernt Wege, ignoriert Wiese', () => {
    const g = new Grid(64, 48);
    g.applyPath([{ x: 1, y: 1 }], true);
    expect(g.applyPath([{ x: 1, y: 1 }, { x: 2, y: 2 }], false)).toEqual([{ x: 1, y: 1 }]);
    expect(g.isPath(1, 1)).toBe(false);
  });
  it('benachrichtigt einmal pro Änderung, nicht bei leerer Änderung', () => {
    const g = new Grid(64, 48);
    const listener = vi.fn();
    const off = g.onChange(listener);
    g.applyPath([{ x: 1, y: 1 }, { x: 2, y: 1 }], true);
    g.applyPath([{ x: 1, y: 1 }], true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith([{ x: 1, y: 1 }, { x: 2, y: 1 }]);
    off();
    g.applyPath([{ x: 5, y: 5 }], true);
    expect(listener).toHaveBeenCalledTimes(1);
  });
  it('isPath außerhalb ist false', () => expect(new Grid(4, 4).isPath(10, 10)).toBe(false));
});
