/** Tiny event emitter — on/off/emit/once/destroy */
export class Emitter {
  constructor() { this._e = Object.create(null); }

  on(evt, fn) {
    (this._e[evt] || (this._e[evt] = [])).push(fn);
    return this;
  }

  off(evt, fn) {
    const a = this._e[evt];
    if (a) this._e[evt] = a.filter(f => f !== fn && f._w !== fn);
    return this;
  }

  emit(evt, a, b) {
    const list = this._e[evt];
    if (!list) return this;
    for (let i = 0, n = list.length; i < n; i++) list[i](a, b);
    return this;
  }

  once(evt, fn) {
    const w = (a, b) => { this.off(evt, w); fn(a, b); };
    w._w = fn;
    return this.on(evt, w);
  }

  destroy() { this._e = Object.create(null); }
}
