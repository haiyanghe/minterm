import { describe, it, expect } from 'vitest';
import { themes, applyTheme } from '../src/themes.js';

describe('themes', () => {
  it('has built-in themes', () => {
    expect(Object.keys(themes)).toContain('cyber');
    expect(Object.keys(themes)).toContain('amber');
    expect(Object.keys(themes)).toContain('phosphor');
    expect(Object.keys(themes)).toContain('hotline');
    expect(Object.keys(themes)).toContain('ice');
    expect(Object.keys(themes)).toContain('slate');
  });

  it('each theme has required CSS vars', () => {
    const required = ['--mt-accent', '--mt-bg', '--mt-green', '--mt-red', '--mt-text'];
    for (const [name, vars] of Object.entries(themes)) {
      for (const key of required) {
        expect(vars[key], `${name} missing ${key}`).toBeTruthy();
      }
    }
  });

  it('applyTheme by name sets CSS vars', () => {
    const el = document.createElement('div');
    applyTheme('amber', el);
    expect(el.style.getPropertyValue('--mt-accent')).toBe('#a08030');
    expect(el.style.getPropertyValue('--mt-bg')).toBe('#0e0c08');
  });

  it('applyTheme with custom object', () => {
    const el = document.createElement('div');
    applyTheme({ '--mt-accent': '#f00', '--mt-bg': '#111' }, el);
    expect(el.style.getPropertyValue('--mt-accent')).toBe('#f00');
    expect(el.style.getPropertyValue('--mt-bg')).toBe('#111');
  });

  it('applyTheme ignores unknown name', () => {
    expect(() => applyTheme('nonexistent')).not.toThrow();
  });
});
