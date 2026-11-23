import { describe, it, expect } from 'vitest';
import { BUILDING_TYPES, CATALOG, type BuildingType } from '../src/building/catalog';

describe('Katalog', () => {
  it('enthält genau die sieben Gebäude mit Größe und Preis aus dem Design', () => {
    expect(BUILDING_TYPES).toEqual(['stage', 'beer', 'fries', 'bratwurst', 'pizza', 'merch', 'toilet']);
    const pick = (t: BuildingType) => {
      const s = CATALOG[t];
      return [s.name, s.category, s.width, s.depth, s.price];
    };
    expect(pick('stage')).toEqual(['Bühne', 'stages', 6, 4, 4000]);
    expect(pick('beer')).toEqual(['Bierstand', 'stalls', 3, 2, 600]);
    expect(pick('fries')).toEqual(['Pommes', 'stalls', 3, 2, 400]);
    expect(pick('bratwurst')).toEqual(['Bratwurst', 'stalls', 3, 2, 400]);
    expect(pick('pizza')).toEqual(['Pizza', 'stalls', 3, 2, 500]);
    expect(pick('merch')).toEqual(['Merch-Stand', 'stalls', 3, 2, 500]);
    expect(pick('toilet')).toEqual(['Dixi-Klo', 'sanitary', 1, 1, 150]);
  });
  it('jeder Eintrag kennt seine eigene Art', () => {
    for (const t of BUILDING_TYPES) expect(CATALOG[t].type).toBe(t);
  });
  it('jede Art hat ihre eigene Platzhalterfarbe', () => {
    expect(new Set(BUILDING_TYPES.map((t) => CATALOG[t].color)).size).toBe(7);
  });
});
