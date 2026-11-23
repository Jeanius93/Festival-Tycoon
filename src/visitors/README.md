# Besucher

Die Festival-Simulation ohne Grafik (ab M4):

- `festival.ts`: Ablauf eines Festivals (Start, Anreise, Abreise, Abschleppen, Zusammenfassung), rechnet in festen Ticks
- `guest.ts`: ein Gast mit Bedürfnissen, Zufriedenheit und Denkblase
- `behaviour.ts`: was ein Gast in einem Tick tut (laufen, anstehen, zuschauen, schlafen, abreisen)
- `offers.ts`: offene Gebäude, Theken, Zuschauerbereiche, Schlangen und Wegweiser-Karten
- `flowField.ts`: Wegweiser-Karten und Wegsuche zu Fuß
- `tuning.ts`: alle Stellschrauben (Geschwindigkeiten, Raten, Grenzen) an einer Stelle
- `palette.ts`: Farben der Platzhalter-Figuren

Gezeichnet wird in `src/scenes/visitorView.ts`.
