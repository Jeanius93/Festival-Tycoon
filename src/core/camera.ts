import { ZOOM_LEVELS } from '../config';
import type { Cell } from '../building/grid';

/** Nächste Zoomstufe rein (+1) oder raus (-1), begrenzt auf ZOOM_LEVELS. */
export function nextZoomLevel(current: number, direction: 1 | -1): number {
  return Math.min(Math.max(current + direction, ZOOM_LEVELS.min), ZOOM_LEVELS.max);
}

/**
 * Begrenzt die Kameramitte auf einer Achse so, dass die Kamera die Welt nicht verlässt.
 * Ist die Welt kleiner als die Ansicht, wird sie mittig gezeigt.
 */
export function clampCenter(center: number, viewSize: number, zoom: number, worldMin: number, worldMax: number): number {
  const half = viewSize / (2 * zoom);
  if (worldMax - worldMin <= 2 * half) return (worldMin + worldMax) / 2;
  return Math.min(Math.max(center, worldMin + half), worldMax - half);
}

/** Neue Kameramitte beim Zoomen, sodass der Weltpunkt unter der Maus an seiner Stelle bleibt. */
export function zoomAroundPoint(center: number, pointerWorld: number, oldZoom: number, newZoom: number): number {
  return pointerWorld - ((pointerWorld - center) * oldZoom) / newZoom;
}

/** Rechnet einen Weltpunkt in ein Grundstücksfeld um (Randbreite der Tilemap wird abgezogen). */
export function worldToCell(worldX: number, worldY: number, tileSize: number, offsetTiles: number): Cell {
  return {
    x: Math.floor(worldX / tileSize) - offsetTiles,
    y: Math.floor(worldY / tileSize) - offsetTiles,
  };
}

/** Richtung, in die die Kamera fährt, wenn die Maus nahe am Bildschirmrand ist. */
export function edgeScrollDirection(
  px: number,
  py: number,
  viewW: number,
  viewH: number,
  margin: number,
  pointerInside: boolean,
): { dx: -1 | 0 | 1; dy: -1 | 0 | 1 } {
  if (!pointerInside) return { dx: 0, dy: 0 };
  // Beim Ziehen meldet der Browser auch Positionen außerhalb des Fensters: dort nicht scrollen.
  if (px < 0 || py < 0 || px >= viewW || py >= viewH) return { dx: 0, dy: 0 };
  const axis = (p: number, size: number): -1 | 0 | 1 => (p < margin ? -1 : p >= size - margin ? 1 : 0);
  return { dx: axis(px, viewW), dy: axis(py, viewH) };
}

/** Bit der Browser-Tastenmaske (pointer.buttons) für eine Maustaste (0 = links, 1 = Mitte, 2 = rechts). */
const BUTTON_BITS: Record<number, number> = { 0: 1, 1: 4, 2: 2 };

/** Ist die Maustaste laut Tastenmaske des Browsers noch gedrückt? */
export function isButtonHeld(buttons: number, button: number): boolean {
  return (buttons & (BUTTON_BITS[button] ?? 0)) !== 0;
}
