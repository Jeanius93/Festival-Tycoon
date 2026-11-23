import { describe, it, expect } from 'vitest';
import { GameClock, dayOf, isSleepTime, isStageTime, minuteOfDay } from '../src/core/clock';

describe('GameClock', () => {
  it('Tick = 2 Spielsekunden; Tempo 1 braucht 11,11 ms pro Tick', () => {
    const c = new GameClock(36000);
    expect(c.consume(100)).toBe(9);
    expect(c.consume(12)).toBe(1);
    c.step();
    expect(c.second).toBe(36002);
  });
  it('Tempo 3 = vierfach, Pause = 0 und sammelt nichts', () => {
    const c = new GameClock(0);
    c.setSpeed(3);
    expect(c.consume(100)).toBe(36);
    c.togglePause();
    expect(c.consume(1000)).toBe(0);
    c.togglePause();
    expect(c.consume(5)).toBe(1);
  });
  it('consume begrenzt auf 60 Ticks', () => {
    const c = new GameClock(0);
    expect(c.consume(600000)).toBe(60);
    expect(c.consume(0)).toBe(0);
  });
  it('Tag, Uhrzeit, Bühnen- und Schlafenszeit', () => {
    expect(dayOf(36000)).toBe(1);
    expect(dayOf(86400)).toBe(2);
    expect(minuteOfDay(86400 + 3660)).toBe(61);
    expect(isStageTime(14 * 3600)).toBe(true);
    expect(isStageTime(86400 + 3599)).toBe(true);
    expect(isStageTime(86400 + 3600)).toBe(false);
    expect(isStageTime(13 * 3600 + 3599)).toBe(false);
    expect(isSleepTime(3600)).toBe(true);
    expect(isSleepTime(8 * 3600)).toBe(false);
  });
});
