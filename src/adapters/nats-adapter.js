/** NATS adapter — requires nats.ws at runtime */

import { BaseAdapter } from './base-adapter.js';

export class NatsAdapter extends BaseAdapter {
  /**
   * @param {object} opts
   * @param {string} opts.servers — NATS server URL (e.g. 'wss://nats.example.com')
   * @param {string} opts.subject — NATS subject to subscribe to
   * @param {object} [opts.natsConnect] — the `connect` function from nats.ws (injected to avoid hard dependency)
   * @param {number} [opts.throttle=0]
   * @param {(raw:any)=>any} [opts.transform]
   */
  constructor(opts = {}) {
    super(opts);
    this._servers = opts.servers;
    this._subject = opts.subject;
    this._natsConnect = opts.natsConnect;
    this._nc = null;
    this._sub = null;
  }

  async connect() {
    if (!this._natsConnect) throw new Error('NatsAdapter requires opts.natsConnect (from nats.ws)');
    this._nc = await this._natsConnect({ servers: this._servers });
    this.emit('open');
    this._sub = this._nc.subscribe(this._subject);
    (async () => {
      for await (const msg of this._sub) {
        let data;
        try { data = JSON.parse(msg.data); } catch { data = msg.string(); }
        this._emitData(data);
      }
    })();
  }

  async disconnect() {
    if (this._sub) { this._sub.unsubscribe(); this._sub = null; }
    if (this._nc) { await this._nc.close(); this._nc = null; }
    super.disconnect();
  }
}
