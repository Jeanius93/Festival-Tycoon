# Festival Tycoon

Ein gemütliches Tycoon-Spiel im Browser: Aus einem kleinen Dorffest wird Jahr für Jahr ein großes Rockfestival.
Die Gesamtvision steht in [`GAME_DESIGN.md`](GAME_DESIGN.md).

**Spielen:** https://jeanius93.github.io/Festival-Tycoon/

## Einmalige Einrichtung (GitHub Pages)

Damit das Spiel automatisch veröffentlicht wird, muss einmal Folgendes eingestellt werden:

1. Auf GitHub das Repository öffnen → **Settings**
2. Links **Pages** wählen
3. Unter **Build and deployment → Source** die Option **„GitHub Actions“** auswählen

Danach wird das Spiel bei jedem Merge in `main` automatisch gebaut und veröffentlicht.
Jeder Pull Request wird vorher zur Probe gebaut und getestet (✓ oder ✗ im Pull Request).

Wurde schon gemergt, bevor diese Einstellung gesetzt war, ist der erste Deploy fehlgeschlagen.
Dann einmal unter **Actions → Deploy → Run workflow** neu starten.

## Lokal starten (für Entwickler)

```bash
npm install      # Abhängigkeiten installieren
npm run dev      # Spiel lokal starten
npm test         # Tests ausführen
npm run build    # Spiel für die Veröffentlichung bauen (Ordner dist/)
npm run preview  # gebauten Stand lokal ansehen (unter /Festival-Tycoon/)
```

Technik: Phaser 3, TypeScript, Vite, Vitest.
