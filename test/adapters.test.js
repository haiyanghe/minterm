import { describe, it, expect, vi } from 'vitest';
import { ManualAdapter } from '../src/adapters/manual-adapter.js';
import { BaseAdapter } from '../src/adapters/base-adapter.js';
import { RedisAdapter } from '../src/adapters/redis-adapter.js';

describe('ManualAdapter', () => {
  it('emits data on push', () => {
    const a = new ManualAdapter();
    const fn = vi.fn();
    a.on('data', fn);
    a.push({ price: 100 });
    expect(fn).toHaveBeenCalledWith({ price: 100 }, undefined);
  });

  it('applies transform', () => {
    const a = new ManualAdapter({ transform: (d) => d.x * 2 });
    const fn = vi.fn();
    a.on('data', fn);
    a.push({ x: 5 });
    expect(fn).toHaveBeenCalledWith(10, undefined);
  });

  it('skips null from transform', () => {
    const a = new ManualAdapter({ transform: () => null });
    const fn = vi.fn();
    a.on('data', fn);
    a.push('anything');
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('BaseAdapter throttle', () => {
  it('fires first call immediately', () => {
    const a = new ManualAdapter({ throttle: 1000 });
    const fn = vi.fn();
    a.on('data', fn);
    a.push(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('coalesces rapid calls into trailing emission', async () => {
    vi.useFakeTimers();
    const a = new ManualAdapter({ throttle: 100 });
    const fn = vi.fn();
    a.on('data', fn);
    a.push(1); // fires immediately
    a.push(2); // queued
    a.push(3); // replaces 2 in queue
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1, undefined);

    vi.advanceTimersByTime(150);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(3, undefined);
    vi.useRealTimers();
  });

  it('disconnect clears pending', () => {
    vi.useFakeTimers();
    const a = new ManualAdapter({ throttle: 100 });
    const fn = vi.fn();
    a.on('data', fn);
    a.push(1);
    a.push(2); // queued
    a.disconnect();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1); // only the first
    vi.useRealTimers();
  });
});

describe('RedisAdapter', () => {
  it('throws without client', async () => {
    const r = new RedisAdapter({ channels: 'test' });
    await expect(r.connect()).rejects.toThrow('requires opts.client');
  });

  it('subscribes to channels on connect', async () => {
    const messages = [];
    const mockClient = {
      duplicate: () => ({
        on: vi.fn((evt, handler) => {
          if (evt === 'message') messages.push(handler);
        }),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        removeListener: vi.fn(),
        quit: vi.fn(),
      }),
    };
    const r = new RedisAdapter({ client: mockClient, channels: ['ch1', 'ch2'] });
    const openFn = vi.fn();
    r.on('open', openFn);
    await r.connect();

    expect(openFn).toHaveBeenCalled();
    expect(mockClient.duplicate().subscribe).toBeDefined();
  });

  it('emits parsed JSON from message handler', async () => {
    let messageHandler;
    const sub = {
      on: vi.fn((evt, handler) => { if (evt === 'message') messageHandler = handler; }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      removeListener: vi.fn(),
      quit: vi.fn(),
    };
    const mockClient = { duplicate: () => sub };
    const r = new RedisAdapter({ client: mockClient, channels: 'prices' });
    const dataFn = vi.fn();
    r.on('data', dataFn);
    await r.connect();

    // Simulate a message
    messageHandler('{"price":42}', 'prices');
    expect(dataFn).toHaveBeenCalledWith({ channel: 'prices', data: { price: 42 } }, undefined);
  });

  it('emits raw string when JSON parse fails', async () => {
    let messageHandler;
    const sub = {
      on: vi.fn((evt, handler) => { if (evt === 'message') messageHandler = handler; }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      removeListener: vi.fn(),
      quit: vi.fn(),
    };
    const mockClient = { duplicate: () => sub };
    const r = new RedisAdapter({ client: mockClient, channels: 'raw' });
    const dataFn = vi.fn();
    r.on('data', dataFn);
    await r.connect();

    messageHandler('not json', 'raw');
    expect(dataFn).toHaveBeenCalledWith({ channel: 'raw', data: 'not json' }, undefined);
  });

  it('applies transform', async () => {
    let messageHandler;
    const sub = {
      on: vi.fn((evt, handler) => { if (evt === 'message') messageHandler = handler; }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      removeListener: vi.fn(),
      quit: vi.fn(),
    };
    const mockClient = { duplicate: () => sub };
    const r = new RedisAdapter({
      client: mockClient,
      channels: 'ch',
      transform: (d) => d.data.price,
    });
    const dataFn = vi.fn();
    r.on('data', dataFn);
    await r.connect();

    messageHandler('{"price":99}', 'ch');
    expect(dataFn).toHaveBeenCalledWith(99, undefined);
  });

  it('disconnect cleans up', async () => {
    const sub = {
      on: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      removeListener: vi.fn(),
      quit: vi.fn(),
    };
    const mockClient = { duplicate: () => sub };
    const r = new RedisAdapter({ client: mockClient, channels: 'ch' });
    await r.connect();
    await r.disconnect();
    expect(sub.unsubscribe).toHaveBeenCalledWith('ch');
    expect(sub.quit).toHaveBeenCalled();
  });
});
