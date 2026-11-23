import { TILE_SIZE } from '../config';
import { DIR } from '../building/autotile';

/** Rechteck [x, y, Breite, Höhe] innerhalb einer Kachel. */
export type Rect = [number, number, number, number];

/**
 * Latten eines Zaunstücks (zwei je verbundenem Nachbarn) und ihre Schatten
 * (1 Pixel nach rechts unten versetzt, an der Kachelkante abgeschnitten,
 * damit nichts in die Nachbarkachel des Tilesets malt).
 */
export function fenceRects(mask: number): { rails: Rect[]; shadows: Rect[] } {
  const rails: Rect[] = [];
  if (mask & DIR.N) rails.push([6, 0, 1, 7], [9, 0, 1, 7]);
  if (mask & DIR.S) rails.push([6, 9, 1, 7], [9, 9, 1, 7]);
  if (mask & DIR.W) rails.push([0, 6, 7, 1], [0, 9, 7, 1]);
  if (mask & DIR.E) rails.push([9, 6, 7, 1], [9, 9, 7, 1]);
  const shadows = rails.map(([x, y, w, h]): Rect => [
    x + 1,
    y + 1,
    Math.min(w, TILE_SIZE - x - 1),
    Math.min(h, TILE_SIZE - y - 1),
  ]);
  return { rails, shadows };
}
