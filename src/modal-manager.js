/** Modal dialog manager — wraps WindowManager */

export class ModalManager {
  /**
   * @param {import('./window-manager.js').WindowManager} wm
   */
  constructor(wm) {
    this._wm = wm;
    this._pfx = wm._pfx || 'mt';
    this._id = `${this._pfx}-modal`;
  }

  show(html, opts = {}) {
    this.hide();
    const { width = 380, title = '' } = opts;
    const cx = Math.floor(window.innerWidth / 2) - Math.floor(width / 2);
    const cy = Math.floor(window.innerHeight / 2) - 120;
    this._wm.createWindow(this._id, { x: cx, y: cy, width, closable: true, title });
    const body = this._wm.getBody(this._id);
    if (body) body.innerHTML = html;
    this._wm.focus(this._id);
  }

  hide() {
    if (this._wm.has(this._id)) this._wm.closeWindow(this._id);
  }

  confirm(message, opts = {}) {
    const { okText = 'OK', cancelText = 'Cancel', title = 'Confirm' } = opts;
    const pfx = this._pfx;
    return new Promise(resolve => {
      this.show(`
        <div class="${pfx}-modal-body">${message}</div>
        <div class="${pfx}-modal-footer">
          <button class="${pfx}-btn ${pfx}-modal-ok">${okText}</button>
          <button class="${pfx}-btn ${pfx}-modal-cancel">${cancelText}</button>
        </div>`, { title });
      const body = this._wm.getBody(this._id);
      if (!body) return resolve(false);
      body.querySelector(`.${pfx}-modal-ok`).onclick = () => { this.hide(); resolve(true); };
      body.querySelector(`.${pfx}-modal-cancel`).onclick = () => { this.hide(); resolve(false); };
    });
  }

  prompt(message, opts = {}) {
    const { defaultValue = '', okText = 'OK', cancelText = 'Cancel', title = 'Input' } = opts;
    const pfx = this._pfx;
    return new Promise(resolve => {
      this.show(`
        <div class="${pfx}-modal-body">${message}</div>
        <input class="${pfx}-input ${pfx}-modal-input" type="text" value="${defaultValue}">
        <div class="${pfx}-modal-footer">
          <button class="${pfx}-btn ${pfx}-modal-ok">${okText}</button>
          <button class="${pfx}-btn ${pfx}-modal-cancel">${cancelText}</button>
        </div>`, { title });
      const body = this._wm.getBody(this._id);
      if (!body) return resolve(null);
      const input = body.querySelector(`.${pfx}-modal-input`);
      body.querySelector(`.${pfx}-modal-ok`).onclick = () => { this.hide(); resolve(input.value); };
      body.querySelector(`.${pfx}-modal-cancel`).onclick = () => { this.hide(); resolve(null); };
      input.focus();
      input.onkeydown = (e) => {
        if (e.key === 'Enter') { this.hide(); resolve(input.value); }
        if (e.key === 'Escape') { this.hide(); resolve(null); }
      };
    });
  }

  get isOpen() { return this._wm.has(this._id); }
}
