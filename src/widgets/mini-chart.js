/** ASCII sparkline / line chart widget with rAF batching */

import { BaseWidget } from './base-widget.js';

const BLOCK = '\u25CF';  // ●
const VLINE = '\u2502';  // │

export class MiniChart extends BaseWidget {
  /**
   * @param {HTMLElement} container
   * @param {object} [opts]
   * @param {number} [opts.width=50] — chart columns
   * @param {number} [opts.height=10] — chart rows
   * @param {number} [opts.maxPoints=500] — max data points kept
   * @param {(v:number)=>string} [opts.formatLabel] — label formatter
   * @param {string} [opts.upClass='mt-green'] — CSS class for up moves
   * @param {string} [opts.downClass='mt-red'] — CSS class for down moves
   * @param {string} [opts.dimClass='mt-dim'] — CSS class for axis
   */
  constructor(container, opts = {}) {
    super(container, opts);
    this._W = opts.width ?? 50;
    this._H = opts.height ?? 10;
    this._maxPoints = opts.maxPoints ?? 500;
    this._fmt = opts.formatLabel || defaultFmt;
    this._upCls = opts.upClass || 'mt-green';
    this._downCls = opts.downClass || 'mt-red';
    this._dimCls = opts.dimClass || 'mt-dim';
    this._data = [];
    // Pre-allocate reusable arrays
    this._yPos = new Array(this._W);
    this._preEl = null;
  }

  /** Bulk update with array of values */
  update(data) {
    if (Array.isArray(data)) this._data = data.slice(-this._maxPoints);
    else if (data && Array.isArray(data.values)) this._data = data.values.slice(-this._maxPoints);
    this._schedulePaint();
  }

  /** Push a single value (streaming). Safe to call at 1000+ Hz — rAF batched. */
  push(value) {
    this._data.push(value);
    if (this._data.length > this._maxPoints) this._data.shift();
    this._schedulePaint();
  }

  _onData(val) {
    if (typeof val === 'number') this.push(val);
    else if (Array.isArray(val)) this.update(val);
  }

  _paint() {
    const data = this._resample(this._data, this._W);
    if (data.length < 2) { this._container.textContent = ''; return; }

    let min = data[0], max = data[0];
    for (let i = 1, n = data.length; i < n; i++) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
    }
    const range = max - min || 1;
    const H = this._H, W = this._W;
    const yPos = this._yPos;

    // Compute y positions
    for (let i = 0; i < W; i++) yPos[i] = Math.round((1 - (data[i] - min) / range) * (H - 1));

    // Build grid — flat array for speed
    const grid = new Array(H * W);
    grid.fill(0); // 0 = space, otherwise a string

    const upCls = this._upCls;
    const downCls = this._downCls;

    for (let col = 0; col < W; col++) {
      const y = yPos[col];
      const isUp = col > 0 ? data[col] >= data[col - 1] : true;
      const cls = isUp ? upCls : downCls;
      grid[y * W + col] = `<span class="${cls}">${BLOCK}</span>`;
      if (col > 0) {
        const prevY = yPos[col - 1];
        const lo = prevY < y ? prevY : y;
        const hi = prevY > y ? prevY : y;
        for (let r = lo + 1; r < hi; r++) {
          if (grid[r * W + col] === 0) grid[r * W + col] = `<span class="${cls}">${VLINE}</span>`;
        }
      }
    }

    const topLabel = this._fmt(max);
    const botLabel = this._fmt(min);
    const pw = topLabel.length > botLabel.length ? topLabel.length : botLabel.length;
    const dim = this._dimCls;

    // Build output lines
    const parts = [];
    for (let r = 0; r < H; r++) {
      let label;
      if (r === 0) label = topLabel.padStart(pw);
      else if (r === H - 1) label = botLabel.padStart(pw);
      else label = ''.padStart(pw);
      parts.push(`<span class="${dim}">${label} \u2502</span>`);
      const rowStart = r * W;
      for (let c = 0; c < W; c++) {
        const cell = grid[rowStart + c];
        parts.push(cell === 0 ? ' ' : cell);
      }
      if (r < H - 1) parts.push('\n');
    }

    // Reuse <pre> element
    if (!this._preEl || !this._container.contains(this._preEl)) {
      this._preEl = document.createElement('pre');
      this._preEl.className = 'mt-chart-canvas';
      this._container.textContent = '';
      this._container.appendChild(this._preEl);
    }
    this._preEl.innerHTML = parts.join('');
  }

  _resample(arr, targetLen) {
    const len = arr.length;
    if (len <= 1) return len === 1 ? new Array(targetLen).fill(arr[0]) : [];
    const result = new Array(targetLen);
    const scale = (len - 1) / (targetLen - 1);
    for (let i = 0; i < targetLen; i++) {
      const srcIdx = i * scale;
      const lo = srcIdx | 0; // fast floor
      const hi = lo + 1 < len ? lo + 1 : lo;
      const frac = srcIdx - lo;
      result[i] = arr[lo] + (arr[hi] - arr[lo]) * frac;
    }
    return result;
  }
}

function defaultFmt(v) {
  if (v >= 1000) return v.toFixed(0);
  if (v >= 1) return v.toFixed(2);
  if (v >= 0.01) return v.toFixed(4);
  return String(v);
}
