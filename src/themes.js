/** Built-in color schemes — apply via applyTheme('amber') or pass a custom object */

export const themes = {
  // ── Default — the original vivid cyan ──
  cyber: {
    '--mt-font': "'Courier New', 'Consolas', monospace",
    '--mt-font-size': '15px',
    '--mt-accent': '#0aa',
    '--mt-accent-bright': '#0ff',
    '--mt-bg': '#0a0a0a',
    '--mt-border': '#0aa',
    '--mt-green': '#0f0',
    '--mt-red': '#f44',
    '--mt-yellow': '#ff0',
    '--mt-cyan': '#0ff',
    '--mt-magenta': '#f0f',
    '--mt-orange': '#f80',
    '--mt-white': '#fff',
    '--mt-dim': '#666',
    '--mt-text': '#ccc',
    '--mt-titlebar-bg': '#0aa',
    '--mt-titlebar-fg': '#000',
    '--mt-glow': 'rgba(0, 170, 170, 0.12)',
    '--mt-glow-strong': 'rgba(0, 170, 170, 0.3)',
  },

  // ── Muted / low-fatigue themes for long sessions ──

  amber: {
    '--mt-font': "'VT323', 'Courier New', monospace",
    '--mt-font-size': '16px',
    '--mt-accent': '#a08030',
    '--mt-accent-bright': '#c8a048',
    '--mt-bg': '#0e0c08',
    '--mt-border': '#7a6428',
    '--mt-green': '#6a9a4a',
    '--mt-red': '#a04a3a',
    '--mt-yellow': '#c8a048',
    '--mt-cyan': '#a08858',
    '--mt-magenta': '#9a6878',
    '--mt-orange': '#b07838',
    '--mt-white': '#d0c8a8',
    '--mt-dim': '#5a5038',
    '--mt-text': '#a89878',
    '--mt-titlebar-bg': '#7a6428',
    '--mt-titlebar-fg': '#0e0c08',
    '--mt-glow': 'rgba(160, 128, 48, 0.08)',
    '--mt-glow-strong': 'rgba(160, 128, 48, 0.18)',
  },
  phosphor: {
    '--mt-font': "'IBM Plex Mono', 'Consolas', monospace",
    '--mt-font-size': '14px',
    '--mt-accent': '#3a8a3a',
    '--mt-accent-bright': '#58b858',
    '--mt-bg': '#080e08',
    '--mt-border': '#2e6e2e',
    '--mt-green': '#58b858',
    '--mt-red': '#a85050',
    '--mt-yellow': '#90a838',
    '--mt-cyan': '#58a868',
    '--mt-magenta': '#7a6a98',
    '--mt-orange': '#a88038',
    '--mt-white': '#b0c8a8',
    '--mt-dim': '#385838',
    '--mt-text': '#7a9a70',
    '--mt-titlebar-bg': '#2e6e2e',
    '--mt-titlebar-fg': '#080e08',
    '--mt-glow': 'rgba(58, 138, 58, 0.08)',
    '--mt-glow-strong': 'rgba(58, 138, 58, 0.18)',
  },
  hotline: {
    '--mt-font': "'Share Tech Mono', 'Courier New', monospace",
    '--mt-font-size': '15px',
    '--mt-accent': '#9a4070',
    '--mt-accent-bright': '#c05888',
    '--mt-bg': '#0e080c',
    '--mt-border': '#7a3058',
    '--mt-green': '#5a9a68',
    '--mt-red': '#b05050',
    '--mt-yellow': '#b8a050',
    '--mt-cyan': '#6898a8',
    '--mt-magenta': '#c05888',
    '--mt-orange': '#b07848',
    '--mt-white': '#d0c0c8',
    '--mt-dim': '#5a4050',
    '--mt-text': '#a88898',
    '--mt-titlebar-bg': '#7a3058',
    '--mt-titlebar-fg': '#0e080c',
    '--mt-glow': 'rgba(154, 64, 112, 0.08)',
    '--mt-glow-strong': 'rgba(154, 64, 112, 0.18)',
  },
  ice: {
    '--mt-font': "'Fira Code', 'Consolas', monospace",
    '--mt-font-size': '14px',
    '--mt-accent': '#5068a0',
    '--mt-accent-bright': '#7088c0',
    '--mt-bg': '#08090e',
    '--mt-border': '#405080',
    '--mt-green': '#509878',
    '--mt-red': '#a85858',
    '--mt-yellow': '#b0a060',
    '--mt-cyan': '#6890b0',
    '--mt-magenta': '#8868a8',
    '--mt-orange': '#a88050',
    '--mt-white': '#c0c4d0',
    '--mt-dim': '#484e60',
    '--mt-text': '#909ab0',
    '--mt-titlebar-bg': '#405080',
    '--mt-titlebar-fg': '#08090e',
    '--mt-glow': 'rgba(80, 104, 160, 0.08)',
    '--mt-glow-strong': 'rgba(80, 104, 160, 0.18)',
  },
  slate: {
    '--mt-font': "'JetBrains Mono', 'Menlo', monospace",
    '--mt-font-size': '14px',
    '--mt-accent': '#6a7a88',
    '--mt-accent-bright': '#8898a8',
    '--mt-bg': '#0c0d0e',
    '--mt-border': '#4a5a68',
    '--mt-green': '#58906a',
    '--mt-red': '#985858',
    '--mt-yellow': '#a89858',
    '--mt-cyan': '#6888a0',
    '--mt-magenta': '#886888',
    '--mt-orange': '#a08050',
    '--mt-white': '#b8bcc0',
    '--mt-dim': '#484c50',
    '--mt-text': '#8a9098',
    '--mt-titlebar-bg': '#4a5a68',
    '--mt-titlebar-fg': '#0c0d0e',
    '--mt-glow': 'rgba(106, 122, 136, 0.06)',
    '--mt-glow-strong': 'rgba(106, 122, 136, 0.14)',
  },
};

/**
 * Apply a theme by name or custom object.
 * @param {string|object} theme — name from built-in themes, or { '--mt-accent': '#f00', ... }
 * @param {HTMLElement} [root=document.documentElement] — element to set CSS vars on
 */
export function applyTheme(theme, root) {
  const el = root || document.documentElement;
  const vars = typeof theme === 'string' ? themes[theme] : theme;
  if (!vars) return;
  const keys = Object.keys(vars);
  for (let i = 0, n = keys.length; i < n; i++) {
    el.style.setProperty(keys[i], vars[keys[i]]);
  }
}
