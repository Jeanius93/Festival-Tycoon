import { describe, it, expect } from 'vitest';
import { fenceRects } from '../src/assets/fenceShape';

describe('fenceRects', () => {
  it('alle Rechtecke (Latten und Schatten) bleiben innerhalb der 16×16-Kachel', () => {
    for (let mask = 0; mask < 16; mask++) {
      const { rails, shadows } = fenceRects(mask);
      for (const [x, y, w, h] of [...rails, ...shadows]) {
        expect(x >= 0 && y >= 0 && x + w <= 16 && y + h <= 16, `mask ${mask}: ${[x, y, w, h]}`).toBe(true);
      }
    }
  });
  it('vier Latten bei zwei Nachbarn', () => {
    expect(fenceRects(2 | 8).rails).toHaveLength(4);
  });
});
