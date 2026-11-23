import { describe, it, expect } from 'vitest';
import { Random } from '../src/core/random';

describe('Random', () => {
  it('gleicher Startwert → gleiche Folge, Werte in [0,1)', () => {
    const a = new Random(7);
    const b = new Random(7);
    const xs = Array.from({ length: 50 }, () => a.next());
    expect(xs).toEqual(Array.from({ length: 50 }, () => b.next()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(new Random(8).next()).not.toBe(xs[0]);
  });
  it('int und pick bleiben im Bereich', () => {
    const r = new Random(1);
    for (let i = 0; i < 100; i++) {
      const n = r.int(3, 6);
      expect(n >= 3 && n < 6).toBe(true);
    }
    expect(['a', 'b']).toContain(r.pick(['a', 'b']));
  });
});
