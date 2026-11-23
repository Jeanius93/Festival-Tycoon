/**
 * Zufallsgenerator mit festem Startwert (mulberry32): gleicher Startwert → gleicher Ablauf.
 * Die Simulation nutzt nur ihn, nie Math.random().
 */
export class Random {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Zahl in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Ganze Zahl in [min, maxExclusive). */
  int(min: number, maxExclusive: number): number {
    return min + Math.floor(this.next() * (maxExclusive - min));
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length)];
  }
}
