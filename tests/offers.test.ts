import { describe, it, expect } from 'vitest';
import { Grid, type Facing } from '../src/building/grid';
import { RoadNetwork } from '../src/building/roadNetwork';
import { Offers, audienceCells, frontCells, queueSpot, serviceCell } from '../src/visitors/offers';

const beerAt = (x: number, y: number, facing: Facing) => {
  const g = new Grid(12, 10);
  return g.addBuilding({ type: 'beer', x, y, width: 3, height: 2, facing, paidPrice: 600 });
};

// scene(): Grid 12 × 10, Bierstand (Kennnummer 1) Grundfläche x 3..5, y 3..4, Rückseite N,
// Lieferweg (3..6, 2) und Spalte x = 6 von y = 2 bis y = 9; scene({ connected: false }) ohne Feld (6,9)
const scene = ({ connected = true } = {}) => {
  const g = new Grid(12, 10);
  g.addBuilding({ type: 'beer', x: 3, y: 3, width: 3, height: 2, facing: 'N', paidPrice: 600 });
  g.applyPath([3, 4, 5].map((x) => ({ x, y: 2 })), true);
  g.applyPath([2, 3, 4, 5, 6, 7, 8, ...(connected ? [9] : [])].map((y) => ({ x: 6, y })), true);
  return { g, offers: new Offers(g) };
};

describe('Angebote', () => {
  it('Theke und Schlange liegen vor der Vorderseite', () => {
    const b = beerAt(3, 3, 'N');
    expect(frontCells(b)).toEqual([{ x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }]);
    expect(serviceCell(b)).toEqual({ x: 4, y: 5 });
    expect(queueSpot(b, 2)).toEqual({ x: 4.5, y: 7.5 });
  });
  it('ohne Straßenverbindung geschlossen und nicht in der Karte', () => {
    const { g, offers } = scene({ connected: false });
    offers.refresh(new RoadNetwork(g), 15 * 3600);
    expect(offers.isOpen(1)).toBe(false);
    expect(offers.field('beer').distance(4, 8)).toBe(Infinity);
    expect(offers.join(1, 5)).toBe(false);
  });
  it('Bühne nur zur Bühnenzeit offen; Zuschauer vor der Bühne', () => {
    const g = new Grid(20, 20);
    const stage = g.addBuilding({ type: 'stage', x: 2, y: 2, width: 6, height: 4, facing: 'N', paidPrice: 4000 });
    g.applyPath(
      [...Array.from({ length: 7 }, (_, i) => ({ x: 2 + i, y: 1 })), ...Array.from({ length: 19 }, (_, i) => ({ x: 8, y: 1 + i }))],
      true,
    );
    const offers = new Offers(g);
    const roads = new RoadNetwork(g);
    offers.refresh(roads, 12 * 3600);
    expect(offers.isOpen(stage.id)).toBe(false);
    offers.refresh(roads, 20 * 3600);
    expect(offers.isOpen(stage.id)).toBe(true);
    expect(audienceCells(g, stage)).toHaveLength(36);
    expect(offers.field('stage').distance(4, 8)).toBe(0);
  });
  it('lange Schlange wirkt als Umweg, volle Schlange als geschlossen', () => {
    const { g, offers } = scene();
    const roads = new RoadNetwork(g);
    offers.refresh(roads, 15 * 3600);
    const before = offers.field('beer').distance(4, 8);
    expect(before).toBe(3);
    for (let i = 0; i < 3; i++) offers.join(1, i);
    offers.refresh(roads, 15 * 3600);
    expect(offers.field('beer').distance(4, 8)).toBe(before + 9);
    for (let i = 3; i < 8; i++) offers.join(1, i);
    expect(offers.join(1, 99)).toBe(false);
    offers.refresh(roads, 15 * 3600);
    expect(offers.field('beer').distance(4, 8)).toBe(Infinity);
  });
  it('serve bedient nach 15 Ticks den ersten Gast', () => {
    const { g, offers } = scene();
    offers.refresh(new RoadNetwork(g), 15 * 3600);
    offers.join(1, 7);
    offers.join(1, 8);
    for (let i = 0; i < 14; i++) expect(offers.serve()).toEqual([]);
    expect(offers.serve()).toEqual([{ guestId: 7, type: 'beer' }]);
    expect(offers.queue(1)).toEqual([8]);
  });
  it('Theke findet den Stand', () => {
    const { g, offers } = scene();
    offers.refresh(new RoadNetwork(g), 15 * 3600);
    expect(offers.buildingAtService(4, 5)?.id).toBe(1);
    expect(offers.buildingAtService(3, 5)).toBeNull();
  });
  it('geschlossener Stand löst die Schlange auf', () => {
    const { g, offers } = scene();
    offers.refresh(new RoadNetwork(g), 15 * 3600);
    offers.join(1, 7);
    g.clear([{ x: 6, y: 9 }]);
    offers.refresh(new RoadNetwork(g), 15 * 3600);
    expect(offers.takeDissolved()).toEqual([7]);
    expect(offers.takeDissolved()).toEqual([]);
    expect(offers.queue(1)).toEqual([]);
  });
});

describe('Angebote – Schlangen nur auf begehbaren Feldern', () => {
  it('Zaun vor der Theke begrenzt die Schlange', () => {
    const { g, offers } = scene();
    g.apply([{ x: 4, y: 7, structure: 'fence' }]);
    offers.refresh(new RoadNetwork(g), 15 * 3600);
    expect(offers.join(1, 1)).toBe(true);
    expect(offers.join(1, 2)).toBe(true);
    expect(offers.join(1, 3)).toBe(false);
  });
  it('später gebauter Zaun schickt die hinteren Wartenden weg', () => {
    const { g, offers } = scene();
    offers.refresh(new RoadNetwork(g), 15 * 3600);
    for (const id of [1, 2, 3]) offers.join(1, id);
    g.apply([{ x: 4, y: 6, structure: 'fence' }]);
    offers.refresh(new RoadNetwork(g), 15 * 3600);
    expect(offers.queue(1)).toEqual([1]);
    expect(offers.takeDissolved()).toEqual([2, 3]);
  });
});
