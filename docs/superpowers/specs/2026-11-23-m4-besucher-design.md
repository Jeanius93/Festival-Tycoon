# Design: M4 – Besucher (Anreise, Zeltplatz, Bedürfnisse)

**Datum:** 2026-11-23
**Meilenstein:** M4 (siehe `GAME_DESIGN.md`, Abschnitt 11)
**Status:** Entwurf, wartet auf Freigabe durch den Nutzer

---

## 1. Ziel und Hintergrund

Bis M3 kann man ein Festivalgelände bauen: Wege, Zäune, Durchgänge, Bühne, Stände, Klos. Aber niemand ist da. In M4 **wird das Festival lebendig**: Gäste reisen mit dem Auto über eine Zufahrtsstraße an, schlagen ihr Zelt auf einer **Zeltfläche** auf, die der Spieler vorher festgelegt hat, und laufen von dort zu Bühne, Ständen und Klos.

Wichtig für den Nutzer:
- **Der Campingplatz gehört zur Spielwelt.** Dort stehen Zelte und Autos der Gäste. Von dort kommen die Gäste aufs Festival.
- **Die Gäste kommen über eine Zufahrtsstraße.** Der Spieler legt die Zeltfläche fest, bevor das Festival beginnt.
- **Der Spieler soll merken, was den Gästen fehlt** (Denkblasen und eine Gesamtanzeige), und daraufhin umbauen.
- **Fehler haben Folgen:** Sehr unzufriedene Gäste fahren früher heim.
- **Personal** (Putzhilfen, Techniker, Security) ist dem Nutzer wichtig, kommt aber wie geplant in **M8**. M4 wird so gebaut, dass Personal später dieselbe Wegsuche nutzen kann (auch durch Personal-Tore).

## 2. Ziele

### 2.1 Zufahrtsstraße
1. Am **unteren Rand** des Grundstücks verläuft eine **feste Landstraße**, die der Spieler nicht baut und nicht abreißen kann. Sie liegt außerhalb des Grundstücks im Gebüsch-Streifen (`BORDER_TILES` = 3 Felder) und ist auf ganzer Breite sichtbar.
2. Ein **Weg auf der untersten Feldreihe** des Grundstücks gilt als **an die Straße angeschlossen**. Autos fahren von der Straße auf diesen Weg.

### 2.2 Zeltfläche
3. Neues Werkzeug **„Zeltfläche“** in der Unterleiste **„Wege & Zäune“** (die Hauptleiste ist bei 320 Spielpixeln Breite mit sechs Knöpfen voll).
4. **Aufziehen:** Linke Maustaste gedrückt halten und ziehen spannt ein **Rechteck** auf (nicht die L-Form der Wege). Beim Loslassen werden alle Felder des Rechtecks markiert. Vorschau wie bisher (hell = wird markiert, rot = geht nicht). Rechtsklick bricht ab.
5. **Was eine Zeltfläche ist:** eine **Markierung auf dem Boden** (eigene Ebene pro Feld), sichtbar z. B. als leicht andere Wiese mit Absperrband am Rand. Sie verdrängt nichts:
   - Markiert werden dürfen nur Felder **ohne Zaun, Durchgang und Gebäude**. Felder mit Weg dürfen markiert werden.
   - **Auf** markierten Feldern dürfen weiterhin Wege und Gebäude gebaut werden (z. B. Dixi-Klos auf dem Campingplatz), aber **nicht dort, wo gerade ein Zelt oder Auto steht**. Zäune und Durchgänge dürfen nicht auf markierte Felder.
6. **Kosten:** Die Zeltfläche ist in M4 **kostenlos** (wie Wege und Zäune). Pacht und Kosten kommen in M5.
7. **Abreißen:** Das bestehende Abreißen-Werkzeug entfernt auch die Markierung auf den berührten Feldern. Felder, auf denen gerade ein Zelt oder Auto steht, werden dabei übersprungen.
8. **Stellplätze:** Ein Stellplatz ist ein Quadrat aus **2 × 2 markierten Feldern**, das frei ist (kein Weg, kein Gebäude, kein anderer Stellplatz). Darauf stehen **ein Zelt und ein Auto** nebeneinander. Je größer die Zeltfläche, desto mehr Stellplätze. Wie die Stellplätze auf der Fläche verteilt werden, entscheidet der Umsetzer (z. B. dicht von der Zufahrt her auffüllen).
9. **Anschluss:** Eine Zeltfläche (eine zusammenhängende markierte Fläche) ist **angeschlossen**, wenn mindestens ein Weg-Feld in ihr liegt oder direkt an sie grenzt **und** dieser Weg über Wege mit der Straße verbunden ist (durch Personal-Tore hindurch, siehe 2.3). Nicht angeschlossene Zeltflächen zeigen ein **Warnschild** (wie das Lieferwagen-Symbol aus M3), und auf ihnen kommt niemand an. Das Warnschild aktualisiert sich sofort beim Bauen und Abreißen.

### 2.3 Autos
10. Autos fahren **nur auf Wegen**: von der Straße über das Wegenetz bis zum Weg-Feld an ihrer Zeltfläche. Das **letzte Stück** über die markierte Wiese bis zum Stellplatz fahren sie direkt (wie auf einem echten Zeltplatz).
11. Wege führen wie bisher nur über **Personal-Tore** durch Zäune; Autos fahren dort durch.
12. Ein Auto bringt **2 Gäste**. Es parkt auf seinem Stellplatz neben dem Zelt und **bleibt dort bis zur Abreise**.
13. Autos stoßen nicht zusammen; sie dürfen sich beim Fahren überlappen.
14. Die Wegsuche für Autos ist so gebaut, dass später auch **Lieferwagen** und **Personal** sie nutzen können.

### 2.4 Spieluhr, Start und Ende
15. Neuer Knopf **„Festival starten“** oben in der Leiste. Vorher steht die Uhr; man baut in Ruhe. Der Knopf ist ein Platzhalter für die Phasen in M6.
16. **Spieluhr** oben, z. B. **„Tag 1 · 14:00“**. Das Festival beginnt an **Tag 1 um 10:00** und dauert **3 Festivaltage**. An **Tag 4 um 10:00** reisen alle Gäste ab.
17. **Geschwindigkeit:** **Leertaste** = Pause/weiter, **1 / 2 / 3** = normal / doppelt / vierfach. Startwert: **1 Spielstunde = 20 Sekunden** bei Stufe 1 (ein Festival dauert dann etwa 24 Minuten, bei Stufe 3 etwa 6). Die Anzeige zeigt Pause und Stufe. Bedienung in M4 nur per Tastatur (laut Vision zuerst Maus und Tastatur; Touch und Controller kommen später).
    - Ohne angeschlossenen freien Stellplatz ist „Festival starten“ nicht drückbar und der Hinweis sagt, warum (z. B. „Keine Zeltfläche an der Straße“).
18. **Anreise:** Nach dem Start kommen Autos **nach und nach** (über den ersten Festivaltag verteilt, etwa bis 18:00), bis alle Stellplätze auf angeschlossenen Zeltflächen belegt sind oder **300 Gäste** da sind (Höchstzahl, passend zur Wachstumsstufe „Dorffest“). Wird später neue Zeltfläche angeschlossen, kommen noch Gäste dazu, solange die Anreisezeit läuft.
19. **Abreise:** Gäste gehen zu ihrem Zelt, Zelt verschwindet, das Auto fährt über die Wege zur Straße und verschwindet dort.
20. **Ende:** Wenn alle abgereist sind, erscheint eine **Zusammenfassung**: Anzahl Gäste, durchschnittliche Zufriedenheit am Ende, wie viele früher abgereist sind. Danach ist alles wieder im Bauzustand (Zeltflächen bleiben, Zelte und Autos sind weg), und man kann **erneut starten**.
21. Während des Festivals darf man **weiter bauen und abreißen** (außer auf Zelten/Autos, siehe 2.2). Gäste, die auf einem Feld stehen, das plötzlich blockiert ist, weichen auf das nächste freie Feld aus.

### 2.5 Gäste: Laufen
22. Gäste sind kleine Pixel-Figuren und laufen **frei über das Gelände**: über Wiese, Wege, Zeltflächen und durch **Besucher-Schleusen**. **Nicht** durch Zäune, Personal-Tore und Gebäude. Zelte und Autos dürfen sie durchlaufen (vereinfachend).
23. Wegfindung mit **Wegweiser-Karten** (Ansatz A, siehe Abschnitt 5): Für jede Angebotsart gibt es eine Karte „Schritte bis zum nächsten erreichbaren, offenen Angebot dieser Art“. Gäste folgen ihr. Die Karten werden neu berechnet, wenn sich am Gelände etwas ändert (und regelmäßig wegen der Schlangen, siehe 27).
24. Für Wege zu **einem bestimmten Ziel** (das eigene Zelt) nutzt jeder Gast eine eigene Wegsuche.

### 2.6 Gäste: Bedürfnisse und Angebote
25. Jeder Gast hat diese Bedürfnisse:

    | Bedürfnis | Wird erfüllt durch |
    |---|---|
    | Durst | Bierstand |
    | Hunger | Pommes, Bratwurst, Pizza (Abwechslung macht glücklicher: dieselbe Sorte mehrmals hintereinander bringt weniger) |
    | Klo | Dixi-Klo |
    | Musik | Bühne, während sie spielt |
    | Schlaf | das eigene Zelt |
    | Andenken | Merch-Stand (einmal pro Festival, Wunsch kommt irgendwann während des Festivals) |

    Hygiene/Duschen kommt erst, wenn es Duschen gibt.
26. **Tagesrhythmus** (aus der Vision): Nachts schlafen die Gäste im Zelt (etwa 01:00 bis 08:00). Morgens sind sie eher auf dem Campingplatz (Klo, Essen). Nachmittags bis nachts zieht es sie zur Bühne. Die **Bühne spielt von 14:00 bis 01:00**; außerhalb dieser Zeit erfüllt sie kein Musik-Bedürfnis.
27. **Stände:** Ein Gast stellt sich **vor der Vorderseite** an (Schlange nach außen). Bedienen dauert kurz. Eine **lange Schlange zählt in der Wegweiser-Karte wie ein Umweg**, sodass Gäste auf einen anderen Stand ausweichen. Lange Wartezeit senkt die Laune. Eine Schlange hat eine Höchstlänge; ist sie voll, gilt der Stand vorübergehend als nicht erreichbar.
28. **Nicht belieferte Stände** (Warnsymbol aus M3) sind **geschlossen** und tauchen in den Wegweiser-Karten nicht auf. Das gilt für alle Gebäude mit Rückseite, also auch Klos und Bühne.
29. **Bühne:** Zuschauer stellen sich in den Bereich **vor der Bühnenvorderseite** (nicht dahinter, nicht an die Seiten).
30. **Kein Angebot erreichbar:** Gibt es für ein Bedürfnis kein erreichbares, offenes Angebot (z. B. kein Klo, Klo hinter Personal-Tor, Stand ohne Lieferweg), bleibt das Bedürfnis offen, die Denkblase bleibt sichtbar und die Laune sinkt. Der Gast schlendert umher und versucht es später erneut.
31. **Geld:** In M4 bezahlen Gäste nichts. Die Kasse bleibt wie in M3.

### 2.7 Zufriedenheit und Anzeige
32. Jeder Gast hat eine **Zufriedenheit** (0–100 %). Sie steigt, wenn Bedürfnisse erfüllt werden (Abwechslung beim Essen zählt extra) und Musik läuft, und sinkt bei unerfüllten Bedürfnissen und langen Schlangen.
33. **Denkblasen (A):** Über einem Gast erscheint ein kleines Symbol für sein dringendstes offenes Bedürfnis (Bier, Essen, Klo, Note, Zelt/Mond, Merch-Shirt). Sehr unzufriedene Gäste zeigen ein eigenes Symbol (z. B. Gewitterwolke).
34. **Gesamtanzeige (C)** oben: **„Gäste: 84 · Zufriedenheit: 72 %“** (Durchschnitt aller anwesenden Gäste) neben Uhr und Kasse.
35. **Früher Heimfahren:** Fällt die Zufriedenheit eines Gastes für eine gewisse Zeit unter eine Grenze (Startwert: unter 25 % für 2 Spielstunden), reist seine Gruppe ab (Zelt weg, Auto fährt). Der Stellplatz wird frei. Neue Gäste kommen dafür nur nach, solange die Anreisezeit läuft.

### 2.8 Bedienung und Sonstiges
36. **Tastatur:** Leertaste (Pause) und 1/2/3 (Geschwindigkeit) sind neu. Alle bisherigen Tasten bleiben.
37. **Höchstens 300 Gäste**; das Spiel muss dabei auf PC, Handy und MSI Claw flüssig laufen.
38. **Tests:** Die neue Logik liegt wie bisher in Phaser-freien Modulen und wird mit Vitest getestet (siehe Abschnitt 7). Die Simulation nutzt einen **Zufallsgenerator mit festem Startwert**, damit Tests wiederholbar sind.
39. `GAME_DESIGN.md`, `CLAUDE.md` und die Steuerungstabelle in `README.md` werden aktualisiert (siehe Abschnitt 9).

## 3. Nicht-Ziele (kommt später)

- **Personal** (Putzhilfen, Techniker, Security), Bands buchen → M8.
- **Geld von Gästen**, Ticket- und Standpreise, Pacht für Zeltflächen, laufende Kosten → M5.
- **Echte Phasen** (Planung, Vorbereitung, Festivalwoche, Abbau) und Jahresabschluss → M6. Der Knopf „Festival starten“ ist ein Platzhalter.
- **Ruf**, Folgen für das nächste Jahr → M7.
- **Echter Vorrat und Lieferwagen**, die Bier bringen; in M4 heißt „beliefert“ nur „Lieferweg vorhanden“.
- **Gast anklicken** mit Infofenster, **Bewertungen** („Klo-Situation katastrophal, 2/5“) → später.
- **Müll, Dreck, Matsch, Wetter, Ereignisse, Tag-Nacht-Grafik** (es wird nicht dunkel) → M8/M9.
- **Duschen, Wasserstellen, weitere Gebäude** → über den Katalog nachrüstbar.
- **Speichern/Laden** → M9. **Echte Grafiken** → M10.

## 4. Anti-Ziele (das wäre ein Fehlschlag, selbst wenn es technisch läuft)

- Gäste laufen durch Zäune, Personal-Tore oder Gebäude, oder bleiben an Zäunen hängen und finden die Schleuse nicht.
- Gäste laufen zu einem Stand, der geschlossen (nicht beliefert) oder unerreichbar ist, und bleiben dort hängen.
- Autos fahren über die Wiese außerhalb der Zeltfläche oder kommen auf einer nicht angeschlossenen Zeltfläche an.
- Das Warnschild der Zeltfläche stimmt nicht mit der Wirklichkeit überein.
- Man kann nicht erkennen, **was** den Gästen fehlt; die Denkblasen sind zu klein oder flackern ständig.
- Alle Gäste drängen sich an einem Stand, während der gleiche Stand daneben leer ist.
- Das Spiel ruckelt bei 300 Gästen, oder Bauen während des Festivals friert das Spiel kurz ein.
- Geschwindigkeit 3 verändert das Verhalten der Gäste (statt es nur zu beschleunigen).
- Bauen, Abreißen, Kamera, Zoom, Menü und Kasse aus M1–M3 funktionieren schlechter als vorher.
- Ein Festival endet nie (Gäste bleiben hängen und reisen nicht ab), oder nach dem Ende kann man nicht neu starten.

## 5. Ansätze

### Wie finden die Gäste ihren Weg?
| Ansatz | Bewertung |
|---|---|
| **A) Wegweiser-Karten (gewählt)** | Pro Angebotsart eine Karte „Entfernung zum nächsten erreichbaren, offenen Angebot“, berechnet ab allen Angeboten dieser Art gleichzeitig. Gäste folgen ihr bergab. Findet immer das wirklich nächste *erreichbare* Angebot (um Zäune herum, durch Schleusen). Lange Schlangen werden als Zusatz-Entfernung eingerechnet und verteilen die Gäste. 300 Gäste kosten kaum mehr als 10. Für Ziele, die nur ein Gast hat (eigenes Zelt), braucht es zusätzlich eine Einzel-Wegsuche. |
| B) Jeder Gast plant seinen Weg selbst | Flexibel, aber nach jedem Bauen rechnen bis zu 300 Gäste neu (Ruckelgefahr auf Handy/Claw). Der „nächste“ Stand wäre der in Luftlinie, nicht der auf dem Weg nächste. |
| C) Geradeaus laufen ohne Wegsuche | Ausgeschlossen: Gäste blieben an Zäunen hängen und fänden keine Schleuse. |

**Entscheidung des Nutzers:** A.

### Wie legt man die Zeltfläche fest?
| Ansatz | Bewertung |
|---|---|
| **A) Fläche aufziehen (gewählt)** | Rechteck mit der Maus ziehen, dezent markiert. Frei und wie echtes Abstecken. |
| B) Fertige Zeltplatz-Stücke (z. B. 4 × 4) aus dem Bau-Menü | Einfach, aber kantig und unfrei. |
| C) Einzäunen | Passt zur bisherigen Bereichs-Regel, ist aber umständlich und auf Festivals unüblich. |

**Entscheidung des Nutzers:** A.

### Wie kommen die Autos zur Zeltfläche?
| Ansatz | Bewertung |
|---|---|
| **A) Nur über Wege (gewählt)** | Zeltfläche braucht Wegverbindung zur Straße, sonst Warnschild. Passt zu „Wege sind Versorgungsadern“; die Fahrzeug-Wegsuche wird später für Lieferwagen wiederverwendet. |
| B) Quer über die Wiese | Einfacher, aber Wege verlieren an Bedeutung. |

**Entscheidung des Nutzers:** A.

### Wann kommen die Gäste, wie lange bleiben sie?
| Ansatz | Bewertung |
|---|---|
| **A) Knopf „Festival starten“, 3 Tage, dann Abreise (gewählt)** | Anfang und Ende wie ein echtes Festival; M6 ersetzt den Knopf durch Phasen. |
| B) Endlos-Sandkasten | Einfacher, aber ohne Anfang und Ende; M6 müsste es umbauen. |

**Entscheidung des Nutzers:** A.

### Woran merkt man, was den Gästen fehlt?
**Entscheidung des Nutzers:** Denkblasen über den Köpfen **und** Gesamtanzeige oben (A + C). Gast anklicken (B) und Bewertungen (D) kommen später.

### Was passiert mit sehr unzufriedenen Gästen?
**Entscheidung des Nutzers:** Sie fahren früher heim (A), statt nur zu meckern (B).

## 6. Entscheidungen

**Vom Nutzer getroffen:**
- Die Gäste kommen vom Campingplatz; der Campingplatz gehört zur Spielwelt, dort stehen Zelte und Autos.
- Die Gäste kommen über eine Zufahrtsstraße.
- Der Spieler legt die Zeltfläche vor dem Festival fest, durch Aufziehen einer Fläche.
- Autos fahren nur auf Wegen.
- Knopf „Festival starten“, Spieluhr, 3 Festivaltage, danach Abreise.
- Denkblasen und Gesamtanzeige.
- Sehr unzufriedene Gäste fahren früher heim.
- Wegfindung über Wegweiser-Karten.
- Personal gibt es (Putzhilfen, Techniker, Security); es kommt in M8.

**Von Claude festgelegt (bitte beim Lesen prüfen):**
- Personal kommt nicht in M4, sondern wie geplant in M8.
- Die Straße liegt fest am unteren Rand, außerhalb des Grundstücks; angeschlossen ist ein Weg auf der untersten Feldreihe.
- Zeltfläche steht in der Unterleiste „Wege & Zäune“ (Hauptleiste ist voll), wird als Rechteck aufgezogen und kostet nichts.
- Zeltfläche ist eine Bodenmarkierung: Wege und Gebäude (z. B. Klos) dürfen darauf, Zäune nicht.
- Stellplatz = 2 × 2 Felder für Zelt und Auto; 2 Gäste pro Auto; höchstens 300 Gäste.
- Bedürfnisse wie in der Tabelle 2.6; Hygiene erst mit Duschen.
- Uhr: Start Tag 1 10:00, Abreise Tag 4 10:00; 1 Spielstunde = 20 s; Stufen 1×/2×/4×; Bühne spielt 14:00–01:00; Schlaf etwa 01:00–08:00.
- Anreise über den ersten Tag bis etwa 18:00.
- Nicht belieferte Gebäude sind geschlossen.
- Schlangen vor der Vorderseite, lange Schlange zählt als Umweg.
- Gäste zahlen in M4 nichts.
- Früher Heimfahren: unter 25 % für 2 Spielstunden.
- Während des Festivals darf gebaut werden, nur nicht auf Zelten/Autos.
- Gäste dürfen durch Zelte und Autos laufen; Autos stoßen nicht zusammen.
- Nach dem Ende eine Zusammenfassung; Zeltflächen bleiben, man kann neu starten.

**Beim Gegenlesen von Claude entschieden (Einzelheiten):**
- Pause und Geschwindigkeit in M4 nur per Tastatur (Touch/Controller später, wie in der Vision).
- „Festival starten“ geht nur, wenn mindestens ein freier Stellplatz auf einer angeschlossenen Zeltfläche existiert.
- Ein Stellplatz gilt als belegt (nicht bebaubar, nicht abreißbar), sobald er einem anreisenden Auto zugeteilt ist, nicht erst, wenn das Auto dort steht.

Alle Zahlen sind Startwerte; sie dürfen beim Ausprobieren angepasst werden, wenn das Spielgefühl es verlangt (dann im Pull Request erwähnen).

## 7. Aufbau (technischer Rahmen)

Logik und Darstellung bleiben getrennt wie in M1–M3. Die Simulation rechnet in **festen Zeitschritten** (unabhängig von der Bildrate); Geschwindigkeit 2/3 heißt „mehr Schritte pro Sekunde“, nicht „größere Schritte“. So verhalten sich Gäste bei jeder Geschwindigkeit gleich.

| Modul (Vorschlag) | Aufgabe |
|---|---|
| `src/core/clock.ts` (neu) | Spieluhr: Tag, Uhrzeit, Pause, Geschwindigkeit; feste Zeitschritte. |
| `src/core/random.ts` (neu) | Zufallsgenerator mit festem Startwert. |
| `src/building/grid.ts` | Neue Ebene pro Feld: **Zeltflächen-Markierung**. Änderungen werden wie bisher gemeldet. |
| `src/building/rules.ts` | Regeln für Zeltfläche (wo markieren erlaubt) und gegenseitige Regeln mit Zaun, Weg, Gebäude, Zelt. |
| `src/building/buildTool.ts` | Neuer Modus „Zeltfläche“ (Rechteck ziehen); Abreißen entfernt auch Markierungen; Bauen auf Zelten verboten. |
| `src/camping/` (neu) | Zusammenhängende Zeltflächen erkennen, Stellplätze verteilen und vergeben, „angeschlossen?“ prüfen. |
| `src/vehicles/` (neu) | Wegsuche auf dem Wegenetz (inkl. Personal-Tore) von der Straße zu einem Ziel und zurück; Autos fahren lassen. |
| `src/visitors/` (neu) | Wegweiser-Karten (Entfernungskarten pro Angebotsart, mit Schlangen-Zuschlag), Einzel-Wegsuche, Gast (Bedürfnisse, Zufriedenheit, Verhalten), Schlangen an Ständen, Anreise/Abreise, Gesamtsimulation (ein Schritt = alles ein Stück weiter). |
| `src/ui/…` | Texte und Formate für Uhr, Gesamtanzeige, Zusammenfassung; Phaser-frei und testbar. |

Wer was abfragen kann (wichtig für M5–M8):
- „Welche Angebote der Art X gibt es, sind sie offen, wie lang ist die Schlange?“
- „Wie viele Gäste sind da, wie zufrieden im Schnitt?“
- „Ist Feld (x, y) für Gäste / für Fahrzeuge / für Personal begehbar?“ (Personal darf später durch Personal-Tore.)

**Darstellung:**
- Straße am unteren Rand (Platzhalter per Code: Asphalt mit Mittelstreifen).
- Zeltfläche: dezente Markierung (z. B. etwas hellere Wiese, Absperrband am Rand) plus Warnschild, wenn nicht angeschlossen.
- Zelte und Autos als kleine Platzhalter-Bilder (verschiedene Farben, damit es bunt aussieht).
- Gäste als kleine Figuren (Platzhalter, verschiedene Farben), Denkblasen darüber. Bei herausgezoomter Ansicht müssen die Denkblasen noch erkennbar sein.
- `UIScene`: oben Uhr mit Pause-/Geschwindigkeitsanzeige, Knopf „Festival starten“, „Gäste · Zufriedenheit“, Kasse. Alles muss bei **320 × 180 Spielpixeln** passen und lesbar sein. Zusammenfassung am Ende als einfaches Fenster mit „OK“.

## 8. Fertig, wenn …

1. `npm ci`, `npm test` und `npm run build` laufen ohne Fehler; die neue Logik hat Tests.
2. Der Check-Workflow zeigt im Pull Request ✓, nach dem Merge läuft der Deploy durch.
3. Auf `https://jeanius93.github.io/Festival-Tycoon/`:
   - Die Straße ist am unteren Rand zu sehen.
   - Eine Zeltfläche lässt sich aufziehen und abreißen; ohne Wegverbindung zur Straße zeigt sie ein Warnschild, mit Verbindung verschwindet es.
   - Nach „Festival starten“ läuft die Uhr; Leertaste pausiert, 1/2/3 ändern die Geschwindigkeit.
   - Autos fahren über die Wege zur Zeltfläche, Zelte erscheinen, Gäste laufen los.
   - Gäste gehen zu Bierstand, Essensständen, Klos und Bühne, stellen sich vorne an, gehen nachts ins Zelt.
   - Ein Stand ohne Lieferweg bleibt leer; ein Stand hinter einem Personal-Tor auch.
   - Denkblasen zeigen, was fehlt; ohne Klo sieht man viele Klo-Blasen und die Zufriedenheit sinkt; baut man Klos nach, wird es besser.
   - Sehr unzufriedene Gäste fahren früher heim.
   - Nach Tag 3 reisen alle ab, die Zusammenfassung erscheint, man kann neu starten.
   - Alles aus M1–M3 funktioniert weiter.
4. Der Nutzer hat es am PC-Browser ausprobiert.
5. `CLAUDE.md` (Projektstand), `GAME_DESIGN.md` und `README.md` (Steuerung) sind aktualisiert.

## 9. Änderungen an der Vision (`GAME_DESIGN.md`)

Werden zusammen mit diesem Design-Dokument eingetragen:
- **1.1 Aufbau des Geländes:** Der Campingplatz ist nicht mehr einfach „die ganze Wiese außerhalb der Zäune“, sondern der Spieler **legt Zeltflächen fest** (aufziehen). Dort stehen Zelte und Autos der Gäste. Bühnengelände und Backstage entstehen weiter durch Zäune.
- **1.2 Wege:** Die Gäste kommen mit dem Auto über eine **Zufahrtsstraße**; Autos fahren nur auf Wegen. Eine Zeltfläche braucht eine Wegverbindung zur Straße.
- **5. Steuerung:** Leertaste und 1/2/3 sind ab M4 aktiv.
- **7. Besucher-Simulation:** Lange Schlangen lassen Gäste auf andere Stände ausweichen; nicht belieferte Stände sind geschlossen; sehr unzufriedene Gäste reisen früher ab; Gäste zeigen Denkblasen.
- **11. Meilensteine, M4:** „Besucher: Anreise mit dem Auto über die Zufahrtsstraße, Zeltflächen, Bedürfnisse, Stände aufsuchen, Spieluhr mit Festival-Start und Abreise“.

## 10. Dem Umsetzer überlassen

- genaues Aussehen von Straße, Zeltflächen-Markierung, Zelten, Autos, Gästen und Denkblasen
- wie Stellplätze auf einer Zeltfläche verteilt und vergeben werden (Hauptsache: 2 × 2, nur auf freien markierten Feldern, vorhersehbar)
- genaue Formeln für Bedürfnisse, Zufriedenheit, Abwechslung beim Essen, Schlangen-Zuschlag und Bediendauer, solange die Ziele in 2.6 und 2.7 sichtbar erfüllt sind
- wie oft die Wegweiser-Karten neu berechnet werden, solange es nicht ruckelt
- wie genau der Zuschauerbereich vor der Bühne aussieht
- wie die Anreise über den ersten Tag verteilt wird
- Lage und Maße der neuen Anzeigen oben, solange alles bei 320 × 180 passt
- genaue Modul-, Klassen- und Typnamen, solange Logik und Darstellung getrennt bleiben
