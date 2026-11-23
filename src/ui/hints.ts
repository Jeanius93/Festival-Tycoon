import type { ToolMode } from '../building/buildTool';

/** Beschriftung der Schaltflächen in der Werkzeugleiste. */
export const TOOL_LABELS: Record<ToolMode, string> = {
  view: 'Ansehen',
  path: 'Weg',
  fence: 'Zaun',
  visitorGate: 'Schleuse',
  staffGate: 'Tor',
  building: 'Gebäude',
  demolish: 'Abreißen',
};

/** Kurzer Hinweis zu den wichtigsten Tasten des aktiven Werkzeugs. */
export const TOOL_HINTS: Record<ToolMode, string> = {
  view: 'Ziehen: Kamera verschieben · Mausrad: Zoom · G: Raster',
  path: 'Ziehen: Weg bauen · R: Ecke drehen · Rechtsklick: Abbrechen',
  fence: 'Ziehen: Zaun bauen · R: Ecke drehen · Rechtsklick: Abbrechen',
  visitorGate: 'Klick in geraden Zaun: Schleuse für Gäste · Rechtsklick: Ansehen',
  staffGate: 'Klick in geraden Zaun: Tor für Personal und Lieferwagen (Weg darf durch) · Rechtsklick: Ansehen',
  building: 'Gebäude wählen',
  demolish: 'Ziehen: alles abreißen · Entf: Abreißen aus · Rechtsklick: Abbrechen',
};
