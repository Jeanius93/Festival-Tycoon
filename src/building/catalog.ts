/** Alle Gebäudearten, die sich bauen lassen. */
export type BuildingType = 'stage' | 'beer' | 'fries' | 'bratwurst' | 'pizza' | 'merch' | 'toilet';

/** Menü-Kategorie eines Gebäudes. */
export type BuildingCategory = 'stages' | 'stalls' | 'sanitary';

/**
 * Beschreibung einer Gebäudeart. `width` und `depth` gelten, wenn die Rückseite
 * (Lieferseite) nach oben zeigt. `color` ist die Grundfarbe des Platzhalters.
 */
export interface BuildingSpec {
  type: BuildingType;
  name: string;
  category: BuildingCategory;
  width: number;
  depth: number;
  price: number;
  color: number;
}

/** Reihenfolge im Bau-Menü. */
export const BUILDING_TYPES: readonly BuildingType[] = ['stage', 'beer', 'fries', 'bratwurst', 'pizza', 'merch', 'toilet'];

/**
 * Der Katalog: Ein neues Gebäude ist ein neuer Eintrag hier.
 * Preise sind Startwerte und werden mit der Wirtschaft (M5) abgestimmt.
 */
export const CATALOG: Readonly<Record<BuildingType, BuildingSpec>> = {
  stage: { type: 'stage', name: 'Bühne', category: 'stages', width: 6, depth: 4, price: 4000, color: 0x5d4037 },
  beer: { type: 'beer', name: 'Bierstand', category: 'stalls', width: 3, depth: 2, price: 600, color: 0xf9a825 },
  fries: { type: 'fries', name: 'Pommes', category: 'stalls', width: 3, depth: 2, price: 400, color: 0xfdd835 },
  bratwurst: { type: 'bratwurst', name: 'Bratwurst', category: 'stalls', width: 3, depth: 2, price: 400, color: 0xbf360c },
  pizza: { type: 'pizza', name: 'Pizza', category: 'stalls', width: 3, depth: 2, price: 500, color: 0x2e7d32 },
  merch: { type: 'merch', name: 'Merch-Stand', category: 'stalls', width: 3, depth: 2, price: 500, color: 0x6a1b9a },
  toilet: { type: 'toilet', name: 'Dixi-Klo', category: 'sanitary', width: 1, depth: 1, price: 150, color: 0x1e88e5 },
};
