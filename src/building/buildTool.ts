import type { Cell, Grid } from './grid';
import { lCells } from './lineTool';
import { changeFor, verdict, type BuildKind } from './rules';

/** Werkzeuge: nur schauen, Weg, Zaun, Besucher-Schleuse, Personal-Tor, abreißen. */
export type ToolMode = 'view' | 'path' | 'fence' | 'visitorGate' | 'staffGate' | 'demolish';

/**
 * Was die Vorschau gerade zeigen soll. Bei 'build' stehen in `cells` die Felder,
 * die gebaut werden oder schon fertig sind (hell), in `blocked` die nicht erlaubten (rot).
 * Bei 'demolish' stehen alle Felder in `cells`, `blocked` ist leer.
 */
export interface Preview {
  cells: Cell[];
  blocked: Cell[];
  kind: 'build' | 'demolish';
}

/**
 * Das Bau-Werkzeug ohne Grafik: merkt sich Modus, Ziehen und Vorschau
 * und wendet das Ergebnis beim Loslassen auf das Grundstück an.
 */
export class BuildTool {
  private currentMode: ToolMode = 'view';
  private modeBeforeDemolish: ToolMode = 'view';
  private horizontalFirst = true;
  private dragStart: Cell | null = null;
  private hover: Cell | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly grid: Grid) {}

  get mode(): ToolMode {
    return this.currentMode;
  }

  get isDragging(): boolean {
    return this.dragStart !== null;
  }

  setMode(mode: ToolMode): void {
    const wasDragging = this.isDragging;
    this.dragStart = null;
    if (mode === this.currentMode) {
      if (wasDragging) this.notify();
      return;
    }
    if (mode === 'demolish') this.modeBeforeDemolish = this.currentMode;
    this.currentMode = mode;
    this.notify();
  }

  /** Entf: Abreißen ein bzw. zurück zum Werkzeug davor. */
  toggleDemolish(): void {
    this.setMode(this.currentMode === 'demolish' ? this.modeBeforeDemolish : 'demolish');
  }

  /** R: Ecke der L-Form drehen. */
  rotate(): void {
    this.horizontalFirst = !this.horizontalFirst;
    if (this.isDragging) this.notify();
  }

  pointerMove(cell: Cell): void {
    if (this.hover && this.hover.x === cell.x && this.hover.y === cell.y) return;
    this.hover = { x: cell.x, y: cell.y };
    this.notify();
  }

  pointerDown(cell: Cell): void {
    if (this.currentMode === 'view') return;
    this.pointerMove(cell);
    this.dragStart = { x: cell.x, y: cell.y };
    this.notify();
  }

  /** Loslassen: baut bzw. reißt ab und liefert die geänderten Felder. */
  pointerUp(): Cell[] {
    if (!this.isDragging) return [];
    const cells = this.previewCells();
    this.dragStart = null;
    const kind = this.buildKind();
    const changed = kind
      ? this.grid.apply(
          cells.filter((c) => verdict(this.grid, kind, c.x, c.y) === 'build').map((c) => changeFor(this.grid, kind, c.x, c.y)),
        )
      : this.grid.clear(cells);
    this.notify();
    return changed;
  }

  /** Bricht ein laufendes Ziehen ab; true, wenn eines lief. */
  cancel(): boolean {
    if (!this.isDragging) return false;
    this.dragStart = null;
    this.notify();
    return true;
  }

  get preview(): Preview | null {
    if (this.currentMode === 'view') return null;
    const cells = this.previewCells();
    if (cells.length === 0) return null;
    const kind = this.buildKind();
    if (!kind) return { cells, blocked: [], kind: 'demolish' };
    const allowed: Cell[] = [];
    const blocked: Cell[] = [];
    for (const c of cells) (verdict(this.grid, kind, c.x, c.y) === 'blocked' ? blocked : allowed).push(c);
    return { cells: allowed, blocked, kind: 'build' };
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private previewCells(): Cell[] {
    if (!this.hover) return [];
    // Durchgänge betreffen immer nur das Feld unter der Maus, auch während gedrückter Taste.
    const isGate = this.currentMode === 'visitorGate' || this.currentMode === 'staffGate';
    const cells =
      this.dragStart && !isGate ? lCells(this.dragStart, this.hover, this.horizontalFirst) : [this.hover];
    return cells.filter((c) => this.grid.inBounds(c.x, c.y));
  }

  /** Bauart des aktiven Werkzeugs; null beim Abreißen (und bei „Ansehen“). */
  private buildKind(): BuildKind | null {
    return this.currentMode === 'view' || this.currentMode === 'demolish' ? null : this.currentMode;
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
