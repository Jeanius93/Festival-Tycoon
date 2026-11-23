import { describe, it, expect } from 'vitest';
import { Grid } from '../src/building/grid';
import { Festival } from '../src/visitors/festival';
import { camp, runUntil } from './helpers/festivalScenes';

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
