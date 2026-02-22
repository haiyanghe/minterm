/** WebSocket data adapter with auto-reconnect */

import { BaseAdapter } from './base-adapter.js';

export class WebSocketAdapter extends BaseAdapter {
  /**
   * @param {string} url — WebSocket URL
   * @param {object} [opts]
   * @param {boolean} [opts.reconnect=true] — auto-reconnect on close
   * @param {number} [opts.reconnectDelay=3000] — ms before reconnect
   * @param {number} [opts.throttle=0]
   * @param {(raw:any)=>any} [opts.transform]
   */
  constructor(url, opts = {}) {
    super(opts);
    this._url = url;
    this._reconnect = opts.reconnect !== false;
    this._reconnectDelay = opts.reconnectDelay ?? 3000;
    this._ws = null;
    this._closing = false;
    this._reconnectTimer = null;
  }

  connect() {
    this._closing = false;
    this._ws = new WebSocket(this._url);

    this._ws.onopen = () => this.emit('open');

    this._ws.onmessage = (e) => {
      let data;
      try { data = JSON.parse(e.data); } catch { data = e.data; }
      this._emitData(data);
    };

    this._ws.onclose = () => {
      this.emit('close');
      if (this._reconnect && !this._closing) {
        this._reconnectTimer = setTimeout(() => this.connect(), this._reconnectDelay);
      }
    };

    this._ws.onerror = (err) => this.emit('error', err);
  }

  disconnect() {
    this._closing = true;
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    if (this._ws) { this._ws.close(); this._ws = null; }
    super.disconnect();
  }

  /** Send data to the WebSocket */
  send(data) {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }
}
