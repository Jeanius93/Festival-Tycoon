import type { Cash } from '../economy/cash';
import { CATALOG, type BuildingType } from './catalog';
import type { Building, Cell, Facing, Grid } from './grid';
import { lCells, rectBetween } from './lineTool';
import { backCells, footprint, placementVerdict, rectCells, rotateFacing, type PlacementVerdict, type Rect } from './placement';
import { changeFor, verdict, type BuildKind } from './rules';

/** Werkzeuge: nur schauen, Weg, Zaun, Besucher-Schleuse, Personal-Tor, Zeltfläche, Gebäude, abreißen. */
export type ToolMode = 'view' | 'path' | 'fence' | 'visitorGate' | 'staffGate' | 'camp' | 'building' | 'demolish';

/**
 * Was die Vorschau gerade zeigen soll.
 * - 'build': `cells` werden gebaut oder sind schon fertig (hell), `blocked` sind nicht erlaubt (rot).
 * - 'demolish': alle betroffenen Felder in `cells` (auch die ganzen Grundflächen berührter Gebäude);
 *   `blocked` sind Stellplätze mit Zelt oder Auto, die stehen bleiben.
 * - 'building': Grundfläche des Gebäudes unter der Maus; erlaubt → `cells`, sonst `blocked`.
 *   `back` sind die Felder hinter der Rückseite (Lieferseite). Nur Felder auf dem Grundstück.
 */
export type Preview =
  | { kind: 'build' | 'demolish'; cells: Cell[]; blocked: Cell[] }
  | {
      kind: 'building';
      type: BuildingType;
      facing: Facing;
      rect: Rect;
      cells: Cell[];
      blocked: Cell[];
      back: Cell[];
      verdict: PlacementVerdict;
    };

/**
 * Das Bau-Werkzeug ohne Grafik: merkt sich Modus, Ziehen und Vorschau
 * und wendet das Ergebnis beim Loslassen auf das Grundstück und die Kasse an.
 */
export class BuildTool {
  private currentMode: ToolMode = 'view';
  private modeBeforeDemolish: ToolMode = 'view';
  private horizontalFirst = true;
  private selectedBuilding: BuildingType | null = null;
  private currentFacing: Facing = 'N';
  private dragStart: Cell | null = null;
  private hover: Cell | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly grid: Grid,
    private readonly cash: Cash,
  ) {}

  get mode(): ToolMode {
    return this.currentMode;
  }

  get isDragging(): boolean {
    return this.dragStart !== null;
  }

  /** Die zuletzt gewählte Gebäudeart (bleibt auch in anderen Modi gemerkt). */
  get buildingType(): BuildingType | null {
    return this.selectedBuilding;
  }

  /** Richtung der Rückseite für das nächste Gebäude. */
  get facing(): Facing {
    return this.currentFacing;
  }

  setMode(mode: ToolMode): void {
    if (mode === 'building' && !this.selectedBuilding) return;
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

  /** Wählt ein Gebäude zum Bauen; die Richtung bleibt erhalten. */
  selectBuilding(type: BuildingType): void {
    if (this.selectedBuilding === type) {
      this.setMode('building');
      return;
    }
    this.selectedBuilding = type;
    if (this.currentMode === 'building') {
      this.dragStart = null;
      this.notify();
    } else {
      this.setMode('building');
    }
  }

  /** Entf: Abreißen ein bzw. zurück zum Werkzeug davor. */
  toggleDemolish(): void {
    this.setMode(this.currentMode === 'demolish' ? this.modeBeforeDemolish : 'demolish');
  }

  /** R: Gebäude drehen bzw. Ecke der L-Form drehen. */
  rotate(): void {
    if (this.currentMode === 'building') {
      this.currentFacing = rotateFacing(this.currentFacing);
      this.notify();
      return;
    }
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
    let changed: Cell[];
    if (this.currentMode === 'building') {
      changed = this.placeBuilding();
      this.dragStart = null;
    } else if (this.currentMode === 'demolish') {
      changed = this.demolish(this.previewCells().filter((c) => !this.grid.isOccupied(c.x, c.y)));
      this.dragStart = null;
    } else {
      const cells = this.previewCells();
      this.dragStart = null;
      const kind = this.buildKind();
      changed = kind
        ? this.grid.apply(
            cells
              .filter((c) => verdict(this.grid, kind, c.x, c.y) === 'build')
              .map((c) => changeFor(this.grid, kind, c.x, c.y)),
          )
        : [];
    }
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
    if (this.currentMode === 'building') return this.buildingPreview();
    const cells = this.previewCells();
    if (cells.length === 0) return null;
    if (this.currentMode === 'demolish') {
      const free = cells.filter((c) => !this.grid.isOccupied(c.x, c.y));
      const kept = cells.filter((c) => this.grid.isOccupied(c.x, c.y));
      return { cells: [...free, ...this.extraFootprintCells(free)], blocked: kept, kind: 'demolish' };
    }
    const kind = this.buildKind();
    if (!kind) return null;
    const allowed: Cell[] = [];
    const blocked: Cell[] = [];
    for (const c of cells) (verdict(this.grid, kind, c.x, c.y) === 'blocked' ? blocked : allowed).push(c);
    return { cells: allowed, blocked, kind: 'build' };
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Grundfläche und Urteil für das gewählte Gebäude an der Mausposition. */
  private placement(): { type: BuildingType; rect: Rect; verdict: PlacementVerdict } | null {
    const type = this.selectedBuilding;
    if (!type || !this.hover || !this.grid.inBounds(this.hover.x, this.hover.y)) return null;
    const rect = footprint(type, this.currentFacing, this.hover);
    return { type, rect, verdict: placementVerdict(this.grid, rect, CATALOG[type].price, this.cash.balance) };
  }

  private buildingPreview(): Preview | null {
    const p = this.placement();
    if (!p) return null;
    const inside = (c: Cell) => this.grid.inBounds(c.x, c.y);
    const area = rectCells(p.rect).filter(inside);
    const ok = p.verdict === 'ok';
    return {
      kind: 'building',
      type: p.type,
      facing: this.currentFacing,
      rect: p.rect,
      cells: ok ? area : [],
      blocked: ok ? [] : area,
      back: backCells(p.rect, this.currentFacing).filter(inside),
      verdict: p.verdict,
    };
  }

  /** Stellt das gewählte Gebäude an der Mausposition hin, wenn die Bauregel es erlaubt. */
  private placeBuilding(): Cell[] {
    const p = this.placement();
    if (!p || p.verdict !== 'ok') return [];
    const price = CATALOG[p.type].price;
    if (!this.cash.spend(price)) return [];
    this.grid.addBuilding({ type: p.type, ...p.rect, facing: this.currentFacing, paidPrice: price });
    return rectCells(p.rect);
  }

  /** Reißt alles auf den Feldern ab; berührte Gebäude ganz, mit Erstattung des bezahlten Preises. */
  private demolish(cells: Cell[]): Cell[] {
    const changed: Cell[] = [];
    for (const b of this.touchedBuildings(cells)) {
      this.grid.removeBuilding(b.id);
      this.cash.refund(b.paidPrice);
      changed.push(...rectCells(b));
    }
    changed.push(...this.grid.clear(cells));
    return changed;
  }

  /** Gebäude, die mindestens eines der Felder belegen (jedes nur einmal). */
  private touchedBuildings(cells: Cell[]): Building[] {
    const found = new Map<number, Building>();
    for (const { x, y } of cells) {
      const b = this.grid.buildingAt(x, y);
      if (b) found.set(b.id, b);
    }
    return [...found.values()];
  }

  /** Felder berührter Gebäude, die nicht schon in `cells` liegen. */
  private extraFootprintCells(cells: Cell[]): Cell[] {
    const seen = new Set(cells.map(({ x, y }) => `${x},${y}`));
    const extra: Cell[] = [];
    for (const b of this.touchedBuildings(cells)) {
      for (const c of rectCells(b)) {
        const key = `${c.x},${c.y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        extra.push(c);
      }
    }
    return extra;
  }

  private previewCells(): Cell[] {
    if (!this.hover) return [];
    // Durchgänge betreffen immer nur das Feld unter der Maus, auch während gedrückter Taste.
    const isGate = this.currentMode === 'visitorGate' || this.currentMode === 'staffGate';
    let cells: Cell[];
    if (!this.dragStart || isGate) cells = [this.hover];
    else if (this.currentMode === 'camp') cells = rectBetween(this.dragStart, this.hover);
    else cells = lCells(this.dragStart, this.hover, this.horizontalFirst);
    return cells.filter((c) => this.grid.inBounds(c.x, c.y));
  }

  /** Bauart der Feld-Werkzeuge (Weg, Zaun, Durchgänge, Zeltfläche); sonst null. */
  private buildKind(): BuildKind | null {
    const m = this.currentMode;
    return m === 'path' || m === 'fence' || m === 'visitorGate' || m === 'staffGate' || m === 'camp' ? m : null;
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
