import Phaser from 'phaser';
import { COLORS, TILE_SIZE } from '../config';
import { DIR } from '../building/autotile';

export const TEXTURE_KEYS = {
  grass: 'grass',
  /** 2 Kacheln: 0 = Wiese, 1 = Rand (Gebüsch) */
  groundTiles: 'groundTiles',
  /** 16 Kacheln: Wegstück für jede Kombination verbundener Nachbarn (siehe DIR) */
  pathTiles: 'pathTiles',
  /** 2 Kacheln: 0 = Bau-Vorschau, 1 = Abriss-Vorschau */
  previewTiles: 'previewTiles',
  /** Eine Rasterzelle (Linie oben und links), wird gekachelt */
  gridCell: 'gridCell',
} as const;

const T = TILE_SIZE;

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

/** Büsche auf der Rand-Kachel: [x, y, Größe]. */
const BUSHES: ReadonlyArray<[number, number, number]> = [
  [1, 1, 6],
  [9, 2, 5],
  [3, 9, 5],
  [10, 9, 6],
];

/** Kieselsteine auf dem Weg: [x, y]. */
const PEBBLES: ReadonlyArray<[number, number]> = [
  [6, 5],
  [9, 9],
  [5, 10],
];

function drawGrass(g: Phaser.GameObjects.Graphics, ox: number): void {
  g.fillStyle(COLORS.grassLight);
  g.fillRect(ox, 0, T, T);
  for (const [x, y, color] of GRASS_DETAILS) {
    g.fillStyle(color);
    g.fillRect(ox + x, y, 1, 1);
  }
}

function drawBorder(g: Phaser.GameObjects.Graphics, ox: number): void {
  g.fillStyle(COLORS.borderDark);
  g.fillRect(ox, 0, T, T);
  for (const [x, y, size] of BUSHES) {
    g.fillStyle(COLORS.border);
    g.fillRect(ox + x, y, size, size);
    g.fillStyle(COLORS.grassDark);
    g.fillRect(ox + x + 1, y + 1, 2, 1);
  }
}

/** Wegstück: Mittelfläche plus Arme zu jedem verbundenen Nachbarn. */
function drawPath(g: Phaser.GameObjects.Graphics, ox: number, mask: number): void {
  // Rechtecke [x, y, w, h] für Rand (außen) und Füllung (innen)
  const outer: Array<[number, number, number, number]> = [[3, 3, 10, 10]];
  const inner: Array<[number, number, number, number]> = [[4, 4, 8, 8]];
  if (mask & DIR.N) {
    outer.push([3, 0, 10, 4]);
    inner.push([4, 0, 8, 5]);
  }
  if (mask & DIR.S) {
    outer.push([3, 12, 10, 4]);
    inner.push([4, 11, 8, 5]);
  }
  if (mask & DIR.W) {
    outer.push([0, 3, 4, 10]);
    inner.push([0, 4, 5, 8]);
  }
  if (mask & DIR.E) {
    outer.push([12, 3, 4, 10]);
    inner.push([11, 4, 5, 8]);
  }
  g.fillStyle(COLORS.pathEdge);
  for (const [x, y, w, h] of outer) g.fillRect(ox + x, y, w, h);
  g.fillStyle(COLORS.path);
  for (const [x, y, w, h] of inner) g.fillRect(ox + x, y, w, h);
  g.fillStyle(COLORS.pathPebble);
  for (const [x, y] of PEBBLES) g.fillRect(ox + x, y, 1, 1);
}

function drawPreview(g: Phaser.GameObjects.Graphics, ox: number, color: number): void {
  g.fillStyle(color);
  g.fillRect(ox, 0, T, T);
  g.lineStyle(1, 0xffffff, 0.9);
  g.strokeRect(ox + 0.5, 0.5, T - 1, T - 1);
}

/** Erzeugt eine Textur aus mehreren nebeneinanderliegenden Kacheln (Frames 0, 1, 2 …). */
function makeStrip(
  scene: Phaser.Scene,
  key: string,
  count: number,
  draw: (g: Phaser.GameObjects.Graphics, ox: number, index: number) => void,
): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let i = 0; i < count; i++) draw(g, i * T, i);
  g.generateTexture(key, count * T, T);
  g.destroy();
  const texture = scene.textures.get(key);
  for (let i = 0; i < count; i++) texture.add(i, 0, i * T, 0, T, T);
}

/** Erzeugt alle Platzhalter-Grafiken per Code (später durch echte Sprites ersetzt). */
export function createPlaceholderTextures(scene: Phaser.Scene): void {
  makeStrip(scene, TEXTURE_KEYS.grass, 1, (g, ox) => drawGrass(g, ox));
  makeStrip(scene, TEXTURE_KEYS.groundTiles, 2, (g, ox, i) => (i === 0 ? drawGrass(g, ox) : drawBorder(g, ox)));
  makeStrip(scene, TEXTURE_KEYS.pathTiles, 16, (g, ox, mask) => drawPath(g, ox, mask));
  makeStrip(scene, TEXTURE_KEYS.previewTiles, 2, (g, ox, i) =>
    drawPreview(g, ox, i === 0 ? COLORS.previewBuild : COLORS.previewDemolish),
  );

  const grid = scene.make.graphics({ x: 0, y: 0 }, false);
  grid.fillStyle(COLORS.grid, 0.35);
  grid.fillRect(0, 0, T, 1);
  grid.fillRect(0, 1, 1, T - 1);
  grid.generateTexture(TEXTURE_KEYS.gridCell, T, T);
  grid.destroy();
}
