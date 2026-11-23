import { describe, it, expect } from 'vitest';
import { buildingHint } from '../src/ui/hints';

describe('buildingHint', () => {
  it('erlaubt oder unbekannt: Bauen mit Preis', () => {
    expect(buildingHint('beer', 'ok', 10000)).toBe('Klick: Bierstand bauen (600 €) · R: drehen · Rechtsklick: Ansehen');
    expect(buildingHint('beer', null, 10000)).toBe('Klick: Bierstand bauen (600 €) · R: drehen · Rechtsklick: Ansehen');
  });
  it('belegt', () => {
    expect(buildingHint('beer', 'blocked', 10000)).toBe('Kein Platz für Bierstand · R: drehen · Rechtsklick: Ansehen');
  });
  it('zu teuer', () => {
    expect(buildingHint('stage', 'tooExpensive', 3500)).toBe('Zu teuer: Bühne kostet 4 000 €, Kasse: 3 500 €');
  });
});
