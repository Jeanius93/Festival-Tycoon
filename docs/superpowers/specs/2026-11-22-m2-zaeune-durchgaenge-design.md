# Design: M2 – Geländebereiche durch Zäune und Durchgänge

**Datum:** 2026-11-22
**Meilenstein:** M2 (siehe `GAME_DESIGN.md`, Abschnitt 11)
**Status:** Vom Nutzer freigegeben (2026-11-22)

---

## 1. Ziel und Hintergrund

Das Festivalgelände besteht aus drei Bereichen (siehe `GAME_DESIGN.md`, 1.1):

- **Campingplatz:** Hier sind die Gäste nachts und morgens. Sie zelten, machen Müll und gehen zu Dixi-Klos und Essplätzen.
- **Bühnengelände:** Hierher kommen die Gäste von nachmittags bis nachts. Sie trinken, feiern und schauen Bands.
- **Backstage:** Hier sind Künstler und Personal (Security, Reinigung, Technik). Das Personal schläft hier, arbeitet aber auf dem ganzen Gelände.

**Entscheidung des Nutzers:** Die Bereiche werden **nicht farbig markiert oder gemalt**. Sie entstehen wie auf einem echten Festival **durch Zäune**:

- Um das Bühnengelände zieht man einen Zaun und setzt eine **Besucher-Schleuse**, durch die die Gäste hineingehen.
- Um den Backstage zieht man ebenfalls einen Zaun. Dort haben **nur Mitarbeiter** Zutritt.
- Der **Campingplatz** ist die offene Wiese außerhalb der Zäune.

Das Spiel muss nicht wissen, welcher eingezäunte Bereich „Bühnengelände“ oder „Backstage“ heißt. **Wer hinein darf**, regelt die Art des Durchgangs im Zaun. **Wofür ein Bereich da ist**, ergibt sich ab M3 daraus, was man hineinbaut (Bühne, Bierbude, Künstlerzelt). Der Nutzer wollte es bewusst so offen.

In M2 läuft noch niemand herum. M2 schafft die Bau-Grundlage: Zäune und Durchgänge, die sich so angenehm bauen lassen wie die Wege aus M1. Erst die Besucher (M4) und das Personal (M8) halten sich an die Zutrittsregeln.

## 2. Ziele

1. **Zaun bauen** im neuen Werkzeug **„Zaun“**, genau wie Wege in M1: Ziehen mit L-Vorschau, **R** dreht die Ecke, **Rechtsklick** bricht ab, ein Klick ohne Ziehen setzt ein einzelnes Zaunfeld.
2. **Ein Zaun belegt ein ganzes Feld** (vom Nutzer gewählt, Ansatz A). Die Zaunstücke verbinden sich optisch: Gerade, Ecken, T-Stücke, Kreuzungen, Enden und einzelne Pfosten (16 Varianten wie bei den Wegen). Ein Zaun verbindet sich mit benachbarten Zäunen und Durchgängen.
3. **Zwei Arten von Durchgängen** (vom Nutzer bestätigt):
   - **Besucher-Schleuse:** Gäste und Personal gehen zu Fuß hindurch. Kein Weg, keine Fahrzeuge.
   - **Personal-Tor:** Nur Mitarbeiter und Lieferwagen kommen hindurch. Ein Weg darf hindurchführen, so kommen Lieferungen ins Bühnengelände und in den Backstage.
4. **Durchgänge setzen** mit den Werkzeugen **„Schleuse“** und **„Tor“**, per Klick auf ein Feld. Ein Durchgang ist **ein Feld breit**. Er braucht auf zwei gegenüberliegenden Seiten Zaun (oder einen weiteren Durchgang), also links und rechts oder oben und unten. Seine Ausrichtung (waagrecht/senkrecht) ergibt sich daraus von selbst.
   - **Schleuse** geht auf einem Zaunfeld (das dann zur Schleuse wird) oder auf einem freien Wiesenfeld in einer Zaunlücke. Auf einem Weg geht sie nicht.
   - **Tor** geht auf einem Zaunfeld oder auf einem Wegfeld in einer Zaunlücke. Der Weg bleibt dabei liegen und führt durch das Tor.
   - Eine vorhandene Schleuse lässt sich durch einen Klick mit dem Tor-Werkzeug in ein Tor umwandeln, und umgekehrt, sofern kein Weg darunter liegt.
5. **Regeln für Weg und Zaun auf demselben Feld:**
   - Zaun wird nicht auf Wegfelder oder Durchgänge gebaut. Diese Felder werden übersprungen, so wie in M1 schon vorhandene Wegfelder.
   - Weg wird nicht auf Zaunfelder oder Schleusen gebaut (übersprungen). Durch ein Tor darf ein Weg gebaut werden.
   - Wer also einen Weg durch einen Zaun führen will, setzt an der Kreuzung ein Tor, egal ob zuerst der Weg oder zuerst der Zaun da war.
6. **Vorschau grün/rot** (wie in `GAME_DESIGN.md`, Abschnitt 5): Beim Ziehen und beim Zielen mit Schleuse oder Tor zeigt die Vorschau, welche Felder gebaut werden (hell) und welche **nicht erlaubt** sind (rot). Felder, die schon genau das enthalten, was gebaut wird, zählen als „nichts zu tun“ und müssen nicht rot sein. Die Vorschau zeigt vorher genau das spätere Ergebnis.
7. **Abreißen** (bestehendes Werkzeug, Entf) entfernt auf den gezogenen Feldern **alles**: Weg, Zaun und Durchgang. Danach ist dort wieder Wiese.
8. **Werkzeugleiste** bekommt drei neue Schaltflächen: **Ansehen · Weg · Zaun · Schleuse · Tor · Abreißen**. Jedes Werkzeug hat einen kurzen Hinweistext mit den wichtigsten Tasten.
9. **Tests:** Die neue Spiel-Logik (Datenmodell, Bauregeln, Zaunstücke, Ausrichtung der Durchgänge, Werkzeug) liegt wie in M1 in Phaser-freien Modulen und wird mit Vitest getestet.
10. **`GAME_DESIGN.md` und `CLAUDE.md`** werden aktualisiert (siehe Abschnitt 9).

## 3. Nicht-Ziele (kommt später)

- **Bereiche erkennen oder benennen:** Das Spiel prüft in M2 nicht, ob ein Zaun geschlossen ist, und zeigt keine Bereichsfarben. Ob eine Lücke im Zaun Folgen hat (z. B. Gäste schleichen sich hinein), entscheidet sich mit den Besuchern in M4.
- **Besucher und Personal**, die durch Schleusen und Tore gehen (M4, M8). **Lieferwagen** (später).
- **Kosten:** Zäune und Durchgänge sind in M2 kostenlos. Geld und Budget kommen mit M3/M5.
- **Breitere Durchgänge** (z. B. drei Felder breite Einlass-Schleuse), Zaun-Arten (Bauzaun, Bühnengraben), VIP-Zugang.
- **Speichern/Laden:** Nach dem Neuladen ist die Wiese wieder leer (M9).
- **Echte Grafiken:** weiter Platzhalter, per Code erzeugt (M10).

## 4. Anti-Ziele (das wäre ein Fehlschlag, selbst wenn es technisch läuft)

- Die Vorschau zeigt etwas anderes, als beim Loslassen oder Klicken tatsächlich gebaut wird.
- Ein Durchgang sieht falsch herum aus oder hängt frei in der Luft, ohne Zaun daneben.
- Ein Weg führt durch einen Zaun, ohne dass dort ein Tor steht.
- Das Wegebauen, die Kamera oder die Werkzeugleiste aus M1 funktionieren schlechter als vorher.
- Die Werkzeugleiste wird so breit, dass sie bei kleinen Fenstern nicht mehr passt oder unlesbar wird.
- Das Datenmodell ist so gebaut, dass die Besucher in M4 nicht einfach fragen können: „Darf diese Person dieses Feld betreten?“

## 5. Ansätze

### Wie entstehen die Bereiche?
| Ansatz | Bewertung |
|---|---|
| A) Bereiche farbig malen, Zäune extra darauf | flexibel, aber doppelte Arbeit, wirkt künstlich |
| B) Geschlossenen Zaun ziehen, dann Bereich benennen | realistisch, aber Zaun muss lückenlos sein, deutlich größer |
| C) Bereiche malen, Zaun entsteht automatisch | bequem, aber wenig Gestaltungsfreiheit |
| **D) Nur Zäune und Durchgänge, keine Markierung (gewählt)** | offen und realistisch; der Zutritt wird über die Art des Durchgangs geregelt, der Zweck ergibt sich aus dem, was hineingebaut wird |

**Entscheidung des Nutzers:** D. Die Idee kam vom Nutzer selbst.

### Wie liegt der Zaun im Raster?
| Ansatz | Bewertung |
|---|---|
| **A) Zaun belegt ganze Felder, wie ein Weg (gewählt)** | baut sich wie die Wege aus M1; Bau-Werkzeug und Zusammensetzen der Stücke wiederverwendbar; Besucher brauchen später nur „Feld begehbar ja/nein“; kostet eine Feldreihe Platz |
| B) Zaun auf den Linien zwischen den Feldern | schlanker und realistischer, aber neues Bau-System, kniffliges Zielen, aufwendigere Wegfindung |
| C) Frei gezogene Linie ohne Raster | ausgeschlossen: Laut `GAME_DESIGN.md` rastet alles auf dem Raster ein |

**Entscheidung des Nutzers:** A.

### Wie kommen Lieferungen durch den Zaun?
**Vorschlag von Claude, vom Nutzer bestätigt:** zwei Durchgangsarten, Besucher-Schleuse (nur zu Fuß) und Personal-Tor (Personal und Lieferwagen, ein Weg darf hindurchführen).

## 6. Entscheidungen

**Vom Nutzer getroffen:**
- Bereiche entstehen durch Zäune, nicht durch Markieren.
- Bühnengelände: Zaun mit Besucher-Schleuse. Backstage: Zaun, nur Mitarbeiter haben Zutritt.
- Zaun belegt ganze Felder (Ansatz A).
- Zwei Durchgangsarten: Besucher-Schleuse und Personal-Tor.

**Von Claude festgelegt (bitte beim Lesen prüfen):**
- Der Campingplatz ist die offene Wiese außerhalb der Zäune.
- Das Spiel prüft in M2 nicht, ob ein Zaun geschlossen ist.
- Zaun wird genauso gebaut wie Wege (L-Form, R, Rechtsklick, Klick für ein Feld).
- Durchgänge sind ein Feld breit, werden per Klick gesetzt, brauchen Zaun auf zwei gegenüberliegenden Seiten und richten sich von selbst aus.
- Weg und Zaun schließen sich gegenseitig aus. Nur ein Tor erlaubt einen Weg. Ein Tor wird nie automatisch gesetzt, sondern immer vom Spieler.
- Schleuse und Tor lassen sich ineinander umwandeln (Schleuse nur ohne Weg darunter).
- Abreißen entfernt alles auf den Feldern.
- Vorschau zeigt nicht erlaubte Felder rot.
- Zäune und Durchgänge sind kostenlos.
- Werkzeugleiste mit sechs Schaltflächen: Ansehen, Weg, Zaun, Schleuse, Tor, Abreißen.

**Beim Gegenlesen von Claude entschieden (Einzelheiten):**
- Wird ein Zaunfeld neben einem Durchgang abgerissen, bleibt der Durchgang stehen, auch wenn er dann nur noch auf einer Seite Zaun hat. Er wird nicht automatisch entfernt. Die Regel „Zaun auf zwei gegenüberliegenden Seiten“ gilt nur beim Setzen.
- Ein Durchgang darf auch zwischen zwei Durchgängen liegen. So lassen sich mehrere Durchgänge nebeneinander setzen, etwa eine Schleuse neben einem Tor.
- Ein Feld mit Zaun links und rechts **und** oben und unten (Kreuzung) ist für Durchgänge nicht erlaubt, weil die Richtung unklar wäre.
- Ein Klick mit Schleuse oder Tor auf einen Durchgang derselben Art tut nichts.
- Zieht man einen Zaun über einen vorhandenen Durchgang, bleibt der Durchgang unverändert. Das Feld zählt als „nichts zu tun“ (nicht rot), weil er schon Teil des Zauns ist.
- Abreißen eines Tores mit Weg darunter entfernt beides (entspricht „alles entfernen“).
- Die Ecke-drehen-Einstellung (R) gilt gemeinsam für Weg und Zaun, wie bisher eine einzige Einstellung.
- Entf schaltet wie bisher zwischen Abreißen und dem Werkzeug davor um, auch von Zaun, Schleuse und Tor aus.

## 7. Aufbau (technischer Rahmen)

Logik und Darstellung bleiben getrennt wie in M1.

| Modul (Vorschlag) | Aufgabe |
|---|---|
| `src/building/grid.ts` | Bekommt eine zweite Ebene pro Feld für **Bauten**: nichts, Zaun, Schleuse, Tor. Die Boden-Ebene (Wiese/Weg) bleibt. Abfragen wie „ist Zaun?“, „welcher Durchgang?“. Meldet wie bisher geänderte Felder. Später kommt hier eine Abfrage „Darf Besucher/Personal/Fahrzeug dieses Feld betreten?“ dazu (nicht Teil von M2, aber das Modell muss sie leicht möglich machen). |
| `src/building/rules.ts` (neu) | Die Bauregeln aus Abschnitt 2, Punkte 4 und 5: Darf hier Weg, Zaun, Schleuse oder Tor hin? Welche Ausrichtung hat ein Durchgang? So werden Vorschau und Bauen aus derselben Regel berechnet und können nicht auseinanderlaufen. |
| `src/building/autotile.ts` | Zusätzlich die Zaunstücke: Welche der vier Nachbarn sind Zaun oder Durchgang? (16 Varianten) |
| `src/building/buildTool.ts` | Neue Werkzeuge `fence`, `gate-visitor`, `gate-staff` (Namen frei). Zaun nutzt das L-Ziehen, Durchgänge setzen per Klick. Vorschau unterscheidet „wird gebaut“ und „nicht erlaubt“. |

**Darstellung:**
- `WorldScene` bekommt eine eigene Kartenebene für Bauten (Zäune und Durchgänge) über der Wege-Ebene. Ein Tor wird über dem Weg gezeichnet, sodass man sieht, dass der Weg hindurchführt.
- Platzhalter-Grafiken in `src/assets/placeholders.ts`: 16 Zaunstücke (z. B. Holzpfosten mit Latten, warm und gemütlich), Schleuse und Tor jeweils waagrecht und senkrecht (4 Kacheln, gut voneinander unterscheidbar), dazu eine rote Vorschau-Kachel für „nicht erlaubt“.
- `UIScene` und `src/ui/hints.ts`: sechs Schaltflächen und Hinweistexte.

## 8. Fertig, wenn …

1. `npm ci`, `npm test` und `npm run build` laufen ohne Fehler; die neue Logik hat Tests.
2. Der Check-Workflow zeigt im Pull Request ✓, nach dem Merge läuft der Deploy durch.
3. Auf `https://jeanius93.github.io/Festival-Tycoon/`:
   - Mit „Zaun“ lässt sich ein Zaun in L-Form ziehen, die Stücke verbinden sich an Ecken und T-Stücken.
   - Mit „Schleuse“ und „Tor“ lassen sich Durchgänge in einen geraden Zaun setzen. Sie zeigen in die richtige Richtung und sehen unterschiedlich aus.
   - Ein Weg lässt sich durch ein Tor bauen, aber nicht durch Zaun oder Schleuse.
   - Die Vorschau zeigt nicht erlaubte Felder rot, und das Ergebnis entspricht der Vorschau.
   - Abreißen entfernt Zäune, Durchgänge und Wege.
   - Alles aus M1 funktioniert weiter (Kamera, Zoom, Wege, Werkzeugleiste, kein Bauen beim Klick auf die Leiste).
4. Der Nutzer hat es am PC-Browser ausprobiert.
5. `CLAUDE.md` (Projektstand) und `GAME_DESIGN.md` sind aktualisiert.

## 9. Änderungen an der Vision (`GAME_DESIGN.md`)

Werden zusammen mit diesem Design-Dokument eingetragen:
- **1.1 Aufbau des Geländes:** Die Bereiche entstehen durch Zäune und Durchgänge, nicht durch Markieren. Bühnengelände und Backstage sind eingezäunt, der Campingplatz ist die offene Wiese. Tagesrhythmus der Gäste (Camping nachts und morgens, Bühne nachmittags bis nachts) und Personal, das im Backstage schläft und überall arbeitet.
- **Neuer Abschnitt 1.3 Zäune und Durchgänge:** Besucher-Schleuse (Gäste und Personal zu Fuß) und Personal-Tor (Personal und Lieferwagen, Weg darf hindurch).
- **Meilenstein M2** heißt „Geländebereiche: Zäune, Besucher-Schleusen und Personal-Tore“.

## 10. Dem Umsetzer überlassen

- genaues Aussehen und Farben der Zaun-, Schleusen- und Tor-Platzhalter (warm, gemütlich, gut unterscheidbar)
- wie die Vorschau „nicht erlaubt“ genau aussieht (Hauptsache rot und klar anders als „wird gebaut“)
- Maße der Werkzeugleiste mit sechs Schaltflächen, solange sie bei der kleinsten Fenstergröße (320 × 180 Spielpixel) passt und lesbar bleibt
- ob es Tasten für die neuen Werkzeuge gibt (W, A, S, D, R, G, Entf, Esc und später Leertaste, 1/2/3 sind belegt)
- genaue Modul-, Klassen- und Werkzeugnamen, solange Logik und Darstellung getrennt bleiben
