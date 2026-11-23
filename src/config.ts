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

/** Geld in der Kasse zu Spielbeginn (in Euro). */
export const START_CASH = 10000;

/**
 * Spielzeit: Die Uhr zählt Spielsekunden seit Tag 1, 00:00. Ein Tick ist ein fester
 * Rechenschritt der Simulation. Tempo 1/2/3 rechnet mehr Ticks pro Sekunde, nicht größere.
 */
export const TIME = {
  tickSeconds: 2,
  realMsPerGameHour: 20000,
  speedFactor: { 1: 1, 2: 2, 3: 4 },
  maxTicksPerFrame: 60,
} as const;

/** Ablauf eines Festivals in Spielsekunden seit Tag 1, 00:00. */
export const FESTIVAL = {
  /** Tag 1, 10:00 */
  startSecond: 36000,
  /** Tag 1, 18:00: danach reisen keine Gäste mehr an */
  arrivalEndSecond: 64800,
  /** Tag 4, 10:00: alle reisen ab */
  departureSecond: 295200,
  /** Tag 4, 14:00: wer noch festhängt, wird abgeschleppt */
  towSecond: 309600,
  maxGuests: 300,
  guestsPerCar: 2,
} as const;

/** Tagesablauf in Minuten des Tages (die Bühne spielt über Mitternacht). */
export const SCHEDULE = {
  stageFromMinute: 840,
  stageToMinute: 60,
  sleepFromMinute: 60,
  sleepToMinute: 480,
} as const;

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
  fencePost: 0x6d4325,
  fenceRail: 0xb5824a,
  fenceShade: 0x4e2f18,
  gateTurnstile: 0xffca28,
  gateBarrierRed: 0xd84315,
  gateBarrierWhite: 0xfff8e1,
  previewBuild: 0xfff3c4,
  previewDemolish: 0xe53935,
  previewDelivery: 0x29b6f6,
  warning: 0xe53935,
  warningShade: 0x7f1d1d,
  uiPanel: 0x3e2723,
  uiButton: 0x6d4c41,
  uiButtonActive: 0xef8f00,
  uiButtonOpen: 0x8d6e63,
  uiText: 0xfff8e1,
} as const;
