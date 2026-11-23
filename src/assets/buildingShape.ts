import { CATALOG, type BuildingType } from '../building/catalog';
import type { Facing } from '../building/grid';
import { TILE_SIZE } from '../config';

/** Rechteck [x, y, Breite, Höhe] in Pixeln. */
export type PixelRect = [number, number, number, number];

/** Farbiges Rechteck eines Gebäudebilds; die Rolle 'back' markiert den Streifen an der Rückseite. */
export type ShapeRect = [number, number, number, number, number, 'back'?];

const OUTLINE = 0x3e2723;
const BACK = 0x4e342e;
const HATCH = 0x8d6e63;
const SIGN = 0xfff8e1;
const COUNTER = 0xa1887f;
const AWNING_LIGHT = 0xfff8e1;

/**
 * Dreht ein Rechteck aus dem Grundbild (Rückseite oben, Größe w × h)
 * so, dass die Rückseite in Richtung `facing` zeigt.
 */
export function rotateRect([x, y, rw, rh]: PixelRect, w: number, h: number, facing: Facing): PixelRect {
  switch (facing) {
    case 'N':
      return [x, y, rw, rh];
    case 'E':
      return [h - (y + rh), x, rh, rw];
    case 'S':
      return [w - (x + rw), h - (y + rh), rw, rh];
    case 'W':
      return [y, w - (x + rw), rh, rw];
  }
}

/** Kleines Symbol (Pixel-Art) je Gebäudeart, relativ zu (0, 0) in einem 8 × 8-Feld. */
const SYMBOLS: Partial<Record<BuildingType, ShapeRect[]>> = {
  beer: [
    [1, 2, 5, 6, 0xf9a825],
    [1, 1, 5, 2, 0xffffff],
    [6, 3, 2, 1, 0x6d4c41],
    [7, 3, 1, 3, 0x6d4c41],
    [6, 5, 2, 1, 0x6d4c41],
  ],
  fries: [
    [2, 0, 1, 4, 0xffeb3b],
    [4, 0, 1, 4, 0xffeb3b],
    [6, 1, 1, 3, 0xffeb3b],
    [3, 1, 1, 3, 0xfbc02d],
    [5, 1, 1, 3, 0xfbc02d],
    [1, 3, 7, 5, 0xd32f2f],
    [2, 5, 5, 1, 0xffffff],
  ],
  bratwurst: [
    [0, 5, 8, 2, 0xe0b070],
    [1, 3, 6, 2, 0x8d4a2b],
    [2, 3, 2, 1, 0xa1623d],
  ],
  pizza: [
    [0, 1, 8, 1, 0xa1662f],
    [0, 2, 8, 1, 0xffb300],
    [1, 3, 6, 1, 0xffb300],
    [2, 4, 4, 1, 0xffb300],
    [3, 5, 2, 2, 0xffb300],
    [2, 2, 1, 1, 0xc62828],
    [5, 3, 1, 1, 0xc62828],
  ],
  merch: [
    [2, 1, 4, 7, 0x212121],
    [0, 1, 2, 3, 0x212121],
    [6, 1, 2, 3, 0x212121],
    [3, 1, 2, 1, 0xffffff],
    [3, 4, 2, 1, 0xe53935],
  ],
};

/** Verschiebt Symbol-Rechtecke an die Stelle (ox, oy). */
const at = (rects: ShapeRect[], ox: number, oy: number): ShapeRect[] =>
  rects.map(([x, y, w, h, c]) => [ox + x, oy + y, w, h, c]);

/** Stand: Dach in der Grundfarbe, hinten Lager mit Lieferklappe, vorne Markise und Theke, Schild mit Symbol. */
function stall(type: BuildingType, w: number, h: number): ShapeRect[] {
  const color = CATALOG[type].color;
  const rects: ShapeRect[] = [
    [0, 0, w, h, OUTLINE],
    [1, 1, w - 2, h - 2, color],
    [0, 0, w, 4, BACK, 'back'],
    [Math.floor(w / 2) - 5, 1, 10, 3, HATCH],
    [1, h - 6, w - 2, 5, COUNTER],
  ];
  for (let x = 1; x < w - 1; x += 4) rects.push([x, h - 9, Math.min(2, w - 1 - x), 3, AWNING_LIGHT]);
  const signX = Math.floor(w / 2) - 5;
  const signY = Math.floor((4 + h - 9) / 2) - 5;
  rects.push([signX, signY, 10, 10, SIGN], ...at(SYMBOLS[type] ?? [], signX + 1, signY + 1));
  return rects;
}

/** Bühne: hinten Technik mit Boxen, Bretterboden, vorne heller Bühnenrand und Lautsprecher. */
function stage(w: number, h: number): ShapeRect[] {
  const rects: ShapeRect[] = [
    [0, 0, w, h, OUTLINE],
    [1, 1, w - 2, h - 2, CATALOG.stage.color],
    [0, 0, w, 8, 0x37474f, 'back'],
  ];
  for (let x = 4; x < w - 8; x += 12) rects.push([x, 2, 8, 4, 0x263238]);
  for (let y = 12; y < h - 4; y += 6) rects.push([1, y, w - 2, 1, 0x4e342e]);
  rects.push([1, h - 4, w - 2, 3, 0xd7ccc8]);
  rects.push([2, h - 12, 5, 8, 0x212121], [w - 7, h - 12, 5, 8, 0x212121]);
  rects.push([Math.floor(w / 2) - 1, Math.floor(h / 2) - 2, 2, 6, 0xbdbdbd]); // Mikrofon
  return rects;
}

/** Dixi-Klo: blaue Kabine, hinten dunkler (Abpumpseite), vorne Tür mit Besetzt-Anzeige. */
function toilet(w: number, h: number): ShapeRect[] {
  return [
    [0, 0, w, h, OUTLINE],
    [1, 1, w - 2, h - 2, CATALOG.toilet.color],
    [0, 0, w, 3, 0x0d47a1, 'back'],
    [5, 6, 6, 9, 0x90caf9],
    [9, 10, 1, 2, 0x2e7d32],
  ];
}

/** Bild eines Gebäudes in einer Richtung: Größe in Pixeln und alle Rechtecke (bereits gedreht). */
export function buildingRects(type: BuildingType, facing: Facing): { width: number; height: number; rects: ShapeRect[] } {
  const spec = CATALOG[type];
  const w = spec.width * TILE_SIZE;
  const h = spec.depth * TILE_SIZE;
  const base = type === 'stage' ? stage(w, h) : type === 'toilet' ? toilet(w, h) : stall(type, w, h);
  const sideways = facing === 'E' || facing === 'W';
  return {
    width: sideways ? h : w,
    height: sideways ? w : h,
    rects: base.map(([x, y, rw, rh, color, role]) => {
      const rotated: ShapeRect = [...rotateRect([x, y, rw, rh], w, h, facing), color];
      if (role) rotated.push(role);
      return rotated;
    }),
  };
}
