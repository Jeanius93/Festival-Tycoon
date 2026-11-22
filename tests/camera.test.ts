import { describe, it, expect } from 'vitest';
import { nextZoomLevel, clampCenter, zoomAroundPoint, worldToCell, edgeScrollDirection, isButtonHeld } from '../src/core/camera';

describe('nextZoomLevel', () => {
  it('rein und raus', () => {
    expect(nextZoomLevel(2, 1)).toBe(3);
    expect(nextZoomLevel(2, -1)).toBe(1);
  });
  it('Grenzen 1 und 6', () => {
    expect(nextZoomLevel(6, 1)).toBe(6);
    expect(nextZoomLevel(1, -1)).toBe(1);
  });
});

describe('clampCenter', () => {
  // Welt 0..1120 (70 Kacheln à 16 px), Ansicht 800 px
  it('begrenzt links/rechts bei Zoom 2 (halbe Sicht 200)', () => {
    expect(clampCenter(0, 800, 2, 0, 1120)).toBe(200);
    expect(clampCenter(5000, 800, 2, 0, 1120)).toBe(920);
    expect(clampCenter(500, 800, 2, 0, 1120)).toBe(500);
  });
  it('zentriert, wenn Welt kleiner als Ansicht', () => {
    expect(clampCenter(0, 1920, 1, 0, 1120)).toBe(560);
    expect(clampCenter(999, 1920, 1, 0, 1120)).toBe(560);
  });
});

describe('zoomAroundPoint', () => {
  it('Punkt unter der Maus bleibt fest', () => {
    // Mitte 500, Maus bei Welt 600, Zoom 2 → 4: Abstand halbiert sich
    expect(zoomAroundPoint(500, 600, 2, 4)).toBe(550);
  });
  it('Zoom am Rand + Begrenzung bleibt im Grundstück', () => {
    const c = zoomAroundPoint(200, 0, 2, 1);
    expect(clampCenter(c, 800, 1, 0, 1120)).toBe(400);
  });
});

describe('worldToCell', () => {
  it('rechnet Randbreite heraus', () => {
    expect(worldToCell(48, 48, 16, 3)).toEqual({ x: 0, y: 0 });
    expect(worldToCell(47, 63, 16, 3)).toEqual({ x: -1, y: 0 });
    expect(worldToCell(48 + 63 * 16 + 15, 48, 16, 3)).toEqual({ x: 63, y: 0 });
  });
});

describe('edgeScrollDirection', () => {
  it('Ecke links oben', () => expect(edgeScrollDirection(5, 5, 800, 600, 16, true)).toEqual({ dx: -1, dy: -1 }));
  it('rechts unten', () => expect(edgeScrollDirection(795, 599, 800, 600, 16, true)).toEqual({ dx: 1, dy: 1 }));
  it('Mitte → keine Bewegung', () => expect(edgeScrollDirection(400, 300, 800, 600, 16, true)).toEqual({ dx: 0, dy: 0 }));
  it('Maus außerhalb des Fensters → keine Bewegung', () =>
    expect(edgeScrollDirection(0, 0, 800, 600, 16, false)).toEqual({ dx: 0, dy: 0 }));
  it('Koordinaten außerhalb des Fensters (beim Ziehen) → keine Bewegung', () => {
    expect(edgeScrollDirection(-40, 300, 800, 600, 16, true)).toEqual({ dx: 0, dy: 0 });
    expect(edgeScrollDirection(400, 600, 800, 600, 16, true)).toEqual({ dx: 0, dy: 0 });
    expect(edgeScrollDirection(850, 650, 800, 600, 16, true)).toEqual({ dx: 0, dy: 0 });
  });
});

describe('isButtonHeld', () => {
  // pointer.buttons: Bitmaske des Browsers (1 = links, 2 = rechts, 4 = Mitte)
  it('linke Taste (0) gedrückt / losgelassen', () => {
    expect(isButtonHeld(1, 0)).toBe(true);
    expect(isButtonHeld(0, 0)).toBe(false);
    expect(isButtonHeld(4, 0)).toBe(false);
  });
  it('mittlere Taste (1) gehört zu Bit 4', () => {
    expect(isButtonHeld(4, 1)).toBe(true);
    expect(isButtonHeld(5, 1)).toBe(true);
    expect(isButtonHeld(1, 1)).toBe(false);
  });
  it('rechte Taste (2) gehört zu Bit 2', () => {
    expect(isButtonHeld(2, 2)).toBe(true);
    expect(isButtonHeld(4, 2)).toBe(false);
  });
});
