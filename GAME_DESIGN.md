# GAME_DESIGN.md – Festival Tycoon (Arbeitstitel)

> Dieses Dokument ist die Gesamtvision des Spiels und die zentrale Quelle für alle Entscheidungen.
> Vor jeder Aufgabe lesen. Wenn sich etwas Grundsätzliches ändert, wird es hier eingetragen.

---

## 1. Vision

Ein gemütliches **Tycoon-Spiel**, in dem man ein **Rockfestival** organisiert, aufbaut und Jahr für Jahr vergrößert.

- **Spielprinzip:** wie *RollerCoaster Tycoon*: bauen, verwalten, Besucher glücklich machen, wirtschaften
- **Grafikstil:** warme, gemütliche **Pixel-Art in der Top-down-Ansicht**, inspiriert von *Stardew Valley* (eigene Grafiken, nichts kopieren)
- **Kern-Motivation:** Aus einem kleinen Dorffest wird über die Jahre ein großes Festival. Wie stark es wächst, hängt davon ab, wie gut man im Vorjahr gewirtschaftet hat.

---

## 2. Plattform & Technik

| Thema | Entscheidung |
|---|---|
| Plattform | Browser-Game (läuft auf PC, Handy und MSI Claw ohne Installation) |
| Engine | **Phaser 3** |
| Sprache | **TypeScript** |
| Build-Tool | **Vite** |
| Steuerung | **Nur Maus und Tastatur** (Controller-Steuerung erst später, siehe Abschnitt 12) |
| Code-Verwaltung | GitHub-Repository, Arbeit über Claude Code im Browser |
| Veröffentlichung | **GitHub Pages**, automatisch per GitHub Actions (siehe Abschnitt 3) |
| Speichern | Spielstand im Browser (localStorage) |

---

## 3. Deployment über GitHub Pages

Ziel: Nach jedem Merge in den Hauptzweig (`main`) ist das Spiel automatisch unter einer festen Web-Adresse spielbar, z. B.
`https://<github-benutzername>.github.io/festival-tycoon/`

**Umsetzung:**
- Ein GitHub-Actions-Workflow (`.github/workflows/deploy.yml`) baut das Spiel bei jedem Push auf `main` mit `npm run build` und veröffentlicht den Ordner `dist/` auf GitHub Pages.
- In der `vite.config.ts` muss der `base`-Pfad auf den Repo-Namen gesetzt werden (z. B. `base: '/festival-tycoon/'`), damit Grafiken und Skripte auf GitHub Pages gefunden werden.
- Alle Asset-Pfade im Spiel relativ zu diesem Base-Pfad laden.
- In den Repo-Einstellungen unter **Settings → Pages** als Quelle **„GitHub Actions“** auswählen (einmalig, manuell durch den Nutzer).

**Hinweis:** Bei privaten Repos setzt GitHub Pages ein kostenpflichtiges GitHub-Konto voraus; öffentliche Repos sind kostenlos.

**Arbeitsablauf:** Claude Code arbeitet auf einem eigenen Branch und erstellt einen Pull Request → der Nutzer merged → GitHub Actions baut und veröffentlicht → testen über die Pages-Adresse.

---

## 4. Grafikstil

- Top-down-Pixel-Art, warme Farben, gemütliche Stimmung
- Kachelgröße: **16 × 16 Pixel**, im Spiel hochskaliert (Pixel bleiben scharf, kein Weichzeichnen: `pixelArt: true` in Phaser)
- **Anfangs Platzhalter-Grafiken**, die per Code erzeugt werden (einfarbige Kacheln, simple Figuren), später durch richtige Sprites ersetzbar
- Alle Grafiken zentral in einem Asset-Ordner, damit sie leicht ausgetauscht werden können
- Tag-Nacht-Wechsel mit Licht- und Bühnenshow (später)

---

## 5. Steuerung (Maus & Tastatur)

| Eingabe | Aktion |
|---|---|
| Linksklick | Auswählen / Platzieren |
| Linksklick + Ziehen | Wege und Zäune am Stück bauen |
| Rechtsklick | Abbrechen / Bau-Modus verlassen |
| Mausrad | Zoomen |
| Mittlere Maustaste + Ziehen oder Bildschirmrand | Kamera verschieben |
| WASD / Pfeiltasten | Kamera verschieben (Alternative) |
| R | Objekt drehen |
| Entf | Abreißen-Modus |
| Leertaste | Pause |
| 1 / 2 / 3 | Spielgeschwindigkeit |

- Objekte rasten auf dem Raster ein
- Vorschau des Objekts unter dem Mauszeiger (grün = erlaubt, rot = nicht erlaubt)
- UI mit großen, klaren Kacheln, damit später eine Controller- und Touch-Steuerung leicht nachrüstbar ist

---

## 6. Spielablauf: Ein Jahr in vier Phasen

Jedes Spieljahr besteht aus vier Phasen, angelehnt an die Jahreszeiten.

### 6.1 Planung (Winter)
- Gelände erweitern bzw. pachten (mehr Fläche = mehr Kosten)
- Bands buchen: Frühes Buchen ist günstiger, aber der Hype ist noch unsicher
- Ticketpreis und Ticketkontingent festlegen
- Sponsoren wählen: bringen Geld, stellen aber Bedingungen
- Behörden-Auflagen erfüllen (Lärmschutz, Fluchtwege, Sanitäter)

### 6.2 Vorbereitung (Frühling)
- **Bau-Phase** wie in RollerCoaster Tycoon: Bühnen, Wege, Zäune, Stände, Klos, Zeltplatz, Parkplatz, Duschen, Strom und Wasser
- Personal einstellen: Security, Reinigung, Barpersonal, Technik, Sanitäter
- Begrenzte Zeit: Was bis zum Festivalstart nicht fertig ist, fehlt

### 6.3 Festivalwoche (Sommer)
- Live-Simulation: Besucher laufen über das Gelände und haben Bedürfnisse
- Tag-Nacht-Zyklus, Konzerte am Abend, Lagerfeuer am Zeltplatz
- Zufällige Ereignisse (siehe Abschnitt 9)
- Der Spieler reagiert: Personal umverteilen, nachbauen, Notfallmaßnahmen

### 6.4 Abbau (Herbst)
- Aufräumen: Müll, kaputte Zelte, zertrampelte Wiese; je sauberer, desto besser das Verhältnis zu Landwirt und Gemeinde
- Abrechnung: Gewinn/Verlust, Ruf, Besucherbewertungen
- Ausrüstung einlagern oder verkaufen (eigene Ausrüstung muss im nächsten Jahr nicht gemietet werden)
- Übergang ins nächste Jahr

---

## 7. Besucher-Simulation

Jeder Besucher ist eine kleine Pixel-Figur mit eigenen Werten:

| Bedürfnis | Wird erfüllt durch |
|---|---|
| Durst | Bierstand, Getränkestand, Wasserstelle |
| Hunger | Food-Stände, Food-Trucks |
| Klo | Dixi-Klos, Toilettenwagen |
| Musik / Unterhaltung | Bühnen mit Bands |
| Schlaf | Zeltplatz |
| Sauberkeit / Hygiene | Duschen, saubere Wege |

- Daraus ergibt sich eine **Zufriedenheit** pro Besucher
- Besucher suchen sich per Wegfindung das nächste passende Angebot
- Lange Schlangen, Dreck und Matsch senken die Laune
- Besucher schreiben Bewertungen (z. B. „Klo-Situation katastrophal, 2/5“)

---

## 8. Wirtschaft, Ruf & Wachstum

**Einnahmen:** Tickets, Getränke, Essen, Merch, Sponsoren
**Ausgaben:** Bandgagen, Pacht, Bau/Miete, Personal, Auflagen, Aufräumen

**Ruf** (zentraler Wert über die Jahre):
- bestimmt, wie viele Besucher kommen
- bestimmt, welche Bands überhaupt zusagen
- steigt durch zufriedene Besucher, gute Bands und sauberes Gelände; sinkt durch Chaos, Pannen und Verluste

**Wachstumsstufen (Beispiel):**
1. Dorffest (ca. 300 Besucher, eine kleine Bühne)
2. Regionales Open Air
3. Mittelgroßes Festival (zweite Bühne, VIP-Bereich)
4. Großfestival (mehrere Bühnen, Riesenrad, eigene Brauerei …)

- Ein schlechtes Jahr kostet Ruf und Geld. Pleite ist möglich, aber nicht sofort das Ende.
- Freischaltungen über die Jahre: zweite Bühne, VIP-Bereich, Merch-Zelt, Riesenrad, eigene Brauerei usw.

---

## 9. Ereignisse (Ideen)

- Gewitter und Regen → Schlamm, Wege werden langsamer (Gegenmaßnahme: Stroh auslegen)
- Stromausfall an einer Bühne
- Band kommt zu spät oder sagt ab
- Moshpit eskaliert → Sanitäter nötig
- Stand fängt Feuer
- Hitze → Wasserbedarf steigt stark
- Promi-Gast taucht auf → Ruf-Bonus

---

## 10. Bands (Ideen)

- Nur **fiktive Bands** mit witzigen Namen
- Eigenschaften: Genre, Hype, Gage, Eigenart
- Genres z. B. Hard Rock, Metal, Punk, Indie, Stoner Rock, Metalcore
- Eigenarten z. B. „zieht Moshpits an“, „Diva: will eigenen Backstage-Bereich“, „Publikumsmagnet“

---

## 11. Meilensteine

Jeder Meilenstein wird einzeln umgesetzt: Brainstorming → Design → Plan → Umsetzung → Test → Merge.

| Nr. | Inhalt |
|---|---|
| **M0** | Projekt-Grundgerüst: Phaser 3 + TypeScript + Vite, leere Szene, GitHub-Actions-Deployment auf GitHub Pages, erfolgreich online erreichbar |
| **M1** | Wiese mit Raster, Kamera verschieben und zoomen, Wege per Klick und Ziehen bauen und abreißen |
| **M2** | Objekte platzieren: Bühne, Bierstand, Klo (mit Vorschau, Drehen, Budget und Kosten) |
| **M3** | Besucher: laufen auf Wegen, haben Bedürfnisse, suchen passende Angebote auf |
| **M4** | Wirtschaft: Einnahmen und Ausgaben, Ticketpreis, Geldanzeige |
| **M5** | Phasen-System: Planung → Vorbereitung → Festivalwoche → Abbau, Jahresabschluss |
| **M6** | Ruf und Wachstum über die Jahre, erste Freischaltungen |
| **M7** | Bands buchen, Personal einstellen |
| **M8** | Ereignisse, Tag-Nacht-Zyklus, Speichern/Laden |
| **M9** | Echte Pixel-Grafiken statt Platzhalter, Sound und Musik |

---

## 12. Später / offen

- Controller-Steuerung für die MSI Claw (Gamepad-API)
- Touch-Steuerung
- Verschiedene Gelände (Wald, Strand, Burgruine …)
- Name des Spiels

---

## 13. Hinweise für die Arbeit mit Claude Code

- Immer nur **einen Meilenstein** gleichzeitig umsetzen
- Vor dem Bauen den Superpowers-Ablauf nutzen: Brainstorming → Design → Plan → Umsetzung
- Code sauber in Module aufteilen (z. B. Szenen, Bau-System, Besucher, Wirtschaft, UI), damit spätere Erweiterungen leicht sind
- Nach jedem Meilenstein muss das Spiel über GitHub Pages spielbar sein
- Grundsätzliche Änderungen an der Vision in diesem Dokument nachtragen
