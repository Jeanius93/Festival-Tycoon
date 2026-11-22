import Phaser from 'phaser';
import { COLORS, TILE_SIZE } from '../config';

export const TEXTURE_KEYS = { grass: 'grass' } as const;

/** Grashalme und Blümchen auf der Platzhalter-Kachel: [x, y, Farbe]. */
const GRASS_DETAILS: ReadonlyArray<[number, number, number]> = [
  [2, 3, COLORS.grassDark],
  [3, 2, COLORS.grassDark],
  [9, 5, COLORS.grassDark],
  [10, 4, COLORS.grassDark],
  [5, 11, COLORS.grassDark],
  [6, 10, COLORS.grassDark],
  [13, 12, COLORS.grassDark],
  [12, 13, COLORS.grassDark],
  [12, 8, COLORS.grassFlower],
];

/** Erzeugt alle Platzhalter-Grafiken per Code (später durch echte Sprites ersetzt). */
export function createPlaceholderTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(COLORS.grassLight);
  g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  for (const [x, y, color] of GRASS_DETAILS) {
    g.fillStyle(color);
    g.fillRect(x, y, 1, 1);
  }
  g.generateTexture(TEXTURE_KEYS.grass, TILE_SIZE, TILE_SIZE);
  g.destroy();
}
