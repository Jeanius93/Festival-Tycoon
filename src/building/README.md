# Bau-System

Alles ohne Phaser und mit Tests:

- `grid.ts` – Grundstück als Datenmodell: Boden (Wiese/Weg), Bauten (Zaun, Schleuse, Tor) und Gebäude (Liste plus Kennnummer pro Feld)
- `catalog.ts` – Katalog aller Gebäudearten (Name, Kategorie, Größe, Preis). Ein neues Gebäude ist ein neuer Eintrag.
- `placement.ts` – Grundfläche je Richtung, Lieferseite (Rückseite), „beliefert?“ und die Bauregel für Gebäude
- `rules.ts` – Bauregeln für Weg, Zaun, Schleuse und Tor
- `lineTool.ts`, `autotile.ts` – L-Linie beim Ziehen, passende Weg- und Zaunstücke
- `buildTool.ts` – das Bau-Werkzeug (Modi, Vorschau, Bauen, Drehen, Abreißen mit Erstattung)
