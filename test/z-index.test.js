import { describe, it, expect } from 'vitest';
import { getNextZ, bringToFront } from '../src/z-index.js';

describe('z-index', () => {
  it('getNextZ returns incrementing values', () => {
    const a = getNextZ();
    const b = getNextZ();
    expect(b).toBeGreaterThan(a);
  });

  it('bringToFront sets zIndex on element', () => {
    const el = document.createElement('div');
    bringToFront(el);
    expect(parseInt(el.style.zIndex)).toBeGreaterThan(0);
  });

  it('bringToFront handles null gracefully', () => {
    expect(() => bringToFront(null)).not.toThrow();
  });
});
