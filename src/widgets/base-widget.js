/** Base widget — rAF batching + bind + destroy. All widgets extend this. */

import { Emitter } from '../emitter.js';

export class BaseWidget extends Emitter {
  constructor(container, opts = {}) {
    super();
    this._container = container;
    this._pfx = opts.classPrefix || 'mt';
    this._dirty = false;
    this._rafId = 0;
  }

  _schedulePaint() {
    if (this._dirty) return;
    this._dirty = true;
    this._rafId = requestAnimationFrame(() => {
      this._dirty = false;
      this._paint();
    });
  }

  /** Override in subclass */
  _paint() {}

  bind(adapter, transformKey) {
    adapter.on('data', (d) => {
      const val = transformKey ? d[transformKey] : d;
      this._onData(val);
    });
  }

  /** Override in subclass to handle adapter data. Default: push scalars, update arrays. */
  _onData(val) {
    if (Array.isArray(val)) this.update(val);
    else this.push(val);
  }

  /** Override in subclass */
  update() {}
  /** Override in subclass */
  push() {}

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._container.innerHTML = '';
    super.destroy();
  }
}
