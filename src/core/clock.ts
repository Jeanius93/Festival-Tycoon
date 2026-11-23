import { SCHEDULE, TIME } from '../config';

/** Tempo-Stufe (Tasten 1/2/3); Faktor siehe TIME.speedFactor. */
export type Speed = 1 | 2 | 3;

const SECONDS_PER_DAY = 86400;

// Ein Tick dauert bei Tempo 1 genau realMsPerGameHour / 3600 × tickSeconds ms (= 100/9 ms).
// Gerechnet wird in Bruchteilen davon, damit kein Rundungsfehler entsteht:
// Zähler += realMs × Faktor × UNITS_PER_MS, je UNITS_PER_TICK ein Tick.
const UNITS_PER_MS = 3600;
const UNITS_PER_TICK = (TIME.realMsPerGameHour * TIME.tickSeconds * UNITS_PER_MS) / 3600;

/**
 * Die Spieluhr: Spielsekunden seit Tag 1, 00:00, Pause und Tempo.
 * `consume` sagt, wie viele feste Rechenschritte (Ticks) gerade fällig sind.
 */
export class GameClock {
  paused = false;
  speed: Speed = 1;
  private units = 0;

  constructor(public second: number) {}

  setSpeed(speed: Speed): void {
    this.speed = speed;
  }

  togglePause(): void {
    this.paused = !this.paused;
  }

  /** Ein Tick: die Uhr rückt um TIME.tickSeconds vor. */
  step(): void {
    this.second += TIME.tickSeconds;
  }

  /** Echte Millisekunden → Anzahl fälliger Ticks (höchstens TIME.maxTicksPerFrame, Überschuss verfällt). */
  consume(realMs: number): number {
    if (this.paused || !(realMs > 0)) return 0;
    this.units += realMs * TIME.speedFactor[this.speed] * UNITS_PER_MS;
    const ticks = Math.floor(this.units / UNITS_PER_TICK);
    if (ticks > TIME.maxTicksPerFrame) {
      this.units = 0;
      return TIME.maxTicksPerFrame;
    }
    this.units -= ticks * UNITS_PER_TICK;
    return ticks;
  }
}

/** Festivaltag (Tag 1 = 0 … 86 399 Sekunden). */
export function dayOf(second: number): number {
  return Math.floor(second / SECONDS_PER_DAY) + 1;
}

/** Minute des Tages (0 … 1439). */
export function minuteOfDay(second: number): number {
  return Math.floor((((second % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY) / 60);
}

/** Spielt die Bühne gerade (14:00 bis 01:00)? */
export function isStageTime(second: number): boolean {
  const m = minuteOfDay(second);
  return m >= SCHEDULE.stageFromMinute || m < SCHEDULE.stageToMinute;
}

/** Ist Schlafenszeit (01:00 bis 08:00)? */
export function isSleepTime(second: number): boolean {
  const m = minuteOfDay(second);
  return m >= SCHEDULE.sleepFromMinute && m < SCHEDULE.sleepToMinute;
}
