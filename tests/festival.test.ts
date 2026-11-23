import { describe, it, expect } from 'vitest';
import { Grid } from '../src/building/grid';
import { Festival } from '../src/visitors/festival';
import { camp, campMitKlos, runUntil } from './helpers/festivalScenes';

describe('Festival-Ablauf', () => {
  it('ohne angeschlossene Zeltfläche kein Start', () => {
    const g = new Grid(20, 12);
    expect(new Festival(g).canStart()).toBe(false);
    expect(new Festival(g).start()).toBe(false);
  });
  it('Start: Uhr Tag 1 10:00, alle 60 Ticks ein Auto, Stellplatz sofort belegt', () => {
    const g = camp();
    const f = new Festival(g, 1);
    expect(f.start()).toBe(true);
    expect(f.phase).toBe('running');
    expect(f.clock.second).toBe(36000);
    f.tick();
    expect(f.cars()).toHaveLength(1);
    expect(g.isOccupied(11, 4)).toBe(true);
    for (let i = 0; i < 59; i++) f.tick();
    expect(f.cars()).toHaveLength(1);
    f.tick();
    expect(f.cars()).toHaveLength(2);
  });
  it('Auto parkt, Zelt und zwei Gäste erscheinen; voll → keine weiteren Autos', () => {
    const f = new Festival(camp(), 1);
    f.start();
    runUntil(f, 14 * 3600);
    expect(f.tents()).toHaveLength(4);
    expect(f.guests()).toHaveLength(8);
    expect(f.cars()).toHaveLength(4);
    expect(f.cars().every((c) => c.state === 'parked')).toBe(true);
    expect(f.stats().guests).toBe(8);
    expect(f.canStart()).toBe(false);
  });
  it('abgerissener Weg stoppt das Auto, Wiederaufbau löst es', () => {
    const g = camp();
    const f = new Festival(g, 1);
    f.start();
    f.tick();
    runUntil(f, 36000 + 200);
    g.clear([{ x: 10, y: 8 }]);
    runUntil(f, 36000 + 600);
    expect(f.cars()[0].stuck).toBe(true);
    expect(f.cars()[0].y).toBeGreaterThan(8);
    g.applyPath([{ x: 10, y: 8 }], true);
    runUntil(f, 36000 + 1800);
    expect(f.cars()[0].stuck).toBe(false);
    expect(f.cars()[0].state).toBe('parked');
  });
  it('nach Tag 4 10:00 reisen alle ab, Zusammenfassung, Neustart möglich', () => {
    const g = camp();
    const f = new Festival(g, 1);
    f.start();
    runUntil(f, 295200 + 3 * 3600);
    expect(f.phase).toBe('finished');
    expect(f.summary).toMatchObject({ guests: 8, towed: 0 });
    expect(f.cars()).toHaveLength(0);
    expect(g.isOccupied(11, 4)).toBe(false);
    f.closeSummary();
    expect(f.phase).toBe('building');
    expect(f.summary).toBeNull();
    expect(f.canStart()).toBe(true);
  });
  it('eingesperrt bis Tag 4 14:00 → abgeschleppt', () => {
    const g = camp();
    const f = new Festival(g, 1);
    f.start();
    runUntil(f, 14 * 3600);
    g.clear([{ x: 10, y: 11 }]);
    runUntil(f, 309600 + 60);
    expect(f.phase).toBe('finished');
    expect(f.summary!.towed).toBe(4);
  });
  it('Tempo ändert den Ablauf nicht', () => {
    const a = new Festival(camp(), 3);
    const b = new Festival(camp(), 3);
    a.start();
    b.start();
    b.clock.setSpeed(3);
    for (let i = 0; i < 400; i++) a.update(40);
    for (let i = 0; i < 100; i++) b.update(40);
    expect(b.clock.second).toBe(a.clock.second);
    expect(b.clock.second).toBe(36000 + 1440 * 2);
    expect(b.cars().map((c) => [c.x, c.y])).toEqual(a.cars().map((c) => [c.x, c.y]));
  });
});

describe('Festival mit Gästen', () => {
  it('ohne Klo sinkt die Zufriedenheit, mit Klos bleibt sie höher', () => {
    const ohne = new Festival(camp(), 5);
    const mit = new Festival(campMitKlos(), 5);
    for (const f of [ohne, mit]) {
      f.start();
      runUntil(f, 20 * 3600); // Tag 1, 20:00 (ohne Bier, Essen und Bühne reisen später alle früh ab)
    }
    expect(mit.stats().satisfaction).toBeGreaterThan(ohne.stats().satisfaction);
  });
  it('sehr unzufriedene Gruppe reist früher ab', () => {
    const f = new Festival(camp(), 2);
    f.start();
    runUntil(f, 2 * 86400 + 36000);
    expect(f.stats().guests).toBeLessThan(8);
    runUntil(f, 400000);
    expect(f.summary!.leftEarly).toBeGreaterThan(0);
  });
  // Echtzeit-Bedarf: Tempo 3 rechnet 360 Ticks pro Sekunde, also braucht ein Viertel-Spieltag (10 800 Ticks)
  // höchstens 30 s. Die Grenze von 10 s lässt also dreifachen Puffer, auch auf langsamen Rechnern.
  it('300 Gäste: ein Viertel-Spieltag in unter 10 Sekunden', () => {
    const g = new Grid(64, 48);
    g.applyPath(Array.from({ length: 48 }, (_, y) => ({ x: 32, y })), true);
    const camp = [];
    for (let y = 1; y <= 20; y++) for (let x = 33; x <= 62; x++) camp.push({ x, y, camp: true });
    g.apply(camp);
    const stalls = ['beer', 'fries', 'bratwurst', 'pizza', 'merch'] as const;
    stalls.forEach((type, i) => {
      for (const k of [0, 1]) g.addBuilding({ type, x: 30, y: (i * 2 + k) * 4, width: 2, height: 3, facing: 'E', paidPrice: 0 });
    });
    for (const y of [40, 42]) g.addBuilding({ type: 'toilet', x: 31, y, width: 1, height: 1, facing: 'E', paidPrice: 0 });
    g.addBuilding({ type: 'stage', x: 12, y: 38, width: 4, height: 6, facing: 'E', paidPrice: 0 });
    g.applyPath(Array.from({ length: 10 }, (_, i) => ({ x: 16, y: 38 + i })), true);
    const f = new Festival(g, 9);
    const t0 = performance.now();
    f.start();
    runUntil(f, 36000 + 86400 / 4);
    expect(performance.now() - t0).toBeLessThan(10000);
    expect(f.stats().guests).toBeGreaterThan(250);
  }, 30000);
});
