# M3 – Objekte platzieren Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Über ein zweistufiges Bau-Menü lassen sich Bühne, fünf Stände und ein Dixi-Klo mit Vorschau auf die Wiese stellen, mit R in vier Richtungen drehen, aus einer Kasse bezahlen und mit voller Erstattung abreißen. Gebäude ohne Weg an der Rückseite zeigen ein Warnsymbol.

**Architecture:** Ein Phaser-freier **Katalog** beschreibt alle Gebäudearten. Das `Grid` bekommt eine dritte Ebene mit Gebäude-Kennnummern und führt die Gebäudeliste. `placement.ts` berechnet Grundfläche, Rückseite, „beliefert?“ und die Bauregel. Die `Cash`-Klasse ist die Kasse. `BuildTool` bekommt einen Gebäude-Modus und nutzt für Vorschau und Bauen dieselbe Regel. `WorldScene` zeichnet jedes Gebäude als ein Bild, `UIScene` zeigt Haupt- und Unterleiste sowie die Kasse.

**Tech Stack:** Phaser 3.90, TypeScript, Vite, Vitest (keine neuen Abhängigkeiten)

**Spec:** `docs/superpowers/specs/2026-11-23-m3-objekte-platzieren-design.md`

## Global Constraints

- Keine neuen Abhängigkeiten in `package.json`.
- Module unter `src/building/`, `src/economy/`, `src/core/` und die Daten-Module in `src/ui/` (`menu.ts`, `hints.ts`, `format.ts`) importieren **kein** `phaser`.
- Feldkoordinaten (`Cell`) beziehen sich immer auf das Grundstück (0..63, 0..47), nie auf die Tilemap mit Rand (`BORDER_TILES`).
- Gebäude, Größen (Breite × Tiefe bei Rückseite oben) und Preise exakt: Bühne 6 × 4, 4 000 € · Bierstand 3 × 2, 600 € · Pommes 3 × 2, 400 € · Bratwurst 3 × 2, 400 € · Pizza 3 × 2, 500 € · Merch-Stand 3 × 2, 500 € · Dixi-Klo 1 × 1, 150 €.
- Startkasse **10 000 €**. Die Kasse wird nie negativ. Wege, Zäune und Durchgänge kosten **nichts**. Abreißen erstattet **genau den bezahlten Preis** (`paidPrice`).
- Hauptleiste in genau dieser Reihenfolge: **Ansehen · Wege & Zäune · Bühnen · Stände · Sanitär · Abreißen**. Unterleisten: Wege & Zäune = Weg, Zaun, Schleuse, Tor; Bühnen = Bühne; Stände = Bierstand, Pommes, Bratwurst, Pizza, Merch-Stand; Sanitär = Dixi-Klo.
- Menü, Hinweis und Kasse müssen bei 320 × 180 Spielpixeln passen und lesbar sein.
- Alle sichtbaren Texte auf Deutsch. Platzhalter-Grafiken nur per Code in `src/assets/placeholders.ts`.
- Alle Tests aus M1/M2 laufen weiter. Angepasst werden sie nur, wo sich eine Signatur ändert (`new BuildTool(grid, cash)`).
- Commit-Nachrichten auf Deutsch mit Präfix `M3:` und den Attributionszeilen der Sitzung.

## Review Focus

1. **Gebäude am Rand, Grundfläche teils außerhalb** → komplett rot, Klick baut nichts, Kasse unverändert. → Task 3 (`Grundfläche teils außerhalb ist blocked`), Task 4 (`Klick am Rand baut nichts`).
2. **R drücken, ohne die Maus zu bewegen** → Vorschau dreht sich sofort mit (Benachrichtigung auch ohne Ziehen). → Task 4 (`R im Gebäude-Modus dreht und meldet sofort`).
3. **Abriss-Ziehen berührt dasselbe Gebäude mehrfach und ein zweites Gebäude** → beide verschwinden vollständig, jedes wird genau einmal erstattet. → Task 4 (`Abriss erstattet jedes Gebäude genau einmal`).
4. **Weg hinter einem stehenden Gebäude wird später gebaut oder abgerissen** → „beliefert“ wechselt sofort; Weg unter einem Personal-Tor zählt, Tor ohne Weg nicht. → Task 3 (`isDelivered folgt dem Weg`), Task 6 (Warnsymbole bei jeder Grid-Änderung neu bewerten).
5. **Entf im Gebäude-Modus und zurück** → dasselbe Gebäude mit derselben Richtung ist wieder gewählt. → Task 4 (`Entf kehrt zum gewählten Gebäude zurück`).

---

### Task 1: Katalog und Kasse

**Files:**
- Create: `src/building/catalog.ts`, `src/economy/cash.ts`
- Modify: `src/config.ts` (Konstante `START_CASH = 10000`)
- Test: `tests/catalog.test.ts`, `tests/cash.test.ts`

**Interfaces:**
- Produces (`src/building/catalog.ts`):
  - `export type BuildingType = 'stage' | 'beer' | 'fries' | 'bratwurst' | 'pizza' | 'merch' | 'toilet';`
  - `export type BuildingCategory = 'stages' | 'stalls' | 'sanitary';`
  - `export interface BuildingSpec { type: BuildingType; name: string; category: BuildingCategory; width: number; depth: number; price: number; color: number }` (`width`/`depth` gelten bei Rückseite oben; `color` = Platzhalter-Grundfarbe)
  - `export const BUILDING_TYPES: readonly BuildingType[]` in Menü-Reihenfolge: `stage, beer, fries, bratwurst, pizza, merch, toilet`
  - `export const CATALOG: Readonly<Record<BuildingType, BuildingSpec>>`
  - Namen: `Bühne`, `Bierstand`, `Pommes`, `Bratwurst`, `Pizza`, `Merch-Stand`, `Dixi-Klo`
- Produces (`src/economy/cash.ts`):
  - `export class Cash { constructor(start: number); get balance(): number; canAfford(amount: number): boolean; spend(amount: number): boolean; refund(amount: number): void; onChange(listener: (balance: number) => void): () => void }`
  - `spend` zieht nur ab, wenn genug da ist (sonst `false`, keine Änderung, keine Meldung). `refund` addiert. Listener nur bei echter Änderung.

- [ ] **Step 1: Failing tests schreiben**

```ts
// tests/catalog.test.ts
it('enthält genau die sieben Gebäude mit Größe und Preis aus dem Design', () => {
  expect(BUILDING_TYPES).toEqual(['stage', 'beer', 'fries', 'bratwurst', 'pizza', 'merch', 'toilet']);
  const pick = (t: BuildingType) => { const s = CATALOG[t]; return [s.name, s.category, s.width, s.depth, s.price]; };
  expect(pick('stage')).toEqual(['Bühne', 'stages', 6, 4, 4000]);
  expect(pick('beer')).toEqual(['Bierstand', 'stalls', 3, 2, 600]);
  expect(pick('fries')).toEqual(['Pommes', 'stalls', 3, 2, 400]);
  expect(pick('bratwurst')).toEqual(['Bratwurst', 'stalls', 3, 2, 400]);
  expect(pick('pizza')).toEqual(['Pizza', 'stalls', 3, 2, 500]);
  expect(pick('merch')).toEqual(['Merch-Stand', 'stalls', 3, 2, 500]);
  expect(pick('toilet')).toEqual(['Dixi-Klo', 'sanitary', 1, 1, 150]);
});
it('jede Art hat ihre eigene Platzhalterfarbe', () => {
  expect(new Set(BUILDING_TYPES.map((t) => CATALOG[t].color)).size).toBe(7);
});

// tests/cash.test.ts
it('startet mit dem Startbetrag', () => expect(new Cash(START_CASH).balance).toBe(10000));
it('spend zieht ab, wenn genug da ist', () => { const c = new Cash(1000); expect(c.spend(600)).toBe(true); expect(c.balance).toBe(400); });
it('spend bei zu wenig Geld ändert nichts', () => {
  const c = new Cash(500); const l = vi.fn(); c.onChange(l);
  expect(c.spend(600)).toBe(false); expect(c.balance).toBe(500); expect(l).not.toHaveBeenCalled();
});
it('genau passender Betrag geht auf 0', () => { const c = new Cash(600); expect(c.spend(600)).toBe(true); expect(c.balance).toBe(0); });
it('refund addiert und meldet', () => { const c = new Cash(0); const l = vi.fn(); c.onChange(l); c.refund(150); expect(c.balance).toBe(150); expect(l).toHaveBeenCalledWith(150); });
it('canAfford', () => { const c = new Cash(400); expect(c.canAfford(400)).toBe(true); expect(c.canAfford(401)).toBe(false); });
```

- [ ] **Step 2: Tests laufen lassen, sie schlagen fehl** – `npx vitest run tests/catalog.test.ts tests/cash.test.ts` → FAIL (Module fehlen).
- [ ] **Step 3: `catalog.ts`, `cash.ts` und `START_CASH` umsetzen.** Farben warm und deutlich unterschiedlich, als Konstanten im Katalog (nicht in `COLORS`).
- [ ] **Step 4: Tests laufen lassen** – `npm test` → alles PASS.
- [ ] **Step 5: Commit** – `git add src/building/catalog.ts src/economy/cash.ts src/config.ts tests/catalog.test.ts tests/cash.test.ts && git commit -m "M3: Gebäude-Katalog und Kasse"`

---

### Task 2: Gebäude-Ebene im `Grid`

**Files:**
- Modify: `src/building/grid.ts`
- Test: `tests/grid.test.ts` (ergänzen)

**Interfaces:**
- Consumes: `BuildingType` (Task 1, nur als `import type`)
- Produces (`src/building/grid.ts`):
  - `export type Facing = 'N' | 'E' | 'S' | 'W';` – Richtung, in die die **Rückseite** zeigt (`'N'` = oben).
  - `export interface Building { readonly id: number; readonly type: BuildingType; readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly facing: Facing; readonly paidPrice: number }` (`x`/`y` = linke obere Ecke; `width`/`height` = tatsächliche Ausdehnung auf der Karte, also schon gedreht)
  - `Grid.addBuilding(b: Omit<Building, 'id'>): Building` – vergibt Kennnummern ab 1 aufsteigend, nie wiederverwendet; wirft `Error`, wenn ein Feld außerhalb liegt oder schon zu einem Gebäude gehört (Programmierfehler, die Bauregel prüft vorher). Meldet die Grundfläche einmal an die `onChange`-Listener.
  - `Grid.removeBuilding(id: number): Building | null` – gibt die Grundfläche frei, meldet sie einmal; unbekannte Kennnummer → `null`, keine Meldung.
  - `Grid.buildingAt(x: number, y: number): Building | null` (außerhalb → `null`)
  - `Grid.buildings(): Building[]` – alle Gebäude, nach Kennnummer sortiert.
  - `apply`, `clear` und `applyPath` lassen Gebäude unberührt.

- [ ] **Step 1: Failing tests ergänzen**

```ts
describe('Grid – Gebäude', () => {
  const beer = { type: 'beer', x: 2, y: 3, width: 3, height: 2, facing: 'N', paidPrice: 600 } as const;
  it('addBuilding belegt die Grundfläche und vergibt Kennnummern', () => {
    const g = new Grid(10, 10);
    const a = g.addBuilding(beer);
    expect(a.id).toBe(1);
    expect(g.buildingAt(2, 3)).toBe(a);
    expect(g.buildingAt(4, 4)).toBe(a);
    expect(g.buildingAt(5, 3)).toBeNull();
    expect(g.addBuilding({ ...beer, x: 6 }).id).toBe(2);
    expect(g.buildings().map((b) => b.id)).toEqual([1, 2]);
  });
  it('meldet die Grundfläche einmal', () => {
    const g = new Grid(10, 10); const l = vi.fn(); g.onChange(l);
    g.addBuilding(beer);
    expect(l).toHaveBeenCalledTimes(1);
    expect(l.mock.calls[0][0]).toHaveLength(6);
  });
  it('wirft bei Überlappung oder außerhalb', () => {
    const g = new Grid(10, 10); g.addBuilding(beer);
    expect(() => g.addBuilding({ ...beer, x: 4 })).toThrow();
    expect(() => g.addBuilding({ ...beer, x: 8 })).toThrow();
  });
  it('removeBuilding gibt frei, Kennnummern werden nicht wiederverwendet', () => {
    const g = new Grid(10, 10); const a = g.addBuilding(beer);
    expect(g.removeBuilding(a.id)).toEqual(a);
    expect(g.buildingAt(2, 3)).toBeNull();
    expect(g.removeBuilding(a.id)).toBeNull();
    expect(g.addBuilding(beer).id).toBe(2);
  });
  it('clear lässt Gebäude stehen', () => {
    const g = new Grid(10, 10); g.addBuilding(beer);
    g.clear([{ x: 2, y: 3 }]);
    expect(g.buildingAt(2, 3)).not.toBeNull();
  });
});
```

- [ ] **Step 2: Tests laufen lassen** – `npx vitest run tests/grid.test.ts` → neue Tests FAIL.
- [ ] **Step 3: Umsetzen.** Belegung als `Uint16Array` (0 = frei), Gebäude in einer `Map<number, Building>`; das Melden nutzt dieselben Listener wie `apply`.
- [ ] **Step 4: `npm test`** → alles PASS.
- [ ] **Step 5: Commit** – `git commit -am "M3: Gebäude-Ebene im Grundstücksmodell"`

---

### Task 3: Platzierung, Lieferseite und Bauregeln

**Files:**
- Create: `src/building/placement.ts`
- Modify: `src/building/rules.ts` (Weg, Zaun, Schleuse, Tor auf Gebäudefeldern → `'blocked'`)
- Test: `tests/placement.test.ts`, `tests/rules.test.ts` (ergänzen)

**Interfaces:**
- Consumes: `Grid`, `Building`, `Facing`, `Cell` (Task 2); `CATALOG`, `BuildingType` (Task 1)
- Produces (`src/building/placement.ts`):
  - `export interface Rect { x: number; y: number; width: number; height: number }`
  - `export function rotateFacing(facing: Facing): Facing` – im Uhrzeigersinn N → E → S → W → N
  - `export function footprint(type: BuildingType, facing: Facing, center: Cell): Rect` – bei `N`/`S` gilt `width = spec.width`, `height = spec.depth`, bei `E`/`W` sind die Werte getauscht; `x = center.x - Math.floor((width - 1) / 2)`, `y = center.y - Math.floor((height - 1) / 2)`
  - `export function rectCells(r: Rect): Cell[]` – zeilenweise, oben links zuerst
  - `export function backCells(r: Rect, facing: Facing): Cell[]` – die Reihe bzw. Spalte direkt außerhalb der Rückseite, über die ganze Breite; darf außerhalb des Grundstücks liegen
  - `export function isDelivered(grid: Grid, b: Building): boolean` – mindestens ein `backCells`-Feld ist Weg (`grid.isPath`)
  - `export type PlacementVerdict = 'ok' | 'blocked' | 'tooExpensive';`
  - `export function placementVerdict(grid: Grid, r: Rect, price: number, balance: number): PlacementVerdict` – `'blocked'`, wenn ein Feld außerhalb liegt, Weg ist, `structureAt !== 'none'` hat oder zu einem Gebäude gehört; sonst `'tooExpensive'`, wenn `price > balance`; sonst `'ok'`. „Belegt“ geht vor „zu teuer“.

- [ ] **Step 1: Failing tests schreiben**

```ts
// tests/placement.test.ts
it('rotateFacing dreht im Uhrzeigersinn', () => {
  expect(['N', 'E', 'S', 'W'].map((f) => rotateFacing(f as Facing))).toEqual(['E', 'S', 'W', 'N']);
});
it('footprint: Maus auf der Mitte, gedreht tauschen Breite und Tiefe', () => {
  expect(footprint('beer', 'N', { x: 5, y: 5 })).toEqual({ x: 4, y: 5, width: 3, height: 2 });
  expect(footprint('beer', 'E', { x: 5, y: 5 })).toEqual({ x: 5, y: 4, width: 2, height: 3 });
  expect(footprint('stage', 'N', { x: 10, y: 10 })).toEqual({ x: 8, y: 9, width: 6, height: 4 });
  expect(footprint('stage', 'W', { x: 10, y: 10 })).toEqual({ x: 9, y: 8, width: 4, height: 6 });
  expect(footprint('toilet', 'S', { x: 5, y: 5 })).toEqual({ x: 5, y: 5, width: 1, height: 1 });
});
it('backCells liegt direkt hinter der Rückseite', () => {
  expect(backCells({ x: 4, y: 5, width: 3, height: 2 }, 'N')).toEqual([{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }]);
  expect(backCells({ x: 4, y: 5, width: 3, height: 2 }, 'S')).toEqual([{ x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }]);
  expect(backCells({ x: 4, y: 5, width: 2, height: 3 }, 'E')).toEqual([{ x: 6, y: 5 }, { x: 6, y: 6 }, { x: 6, y: 7 }]);
  expect(backCells({ x: 4, y: 5, width: 2, height: 3 }, 'W')).toEqual([{ x: 3, y: 5 }, { x: 3, y: 6 }, { x: 3, y: 7 }]);
});
it('isDelivered folgt dem Weg (Weg unter Personal-Tor zählt, Tor ohne Weg nicht)', () => {
  const g = new Grid(10, 10);
  const b = g.addBuilding({ type: 'beer', x: 4, y: 5, width: 3, height: 2, facing: 'N', paidPrice: 600 });
  expect(isDelivered(g, b)).toBe(false);
  g.apply([{ x: 6, y: 4, structure: 'staffGate', orientation: 'horizontal' }]);
  expect(isDelivered(g, b)).toBe(false);
  g.apply([{ x: 6, y: 4, path: true }]);
  expect(isDelivered(g, b)).toBe(true);
  g.clear([{ x: 6, y: 4 }]);
  expect(isDelivered(g, b)).toBe(false);
  g.applyPath([{ x: 5, y: 7 }], true); // Weg vorne zählt nicht
  expect(isDelivered(g, b)).toBe(false);
});
it('Gebäude an der Rückseite des Grundstücks ist nie beliefert, ohne Fehler', () => {
  const g = new Grid(10, 10);
  const b = g.addBuilding({ type: 'beer', x: 0, y: 0, width: 3, height: 2, facing: 'N', paidPrice: 600 });
  expect(isDelivered(g, b)).toBe(false);
});
describe('placementVerdict', () => {
  const r = { x: 2, y: 2, width: 3, height: 2 };
  it('freie Wiese und genug Geld → ok', () => expect(placementVerdict(new Grid(10, 10), r, 600, 600)).toBe('ok'));
  it('zu wenig Geld → tooExpensive', () => expect(placementVerdict(new Grid(10, 10), r, 600, 599)).toBe('tooExpensive'));
  it('Grundfläche teils außerhalb ist blocked', () =>
    expect(placementVerdict(new Grid(10, 10), { ...r, x: 8 }, 600, 10000)).toBe('blocked'));
  it('Weg, Zaun, Durchgang oder Gebäude auf einem Feld → blocked, auch wenn zu teuer', () => {
    for (const setup of [
      (g: Grid) => g.applyPath([{ x: 4, y: 3 }], true),
      (g: Grid) => g.apply([{ x: 4, y: 3, structure: 'fence' }]),
      (g: Grid) => g.apply([{ x: 4, y: 3, structure: 'visitorGate', orientation: 'vertical' }]),
      (g: Grid) => g.addBuilding({ type: 'toilet', x: 4, y: 3, width: 1, height: 1, facing: 'N', paidPrice: 150 }),
    ]) {
      const g = new Grid(10, 10); setup(g);
      expect(placementVerdict(g, r, 600, 0)).toBe('blocked');
    }
  });
});

// tests/rules.test.ts (ergänzen)
it('Weg, Zaun, Schleuse und Tor sind auf Gebäudefeldern nicht erlaubt', () => {
  const g = new Grid(10, 10);
  g.apply([{ x: 2, y: 5, structure: 'fence' }, { x: 4, y: 5, structure: 'fence' }]);
  g.addBuilding({ type: 'toilet', x: 3, y: 5, width: 1, height: 1, facing: 'N', paidPrice: 150 });
  for (const kind of ['path', 'fence', 'visitorGate', 'staffGate'] as const) expect(verdict(g, kind, 3, 5)).toBe('blocked');
});
```

- [ ] **Step 2: Tests laufen lassen** – `npx vitest run tests/placement.test.ts tests/rules.test.ts` → FAIL.
- [ ] **Step 3: `placement.ts` umsetzen; in `rules.ts` direkt nach der `inBounds`-Prüfung `if (grid.buildingAt(x, y)) return 'blocked';`.**
- [ ] **Step 4: `npm test`** → alles PASS.
- [ ] **Step 5: Commit** – `git commit -m "M3: Grundfläche, Lieferseite und Bauregel für Gebäude"` (neue Dateien vorher mit `git add`)

---

### Task 4: Gebäude-Modus im `BuildTool`

**Files:**
- Modify: `src/building/buildTool.ts`
- Test: `tests/buildTool.test.ts` (ergänzen; `setup()` erzeugt jetzt `new BuildTool(grid, new Cash(10000))`)

**Interfaces:**
- Consumes: `Cash` (Task 1), `Grid.addBuilding/removeBuilding/buildingAt` (Task 2), `footprint`, `rectCells`, `backCells`, `rotateFacing`, `placementVerdict`, `Rect`, `PlacementVerdict` (Task 3), `CATALOG`, `BuildingType` (Task 1)
- Produces (`src/building/buildTool.ts`):
  - `export type ToolMode = 'view' | 'path' | 'fence' | 'visitorGate' | 'staffGate' | 'building' | 'demolish';`
  - `constructor(grid: Grid, cash: Cash)`
  - `get buildingType(): BuildingType | null` · `get facing(): Facing` (Start `'N'`)
  - `selectBuilding(type: BuildingType): void` – wechselt in `'building'` mit dieser Art (bricht Ziehen ab, meldet); die Richtung bleibt erhalten.
  - `setMode('building')` ohne vorher gewählte Art tut nichts.
  - `rotate()` – im Gebäude-Modus `facing = rotateFacing(facing)` und **immer** melden; sonst wie bisher (Ecke der L-Form; die Ecken-Einstellung und die Gebäuderichtung sind getrennt).
  - `Preview` wird zur Union:
    ```ts
    export type Preview =
      | { kind: 'build' | 'demolish'; cells: Cell[]; blocked: Cell[] }
      | { kind: 'building'; type: BuildingType; facing: Facing; rect: Rect; cells: Cell[]; blocked: Cell[]; back: Cell[]; verdict: PlacementVerdict };
    ```
    Bei `'building'`: Maus außerhalb → `null`; `verdict === 'ok'` → `cells` = Grundfläche, `blocked = []`; sonst `cells = []`, `blocked` = Grundfläche; `back` = `backCells` innerhalb des Grundstücks. Nur Felder innerhalb des Grundstücks erscheinen in `cells`/`blocked`.
  - Gebäude-Modus: `pointerDown` merkt sich den Druck wie bisher; `pointerUp` baut an der **aktuellen** Mausposition, wenn `verdict === 'ok'`: `cash.spend(price)`, dann `grid.addBuilding({ ..., paidPrice: price })`; liefert die Grundfläche bzw. `[]`.
  - Abreißen: Vorschau-`cells` = L-Felder, danach die übrigen Felder aller berührten Gebäude (ohne Doppelte). `pointerUp` entfernt jedes berührte Gebäude genau einmal, erstattet jeweils `paidPrice` über `cash.refund` und räumt dann die L-Felder mit `grid.clear`.

- [ ] **Step 1: Failing tests ergänzen**

```ts
describe('BuildTool – Gebäude', () => {
  const setupCash = (balance = 10000) => {
    const grid = new Grid(20, 20); const cash = new Cash(balance);
    return { grid, cash, tool: new BuildTool(grid, cash) };
  };
  const click = (tool: BuildTool, x: number, y: number) => { tool.pointerMove({ x, y }); tool.pointerDown({ x, y }); return tool.pointerUp(); };

  it('Klick stellt den Bierstand hin und bucht ab; Werkzeug bleibt aktiv', () => {
    const { grid, cash, tool } = setupCash();
    tool.selectBuilding('beer');
    expect(click(tool, 5, 5)).toHaveLength(6);
    expect(grid.buildingAt(4, 5)).toMatchObject({ type: 'beer', x: 4, y: 5, width: 3, height: 2, facing: 'N', paidPrice: 600 });
    expect(cash.balance).toBe(9400);
    expect(tool.mode).toBe('building');
    expect(tool.buildingType).toBe('beer');
  });
  it('Vorschau zeigt Grundfläche, Rückseite und Urteil', () => {
    const { tool } = setupCash();
    tool.selectBuilding('beer');
    tool.pointerMove({ x: 5, y: 5 });
    expect(tool.preview).toMatchObject({ kind: 'building', verdict: 'ok', blocked: [], back: [{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }] });
    expect((tool.preview as { cells: unknown[] }).cells).toHaveLength(6);
  });
  it('R im Gebäude-Modus dreht und meldet sofort', () => {
    const { grid, tool } = setupCash(); const l = vi.fn();
    tool.selectBuilding('beer'); tool.pointerMove({ x: 5, y: 5 }); tool.onChange(l);
    tool.rotate();
    expect(l).toHaveBeenCalledTimes(1);
    expect(tool.facing).toBe('E');
    expect(tool.preview).toMatchObject({ rect: { x: 5, y: 4, width: 2, height: 3 } });
    click(tool, 5, 5);
    expect(grid.buildingAt(5, 4)).toMatchObject({ facing: 'E', width: 2, height: 3 });
  });
  it('Klick am Rand baut nichts', () => {
    const { grid, cash, tool } = setupCash();
    tool.selectBuilding('stage');
    expect(click(tool, 0, 0)).toEqual([]);
    expect(grid.buildings()).toEqual([]);
    expect(cash.balance).toBe(10000);
    tool.pointerMove({ x: 0, y: 0 });
    expect(tool.preview).toMatchObject({ verdict: 'blocked', cells: [] });
  });
  it('zu teuer: rot, nichts gebaut', () => {
    const { grid, cash, tool } = setupCash(3999);
    tool.selectBuilding('stage');
    expect(click(tool, 10, 10)).toEqual([]);
    expect(grid.buildings()).toEqual([]);
    expect(cash.balance).toBe(3999);
  });
  it('Abriss erstattet jedes Gebäude genau einmal und entfernt es ganz', () => {
    const { grid, cash, tool } = setupCash();
    tool.selectBuilding('beer'); click(tool, 5, 5);         // belegt 4..6 / 5..6
    tool.selectBuilding('toilet'); click(tool, 8, 5);
    grid.applyPath([{ x: 7, y: 5 }], true);
    expect(cash.balance).toBe(10000 - 600 - 150);
    tool.setMode('demolish');
    tool.pointerDown({ x: 5, y: 5 }); tool.pointerMove({ x: 8, y: 5 });
    expect((tool.preview as { cells: unknown[] }).cells).toHaveLength(4 + 4); // L-Felder (5..8, 5) plus die vier übrigen Bierstand-Felder
    tool.pointerUp();
    expect(grid.buildings()).toEqual([]);
    expect(grid.isPath(7, 5)).toBe(false);
    expect(cash.balance).toBe(10000);
  });
  it('Entf kehrt zum gewählten Gebäude mit derselben Richtung zurück', () => {
    const { tool } = setupCash();
    tool.selectBuilding('pizza'); tool.rotate();
    tool.toggleDemolish(); tool.toggleDemolish();
    expect([tool.mode, tool.buildingType, tool.facing]).toEqual(['building', 'pizza', 'E']);
  });
  it('setMode("building") ohne gewählte Art tut nichts', () => {
    const { tool } = setupCash();
    tool.setMode('building');
    expect(tool.mode).toBe('view');
  });
  it('Weg wird über ein Gebäude nicht gebaut', () => {
    const { grid, tool } = setupCash();
    tool.selectBuilding('toilet'); click(tool, 3, 0);
    tool.setMode('path'); tool.pointerDown({ x: 0, y: 0 }); tool.pointerMove({ x: 5, y: 0 });
    expect(tool.preview).toMatchObject({ blocked: [{ x: 3, y: 0 }] });
    tool.pointerUp();
    expect(grid.isPath(3, 0)).toBe(false);
    expect(grid.isPath(5, 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Tests laufen lassen** – `npx vitest run tests/buildTool.test.ts` → neue Tests FAIL (bestehende nach Anpassung von `setup()` grün).
- [ ] **Step 3: Umsetzen** wie in „Interfaces“ beschrieben. `buildKind()` liefert für `'building'` weiterhin `null`; Gebäude-Modus und Abriss bekommen eigene Zweige in `preview` und `pointerUp`. Die Vorschau wird mit **derselben** `placementVerdict`-Prüfung berechnet wie das Bauen.
- [ ] **Step 4: `npm test`** → alles PASS; `npm run typecheck` → keine Fehler (`WorldScene` übergibt vorerst `new Cash(START_CASH)` an `BuildTool`, siehe Task 6; bis dahin dort minimal anpassen, damit der Typcheck grün ist).
- [ ] **Step 5: Commit** – `git commit -am "M3: Gebäude-Modus, Drehen und Abriss mit Erstattung im Bau-Werkzeug"`

---

### Task 5: Menü-Daten, Hinweise und Geldformat

**Files:**
- Create: `src/ui/menu.ts`, `src/ui/format.ts`
- Modify: `src/ui/hints.ts`
- Test: `tests/menu.test.ts`, `tests/format.test.ts`, `tests/hints.test.ts`

**Interfaces:**
- Consumes: `ToolMode` (Task 4), `BuildingType`, `CATALOG`, `BUILDING_TYPES` (Task 1), `PlacementVerdict` (Task 3)
- Produces:
  - `src/ui/format.ts`: `export function formatMoney(amount: number): string` – Tausender mit Leerzeichen, dann ` €`.
  - `src/ui/menu.ts`:
    - `export type MenuCategory = 'view' | 'paths' | 'stages' | 'stalls' | 'sanitary' | 'demolish';`
    - `export const MAIN_MENU: ReadonlyArray<{ category: MenuCategory; label: string }>` – Labels `Ansehen`, `Wege & Zäune`, `Bühnen`, `Stände`, `Sanitär`, `Abreißen`
    - `export type MenuAction = { kind: 'mode'; mode: Exclude<ToolMode, 'building'> } | { kind: 'building'; type: BuildingType };`
    - `export interface MenuEntry { label: string; price: number | null; action: MenuAction }`
    - `export function subMenu(category: MenuCategory): MenuEntry[]` – `view`/`demolish` → `[]`; `paths` → Weg, Zaun, Schleuse, Tor (Preis `null`); Gebäude-Kategorien aus dem Katalog in `BUILDING_TYPES`-Reihenfolge.
    - `export function categoryOf(mode: ToolMode, buildingType: BuildingType | null): MenuCategory`
  - `src/ui/hints.ts`: `TOOL_LABELS`/`TOOL_HINTS` bekommen den Schlüssel `building` (`'Gebäude'` / `'Gebäude wählen'`), dazu `export function buildingHint(type: BuildingType, verdict: PlacementVerdict | null, balance: number): string`.

- [ ] **Step 1: Failing tests schreiben**

```ts
// tests/format.test.ts
it('formatMoney', () => {
  expect(formatMoney(0)).toBe('0 €');
  expect(formatMoney(600)).toBe('600 €');
  expect(formatMoney(10000)).toBe('10 000 €');
  expect(formatMoney(1234567)).toBe('1 234 567 €');
});

// tests/menu.test.ts
it('Hauptleiste in fester Reihenfolge', () => {
  expect(MAIN_MENU.map((m) => m.label)).toEqual(['Ansehen', 'Wege & Zäune', 'Bühnen', 'Stände', 'Sanitär', 'Abreißen']);
});
it('Unterleisten', () => {
  expect(subMenu('view')).toEqual([]);
  expect(subMenu('demolish')).toEqual([]);
  expect(subMenu('paths').map((e) => [e.label, e.price])).toEqual([['Weg', null], ['Zaun', null], ['Schleuse', null], ['Tor', null]]);
  expect(subMenu('stages').map((e) => [e.label, e.price])).toEqual([['Bühne', 4000]]);
  expect(subMenu('stalls').map((e) => e.label)).toEqual(['Bierstand', 'Pommes', 'Bratwurst', 'Pizza', 'Merch-Stand']);
  expect(subMenu('sanitary')[0]).toEqual({ label: 'Dixi-Klo', price: 150, action: { kind: 'building', type: 'toilet' } });
});
it('categoryOf', () => {
  expect(categoryOf('view', null)).toBe('view');
  expect(categoryOf('fence', null)).toBe('paths');
  expect(categoryOf('staffGate', 'beer')).toBe('paths');
  expect(categoryOf('building', 'beer')).toBe('stalls');
  expect(categoryOf('building', 'stage')).toBe('stages');
  expect(categoryOf('demolish', 'toilet')).toBe('demolish');
});

// tests/hints.test.ts
it('buildingHint', () => {
  expect(buildingHint('beer', 'ok', 10000)).toBe('Klick: Bierstand bauen (600 €) · R: drehen · Rechtsklick: Ansehen');
  expect(buildingHint('beer', null, 10000)).toBe('Klick: Bierstand bauen (600 €) · R: drehen · Rechtsklick: Ansehen');
  expect(buildingHint('beer', 'blocked', 10000)).toBe('Kein Platz für Bierstand · R: drehen · Rechtsklick: Ansehen');
  expect(buildingHint('stage', 'tooExpensive', 3500)).toBe('Zu teuer: Bühne kostet 4 000 €, Kasse: 3 500 €');
});
```

- [ ] **Step 2: Tests laufen lassen** → FAIL.
- [ ] **Step 3: Umsetzen.**
- [ ] **Step 4: `npm test`** → alles PASS.
- [ ] **Step 5: Commit** – `git commit -m "M3: Menü-Aufbau, Hinweise und Geldformat"` (neue Dateien mit `git add`)

---

### Task 6: Gebäude zeichnen (`WorldScene`, Platzhalter)

**Files:**
- Modify: `src/assets/placeholders.ts`, `src/scenes/WorldScene.ts`, `src/config.ts` (Farben für Warnsymbol und Rückseiten-Markierung)

**Interfaces:**
- Consumes: alles aus Task 1–4
- Produces:
  - `buildingTextureKey(type: BuildingType, facing: Facing): string` in `placeholders.ts`; `createPlaceholderTextures` erzeugt für jede Art und jede der vier Richtungen ein Bild in Kartengröße (`width × 16` mal `height × 16` Pixel, gedreht), dazu `TEXTURE_KEYS.deliveryWarning` (Warnsymbol, z. B. 9 × 9 rotes Schild mit weißem Lieferwagen oder „!“) und einen vierten Frame in `previewTiles` für die Rückseiten-Markierung.
  - `WorldScene` erzeugt `Cash(START_CASH)` und übergibt sie an `BuildTool` und an die `UIScene` (`this.scene.launch('UI', { tool, cash })`).

Darstellungsregeln:
- Jedes Bild zeigt vorne und hinten eindeutig, in allen vier Richtungen: hinten ein dunkler Streifen mit Lieferklappe, vorne Theke mit gestreifter Markise (Stände), Bühnenrand (Bühne) bzw. Tür (Klo). Die Grundfarbe kommt aus `CATALOG[type].color`; jede Art bekommt zusätzlich ein einfaches, aus Pixeln gezeichnetes Symbol (z. B. Krug, Pommestüte, Wurst, Pizzastück, T-Shirt), damit man die Stände unterscheiden kann.
- Zeichenreihenfolge über `setDepth`: Boden 0 · Wege 1 · Zäune/Durchgänge 2 · Gebäude 3 · Warnsymbole 4 · Raster 5 · Vorschau-Ebene 6 · Vorschau-Gebäude 7.
- Gebäude-Bilder werden in einer `Map<number, Image>` nach Kennnummer geführt. Bei **jeder** Grid-Meldung gleicht `syncBuildings()` die Map mit `grid.buildings()` ab (neue anlegen, verschwundene zerstören) und setzt für jedes Gebäude die Sichtbarkeit des Warnsymbols auf `!isDelivered(grid, b)`. Das Warnsymbol sitzt mittig über der Oberkante des Gebäudes.
- Vorschau im Gebäude-Modus: Grundfläche auf der Vorschau-Ebene (Frame 0 hell bzw. Frame 2 rot), Rückseiten-Felder mit dem neuen Frame 3, dazu ein halbdurchsichtiges Bild des Gebäudes in der gewählten Richtung (`alpha` ≈ 0,6, bei nicht erlaubt rot eingefärbt mit `setTint`). Abriss- und Weg/Zaun-Vorschau bleiben wie bisher.

- [ ] **Step 1: Platzhalter und Zeichnen umsetzen.**
- [ ] **Step 2: `npm test && npm run build`** → alles grün, keine Typfehler.
- [ ] **Step 3: Kurze Sichtprüfung** – Dev-Server `npx vite --port 5173` und ein Playwright-Skript im Scratchpad: Seite lädt ohne Konsolenfehler, Wege und Zäune sehen aus wie vorher (Screenshot). Gebäude lassen sich erst mit dem Menü aus Task 7 bauen; die Prüfung der Gebäude-Bilder in allen vier Richtungen folgt dort.
- [ ] **Step 4: Commit** – `git commit -am "M3: Gebäude, Warnsymbol und Gebäude-Vorschau zeichnen"`

---

### Task 7: Bau-Menü und Kasse in der `UIScene`

**Files:**
- Modify: `src/scenes/UIScene.ts`

**Interfaces:**
- Consumes: `MAIN_MENU`, `subMenu`, `categoryOf`, `MenuEntry`, `MenuCategory` (Task 5), `formatMoney`, `buildingHint`, `TOOL_HINTS` (Task 5), `BuildTool` (Task 4), `Cash` (Task 1)
- `init(data: { tool: BuildTool; cash: Cash })`

Verhalten:
- **Hauptleiste** unten mittig mit den sechs Kategorien. Ansehen und Abreißen setzen sofort den Modus. Eine Kategorie mit Einträgen öffnet ihre **Unterleiste** direkt über der Hauptleiste. Ein Klick auf die schon offene Kategorie schließt sie wieder. Das Werkzeug ändert sich erst, wenn man einen Eintrag anklickt.
- Ändert sich das Werkzeug (auch über Esc, Entf oder Rechtsklick), dann gilt: Hat `categoryOf(tool.mode, tool.buildingType)` Einträge, ist genau diese Unterleiste offen, sonst ist keine offen.
- Hervorhebung: In der Hauptleiste die Kategorie des aktiven Werkzeugs, in der Unterleiste der aktive Eintrag. Gebäude-Einträge zeigen zwei Zeilen: Name und Preis (`formatMoney`).
- **Hinweis** über der obersten sichtbaren Leiste: Im Gebäude-Modus `buildingHint(type, preview?.verdict ?? null, cash.balance)`, sonst `TOOL_HINTS[mode]`. Er aktualisiert sich bei jeder Werkzeug- und Kassenänderung.
- **Kasse** oben rechts: `Kasse: ${formatMoney(balance)}` auf dunklem Hintergrund, aktualisiert über `cash.onChange`.
- `containsPoint` umfasst Hauptleiste, offene Unterleiste, Hinweis und Kassen-Anzeige. Ein Klick darauf baut nie in der Welt.
- Alles skaliert mit `computeZoom` wie bisher und passt bei 320 × 180 (Breite und Schriftgröße der Schaltflächen dürfen dafür kleiner werden als bei M2).
- Listener (`tool.onChange`, `cash.onChange`, Resize) werden beim `SHUTDOWN` abgemeldet.

- [ ] **Step 1: UIScene umbauen.**
- [ ] **Step 2: `npm test && npm run build`** → grün.
- [ ] **Step 3: Sichtprüfung im Browser** (Playwright-Skript im Scratchpad, Dev-Server `npx vite --port 5173`), jeweils mit Screenshot bei 1280 × 720 **und** 320 × 180 (Viewport):
  - Menü zeigt sechs Kategorien; „Stände“ öffnet fünf Einträge mit Preisen; Kasse zeigt „Kasse: 10 000 €“.
  - Bierstand wählen, in die Welt klicken → Stand steht, Kasse „9 400 €“, Warnsymbol sichtbar.
  - `R` drücken und erneut klicken → zweiter Stand in anderer Richtung, vorne/hinten erkennbar.
  - Weg mit „Wege & Zäune“ → „Weg“ hinter den ersten Stand ziehen → Warnsymbol verschwindet.
  - Bühne über einen Weg halten → Vorschau rot; Hinweis „Kein Platz für Bühne …“.
  - Abreißen über den Stand ziehen → Stand weg, Kasse steigt um 600 €.
  - Klick auf das Menü baut nichts darunter.
  - Keine Fehler in der Browser-Konsole.
- [ ] **Step 4: Commit** – `git commit -am "M3: Bau-Menü mit Unterleisten und Kassen-Anzeige"`

---

### Task 8: Abschluss

**Files:**
- Modify: `CLAUDE.md` (Projektstand: Zeile „M3 – Objekte platzieren | ✅ fertig (Pull Request; nach dem Merge auf GitHub Pages spielbar)“, darunter „M4 bis M10 | offen“), `src/building/README.md` und `src/ui/README.md` (kurz um Katalog, Platzierung, Menü ergänzen)

- [ ] **Step 1: Gesamtprüfung** – `npm ci && npm test && npm run build` → alles grün.
- [ ] **Step 2: Fertig-Kriterien aus dem Design, Abschnitt 8, einzeln abhaken** (Sichtprüfung aus Task 7 erneut, plus: Zaun, Schleuse, Tor, Wege und Kamera aus M1/M2 funktionieren weiter).
- [ ] **Step 3: Dokumente aktualisieren und committen** – `git commit -am "M3: Projektstand aktualisiert"`
- [ ] **Step 4: Pushen** – `git push -u origin claude/epic-cannon-1n6wry`. Den Pull Request erst nach Rückfrage beim Nutzer erstellen und ihm dann Schritt für Schritt erklären, wie er ihn prüft und merged.
