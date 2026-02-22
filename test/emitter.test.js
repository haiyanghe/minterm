import { describe, it, expect, vi } from 'vitest';
import { Emitter } from '../src/emitter.js';

describe('Emitter', () => {
  it('fires listeners on emit', () => {
    const e = new Emitter();
    const fn = vi.fn();
    e.on('evt', fn);
    e.emit('evt', 42);
    expect(fn).toHaveBeenCalledWith(42, undefined);
  });

  it('supports multiple listeners', () => {
    const e = new Emitter();
    const a = vi.fn(), b = vi.fn();
    e.on('x', a);
    e.on('x', b);
    e.emit('x', 1);
    expect(a).toHaveBeenCalledWith(1, undefined);
    expect(b).toHaveBeenCalledWith(1, undefined);
  });

  it('removes a listener with off', () => {
    const e = new Emitter();
    const fn = vi.fn();
    e.on('x', fn);
    e.off('x', fn);
    e.emit('x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('once fires only once', () => {
    const e = new Emitter();
    const fn = vi.fn();
    e.once('x', fn);
    e.emit('x', 'a');
    e.emit('x', 'b');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a', undefined);
  });

  it('off removes a once listener by original fn', () => {
    const e = new Emitter();
    const fn = vi.fn();
    e.once('x', fn);
    e.off('x', fn);
    e.emit('x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('destroy clears all listeners', () => {
    const e = new Emitter();
    const fn = vi.fn();
    e.on('x', fn);
    e.destroy();
    e.emit('x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('passes two args', () => {
    const e = new Emitter();
    const fn = vi.fn();
    e.on('x', fn);
    e.emit('x', 'a', 'b');
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });

  it('chains on/off/emit', () => {
    const e = new Emitter();
    const result = e.on('x', () => {}).off('x', () => {}).emit('x');
    expect(result).toBe(e);
  });
});
