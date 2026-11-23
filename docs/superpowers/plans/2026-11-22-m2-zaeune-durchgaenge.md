# M2 – Geländebereiche: Zäune und Durchgänge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auf der Wiese aus M1 lassen sich Zäune (ganze Felder, L-Ziehen wie Wege), Besucher-Schleusen und Personal-Tore bauen und abreißen. Die Vorschau zeigt nicht erlaubte Felder rot, und Wege führen nur durch Tore durch einen Zaun.

**Architecture:** `Grid` bekommt neben der Boden-Ebene (Wiese/Weg) eine Bauten-Ebene (nichts/Zaun/Schleuse/Tor samt gespeicherter Ausrichtung). Die neue, Phaser-freie `rules.ts` entscheidet pro Feld und Bauart „bauen / nichts zu tun / nicht erlaubt“. `BuildTool` nutzt diese eine Regel für Vorschau und Bauen, damit beides nie auseinanderläuft. `WorldScene` zeichnet eine zusätzliche Tilemap-Ebene für Bauten, und `UIScene` bekommt sechs Schaltflächen.

**Tech Stack:** Phaser 3.90, TypeScript, Vite, Vitest (keine neuen Abhängigkeiten)

**Spec:** `docs/superpowers/specs/2026-11-22-m2-zaeune-durchgaenge-design.md`

## Global Constraints

- Keine neuen Abhängigkeiten in `package.json`.
- Module unter `src/building/` und `src/core/` importieren **kein** `phaser`.
- Feldkoordinaten (`Cell`) beziehen sich immer auf das Grundstück (0..63, 0..47), nie auf die Tilemap mit Rand (`BORDER_TILES`).
- Durchgänge sind **ein Feld breit**. Zäune und Durchgänge sind **kostenlos**.
- Alle sichtbaren Texte auf Deutsch. Platzhalter-Grafiken nur per Code in `src/assets/placeholders.ts`.
- Werkzeugleiste in genau dieser Reihenfolge: **Ansehen · Weg · Zaun · Schleuse · Tor · Abreißen**.
- Alle Tests aus M1 laufen weiter. Sie werden nur dort angepasst, wo sich die Form der Vorschau ändert (Feld `blocked`).
- Commit-Nachrichten auf Deutsch mit Präfix `M2:` und den Attributionszeilen der Sitzung.

## Review Focus

1. **Zaun neben einem Durchgang wird abgerissen** → Der Durchgang bleibt mit seiner gespeicherten Ausrichtung stehen und wird weiter richtig gezeichnet. → Task 1 (`clear` lässt Nachbarn unberührt), Task 3 (`Abriss neben Durchgang lässt ihn stehen`).
2. **Weg wird quer über einen Zaun gezogen** → Zaunfelder sind rot und bleiben Zaun, alle anderen Felder werden Weg, das Ergebnis entspricht der Vorschau. → Task 3 (`Weg über Zaun: Zaunfeld rot und übersprungen`).
3. **Durchgang auf Ecke, Zaunende, Kreuzung oder freiem Feld ohne Zaun** → nicht erlaubt (rot), es wird nichts gebaut. → Task 2 (Tests zu `placementOrientation`).
4. **Tor mit Weg darunter soll zur Schleuse werden** → nicht erlaubt, Tor und Weg bleiben. → Task 2 (`Schleuse auf Tor mit Weg ist nicht erlaubt`).
5. **Zaun wird über einen vorhandenen Durchgang gezogen** → Der Durchgang bleibt unverändert und ist nicht rot. → Task 2 (`Zaun über Durchgang: skip`), Task 3.

---

### Task 1: Bauten-Ebene im `Grid`

**Files:**
- Modify: `src/building/grid.ts`
- Test: `tests/grid.test.ts` (ergänzen, bestehende Tests bleiben)

**Interfaces:**
- Produces (`src/building/grid.ts`):
  - `export type Structure = 'none' | 'fence' | 'visitorGate' | 'staffGate';`
  - `export type Orientation = 'horizontal' | 'vertical';` (`horizontal` = Durchgang in einer waagrechten Zaunlinie, also mit Zaun links und rechts)
  - `export interface CellChange { x: number; y: number; path?: boolean; structure?: Structure; orientation?: Orientation }`
  - `Grid.structureAt(x: number, y: number): Structure` (außerhalb → `'none'`)
  - `Grid.gateOrientationAt(x: number, y: number): Orientation | null` (`null`, wenn kein Durchgang)
  - `Grid.isFenceLike(x: number, y: number): boolean` (Zaun oder Durchgang)
  - `Grid.apply(changes: readonly CellChange[]): Cell[]` – fehlende Felder in einer Änderung bleiben unverändert; ein Durchgang ohne `orientation` wirft einen `Error`; `'none'`/`'fence'` löschen die Ausrichtung; Felder außerhalb und Felder ohne tatsächliche Änderung werden übersprungen; Listener werden **einmal** mit den geänderten Feldern benachrichtigt (bei leerer Liste gar nicht).
  - `Grid.clear(cells: readonly Cell[]): Cell[]` – entfernt Weg und Bau (wie `apply` mit `path: false, structure: 'none'`).
  - `applyPath` bleibt erhalten und nutzt intern `apply`.
- Das `Grid` prüft **keine** Bauregeln, das macht `rules.ts` (Task 2).

- [ ] **Step 1: Failing tests ergänzen** (`tests/grid.test.ts`)

```ts
describe('Grid – Bauten', () => {
  it('startet ohne Bauten', () => {
    const g = new Grid(10, 10);
    expect(g.structureAt(0, 0)).toBe('none');
    expect(g.gateOrientationAt(0, 0)).toBeNull();
    expect(g.isFenceLike(0, 0)).toBe(false);
    expect(g.structureAt(-1, 0)).toBe('none');
  });
  it('apply setzt Zaun und Durchgang mit Ausrichtung', () => {
    const g = new Grid(10, 10);
    const changed = g.apply([
      { x: 1, y: 1, structure: 'fence' },
      { x: 2, y: 1, structure: 'staffGate', orientation: 'horizontal', path: true },
    ]);
    expect(changed).toEqual([{ x: 1, y: 1 }, { x: 2, y: 1 }]);
    expect(g.structureAt(2, 1)).toBe('staffGate');
    expect(g.gateOrientationAt(2, 1)).toBe('horizontal');
    expect(g.isPath(2, 1)).toBe(true);
    expect(g.isFenceLike(1, 1)).toBe(true);
    expect(g.gateOrientationAt(1, 1)).toBeNull();
  });
  it('Durchgang ohne Ausrichtung wirft', () => {
    expect(() => new Grid(5, 5).apply([{ x: 1, y: 1, structure: 'visitorGate' }])).toThrow();
  });
  it('apply überspringt Felder ohne Änderung und außerhalb, meldet einmal', () => {
    const g = new Grid(10, 10);
    g.apply([{ x: 1, y: 1, structure: 'fence' }]);
    const listener = vi.fn();
    g.onChange(listener);
    const changed = g.apply([{ x: 1, y: 1, structure: 'fence' }, { x: 20, y: 1, structure: 'fence' }, { x: 3, y: 3, structure: 'fence' }]);
    expect(changed).toEqual([{ x: 3, y: 3 }]);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith([{ x: 3, y: 3 }]);
  });
  it('clear entfernt Weg und Bau, lässt Nachbarn stehen', () => {
    const g = new Grid(10, 10);
    g.apply([
      { x: 1, y: 1, structure: 'fence' },
      { x: 2, y: 1, structure: 'visitorGate', orientation: 'horizontal' },
      { x: 3, y: 1, structure: 'fence' },
      { x: 5, y: 5, path: true },
    ]);
    expect(g.clear([{ x: 1, y: 1 }, { x: 5, y: 5 }, { x: 7, y: 7 }])).toEqual([{ x: 1, y: 1 }, { x: 5, y: 5 }]);
    expect(g.structureAt(1, 1)).toBe('none');
    expect(g.isPath(5, 5)).toBe(false);
    expect(g.structureAt(2, 1)).toBe('visitorGate');
    expect(g.gateOrientationAt(2, 1)).toBe('horizontal');
  });
});
```

- [ ] **Step 2: Tests laufen lassen, sie schlagen fehl**

Run: `npx vitest run tests/grid.test.ts`
Expected: FAIL (`apply`/`structureAt` ist keine Funktion)

- [ ] **Step 3: Bauten-Ebene implementieren** in `src/building/grid.ts`

Zweites `Uint8Array` `structure` mit Codes 0 = nichts, 1 = Zaun, 2 = Schleuse waagrecht, 3 = Schleuse senkrecht, 4 = Tor waagrecht, 5 = Tor senkrecht (Codes bleiben privat). `applyPath(cells, on)` ruft `apply(cells.map(c => ({ x: c.x, y: c.y, path: on })))` auf.

- [ ] **Step 4: Alle Tests laufen lassen**

Run: `npm test`
Expected: PASS (auch alle M1-Tests)

- [ ] **Step 5: Commit**

```bash
git add src/building/grid.ts tests/grid.test.ts
git commit -m "M2: Bauten-Ebene (Zaun, Schleuse, Tor) im Grundstücksmodell"
```

---

### Task 2: Bauregeln und Zaunstücke

**Files:**
- Create: `src/building/rules.ts`
- Modify: `src/building/autotile.ts`
- Test: `tests/rules.test.ts` (neu), `tests/autotile.test.ts` (ergänzen)

**Interfaces:**
- Consumes: `Grid`, `Structure`, `Orientation`, `CellChange` aus Task 1.
- Produces (`src/building/rules.ts`):
  - `export type BuildKind = 'path' | 'fence' | 'visitorGate' | 'staffGate';`
  - `export type Verdict = 'build' | 'skip' | 'blocked';`
  - `export function placementOrientation(grid: Grid, x: number, y: number): Orientation | null` – `'horizontal'`, wenn links **und** rechts `isFenceLike`; `'vertical'`, wenn oben **und** unten `isFenceLike`; `null`, wenn keins von beiden **oder beides** zutrifft.
  - `export function verdict(grid: Grid, kind: BuildKind, x: number, y: number): Verdict` – außerhalb → `'blocked'`, sonst nach dieser Tabelle (je Zeile zuerst `blocked` prüfen, dann `skip`; **Ausnahme `fence`:** dort zuerst `skip` prüfen, damit ein Zaun über einen Durchgang mit Weg nicht rot wird):

    | kind | `blocked` | `skip` | sonst |
    |---|---|---|---|
    | `path` | Bau ist `fence` oder `visitorGate` | schon Weg | `build` |
    | `fence` | Feld ist Weg | Bau ist Zaun oder Durchgang (geht vor) | `build` |
    | `visitorGate` | `placementOrientation` ist `null`; oder Feld ist Weg | Bau ist schon `visitorGate` | `build` |
    | `staffGate` | `placementOrientation` ist `null` | Bau ist schon `staffGate` | `build` |

  - `export function changeFor(grid: Grid, kind: BuildKind, x: number, y: number): CellChange` – `path` → `{ x, y, path: true }`; `fence` → `{ x, y, structure: 'fence' }`; Durchgang → `{ x, y, structure: kind, orientation: placementOrientation(...) }`. Nur aufrufen, wenn `verdict === 'build'`.
- Produces (`src/building/autotile.ts`):
  - `export function fenceMask(grid: Grid, x: number, y: number): number` – wie `pathMask` (DIR-Bits), zählt Nachbarn mit `isFenceLike`.

- [ ] **Step 1: Failing tests schreiben** (`tests/rules.test.ts`)

Hilfsfunktion im Test: `const fenceRow = (g, y, x0, x1)` setzt `fence` von `x0` bis `x1` per `g.apply`.

```ts
describe('placementOrientation', () => {
  it('waagrecht in gerader waagrechter Zaunlinie', () => { /* Zaun x=1..3, y=2 */ expect(placementOrientation(g, 2, 2)).toBe('horizontal'); });
  it('senkrecht in senkrechter Linie', () => { /* Zaun x=2, y=1..3 */ expect(placementOrientation(g, 2, 2)).toBe('vertical'); });
  it('in Zaunlücke auf Wiese', () => { /* Zaun (1,2) und (3,2), (2,2) frei */ expect(placementOrientation(g, 2, 2)).toBe('horizontal'); });
  it('zwischen Zaun und Durchgang erlaubt', () => { /* (1,2) Zaun, (3,2) visitorGate horizontal */ expect(placementOrientation(g, 2, 2)).toBe('horizontal'); });
  it('null an Ecke, Ende, Kreuzung und ohne Zaun', () => {
    // Ecke: Zaun (1,2),(2,2),(2,3) → (2,2) null
    // Ende: Zaun (1,2),(2,2) → (2,2) null
    // Kreuzung: Zaun links, rechts, oben, unten von (2,2) → null
    // leere Wiese → null
  });
});
describe('verdict', () => {
  it('Weg: Zaun und Schleuse blockieren, Tor ohne Weg erlaubt', () => {
    // (1,1) fence, (2,1) visitorGate, (3,1) staffGate ohne Weg, (4,1) Weg, (5,1) Wiese
    expect([1, 2, 3, 4, 5].map((x) => verdict(g, 'path', x, 1))).toEqual(['blocked', 'blocked', 'build', 'skip', 'build']);
  });
  it('Zaun: Weg blockiert, Zaun über Durchgang: skip', () => {
    // (1,1) Weg, (2,1) fence, (3,1) visitorGate, (4,1) staffGate mit Weg, (5,1) Wiese
    expect([1, 2, 3, 4, 5].map((x) => verdict(g, 'fence', x, 1))).toEqual(['blocked', 'skip', 'skip', 'skip', 'build']);
  });
  it('Schleuse auf Tor mit Weg ist nicht erlaubt, auf Tor ohne Weg schon', () => { /* beide in gerader Zaunlinie */ });
  it('Tor auf Weg in Zaunlücke erlaubt, auf Weg ohne Zaun nicht', () => { /* … */ });
  it('Durchgang derselben Art: skip', () => { expect(verdict(g, 'staffGate', 2, 2)).toBe('skip'); });
  it('außerhalb: blocked', () => { expect(verdict(g, 'fence', -1, 0)).toBe('blocked'); });
});
describe('changeFor', () => {
  it('Durchgang bekommt die Ausrichtung', () => {
    // Zaun x=2, y=1..3
    expect(changeFor(g, 'visitorGate', 2, 2)).toEqual({ x: 2, y: 2, structure: 'visitorGate', orientation: 'vertical' });
  });
});
```

Die Kommentare in den Tests oben beschreiben den Aufbau. Jeder Test baut sein eigenes `Grid(10, 10)`.

In `tests/autotile.test.ts` ergänzen:

```ts
it('fenceMask zählt Zaun und Durchgänge, keine Wege', () => {
  // (5,5) fence; (5,4) fence; (6,5) staffGate horizontal; (5,6) Weg; (4,5) Wiese
  expect(fenceMask(g, 5, 5)).toBe(DIR.N | DIR.E);
});
```

- [ ] **Step 2: Tests laufen lassen, sie schlagen fehl**

Run: `npx vitest run tests/rules.test.ts tests/autotile.test.ts`
Expected: FAIL (Modul `rules` nicht gefunden, `fenceMask` nicht exportiert)

- [ ] **Step 3: `rules.ts` und `fenceMask` implementieren**

`pathMask` und `fenceMask` teilen sich eine private Hilfsfunktion `neighbourMask(test: (x: number, y: number) => boolean, x, y)`.

- [ ] **Step 4: Alle Tests laufen lassen**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/building/rules.ts src/building/autotile.ts tests/rules.test.ts tests/autotile.test.ts
git commit -m "M2: Bauregeln für Weg, Zaun, Schleuse, Tor und Zaunstücke"
```

---

### Task 3: Bau-Werkzeug mit Zaun, Schleuse und Tor

**Files:**
- Modify: `src/building/buildTool.ts`, `src/ui/hints.ts` (Texte für die neuen Modi, siehe Step 3)
- Test: `tests/buildTool.test.ts` (ergänzen; bestehende `toEqual`-Vorschauen um `blocked: []` erweitern)

**Interfaces:**
- Consumes: `verdict`, `changeFor`, `BuildKind` (Task 2); `Grid.apply`, `Grid.clear` (Task 1).
- Produces (`src/building/buildTool.ts`):
  - `export type ToolMode = 'view' | 'path' | 'fence' | 'visitorGate' | 'staffGate' | 'demolish';`
  - `export interface Preview { kind: 'build' | 'demolish'; cells: Cell[]; blocked: Cell[] }` – bei `build` stehen in `cells` die Felder mit `build` oder `skip` (hell) und in `blocked` die nicht erlaubten (rot); bei `demolish` stehen alle Felder in `cells`, und `blocked` ist leer. Die Reihenfolge entspricht der L-Linie. `null`, wenn beide Listen leer sind oder der Modus `view` ist.
  - `path`, `fence`, `demolish`: L-Ziehen wie in M1. `visitorGate`, `staffGate`: Vorschau und Bauen betreffen immer nur das Feld unter der Maus, auch während gedrückter Taste. Gebaut wird beim Loslassen am zuletzt bekannten Feld.
  - `pointerUp()`: baut alle Felder mit `verdict === 'build'` in **einem** `grid.apply(...)`-Aufruf bzw. ruft bei `demolish` `grid.clear(cells)` auf; Rückgabe = geänderte Felder.
  - `toggleDemolish`, `rotate`, `cancel`, `setMode` verhalten sich wie bisher für alle Modi.

- [ ] **Step 1: Failing tests ergänzen**

```ts
it('Zaun wird in L-Form gezogen', () => {
  // setMode('fence'), down (0,0), move (2,1), up → structureAt (0,0),(1,0),(2,0),(2,1) = 'fence'
});
it('Weg über Zaun: Zaunfeld rot und übersprungen', () => {
  // Zaun (2,0); setMode('path'), down (0,0), move (4,0)
  expect(tool.preview).toEqual({ kind: 'build', cells: [{x:0,y:0},{x:1,y:0},{x:3,y:0},{x:4,y:0}], blocked: [{ x: 2, y: 0 }] });
  // up → isPath(2,0) false, structureAt(2,0) 'fence', isPath(4,0) true
});
it('Schleuse per Klick in geraden Zaun, auch nach Ziehen nur ein Feld', () => {
  // Zaun x=1..5, y=3; setMode('visitorGate'); down (2,3); move (4,3)
  expect(tool.preview).toEqual({ kind: 'build', cells: [{ x: 4, y: 3 }], blocked: [] });
  // up → structureAt(4,3) 'visitorGate', gateOrientationAt(4,3) 'horizontal', structureAt(2,3) 'fence'
});
it('Durchgang an Ecke: rot, nichts gebaut', () => {
  // Zaun (1,1),(2,1),(2,2); setMode('staffGate'); move (2,1)
  expect(tool.preview).toEqual({ kind: 'build', cells: [], blocked: [{ x: 2, y: 1 }] });
  // down/up (2,1) → [] und structureAt(2,1) 'fence'
});
it('Abreißen entfernt Weg, Zaun und Tor', () => {
  // (0,0) Weg, (1,0) Zaun, Tor mit Weg auf (2,1) zwischen Zaun (2,0)/(2,2); demolish von (0,0) nach (2,1)
  // → isPath(0,0) false, structureAt(1,0) 'none', structureAt(2,1) 'none', isPath(2,1) false
});
it('Abriss neben Durchgang lässt ihn stehen', () => {
  // Zaun (1,1), visitorGate (2,1) horizontal, Zaun (3,1); demolish Klick auf (1,1)
  // → structureAt(2,1) 'visitorGate', gateOrientationAt(2,1) 'horizontal'
});
it('Entf schaltet aus Zaun ins Abreißen und zurück', () => {
  // setMode('fence'); toggleDemolish → 'demolish'; toggleDemolish → 'fence'
});
```

- [ ] **Step 2: Tests laufen lassen, sie schlagen fehl**

Run: `npx vitest run tests/buildTool.test.ts`
Expected: FAIL (neue Modi unbekannt, `blocked` fehlt)

- [ ] **Step 3: `BuildTool` erweitern** in `src/building/buildTool.ts`

Modus → `BuildKind`: `path`→`path`, `fence`→`fence`, `visitorGate`→`visitorGate`, `staffGate`→`staffGate`. Vorschau und `pointerUp` rufen beide `verdict` auf derselben Feldliste auf. In `src/ui/hints.ts` die Einträge für die neuen Modi ergänzen (genaue Texte siehe Task 4, Step 3), damit `Record<ToolMode, string>` vollständig ist.

- [ ] **Step 4: Alle Tests und Typprüfung laufen lassen**

Run: `npm test && npm run typecheck`
Expected: PASS, keine Typfehler

- [ ] **Step 5: Commit**

```bash
git add src/building/buildTool.ts src/ui/hints.ts tests/buildTool.test.ts
git commit -m "M2: Bau-Werkzeug für Zaun, Schleuse und Tor mit roter Vorschau"
```

---

### Task 4: Darstellung – Grafiken, Bauten-Ebene, Werkzeugleiste

**Files:**
- Modify: `src/config.ts` (Farben), `src/assets/placeholders.ts`, `src/scenes/WorldScene.ts`, `src/scenes/UIScene.ts`

**Interfaces:**
- Consumes: `ToolMode`, `Preview` (Task 3); `structureAt`, `gateOrientationAt` (Task 1); `fenceMask` (Task 2).
- Produces:
  - `TEXTURE_KEYS.fenceTiles` (16 Kacheln, Index = `fenceMask`), `TEXTURE_KEYS.gateTiles` (4 Kacheln: 0 Schleuse waagrecht, 1 Schleuse senkrecht, 2 Tor waagrecht, 3 Tor senkrecht), `previewTiles` bekommt Kachel **2 = „nicht erlaubt“** (rot mit Kreuz, klar anders als die helle Bau-Vorschau).
  - GID-Bereiche in `WorldScene`: Boden 0–1, Wege 10–25, Vorschau 30–32, **Zaun 40–55**, **Durchgänge 60–63**.
  - Ebenen-Reihenfolge: Boden → Wege → **Bauten** → Raster → Vorschau. Durchgangs-Kacheln lassen in der Mitte Platz, sodass der Weg unter einem Tor sichtbar bleibt.

- [ ] **Step 1: Platzhalter zeichnen** in `src/assets/placeholders.ts`

Zaun: warmer Holzton (neue Farben `fencePost`, `fenceRail` in `COLORS`), Pfosten in der Mitte plus Latten zu jedem verbundenen Nachbarn. Schleuse und Tor: gut unterscheidbar (z. B. Schleuse mit gelben Drehkreuz-Pfosten, Tor mit rot-weißem Schlagbaum; neue Farben in `COLORS`), Mitte durchsichtig.

- [ ] **Step 2: Bauten-Ebene in `WorldScene`**

Neue Ebene `structures`. `redrawPaths` wird zu `redrawCells(changed)`: Für jedes geänderte Feld und seine vier Nachbarn werden Weg-Kachel und Bauten-Kachel neu gesetzt (Zaun → `40 + fenceMask`, Durchgang → `60 + (staffGate ? 2 : 0) + (vertical ? 1 : 0)`, nichts → entfernen). `redrawPreview` zeichnet `preview.cells` mit Kachel 0 (build) bzw. 1 (demolish) und `preview.blocked` mit Kachel 2.

- [ ] **Step 3: Werkzeugleiste**

`UIScene`: `MODES = ['view', 'path', 'fence', 'visitorGate', 'staffGate', 'demolish']`, sonst unverändertes Layout (passt bei 320 Spielpixeln Breite). Die Texte in `src/ui/hints.ts` (schon in Task 3 eingetragen) lauten genau:

```ts
TOOL_LABELS = { view: 'Ansehen', path: 'Weg', fence: 'Zaun', visitorGate: 'Schleuse', staffGate: 'Tor', demolish: 'Abreißen' };
TOOL_HINTS = {
  view: 'Ziehen: Kamera verschieben · Mausrad: Zoom · G: Raster',
  path: 'Ziehen: Weg bauen · R: Ecke drehen · Rechtsklick: Abbrechen',
  fence: 'Ziehen: Zaun bauen · R: Ecke drehen · Rechtsklick: Abbrechen',
  visitorGate: 'Klick in geraden Zaun: Schleuse für Gäste · Rechtsklick: Ansehen',
  staffGate: 'Klick in geraden Zaun: Tor für Personal und Lieferwagen (Weg darf durch) · Rechtsklick: Ansehen',
  demolish: 'Ziehen: alles abreißen · Entf: Abreißen aus · Rechtsklick: Abbrechen',
};
```

- [ ] **Step 4: Tests, Typprüfung, Build**

Run: `npm test && npm run build`
Expected: alle Tests PASS, Build ohne Fehler

- [ ] **Step 5: Browser-Check mit Playwright** (Skript im Scratchpad, nicht im Repo)

`npm run build && npx vite preview --port 4173` im Hintergrund, dann ein Playwright-Skript (Fenster 1280 × 720): „Spielen“ klicken, Werkzeug „Zaun“ wählen und eine L-Linie ziehen, „Schleuse“ in die Gerade klicken, „Weg“ quer durch den Zaun ziehen (Zaunfeld muss rot sein, Screenshot während des Ziehens), „Tor“ auf das Wegfeld in der Zaunlücke setzen, dann den Weg durch das Tor ziehen, zuletzt einen Rechtsklick ausführen. Prüfen: keine Fehler in der Browser-Konsole, Screenshots zeigen verbundene Zaunstücke, unterscheidbare Schleuse und Tor, Weg sichtbar unter dem Tor, alle sechs Schaltflächen lesbar. Zusätzlich ein Screenshot bei 640 × 360 (kleinstes Layout): Leiste passt ins Fenster.

- [ ] **Step 6: Commit**

```bash
git add src/config.ts src/assets/placeholders.ts src/scenes/WorldScene.ts src/scenes/UIScene.ts
git commit -m "M2: Zäune, Schleusen und Tore zeichnen, Werkzeugleiste mit sechs Werkzeugen"
```

---

### Task 5: Abschluss – Doku, Prüfung, Pull Request

**Files:**
- Modify: `CLAUDE.md` (Projektstand), `docs/superpowers/plans/2026-11-22-m2-zaeune-durchgaenge.md` (Häkchen)

- [ ] **Step 1: Projektstand** in `CLAUDE.md`: M2 → „✅ fertig (Pull Request; nach dem Merge auf GitHub Pages spielbar)“.
- [ ] **Step 2: Gesamtprüfung**

Run: `npm ci && npm test && npm run build`
Expected: alles grün

- [ ] **Step 3: Commit und Push** auf `claude/vigilant-davinci-nhroxw`.
- [ ] **Step 4: Pull Request** nach `main` erstellen (Titel „M2: Geländebereiche – Zäune, Schleusen und Tore“), Check-Workflow abwarten, dem Nutzer Schritt für Schritt erklären, wie er mergt und danach auf GitHub Pages testet.
