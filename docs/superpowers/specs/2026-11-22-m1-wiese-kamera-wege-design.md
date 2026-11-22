# Design: M1 – Wiese mit Raster, Kamera und Wege

**Datum:** 2026-11-22
**Meilenstein:** M1 (siehe `GAME_DESIGN.md`, Abschnitt 11)
**Status:** Entwurf, wartet auf Freigabe durch den Nutzer

---

## 1. Ziel und Hintergrund

M1 macht aus dem Titelbildschirm von M0 zum ersten Mal etwas Bedienbares: ein Grundstück (Wiese) mit Raster, auf dem man sich mit der Kamera bewegt und Wege baut und abreißt.

Wege sind in Festival Tycoon **keine Gehwege für Besucher**. Besucher laufen frei über die Wiese, wie auf einem echten Festival. Wege sind die **Versorgungsadern**: Über sie kommen Lieferwagen mit Bier und Essen zu den Ständen, Technik zur Bühne und Künstler in den Backstage-Bereich. Bei Regen bleiben Wege gut befahrbar, während die Wiese matschig wird. Diese Bedeutung bekommt der Weg erst in späteren Meilensteinen. In M1 geht es nur darum, Wege angenehm zu bauen und abzureißen.

M1 ist die Grundlage für alles Weitere. Danach kommen die drei Geländebereiche (Campingplatz, Bühnengelände, Backstage) und dann die Objekte. Raster, Kamera und Bau-Werkzeug von M1 werden dafür wiederverwendet.

## 2. Ziele

1. **Titelbildschirm** von M0 bleibt, bekommt eine Schaltfläche **„Spielen“**, die zur Wiese führt.
2. **Grundstück:** fest **64 × 48 Felder** à 16 × 16 Pixel, am Anfang eine leere Wiese. Ringsherum ist ein sichtbarer Rand (z. B. dunkles Gebüsch oder Zaun), über den man nicht bauen kann.
3. **Raster:** dezente Rasterlinien auf der Wiese, damit man die Felder erkennt.
4. **Kamera:**
   - Verschieben mit **WASD** und **Pfeiltasten**
   - Verschieben mit **mittlerer Maustaste + Ziehen**
   - Verschieben, wenn die Maus an den **Bildschirmrand** kommt (nur solange die Maus im Spielfenster ist)
   - **Zoomen mit dem Mausrad** in ganzen Stufen (damit die Pixel scharf bleiben), zum Mauszeiger hin
   - Die Kamera kann das Grundstück nicht verlassen (höchstens ein kleiner Streifen Rand bleibt sichtbar). Ist das Grundstück kleiner als das Fenster, wird es mittig angezeigt.
5. **Wege bauen (vom Nutzer gewählt: L-Form mit Vorschau):**
   - Linke Maustaste auf ein Feld drücken und ziehen: Eine durchsichtige Vorschau zeigt den Weg als L-Form (erst waagrecht, dann senkrecht vom Startfeld zum aktuellen Feld). Liegen Start und Ende in einer Reihe oder Spalte, ist es eine gerade Linie.
   - Beim **Loslassen** wird der Weg gebaut.
   - **R** dreht die Ecke (erst senkrecht, dann waagrecht), auch während des Ziehens.
   - **Rechtsklick** während des Ziehens bricht ab, es wird nichts gebaut.
   - Felder, auf denen schon ein Weg liegt, werden übersprungen. Felder außerhalb des Grundstücks werden abgeschnitten und nicht bebaut.
   - Ohne Ziehen (nur Klick) entsteht ein einzelnes Wegfeld.
   - Wege setzen sich optisch zusammen: Gerade, Ecken, T-Stücke, Kreuzungen und Enden sehen wie verbundene Wege aus.
6. **Abreißen:**
   - Gleiches Ziehen in L-Form, aber die Vorschau ist **rot**. Beim Loslassen verschwinden die Wege auf diesen Feldern. Felder ohne Weg werden ignoriert.
   - **Entf** schaltet den Abreißen-Modus ein und aus.
7. **Werkzeugleiste** unten am Bildschirm mit großen Schaltflächen: **„Ansehen“** (nur schauen), **„Weg“**, **„Abreißen“**. Das aktive Werkzeug ist hervorgehoben. Die Leiste zoomt nicht mit und bleibt immer gleich groß und lesbar.
   - **Rechtsklick ohne Ziehen** und **Esc** wechseln zu „Ansehen“ („Bau-Modus verlassen“ laut `GAME_DESIGN.md`).
   - Ein kurzer Hinweistext zeigt die wichtigsten Tasten für das aktive Werkzeug (z. B. „R: Ecke drehen · Rechtsklick: Abbrechen“).
8. **Hover-Vorschau:** Im Werkzeug „Weg“ oder „Abreißen“ wird das Feld unter dem Mauszeiger hervorgehoben, auch ohne zu ziehen.
9. **Tests:** Die Spiel-Logik (siehe Abschnitt 7) liegt in Phaser-freien Modulen und wird mit Vitest getestet.
10. **`CLAUDE.md`** bekommt den Abschnitt „Projektstand“. **`GAME_DESIGN.md`** wird um die neuen Vision-Punkte ergänzt (siehe Abschnitt 9).

## 3. Nicht-Ziele (kommt später)

- **Geländebereiche** (Campingplatz, Bühnengelände, Backstage): eigener Meilenstein direkt nach M1.
- **Geld, Baukosten, Budget:** Wege sind in M1 kostenlos.
- **Objekte** (Bühne, Stände, Klos), **Zäune**, Drehen von Objekten.
- **Speichern/Laden:** Nach dem Neuladen der Seite ist die Wiese wieder leer (Speichern kommt in M9 laut neuer Nummerierung).
- **Pause und Spielgeschwindigkeit** (Leertaste, 1/2/3): Es gibt noch keine Simulation.
- **Touch- und Controller-Steuerung:** Das Spiel lädt am Handy, ist dort aber noch nicht sinnvoll bedienbar. Die großen Schaltflächen bereiten das vor.
- **Gelände pachten/erweitern:** Die Grundstücksgröße ist ein fester Wert in den Einstellungen.
- **Echte Grafiken und Sound:** Weiter Platzhalter, per Code erzeugt.

## 4. Anti-Ziele (das wäre ein Fehlschlag, selbst wenn es technisch läuft)

- Pixel werden unscharf (stufenloser Zoom, halbe Pixel bei der Kameraposition).
- Ein Klick auf die Werkzeugleiste baut aus Versehen einen Weg darunter.
- Rechtsklick öffnet das Kontextmenü des Browsers.
- Die Kamera rutscht ungewollt weg (z. B. weil die Maus das Fenster verlassen hat und als „am Rand“ gilt).
- Schnelles Ziehen lässt Felder aus oder baut etwas anderes, als die Vorschau gezeigt hat.
- Das Spiel ruckelt beim Bauen oder Verschieben.
- Logik und Darstellung sind so verwoben, dass die Bereiche und Objekte der nächsten Meilensteine einen Umbau erfordern.

## 5. Ansätze

### Bau-Gefühl beim Ziehen
| Ansatz | Bewertung |
|---|---|
| A) Freihand: jedes überfahrene Feld wird Weg | schnell, aber krumme Wege |
| B) Gerade Linie mit Vorschau | sauber, aber Kurven brauchen zwei Züge |
| **C) L-Form mit Vorschau (gewählt)** | sauber und schnell, Ecke in einem Zug, Vorschau zeigt vorher das Ergebnis |

**Entscheidung des Nutzers:** C.

### Grundstücksgröße
| Ansatz | Bewertung |
|---|---|
| Klein, ca. 40 × 30 | passt zum Dorffest, aber Kamera kaum zu testen |
| **Mittel, ca. 64 × 48 (gewählt)** | genug Platz zum Ausprobieren, Kamera muss spürbar bewegt werden |
| Groß, ca. 128 × 96 | wirkt am Anfang leer |

**Entscheidung des Nutzers:** Mittel, am Anfang leere Wiese.

### Geländebereiche schon in M1?
| Ansatz | Bewertung |
|---|---|
| **Nein, eigener Meilenstein danach (gewählt)** | M1 bleibt klein und testbar; Datenmodell wird darauf vorbereitet |
| Ja, Bereiche schon in M1 malen | früheres Gefühl für die Aufteilung, M1 etwa doppelt so groß |

**Entscheidung des Nutzers:** Bereiche kommen nach M1.

### Darstellung des Geländes
| Ansatz | Bewertung |
|---|---|
| **A) Phaser-Kachelkarte (Tilemap) mit Ebenen (gewählt)** | schnell auch bei großen Geländen; Ebenen für Boden, Wege, später Bereiche und Objekte; Grafiken leicht austauschbar |
| B) Ein eigenes Bild pro Wegfeld | am einfachsten, wird bei vielen Feldern langsam (Handy, MSI Claw), muss später umgebaut werden |
| C) Alles in ein einziges großes Bild malen | schnell, aber verbundene Wege und Abreißen umständlich, keine Ebenen |

**Entscheidung des Nutzers:** A.

## 6. Entscheidungen

**Vom Nutzer getroffen:**
- Wege in L-Form mit Vorschau bauen.
- Grundstück 64 × 48 Felder, am Anfang leer.
- Wege sind Versorgungsadern (Logistik, Backstage), keine Besucherwege. Besucher laufen frei über die Wiese.
- Das Gelände wird später in drei Bereiche gegliedert (Campingplatz, Bühnengelände, Backstage). Das kommt als eigener Meilenstein nach M1.
- Darstellung über Phaser-Tilemap.

**Von Claude vorgeschlagen, vom Nutzer nicht widersprochen:**
- R dreht die L-Ecke, Rechtsklick bricht ab, vorhandene Wege werden übersprungen.
- Abreißen mit Entf und roter Vorschau.
- Werkzeugleiste „Ansehen / Weg / Abreißen“ unten.
- „Spielen“-Schaltfläche auf dem Titelbildschirm.
- Kein Speichern in M1.
- Randscrollen nur, wenn die Maus im Spielfenster ist.
- Wege setzen sich optisch zusammen.

**Von Claude festgelegt (beim Ausarbeiten):**
- Mausrad-Zoom in ganzen Stufen von **1× bis 6×**. Startzoom ist der Wert aus `computeZoom` (M0). Gezoomt wird zum Mauszeiger hin.
- Rasterlinien sind immer dezent sichtbar, **G** blendet sie ein und aus.
- Rechtsklick ohne Ziehen und Esc wechseln zu „Ansehen“.
- Hover-Hervorhebung des Feldes unter der Maus in den Bau-Werkzeugen.
- Die Kamera startet in der Mitte des Grundstücks.
- Im Werkzeug „Ansehen“ verschiebt auch **linke Maustaste + Ziehen** die Kamera.
- Während des Ziehens eines Weges funktionieren Tasten- und Randscrollen weiter, die Vorschau läuft mit.
- Wird die Maustaste außerhalb des Fensters losgelassen, zählt das wie Loslassen am zuletzt bekannten Feld.
- Kein eigener Buchstabe für das Weg-Werkzeug, weil W, A, S, D, R, G und später Leertaste und 1/2/3 schon belegt sind. Auswahl über die Werkzeugleiste. Ob es eine freie Taste dafür gibt, entscheidet der Umsetzer.

## 7. Aufbau (technischer Rahmen)

**Logik und Darstellung getrennt.** Alles, was sich ohne Bildschirm berechnen lässt, liegt in Phaser-freien Modulen und wird mit Vitest getestet:

| Modul (Vorschlag) | Aufgabe |
|---|---|
| `src/building/grid.ts` | Das Grundstück als Datenmodell: Breite, Höhe, pro Feld der Boden (Wiese/Weg). Weg setzen/entfernen, abfragen, „liegt im Grundstück?“. So gebaut, dass pro Feld später weitere Angaben dazukommen können (Bereich, Objekt). Meldet Änderungen, damit die Darstellung nur geänderte Felder neu zeichnet. |
| `src/building/lineTool.ts` | Berechnet die Felder einer L-Linie von Start- zu Endfeld, mit Ecke waagrecht-zuerst oder senkrecht-zuerst, ohne Lücken und ohne doppelte Felder. |
| `src/building/autotile.ts` | Bestimmt aus den vier Nachbarn (oben, rechts, unten, links) eines Wegfeldes, welches Wegstück (gerade, Ecke, T, Kreuzung, Ende, einzeln) angezeigt wird (16 Varianten). |
| `src/core/camera.ts` | Kamera-Begrenzung (Grundstück darf nicht verlassen werden, Zentrieren, wenn es kleiner als das Fenster ist), nächste/vorige Zoomstufe, Umrechnung „Bildschirmpunkt → Feld“. |

**Darstellung mit Phaser:**
- **Weltszene** (z. B. `WorldScene`): Tilemap mit Ebenen (Boden mit Wiese und Rand, Wege), Rasterlinien, Vorschau, Kamera und Eingaben. Wege-Ebene wird aus dem Datenmodell gezeichnet.
- **Oberflächen-Szene** (z. B. `UIScene`): läuft darüber, mit eigener Kamera ohne Zoom; enthält Werkzeugleiste und Hinweistext. Klicks auf die Leiste werden von der Weltszene nicht als Bauklick behandelt.
- Platzhalter-Grafiken (Wiese, Rand, 16 Wegstücke, Vorschau grün/rot, Raster) werden wie in M0 per Code in `src/assets/placeholders.ts` erzeugt. Die Wegstücke liegen in einem Bild nebeneinander, das als Tileset der Tilemap dient. So lässt es sich in M10 durch ein echtes Tileset ersetzen.
- Einstellungen wie Grundstücksgröße, Zoomstufen, Randscroll-Breite und Kamera-Geschwindigkeit stehen zentral in `src/config.ts`.

## 8. Fertig, wenn …

1. `npm ci`, `npm test` und `npm run build` laufen ohne Fehler; die neuen Logik-Module haben Tests.
2. Der Check-Workflow zeigt im Pull Request ✓, nach dem Merge läuft der Deploy durch.
3. Auf `https://jeanius93.github.io/Festival-Tycoon/`:
   - Titelbildschirm → „Spielen“ → leere Wiese 64 × 48 mit Raster und sichtbarem Rand.
   - Kamera lässt sich mit WASD, Pfeiltasten, mittlerer Maustaste und Bildschirmrand verschieben, verlässt das Grundstück nicht.
   - Mausrad zoomt in Stufen, Pixel bleiben scharf.
   - Im Werkzeug „Weg“ entsteht beim Ziehen eine L-Vorschau, R dreht die Ecke, Loslassen baut, Rechtsklick bricht ab.
   - Wege verbinden sich optisch an Ecken, T-Stücken und Kreuzungen.
   - Entf bzw. „Abreißen“ zeigt eine rote Vorschau und entfernt Wege beim Loslassen.
   - Klicks auf die Werkzeugleiste bauen nichts, Rechtsklick öffnet kein Browser-Menü.
4. Der Nutzer hat es am PC-Browser ausprobiert.
5. `CLAUDE.md` (Projektstand) und `GAME_DESIGN.md` sind aktualisiert.

## 9. Änderungen an der Vision (`GAME_DESIGN.md`)

Werden zusammen mit diesem Design-Dokument eingetragen:
- **Spielziele:** Einnahmen erzielen, **Künstler zufriedenstellen**, Besucher zufriedenstellen.
- **Drei Geländebereiche:** Campingplatz (Zelte, Müllsammelstellen, Klos), Bühnengelände (Bühne, Essensstände, Bierbuden), Backstage (Logistik, Technik, Künstlerbereich).
- **Wege** sind Versorgungsadern für Lieferungen, Technik und Künstler. Besucher laufen frei über die Wiese.
- **Meilensteine:** Neuer Meilenstein **M2 „Geländebereiche“**, die bisherigen M2 bis M9 rücken eine Nummer nach hinten (M3 bis M10). Der Besucher-Meilenstein heißt nun „laufen frei über das Gelände“ statt „laufen auf Wegen“.

## 10. Dem Umsetzer überlassen

- genaue Farben und Aussehen der Platzhalter (Wiese, Rand, Weg, Vorschau, Raster), warm und gemütlich
- Breite des Randes und wie viel davon sichtbar bleiben darf
- Kamera-Geschwindigkeit, Breite der Randscroll-Zone (Werte in `config.ts`, leicht änderbar)
- Aussehen und genaue Maße der Werkzeugleiste (große, klare Schaltflächen)
- genaue Modul- und Klassennamen, solange Logik und Darstellung getrennt bleiben
- ob die Werkzeugleiste mit Phaser-Mitteln oder als Bild-Schaltflächen gezeichnet wird (Hauptsache scharf und groß)
