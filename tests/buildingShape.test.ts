import { describe, it, expect } from 'vitest';
import { buildingRects, rotateRect } from '../src/assets/buildingShape';
import { BUILDING_TYPES, CATALOG } from '../src/building/catalog';
import type { Facing } from '../src/building/grid';

describe('rotateRect', () => {
  // Rechteck oben links in einem 48 × 32 großen Bild (Rückseite oben)
  const r: [number, number, number, number] = [0, 0, 10, 4];
  it('N bleibt gleich', () => expect(rotateRect(r, 48, 32, 'N')).toEqual([0, 0, 10, 4]));
  it('E: oben wird rechts', () => expect(rotateRect(r, 48, 32, 'E')).toEqual([28, 0, 4, 10]));
  it('S: oben wird unten', () => expect(rotateRect(r, 48, 32, 'S')).toEqual([38, 28, 10, 4]));
  it('W: oben wird links', () => expect(rotateRect(r, 48, 32, 'W')).toEqual([0, 38, 4, 10]));
});

describe('buildingRects', () => {
  const facings: Facing[] = ['N', 'E', 'S', 'W'];
  it('alle Rechtecke liegen im Bild, in jeder Richtung', () => {
    for (const type of BUILDING_TYPES) {
      for (const facing of facings) {
        const { width, height, rects } = buildingRects(type, facing);
        const sideways = facing === 'E' || facing === 'W';
        expect([width, height]).toEqual(
          sideways ? [CATALOG[type].depth * 16, CATALOG[type].width * 16] : [CATALOG[type].width * 16, CATALOG[type].depth * 16],
        );
        for (const [x, y, w, h] of rects) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(x + w).toBeLessThanOrEqual(width);
          expect(y + h).toBeLessThanOrEqual(height);
        }
      }
    }
  });
  it('die Rückseite (dunkler Streifen) liegt auf der Seite, in die facing zeigt', () => {
    for (const type of BUILDING_TYPES) {
      const back = (f: Facing) => buildingRects(type, f).rects.find((r) => r[5] === 'back');
      const n = buildingRects(type, 'N');
      expect(back('N')?.[1]).toBe(0);
      const e = buildingRects(type, 'E');
      expect((back('E')?.[0] ?? 0) + (back('E')?.[2] ?? 0)).toBe(e.width);
      const s = buildingRects(type, 'S');
      expect((back('S')?.[1] ?? 0) + (back('S')?.[3] ?? 0)).toBe(s.height);
      expect(back('W')?.[0]).toBe(0);
      expect(n.width).toBeGreaterThan(0);
    }
  });
});
