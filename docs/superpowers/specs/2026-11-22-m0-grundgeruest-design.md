# Design: M0 – Projekt-Grundgerüst & Deployment auf GitHub Pages

**Datum:** 2026-11-22
**Meilenstein:** M0 (siehe `GAME_DESIGN.md`, Abschnitt 11)
**Status:** Entwurf, wartet auf Freigabe durch den Nutzer

---

## 1. Ziel und Hintergrund

M0 ist noch kein Spiel, sondern das Fundament, auf dem alle weiteren Meilensteine aufbauen. Am Ende von M0 gibt es:

- ein lauffähiges Phaser-3-Projekt (TypeScript, Vite) mit einer leeren Startszene
- eine feste, öffentliche Web-Adresse, unter der das Spiel automatisch nach jedem Merge in `main` erscheint:
  **`https://jeanius93.github.io/Festival-Tycoon/`**
- einen automatischen Check, der jeden Pull Request zur Probe baut und testet, damit kein kaputter Stand live geht

Der Nutzer ist kein Programmierer und arbeitet über Claude Code im Browser. Das Spiel soll ohne Installation auf PC, Handy und MSI Claw laufen. Der Ablauf „Claude erstellt Pull Request → Nutzer merged → Spiel ist online“ muss deshalb ohne manuelle Schritte funktionieren (abgesehen von der einmaligen Pages-Einstellung, siehe Abschnitt 7).

## 2. Ziele

1. Phaser 3 + TypeScript + Vite, lokal per `npm run dev` startbar, per `npm run build` baubar.
2. Eine Startszene, die **das ganze Browserfenster füllt** und sich bei Größenänderung anpasst; Pixel bleiben scharf (`pixelArt: true`, ganzzahlige Skalierung).
3. Inhalt der Startszene: wiesengrüner Hintergrund aus 16×16-Platzhalter-Kacheln (per Code erzeugt), darauf der Titel „Festival Tycoon“ und ein kleiner Hinweis „M0 – Grundgerüst“ sowie die Versionsnummer.
4. GitHub Actions:
   - **Deploy:** bei jedem Push auf `main` → Tests + Build → Veröffentlichung von `dist/` auf GitHub Pages.
   - **Check:** bei jedem Pull Request → Typprüfung, Tests und Build; Ergebnis als ✓/✗ im Pull Request.
5. Ordnerstruktur, die schon die späteren Module aus `GAME_DESIGN.md` (Abschnitt 13) vorsieht.
6. Testwerkzeug **Vitest** eingerichtet, mit mindestens einem echten (kleinen) Test, damit der Check etwas prüft.
7. Kurze README auf Deutsch: was das Projekt ist, Link zur Spiel-Adresse, wie man lokal startet.

## 3. Nicht-Ziele (kommt später)

- Keine Spielmechanik: kein Raster zum Bauen, keine Kamera-Steuerung, kein Zoom (alles M1).
- Keine echten Grafiken, kein Sound (M9).
- Kein Speichern/Laden (M8).
- Keine Vorschau-Adressen pro Pull Request (bewusst verworfen, siehe Abschnitt 5).
- Keine Optimierung für Hochformat am Handy (läuft, wird aber nicht gestaltet).
- Keine Controller- oder Touch-Steuerung.

## 4. Anti-Ziele (das wäre ein Fehlschlag, selbst wenn es technisch läuft)

- Das Spiel ist auf GitHub Pages nur ein schwarzer/leerer Bildschirm, weil Asset- oder Skriptpfade nicht zum Base-Pfad passen.
- Pixel-Grafik wird verwaschen/unscharf dargestellt.
- Unnötige Abhängigkeiten, Beispielcode oder Hintergrund-Datenübertragung (z. B. Telemetrie-Skripte aus Vorlagen), die der Nutzer nicht nachvollziehen kann.
- Der Nutzer muss für den normalen Ablauf etwas auf der Kommandozeile tun.

## 5. Ansätze

### Grundgerüst
| Ansatz | Bewertung |
|---|---|
| 1) Offizielle Phaser-Vorlage `template-vite-ts` | schnell, aber bringt Beispielszenen und ein Telemetrie-Skript (`log.js`) mit, die entfernt/umgebaut werden müssten |
| **2) Schlank selbst aufsetzen (gewählt)** | leeres Vite-TS-Projekt + Phaser; nur, was gebraucht wird; Struktur von Anfang an nach den Modulen aus `GAME_DESIGN.md` |
| 3) Großes Komplettpaket mit vielen Extras | überdimensioniert, verwirrt eher |

**Entscheidung des Nutzers:** Ansatz 2, inklusive Vitest.

### Prüfen vor dem Livegang
| Ansatz | Bewertung |
|---|---|
| A) Nur Deploy bei Merge | einfachst, aber Build-Fehler fallen erst nach dem Merge auf |
| **B) Deploy + Probe-Build/Tests bei jedem Pull Request (gewählt)** | kaum Mehraufwand, verhindert kaputte Stände online |
| C) Vorschau-Adresse pro Pull Request | mit GitHub Pages umständlich und fehleranfällig; lohnt sich für ein Ein-Personen-Projekt nicht |

**Entscheidung des Nutzers:** B.

### Bildschirmanpassung
| Ansatz | Bewertung |
|---|---|
| **A) Füllt immer das ganze Fenster (gewählt)** | mehr Fläche auf großen Bildschirmen, keine Balken; passt zu frei verschiebbarer Kamera |
| B) Feste Auflösung mit Balken | einfacheres UI, aber verschenkter Platz, auf dem Handy winzig |

**Entscheidung des Nutzers:** A. Querformat ist das Ziel (Claudes Entscheidung, da die Nutzer-Rückfrage offen blieb).

## 6. Entscheidungen (vom Nutzer getroffen)

- Repository ist **öffentlich** (GitHub Pages kostenlos).
- Engine **Phaser 3** (nicht Phaser 4), Sprache **TypeScript**, Build-Tool **Vite** – laut `GAME_DESIGN.md`.
- Grundgerüst schlank selbst aufgesetzt, mit Vitest.
- Deploy bei Merge in `main` + Check bei jedem Pull Request.
- Spiel füllt das ganze Fenster.

## 7. Technische Rahmenbedingungen

- **Base-Pfad:** Das Repo heißt `Festival-Tycoon` (Groß-/Kleinschreibung zählt bei GitHub Pages). In `vite.config.ts` daher `base: '/Festival-Tycoon/'` (nur für den Build; der lokale Dev-Server darf `/` nutzen). `GAME_DESIGN.md` Abschnitt 3 wird entsprechend korrigiert.
- **Asset-Pfade:** alle Pfade relativ zum Base-Pfad (über `import.meta.env.BASE_URL` bzw. Vite-Importe), nie absolut ab `/`.
- **Phaser-Version:** letzte Phaser-3-Version (aktuell 3.90.0), fest auf Major-Version 3 gepinnt, damit kein automatisches Update auf Phaser 4 passiert.
- **Weitere Werkzeuge:** aktuelle stabile Versionen von Vite, TypeScript und Vitest, die zusammen mit Phaser 3.90 funktionieren; `package-lock.json` wird committet, damit GitHub Actions reproduzierbar baut (`npm ci`).
- **Node-Version** in den Workflows fest vorgegeben (aktuelle LTS).
- **Pixel-Darstellung:** `pixelArt: true`, Skalierungsmodus, der das Fenster füllt (Phaser `Scale.RESIZE`), Welt-Kacheln werden ganzzahlig vergrößert (Zoomfaktor als ganze Zahl, abhängig von der Fenstergröße).
- **Einmaliger manueller Schritt des Nutzers:** In GitHub unter **Settings → Pages → Build and deployment → Source** „GitHub Actions“ auswählen. Claude liefert dafür eine kurze Schritt-für-Schritt-Anleitung.
- **Arbeitsablauf:** Claude arbeitet auf einem eigenen Branch, erstellt einen Pull Request, der Nutzer merged.

## 8. Vorgeschlagene Struktur (Claudes Vorschlag)

```
Festival-Tycoon/
├─ .github/workflows/
│  ├─ deploy.yml        # Push auf main → testen, bauen, auf Pages veröffentlichen
│  └─ check.yml         # Pull Request → Typprüfung, Tests, Build
├─ docs/superpowers/    # Design-Dokumente und Pläne
├─ public/              # später: statische Dateien (Favicon …)
├─ src/
│  ├─ main.ts           # Einstiegspunkt: erzeugt das Phaser-Spiel
│  ├─ config.ts         # zentrale Einstellungen (Kachelgröße 16, Farben, Titel)
│  ├─ scenes/           # Szenen (M0: BootScene, TitleScene)
│  ├─ assets/           # Platzhalter-Grafiken per Code; später echte Sprites
│  ├─ building/         # später: Bau-System (M1/M2)
│  ├─ visitors/         # später: Besucher (M3)
│  ├─ economy/          # später: Wirtschaft (M4)
│  └─ ui/               # später: Bedienoberfläche
├─ tests/               # Vitest-Tests
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ package.json
├─ CLAUDE.md
├─ GAME_DESIGN.md
└─ README.md
```

Leere Modulordner werden mit einer kurzen `README.md` (ein Satz, wofür der Ordner gedacht ist) angelegt, damit Git sie speichert und der Zweck klar ist.

Der erste Test prüft reine Logik ohne Phaser, z. B. die Berechnung des ganzzahligen Zoomfaktors aus der Fenstergröße. Diese Funktion liegt deshalb in einem eigenen, Phaser-freien Modul.

## 9. Fertig, wenn …

1. `npm ci`, `npm test` und `npm run build` laufen lokal ohne Fehler.
2. Der Check-Workflow zeigt bei einem Pull Request ✓.
3. Nach dem Merge in `main` läuft der Deploy-Workflow erfolgreich durch.
4. Unter `https://jeanius93.github.io/Festival-Tycoon/` erscheint die grüne Startszene mit Titel, scharf und fensterfüllend, auch nach Größenänderung des Fensters.
5. Die Seite funktioniert am PC-Browser und am Handy (vom Nutzer geprüft).
6. Die README erklärt kurz Projekt, Spiel-Adresse und lokalen Start.

## 10. Dem Umsetzer überlassen

- genaue Versionen von Vite, TypeScript und Vitest (stabil, kompatibel zu Phaser 3.90)
- genaue Farben und Schriftdarstellung der Startszene (warm, gemütlich, passend zu `GAME_DESIGN.md`)
- Details der Workflows (z. B. Caching von `npm`), solange Ablauf und Ergebnis wie oben sind
- Formulierung der README
