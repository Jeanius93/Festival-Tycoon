# M1 – Wiese, Raster, Kamera und Wege Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vom Titelbildschirm per „Spielen“ auf ein 64 × 48 Felder großes Grundstück mit Raster und Rand, das man mit Kamera (Tasten, Maus, Bildschirmrand, Mausrad-Zoom in ganzen Stufen) erkundet und auf dem man Wege in L-Form mit Vorschau baut und abreißt.

**Architecture:** Die Spiel-Logik liegt in Phaser-freien, mit Vitest getesteten Modulen: Datenmodell `Grid`, L-Linie, Wegstück-Auswahl (Autotile), Bau-Werkzeug `BuildTool` (Zustandsmaschine für Modus, Ziehen, Vorschau) und Kamera-Mathematik. Die `WorldScene` zeichnet das Grundstück als Phaser-Tilemap mit Ebenen (Boden, Wege, Vorschau), steuert Kamera und Eingaben und reicht sie an `BuildTool` weiter. Die `UIScene` läuft darüber, zoomt nicht mit und zeigt Werkzeugleiste und Hinweistext.

**Tech Stack:** Phaser 3.90, TypeScript, Vite, Vitest (alles schon aus M0 vorhanden, keine neuen Abhängigkeiten)

**Spec:** `docs/superpowers/specs/2026-11-22-m1-wiese-kamera-wege-design.md`

## Global Constraints

- Keine neuen Abhängigkeiten in `package.json`.
- Module unter `src/building/` und `src/core/` importieren **kein** `phaser` (müssen in Vitest ohne Browser laufen).
- Grundstück **64 × 48** Felder, Kachel **16 px**; Zoom nur in **ganzen Stufen 1 bis 6**; Startzoom = `computeZoom(Fensterbreite, Fensterhöhe)` aus M0.
- Alle sichtbaren Texte auf Deutsch.
- Platzhalter-Grafiken werden per Code in `src/assets/placeholders.ts` erzeugt, keine Bilddateien.
- Feldkoordinaten (`Cell`) beziehen sich immer auf das Grundstück (0..63, 0..47), nie auf die Tilemap mit Rand.
- Commit-Nachrichten auf Deutsch mit Präfix `M1:`.

## Review Focus

1. **Klick auf die Werkzeugleiste** darf keinen Weg auf dem Feld darunter bauen oder ein Ziehen starten. → Task 7, Step 4 (Browser-Check).
2. **Maus verlässt das Fenster** während des Ziehens bzw. Maustaste wird außerhalb losgelassen → Weg wird bis zum letzten bekannten Feld gebaut; Randscrollen stoppt, solange die Maus draußen ist. → Task 6 (`pointerupoutside`, `GAME_OUT`), Task 7, Step 4.
3. **Fenstergröße ändert sich** in der Weltansicht → Kamera bleibt im erlaubten Bereich, kleines Grundstück wird mittig gezeigt, Werkzeugleiste bleibt unten mittig. → Task 3, Test `clampCenter … zentriert, wenn Welt kleiner als Ansicht`; Task 7, Step 4.
4. **Rechtsklick** öffnet nie das Browser-Kontextmenü. → Task 6 (`disableContextMenu: true`), Task 7, Step 4.
5. **Mausrad an der Zoomgrenze oder nahe am Rand** → Zoom bleibt in 1..6, Kamera springt nicht aus dem Grundstück. → Task 3, Tests `nextZoomLevel` Grenzen und `zoomAroundPoint`+`clampCenter`.

---

### Task 1: Datenmodell `Grid`

**Files:**
- Create: `src/building/grid.ts`
- Test: `tests/grid.test.ts`
- Modify: `src/config.ts` (Konstanten ergänzen)

**Interfaces:**
- Produces:
  - `src/config.ts`: `export const FIELD = { width: 64, height: 48 } as const;`
  - `src/building/grid.ts`:
    - `export interface Cell { x: number; y: number }`
    - `export class Grid` mit
      - `constructor(width: number, height: number)`, `readonly width`, `readonly height`
      - `inBounds(x: number, y: number): boolean`
      - `isPath(x: number, y: number): boolean` (außerhalb → `false`)
      - `applyPath(cells: readonly Cell[], on: boolean): Cell[]` – setzt/entfernt Wege, überspringt Felder außerhalb und Felder ohne Änderung, gibt die tatsächlich geänderten Felder zurück und benachrichtigt die Listener **einmal** mit genau diesen Feldern (bei leerer Liste keine Benachrichtigung)
      - `onChange(listener: (changed: Cell[]) => void): () => void` (Rückgabe meldet ab)
  - Speicherung als `Uint8Array` mit Bodencode pro Feld (0 = Wiese, 1 = Weg), damit später weitere Ebenen (Bereich, Objekt) als eigene Arrays dazukommen können.

- [ ] **Step 1: Failing tests schreiben** (`tests/grid.test.ts`)

```ts
import { describe, it, expect, vi } from 'vitest';
import { Grid } from '../src/building/grid';

describe('Grid', () => {
  it('startet als leere Wiese', () => {
    const g = new Grid(64, 48);
    expect(g.isPath(0, 0)).toBe(false);
    expect(g.isPath(63, 47)).toBe(false);
  });
  it('inBounds erkennt Grenzen', () => {
    const g = new Grid(64, 48);
    expect(g.inBounds(0, 0)).toBe(true);
    expect(g.inBounds(63, 47)).toBe(true);
    expect(g.inBounds(64, 0)).toBe(false);
    expect(g.inBounds(0, 48)).toBe(false);
    expect(g.inBounds(-1, 5)).toBe(false);
  });
  it('applyPath setzt Wege und liefert geänderte Felder', () => {
    const g = new Grid(64, 48);
    const changed = g.applyPath([{ x: 1, y: 1 }, { x: 2, y: 1 }], true);
    expect(changed).toEqual([{ x: 1, y: 1 }, { x: 2, y: 1 }]);
    expect(g.isPath(1, 1)).toBe(true);
  });
  it('überspringt vorhandene Wege und Felder außerhalb', () => {
    const g = new Grid(64, 48);
    g.applyPath([{ x: 1, y: 1 }], true);
    const changed = g.applyPath([{ x: 1, y: 1 }, { x: -1, y: 0 }, { x: 64, y: 0 }, { x: 3, y: 3 }], true);
    expect(changed).toEqual([{ x: 3, y: 3 }]);
  });
  it('entfernt Wege, ignoriert Wiese', () => {
    const g = new Grid(64, 48);
    g.applyPath([{ x: 1, y: 1 }], true);
    expect(g.applyPath([{ x: 1, y: 1 }, { x: 2, y: 2 }], false)).toEqual([{ x: 1, y: 1 }]);
    expect(g.isPath(1, 1)).toBe(false);
  });
  it('benachrichtigt einmal pro Änderung, nicht bei leerer Änderung', () => {
    const g = new Grid(64, 48);
    const listener = vi.fn();
    const off = g.onChange(listener);
    g.applyPath([{ x: 1, y: 1 }, { x: 2, y: 1 }], true);
    g.applyPath([{ x: 1, y: 1 }], true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith([{ x: 1, y: 1 }, { x: 2, y: 1 }]);
    off();
    g.applyPath([{ x: 5, y: 5 }], true);
    expect(listener).toHaveBeenCalledTimes(1);
  });
  it('isPath außerhalb ist false', () => expect(new Grid(4, 4).isPath(10, 10)).toBe(false));
});
```

- [ ] **Step 2: Tests laufen lassen, müssen fehlschlagen**

Run: `npx vitest run tests/grid.test.ts`
Expected: FAIL (Modul `../src/building/grid` nicht gefunden)

- [ ] **Step 3: `FIELD` in `src/config.ts` und `Grid` in `src/building/grid.ts` implementieren**

- [ ] **Step 4: Tests laufen lassen**

Run: `npx vitest run tests/grid.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/building/grid.ts tests/grid.test.ts
git commit -m "M1: Datenmodell Grid für Wiese und Wege"
```

---

### Task 2: L-Linie und Wegstück-Auswahl

**Files:**
- Create: `src/building/lineTool.ts`, `src/building/autotile.ts`
- Test: `tests/lineTool.test.ts`, `tests/autotile.test.ts`

**Interfaces:**
- Consumes: `Cell`, `Grid` (Task 1)
- Produces:
  - `src/building/lineTool.ts`: `export function lCells(start: Cell, end: Cell, horizontalFirst: boolean): Cell[]` – Felder vom Start bis zum Ende in Reihenfolge, Ecke bei `(end.x, start.y)` wenn `horizontalFirst`, sonst bei `(start.x, end.y)`; keine Lücken, keine Doppelten; Länge `|dx| + |dy| + 1`.
  - `src/building/autotile.ts`: `export const DIR = { N: 1, E: 2, S: 4, W: 8 } as const;` und `export function pathMask(grid: Grid, x: number, y: number): number` – Summe der `DIR`-Bits der Nachbarn, die Weg sind (0..15). Die Zahl ist zugleich der Frame-Index im Weg-Tileset (Task 5).

- [ ] **Step 1: Failing tests schreiben**

`tests/lineTool.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { lCells } from '../src/building/lineTool';

describe('lCells', () => {
  it('Start = Ende → ein Feld', () => expect(lCells({ x: 2, y: 3 }, { x: 2, y: 3 }, true)).toEqual([{ x: 2, y: 3 }]));
  it('waagrechte Linie nach links', () =>
    expect(lCells({ x: 3, y: 0 }, { x: 1, y: 0 }, true)).toEqual([{ x: 3, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }]));
  it('senkrechte Linie, unabhängig von horizontalFirst', () => {
    const expected = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }];
    expect(lCells({ x: 0, y: 0 }, { x: 0, y: 2 }, true)).toEqual(expected);
    expect(lCells({ x: 0, y: 0 }, { x: 0, y: 2 }, false)).toEqual(expected);
  });
  it('L waagrecht zuerst: Ecke bei (end.x, start.y)', () =>
    expect(lCells({ x: 0, y: 0 }, { x: 2, y: 2 }, true)).toEqual([
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 },
    ]));
  it('L senkrecht zuerst: Ecke bei (start.x, end.y)', () =>
    expect(lCells({ x: 0, y: 0 }, { x: 2, y: 2 }, false)).toEqual([
      { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
    ]));
  it('lange Diagonale: keine Lücken, keine Doppelten', () => {
    const cells = lCells({ x: 60, y: 40 }, { x: 3, y: 5 }, true);
    expect(cells.length).toBe(57 + 35 + 1);
    expect(new Set(cells.map((c) => `${c.x},${c.y}`)).size).toBe(cells.length);
    for (let i = 1; i < cells.length; i++) {
      expect(Math.abs(cells[i].x - cells[i - 1].x) + Math.abs(cells[i].y - cells[i - 1].y)).toBe(1);
    }
  });
});
```

`tests/autotile.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Grid } from '../src/building/grid';
import { DIR, pathMask } from '../src/building/autotile';

describe('pathMask', () => {
  it('einzelnes Feld → 0', () => {
    const g = new Grid(5, 5);
    g.applyPath([{ x: 2, y: 2 }], true);
    expect(pathMask(g, 2, 2)).toBe(0);
  });
  it('Kreuzung → 15', () => {
    const g = new Grid(5, 5);
    g.applyPath([{ x: 2, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 2 }], true);
    expect(pathMask(g, 2, 2)).toBe(15);
  });
  it('Ecke Nord+Ost', () => {
    const g = new Grid(5, 5);
    g.applyPath([{ x: 2, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 2 }], true);
    expect(pathMask(g, 2, 2)).toBe(DIR.N | DIR.E);
  });
  it('Rand des Grundstücks zählt als kein Weg', () => {
    const g = new Grid(5, 5);
    g.applyPath([{ x: 0, y: 0 }, { x: 1, y: 0 }], true);
    expect(pathMask(g, 0, 0)).toBe(DIR.E);
  });
});
```

- [ ] **Step 2: Tests laufen lassen, müssen fehlschlagen**

Run: `npx vitest run tests/lineTool.test.ts tests/autotile.test.ts`
Expected: FAIL (Module nicht gefunden)

- [ ] **Step 3: `lCells` und `DIR`/`pathMask` implementieren**

- [ ] **Step 4: Tests laufen lassen**

Run: `npx vitest run tests/lineTool.test.ts tests/autotile.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/building/lineTool.ts src/building/autotile.ts tests/lineTool.test.ts tests/autotile.test.ts
git commit -m "M1: L-Linie und Auswahl der Wegstücke"
```

---

### Task 3: Kamera-Mathematik

**Files:**
- Create: `src/core/camera.ts`
- Test: `tests/camera.test.ts`
- Modify: `src/config.ts`

**Interfaces:**
- Produces:
  - `src/config.ts`: `export const ZOOM_LEVELS = { min: 1, max: 6 } as const;` `export const CAMERA_SPEED = 600;` (Bildschirm-Pixel pro Sekunde) `export const EDGE_SCROLL_MARGIN = 16;` (Bildschirm-Pixel)
  - `src/core/camera.ts` (alles pro Achse, Weltkoordinaten in Pixeln):
    - `export function nextZoomLevel(current: number, direction: 1 | -1): number` – `current + direction`, begrenzt auf `ZOOM_LEVELS`.
    - `export function clampCenter(center: number, viewSize: number, zoom: number, worldMin: number, worldMax: number): number` – sichtbare halbe Breite `h = viewSize / (2 * zoom)`; passt die Welt (`worldMax - worldMin <= 2h`), dann Mitte der Welt; sonst `center` begrenzt auf `[worldMin + h, worldMax - h]`.
    - `export function zoomAroundPoint(center: number, pointerWorld: number, oldZoom: number, newZoom: number): number` – neue Kameramitte, bei der der Weltpunkt unter der Maus an derselben Bildschirmstelle bleibt: `pointerWorld - (pointerWorld - center) * oldZoom / newZoom`.
    - `export function worldToCell(worldX: number, worldY: number, tileSize: number, offsetTiles: number): Cell` – `floor(world / tileSize) - offsetTiles` (Offset = Randbreite der Tilemap), Ergebnis kann außerhalb des Grundstücks liegen.
    - `export function edgeScrollDirection(px: number, py: number, viewW: number, viewH: number, margin: number, pointerInside: boolean): { dx: -1 | 0 | 1; dy: -1 | 0 | 1 }` – innerhalb `margin` vom Rand → Richtung zum Rand; `pointerInside === false` → `{0, 0}`.

- [ ] **Step 1: Failing tests schreiben** (`tests/camera.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { nextZoomLevel, clampCenter, zoomAroundPoint, worldToCell, edgeScrollDirection } from '../src/core/camera';

describe('nextZoomLevel', () => {
  it('rein und raus', () => {
    expect(nextZoomLevel(2, 1)).toBe(3);
    expect(nextZoomLevel(2, -1)).toBe(1);
  });
  it('Grenzen 1 und 6', () => {
    expect(nextZoomLevel(6, 1)).toBe(6);
    expect(nextZoomLevel(1, -1)).toBe(1);
  });
});

describe('clampCenter', () => {
  // Welt 0..1120 (70 Kacheln à 16 px), Ansicht 800 px
  it('begrenzt links/rechts bei Zoom 2 (halbe Sicht 200)', () => {
    expect(clampCenter(0, 800, 2, 0, 1120)).toBe(200);
    expect(clampCenter(5000, 800, 2, 0, 1120)).toBe(920);
    expect(clampCenter(500, 800, 2, 0, 1120)).toBe(500);
  });
  it('zentriert, wenn Welt kleiner als Ansicht', () => {
    expect(clampCenter(0, 1920, 1, 0, 1120)).toBe(560);
    expect(clampCenter(999, 1920, 1, 0, 1120)).toBe(560);
  });
});

describe('zoomAroundPoint', () => {
  it('Punkt unter der Maus bleibt fest', () => {
    // Mitte 500, Maus bei Welt 600, Zoom 2 → 4: Abstand halbiert sich
    expect(zoomAroundPoint(500, 600, 2, 4)).toBe(550);
  });
  it('Zoom am Rand + Begrenzung bleibt im Grundstück', () => {
    const c = zoomAroundPoint(200, 0, 2, 1);
    expect(clampCenter(c, 800, 1, 0, 1120)).toBe(400);
  });
});

describe('worldToCell', () => {
  it('rechnet Randbreite heraus', () => {
    expect(worldToCell(48, 48, 16, 3)).toEqual({ x: 0, y: 0 });
    expect(worldToCell(47, 63, 16, 3)).toEqual({ x: -1, y: 0 });
    expect(worldToCell(48 + 63 * 16 + 15, 48, 16, 3)).toEqual({ x: 63, y: 0 });
  });
});

describe('edgeScrollDirection', () => {
  it('Ecke links oben', () => expect(edgeScrollDirection(5, 5, 800, 600, 16, true)).toEqual({ dx: -1, dy: -1 }));
  it('rechts unten', () => expect(edgeScrollDirection(795, 599, 800, 600, 16, true)).toEqual({ dx: 1, dy: 1 }));
  it('Mitte → keine Bewegung', () => expect(edgeScrollDirection(400, 300, 800, 600, 16, true)).toEqual({ dx: 0, dy: 0 }));
  it('Maus außerhalb des Fensters → keine Bewegung', () =>
    expect(edgeScrollDirection(0, 0, 800, 600, 16, false)).toEqual({ dx: 0, dy: 0 }));
});
```

- [ ] **Step 2: Tests laufen lassen, müssen fehlschlagen**

Run: `npx vitest run tests/camera.test.ts`
Expected: FAIL (Modul nicht gefunden)

- [ ] **Step 3: Konstanten in `src/config.ts` und Funktionen in `src/core/camera.ts` implementieren** (`Cell`-Typ aus `src/building/grid.ts` importieren)

- [ ] **Step 4: Tests laufen lassen**

Run: `npx vitest run tests/camera.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/core/camera.ts tests/camera.test.ts
git commit -m "M1: Kamera-Mathematik (Begrenzung, Zoomstufen, Randscrollen)"
```

---

### Task 4: Bau-Werkzeug `BuildTool`

**Files:**
- Create: `src/building/buildTool.ts`
- Test: `tests/buildTool.test.ts`

**Interfaces:**
- Consumes: `Grid`, `Cell` (Task 1), `lCells` (Task 2)
- Produces (`src/building/buildTool.ts`):
  - `export type ToolMode = 'view' | 'path' | 'demolish';`
  - `export interface Preview { cells: Cell[]; kind: 'build' | 'demolish' }`
  - `export class BuildTool` mit
    - `constructor(grid: Grid)`; Startmodus `'view'`, `horizontalFirst = true`
    - `get mode(): ToolMode`
    - `setMode(mode: ToolMode): void` – bricht ein laufendes Ziehen ab
    - `toggleDemolish(): void` – `'demolish'` ↔ vorheriger Modus (`'view'` oder `'path'`)
    - `rotate(): void` – kehrt `horizontalFirst` um (auch während des Ziehens)
    - `pointerMove(cell: Cell): void` – merkt das Feld unter der Maus (auch außerhalb des Grundstücks); löst `onChange` nur aus, wenn sich das Feld geändert hat
    - `pointerDown(cell: Cell): void` – nur in `'path'`/`'demolish'`: startet Ziehen bei `cell` (auch `pointerMove(cell)`); in `'view'` wirkungslos
    - `pointerUp(): Cell[]` – beendet Ziehen am zuletzt bekannten Feld, wendet `grid.applyPath(cells, mode === 'path')` an, gibt die geänderten Felder zurück; ohne laufendes Ziehen `[]`
    - `cancel(): boolean` – bricht ein laufendes Ziehen ab, `true` falls eines lief
    - `get isDragging(): boolean`
    - `get preview(): Preview | null` – beim Ziehen: `lCells(start, aktuell, horizontalFirst)` gefiltert auf `grid.inBounds`; ohne Ziehen in `'path'`/`'demolish'`: nur das Feld unter der Maus (wenn im Grundstück, sonst `null`); in `'view'`: `null`. `kind` = `'build'` in `'path'`, `'demolish'` in `'demolish'`.
    - `onChange(listener: () => void): () => void` – bei jeder Änderung von Modus oder Vorschau

- [ ] **Step 1: Failing tests schreiben** (`tests/buildTool.test.ts`)

```ts
import { describe, it, expect, vi } from 'vitest';
import { Grid } from '../src/building/grid';
import { BuildTool } from '../src/building/buildTool';

const setup = () => {
  const grid = new Grid(10, 10);
  return { grid, tool: new BuildTool(grid) };
};

describe('BuildTool', () => {
  it('startet in „Ansehen“ und baut dort nichts', () => {
    const { grid, tool } = setup();
    expect(tool.mode).toBe('view');
    tool.pointerDown({ x: 1, y: 1 });
    expect(tool.pointerUp()).toEqual([]);
    expect(grid.isPath(1, 1)).toBe(false);
    expect(tool.preview).toBeNull();
  });
  it('Ziehen baut L-Weg waagrecht zuerst', () => {
    const { grid, tool } = setup();
    tool.setMode('path');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 2, y: 1 });
    expect(tool.preview).toEqual({ kind: 'build', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }] });
    expect(tool.pointerUp()).toHaveLength(4);
    expect(grid.isPath(2, 0)).toBe(true);
    expect(tool.isDragging).toBe(false);
  });
  it('R dreht die Ecke während des Ziehens', () => {
    const { grid, tool } = setup();
    tool.setMode('path');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 2, y: 1 });
    tool.rotate();
    tool.pointerUp();
    expect(grid.isPath(0, 1)).toBe(true);
    expect(grid.isPath(2, 0)).toBe(false);
  });
  it('Klick ohne Ziehen baut ein Feld', () => {
    const { grid, tool } = setup();
    tool.setMode('path');
    tool.pointerDown({ x: 4, y: 4 });
    expect(tool.pointerUp()).toEqual([{ x: 4, y: 4 }]);
    expect(grid.isPath(4, 4)).toBe(true);
  });
  it('Abbrechen baut nichts', () => {
    const { grid, tool } = setup();
    tool.setMode('path');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 3, y: 0 });
    expect(tool.cancel()).toBe(true);
    expect(tool.pointerUp()).toEqual([]);
    expect(grid.isPath(0, 0)).toBe(false);
    expect(tool.cancel()).toBe(false);
  });
  it('Felder außerhalb werden abgeschnitten', () => {
    const { grid, tool } = setup();
    tool.setMode('path');
    tool.pointerDown({ x: 8, y: 0 });
    tool.pointerMove({ x: 12, y: 0 });
    expect(tool.preview?.cells).toEqual([{ x: 8, y: 0 }, { x: 9, y: 0 }]);
    expect(tool.pointerUp()).toHaveLength(2);
    expect(grid.isPath(9, 0)).toBe(true);
  });
  it('vorhandene Wege werden übersprungen', () => {
    const { grid, tool } = setup();
    grid.applyPath([{ x: 1, y: 0 }], true);
    tool.setMode('path');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 2, y: 0 });
    expect(tool.pointerUp()).toEqual([{ x: 0, y: 0 }, { x: 2, y: 0 }]);
  });
  it('Abreißen entfernt Wege, Vorschau rot', () => {
    const { grid, tool } = setup();
    grid.applyPath([{ x: 0, y: 0 }, { x: 1, y: 0 }], true);
    tool.setMode('demolish');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 3, y: 0 });
    expect(tool.preview?.kind).toBe('demolish');
    expect(tool.pointerUp()).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    expect(grid.isPath(0, 0)).toBe(false);
  });
  it('Entf schaltet Abreißen ein und zurück zum vorherigen Modus', () => {
    const { tool } = setup();
    tool.setMode('path');
    tool.toggleDemolish();
    expect(tool.mode).toBe('demolish');
    tool.toggleDemolish();
    expect(tool.mode).toBe('path');
  });
  it('Moduswechsel bricht Ziehen ab', () => {
    const { grid, tool } = setup();
    tool.setMode('path');
    tool.pointerDown({ x: 0, y: 0 });
    tool.setMode('view');
    expect(tool.pointerUp()).toEqual([]);
    expect(grid.isPath(0, 0)).toBe(false);
  });
  it('Hover-Vorschau ohne Ziehen, außerhalb null', () => {
    const { tool } = setup();
    tool.setMode('path');
    tool.pointerMove({ x: 3, y: 3 });
    expect(tool.preview).toEqual({ kind: 'build', cells: [{ x: 3, y: 3 }] });
    tool.pointerMove({ x: -1, y: 3 });
    expect(tool.preview).toBeNull();
  });
  it('onChange nur bei echter Änderung', () => {
    const { tool } = setup();
    const listener = vi.fn();
    tool.onChange(listener);
    tool.setMode('path');
    tool.pointerMove({ x: 1, y: 1 });
    tool.pointerMove({ x: 1, y: 1 });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Tests laufen lassen, müssen fehlschlagen**

Run: `npx vitest run tests/buildTool.test.ts`
Expected: FAIL (Modul nicht gefunden)

- [ ] **Step 3: `BuildTool` implementieren**

- [ ] **Step 4: Alle Tests laufen lassen**

Run: `npm test`
Expected: PASS (alle Testdateien, inkl. `zoom.test.ts` aus M0)

- [ ] **Step 5: Commit**

```bash
git add src/building/buildTool.ts tests/buildTool.test.ts
git commit -m "M1: Bau-Werkzeug mit Ziehen, Drehen, Abbrechen und Abreißen"
```

---

### Task 5: Platzhalter-Grafiken

**Files:**
- Modify: `src/assets/placeholders.ts`, `src/config.ts`

**Interfaces:**
- Consumes: `DIR` (Task 2)
- Produces:
  - `src/config.ts`: `export const BORDER_TILES = 3;` und in `COLORS` zusätzlich `border`, `borderDark`, `path`, `pathEdge`, `grid`, `previewBuild`, `previewDemolish`, `uiPanel`, `uiButton`, `uiButtonActive`, `uiText` (warme Töne nach Wahl; Weg = Sand/Kies, Rand = dunkles Gebüsch).
  - `TEXTURE_KEYS` erweitert um:
    - `groundTiles` – 32 × 16, Frame 0 = Wiese (bisherige Grasgrafik), Frame 1 = Rand/Gebüsch
    - `pathTiles` – 256 × 16, 16 Frames; Frame `m` zeigt ein Wegstück mit Mittelfläche plus Armen zu jeder Richtung, deren `DIR`-Bit in `m` gesetzt ist (Frame 0 = einzelner Fleck)
    - `previewTiles` – 32 × 16, Frame 0 = Bau-Vorschau (helle Wegfarbe mit Rahmen), Frame 1 = Abriss-Vorschau (rot mit Rahmen); halbtransparent wird über die Ebene gesteuert
    - `gridCell` – 16 × 16, transparent, 1-px-Linie oben und links in `COLORS.grid`
  - `TEXTURE_KEYS.grass` bleibt (Titelbildschirm nutzt ihn).

- [ ] **Step 1: Konstanten ergänzen und Texturen in `createPlaceholderTextures` erzeugen** (für die Mehr-Frame-Texturen per `generateTexture` mit Gesamtbreite und danach `texture.add(frameIndex, 0, x, 0, 16, 16)` für jeden Frame)

- [ ] **Step 2: Typprüfung und Tests**

Run: `npm run typecheck && npm test`
Expected: keine Fehler, alle Tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/config.ts src/assets/placeholders.ts
git commit -m "M1: Platzhalter-Grafiken für Rand, Wege, Vorschau und Raster"
```

---

### Task 6: Weltszene mit Tilemap, Kamera und Bauen; „Spielen“ im Titel

**Files:**
- Create: `src/scenes/WorldScene.ts`
- Modify: `src/scenes/TitleScene.ts`, `src/main.ts`

**Interfaces:**
- Consumes: `FIELD`, `BORDER_TILES`, `TILE_SIZE`, `ZOOM_LEVELS`, `CAMERA_SPEED`, `EDGE_SCROLL_MARGIN` (config); `Grid`; `BuildTool`; `pathMask`; alle Funktionen aus `src/core/camera.ts`; `computeZoom`; `TEXTURE_KEYS`
- Produces:
  - `export class WorldScene extends Phaser.Scene`, Schlüssel `'World'`, mit privaten Feldern `grid: Grid`, `tool: BuildTool` und einer privaten Methode `isOverUi(x: number, y: number): boolean`, die in diesem Task immer `false` liefert (Task 7 verbindet sie mit der Werkzeugleiste).

- [ ] **Step 1: `TitleScene` erweitern**

Untertitel-Text `'M1 – Wiese & Wege'`. Darunter eine Text-Schaltfläche `'▶ Spielen'` (gleiche Schrift, mit Hintergrundfarbe `COLORS.uiButton`, Größe abhängig von `computeZoom` wie die übrigen Texte, in `layout()` positioniert), `setInteractive({ useHandCursor: true })`, Klick → `this.scene.start('World')`.

- [ ] **Step 2: `main.ts` anpassen**

Szenenliste `[BootScene, TitleScene, WorldScene]` (in Task 7 kommt `UIScene` dazu), `disableContextMenu: true` in der Spielkonfiguration.

- [ ] **Step 3: `WorldScene` aufbauen**

- **Tilemap:** `this.make.tilemap({ width: FIELD.width + 2 * BORDER_TILES, height: FIELD.height + 2 * BORDER_TILES, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE })`. Drei Ebenen per `createBlankLayer`: `ground` (Tileset `groundTiles`; Rand-Ring = Frame 1, Rest = Frame 0), `paths` (Tileset `pathTiles`), `preview` (Tileset `previewTiles`, Alpha 0.6). Grundstücksfeld `(x, y)` liegt auf Tilemap-Feld `(x + BORDER_TILES, y + BORDER_TILES)`.
- **Raster:** `tileSprite` mit `gridCell` exakt über dem Grundstück (nicht über dem Rand), zwischen `paths` und `preview`; Taste **G** schaltet `visible` um.
- **Wege zeichnen:** `grid.onChange(changed)` → für jedes geänderte Feld und seine vier Nachbarn: ist Weg → `putTileAt(pathMask(...), …)` auf `paths`, sonst `removeTileAt`.
- **Vorschau zeichnen:** `tool.onChange` → `preview`-Ebene leeren, für jede Vorschauzelle Frame 0 (`build`) bzw. 1 (`demolish`) setzen.
- **Kamera:** Weltgrenzen `0 … (FIELD + 2·BORDER_TILES)·TILE_SIZE` je Achse; Kameramitte (`centerX`, `centerY`) als eigene Felder der Szene halten, Start = Mitte der Welt, Startzoom = `computeZoom(scale.width, scale.height)` begrenzt auf `ZOOM_LEVELS`. Nach jeder Änderung: `clampCenter` je Achse, dann `cam.setZoom(zoom)` und `cam.centerOn(centerX, centerY)`. Kamera-Hintergrund `COLORS.borderDark`.
- **`update(time, delta)`:** WASD/Pfeile und `edgeScrollDirection(pointer.x, pointer.y, …, EDGE_SCROLL_MARGIN, pointerInside)` addieren je Achse `richtung · CAMERA_SPEED · delta/1000 / zoom` zur Kameramitte; danach Feld unter der Maus per `cam.getWorldPoint` + `worldToCell(…, TILE_SIZE, BORDER_TILES)` berechnen und `tool.pointerMove(cell)` aufrufen (so läuft die Vorschau beim Randscrollen mit).
- **`pointerInside`:** `false` bei `Phaser.Input.Events.GAME_OUT`, `true` bei `GAME_OVER`.
- **Maus:**
  - `pointerdown`: wenn `this.isOverUi(pointer.x, pointer.y)` → ignorieren. Mittlere Taste → Kamera-Ziehen starten. Rechte Taste → `if (!tool.cancel()) tool.setMode('view')`. Linke Taste: in `'view'` Kamera-Ziehen starten, sonst `tool.pointerDown(cell)`.
  - `pointermove`: beim Kamera-Ziehen Kameramitte um `-(Δ Bildschirm-Pixel) / zoom` verschieben.
  - `pointerup` **und** `pointerupoutside`: Kamera-Ziehen beenden; bei linker Taste `tool.pointerUp()`.
  - `wheel`: `deltaY < 0` → `nextZoomLevel(zoom, 1)`, `> 0` → `-1`; bei Änderung Kameramitte je Achse mit `zoomAroundPoint(center, pointerWorld, alt, neu)` neu setzen, dann begrenzen.
- **Tasten:** `R` → `tool.rotate()`, `DELETE` → `tool.toggleDemolish()`, `ESC` → `tool.setMode('view')`, `G` → Raster ein/aus.
- **Größenänderung:** bei `Phaser.Scale.Events.RESIZE` Kamera neu begrenzen; Listener beim `SHUTDOWN` abmelden (wie in `TitleScene`).
- Das Weg-Werkzeug ist erst mit der Werkzeugleiste (Task 7) auswählbar; die Sichtprüfung in Step 5 prüft deshalb nur Wiese, Kamera und Zoom.

- [ ] **Step 4: Typprüfung, Tests, Build**

Run: `npm run typecheck && npm test && npm run build`
Expected: keine Fehler

- [ ] **Step 5: Sichtprüfung im Browser**

`npm run build && npx vite preview --port 4173` im Hintergrund, Playwright-Skript im Scratchpad: Seite `http://localhost:4173/Festival-Tycoon/` (1280 × 720) öffnen, „Spielen“ anklicken, Screenshot. Erwartet: Wiese mit Raster und dunklem Rand, keine Konsolenfehler. Mausrad ein paar Schritte → Screenshot zeigt anderen Zoom, Pixel scharf. Taste `D` 1 s halten → Bild hat sich verschoben.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/WorldScene.ts src/scenes/TitleScene.ts src/main.ts
git commit -m "M1: Weltszene mit Tilemap, Kamera, Zoom und Wegebau"
```

---

### Task 7: Oberfläche (Werkzeugleiste, Hinweise), Abschluss-Check, Doku

**Files:**
- Create: `src/scenes/UIScene.ts`, `src/ui/hints.ts`
- Modify: `src/scenes/WorldScene.ts` (UI starten, `containsPoint` nutzen), `src/main.ts` (Szene registrieren), `CLAUDE.md` (Projektstand), `README.md` (Steuerung), `src/building/README.md`, `src/ui/README.md`

**Interfaces:**
- Consumes: `BuildTool`, `ToolMode` (Task 4), `computeZoom`, `COLORS`
- Produces:
  - `src/ui/hints.ts`:
    ```ts
    export const TOOL_LABELS: Record<ToolMode, string> = { view: 'Ansehen', path: 'Weg', demolish: 'Abreißen' };
    export const TOOL_HINTS: Record<ToolMode, string> = {
      view: 'Ziehen: Kamera verschieben · Mausrad: Zoom · G: Raster',
      path: 'Ziehen: Weg bauen · R: Ecke drehen · Rechtsklick: Abbrechen',
      demolish: 'Ziehen: Wege abreißen · Entf: Abreißen aus · Rechtsklick: Abbrechen',
    };
    ```
  - `export class UIScene extends Phaser.Scene`, Schlüssel `'UI'`; `init(data: { tool: BuildTool })`; `containsPoint(x: number, y: number): boolean` (Werkzeugleiste inkl. Hinweistext).

- [ ] **Step 1: `UIScene` bauen**

Unten mittig eine Leiste mit drei Schaltflächen in der Reihenfolge Ansehen, Weg, Abreißen (Beschriftung aus `TOOL_LABELS`), Klick → `tool.setMode(mode)`. Aktive Schaltfläche in `COLORS.uiButtonActive`, sonst `COLORS.uiButton`, Panel in `COLORS.uiPanel`. Darüber der Hinweistext `TOOL_HINTS[tool.mode]`. Aktualisierung über `tool.onChange` (Listener beim `SHUTDOWN` abmelden). Größen mit Faktor `computeZoom(scale.width, scale.height)` wie im Titelbildschirm; bei `RESIZE` neu anordnen. Die Kamera der UIScene bleibt auf Zoom 1.

- [ ] **Step 2: Einbinden**

`main.ts`: Szenenliste `[BootScene, TitleScene, WorldScene, UIScene]`. `WorldScene.create()`: `this.scene.launch('UI', { tool: this.tool })`; `isOverUi(x, y)` liefert `(this.scene.get('UI') as UIScene).containsPoint(x, y)`.

- [ ] **Step 3: Typprüfung, Tests, Build**

Run: `npm run typecheck && npm test && npm run build`
Expected: keine Fehler

- [ ] **Step 4: Abschluss-Check im Browser** (Playwright gegen `vite preview`, 1280 × 720, Screenshots ansehen)

1. Titel → „Spielen“ → Wiese 64 × 48 mit Raster, Rand, Werkzeugleiste unten, Hinweistext „Ansehen“.
2. „Weg“ anklicken → Schaltfläche hervorgehoben, unter der Leiste ist **kein** Wegfeld entstanden.
3. Linke Taste von Feld A nach Feld B ziehen (diagonal) → während des Ziehens Screenshot: L-Vorschau; `R` drücken → Ecke gedreht; loslassen → Weg mit verbundenen Stücken.
4. Ziehen starten, Rechtsklick → nichts gebaut, kein Kontextmenü (`page.on('dialog')`/Screenshot), Werkzeug bleibt „Weg“; zweiter Rechtsklick → „Ansehen“.
5. Ziehen starten, Maus aus dem Fenster bewegen und dort loslassen (`page.mouse.up()` nach Bewegung auf negative Koordinaten) → Weg bis zum letzten Feld gebaut.
6. `Entf` → rote Vorschau, Ziehen über den Weg → Weg entfernt; `Entf` → zurück zu „Weg“.
7. Fenster auf 800 × 450 und auf 1920 × 1080 ändern → Leiste unten mittig, Kamera im Grundstück; bei Zoom 1 auf 1920 × 1080 Grundstück mittig.
8. Mausrad 10× hinein und 10× hinaus am Grundstücksrand → kein Sprung aus dem Grundstück.
9. Keine Fehler in der Browser-Konsole.

- [ ] **Step 5: Doku aktualisieren**

- `CLAUDE.md`, Abschnitt „Projektstand“: Zeile M1 → `✅ fertig (Pull Request; nach dem Merge auf GitHub Pages spielbar)`.
- `README.md`: neuer Abschnitt „Steuerung“ mit den Tasten und Mausaktionen aus der Spec (WASD/Pfeile, mittlere Maustaste, Bildschirmrand, Mausrad, Weg ziehen, R, Rechtsklick, Entf, Esc, G).
- `src/building/README.md` und `src/ui/README.md`: je ein Satz zum aktuellen Inhalt.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/UIScene.ts src/ui/hints.ts src/scenes/WorldScene.ts src/main.ts CLAUDE.md README.md src/building/README.md src/ui/README.md
git commit -m "M1: Werkzeugleiste mit Hinweisen, Doku und Projektstand"
```
