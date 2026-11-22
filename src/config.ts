/** Zentrale Einstellungen des Spiels. */

/** Kantenlänge einer Kachel in Pixeln (vor dem Vergrößern). */
export const TILE_SIZE = 16;

/** So viel Fläche (in unvergrößerten Pixeln) soll mindestens sichtbar sein. */
export const MIN_VIEW = { width: 320, height: 180 };

/** Stärkste Vergrößerung, auch auf sehr großen Bildschirmen. */
export const MAX_ZOOM = 4;

/** Größe des Grundstücks in Feldern. */
export const FIELD = { width: 64, height: 48 } as const;

/** Zoomstufen der Spielwelt (nur ganze Zahlen, damit die Pixel scharf bleiben). */
export const ZOOM_LEVELS = { min: 1, max: 6 } as const;

/** Kamera-Geschwindigkeit in Bildschirm-Pixeln pro Sekunde. */
export const CAMERA_SPEED = 600;

/** So nah (in Bildschirm-Pixeln) muss die Maus am Rand sein, damit die Kamera mitfährt. */
export const EDGE_SCROLL_MARGIN = 16;

/** Breite des Gebüsch-Randes rund um das Grundstück (in Feldern). */
export const BORDER_TILES = 3;

export const GAME_TITLE = 'Festival Tycoon';

/** Warme, gemütliche Grundfarben (Platzhalter bis zu den echten Grafiken). */
export const COLORS = {
  grassLight: 0x7cb342,
  grassDark: 0x558b2f,
  grassFlower: 0xfff59d,
  titleText: 0xfff8e1,
  titleShadow: 0x33691e,
  border: 0x2e5d1f,
  borderDark: 0x1b3a14,
  path: 0xd9b97c,
  pathEdge: 0xa47e4a,
  pathPebble: 0xc19f66,
  grid: 0x2f5f1a,
  previewBuild: 0xfff3c4,
  previewDemolish: 0xe53935,
  uiPanel: 0x3e2723,
  uiButton: 0x6d4c41,
  uiButtonActive: 0xef8f00,
  uiText: 0xfff8e1,
} as const;
