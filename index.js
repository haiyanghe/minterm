// minterm — modular DOS-style windowing UI
// Import only what you need, or use this barrel export.

// Core
export { Emitter } from './src/emitter.js';
export { getNextZ, bringToFront, getAllWindows, cycleWindow } from './src/z-index.js';
export { WindowManager } from './src/window-manager.js';
export { ModalManager } from './src/modal-manager.js';
export { ArrowOverlay } from './src/arrow-overlay.js';
export { formatNum, formatPrice, formatQty, formatPct } from './src/formatters.js';
export { themes, applyTheme } from './src/themes.js';

// Widgets
export { BaseWidget } from './src/widgets/base-widget.js';
export { Ticker } from './src/widgets/ticker.js';
export { MiniChart } from './src/widgets/mini-chart.js';
export { MessageLog } from './src/widgets/message-log.js';
export { RangeBar } from './src/widgets/range-bar.js';
export { ActivityBars } from './src/widgets/activity-bars.js';

// Adapters
export { BaseAdapter } from './src/adapters/base-adapter.js';
export { ManualAdapter } from './src/adapters/manual-adapter.js';
export { WebSocketAdapter } from './src/adapters/websocket-adapter.js';
export { RestPoller } from './src/adapters/rest-poller.js';
export { NatsAdapter } from './src/adapters/nats-adapter.js';
export { RedisAdapter } from './src/adapters/redis-adapter.js';
