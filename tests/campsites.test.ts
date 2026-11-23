import { describe, it, expect } from 'vitest';
import { Grid } from '../src/building/grid';
import { RoadNetwork } from '../src/building/roadNetwork';
import { findCampZones, freePlots, parkingCell, plotCells, tentDoor } from '../src/camping/campsites';

// Grid 12 × 10; Zeltfläche x 2..5, y 2..5; Weg von (6,9) bis (6,2)
const scene = () => {
  const g = new Grid(12, 10);
  const camp = [];
  for (let y = 2; y <= 5; y++) for (let x = 2; x <= 5; x++) camp.push({ x, y, camp: true });
  g.apply(camp);
  g.applyPath([2, 3, 4, 5, 6, 7, 8, 9].map((y) => ({ x: 6, y })), true);
  return { g, roads: new RoadNetwork(g) };
};

describe('Zeltflächen', () => {
  it('Stellplatz: Zelt links, Auto rechts', () => {
    expect(plotCells({ x: 2, y: 4 })).toEqual([{ x: 2, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 5 }, { x: 3, y: 5 }]);
    expect(tentDoor({ x: 2, y: 4 })).toEqual({ x: 2, y: 5 });
    expect(parkingCell({ x: 2, y: 4 })).toEqual({ x: 3, y: 5 });
  });
  it('eine Zone, angeschlossen über den Weg am Rand', () => {
    const { g, roads } = scene();
    const zones = findCampZones(g, roads);
    expect(zones).toHaveLength(1);
    expect(zones[0].cells).toHaveLength(16);
    expect(zones[0].access).toEqual({ x: 6, y: 5 });
  });
  it('4 × 4 ergibt 4 Stellplätze, nächster zur Zufahrt zuerst', () => {
    const { g, roads } = scene();
    const [z] = findCampZones(g, roads);
    expect(freePlots(g, z)).toEqual([{ x: 4, y: 4 }, { x: 4, y: 2 }, { x: 2, y: 4 }, { x: 2, y: 2 }]);
  });
  it('belegte Felder, Wege und Gebäude fallen heraus', () => {
    const { g, roads } = scene();
    g.setOccupied(plotCells({ x: 4, y: 4 }), true);
    g.applyPath([{ x: 2, y: 2 }], true);
    // Gierig in Lesereihenfolge: (3,2) passt jetzt, danach (2,4); sortiert nach Abstand zur Zufahrt (6,5)
    expect(freePlots(g, findCampZones(g, roads)[0])).toEqual([{ x: 2, y: 4 }, { x: 3, y: 2 }]);
  });
  it('ohne Wegverbindung: access null', () => {
    const { g } = scene();
    g.clear([{ x: 6, y: 9 }]);
    expect(findCampZones(g, new RoadNetwork(g))[0].access).toBeNull();
  });
  it('zwei getrennte Flächen sind zwei Zonen', () => {
    const { g, roads } = scene();
    g.apply([{ x: 9, y: 1, camp: true }]);
    expect(findCampZones(g, roads).map((z) => z.id)).toEqual([21, 26]);
  });
});

describe('Zeltflächen – erreichbare Stellplätze', () => {
  it('Stellplätze hinter einer Wand aus Gebäuden werden nicht angeboten', () => {
    const { g, roads } = scene();
    // Klo-Reihe quer durch die Fläche bei y = 4 (x 2..5) trennt die obere Hälfte von der Zufahrt (6,5)
    for (const x of [2, 3, 4, 5]) g.addBuilding({ type: 'toilet', x, y: 4, width: 1, height: 1, facing: 'N', paidPrice: 150 });
    g.clear([2, 3, 4, 5].map((y) => ({ x: 6, y })).filter((c) => c.y < 5));
    const zone = findCampZones(g, new RoadNetwork(g))[0];
    expect(zone.access).toEqual({ x: 6, y: 5 });
    expect(freePlots(g, zone)).toEqual([]);
    expect(roads).toBeDefined();
  });
});
