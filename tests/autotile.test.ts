import { describe, it, expect } from 'vitest';
import { Grid } from '../src/building/grid';
import { DIR, pathMask } from '../src/building/autotile';

describe('pathMask', () => {
  it('einzelnes Feld → 0', () => {
    const g = new Grid(5, 5);
    g.applyPath([{ x: 2, y: 2 }], true);
    expect(pathMask(g, 2, 2)).toBe(0);
  });
  it('Kreuzung → 15', () => {
    const g = new Grid(5, 5);
    g.applyPath([{ x: 2, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 2 }], true);
    expect(pathMask(g, 2, 2)).toBe(15);
  });
  it('Ecke Nord+Ost', () => {
    const g = new Grid(5, 5);
    g.applyPath([{ x: 2, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 2 }], true);
    expect(pathMask(g, 2, 2)).toBe(DIR.N | DIR.E);
  });
  it('Rand des Grundstücks zählt als kein Weg', () => {
    const g = new Grid(5, 5);
    g.applyPath([{ x: 0, y: 0 }, { x: 1, y: 0 }], true);
    expect(pathMask(g, 0, 0)).toBe(DIR.E);
  });
});
