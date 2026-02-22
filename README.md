# minterm

Zero-dependency DOS-style windowing UI for the browser. Draggable, resizable windows with rAF-batched widgets and pluggable data adapters.

`npm install minterm`

## Quick start

```html
<link rel="stylesheet" href="minterm/css/minterm.css">
```
```js
import { WindowManager, MiniChart } from 'minterm';
const wm = new WindowManager();
const chart = wm.addWidget('chart', MiniChart,
  { width: 50, height: 10 },
  { x: 20, y: 20, width: 500, height: 300, title: 'Sparkline', closable: true }
);
chart.push(42.5); // safe to call 1000x/sec — rAF batched
```

## Architecture

```
DataSource -> Adapter.emit('data', payload) -> Widget.update(payload) -> rAF batched DOM render
```

Everything extends `Emitter` (on/off/emit/once/destroy). Data flows one way — sources into adapters, adapters emit events, widgets render. Skip adapters and call `.push()` directly if preferred.

## WindowManager

Creates draggable, resizable, focusable windows with pinning, layout snapshots, and keyboard shortcuts.

**Constructor options:** `container` (HTMLElement, default: body), `classPrefix` (string, default: 'mt'), `lockable` (bool), `layoutBar` (bool), `layoutSlots` (number, default: 5), `escapeClose` (bool, default: true).

**Window options:** `x`, `y`, `width`, `height`, `title`, `closable`, `lockable`, `minWidth` (default: 200), `minHeight` (default: 60).

### API

| Method | Returns | Description |
|--------|---------|-------------|
| `createWindow(id, opts)` | HTMLElement | Create a window |
| `addWidget(id, WidgetClass, widgetOpts, windowOpts)` | Widget | Create window + mount widget |
| `closeWindow(id)` | void | Remove a window |
| `closeAll()` | void | Close all unlocked closable windows |
| `setContent(id, title, html)` | void | Replace title and body HTML |
| `getBody(id)` | HTMLElement | The `.mt-win-body` div |
| `getWindow(id)` | HTMLElement | The whole `.mt-win` div |
| `has(id)` | boolean | Check if window exists |
| `getIds()` | string[] | All window IDs |
| `focus(id)` | void | Bring to front |
| `lockWindow(id)` / `unlockWindow(id)` / `toggleLock(id)` | void | Pin/unpin (prevents drag/resize) |
| `isLocked(id)` | boolean | Check lock state |
| `showLockButtons()` / `hideLockButtons()` | void | Toggle pin button visibility |
| `saveLayout(slot)` / `restoreLayout(slot)` | void | Save/restore positions, sizes, lock states |
| `hasLayout(slot)` | boolean | Check if slot has a snapshot |

### Keyboard shortcuts

`Ctrl+1`–`Ctrl+5` save layout, `1`–`5` restore (not in inputs), `Escape` closes all.

### Events

`window:create` `{id, el}`, `window:close` `{id}`, `window:focus` `{id, el}`, `window:move` `{id, el}`, `window:resize` `{id, el}`, `window:lock` `{id, locked}`, `layout:save` `{slot}`, `layout:restore` `{slot}`.

## Widgets

Shared API: `update(data)`, `push(value)`, `bind(adapter, 'key')`, `destroy()`. All renders are rAF-batched.

### Ticker — scrolling tape, CSS animated

Options: `baseDuration` (default: 8), `durationPerItem` (default: 2).
Items: `{ label, value, className }`.

### MiniChart — ASCII sparkline, auto-scaling

Options: `width` (cols), `height` (rows), `maxPoints` (default: 500), `formatLabel`, `upClass` (default: 'mt-green'), `downClass` (default: 'mt-red').
Data: array of numbers via `update([...])` or `push(num)`.

### MessageLog — scrolling color-coded log

Options: `maxMessages` (default: 50), `typeClasses` (map of type -> CSS class, defaults: bad=mt-red, good=mt-green, trade=mt-yellow, info='', error=mt-red, warn=mt-yellow).
Items: `{ text, type, timestamp }` or plain string.

### RangeBar — horizontal bar with markers and zones

Options: `formatLabel` (value formatter).
Data: `{ lo, hi, markers: [{ position, label, type?, className? }], zones: [{ from, to, className }] }`.
Events: `hover` `{ value, pct }`.

### ActivityBars — animated pulsing bars, pure CSS

Options: `count` (default: 8).
Data: `[{ height, color?, opacity? }]` or call `randomize()`.

### Custom widgets

Extend `BaseWidget`, implement `_paint()`, call `this._schedulePaint()` from `update()`/`push()`. Gets free rAF batching, adapter binding, and cleanup.

## Data Adapters

All emit `'data'`. All support `throttle` (ms) and `transform` (fn).

| Adapter | Constructor args | Description |
|---------|-----------------|-------------|
| `ManualAdapter` | `{ throttle?, transform? }` | Push data manually via `.push(data)` |
| `WebSocketAdapter` | `url, { reconnect?, reconnectDelay?, throttle?, transform? }` | Auto-reconnecting WS, JSON parsed. Methods: `connect()`, `disconnect()`, `send(data)` |
| `RestPoller` | `url, { interval?, fetchOpts?, transform? }` | Polls endpoint on interval. Methods: `connect()`, `disconnect()` |
| `RedisAdapter` | `{ client, channels?, patterns?, transform? }` | Redis Pub/Sub. Inject ioredis client (no hard dep) |
| `NatsAdapter` | `{ natsConnect, servers, subject, transform? }` | NATS messaging. Inject `connect` from nats.ws |

**Binding:** `widget.bind(adapter, 'key')` — auto-updates widget when adapter emits, extracting `d[key]`.

## ArrowOverlay

SVG arrows between windows. Auto-updates on drag/resize.

```js
const arrows = new ArrowOverlay(wm, { defaultColor: '#0ff' });
arrows.setArrow('id', { fromWindow, toWindow, progress?, label?, color? });
arrows.removeArrow('id');
arrows.clearArrows();
arrows.destroy();
```

## ModalManager

```js
const modal = new ModalManager(wm);
modal.show(html, { title, width });
modal.hide();
const ok = await modal.confirm(message, { title, okText, cancelText }); // -> boolean
const val = await modal.prompt(message, { title, defaultValue }); // -> string|null
modal.isOpen; // boolean
```

## Themes

6 built-in themes. Each sets colors, font, and font size. Apply by name or custom object.

```js
applyTheme('phosphor');
applyTheme({ '--mt-accent': '#f80', '--mt-font': "'Fira Code', monospace" });
```

| Theme | Font | Description |
|-------|------|-------------|
| `cyber` | Courier New 15px | Vivid cyan/teal (default) |
| `amber` | VT323 16px | Warm gold retro CRT |
| `phosphor` | IBM Plex Mono 14px | Soft green terminal |
| `hotline` | Share Tech Mono 15px | Desaturated pink/mauve |
| `ice` | Fira Code 14px | Muted blue-grey |
| `slate` | JetBrains Mono 14px | Neutral grey |

### CSS custom properties

- **Colors:** `--mt-accent`, `--mt-accent-bright`, `--mt-bg`, `--mt-border`, `--mt-green`, `--mt-red`, `--mt-yellow`, `--mt-cyan`, `--mt-magenta`, `--mt-orange`, `--mt-white`, `--mt-dim`, `--mt-text`, `--mt-titlebar-bg`, `--mt-titlebar-fg`, `--mt-glow`, `--mt-glow-strong`
- **Typography:** `--mt-font`, `--mt-font-size`
- **Sizing:** `--mt-win-min-w`, `--mt-win-min-h`, `--mt-win-padding`, `--mt-bar-width`, `--mt-bar-height`, `--mt-resize-handle`, `--mt-pb-height`, `--mt-scrollbar-width`
- **Animation:** `--mt-ticker-speed`, `--mt-bar-speed`, `--mt-arrow-dash-speed`, `--mt-arrow-dot-speed`

## Formatters

`formatNum(n)` — adaptive: 1.50bil / 12.3mil / 50.0k / 1,234.56 / 0.0500. `formatQty(n)` — comma-separated or 4dp for small. `formatPct(n)` — signed percentage with 1dp.

## File structure

```
index.js                          # barrel export
css/minterm.css                   # all styles + CSS custom properties
src/
  emitter.js                      # Emitter base class
  z-index.js                      # z-index management
  window-manager.js               # WindowManager
  modal-manager.js                # ModalManager
  arrow-overlay.js                # ArrowOverlay
  formatters.js                   # formatNum, formatQty, formatPct
  themes.js                       # built-in themes + applyTheme
  widgets/{base-widget,ticker,mini-chart,message-log,range-bar,activity-bars}.js
  adapters/{base-adapter,manual-adapter,websocket-adapter,rest-poller,nats-adapter,redis-adapter}.js
```

Every file is independently importable: `import { MiniChart } from 'minterm/src/widgets/mini-chart.js'`.

## Performance

- **rAF batching** — 1000 `.push()` calls/sec = 60 renders/sec
- **Incremental DOM** — MessageLog appends nodes, doesn't rebuild innerHTML
- **SVG reuse** — ArrowOverlay caches elements, updates attributes only
- **CSS-only animation** — ticker, bars, arrows use `@keyframes`, no JS animation loop
- **GPU-composited drag** — windows use `transform: translate()` during drag, baked to `left/top` on drop
- **CSS containment** — `.mt-win` uses `contain: layout style` to isolate style recalc scope
- **Flat grid** — MiniChart uses `Array(H*W)` with indexed access, no nested arrays
- **Adapter throttle** — `{ throttle: 16 }` caps at ~60 emissions/sec, drops intermediates, keeps latest value
