/** REST polling adapter — fetches a URL on an interval */

import { BaseAdapter } from './base-adapter.js';

export class RestPoller extends BaseAdapter {
  /**
   * @param {string} url
   * @param {object} [opts]
   * @param {number} [opts.interval=5000] — polling interval ms
   * @param {RequestInit} [opts.fetchOpts] — passed to fetch()
   * @param {number} [opts.throttle=0]
   * @param {(raw:any)=>any} [opts.transform]
   */
  constructor(url, opts = {}) {
    super(opts);
    this._url = url;
    this._interval = opts.interval ?? 5000;
    this._fetchOpts = opts.fetchOpts || {};
    this._timer = null;
  }

  connect() {
    this._poll();
    this._timer = setInterval(() => this._poll(), this._interval);
  }

  disconnect() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    super.disconnect();
  }

  async _poll() {
    try {
      const res = await fetch(this._url, this._fetchOpts);
      if (!res.ok) { this.emit('error', new Error(`HTTP ${res.status}`)); return; }
      const data = await res.json();
      this._emitData(data);
    } catch (err) {
      this.emit('error', err);
    }
  }
}
