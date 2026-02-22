# minterm

A zero-dependency, retro DOS-style windowing system for the browser. You get draggable, resizable windows with built-in widgets that render at 60fps via requestAnimationFrame batching, plus data adapters for WebSocket, REST, Redis, and NATS.

```sh
npm install minterm
```

Open `test.html` in a browser to see everything working together.

## How it works

```
Your data --> Adapter (throttle + transform) --> Widget (rAF batched render) --> DOM
```

Everything extends a tiny `Emitter` class (on/off/emit/once/destroy). Data flows one direction: sources push into adapters, adapters emit `'data'` events, widgets listen and repaint. You can skip adapters entirely and call `widget.push(value)` directly.

## Getting started

```html
<link rel="stylesheet" href="minterm/css/minterm.css">
```

```js
import { WindowManager, MiniChart } from 'minterm';

// Create the window manager (manages all windows on the page)
const wm = new WindowManager();

// Create a window with a sparkline chart inside it
const chart = wm.addWidget('chart', MiniChart,
  { width: 50, height: 10 },                                    // widget options
  { x: 20, y: 20, width: 500, height: 300, title: 'Sparkline', closable: true }  // window options
);

// Push data — safe to call 1000x/sec, renders are batched to 60fps
chart.push(42.5);
```

## WindowManager

The central piece. Creates windows, handles drag/resize/focus, and manages layout snapshots.

### Creating it

```js
const wm = new WindowManager({
  container: document.body,  // where windows are appended (default: body)
  classPrefix: 'mt',         // CSS class prefix (default: 'mt')
  lockable: false,           // show lock/pin buttons on all windows (default: false)
  layoutBar: false,          // show clickable layout bar UI (default: false)
  layoutSlots: 5,            // number of save slots, 0 to disable (default: 5)
  escapeClose: true,         // Escape key closes all windows (default: true)
});
```

### Creating windows

```js
// Plain window — you fill the body yourself
wm.createWindow('mywin', {
  x: 100, y: 50,            // position in pixels
  width: 400, height: 300,  // size (height is optional, auto if omitted)
  title: 'My Window',
  closable: true,            // show X button
  lockable: true,            // show pin button
  minWidth: 200,             // drag resize minimum (default: 200)
  minHeight: 60,             // drag resize minimum (default: 60)
});
wm.getBody('mywin').innerHTML = '<p>Hello</p>';

// Window + widget in one call
const chart = wm.addWidget('chart', MiniChart, widgetOpts, windowOpts);
```

### Methods

| Method | What it does |
|--------|-------------|
| `createWindow(id, opts)` | Create a window, returns the DOM element |
| `addWidget(id, WidgetClass, widgetOpts, windowOpts)` | Create a window with a widget mounted inside it, returns the widget |
| `closeWindow(id)` | Remove a window from the DOM |
| `closeAll()` | Close all unlocked, closable windows |
| `setContent(id, title, html)` | Replace a window's title and body HTML |
| `getBody(id)` | Get the `.mt-win-body` div (where you put content) |
| `getWindow(id)` | Get the whole `.mt-win` element |
| `has(id)` | Check if a window exists |
| `getIds()` | Get all window IDs as an array |
| `focus(id)` | Bring a window to front |
| `lockWindow(id)` | Pin a window (prevents drag and resize) |
| `unlockWindow(id)` | Unpin a window |
| `toggleLock(id)` | Toggle pin state |
| `isLocked(id)` | Check if pinned |
| `showLockButtons()`, `hideLockButtons()` | Show or hide pin buttons on all windows |
| `saveLayout(slot)` | Snapshot all window positions, sizes, z-order, and lock states to a slot |
| `restoreLayout(slot)` | Restore a saved snapshot |
| `hasLayout(slot)` | Check if a slot has a saved snapshot |
| `cycle(reverse?)` | Cycle focus to next/previous window |

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+1` through `Ctrl+5` | Save layout to slot |
| `1` through `5` | Restore layout from slot (disabled when typing in inputs) |
| `Escape` | Close all closable, unlocked windows |

### Layout bar

Enable with `layoutBar: true`. Shows numbered slots at the bottom. Click to restore, Ctrl+click to save. Saved slots are highlighted.

### Events

All events are emitted on the WindowManager instance via `.on()`:

| Event | Payload | When |
|-------|---------|------|
| `window:create` | `{ id, el }` | Window created |
| `window:close` | `{ id }` | Window removed |
| `window:focus` | `{ id, el }` | Window brought to front |
| `window:move` | `{ id, el }` | Window dragged |
| `window:resize` | `{ id, el }` | Window resized |
| `window:lock` | `{ id, locked }` | Lock state changed |
| `layout:save` | `{ slot }` | Layout saved |
| `layout:restore` | `{ slot }` | Layout restored |
| `escape` | (none) | Escape key pressed |

## Widgets

All widgets share this API:

- `update(data)` — replace all data and repaint
- `push(value)` — append a single value and repaint
- `bind(adapter, key)` — auto-update when an adapter emits (optionally extract `data[key]`)
- `destroy()` — stop rendering and clean up

All renders are batched via requestAnimationFrame — calling `push()` 1000 times per second still only renders 60 times.

### Ticker

Scrolling horizontal tape with CSS animation. Good for stock tickers, status lines, etc.

```js
const ticker = wm.addWidget('ticker', Ticker,
  { baseDuration: 8, durationPerItem: 2 },  // animation speed
  { x: 20, y: 20, width: 500, title: 'Ticker' }
);
ticker.update([
  { label: 'AAPL', value: '$189.50', className: 'mt-green' },
  { label: 'GOOG', value: '$141.20', className: 'mt-red' },
]);
```

### MiniChart

ASCII sparkline chart that auto-scales to fit. Renders as a character grid.

```js
const chart = wm.addWidget('chart', MiniChart,
  { width: 55, height: 12, maxPoints: 500, formatLabel: formatNum },
  { x: 20, y: 100, width: 500, height: 280, title: 'Sparkline' }
);
chart.update([100, 102, 98, 105]);  // replace all points
chart.push(107);                     // append one point
```

Options: `width` (columns), `height` (rows), `maxPoints` (buffer size, default 500), `formatLabel` (value formatter), `upClass` (default `'mt-green'`), `downClass` (default `'mt-red'`).

### MessageLog

Scrolling, color-coded log. Appends DOM nodes incrementally (doesn't rebuild innerHTML).

```js
const log = wm.addWidget('messages', MessageLog,
  { maxMessages: 50 },
  { x: 540, y: 100, width: 400, height: 280, title: 'Log' }
);
log.push({ text: 'Connected', type: 'good', timestamp: '12:00' });
log.push('Plain string works too');
```

Built-in types: `bad` (red), `good` (green), `trade` (yellow), `info` (default), `error` (red), `warn` (yellow), `listing` (cyan). You can pass custom `typeClasses` to override.

### RangeBar

Horizontal bar with labeled markers and colored zones. Good for gauges, progress, thresholds.

```js
const rb = wm.addWidget('rangebar', RangeBar,
  { formatLabel: formatNum },
  { x: 20, y: 400, width: 920, height: 80, title: 'Range' }
);
rb.update({
  lo: 0, hi: 100,
  markers: [
    { position: 25, label: 'Min' },
    { position: 72, label: 'Current', className: 'mt-pb-current' },
    { position: 90, label: 'Limit', className: 'mt-pb-danger' },
  ],
  zones: [{ from: 85, to: 100, className: 'mt-red' }],
});
```

Emits `hover` events with `{ value, pct }`.

### ActivityBars

Animated pulsing vertical bars, pure CSS animation. Good for activity/load indicators.

```js
const bars = wm.addWidget('bars', ActivityBars,
  { count: 8 },
  { x: 540, y: 20, width: 160, height: 80, title: 'Activity' }
);
bars.update([
  { height: 80, color: '#0ff', opacity: 0.8 },
  { height: 50, color: '#0f0', opacity: 0.6 },
]);
bars.randomize();  // fill with random values
```

### Custom widgets

Extend `BaseWidget` and implement `_paint()`. Call `this._schedulePaint()` whenever data changes. You get free rAF batching, adapter binding, and cleanup.

```js
import { BaseWidget } from 'minterm/src/widgets/base-widget.js';

class MyWidget extends BaseWidget {
  update(data) {
    this._data = data;
    this._schedulePaint();
  }
  _paint() {
    this._container.textContent = JSON.stringify(this._data);
  }
}
```

## Data adapters

Adapters fetch or receive data and emit `'data'` events. All support `throttle` (ms between emissions) and `transform` (function to reshape data before emitting).

### ManualAdapter

Push data by hand. Useful when you already have the data and just want throttling/transform.

```js
import { ManualAdapter } from 'minterm';
const adapter = new ManualAdapter({ throttle: 100 });
chart.bind(adapter, 'value');
adapter.push({ value: 42 });
```

### WebSocketAdapter

Auto-reconnecting WebSocket. Parses incoming JSON automatically.

```js
import { WebSocketAdapter } from 'minterm';
const ws = new WebSocketAdapter('wss://example.com/stream', {
  reconnect: true,
  reconnectDelay: 3000,
  throttle: 16,
  transform: (raw) => ({ value: parseFloat(raw.price) }),
});
chart.bind(ws, 'value');
ws.connect();
// ws.send(data)   — send to server
// ws.disconnect()  — close connection
```

### RestPoller

Polls a REST endpoint on an interval.

```js
import { RestPoller } from 'minterm';
const poller = new RestPoller('https://api.example.com/data', {
  interval: 5000,
  fetchOpts: { headers: { Authorization: 'Bearer ...' } },
  transform: (json) => json.result,
});
chart.bind(poller);
poller.connect();
// poller.disconnect()
```

### RedisAdapter

Redis Pub/Sub via ioredis. You inject the client (no hard dependency).

```js
import { RedisAdapter } from 'minterm';
const adapter = new RedisAdapter({
  client: ioredisInstance,
  channels: ['prices'],
  transform: (msg) => JSON.parse(msg),
});
chart.bind(adapter, 'value');
```

### NatsAdapter

NATS messaging via nats.ws. You inject the `connect` function (no hard dependency).

```js
import { NatsAdapter } from 'minterm';
const adapter = new NatsAdapter({
  natsConnect: connect,  // from 'nats.ws'
  servers: 'wss://nats.example.com',
  subject: 'prices.>',
  transform: (msg) => JSON.parse(msg),
});
```

## ArrowOverlay

Draws SVG arrows between windows. Automatically repaints when windows move or resize.

```js
import { ArrowOverlay } from 'minterm';
const arrows = new ArrowOverlay(wm, { defaultColor: '#0ff' });

arrows.setArrow('flow1', {
  fromWindow: 'source',    // window ID
  toWindow: 'destination', // window ID
  progress: 0.5,           // 0-1, position of animated dot along the line
  label: '500 req/s',      // text at midpoint
  color: '#0ff',
});

arrows.removeArrow('flow1');
arrows.clearArrows();
arrows.destroy();
```

## ModalManager

Dialog boxes built on top of WindowManager.

```js
import { ModalManager } from 'minterm';
const modal = new ModalManager(wm);

// Show HTML content in a centered modal
modal.show('<p>Hello</p>', { title: 'Info', width: 380 });
modal.hide();

// Confirm dialog — returns a promise
const ok = await modal.confirm('Are you sure?', {
  title: 'Confirm', okText: 'Yes', cancelText: 'No'
});

// Prompt dialog — returns string or null
const name = await modal.prompt('Enter your name:', {
  title: 'Input', defaultValue: 'Anonymous'
});

modal.isOpen;  // boolean
```

## Themes

6 built-in color themes. Each sets colors, font family, and font size via CSS custom properties.

```js
import { applyTheme } from 'minterm';

applyTheme('phosphor');  // by name

applyTheme({             // or custom overrides
  '--mt-accent': '#f80',
  '--mt-font': "'Fira Code', monospace",
});
```

| Theme | Font | Look |
|-------|------|------|
| `cyber` | Courier New 15px | Vivid cyan/teal (default) |
| `amber` | VT323 16px | Warm gold, retro CRT feel |
| `phosphor` | IBM Plex Mono 14px | Soft green terminal |
| `hotline` | Share Tech Mono 15px | Muted pink/mauve |
| `ice` | Fira Code 14px | Cool blue-grey |
| `slate` | JetBrains Mono 14px | Neutral grey |

### CSS custom properties

You can override any of these on `:root` or any container element:

**Colors:** `--mt-accent`, `--mt-accent-bright`, `--mt-bg`, `--mt-border`, `--mt-green`, `--mt-red`, `--mt-yellow`, `--mt-cyan`, `--mt-magenta`, `--mt-orange`, `--mt-white`, `--mt-dim`, `--mt-text`, `--mt-titlebar-bg`, `--mt-titlebar-fg`, `--mt-glow`, `--mt-glow-strong`

**Typography:** `--mt-font`, `--mt-font-size`

**Sizing:** `--mt-win-min-w`, `--mt-win-min-h`, `--mt-win-padding`, `--mt-bar-width`, `--mt-bar-height`, `--mt-resize-handle`, `--mt-pb-height`, `--mt-scrollbar-width`

**Animation:** `--mt-ticker-speed`, `--mt-bar-speed`, `--mt-arrow-dash-speed`, `--mt-arrow-dot-speed`

## Formatters

```js
import { formatNum, formatQty, formatPct } from 'minterm';

formatNum(1500000000);  // "1.50bil"
formatNum(12300000);    // "12.3mil"
formatNum(50000);       // "50.0k"
formatNum(1234.56);     // "1,234.56"
formatNum(0.05);        // "0.0500"

formatQty(1234567);     // "1,234,567"
formatQty(0.00123);     // "0.0012"

formatPct(0.054);       // "+5.4%"
formatPct(-0.12);       // "-12.0%"
```

## File structure

```
index.js                          # barrel export — import everything from here
css/minterm.css                   # all styles + CSS custom properties
src/
  emitter.js                      # Emitter base class (on/off/emit/once/destroy)
  z-index.js                      # z-index management (getNextZ, bringToFront, cycleWindow)
  window-manager.js               # WindowManager
  modal-manager.js                # ModalManager
  arrow-overlay.js                # ArrowOverlay
  formatters.js                   # formatNum, formatQty, formatPct
  themes.js                       # built-in themes + applyTheme()
  widgets/
    base-widget.js                # BaseWidget (extend this for custom widgets)
    ticker.js                     # Ticker
    mini-chart.js                 # MiniChart
    message-log.js                # MessageLog
    range-bar.js                  # RangeBar
    activity-bars.js              # ActivityBars
  adapters/
    base-adapter.js               # BaseAdapter (extend this for custom adapters)
    manual-adapter.js             # ManualAdapter
    websocket-adapter.js          # WebSocketAdapter
    rest-poller.js                # RestPoller
    nats-adapter.js               # NatsAdapter
    redis-adapter.js              # RedisAdapter
```

Every file is independently importable: `import { MiniChart } from 'minterm/src/widgets/mini-chart.js'`.

## Performance notes

- **rAF batching** — 1000 `.push()` calls/sec = 60 actual renders/sec
- **Incremental DOM** — MessageLog appends nodes, never rebuilds innerHTML
- **SVG reuse** — ArrowOverlay caches SVG elements, only updates attributes
- **CSS-only animation** — ticker scroll, bar pulse, arrow dash are all `@keyframes`
- **GPU-composited drag** — windows use `transform: translate()` during drag, baked to `left/top` on drop
- **CSS containment** — `.mt-win` uses `contain: layout style` to isolate reflow
- **Flat grid** — MiniChart uses `Array(H*W)` with indexed access, no nested arrays
- **Adapter throttle** — `{ throttle: 16 }` caps emissions at ~60/sec, drops intermediates, keeps latest
