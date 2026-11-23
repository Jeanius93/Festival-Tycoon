import Phaser from 'phaser';
import { COLORS, TILE_SIZE } from '../config';
import { DIR } from '../building/autotile';
import { fenceRects } from './fenceShape';
import { buildingRects } from './buildingShape';
import { BUILDING_TYPES, type BuildingType } from '../building/catalog';
import type { Facing } from '../building/grid';
import type { Bubble } from '../visitors/guest';
import { CAR_COLORS, GUEST_COLORS, TENT_COLORS } from '../visitors/palette';

export const TEXTURE_KEYS = {
  grass: 'grass',
  /** 4 Kacheln: 0 = Wiese, 1 = Rand (Gebüsch), 2 = Straße Hinspur, 3 = Straße Rückspur */
  groundTiles: 'groundTiles',
  /** 16 Kacheln: Wegstück für jede Kombination verbundener Nachbarn (siehe DIR) */
  pathTiles: 'pathTiles',
  /** 4 Kacheln: 0 = Bau-Vorschau, 1 = Abriss-Vorschau, 2 = nicht erlaubt, 3 = Lieferseite eines Gebäudes */
  previewTiles: 'previewTiles',
  /** 16 Kacheln: Zaunstück für jede Kombination verbundener Nachbarn (siehe DIR) */
  fenceTiles: 'fenceTiles',
  /** 4 Kacheln: 0 Schleuse waagrecht, 1 Schleuse senkrecht, 2 Tor waagrecht, 3 Tor senkrecht */
  gateTiles: 'gateTiles',
  /** Warnschild „nicht beliefert“: weißer Lieferwagen auf Rot */
  deliveryWarning: 'deliveryWarning',
  /** 16 Kacheln: Zeltfläche mit Absperrband an Seiten ohne markierten Nachbarn (siehe DIR) */
  campTiles: 'campTiles',
  /** Rotes „!“: Auto oder Gast hängt fest */
  stuckWarning: 'stuckWarning',
  /** Eine Rasterzelle (Linie oben und links), wird gekachelt */
  gridCell: 'gridCell',
} as const;

const T = TILE_SIZE;

const FACINGS: readonly Facing[] = ['N', 'E', 'S', 'W'];

/** Name der Textur eines Gebäudes in einer Richtung (Rückseite zeigt nach `facing`). */
export function buildingTextureKey(type: BuildingType, facing: Facing): string {
  return `building-${type}-${facing}`;
}

/** Textur eines Zeltes, Autos bzw. Gastes in einer Farbe aus der Palette. */
export const tentTextureKey = (color: number): string => `tent-${color.toString(16)}`;
export const carTextureKey = (color: number): string => `car-${color.toString(16)}`;
export const guestTextureKey = (color: number): string => `guest-${color.toString(16)}`;
export const bubbleTextureKey = (bubble: Bubble): string => `bubble-${bubble}`;

const BUBBLES: readonly Bubble[] = ['thirst', 'hunger', 'toilet', 'music', 'souvenir', 'sleep', 'angry', 'stuck'];

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

/** Straße: Asphalt; Hinspur mit gestrichelter Mittellinie unten, Rückspur mit dunkler Kante unten. */
function drawRoad(g: Phaser.GameObjects.Graphics, ox: number, upper: boolean): void {
  g.fillStyle(COLORS.road);
  g.fillRect(ox, 0, T, T);
  g.fillStyle(COLORS.roadEdge);
  g.fillRect(ox + 3, 5, 1, 1);
  g.fillRect(ox + 11, 9, 1, 1);
  if (upper) {
    g.fillStyle(COLORS.roadLine);
    g.fillRect(ox + 2, T - 1, 6, 1);
  } else {
    g.fillRect(ox, T - 2, T, 2);
  }
}

/** Zeltfläche: etwas hellere Wiese, rot-weißes Absperrband an offenen Seiten. */
function drawCamp(g: Phaser.GameObjects.Graphics, ox: number, mask: number): void {
  g.fillStyle(COLORS.campGrass, 0.45);
  g.fillRect(ox, 0, T, T);
  const tape = (x: number, y: number, horizontal: boolean): void => {
    for (let i = 0; i < T; i += 2) {
      g.fillStyle((i / 2) % 2 === 0 ? COLORS.tapeRed : COLORS.tapeWhite);
      if (horizontal) g.fillRect(ox + i, y, 2, 1);
      else g.fillRect(ox + x, i, 1, 2);
    }
  };
  if (!(mask & DIR.N)) tape(0, 0, true);
  if (!(mask & DIR.S)) tape(0, T - 1, true);
  if (!(mask & DIR.W)) tape(0, 0, false);
  if (!(mask & DIR.E)) tape(T - 1, 0, false);
}

/** Zelt (16 × 32, linke Spalte des Stellplatzes): Dach mit Firstlinie, Eingang unten. */
function drawTent(g: Phaser.GameObjects.Graphics, color: number): void {
  g.fillStyle(COLORS.tentShade, 0.35);
  g.fillRect(2, 5, 13, 25);
  g.fillStyle(color);
  g.fillRect(1, 4, 13, 25);
  g.fillStyle(0xffffff, 0.35);
  g.fillRect(1, 4, 6, 25);
  g.fillStyle(COLORS.tentShade);
  g.fillRect(7, 4, 1, 25); // First
  g.fillRect(5, 25, 5, 4); // Eingang
}

/** Auto von oben (12 × 24, Front oben): Karosserie, Scheiben, Räder. */
function drawCar(g: Phaser.GameObjects.Graphics, color: number): void {
  g.fillStyle(0x212121);
  g.fillRect(0, 4, 2, 4);
  g.fillRect(10, 4, 2, 4);
  g.fillRect(0, 16, 2, 4);
  g.fillRect(10, 16, 2, 4);
  g.fillStyle(color);
  g.fillRect(1, 1, 10, 22);
  g.fillStyle(0x90caf9);
  g.fillRect(2, 5, 8, 3); // Frontscheibe
  g.fillRect(2, 17, 8, 2); // Heckscheibe
  g.fillStyle(0xfff59d);
  g.fillRect(2, 1, 2, 1);
  g.fillRect(8, 1, 2, 1);
}

/** Gast (5 × 8): Kopf, Hemd, Beine. */
function drawGuest(g: Phaser.GameObjects.Graphics, color: number): void {
  g.fillStyle(COLORS.skin);
  g.fillRect(1, 0, 3, 3);
  g.fillStyle(color);
  g.fillRect(0, 3, 5, 3);
  g.fillStyle(COLORS.legs);
  g.fillRect(1, 6, 1, 2);
  g.fillRect(3, 6, 1, 2);
}

/** Denkblase (11 × 12): heller Kasten mit Rand und Spitze, darin das Symbol. */
function drawBubble(g: Phaser.GameObjects.Graphics, bubble: Bubble): void {
  g.fillStyle(COLORS.bubbleEdge);
  g.fillRect(0, 0, 11, 10);
  g.fillRect(4, 10, 3, 1);
  g.fillRect(5, 11, 1, 1);
  g.fillStyle(COLORS.bubble);
  g.fillRect(1, 1, 9, 8);
  g.fillRect(5, 9, 1, 1);
  const px = (x: number, y: number, w: number, h: number, color: number): void => {
    g.fillStyle(color);
    g.fillRect(1 + x, 1 + y, w, h);
  };
  switch (bubble) {
    case 'thirst': // Bierkrug
      px(2, 2, 4, 5, 0xf9a825);
      px(2, 1, 4, 1, 0xffffff);
      px(6, 3, 1, 3, 0x8d6e63);
      break;
    case 'hunger': // Pommestüte
      px(2, 1, 1, 3, 0xfdd835);
      px(4, 0, 1, 4, 0xfdd835);
      px(6, 1, 1, 3, 0xfdd835);
      px(2, 4, 5, 3, 0xe53935);
      break;
    case 'toilet': // blaue Klotür
      px(2, 0, 5, 8, 0x1e88e5);
      px(5, 4, 1, 1, 0xffffff);
      break;
    case 'music': // Note
      px(5, 0, 1, 6, 0x212121);
      px(5, 0, 3, 1, 0x212121);
      px(3, 5, 3, 2, 0x212121);
      break;
    case 'souvenir': // T-Shirt
      px(1, 1, 7, 2, 0x8e24aa);
      px(2, 3, 5, 4, 0x8e24aa);
      break;
    case 'sleep': // Mond
      px(3, 1, 3, 6, 0xfbc02d);
      px(5, 2, 2, 4, COLORS.bubble);
      break;
    case 'angry': // Gewitterwolke
      px(1, 1, 7, 3, 0x616161);
      px(4, 4, 1, 2, 0xffeb3b);
      px(3, 6, 1, 1, 0xffeb3b);
      break;
    case 'stuck': // rotes Ausrufezeichen
      px(4, 0, 1, 5, 0xe53935);
      px(4, 6, 1, 1, 0xe53935);
      break;
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

/** Zaunstück: Pfosten in der Mitte plus zwei Latten zu jedem verbundenen Nachbarn. */
function drawFence(g: Phaser.GameObjects.Graphics, ox: number, mask: number): void {
  const { rails, shadows } = fenceRects(mask);
  g.fillStyle(COLORS.fenceShade);
  for (const [x, y, w, h] of shadows) g.fillRect(ox + x, y, w, h);
  g.fillStyle(COLORS.fenceRail);
  for (const [x, y, w, h] of rails) g.fillRect(ox + x, y, w, h);
  g.fillStyle(COLORS.fenceShade);
  g.fillRect(ox + 6, 6, 5, 5);
  g.fillStyle(COLORS.fencePost);
  g.fillRect(ox + 6, 6, 4, 4);
}

/**
 * Durchgang (Schleuse oder Tor) in einer waagrechten Zaunlinie; senkrecht = gespiegelt an der Diagonale.
 * Die Mitte bleibt frei, damit ein Weg unter einem Tor sichtbar bleibt.
 */
function drawGate(g: Phaser.GameObjects.Graphics, ox: number, staff: boolean, vertical: boolean): void {
  const rect = (x: number, y: number, w: number, h: number, color: number): void => {
    g.fillStyle(color);
    if (vertical) g.fillRect(ox + y, x, h, w);
    else g.fillRect(ox + x, y, w, h);
  };
  // Zaun-Anschluss und Torpfosten an beiden Enden
  for (const x0 of [0, 13]) {
    rect(x0, 6, 3, 1, COLORS.fenceRail);
    rect(x0, 9, 3, 1, COLORS.fenceRail);
  }
  rect(2, 5, 3, 6, COLORS.fenceShade);
  rect(2, 5, 2, 5, COLORS.fencePost);
  rect(12, 5, 3, 6, COLORS.fenceShade);
  rect(12, 5, 2, 5, COLORS.fencePost);
  if (staff) {
    // Schlagbaum rot-weiß
    for (let x = 4; x < 12; x += 2) rect(x, 7, 2, 2, (x / 2) % 2 === 0 ? COLORS.gateBarrierRed : COLORS.gateBarrierWhite);
  } else {
    // Drehkreuz: gelber Mittelpfosten mit Armen
    rect(7, 6, 2, 4, COLORS.gateTurnstile);
    rect(5, 7, 6, 1, COLORS.gateTurnstile);
    rect(7, 6, 1, 1, COLORS.fenceShade);
  }
}

function drawPreview(g: Phaser.GameObjects.Graphics, ox: number, color: number): void {
  g.fillStyle(color);
  g.fillRect(ox, 0, T, T);
  g.lineStyle(1, 0xffffff, 0.9);
  g.strokeRect(ox + 0.5, 0.5, T - 1, T - 1);
}

/** Lieferseite in der Vorschau: blau schraffiertes Feld. */
function drawDeliverySide(g: Phaser.GameObjects.Graphics, ox: number): void {
  g.fillStyle(COLORS.previewDelivery);
  g.fillRect(ox, 0, T, T);
  g.fillStyle(0xffffff);
  for (let d = -T; d < T; d += 4) {
    for (let i = 0; i < T; i++) {
      const x = d + i;
      if (x >= 0 && x < T) g.fillRect(ox + x, i, 1, 1);
    }
  }
}

/** Warnschild „nicht beliefert“ (12 × 10): weißer Lieferwagen auf rotem Grund. */
function drawDeliveryWarning(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(COLORS.warningShade);
  g.fillRect(0, 0, 12, 10);
  g.fillStyle(COLORS.warning);
  g.fillRect(0, 0, 11, 9);
  g.fillStyle(0xffffff);
  g.fillRect(1, 2, 6, 4); // Ladefläche
  g.fillRect(7, 3, 3, 3); // Führerhaus
  g.fillStyle(COLORS.warningShade);
  g.fillRect(8, 4, 1, 1); // Fenster
  g.fillRect(2, 6, 2, 2); // Räder
  g.fillRect(7, 6, 2, 2);
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
  makeStrip(scene, TEXTURE_KEYS.groundTiles, 4, (g, ox, i) => {
    if (i === 0) drawGrass(g, ox);
    else if (i === 1) drawBorder(g, ox);
    else drawRoad(g, ox, i === 2);
  });
  makeStrip(scene, TEXTURE_KEYS.campTiles, 16, (g, ox, mask) => drawCamp(g, ox, mask));
  makeStrip(scene, TEXTURE_KEYS.pathTiles, 16, (g, ox, mask) => drawPath(g, ox, mask));
  makeStrip(scene, TEXTURE_KEYS.previewTiles, 4, (g, ox, i) => {
    if (i === 3) {
      drawDeliverySide(g, ox);
      return;
    }
    drawPreview(g, ox, i === 0 ? COLORS.previewBuild : COLORS.previewDemolish);
    if (i === 2) {
      // „Nicht erlaubt“: rotes Feld mit weißem Kreuz
      g.fillStyle(0xffffff);
      for (let d = 3; d < T - 3; d++) {
        g.fillRect(ox + d, d, 2, 1);
        g.fillRect(ox + T - 2 - d, d, 2, 1);
      }
    }
  });
  makeStrip(scene, TEXTURE_KEYS.fenceTiles, 16, (g, ox, mask) => drawFence(g, ox, mask));
  makeStrip(scene, TEXTURE_KEYS.gateTiles, 4, (g, ox, i) => drawGate(g, ox, i >= 2, i % 2 === 1));

  for (const type of BUILDING_TYPES) {
    for (const facing of FACINGS) {
      const { width, height, rects } = buildingRects(type, facing);
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      for (const [x, y, w, h, color] of rects) {
        g.fillStyle(color);
        g.fillRect(x, y, w, h);
      }
      g.generateTexture(buildingTextureKey(type, facing), width, height);
      g.destroy();
    }
  }

  const image = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void => {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  for (const color of TENT_COLORS) image(tentTextureKey(color), T, 2 * T, (g) => drawTent(g, color));
  for (const color of CAR_COLORS) image(carTextureKey(color), 12, 24, (g) => drawCar(g, color));
  for (const color of GUEST_COLORS) image(guestTextureKey(color), 5, 8, (g) => drawGuest(g, color));
  for (const bubble of BUBBLES) image(bubbleTextureKey(bubble), 11, 12, (g) => drawBubble(g, bubble));
  image(TEXTURE_KEYS.stuckWarning, 7, 10, (g) => {
    g.fillStyle(COLORS.warningShade);
    g.fillRect(0, 0, 7, 10);
    g.fillStyle(COLORS.warning);
    g.fillRect(0, 0, 6, 9);
    g.fillStyle(0xffffff);
    g.fillRect(2, 1, 2, 5);
    g.fillRect(2, 7, 2, 1);
  });

  const warning = scene.make.graphics({ x: 0, y: 0 }, false);
  drawDeliveryWarning(warning);
  warning.generateTexture(TEXTURE_KEYS.deliveryWarning, 12, 10);
  warning.destroy();

  const grid = scene.make.graphics({ x: 0, y: 0 }, false);
  grid.fillStyle(COLORS.grid, 0.22);
  grid.fillRect(0, 0, T, 1);
  grid.fillRect(0, 1, 1, T - 1);
  grid.generateTexture(TEXTURE_KEYS.gridCell, T, T);
  grid.destroy();
}
