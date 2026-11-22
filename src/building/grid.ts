/** Ein Feld des Grundstücks (0 … Breite-1, 0 … Höhe-1). */
export interface Cell {
  x: number;
  y: number;
}

const GROUND_GRASS = 0;
const GROUND_PATH = 1;

/**
 * Das Grundstück als reines Datenmodell (ohne Grafik).
 * Pro Feld wird der Boden gespeichert; weitere Ebenen (Bereich, Objekt)
 * können später als eigene Arrays dazukommen.
 */
export class Grid {
  private readonly ground: Uint8Array;
  private readonly listeners = new Set<(changed: Cell[]) => void>();

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.ground = new Uint8Array(width * height);
  }

  inBounds(x: number, y: number): boolean {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  isPath(x: number, y: number): boolean {
    return this.inBounds(x, y) && this.ground[y * this.width + x] === GROUND_PATH;
  }

  /** Setzt (on = true) oder entfernt Wege; liefert nur die wirklich geänderten Felder. */
  applyPath(cells: readonly Cell[], on: boolean): Cell[] {
    const target = on ? GROUND_PATH : GROUND_GRASS;
    const changed: Cell[] = [];
    for (const { x, y } of cells) {
      if (!this.inBounds(x, y)) continue;
      const i = y * this.width + x;
      if (this.ground[i] === target) continue;
      this.ground[i] = target;
      changed.push({ x, y });
    }
    if (changed.length > 0) {
      for (const listener of this.listeners) listener(changed);
    }
    return changed;
  }

  /** Meldet Änderungen; die Rückgabe meldet den Listener wieder ab. */
  onChange(listener: (changed: Cell[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
