# M0 – Projekt-Grundgerüst Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lauffähiges Phaser-3-Grundgerüst (TypeScript, Vite, Vitest) mit fensterfüllender Wiesen-Startszene, das per GitHub Actions bei jedem Merge in `main` auf GitHub Pages erscheint und bei jedem Pull Request zur Probe gebaut wird.

**Architecture:** Schlankes, selbst aufgesetztes Vite-TS-Projekt. Reine Logik (Zoomberechnung) liegt Phaser-frei in eigenen Modulen und wird mit Vitest getestet; Phaser-Szenen (`BootScene` erzeugt Platzhalter-Texturen per Code, `TitleScene` zeigt Wiese + Titel) bauen darauf auf. Zwei Workflows: `check.yml` (PR) und `deploy.yml` (Push auf `main`).

**Tech Stack:** Phaser 3.90, TypeScript, Vite, Vitest, GitHub Actions, GitHub Pages, Node 22 (LTS)

**Spec:** `docs/superpowers/specs/2026-11-22-m0-grundgeruest-design.md`

## Global Constraints

- Phaser fest auf Major 3: `"phaser": "~3.90.0"` (kein Phaser 4).
- Vite `base: '/Festival-Tycoon/'` für den Build (exakte Groß-/Kleinschreibung); Asset-Pfade nie absolut ab `/`.
- `pixelArt: true`, Phaser-Skalierung `Phaser.Scale.RESIZE`, Kachelgröße 16 px, Vergrößerung nur um ganze Faktoren.
- Keine Telemetrie, keine Beispielszenen, keine Abhängigkeiten außer phaser, vite, typescript, vitest (+ deren Typen).
- `package-lock.json` wird committet; Workflows nutzen `npm ci` und Node 22.
- Alle Texte für den Nutzer (README, Spieltexte) auf Deutsch.
- Weitere Werkzeug-Versionen: neueste stabile, die zusammen ohne Peer-Konflikte installieren und mit Node 22 laufen.

## Review Focus

1. **Falscher Base-Pfad → leerer Bildschirm auf Pages.** Der gebaute Stand muss unter `/Festival-Tycoon/` vollständig laden (keine 404 auf JS/Assets). → Task 2, Step 6 (Browser-Check gegen `vite preview`).
2. **Fenstergröße ändert sich** (Fenster ziehen, Handy drehen) → Wiese bedeckt sofort die ganze neue Fläche, Titel bleibt mittig. → Task 2, Step 6.
3. **Fenstergröße 0 oder ungültig** (minimiertes Fenster, verstecktes Tab) → kein Absturz, Zoom 1. → Task 1, Test `computeZoom` Randfälle.
4. **Hochauflösende Bildschirme** (Handy, Claw) → Pixel bleiben scharf, nicht verwaschen. → Task 2 (`pixelArt: true`, CSS `image-rendering: pixelated` auf dem Canvas), Step 6 Screenshot-Sichtprüfung.
5. **Erster Deploy, bevor Pages auf „GitHub Actions“ steht** → Workflow schlägt mit klarer Meldung fehl; README nennt den einmaligen Schritt. → Task 3.

---

### Task 1: Projekt-Werkzeuge + Zoom-Logik

**Files:**
- Create: `package.json`, `package-lock.json` (per `npm install`), `tsconfig.json`, `vite.config.ts`, `.gitignore`
- Create: `src/config.ts`, `src/core/zoom.ts`, `src/vite-env.d.ts`
- Create: `src/building/README.md`, `src/visitors/README.md`, `src/economy/README.md`, `src/ui/README.md`, `src/assets/README.md` (je ein Satz Zweck, Deutsch)
- Test: `tests/zoom.test.ts`

**Interfaces:**
- Produces:
  - `src/config.ts`: `export const TILE_SIZE = 16;` `export const MIN_VIEW = { width: 320, height: 180 };` `export const MAX_ZOOM = 4;` `export const GAME_TITLE = 'Festival Tycoon';` `export const COLORS` (Objekt mit Hex-Zahlen für mind. `grassLight`, `grassDark`, `titleText`, `titleShadow`; warme Wiesentöne nach Wahl).
  - `src/core/zoom.ts`: `export function computeZoom(viewWidth: number, viewHeight: number): number` → ganze Zahl, `clamp(floor(min(w / MIN_VIEW.width, h / MIN_VIEW.height)), 1, MAX_ZOOM)`; nicht-endliche oder ≤ 0 Werte → `1`.
  - `package.json`-Skripte: `dev` (vite), `build` (`tsc --noEmit && vite build`), `preview` (vite preview), `test` (`vitest run`), `typecheck` (`tsc --noEmit`). `"version": "0.1.0"`, `"private": true`, `"type": "module"`.
  - `vite.config.ts`: `base` = `'/Festival-Tycoon/'` bei `command === 'build'`, sonst `'/'`; `define: { __APP_VERSION__: JSON.stringify(<version aus package.json>) }`. Vitest-Konfiguration: `test.include = ['tests/**/*.test.ts']`.
  - `src/vite-env.d.ts`: `declare const __APP_VERSION__: string;` plus `/// <reference types="vite/client" />`.

- [ ] **Step 1: Werkzeuge installieren und Grundkonfiguration anlegen**

`npm install phaser@~3.90.0` und `npm install -D vite typescript vitest`. `tsconfig.json`: `strict: true`, `target`/`module` ESNext, `moduleResolution: "bundler"`, `include: ["src", "tests", "vite.config.ts"]`. `.gitignore`: `node_modules/`, `dist/`. Modulordner-READMEs anlegen.

- [ ] **Step 2: Failing test schreiben** (`tests/zoom.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { computeZoom } from '../src/core/zoom';

describe('computeZoom', () => {
  it('PC Full HD → 4', () => expect(computeZoom(1920, 1080)).toBe(4));
  it('4K wird auf MAX_ZOOM begrenzt', () => expect(computeZoom(3840, 2160)).toBe(4));
  it('1280×720 → 4', () => expect(computeZoom(1280, 720)).toBe(4));
  it('Handy quer 844×390 → 2', () => expect(computeZoom(844, 390)).toBe(2));
  it('kleinere Seite bestimmt den Zoom', () => expect(computeZoom(2000, 400)).toBe(2));
  it('kleiner als Mindestansicht → 1', () => expect(computeZoom(319, 179)).toBe(1));
  it('Größe 0 → 1', () => expect(computeZoom(0, 0)).toBe(1));
  it('negative Werte → 1', () => expect(computeZoom(-100, 500)).toBe(1));
  it('NaN/Infinity → 1', () => {
    expect(computeZoom(NaN, 1080)).toBe(1);
    expect(computeZoom(Infinity, 1080)).toBe(1);
  });
  it('liefert immer eine ganze Zahl', () => expect(Number.isInteger(computeZoom(1000, 700))).toBe(true));
});
```

- [ ] **Step 3: Test laufen lassen, muss fehlschlagen**

Run: `npm test`
Expected: FAIL (Modul `../src/core/zoom` nicht gefunden)

- [ ] **Step 4: `computeZoom` und `src/config.ts` implementieren** (Interfaces siehe oben)

- [ ] **Step 5: Tests und Typprüfung**

Run: `npm test && npm run typecheck`
Expected: 10 Tests PASS, keine TS-Fehler

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts .gitignore src tests
git commit -m "M0: Projekt-Werkzeuge und Zoom-Logik mit Tests"
```

---

### Task 2: Phaser-Spiel mit Boot- und Titelszene

**Files:**
- Create: `index.html`, `src/main.ts`, `src/scenes/BootScene.ts`, `src/scenes/TitleScene.ts`, `src/assets/placeholders.ts`

**Interfaces:**
- Consumes: `computeZoom`, `TILE_SIZE`, `COLORS`, `GAME_TITLE` aus Task 1; `__APP_VERSION__`.
- Produces:
  - `src/assets/placeholders.ts`: `export const TEXTURE_KEYS = { grass: 'grass' } as const;` `export function createPlaceholderTextures(scene: Phaser.Scene): void` – erzeugt per `Graphics.generateTexture` eine 16×16-Graskachel (`TEXTURE_KEYS.grass`) aus `COLORS.grassLight` mit ein paar `grassDark`-Pixeln als Halme.
  - `BootScene` (key `'Boot'`): ruft `createPlaceholderTextures`, startet `'Title'`.
  - `TitleScene` (key `'Title'`): `TileSprite` mit `TEXTURE_KEYS.grass`, `tileScale` = Zoom, Größe = Fenster; Titel `GAME_TITLE` mittig (mit Schatten), darunter `"M0 – Grundgerüst"` und `` `v${__APP_VERSION__}` `` klein unten rechts. Reagiert auf `this.scale.on('resize', …)`: Wiese auf neue Größe, Zoom neu via `computeZoom`, Texte neu positionieren.
  - `src/main.ts`: `new Phaser.Game({ type: Phaser.AUTO, parent: 'game', pixelArt: true, backgroundColor: COLORS.grassDark, scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight }, scene: [BootScene, TitleScene] })`.
  - `index.html`: `<html lang="de">`, Titel `Festival Tycoon`, Viewport-Meta, `<div id="game">`, CSS: `html, body, #game` 100 % ohne Ränder/Scrollbalken, `canvas { image-rendering: pixelated; display: block; }`, `<script type="module" src="/src/main.ts">` (Vite schreibt den Pfad beim Build auf den Base-Pfad um).

- [ ] **Step 1: `index.html` und `main.ts` anlegen**
- [ ] **Step 2: `placeholders.ts` und `BootScene` anlegen**
- [ ] **Step 3: `TitleScene` inkl. Resize-Verhalten anlegen**
- [ ] **Step 4: Typprüfung + Tests**

Run: `npm run typecheck && npm test`
Expected: keine Fehler, 10 Tests PASS

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: Erfolg; `dist/index.html` referenziert Skripte unter `/Festival-Tycoon/assets/…`

Run: `grep -o '/Festival-Tycoon/assets/[^"]*' dist/index.html`
Expected: mindestens ein Treffer

- [ ] **Step 6: Browser-Check gegen den gebauten Stand** (Review Focus 1, 2, 4)

`npm run preview -- --port 4173` im Hintergrund, dann Playwright-Skript (Scratchpad, nicht im Repo): öffnet `http://localhost:4173/Festival-Tycoon/` bei 1280×720, sammelt Konsolenfehler und fehlgeschlagene Requests, wartet auf `canvas`, Screenshot; dann Viewport auf 844×390 ändern, kurz warten, zweiter Screenshot.
Expected: 0 Konsolenfehler, 0 fehlgeschlagene Requests; beide Screenshots zeigen fensterfüllende, scharfe Wiese mit mittigem Titel, ohne schwarze Ränder.

- [ ] **Step 7: Commit**

```bash
git add index.html src
git commit -m "M0: Phaser-Spiel mit Boot- und Titelszene"
```

---

### Task 3: GitHub-Actions-Workflows + README

**Files:**
- Create: `.github/workflows/check.yml`, `.github/workflows/deploy.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: Skripte `typecheck`, `test`, `build` aus Task 1; Build-Ausgabe `dist/`.

- [ ] **Step 1: `check.yml` anlegen**

Trigger: `pull_request` (alle Branches). Job: `actions/checkout`, `actions/setup-node` (Node 22, npm-Cache), `npm ci`, `npm run typecheck`, `npm test`, `npm run build`. Rechte: `contents: read`.

- [ ] **Step 2: `deploy.yml` anlegen**

Trigger: `push` auf `main` und `workflow_dispatch` (manuell erneut auslösbar). Rechte: `contents: read`, `pages: write`, `id-token: write`. `concurrency: { group: pages, cancel-in-progress: false }`. Job `build`: wie check, danach `actions/configure-pages`, `actions/upload-pages-artifact` mit `path: dist`. Job `deploy` (`needs: build`, `environment: github-pages` mit URL aus Output): `actions/deploy-pages`. Jeweils aktuelle Major-Versionen der offiziellen Actions.

- [ ] **Step 3: Workflows auf Syntax prüfen**

Run: `npx --yes yaml-lint .github/workflows/*.yml` (oder gleichwertiger YAML-Parser-Aufruf)
Expected: keine Fehler

- [ ] **Step 4: README auf Deutsch schreiben**

Inhalt: ein Satz zum Projekt + Verweis auf `GAME_DESIGN.md`; Link `https://jeanius93.github.io/Festival-Tycoon/`; Abschnitt „Einmalige Einrichtung“: Settings → Pages → Build and deployment → Source: „GitHub Actions“ (Review Focus 5); Abschnitt „Lokal starten“: `npm install`, `npm run dev`, `npm test`, `npm run build`.

- [ ] **Step 5: Gesamtprüfung**

Run: `npm ci && npm run typecheck && npm test && npm run build`
Expected: alles grün (entspricht genau dem Check-Workflow)

- [ ] **Step 6: Commit, Push, Pull Request**

```bash
git add .github README.md
git commit -m "M0: Deploy- und Check-Workflows, README"
git push -u origin claude/jolly-davinci-5pb914
```

Pull Request nach `main` erstellen (der Nutzer hat diesen Ablauf in `GAME_DESIGN.md` festgelegt); prüfen, dass `check.yml` im PR ✓ zeigt. Dem Nutzer die Pages-Einstellung Schritt für Schritt erklären; nach seinem Merge prüfen, dass der Deploy-Workflow durchläuft und die Adresse die Startszene zeigt.
