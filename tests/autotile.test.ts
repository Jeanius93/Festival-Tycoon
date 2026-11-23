import { describe, it, expect } from 'vitest';
import { Grid } from '../src/building/grid';
import { DIR, campMask, fenceMask, pathMask } from '../src/building/autotile';

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

describe('fenceMask', () => {
  it('zählt Zaun und Durchgänge, keine Wege', () => {
    const g = new Grid(10, 10);
    g.apply([
      { x: 5, y: 5, structure: 'fence' },
      { x: 5, y: 4, structure: 'fence' },
      { x: 6, y: 5, structure: 'staffGate', orientation: 'horizontal' },
      { x: 5, y: 6, path: true },
    ]);
    expect(fenceMask(g, 5, 5)).toBe(DIR.N | DIR.E);
  });
});

describe('Straße und Zeltfläche', () => {
  it('Weg auf der untersten Reihe ist nach unten an die Straße angeschlossen', () => {
    const g = new Grid(5, 5);
    g.applyPath([{ x: 2, y: 4 }], true);
    expect(pathMask(g, 2, 4)).toBe(DIR.S);
  });
  it('campMask zählt markierte Nachbarn', () => {
    const g = new Grid(5, 5);
    g.apply([{ x: 2, y: 2, camp: true }, { x: 3, y: 2, camp: true }, { x: 2, y: 3, camp: true }]);
    expect(campMask(g, 2, 2)).toBe(DIR.E | DIR.S);
  });
});
