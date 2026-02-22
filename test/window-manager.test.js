import { describe, it, expect, beforeEach } from 'vitest';
import { WindowManager } from '../src/window-manager.js';
import { Ticker } from '../src/widgets/ticker.js';

describe('WindowManager', () => {
  let wm;
  beforeEach(() => {
    document.body.innerHTML = '';
    wm = new WindowManager();
  });

  it('creates a window', () => {
    const el = wm.createWindow('test', { x: 10, y: 20, width: 300, title: 'Test' });
    expect(el).toBeTruthy();
    expect(el.classList.contains('mt-win')).toBe(true);
    expect(document.querySelector('.mt-win')).toBe(el);
  });

  it('does not create duplicate windows', () => {
    wm.createWindow('a');
    wm.createWindow('a');
    expect(document.querySelectorAll('.mt-win').length).toBe(1);
  });

  it('closes a window', () => {
    wm.createWindow('a');
    expect(wm.has('a')).toBe(true);
    wm.closeWindow('a');
    expect(wm.has('a')).toBe(false);
    expect(document.querySelectorAll('.mt-win').length).toBe(0);
  });

  it('setContent updates title and body', () => {
    wm.createWindow('a', { title: 'Old' });
    wm.setContent('a', 'New Title', '<p>hello</p>');
    const title = document.querySelector('.mt-win-title');
    expect(title.textContent).toBe('New Title');
    expect(wm.getBody('a').innerHTML).toBe('<p>hello</p>');
  });

  it('getBody returns body element', () => {
    wm.createWindow('a');
    const body = wm.getBody('a');
    expect(body).toBeTruthy();
    expect(body.classList.contains('mt-win-body')).toBe(true);
  });

  it('getBody returns null for missing window', () => {
    expect(wm.getBody('nope')).toBeNull();
  });

  it('getIds returns all window ids', () => {
    wm.createWindow('x');
    wm.createWindow('y');
    expect(wm.getIds().sort()).toEqual(['x', 'y']);
  });

  it('closable window has close button', () => {
    wm.createWindow('a', { closable: true });
    expect(document.querySelector('.mt-win-close')).toBeTruthy();
  });

  it('non-closable window has no close button', () => {
    wm.createWindow('a', { closable: false });
    expect(document.querySelector('.mt-win-close')).toBeNull();
  });

  it('saveLayout and restoreLayout', () => {
    wm.createWindow('a', { x: 10, y: 20 });
    wm.saveLayout(1);
    // Move the window
    wm.getWindow('a').style.left = '500px';
    wm.restoreLayout(1);
    expect(wm.getWindow('a').style.left).toBe('10px');
  });

  it('restoreLayout clears residual transform', () => {
    wm.createWindow('a', { x: 30, y: 40 });
    wm.saveLayout(1);
    // Simulate a stale transform left over from dragging
    wm.getWindow('a').style.transform = 'translate(200px, 100px)';
    wm.restoreLayout(1);
    expect(wm.getWindow('a').style.transform).toBe('');
    expect(wm.getWindow('a').style.left).toBe('30px');
    expect(wm.getWindow('a').style.top).toBe('40px');
  });

  it('saveLayout flushes in-progress drag state', () => {
    wm.createWindow('a', { x: 10, y: 20 });
    // Simulate an active drag with transform offset
    const el = wm.getWindow('a');
    wm._dragState = { el, origX: 10, origY: 20, tx: 50, ty: 60 };
    el.style.transform = 'translate(50px, 60px)';
    el.classList.add('mt-win-dragging');

    wm.saveLayout(1);

    // Drag should be flushed: transform baked into left/top
    expect(el.style.transform).toBe('');
    expect(el.style.left).toBe('60px');   // 10 + 50
    expect(el.style.top).toBe('80px');    // 20 + 60
    expect(el.classList.contains('mt-win-dragging')).toBe(false);
    expect(wm._dragState).toBeNull();

    // Saved layout should reflect the baked position
    el.style.left = '0px';
    wm.restoreLayout(1);
    expect(el.style.left).toBe('60px');
  });

  it('restoreLayout preserves positions across multiple windows', () => {
    wm.createWindow('a', { x: 10, y: 20 });
    wm.createWindow('b', { x: 300, y: 400 });
    wm.createWindow('c', { x: 600, y: 50 });
    wm.saveLayout(1);

    // Scramble all positions
    wm.getWindow('a').style.left = '0px';
    wm.getWindow('b').style.left = '0px';
    wm.getWindow('c').style.left = '0px';

    wm.restoreLayout(1);
    expect(wm.getWindow('a').style.left).toBe('10px');
    expect(wm.getWindow('b').style.left).toBe('300px');
    expect(wm.getWindow('c').style.left).toBe('600px');
    expect(wm.getWindow('a').style.top).toBe('20px');
    expect(wm.getWindow('b').style.top).toBe('400px');
    expect(wm.getWindow('c').style.top).toBe('50px');
  });

  it('restoreLayout saves and restores lock state', () => {
    wm.createWindow('a', { x: 10, y: 20, lockable: true });
    wm.lockWindow('a');
    wm.saveLayout(1);

    wm.unlockWindow('a');
    expect(wm.isLocked('a')).toBe(false);

    wm.restoreLayout(1);
    expect(wm.isLocked('a')).toBe(true);
  });

  it('restoreLayout skips windows not in snapshot', () => {
    wm.createWindow('a', { x: 10, y: 20 });
    wm.saveLayout(1);

    // Create a new window after save
    wm.createWindow('b', { x: 500, y: 500 });
    wm.restoreLayout(1);

    // 'b' was not in the snapshot — should be untouched
    expect(wm.getWindow('b').style.left).toBe('500px');
  });

  it('restoreLayout is a no-op for empty slot', () => {
    wm.createWindow('a', { x: 10, y: 20 });
    wm.getWindow('a').style.left = '999px';
    wm.restoreLayout(3); // never saved
    expect(wm.getWindow('a').style.left).toBe('999px');
  });

  it('hasLayout returns false for empty slots and true for saved', () => {
    expect(wm.hasLayout(1)).toBe(false);
    wm.createWindow('a');
    wm.saveLayout(1);
    expect(wm.hasLayout(1)).toBe(true);
    expect(wm.hasLayout(2)).toBe(false);
  });

  it('saveLayout and restoreLayout preserves width and height', () => {
    wm.createWindow('a', { x: 10, y: 20, width: 400, height: 250 });
    wm.saveLayout(1);

    const el = wm.getWindow('a');
    el.style.width = '100px';
    el.style.height = '50px';
    wm.restoreLayout(1);

    expect(el.style.width).toBe('400px');
    expect(el.style.height).toBe('250px');
  });

  // ── Lock API ──

  it('lockWindow and unlockWindow toggle lock state', () => {
    wm.createWindow('a', { lockable: true });
    expect(wm.isLocked('a')).toBe(false);
    wm.lockWindow('a');
    expect(wm.isLocked('a')).toBe(true);
    wm.unlockWindow('a');
    expect(wm.isLocked('a')).toBe(false);
  });

  it('toggleLock flips lock state', () => {
    wm.createWindow('a', { lockable: true });
    wm.toggleLock('a');
    expect(wm.isLocked('a')).toBe(true);
    wm.toggleLock('a');
    expect(wm.isLocked('a')).toBe(false);
  });

  it('locked window gets CSS class', () => {
    wm.createWindow('a', { lockable: true });
    wm.lockWindow('a');
    expect(wm.getWindow('a').classList.contains('mt-win-locked')).toBe(true);
    wm.unlockWindow('a');
    expect(wm.getWindow('a').classList.contains('mt-win-locked')).toBe(false);
  });

  it('emits window:lock event', () => {
    wm.createWindow('a', { lockable: true });
    const events = [];
    wm.on('window:lock', (e) => events.push(e));
    wm.lockWindow('a');
    wm.unlockWindow('a');
    expect(events).toEqual([
      { id: 'a', locked: true },
      { id: 'a', locked: false },
    ]);
  });

  // ── Events ──

  it('emits window:create on create', () => {
    let fired = false;
    wm.on('window:create', ({ id }) => { if (id === 'z') fired = true; });
    wm.createWindow('z');
    expect(fired).toBe(true);
  });

  it('emits window:close on close', () => {
    wm.createWindow('z');
    let fired = false;
    wm.on('window:close', ({ id }) => { if (id === 'z') fired = true; });
    wm.closeWindow('z');
    expect(fired).toBe(true);
  });

  it('emits layout:save and layout:restore events', () => {
    wm.createWindow('a');
    const events = [];
    wm.on('layout:save', (e) => events.push({ type: 'save', ...e }));
    wm.on('layout:restore', (e) => events.push({ type: 'restore', ...e }));
    wm.saveLayout(2);
    wm.restoreLayout(2);
    expect(events).toEqual([
      { type: 'save', slot: 2 },
      { type: 'restore', slot: 2 },
    ]);
  });

  // ── Misc ──

  it('respects custom classPrefix', () => {
    document.body.innerHTML = '';
    const custom = new WindowManager({ classPrefix: 'foo' });
    custom.createWindow('bar', { title: 'Test' });
    expect(document.querySelector('.foo-win')).toBeTruthy();
    expect(document.querySelector('.foo-win-titlebar')).toBeTruthy();
  });

  it('addWidget creates window and returns widget instance', () => {
    const ticker = wm.addWidget('myticker', Ticker, {}, { title: 'Prices', width: 400 });
    expect(ticker).toBeInstanceOf(Ticker);
    expect(wm.has('myticker')).toBe(true);
    expect(wm.getBody('myticker')).toBeTruthy();
  });

  it('closeAll only closes unlocked closable windows', () => {
    wm.createWindow('a', { closable: true });
    wm.createWindow('b', { closable: true, lockable: true });
    wm.createWindow('c', { closable: false });
    wm.lockWindow('b');

    wm.closeAll();

    expect(wm.has('a')).toBe(false);  // closable + unlocked — closed
    expect(wm.has('b')).toBe(true);   // closable but locked — kept
    expect(wm.has('c')).toBe(true);   // not closable — kept
  });

  it('focus brings window to front', () => {
    wm.createWindow('a');
    wm.createWindow('b');
    const zBefore = parseInt(wm.getWindow('a').style.zIndex);
    wm.focus('a');
    const zAfter = parseInt(wm.getWindow('a').style.zIndex);
    expect(zAfter).toBeGreaterThan(zBefore);
  });
});
