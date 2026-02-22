/** Horizontal range bar with markers, zones, and interactive ghost hover */

import { BaseWidget } from './base-widget.js';

export class RangeBar extends BaseWidget {
  /**
   * @param {HTMLElement} container
   * @param {object} [opts]
   * @param {string} [opts.classPrefix='mt']
   * @param {(v:number)=>string} [opts.formatLabel] — value formatter
   */
  constructor(container, opts = {}) {
    super(container, opts);
    this._fmt = opts.formatLabel || ((v) => v.toFixed(2));
    this._data = null;
    this._ghostBound = false;
  }

  /**
   * Update the bar.
   * @param {object} data
   * @param {number} data.lo — range minimum
   * @param {number} data.hi — range maximum
   * @param {Array} [data.markers] — [{ position, label, type?, className? }]
   * @param {Array} [data.zones] — [{ from, to, className }]
   */
  update(data) {
    this._data = data;
    this._schedulePaint();
  }

  _onData(val) {
    if (val && typeof val === 'object') this.update(val);
  }

  _paint() {
    const d = this._data;
    if (!d) return;
    const pfx = this._pfx;
    const { lo, hi, markers = [], zones = [] } = d;
    const range = hi - lo || 1;
    const pct = (v) => ((v - lo) / range * 100).toFixed(1);

    let html = `<div class="${pfx}-pb" data-pb-lo="${lo}" data-pb-hi="${hi}">`;
    html += `<div class="${pfx}-pb-track">`;

    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      const left = pct(z.from);
      const width = (((z.to - z.from) / range) * 100).toFixed(1);
      html += `<div class="${pfx}-pb-fill ${z.className || ''}" style="left:${left}%;width:${width}%"></div>`;
    }

    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      const left = pct(m.position);
      const cls = m.className || `${pfx}-pb-${m.type || 'default'}`;
      html += `<div class="${pfx}-pb-marker ${cls}" style="left:${left}%"><span class="${pfx}-pb-line"></span><span class="${pfx}-pb-label">${m.label || ''}</span></div>`;
    }

    html += `<div class="${pfx}-pb-ghost" style="display:none"><span class="${pfx}-pb-ghost-line"></span><span class="${pfx}-pb-ghost-label"></span></div>`;
    html += `</div></div>`;
    this._container.innerHTML = html;
    this._ghostBound = false;
    this._bindGhost();
  }

  _bindGhost() {
    if (this._ghostBound) return;
    const pfx = this._pfx;
    const track = this._container.querySelector(`.${pfx}-pb-track`);
    const ghost = this._container.querySelector(`.${pfx}-pb-ghost`);
    const bar = this._container.querySelector(`.${pfx}-pb`);
    if (!track || !ghost || !bar) return;
    this._ghostBound = true;

    const fmt = this._fmt;
    const self = this;

    track.addEventListener('mousemove', (e) => {
      const rect = track.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = xPct < 0 ? 0 : xPct > 100 ? 100 : xPct;
      const lo = parseFloat(bar.dataset.pbLo);
      const hi = parseFloat(bar.dataset.pbHi);
      const hoverValue = lo + (clamped / 100) * (hi - lo);
      ghost.style.display = '';
      ghost.style.transform = `translateX(${(clamped / 100 * rect.width).toFixed(1)}px)`;
      ghost.querySelector(`.${pfx}-pb-ghost-label`).textContent = fmt(hoverValue);
      self.emit('hover', { value: hoverValue, pct: clamped });
    });
    track.addEventListener('mouseleave', () => { ghost.style.display = 'none'; });
  }
}
