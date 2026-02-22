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
});
