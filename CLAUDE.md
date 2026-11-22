# CLAUDE.md – Regeln für die Arbeit an Festival Tycoon

## Kommunikation
- Kommunikation mit dem Nutzer **immer auf Deutsch**.
- Der Nutzer ist kein Programmierer: Technische Entscheidungen kurz und verständlich erklären und jeweils eine Empfehlung geben.

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
