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

## Steuerung

| Eingabe | Aktion |
|---|---|
| **WASD** / **Pfeiltasten** | Kamera verschieben |
| **Mittlere Maustaste + Ziehen** | Kamera verschieben |
| Maus an den **Bildschirmrand** | Kamera fährt mit |
| **Mausrad** | Zoomen (in Stufen, zum Mauszeiger hin) |
| Bau-Menü unten | **Ansehen** (nur schauen, Ziehen verschiebt die Kamera), **Wege & Zäune** (Weg, Zaun, Schleuse, Tor, Zeltfläche), **Bühnen**, **Stände**, **Sanitär**, **Abreißen** |
| **Zeltfläche:** linke Maustaste + Ziehen | Rechteck abstecken; braucht einen Weg zur Straße am unteren Rand |
| **Festival starten** (oben) | Gäste reisen mit dem Auto an; das Festival dauert 3 Tage |
| **Leertaste** | Pause (während des Festivals) |
| **1 / 2 / 3** | Tempo normal / doppelt / vierfach (während des Festivals) |
| **Weg:** linke Maustaste + Ziehen | Vorschau in L-Form, beim Loslassen wird gebaut |
| **R** | Ecke der L-Form drehen |
| **Rechtsklick** | Ziehen abbrechen; ohne Ziehen zurück zu „Ansehen“ |
| **Entf** | Abreißen-Modus ein/aus (rote Vorschau) |
| **Esc** | zurück zu „Ansehen“ |
| **G** | Raster ein-/ausblenden |

## Lokal starten (für Entwickler)

```bash
npm install      # Abhängigkeiten installieren
npm run dev      # Spiel lokal starten
npm test         # Tests ausführen
npm run build    # Spiel für die Veröffentlichung bauen (Ordner dist/)
npm run preview  # gebauten Stand lokal ansehen (unter /Festival-Tycoon/)
```

Technik: Phaser 3, TypeScript, Vite, Vitest.
