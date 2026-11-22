import type { ToolMode } from '../building/buildTool';

/** Beschriftung der Schaltflächen in der Werkzeugleiste. */
export const TOOL_LABELS: Record<ToolMode, string> = { view: 'Ansehen', path: 'Weg', demolish: 'Abreißen' };

/** Kurzer Hinweis zu den wichtigsten Tasten des aktiven Werkzeugs. */
export const TOOL_HINTS: Record<ToolMode, string> = {
  view: 'Ziehen: Kamera verschieben · Mausrad: Zoom · G: Raster',
  path: 'Ziehen: Weg bauen · R: Ecke drehen · Rechtsklick: Abbrechen',
  demolish: 'Ziehen: Wege abreißen · Entf: Abreißen aus · Rechtsklick: Abbrechen',
};
