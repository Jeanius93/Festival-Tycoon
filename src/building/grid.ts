/** Ein Feld des Grundstücks (0 … Breite-1, 0 … Höhe-1). */
export interface Cell {
  x: number;
  y: number;
}

/** Was auf einem Feld gebaut ist (zusätzlich zum Boden). */
export type Structure = 'none' | 'fence' | 'visitorGate' | 'staffGate';

/** Lage eines Durchgangs: 'horizontal' = in einer waagrechten Zaunlinie (Zaun links und rechts). */
export type Orientation = 'horizontal' | 'vertical';

/** Änderung an einem Feld; nicht angegebene Angaben bleiben, wie sie sind. */
export interface CellChange {
  x: number;
  y: number;
  path?: boolean;
  structure?: Structure;
  orientation?: Orientation;
}

const GROUND_GRASS = 0;
const GROUND_PATH = 1;

// Codes der Bauten-Ebene (nur intern): Durchgänge speichern ihre Ausrichtung mit.
const S_NONE = 0;
const S_FENCE = 1;
const S_VISITOR_H = 2;
const S_VISITOR_V = 3;
const S_STAFF_H = 4;
const S_STAFF_V = 5;

function encode(structure: Structure, orientation: Orientation | undefined): number {
  if (structure === 'none') return S_NONE;
  if (structure === 'fence') return S_FENCE;
  if (!orientation) throw new Error(`Durchgang (${structure}) braucht eine Ausrichtung`);
  const vertical = orientation === 'vertical' ? 1 : 0;
  return (structure === 'visitorGate' ? S_VISITOR_H : S_STAFF_H) + vertical;
}

/**
 * Das Grundstück als reines Datenmodell (ohne Grafik).
 * Pro Feld: Boden (Wiese/Weg) und Bau (nichts/Zaun/Schleuse/Tor).
 * Bauregeln prüft das Grid nicht, das macht rules.ts.
 */
export class Grid {
  private readonly ground: Uint8Array;
  private readonly structure: Uint8Array;
  private readonly listeners = new Set<(changed: Cell[]) => void>();

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.ground = new Uint8Array(width * height);
    this.structure = new Uint8Array(width * height);
  }

  inBounds(x: number, y: number): boolean {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  isPath(x: number, y: number): boolean {
    return this.inBounds(x, y) && this.ground[y * this.width + x] === GROUND_PATH;
  }

  structureAt(x: number, y: number): Structure {
    const code = this.codeAt(x, y);
    if (code === S_FENCE) return 'fence';
    if (code === S_VISITOR_H || code === S_VISITOR_V) return 'visitorGate';
    if (code === S_STAFF_H || code === S_STAFF_V) return 'staffGate';
    return 'none';
  }

  gateOrientationAt(x: number, y: number): Orientation | null {
    const code = this.codeAt(x, y);
    if (code < S_VISITOR_H) return null;
    return (code - S_VISITOR_H) % 2 === 1 ? 'vertical' : 'horizontal';
  }

  /** Zaun oder Durchgang. */
  isFenceLike(x: number, y: number): boolean {
    return this.codeAt(x, y) !== S_NONE;
  }

  /** Wendet Änderungen an; liefert nur die wirklich geänderten Felder und meldet sie einmal. */
  apply(changes: readonly CellChange[]): Cell[] {
    const changed: Cell[] = [];
    for (const change of changes) {
      const { x, y } = change;
      if (!this.inBounds(x, y)) continue;
      const i = y * this.width + x;
      const ground = change.path === undefined ? this.ground[i] : change.path ? GROUND_PATH : GROUND_GRASS;
      const code = change.structure === undefined ? this.structure[i] : encode(change.structure, change.orientation);
      if (ground === this.ground[i] && code === this.structure[i]) continue;
      this.ground[i] = ground;
      this.structure[i] = code;
      changed.push({ x, y });
    }
    if (changed.length > 0) {
      for (const listener of this.listeners) listener(changed);
    }
    return changed;
  }

  /** Entfernt Weg und Bau auf den Feldern (danach Wiese). */
  clear(cells: readonly Cell[]): Cell[] {
    return this.apply(cells.map(({ x, y }) => ({ x, y, path: false, structure: 'none' })));
  }

  /** Setzt (on = true) oder entfernt Wege; liefert nur die wirklich geänderten Felder. */
  applyPath(cells: readonly Cell[], on: boolean): Cell[] {
    return this.apply(cells.map(({ x, y }) => ({ x, y, path: on })));
  }

  /** Meldet Änderungen; die Rückgabe meldet den Listener wieder ab. */
  onChange(listener: (changed: Cell[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private codeAt(x: number, y: number): number {
    return this.inBounds(x, y) ? this.structure[y * this.width + x] : S_NONE;
  }
}
