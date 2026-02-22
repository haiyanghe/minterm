import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ticker } from '../src/widgets/ticker.js';
import { MiniChart } from '../src/widgets/mini-chart.js';
import { MessageLog } from '../src/widgets/message-log.js';
import { ActivityBars } from '../src/widgets/activity-bars.js';
import { RangeBar } from '../src/widgets/range-bar.js';
import { ManualAdapter } from '../src/adapters/manual-adapter.js';

// rAF shim for jsdom
let rafCallbacks = [];
global.requestAnimationFrame = (cb) => { rafCallbacks.push(cb); return rafCallbacks.length; };
global.cancelAnimationFrame = () => {};
function flushRAF() { const cbs = rafCallbacks.splice(0); cbs.forEach(cb => cb(16)); }

describe('Ticker', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); rafCallbacks = []; });

  it('renders items after rAF flush', () => {
    const t = new Ticker(container);
    t.update([{ label: 'BTC', value: '$100' }]);
    flushRAF();
    expect(container.innerHTML).toContain('mt-ticker-wrap');
    expect(container.innerHTML).toContain('BTC');
    expect(container.innerHTML).toContain('$100');
  });

  it('renders empty on no items', () => {
    const t = new Ticker(container);
    t.update([]);
    flushRAF();
    expect(container.innerHTML).toBe('');
  });

  it('binds to adapter', () => {
    const t = new Ticker(container);
    const a = new ManualAdapter();
    t.bind(a, 'items');
    a.push({ items: [{ label: 'ETH', value: '$50' }] });
    flushRAF();
    expect(container.innerHTML).toContain('ETH');
  });

  it('push appends item', () => {
    const t = new Ticker(container);
    t.update([{ label: 'A' }]);
    t.push({ label: 'B' });
    flushRAF();
    expect(container.innerHTML).toContain('A');
    expect(container.innerHTML).toContain('B');
  });

  it('destroy clears container', () => {
    const t = new Ticker(container);
    t.update([{ label: 'X' }]);
    flushRAF();
    t.destroy();
    expect(container.innerHTML).toBe('');
  });
});

describe('MiniChart', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); rafCallbacks = []; });

  it('renders sparkline from data array', () => {
    const c = new MiniChart(container, { width: 10, height: 5 });
    c.update([1, 2, 3, 4, 5, 3, 2, 4, 6, 5]);
    flushRAF();
    expect(container.querySelector('.mt-chart-canvas')).toBeTruthy();
    expect(container.innerHTML).toContain('\u25CF'); // bullet char
  });

  it('push adds single value', () => {
    const c = new MiniChart(container, { width: 5, height: 3 });
    for (let i = 0; i < 10; i++) c.push(Math.random() * 100);
    flushRAF();
    expect(container.querySelector('.mt-chart-canvas')).toBeTruthy();
  });

  it('batches multiple pushes into one render', () => {
    const c = new MiniChart(container, { width: 5, height: 3 });
    c.push(1);
    c.push(2);
    c.push(3);
    // Only one rAF should be queued
    expect(rafCallbacks.length).toBe(1);
    flushRAF();
    expect(container.querySelector('.mt-chart-canvas')).toBeTruthy();
  });

  it('handles single value', () => {
    const c = new MiniChart(container, { width: 5, height: 3 });
    c.update([42]);
    flushRAF();
    // Single value — all same, should still render
    expect(container.querySelector('.mt-chart-canvas')).toBeTruthy();
  });

  it('respects maxPoints', () => {
    const c = new MiniChart(container, { width: 5, height: 3, maxPoints: 10 });
    for (let i = 0; i < 50; i++) c.push(i);
    expect(c._data.length).toBe(10);
  });
});

describe('MessageLog', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); rafCallbacks = []; });

  it('renders messages', () => {
    const log = new MessageLog(container);
    log.update([
      { text: 'hello', type: 'good', timestamp: '00:00' },
      { text: 'world', type: 'bad' },
    ]);
    flushRAF();
    expect(container.innerHTML).toContain('hello');
    expect(container.innerHTML).toContain('world');
    expect(container.innerHTML).toContain('mt-green');
    expect(container.innerHTML).toContain('mt-red');
  });

  it('push prepends', () => {
    const log = new MessageLog(container);
    log.push('first');
    log.push('second');
    flushRAF();
    const msgs = container.querySelectorAll('.mt-message');
    expect(msgs.length).toBe(2);
    expect(msgs[0].textContent).toContain('second');
  });

  it('respects maxMessages', () => {
    const log = new MessageLog(container, { maxMessages: 3 });
    for (let i = 0; i < 10; i++) log.push(`msg ${i}`);
    expect(log._messages.length).toBe(3);
  });

  it('handles string messages', () => {
    const log = new MessageLog(container);
    log.push('plain string');
    flushRAF();
    expect(container.innerHTML).toContain('plain string');
  });
});

describe('ActivityBars', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); rafCallbacks = []; });

  it('randomize generates bars', () => {
    const bars = new ActivityBars(container);
    bars.randomize();
    flushRAF();
    expect(container.querySelectorAll('.mt-bar').length).toBe(8);
  });

  it('custom count', () => {
    const bars = new ActivityBars(container, { count: 4 });
    bars.randomize();
    flushRAF();
    expect(container.querySelectorAll('.mt-bar').length).toBe(4);
  });
});

describe('RangeBar', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); rafCallbacks = []; });

  it('renders markers', () => {
    const pb = new RangeBar(container);
    pb.update({
      lo: 0, hi: 100,
      markers: [
        { position: 50, label: 'Mid', type: 'entry' },
      ],
    });
    flushRAF();
    expect(container.querySelector('.mt-pb')).toBeTruthy();
    expect(container.innerHTML).toContain('Mid');
  });

  it('renders zones', () => {
    const pb = new RangeBar(container);
    pb.update({
      lo: 0, hi: 100,
      markers: [],
      zones: [{ from: 10, to: 30, className: 'danger' }],
    });
    flushRAF();
    expect(container.querySelector('.mt-pb-fill')).toBeTruthy();
  });
});
