/** Manual push adapter — call .push(data) to emit */

import { BaseAdapter } from './base-adapter.js';

export class ManualAdapter extends BaseAdapter {
  constructor(opts = {}) {
    super(opts);
  }

  /** Push data through the adapter pipeline */
  push(data) {
    this._emitData(data);
  }
}
