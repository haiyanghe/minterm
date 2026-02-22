/** Redis Pub/Sub adapter — requires a redis client at runtime */

import { BaseAdapter } from './base-adapter.js';

export class RedisAdapter extends BaseAdapter {
  /**
   * @param {object} opts
   * @param {object} opts.client — a redis client instance (e.g. from 'redis' or 'ioredis')
   * @param {string|string[]} opts.channels — channel(s) to subscribe to
   * @param {string|string[]} [opts.patterns] — pattern(s) to psubscribe to (e.g. 'sensor:*')
   * @param {number} [opts.throttle=0]
   * @param {(raw:any)=>any} [opts.transform]
   */
  constructor(opts = {}) {
    super(opts);
    this._client = opts.client;
    this._channels = opts.channels ? [].concat(opts.channels) : [];
    this._patterns = opts.patterns ? [].concat(opts.patterns) : [];
    this._sub = null;
    this._handler = (msg, channel) => {
      let data;
      try { data = JSON.parse(msg); } catch { data = msg; }
      this._emitData({ channel, data });
    };
    this._pHandler = (msg, channel, pattern) => {
      let data;
      try { data = JSON.parse(msg); } catch { data = msg; }
      this._emitData({ channel, pattern, data });
    };
  }

  async connect() {
    if (!this._client) throw new Error('RedisAdapter requires opts.client (redis/ioredis instance)');

    // ioredis: client.duplicate() exists; node-redis: client.duplicate() exists
    // We need a dedicated subscriber since redis clients in subscribe mode can't run other commands
    if (typeof this._client.duplicate === 'function') {
      this._sub = this._client.duplicate();
    } else {
      this._sub = this._client;
    }

    // node-redis v4 requires explicit connect
    if (typeof this._sub.connect === 'function' && !this._sub.isOpen) {
      await this._sub.connect();
    }

    // Detect API style: ioredis uses .on('message'), node-redis v4 uses .subscribe(channel, callback)
    if (typeof this._sub.on === 'function' && typeof this._sub.subscribe === 'function') {
      // ioredis style
      if (this._channels.length) {
        this._sub.on('message', this._handler);
        await this._sub.subscribe(...this._channels);
      }
      if (this._patterns.length) {
        this._sub.on('pmessage', this._pHandler);
        await this._sub.psubscribe(...this._patterns);
      }
    }

    this.emit('open');
  }

  async disconnect() {
    if (this._sub) {
      if (this._channels.length && typeof this._sub.unsubscribe === 'function') {
        await this._sub.unsubscribe(...this._channels);
      }
      if (this._patterns.length && typeof this._sub.punsubscribe === 'function') {
        await this._sub.punsubscribe(...this._patterns);
      }
      if (typeof this._sub.removeListener === 'function') {
        this._sub.removeListener('message', this._handler);
        this._sub.removeListener('pmessage', this._pHandler);
      }
      if (typeof this._sub.quit === 'function') {
        await this._sub.quit();
      }
      this._sub = null;
    }
    super.disconnect();
  }
}
