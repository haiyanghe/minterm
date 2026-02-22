/** Animated pulsing activity bars — pure CSS animation */

import { BaseWidget } from './base-widget.js';

export class ActivityBars extends BaseWidget {
  /**
   * @param {HTMLElement} container
   * @param {object} [opts]
   * @param {number} [opts.count=8] — number of bars
   * @param {string} [opts.classPrefix='mt']
   */
  constructor(container, opts = {}) {
    super(container, opts);
    this._count = opts.count ?? 8;
    this._data = null;
  }

  /**
   * Update bars. data = { bars: [{ height, color?, opacity? }] } or just an array.
   */
  update(data) {
    this._data = data;
    this._schedulePaint();
  }

  /** Generate random bars (for decorative use) */
  randomize() {
    const bars = [];
    for (let i = 0; i < this._count; i++) {
      bars.push({
        height: 12 + Math.random() * 75,
        color: Math.random() > 0.45 ? 'var(--mt-green, #0f0)' : 'var(--mt-red, #f44)',
      });
    }
    this.update(bars);
  }

  _onData(val) {
    this.update(val);
  }

  _paint() {
    const pfx = this._pfx;
    let bars = Array.isArray(this._data) ? this._data : (this._data?.bars || []);
    if (!bars.length) {
      bars = [];
      for (let i = 0; i < this._count; i++) {
        bars.push({ height: 12 + Math.random() * 75, color: Math.random() > 0.45 ? 'var(--mt-green, #0f0)' : 'var(--mt-red, #f44)' });
      }
    }
    this._container.innerHTML = `<div class="${pfx}-bars">${bars.map(b =>
      `<div class="${pfx}-bar" style="height:${(b.height || 50).toFixed(0)}%;background:${b.color || 'var(--mt-accent, #0aa)'};${b.opacity != null ? `opacity:${b.opacity}` : ''}"></div>`
    ).join('')}</div>`;
  }
}
