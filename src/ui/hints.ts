import type { ToolMode } from '../building/buildTool';
import { CATALOG, type BuildingType } from '../building/catalog';
import type { PlacementVerdict } from '../building/placement';
import { formatMoney } from './format';

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

/** Hinweis im Gebäude-Modus, abhängig vom Urteil der Bauregel unter der Maus. */
export function buildingHint(type: BuildingType, verdict: PlacementVerdict | null, balance: number): string {
  const { name, price } = CATALOG[type];
  const keys = 'R: drehen · Rechtsklick: Ansehen';
  if (verdict === 'blocked') return `Kein Platz für ${name} · ${keys}`;
  if (verdict === 'tooExpensive') return `Zu teuer: ${name} kostet ${formatMoney(price)}, Kasse: ${formatMoney(balance)}`;
  return `Klick: ${name} bauen (${formatMoney(price)}) · ${keys}`;
}
