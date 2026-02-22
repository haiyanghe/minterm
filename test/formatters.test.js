import { describe, it, expect } from 'vitest';
import { formatNum, formatPrice, formatQty, formatPct } from '../src/formatters.js';

describe('formatNum', () => {
  it('formats billions', () => {
    expect(formatNum(1_500_000_000)).toBe('1.50bil');
    expect(formatNum(15_000_000_000)).toBe('15.0bil');
  });

  it('formats millions', () => {
    expect(formatNum(1_234_567)).toBe('1.23mil');
    expect(formatNum(12_345_678)).toBe('12.3mil');
  });

  it('formats thousands (k)', () => {
    expect(formatNum(12345)).toBe('12.3k');
    expect(formatNum(100_000)).toBe('100k');
  });

  it('formats mid-range', () => {
    expect(formatNum(1234.56)).toMatch(/1,234.56|1234.56/); // locale-dependent
  });

  it('formats small values', () => {
    expect(formatNum(1.5)).toBe('1.50');
    expect(formatNum(0.05)).toBe('0.0500');
  });

  it('formats tiny values with enough precision', () => {
    expect(formatNum(0.000123)).toMatch(/0\.000123/);
  });

  it('handles zero', () => {
    expect(formatNum(0)).toBe('0');
  });

  it('handles null/NaN', () => {
    expect(formatNum(null)).toBe('0');
    expect(formatNum(NaN)).toBe('0');
  });

  it('handles negatives', () => {
    expect(formatNum(-1_500_000)).toBe('-1.50mil');
    expect(formatNum(-50000)).toBe('-50.0k');
  });
});

describe('formatQty', () => {
  it('formats large quantities', () => {
    expect(formatQty(50000)).toMatch(/50,000|50000/);
  });

  it('handles zero', () => {
    expect(formatQty(0)).toBe('0');
  });

  it('handles small quantities', () => {
    expect(formatQty(0.5)).toBe('0.5000');
  });
});

describe('formatPct', () => {
  it('adds + sign for positive', () => {
    expect(formatPct(5.67)).toBe('+5.7%');
  });

  it('no + for negative', () => {
    expect(formatPct(-3.21)).toBe('-3.2%');
  });

  it('handles zero', () => {
    expect(formatPct(0)).toBe('0.0%');
  });

  it('handles null', () => {
    expect(formatPct(null)).toBe('0%');
  });
});
