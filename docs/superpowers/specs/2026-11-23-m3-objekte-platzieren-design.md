# Design: M3 – Objekte platzieren (Bühne, Stände, Klo)

**Datum:** 2026-11-23
**Meilenstein:** M3 (siehe `GAME_DESIGN.md`, Abschnitt 11)
**Status:** Entwurf, wartet auf Freigabe durch den Nutzer

---

## 1. Ziel und Hintergrund

Bis M2 gibt es Wege, Zäune und Durchgänge. In M3 kommen die ersten richtigen Festival-Bauten auf das Gelände: **Bühne, verschiedene Stände und Klos**. Man wählt sie aus einem **Bau-Menü**, sieht unter der Maus eine Vorschau, dreht sie mit **R** und bezahlt sie aus einer **Kasse**.

Wichtig für den Nutzer:
- **Viele verschiedene Stände**: Essen in mehreren Sorten, Bier, Merch und so weiter. Verschiedene Essenssorten sollen später (M4) die Zufriedenheit der Gäste heben.
- **Ein Bau-Menü**, das alles ordnet: Wege und Zäune, Bühnen, Stände, Sanitär.
- **Belieferung von hinten:** Jedes Gebäude hat eine Vorderseite (für die Gäste) und eine Rückseite (für die Lieferung). An die Rückseite muss ein Weg führen. Deshalb ist das Drehen wichtig.
- **Phasen und Wachstum:** Das Spiel gliedert sich in Planung, Bau, Festival und Abbau, und das Festival wächst von Jahr zu Jahr. Die Phasen kommen erst in M6, aber M3 muss so gebaut sein, dass sie sich leicht einfügen lassen.

In M3 läuft noch niemand herum. Die Stände stehen nur da. Ab M4 suchen Besucher sie auf, und dann zählt auch, ob ein Stand beliefert wird.

## 2. Ziele

1. **Bau-Menü** mit zwei Ebenen. Unten liegt die Hauptleiste mit **Ansehen · Wege & Zäune · Bühnen · Stände · Sanitär · Abreißen**. Ein Klick auf eine Kategorie öffnet darüber eine **Unterleiste** mit ihren Einträgen:
   - **Wege & Zäune:** Weg, Zaun, Schleuse, Tor (die Werkzeuge aus M1 und M2, unverändert in ihrer Bedienung)
   - **Bühnen:** Bühne
   - **Stände:** Bierstand, Pommes, Bratwurst, Pizza, Merch
   - **Sanitär:** Dixi-Klo
   Bei Gebäuden zeigt jeder Eintrag **Name und Preis**. Ansehen und Abreißen wirken direkt, ohne Unterleiste.
2. **Gebäude in M3** (Größe = Breite × Tiefe in Feldern, wenn die Rückseite nach oben zeigt; Preise sind Startwerte und werden in M5 abgestimmt):

   | Gebäude | Kategorie | Größe | Preis |
   |---|---|---|---|
   | Bühne | Bühnen | 6 × 4 | 4 000 € |
   | Bierstand | Stände | 3 × 2 | 600 € |
   | Pommes | Stände | 3 × 2 | 400 € |
   | Bratwurst | Stände | 3 × 2 | 400 € |
   | Pizza | Stände | 3 × 2 | 500 € |
   | Merch-Stand | Stände | 3 × 2 | 500 € |
   | Dixi-Klo | Sanitär | 1 × 1 | 150 € |

   Neue Gebäude lassen sich später ergänzen, indem man nur einen Eintrag in einer Liste (Katalog) hinzufügt.
3. **Platzieren:** Mit einem gewählten Gebäude zeigt die Vorschau seine ganze Grundfläche unter der Maus. Die Maus liegt dabei auf der Mitte des Gebäudes. Ein **Linksklick** stellt es hin. Das Werkzeug bleibt danach aktiv, sodass man gleich das nächste hinstellen kann. **Rechtsklick** wechselt zu „Ansehen“ (wie bei Schleuse und Tor).
4. **Drehen mit R** in vier Richtungen. Die Rückseite zeigt nach oben, rechts, unten oder links. Bei seitlicher Ausrichtung tauschen Breite und Tiefe. Die zuletzt gewählte Richtung bleibt beim nächsten Gebäude erhalten. In den Werkzeugen Weg und Zaun dreht R weiterhin die Ecke der L-Form.
5. **Wo gebaut werden darf:** Nur wenn **alle** Felder der Grundfläche auf dem Grundstück liegen und freie Wiese sind, also ohne Weg, Zaun, Durchgang oder anderes Gebäude. Ob innerhalb oder außerhalb eines Zauns, ist egal. Wofür ein Bereich da ist, ergibt sich aus dem, was man hineinstellt (wie in M2 vereinbart).
6. **Vorschau:** Grundfläche hell, wenn erlaubt; komplett rot, wenn nicht erlaubt (mindestens ein Feld belegt oder außerhalb, oder zu wenig Geld). Die Vorschau zeigt erkennbar, **wo die Rückseite ist**. Bei zu wenig Geld steht im Hinweistext „Zu teuer“.
7. **Belieferung (vom Nutzer gewählt: Bauen erlaubt, mit Warnung):** Ein Gebäude gilt als **beliefert**, wenn mindestens ein Feld direkt hinter seiner Rückseite (außerhalb der Grundfläche, entlang der ganzen Rückseite) ein Weg ist. Ein Weg durch ein Personal-Tor zählt mit. Gebäude ohne Lieferweg bekommen ein gut sichtbares **Warnsymbol** (z. B. rotes Lieferwagen-Symbol). Es verschwindet sofort, wenn ein passender Weg gebaut wird, und erscheint wieder, wenn er abgerissen wird. Gebaut werden darf auch ohne Lieferweg.
8. **Kasse:** Start mit **10 000 €**, oben rechts dauerhaft angezeigt („Kasse: 10 000 €“). Jedes Gebäude kostet beim Hinstellen seinen Preis. Mit zu wenig Geld lässt es sich nicht bauen. Die Kasse wird nie negativ. **Wege, Zäune und Durchgänge bleiben in M3 kostenlos.**
9. **Abreißen (bestehendes Werkzeug):** Berührt der gezogene Bereich auch nur ein Feld eines Gebäudes, wird **das ganze Gebäude** abgerissen. Die Vorschau zeigt dann die ganze Grundfläche als Abriss. Abreißen erstattet **den vollen Preis** (vom Nutzer gewählt). Wege, Zäune und Durchgänge im Bereich werden wie bisher entfernt.
10. **Wechselwirkung mit Wegen und Zäunen:** Weg, Zaun, Schleuse und Tor lassen sich nicht auf Gebäudefelder bauen. In der Vorschau sind diese Felder rot, beim Ziehen werden sie übersprungen (wie bisher bei verbotenen Feldern).
11. **Tests:** Die neue Logik (Katalog, Grundfläche je Richtung, Bauregel, Belieferung, Kasse, Abreißen mit Erstattung, Bau-Werkzeug im Gebäude-Modus) liegt wie bisher in Phaser-freien Modulen und wird mit Vitest getestet.
12. **`GAME_DESIGN.md` und `CLAUDE.md`** werden aktualisiert (siehe Abschnitt 9).

## 3. Nicht-Ziele (kommt später)

- **Besucher, Warteschlangen, Zufriedenheit, Vorrat und echte Lieferungen** (M4 und später). In M3 ist „beliefert“ nur eine Anzeige.
- **Einnahmen, Preise für Wege und Zäune, laufende Kosten, Geldverlauf** (M5).
- **Phasen** (M6): In M3 kann man jederzeit bauen und abreißen. Regeln wie „Bauen nur in der Bau-Phase“ oder „Einlagern statt Abreißen“ kommen in M6.
- **Gebäude anklicken für Infos**, Gebäude verschieben, mehrere Gebäude auf einmal ziehen.
- **Freier Platz vor der Theke** wird nicht erzwungen (das klärt sich mit den Warteschlangen in M4).
- **Weitere Gebäude** (Getränkestand, Duschen, Zeltplatz, Künstlerzelt …) – leicht über den Katalog nachrüstbar.
- **Speichern/Laden** (M9), **echte Grafiken** (M10).

## 4. Anti-Ziele (das wäre ein Fehlschlag, selbst wenn es technisch läuft)

- Die Vorschau zeigt etwas anderes, als beim Klick tatsächlich gebaut wird (Lage, Größe, Richtung, erlaubt/nicht erlaubt).
- Man erkennt an einem Gebäude nicht, wo vorne und hinten ist, in keiner der vier Richtungen.
- Die Kasse wird negativ, oder Abreißen erstattet einen anderen Betrag, als bezahlt wurde.
- Ein Weg oder Zaun liegt in einem Gebäude, oder zwei Gebäude überlappen.
- Das Warnsymbol stimmt nicht: Es fehlt, obwohl kein Lieferweg da ist, oder es bleibt stehen, obwohl einer da ist.
- Wege, Zäune, Durchgänge, Kamera und Zoom aus M1/M2 funktionieren schlechter als vorher.
- Das Menü passt bei der kleinsten Fenstergröße (320 × 180 Spielpixel) nicht mehr oder ist unlesbar.
- Das Datenmodell ist so gebaut, dass Besucher in M4 nicht einfach fragen können: „Wo sind alle Bierstände, und ist dieser beliefert?“

## 5. Ansätze

### Wie werden Gebäude gespeichert und gezeichnet?
| Ansatz | Bewertung |
|---|---|
| **A) Gebäude als eigene Objekte (gewählt)** | Eine Liste aller Gebäude (Art, Position, Richtung, Kennnummer). Jedes belegte Feld merkt sich nur, zu welchem Gebäude es gehört. Gezeichnet wird jedes Gebäude als ein Bild. Besucher, Vorrat, Warteschlange und Einlagern lassen sich in M4–M6 direkt anhängen. Etwas mehr Arbeit. |
| B) Gebäude als Kachel-Puzzle wie die Wege | Passt zur bisherigen Bauweise und ist schnell gebaut. Das Spiel weiß aber nicht, dass sechs Felder *ein* Stand sind, und das müsste man in M4 mühsam nachbauen. Gedrehte Gebäude brauchen viele Einzelstücke. |
| C) Frei platzierte Bilder ohne Raster | Ausgeschlossen: Laut `GAME_DESIGN.md` rastet alles auf dem Raster ein. |

**Entscheidung des Nutzers:** A.

### Was passiert ohne Lieferweg an der Rückseite?
| Ansatz | Bewertung |
|---|---|
| **A) Bauen erlaubt, Warnsymbol (gewählt)** | Man kann erst bauen und dann den Weg ziehen. Entspricht der Vision („schlecht oder gar nicht beliefert“). |
| B) Bauen nur mit Weg hinten | Man kann nichts vergessen, muss aber immer zuerst den Weg legen. |

**Entscheidung des Nutzers:** A.

### Wie viel bringt Abreißen zurück?
| Ansatz | Bewertung |
|---|---|
| **A) Voller Preis (gewählt)** | Großzügig zum Ausprobieren. Die echten Abbau-Regeln (Einlagern, Verkaufen) kommen in M6. |
| B) Halber Preis | Mehr Tycoon-Gefühl, aber jeder Baufehler kostet Geld, und M6 würde die Regel ohnehin neu festlegen. |

**Entscheidung des Nutzers:** A.

## 6. Entscheidungen

**Vom Nutzer getroffen:**
- Verschiedene Stände: Essen in mehreren Sorten, Bier, Merch und so weiter.
- Es gibt ein Bau-Menü für Gebäude, Wege und so weiter.
- Die Belieferung erfolgt über die Rückseite der Gebäude.
- Ohne Lieferweg darf gebaut werden, es erscheint eine Warnung.
- Gebäude werden als eigene Objekte gespeichert (Ansatz A).
- Abreißen erstattet den vollen Preis.
- Phasen und Wachstum sind zentral (Umsetzung in M6/M7; M3 bereitet sie vor).

**Von Claude festgelegt (bitte beim Lesen prüfen):**
- Gebäudeliste, Größen und Preise wie in der Tabelle in Abschnitt 2.
- Menü-Kategorien: Ansehen · Wege & Zäune · Bühnen · Stände · Sanitär · Abreißen. Merch steht bei den Ständen.
- Alle Gebäude haben eine Rückseite, auch Bühne (Technik) und Klo (Abpumpwagen).
- Beliefert ist ein Gebäude, wenn mindestens ein Wegfeld direkt an der Rückseite anliegt.
- Gebäude nur auf freier Wiese, egal ob innerhalb oder außerhalb eines Zauns.
- Startkasse 10 000 €; Wege, Zäune und Durchgänge kosten in M3 nichts.
- Ein Klick stellt ein Gebäude hin, das Werkzeug bleibt aktiv; Rechtsklick geht zu „Ansehen“.
- R dreht Gebäude in vier Richtungen; die Richtung bleibt für das nächste Gebäude erhalten.
- Abreißen entfernt immer das ganze Gebäude, auch wenn nur ein Feld berührt wird.

**Beim Gegenlesen von Claude entschieden (Einzelheiten):**
- Jedes Gebäude merkt sich den bezahlten Preis. Abreißen erstattet genau diesen Betrag, auch wenn sich die Katalogpreise in M5 ändern.
- Ein Personal-Tor ohne Weg darunter zählt nicht als Lieferweg, nur der Weg selbst zählt.
- Ist ein Platz belegt **und** zu teuer, nennt der Hinweis zuerst „belegt“, weil man dort auch mit genug Geld nicht bauen könnte.
- Abreißen behält die bisherige Bedienung (Ziehen in L-Form).

## 7. Aufbau (technischer Rahmen)

Logik und Darstellung bleiben getrennt wie in M1 und M2.

| Modul (Vorschlag) | Aufgabe |
|---|---|
| `src/building/catalog.ts` (neu) | Katalog aller Gebäudearten: Kennung, Name, Kategorie, Größe, Preis, Platzhalterfarbe. Ein neuer Stand ist ein neuer Eintrag. |
| `src/building/grid.ts` | Bekommt eine dritte Ebene pro Feld: **Gebäude-Kennnummer** (0 = keines). Dazu die Gebäudeliste (Art, linke obere Ecke, Richtung, Kennnummer) und Abfragen wie „Gebäude auf diesem Feld?“ und „alle Gebäude (einer Art)“. Ob die Liste im Grid oder in einem eigenen Modul liegt, entscheidet der Umsetzer; wichtig ist, dass Änderungen wie bisher gemeldet werden. |
| `src/building/placement.ts` (neu) | Grundfläche eines Gebäudes je Richtung und Mausposition, Felder hinter der Rückseite, Bauregel für Gebäude („erlaubt / belegt / zu teuer“), Prüfung „beliefert?“. Vorschau und Bauen nutzen dieselbe Regel. |
| `src/building/rules.ts` | Weg, Zaun und Durchgänge sind auf Gebäudefeldern nicht erlaubt. |
| `src/building/buildTool.ts` | Neuer Werkzeug-Modus „Gebäude bauen“ mit gewählter Gebäudeart und Richtung. Klick baut (über die Kasse), Abreißen erkennt Gebäude und erstattet den Preis. Vorschau liefert Grundfläche, Rückseite und erlaubt/nicht erlaubt. |
| `src/economy/cash.ts` (neu) | Die Kasse: Kontostand, „reicht das Geld?“, abbuchen, erstatten, Änderungen melden. Wird in M5 zur richtigen Wirtschaft ausgebaut. |
| `src/ui/…` | Menü-Aufbau (Kategorien, Einträge, Beschriftungen, Hinweistexte) als Daten, Phaser-frei und testbar. |

**Darstellung:**
- `WorldScene` zeichnet jedes Gebäude als **ein Bild** über Wegen und Zäunen. Platzhalter werden in `src/assets/placeholders.ts` per Code erzeugt: je Gebäudeart vier Richtungen oder ein Bild, das um 90° gedreht wird, solange vorne und hinten in jeder Richtung klar erkennbar sind (z. B. Theke mit Markise vorne, dunkle Lieferklappe hinten; Bühne mit Bühnenrand vorne und Technikbereich hinten).
- Die Arten sollen sich auch als Platzhalter unterscheiden lassen (Farbe und ein einfaches Symbol oder Kürzel).
- Warnsymbol „nicht beliefert“ über dem Gebäude.
- Vorschau: ganze Grundfläche hell oder rot, Rückseite markiert.
- `UIScene`: Hauptleiste, Unterleiste und Kassen-Anzeige oben rechts. Der Hinweistext sitzt über der obersten sichtbaren Leiste.

## 8. Fertig, wenn …

1. `npm ci`, `npm test` und `npm run build` laufen ohne Fehler; die neue Logik hat Tests.
2. Der Check-Workflow zeigt im Pull Request ✓, nach dem Merge läuft der Deploy durch.
3. Auf `https://jeanius93.github.io/Festival-Tycoon/`:
   - Das Menü zeigt die sechs Kategorien; die Unterleisten öffnen sich und zeigen Namen und Preise.
   - Bühne, alle fünf Stände und das Dixi-Klo lassen sich hinstellen und mit R in vier Richtungen drehen. Vorne und hinten sind immer erkennbar.
   - Auf Wege, Zäune, Durchgänge und andere Gebäude lässt sich nichts stellen; die Vorschau ist dann rot.
   - Die Kasse sinkt beim Bauen und steigt beim Abreißen um denselben Betrag; mit zu wenig Geld ist die Vorschau rot und zeigt „Zu teuer“.
   - Ohne Weg an der Rückseite erscheint das Warnsymbol; ein Weg dahinter lässt es verschwinden.
   - Alles aus M1 und M2 funktioniert weiter (Kamera, Zoom, Wege, Zäune, Schleusen, Tore, kein Bauen beim Klick aufs Menü).
4. Der Nutzer hat es am PC-Browser ausprobiert.
5. `CLAUDE.md` (Projektstand) und `GAME_DESIGN.md` sind aktualisiert.

## 9. Änderungen an der Vision (`GAME_DESIGN.md`)

Werden zusammen mit diesem Design-Dokument eingetragen:
- **1.2 Wege:** Gebäude haben eine Vorderseite für die Gäste und eine Rückseite für die Lieferung. Beliefert wird über einen Weg an der Rückseite.
- **5. Steuerung:** R dreht Gebäude (und beim Ziehen von Wegen und Zäunen die Ecke).
- **Neu: Bau-Menü** mit Kategorien (Wege & Zäune, Bühnen, Stände, Sanitär …).
- **7. Besucher-Simulation:** Verschiedene Essenssorten heben die Zufriedenheit (Abwechslung).
- **11. Meilensteine, M3:** „Objekte platzieren: Bau-Menü, Bühne, Bier-, Essens- und Merch-Stände, Dixi-Klo (mit Vorschau, Drehen, Lieferseite, Kasse und Kosten)“.

## 10. Dem Umsetzer überlassen

- genaues Aussehen der Platzhalter, des Warnsymbols und der Rückseiten-Markierung in der Vorschau
- welche Zelle bei Gebäuden mit gerader Breite oder Tiefe „die Mitte“ unter der Maus ist (Hauptsache gleichbleibend und vorhersehbar)
- Maße und Anordnung von Haupt- und Unterleiste, solange sie bei 320 × 180 Spielpixeln passen und lesbar bleiben
- ob ein erneuter Klick auf die offene Kategorie die Unterleiste schließt
- ob beim Bauen kurz „−600 €“ aufsteigt
- ob es Tasten für Kategorien gibt (W, A, S, D, R, G, Entf, Esc und später Leertaste, 1/2/3 sind belegt)
- genaue Modul-, Klassen- und Typnamen, solange Logik und Darstellung getrennt bleiben
