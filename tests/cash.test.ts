import { describe, it, expect, vi } from 'vitest';
import { Cash } from '../src/economy/cash';
import { START_CASH } from '../src/config';

describe('Cash', () => {
  it('startet mit dem Startbetrag', () => expect(new Cash(START_CASH).balance).toBe(10000));
  it('spend zieht ab, wenn genug da ist', () => {
    const c = new Cash(1000);
    expect(c.spend(600)).toBe(true);
    expect(c.balance).toBe(400);
  });
  it('spend bei zu wenig Geld ändert nichts', () => {
    const c = new Cash(500);
    const l = vi.fn();
    c.onChange(l);
    expect(c.spend(600)).toBe(false);
    expect(c.balance).toBe(500);
    expect(l).not.toHaveBeenCalled();
  });
  it('genau passender Betrag geht auf 0', () => {
    const c = new Cash(600);
    expect(c.spend(600)).toBe(true);
    expect(c.balance).toBe(0);
  });
  it('refund addiert und meldet', () => {
    const c = new Cash(0);
    const l = vi.fn();
    c.onChange(l);
    c.refund(150);
    expect(c.balance).toBe(150);
    expect(l).toHaveBeenCalledWith(150);
  });
  it('canAfford', () => {
    const c = new Cash(400);
    expect(c.canAfford(400)).toBe(true);
    expect(c.canAfford(401)).toBe(false);
  });
  it('onChange lässt sich abmelden', () => {
    const c = new Cash(100);
    const l = vi.fn();
    const off = c.onChange(l);
    off();
    c.refund(1);
    expect(l).not.toHaveBeenCalled();
  });
});
