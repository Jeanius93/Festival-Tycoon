import { describe, it, expect } from 'vitest';
import { clockLabel, statsLabel, summaryLines } from '../src/ui/festivalText';

describe('Festival-Texte', () => {
  it('Uhr, Pause und Gesamtanzeige', () => {
    expect(clockLabel(36000, 1, false)).toBe('Tag 1 · 10:00 · Tempo 1');
    expect(clockLabel(86400 + 7 * 3600 + 300, 3, true)).toBe('Tag 2 · 07:05 · Pause');
    expect(statsLabel(84, 72)).toBe('Gäste: 84 · Zufriedenheit: 72 %');
  });
  it('Zusammenfassung mit Einzahl und Mehrzahl', () => {
    expect(summaryLines({ guests: 8, satisfaction: 72, leftEarly: 2, towed: 0 })).toEqual([
      'Festival vorbei!',
      'Gäste: 8',
      'Zufriedenheit am Ende: 72 %',
      'Früher abgereist: 2',
      'Abgeschleppt: 0 Autos',
    ]);
    expect(summaryLines({ guests: 2, satisfaction: 50, leftEarly: 0, towed: 1 }).at(-1)).toBe('Abgeschleppt: 1 Auto');
  });
});
