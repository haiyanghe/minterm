/** Scrolling ticker tape widget — CSS-driven animation */

import { BaseWidget } from './base-widget.js';

export class Ticker extends BaseWidget {
  /**
   * @param {HTMLElement} container — mount point
   * @param {object} [opts]
   * @param {number} [opts.baseDuration=8] — seconds for a full scroll cycle
   * @param {number} [opts.durationPerItem=2] — added seconds per item
   * @param {string} [opts.classPrefix='mt'] — CSS class prefix
   */
  constructor(container, opts = {}) {
    super(container, opts);
    this._baseDuration = opts.baseDuration ?? 8;
    this._durationPerItem = opts.durationPerItem ?? 2;
    this._items = [];
    this._lastItemCount = -1;
  }

  /** Replace all ticker items. Each item: { label, value, className? } */
  update(items) {
    this._items = items;
    this._schedulePaint();
  }

  /** Push a single item (appends) */
  push(item) {
    this._items.push(item);
    this._schedulePaint();
  }

  _paint() {
    const pfx = this._pfx;
    const items = this._items;
    if (!items.length) {
      this._container.innerHTML = '';
      return;
    }
    const inner = items.map(it =>
      `<span class="${pfx}-ticker-item">${it.label ? `<span class="${pfx}-ticker-label">${it.label}</span> ` : ''}${it.value ? `<span class="${it.className || ''}">${it.value}</span>` : ''}</span>`
    ).join('');
    const duration = Math.max(this._baseDuration, items.length * this._durationPerItem);
    // Only rebuild DOM when item count changes; update track content otherwise
    if (items.length !== this._lastItemCount) {
      this._container.innerHTML = `<div class="${pfx}-ticker-wrap" style="--ticker-duration:${duration}s"><div class="${pfx}-ticker-track">${inner}${inner}</div></div>`;
      this._lastItemCount = items.length;
    } else {
      const track = this._container.querySelector(`.${pfx}-ticker-track`);
      if (track) track.innerHTML = inner + inner;
    }
  }
}
