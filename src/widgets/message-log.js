/** Scrolling message log widget with typed entries and rAF batching */

import { BaseWidget } from './base-widget.js';

export class MessageLog extends BaseWidget {
  /**
   * @param {HTMLElement} container
   * @param {object} [opts]
   * @param {number} [opts.maxMessages=50] — max visible messages
   * @param {Record<string,string>} [opts.typeClasses] — map of type→CSS class
   * @param {string} [opts.classPrefix='mt']
   */
  constructor(container, opts = {}) {
    super(container, opts);
    this._max = opts.maxMessages ?? 50;
    this._typeClasses = opts.typeClasses || {
      bad: 'mt-red', good: 'mt-green', trade: 'mt-yellow',
      listing: 'mt-cyan', info: '', error: 'mt-red', warn: 'mt-yellow',
    };
    this._messages = [];
    this._fullRepaint = true;
  }

  /** Replace all messages. Each: { text, type?, timestamp? } or string */
  update(messages) {
    this._messages = messages.slice(0, this._max);
    this._fullRepaint = true;
    this._schedulePaint();
  }

  /** Push a single message (prepends). Only inserts one DOM node when possible. */
  push(msg) {
    this._messages.unshift(typeof msg === 'string' ? { text: msg } : msg);
    if (this._messages.length > this._max) this._messages.length = this._max;
    this._schedulePaint();
  }

  _onData(val) {
    if (Array.isArray(val)) this.update(val);
    else this.push(val);
  }

  _renderMsg(m) {
    const pfx = this._pfx;
    const text = typeof m === 'string' ? m : m.text;
    const type = (typeof m === 'object' && m.type) || 'info';
    const cls = this._typeClasses[type] || '';
    const ts = typeof m === 'object' && m.timestamp != null
      ? `<span class="${pfx}-dim">[${m.timestamp}]</span> `
      : '';
    return `<div class="${pfx}-message">${ts}<span class="${cls}">${text}</span></div>`;
  }

  _paint() {
    const pfx = this._pfx;
    const msgs = this._messages;

    if (!msgs.length) {
      this._container.innerHTML = `<span class="${pfx}-dim">No messages.</span>`;
      this._fullRepaint = true;
      return;
    }

    // Incremental: if only a push happened, insert at top and trim bottom
    if (!this._fullRepaint && this._container.children.length > 0) {
      const newDiv = document.createElement('div');
      newDiv.innerHTML = this._renderMsg(msgs[0]);
      const child = newDiv.firstElementChild;
      if (child) this._container.insertBefore(child, this._container.firstChild);
      // Trim excess
      while (this._container.children.length > this._max) {
        this._container.removeChild(this._container.lastChild);
      }
      return;
    }

    // Full repaint
    this._fullRepaint = false;
    this._container.innerHTML = msgs.map(m => this._renderMsg(m)).join('');
  }
}
