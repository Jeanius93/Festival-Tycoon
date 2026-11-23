import { describe, it, expect } from 'vitest';
import { lCells, rectBetween } from '../src/building/lineTool';

describe('lCells', () => {
  it('Start = Ende → ein Feld', () => expect(lCells({ x: 2, y: 3 }, { x: 2, y: 3 }, true)).toEqual([{ x: 2, y: 3 }]));
  it('waagrechte Linie nach links', () =>
    expect(lCells({ x: 3, y: 0 }, { x: 1, y: 0 }, true)).toEqual([{ x: 3, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }]));
  it('senkrechte Linie, unabhängig von horizontalFirst', () => {
    const expected = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }];
    expect(lCells({ x: 0, y: 0 }, { x: 0, y: 2 }, true)).toEqual(expected);
    expect(lCells({ x: 0, y: 0 }, { x: 0, y: 2 }, false)).toEqual(expected);
  });
  it('L waagrecht zuerst: Ecke bei (end.x, start.y)', () =>
    expect(lCells({ x: 0, y: 0 }, { x: 2, y: 2 }, true)).toEqual([
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 },
    ]));
  it('L senkrecht zuerst: Ecke bei (start.x, end.y)', () =>
    expect(lCells({ x: 0, y: 0 }, { x: 2, y: 2 }, false)).toEqual([
      { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
    ]));
  it('lange Diagonale: keine Lücken, keine Doppelten', () => {
    const cells = lCells({ x: 60, y: 40 }, { x: 3, y: 5 }, true);
    expect(cells.length).toBe(57 + 35 + 1);
    expect(new Set(cells.map((c) => `${c.x},${c.y}`)).size).toBe(cells.length);
    for (let i = 1; i < cells.length; i++) {
      expect(Math.abs(cells[i].x - cells[i - 1].x) + Math.abs(cells[i].y - cells[i - 1].y)).toBe(1);
    }
  });
});

describe('rectBetween', () => {
  it('Rechteck in beliebiger Zugrichtung', () => {
    expect(rectBetween({ x: 2, y: 1 }, { x: 1, y: 2 })).toEqual([{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }]);
    expect(rectBetween({ x: 3, y: 3 }, { x: 3, y: 3 })).toEqual([{ x: 3, y: 3 }]);
  });
});
