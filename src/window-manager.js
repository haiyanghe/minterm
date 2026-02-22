/** DOS-style draggable, resizable window manager */

import { Emitter } from './emitter.js';
import { getNextZ, bringToFront, cycleWindow } from './z-index.js';

const DEFAULTS = {
  x: 50, y: 50, width: 400, height: null,
  title: '', closable: false, lockable: false,
  minWidth: 200, minHeight: 60,
  classPrefix: 'mt',
};

export class WindowManager extends Emitter {
  /**
   * @param {object} [opts]
   * @param {HTMLElement} [opts.container=document.body] — parent for windows
   * @param {string} [opts.classPrefix='mt'] — CSS class prefix
   * @param {number} [opts.layoutSlots=5] — number of layout snapshot slots (0 to disable keybinds)
   * @param {boolean} [opts.layoutBar=false] — show clickable layout bar UI
   * @param {boolean} [opts.lockable=false] — show lock button on all windows by default
   * @param {boolean} [opts.escapeClose=true] — bind Escape to closeAll()
   */
  constructor(opts = {}) {
    super();
    this._container = opts.container || document.body;
    this._pfx = opts.classPrefix || DEFAULTS.classPrefix;
    this._lockable = opts.lockable ?? false;
    this._escapeClose = opts.escapeClose ?? true;
    this._windows = {};
    this._dragState = null;
    this._resizeState = null;
    this._layouts = {};
    this._layoutSlots = opts.layoutSlots ?? 5;
    this._layoutBarEl = null;
    this._bound = false;
    this._bindEvents();
    if (opts.layoutBar) this._createLayoutBar();
  }

  /** Create a window. Returns the window element. */
  createWindow(id, opts = {}) {
    if (this._windows[id]) return this._windows[id].el;

    const o = { ...DEFAULTS, lockable: this._lockable, ...opts };
    const pfx = this._pfx;

    const win = document.createElement('div');
    win.className = `${pfx}-win`;
    win.id = `${pfx}-win-${id}`;
    win.dataset.winId = id;
    win.style.left = o.x + 'px';
    win.style.top = o.y + 'px';
    if (o.width) win.style.width = o.width + 'px';
    if (o.height) win.style.height = o.height + 'px';
    win.style.zIndex = getNextZ();
    win.dataset.minW = o.minWidth;
    win.dataset.minH = o.minHeight;

    const lockBtn = o.lockable
      ? `<span class="${pfx}-win-lock" data-lock="${id}" title="Lock window"><svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M9 1C9 .4 8.6 0 8 0S7 .4 7 1v4L4.5 6.5 4 7v1.5l3-.5V15l1 1 1-1V8l3 .5V7l-.5-.5L9 5V1z"/></svg></span>`
      : '';

    win.innerHTML = `
      <div class="${pfx}-win-titlebar" data-win="${id}">
        <span class="${pfx}-win-title">${o.title}</span>
        ${lockBtn}${o.closable ? `<span class="${pfx}-win-close" data-close="${id}">\u2715</span>` : ''}
      </div>
      <div class="${pfx}-win-body" id="${pfx}-win-body-${id}"></div>
      <div class="${pfx}-win-resize" data-win="${id}"></div>
    `;

    this._container.appendChild(win);
    this._windows[id] = { el: win, locked: false };
    this.emit('window:create', { id, el: win });
    return win;
  }

  closeWindow(id) {
    const w = this._windows[id];
    if (!w) return;
    w.el.remove();
    delete this._windows[id];
    this.emit('window:close', { id });
  }

  /** Close all closable, unlocked windows */
  closeAll() {
    for (const id of Object.keys(this._windows)) {
      const w = this._windows[id];
      if (w.locked) continue;
      if (w.el.querySelector(`.${this._pfx}-win-close`)) {
        this.closeWindow(id);
      }
    }
  }

  setContent(id, title, html) {
    const w = this._windows[id];
    if (!w) return;
    const pfx = this._pfx;
    w.el.querySelector(`.${pfx}-win-title`).textContent = title;
    w.el.querySelector(`.${pfx}-win-body`).innerHTML = html;
  }

  getBody(id) {
    const w = this._windows[id];
    return w ? w.el.querySelector(`.${this._pfx}-win-body`) : null;
  }

  /**
   * Shorthand: create a window and mount a widget in one call.
   * @param {string} id — window id
   * @param {Function} WidgetClass — widget constructor (e.g. MiniChart)
   * @param {object} [widgetOpts] — options forwarded to widget constructor
   * @param {object} [windowOpts] — options forwarded to createWindow
   * @returns {object} the widget instance
   */
  addWidget(id, WidgetClass, widgetOpts = {}, windowOpts = {}) {
    this.createWindow(id, windowOpts);
    return new WidgetClass(this.getBody(id), widgetOpts);
  }

  getWindow(id) { return this._windows[id]?.el || null; }
  has(id) { return !!this._windows[id]; }
  getIds() { return Object.keys(this._windows); }

  // ── Lock API ──

  /** Lock a window — prevents drag and resize */
  lockWindow(id) { this._setLocked(id, true); }

  /** Unlock a window */
  unlockWindow(id) { this._setLocked(id, false); }

  /** Toggle lock state */
  toggleLock(id) {
    const w = this._windows[id];
    if (w) this._setLocked(id, !w.locked);
  }

  /** Check if a window is locked */
  isLocked(id) { return !!this._windows[id]?.locked; }

  /** Show lock buttons on all windows that have them hidden */
  showLockButtons() { this._toggleLockButtons(true); }

  /** Hide lock buttons on all windows */
  hideLockButtons() { this._toggleLockButtons(false); }

  _setLocked(id, locked) {
    const w = this._windows[id];
    if (!w) return;
    w.locked = locked;
    const pfx = this._pfx;
    const el = w.el;
    if (locked) {
      el.classList.add(`${pfx}-win-locked`);
    } else {
      el.classList.remove(`${pfx}-win-locked`);
    }
    const btn = el.querySelector(`.${pfx}-win-lock`);
    if (btn) btn.title = locked ? 'Unlock window' : 'Lock window';
    this.emit('window:lock', { id, locked });
  }

  _toggleLockButtons(show) {
    const pfx = this._pfx;
    for (const id in this._windows) {
      const btn = this._windows[id].el.querySelector(`.${pfx}-win-lock`);
      if (btn) btn.classList.toggle(`${pfx}-win-lock-hidden`, !show);
    }
  }

  // ── Focus / Layout ──

  focus(id) {
    const w = this._windows[id];
    if (w) {
      bringToFront(w.el);
      this.emit('window:focus', { id, el: w.el });
    }
  }

  saveLayout(slot) {
    // Flush any in-progress drag so transform is baked into left/top
    if (this._dragState) {
      const d = this._dragState;
      d.el.style.left = (d.origX + (d.tx || 0)) + 'px';
      d.el.style.top = (d.origY + (d.ty || 0)) + 'px';
      d.el.style.transform = '';
      d.el.classList.remove(`${this._pfx}-win-dragging`);
      this._dragState = null;
    }

    const snap = {};
    for (const [id, w] of Object.entries(this._windows)) {
      const el = w.el;
      snap[id] = {
        left: el.style.left, top: el.style.top,
        width: el.style.width, height: el.style.height,
        zIndex: el.style.zIndex, locked: w.locked,
      };
    }
    this._layouts[slot] = snap;
    this.emit('layout:save', { slot });
    this._updateLayoutBar();
  }

  restoreLayout(slot) {
    const snap = this._layouts[slot];
    if (!snap) return;
    for (const [id, info] of Object.entries(snap)) {
      const w = this._windows[id];
      if (!w) continue;
      w.el.style.transform = '';
      Object.assign(w.el.style, { left: info.left, top: info.top, width: info.width });
      if (info.height) w.el.style.height = info.height;
      if (info.zIndex) w.el.style.zIndex = info.zIndex;
      if (info.locked != null) this._setLocked(id, info.locked);
    }
    this.emit('layout:restore', { slot });
  }

  hasLayout(slot) { return !!this._layouts[slot]; }

  cycle(reverse = false) {
    cycleWindow(this._container, reverse);
  }

  _sel(cls) { return `.${this._pfx}-${cls}`; }

  // ── Layout Bar UI ──

  _createLayoutBar() {
    if (this._layoutBarEl || this._layoutSlots <= 0) return;
    const pfx = this._pfx;
    const bar = document.createElement('div');
    bar.className = `${pfx}-layout-bar`;
    this._container.appendChild(bar);
    this._layoutBarEl = bar;

    bar.addEventListener('click', (e) => {
      const slot = e.target.closest('[data-layout-slot]');
      if (!slot) return;
      const num = parseInt(slot.dataset.layoutSlot);
      if (e.ctrlKey || e.metaKey) {
        this.saveLayout(num);
      } else if (this._layouts[num]) {
        this.restoreLayout(num);
      }
    });

    this._updateLayoutBar();
  }

  _updateLayoutBar() {
    if (!this._layoutBarEl) return;
    const pfx = this._pfx;
    let html = '';
    for (let i = 1; i <= this._layoutSlots; i++) {
      const saved = !!this._layouts[i];
      const cls = saved ? `${pfx}-layout-slot ${pfx}-layout-saved` : `${pfx}-layout-slot`;
      html += `<span class="${cls}" data-layout-slot="${i}">${i}</span>`;
    }
    this._layoutBarEl.innerHTML = html;
  }

  // ── Event binding ──

  _isLocked(win) {
    const id = win?.dataset?.winId;
    return id ? !!this._windows[id]?.locked : false;
  }

  _bindEvents() {
    if (this._bound) return;
    this._bound = true;
    const self = this;
    const pfx = this._pfx;

    document.addEventListener('mousedown', (e) => {
      const anyWin = e.target.closest(`.${pfx}-win`);
      if (anyWin) {
        bringToFront(anyWin);
        const winId = anyWin.dataset.winId;
        if (winId) self.emit('window:focus', { id: winId, el: anyWin });
      }

      // Lock button
      const lockBtn = e.target.closest(`.${pfx}-win-lock`);
      if (lockBtn) { self.toggleLock(lockBtn.dataset.lock); return; }

      const closeBtn = e.target.closest(`.${pfx}-win-close`);
      if (closeBtn) { self.closeWindow(closeBtn.dataset.close); return; }

      const titlebar = e.target.closest(`.${pfx}-win-titlebar`);
      if (titlebar) {
        e.preventDefault();
        const win = titlebar.closest(`.${pfx}-win`);
        bringToFront(win);
        if (!self._isLocked(win)) {
          self._dragState = { el: win, ox: e.clientX - win.offsetLeft, oy: e.clientY - win.offsetTop, origX: win.offsetLeft, origY: win.offsetTop };
          win.classList.add(`${pfx}-win-dragging`);
        }
        return;
      }
      const rh = e.target.closest(`.${pfx}-win-resize`);
      if (rh) {
        e.preventDefault();
        const win = rh.closest(`.${pfx}-win`);
        bringToFront(win);
        if (!self._isLocked(win)) {
          self._resizeState = { el: win, startX: e.clientX, startY: e.clientY, startW: win.offsetWidth, startH: win.offsetHeight };
        }
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (self._dragState) {
        e.preventDefault();
        const d = self._dragState;
        d.tx = e.clientX - d.ox - d.origX;
        d.ty = e.clientY - d.oy - d.origY;
        d.el.style.transform = `translate(${d.tx}px,${d.ty}px)`;
        self.emit('window:move', { id: d.el.dataset.winId, el: d.el });
      }
      if (self._resizeState) {
        e.preventDefault();
        const r = self._resizeState;
        const minW = parseInt(r.el.dataset.minW) || 200;
        const minH = parseInt(r.el.dataset.minH) || 60;
        r.el.style.width = Math.max(minW, r.startW + e.clientX - r.startX) + 'px';
        r.el.style.height = Math.max(minH, r.startH + e.clientY - r.startY) + 'px';
        self.emit('window:resize', { id: r.el.dataset.winId, el: r.el });
      }
    });

    document.addEventListener('mouseup', () => {
      if (self._dragState) {
        const d = self._dragState;
        // Bake transform into left/top so offsetLeft/offsetTop stay correct
        d.el.style.left = (d.origX + (d.tx || 0)) + 'px';
        d.el.style.top = (d.origY + (d.ty || 0)) + 'px';
        d.el.style.transform = '';
        d.el.classList.remove(`${pfx}-win-dragging`);
        self._dragState = null;
      }
      self._resizeState = null;
    });

    // Touch
    document.addEventListener('touchstart', (e) => {
      const lockBtn = e.target.closest(`.${pfx}-win-lock`);
      if (lockBtn) { self.toggleLock(lockBtn.dataset.lock); return; }
      const closeBtn = e.target.closest(`.${pfx}-win-close`);
      if (closeBtn) { self.closeWindow(closeBtn.dataset.close); return; }
      const titlebar = e.target.closest(`.${pfx}-win-titlebar`);
      if (titlebar) {
        const win = titlebar.closest(`.${pfx}-win`);
        const t = e.touches[0];
        bringToFront(win);
        if (!self._isLocked(win)) {
          self._dragState = { el: win, ox: t.clientX - win.offsetLeft, oy: t.clientY - win.offsetTop, origX: win.offsetLeft, origY: win.offsetTop };
          win.classList.add(`${pfx}-win-dragging`);
        }
        return;
      }
      const rh = e.target.closest(`.${pfx}-win-resize`);
      if (rh) {
        const win = rh.closest(`.${pfx}-win`);
        const t = e.touches[0];
        bringToFront(win);
        if (!self._isLocked(win)) {
          self._resizeState = { el: win, startX: t.clientX, startY: t.clientY, startW: win.offsetWidth, startH: win.offsetHeight };
        }
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (self._dragState) {
        e.preventDefault();
        const t = e.touches[0];
        const d = self._dragState;
        d.tx = t.clientX - d.ox - d.origX;
        d.ty = t.clientY - d.oy - d.origY;
        d.el.style.transform = `translate(${d.tx}px,${d.ty}px)`;
        self.emit('window:move', { id: d.el.dataset.winId, el: d.el });
      }
      if (self._resizeState) {
        e.preventDefault();
        const t = e.touches[0];
        const r = self._resizeState;
        r.el.style.width = Math.max(parseInt(r.el.dataset.minW) || 200, r.startW + t.clientX - r.startX) + 'px';
        r.el.style.height = Math.max(parseInt(r.el.dataset.minH) || 60, r.startH + t.clientY - r.startY) + 'px';
        self.emit('window:resize', { id: r.el.dataset.winId, el: r.el });
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      if (self._dragState) {
        const d = self._dragState;
        d.el.style.left = (d.origX + (d.tx || 0)) + 'px';
        d.el.style.top = (d.origY + (d.ty || 0)) + 'px';
        d.el.style.transform = '';
        d.el.classList.remove(`${pfx}-win-dragging`);
        self._dragState = null;
      }
      self._resizeState = null;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (self._escapeClose) self.closeAll();
        self.emit('escape');
        return;
      }

      if (self._layoutSlots > 0) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= self._layoutSlots) {
          const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            self.saveLayout(num);
          } else if (!isInput && !e.altKey) {
            e.preventDefault();
            if (self._layouts[num]) {
              self.restoreLayout(num);
            }
          }
        }
      }
    });
  }
}
