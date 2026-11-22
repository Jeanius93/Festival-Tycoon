/** Zentrale Einstellungen des Spiels. */

/** Kantenlänge einer Kachel in Pixeln (vor dem Vergrößern). */
export const TILE_SIZE = 16;

/** So viel Fläche (in unvergrößerten Pixeln) soll mindestens sichtbar sein. */
export const MIN_VIEW = { width: 320, height: 180 };

/** Stärkste Vergrößerung, auch auf sehr großen Bildschirmen. */
export const MAX_ZOOM = 4;

/** Größe des Grundstücks in Feldern. */
export const FIELD = { width: 64, height: 48 } as const;

export const GAME_TITLE = 'Festival Tycoon';

/** Warme, gemütliche Grundfarben (Platzhalter bis zu den echten Grafiken). */
export const COLORS = {
  grassLight: 0x7cb342,
  grassDark: 0x558b2f,
  grassFlower: 0xfff59d,
  titleText: 0xfff8e1,
  titleShadow: 0x33691e,
} as const;
