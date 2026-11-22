# CLAUDE.md – Regeln für die Arbeit an Festival Tycoon

## Kommunikation
- Kommunikation mit dem Nutzer **immer auf Deutsch**.
- Der Nutzer ist **absoluter Anfänger** (kein Programmierer, wenig Erfahrung mit GitHub):
  - Alles **ganz genau und Schritt für Schritt** erklären: wo genau klicken, wie die Schaltfläche heißt, was danach zu sehen sein sollte.
  - Keine Fachbegriffe ohne kurze Erklärung (z. B. Branch, Merge, Pull Request, Build, Workflow).
  - Bei technischen Entscheidungen erklären, was sie für das Spiel bedeuten, und immer eine Empfehlung geben.
  - Lieber einen Schritt zu viel erklären als einen zu wenig.

## Projektstand
(Nach jedem Meilenstein aktualisieren. Meilensteine siehe `GAME_DESIGN.md`, Abschnitt 11.)

| Meilenstein | Stand |
|---|---|
| M0 – Grundgerüst & Deployment | ✅ fertig, gemergt, läuft auf GitHub Pages |
| M1 – Wiese, Raster, Kamera, Wege | ✅ fertig, gemergt, läuft auf GitHub Pages |
| M2 – Geländebereiche | 🟡 in Arbeit (Brainstorming) |
| M3 bis M10 | offen |

## Vor jeder Aufgabe
- **`GAME_DESIGN.md` lesen.** Sie ist die Gesamtvision des Spiels und die zentrale Quelle für alle Entscheidungen.

## Arbeitsweise
- **Immer nur einen Meilenstein gleichzeitig** umsetzen (Meilensteine siehe `GAME_DESIGN.md`, Abschnitt 11).
- Für jeden Meilenstein den **Superpowers-Ablauf** nutzen:
  1. `brainstorming` (Rückfragen nacheinander, Ansätze vorschlagen)
  2. Design-Dokument (`docs/superpowers/specs/`), vom Nutzer freigeben lassen
  3. `writing-plans` (Umsetzungsplan, vom Nutzer freigeben lassen)
  4. Umsetzung
- Kein Spielcode, bevor Design und Plan freigegeben sind.

## Technik
- **Phaser 3**, **TypeScript**, **Vite**
- Deployment auf **GitHub Pages** per GitHub Actions (Push auf `main` → Build → Veröffentlichung)
- Code sauber in Module aufteilen (Szenen, Bau-System, Besucher, Wirtschaft, UI …)
- Nach jedem Meilenstein muss das Spiel über GitHub Pages spielbar sein.

## Vision pflegen
- Grundsätzliche Änderungen an der Vision in **`GAME_DESIGN.md`** nachtragen.
