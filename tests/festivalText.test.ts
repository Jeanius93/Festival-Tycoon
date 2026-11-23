import { describe, it, expect } from 'vitest';
import { clockLabel, statsLabel } from '../src/ui/festivalText';

describe('Festival-Texte', () => {
  it('Uhr, Pause und Gesamtanzeige', () => {
    expect(clockLabel(36000, 1, false)).toBe('Tag 1 · 10:00 · Tempo 1');
    expect(clockLabel(86400 + 7 * 3600 + 300, 3, true)).toBe('Tag 2 · 07:05 · Pause');
    expect(statsLabel(84, 72)).toBe('Gäste: 84 · Zufriedenheit: 72 %');
  });
});
