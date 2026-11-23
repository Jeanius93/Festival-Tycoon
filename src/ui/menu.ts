import type { ToolMode } from '../building/buildTool';
import { BUILDING_TYPES, CATALOG, type BuildingType } from '../building/catalog';
import { TOOL_LABELS } from './hints';

/** Kategorien der Hauptleiste. */
export type MenuCategory = 'view' | 'paths' | 'stages' | 'stalls' | 'sanitary' | 'demolish';

/** Hauptleiste in fester Reihenfolge. */
export const MAIN_MENU: ReadonlyArray<{ category: MenuCategory; label: string }> = [
  { category: 'view', label: 'Ansehen' },
  { category: 'paths', label: 'Wege & Zäune' },
  { category: 'stages', label: 'Bühnen' },
  { category: 'stalls', label: 'Stände' },
  { category: 'sanitary', label: 'Sanitär' },
  { category: 'demolish', label: 'Abreißen' },
];

/** Was ein Klick auf einen Eintrag der Unterleiste bewirkt. */
export type MenuAction = { kind: 'mode'; mode: Exclude<ToolMode, 'building'> } | { kind: 'building'; type: BuildingType };

/** Ein Eintrag der Unterleiste; `price` nur bei Gebäuden. */
export interface MenuEntry {
  label: string;
  price: number | null;
  action: MenuAction;
}

const PATH_TOOLS = ['path', 'fence', 'visitorGate', 'staffGate'] as const;

/** Einträge der Unterleiste einer Kategorie (Ansehen und Abreißen haben keine). */
export function subMenu(category: MenuCategory): MenuEntry[] {
  if (category === 'view' || category === 'demolish') return [];
  if (category === 'paths') {
    return PATH_TOOLS.map((mode) => ({ label: TOOL_LABELS[mode], price: null, action: { kind: 'mode', mode } }));
  }
  return BUILDING_TYPES.filter((type) => CATALOG[type].category === category).map((type) => ({
    label: CATALOG[type].name,
    price: CATALOG[type].price,
    action: { kind: 'building', type },
  }));
}

/** Zu welcher Kategorie gehört das aktive Werkzeug? */
export function categoryOf(mode: ToolMode, buildingType: BuildingType | null): MenuCategory {
  if (mode === 'view' || mode === 'demolish') return mode;
  if (mode === 'building' && buildingType) return CATALOG[buildingType].category;
  return mode === 'building' ? 'view' : 'paths';
}

/**
 * Welche Unterleiste offen ist. Ein Klick auf eine Kategorie öffnet bzw. schließt sie,
 * Ansehen und Abreißen schließen sie. Wechselt das gewählte Werkzeug (auch per Esc, Entf
 * oder Rechtsklick), ist genau die Unterleiste seiner Kategorie offen. Mausbewegungen
 * ändern die Auswahl nicht und lassen eine von Hand geöffnete Unterleiste stehen.
 */
export class MenuState {
  private open: MenuCategory | null = null;
  private lastSelection: string | null = null;

  get openCategory(): MenuCategory | null {
    return this.open;
  }

  clickCategory(category: MenuCategory): void {
    if (subMenu(category).length === 0) this.open = null;
    else this.open = this.open === category ? null : category;
  }

  syncTool(mode: ToolMode, buildingType: BuildingType | null): void {
    const selection = `${mode}|${buildingType}`;
    if (selection === this.lastSelection) return;
    this.lastSelection = selection;
    const category = categoryOf(mode, buildingType);
    this.open = subMenu(category).length > 0 ? category : null;
  }
}
