import { describe, it, expect } from 'vitest';
import { formatMoney } from '../src/ui/format';

describe('formatMoney', () => {
  it('Tausender mit Leerzeichen, dann €', () => {
    expect(formatMoney(0)).toBe('0 €');
    expect(formatMoney(600)).toBe('600 €');
    expect(formatMoney(10000)).toBe('10 000 €');
    expect(formatMoney(1234567)).toBe('1 234 567 €');
  });
});
