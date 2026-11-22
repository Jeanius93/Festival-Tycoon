import { describe, it, expect } from 'vitest';
import { computeZoom } from '../src/core/zoom';

describe('computeZoom', () => {
  it('PC Full HD → 4', () => expect(computeZoom(1920, 1080)).toBe(4));
  it('4K wird auf MAX_ZOOM begrenzt', () => expect(computeZoom(3840, 2160)).toBe(4));
  it('1280×720 → 4', () => expect(computeZoom(1280, 720)).toBe(4));
  it('Handy quer 844×390 → 2', () => expect(computeZoom(844, 390)).toBe(2));
  it('kleinere Seite bestimmt den Zoom', () => expect(computeZoom(2000, 400)).toBe(2));
  it('kleiner als Mindestansicht → 1', () => expect(computeZoom(319, 179)).toBe(1));
  it('Größe 0 → 1', () => expect(computeZoom(0, 0)).toBe(1));
  it('negative Werte → 1', () => expect(computeZoom(-100, 500)).toBe(1));
  it('NaN/Infinity → 1', () => {
    expect(computeZoom(NaN, 1080)).toBe(1);
    expect(computeZoom(Infinity, 1080)).toBe(1);
  });
  it('liefert immer eine ganze Zahl', () => expect(Number.isInteger(computeZoom(1000, 700))).toBe(true));
});
