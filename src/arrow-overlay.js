/** SVG arrow overlay — draws arrows between windows, auto-updates on drag/focus */

import { Emitter } from './emitter.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class ArrowOverlay extends Emitter {
  /**
   * @param {import('./window-manager.js').WindowManager} wm
   * @param {object} [opts]
   * @param {string} [opts.classPrefix='mt']
   * @param {string} [opts.defaultColor='#0ff']
   */
  constructor(wm, opts = {}) {
    super();
    this._wm = wm;
    this._pfx = opts.classPrefix || 'mt';
    this._defaultColor = opts.defaultColor || '#0ff';
    this._arrows = {};  // id → arrow config
    this._groups = {};  // id → { g, line, dot, glow, text } — cached SVG nodes
    this._svg = null;
    this._dirty = false;
    this._rafId = 0;

    const repaint = () => this._schedulePaint();
    wm.on('window:move', repaint);
    wm.on('window:resize', repaint);
    wm.on('window:focus', ({ id, el }) => this._raiseArrowsForWindow(id, el));
  }

  /**
   * Set or update an arrow.
   * @param {string} id — unique arrow id
   * @param {object} arrow
   * @param {string} arrow.fromWindow — source window id
   * @param {string} arrow.toWindow — target window id
   * @param {number} [arrow.progress=0] — 0-1 position of traveling dot
   * @param {string} [arrow.label] — text label at midpoint
   * @param {string} [arrow.color] — arrow color
   */
  setArrow(id, arrow) {
    this._arrows[id] = arrow;
    this._schedulePaint();
  }

  removeArrow(id) {
    delete this._arrows[id];
    const cached = this._groups[id];
    if (cached) { cached.g.remove(); delete this._groups[id]; }
    this._schedulePaint();
  }

  clearArrows() {
    this._arrows = {};
    for (const id in this._groups) { this._groups[id].g.remove(); }
    this._groups = {};
  }

  _ensureSvg() {
    if (this._svg) return this._svg;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', `${this._pfx}-arrow-svg`);
    svg.innerHTML = '<defs></defs>';
    document.body.appendChild(svg);
    this._svg = svg;
    return svg;
  }

  _getOrCreateMarker(color) {
    const svg = this._ensureSvg();
    const defs = svg.querySelector('defs');
    const markerId = `${this._pfx}-ah-${color.replace('#', '')}`;
    if (!defs.querySelector(`#${markerId}`)) {
      const marker = document.createElementNS(SVG_NS, 'marker');
      marker.id = markerId;
      setAttrs(marker, { markerWidth: '8', markerHeight: '6', refX: '7', refY: '3', orient: 'auto' });
      const poly = document.createElementNS(SVG_NS, 'polygon');
      setAttrs(poly, { points: '0 0, 8 3, 0 6', fill: color, opacity: '0.8' });
      marker.appendChild(poly);
      defs.appendChild(marker);
    }
    return markerId;
  }

  _schedulePaint() {
    if (this._dirty) return;
    this._dirty = true;
    this._rafId = requestAnimationFrame(() => {
      this._dirty = false;
      this._paint();
    });
  }

  _paint() {
    const svg = this._ensureSvg();
    const pfx = this._pfx;
    const seen = new Set();

    for (const id in this._arrows) {
      seen.add(id);
      const arrow = this._arrows[id];
      const fromEl = this._wm.getWindow(arrow.fromWindow);
      const toEl = this._wm.getWindow(arrow.toWindow);
      if (!fromEl || !toEl || fromEl === toEl) {
        if (this._groups[id]) { this._groups[id].g.style.display = 'none'; }
        continue;
      }

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      const fromR = { x: fromRect.left, y: fromRect.top, w: fromRect.width, h: fromRect.height };
      const toR = { x: toRect.left, y: toRect.top, w: toRect.width, h: toRect.height };
      const pts = getEdgePoints(fromR, toR);
      const color = arrow.color || this._defaultColor;
      const markerId = this._getOrCreateMarker(color);
      const progress = arrow.progress ?? 0;
      const dotX = pts.x1 + (pts.x2 - pts.x1) * progress;
      const dotY = pts.y1 + (pts.y2 - pts.y1) * progress;

      let cached = this._groups[id];
      if (!cached) {
        // Create group with all children once
        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('class', `${pfx}-arrow-group`);
        g.dataset.arrowId = id;
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('class', `${pfx}-arrow-line`);
        setAttrs(line, { 'stroke-width': '1.5', 'stroke-dasharray': '3 5', opacity: '0.6' });
        const glow = document.createElementNS(SVG_NS, 'circle');
        setAttrs(glow, { r: '7', opacity: '0.15' });
        glow.setAttribute('class', `${pfx}-arrow-glow`);
        const dot = document.createElementNS(SVG_NS, 'circle');
        setAttrs(dot, { r: '3.5' });
        dot.setAttribute('class', `${pfx}-arrow-dot`);
        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('class', `${pfx}-arrow-label`);
        g.appendChild(line);
        g.appendChild(glow);
        g.appendChild(dot);
        g.appendChild(text);
        svg.appendChild(g);
        cached = { g, line, dot, glow, text };
        this._groups[id] = cached;
      }

      // Update attributes (no DOM structure changes)
      cached.g.style.display = '';
      cached.g.dataset.arrowFrom = arrow.fromWindow;
      cached.g.dataset.arrowTo = arrow.toWindow;

      setAttrs(cached.line, {
        x1: pts.x1, y1: pts.y1, x2: pts.x2, y2: pts.y2,
        stroke: color, 'marker-end': `url(#${markerId})`,
      });
      setAttrs(cached.dot, { cx: dotX, cy: dotY, fill: color });
      setAttrs(cached.glow, { cx: dotX, cy: dotY, fill: color });

      if (arrow.label) {
        cached.text.style.display = '';
        const midX = (pts.x1 + pts.x2) / 2;
        const midY = (pts.y1 + pts.y2) / 2 - 8;
        setAttrs(cached.text, { x: midX, y: midY, fill: color });
        cached.text.textContent = arrow.label;
      } else {
        cached.text.style.display = 'none';
      }
    }

    // Remove stale groups
    for (const id in this._groups) {
      if (!seen.has(id)) {
        this._groups[id].g.remove();
        delete this._groups[id];
      }
    }
  }

  _raiseArrowsForWindow(winId, winEl) {
    if (!this._svg) return;
    const pfx = this._pfx;
    let hasMatch = false;
    for (const g of this._svg.querySelectorAll(`.${pfx}-arrow-group`)) {
      if (g.dataset.arrowFrom === winId || g.dataset.arrowTo === winId) {
        this._svg.appendChild(g);
        hasMatch = true;
      }
    }
    if (hasMatch && winEl) {
      this._svg.style.zIndex = parseInt(winEl.style.zIndex || 0) + 1;
    }
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this._svg) { this._svg.remove(); this._svg = null; }
    this._arrows = {};
    this._groups = {};
    super.destroy();
  }
}

function setAttrs(el, attrs) {
  for (const k in attrs) el.setAttribute(k, attrs[k]);
}

/** Compute edge-to-edge connection points between two rects */
function getEdgePoints(fromR, toR) {
  const fromCx = fromR.x + fromR.w / 2, fromCy = fromR.y + fromR.h / 2;
  const toCx = toR.x + toR.w / 2, toCy = toR.y + toR.h / 2;

  const gap = 6;
  const hOverlap = fromR.x < toR.x + toR.w + gap && toR.x < fromR.x + fromR.w + gap;
  const vOverlap = fromR.y < toR.y + toR.h + gap && toR.y < fromR.y + fromR.h + gap;

  if (hOverlap && vOverlap) {
    const touchBottom = Math.abs((fromR.y + fromR.h) - toR.y) < gap;
    const touchTop = Math.abs(fromR.y - (toR.y + toR.h)) < gap;
    const touchRight = Math.abs((fromR.x + fromR.w) - toR.x) < gap;
    const touchLeft = Math.abs(fromR.x - (toR.x + toR.w)) < gap;

    if (touchBottom || touchTop) {
      if (fromCx <= toCx) return { x1: fromR.x, y1: fromCy, x2: toR.x, y2: toCy };
      return { x1: fromR.x + fromR.w, y1: fromCy, x2: toR.x + toR.w, y2: toCy };
    }
    if (touchRight || touchLeft) {
      if (fromCy <= toCy) return { x1: fromCx, y1: fromR.y, x2: toCx, y2: toR.y };
      return { x1: fromCx, y1: fromR.y + fromR.h, x2: toCx, y2: toR.y + toR.h };
    }
  }

  const angle = Math.atan2(toCy - fromCy, toCx - fromCx);
  const cos = Math.cos(angle), sin = Math.sin(angle);

  const fhw = fromR.w / 2, fhh = fromR.h / 2;
  const fs = Math.min(
    cos !== 0 ? fhw / Math.abs(cos) : Infinity,
    sin !== 0 ? fhh / Math.abs(sin) : Infinity
  );
  const x1 = fromCx + cos * fs, y1 = fromCy + sin * fs;

  const cos2 = -cos, sin2 = -sin;
  const thw = toR.w / 2, thh = toR.h / 2;
  const ts = Math.min(
    cos2 !== 0 ? thw / Math.abs(cos2) : Infinity,
    sin2 !== 0 ? thh / Math.abs(sin2) : Infinity
  );
  const x2 = toCx + cos2 * ts, y2 = toCy + sin2 * ts;

  return { x1, y1, x2, y2 };
}
