/** Base data adapter — all adapters extend this */

import { Emitter } from '../emitter.js';

export class BaseAdapter extends Emitter {
  /**
   * @param {object} [opts]
   * @param {number} [opts.throttle=0] — min ms between emissions (0=no throttle)
   * @param {(raw:any)=>any} [opts.transform] — transform raw data before emitting
   */
  constructor(opts = {}) {
    super();
    this._throttle = opts.throttle || 0;
    this._transform = opts.transform || null;
    this._lastEmit = -Infinity;
    this._pending = null;
    this._throttleTimer = null;
  }

  /** Subclasses call this to emit data through the throttle/transform pipeline */
  _emitData(raw) {
    const data = this._transform ? this._transform(raw) : raw;
    if (data == null) return;

    if (this._throttle <= 0) {
      this.emit('data', data);
      return;
    }

    const now = performance.now();
    const elapsed = now - this._lastEmit;
    if (elapsed >= this._throttle) {
      this._lastEmit = now;
      this.emit('data', data);
    } else {
      // Keep latest, drop intermediates
      this._pending = data;
      if (!this._throttleTimer) {
        this._throttleTimer = setTimeout(() => {
          this._throttleTimer = null;
          if (this._pending != null) {
            this._lastEmit = performance.now();
            this.emit('data', this._pending);
            this._pending = null;
          }
        }, this._throttle - elapsed);
      }
    }
  }

  /** Override in subclass */
  connect() {}

  /** Override in subclass */
  disconnect() {
    if (this._throttleTimer) clearTimeout(this._throttleTimer);
    this._pending = null;
  }
}
