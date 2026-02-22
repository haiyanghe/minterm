/** Formatting helpers for numbers, quantities, and percentages */

export function formatNum(n) {
  if (n == null || isNaN(n)) return '0';
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1e9) return sign + (a / 1e9).toFixed(a >= 1e10 ? 1 : 2) + 'bil';
  if (a >= 1e6) return sign + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'mil';
  if (a >= 10000) return sign + (a / 1e3).toFixed(a >= 1e5 ? 0 : 1) + 'k';
  if (a >= 1000) return sign + a.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (a >= 1) return n.toFixed(2);
  if (a >= 0.01) return n.toFixed(4);
  if (a > 0) {
    const digits = Math.max(4, -Math.floor(Math.log10(a)) + 2);
    return n.toFixed(Math.min(digits, 12));
  }
  return '0';
}

/** @deprecated Use formatNum instead */
export const formatPrice = formatNum;

export function formatQty(q) {
  if (q == null || isNaN(q)) return '0';
  const a = Math.abs(q);
  if (a >= 10000) return q.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (a >= 100) return q.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (a >= 1) return q.toFixed(2);
  if (a >= 0.01) return q.toFixed(4);
  if (a > 0) {
    const digits = Math.max(4, -Math.floor(Math.log10(a)) + 2);
    return q.toFixed(Math.min(digits, 12));
  }
  return '0';
}

export function formatPct(pct) {
  if (pct == null || isNaN(pct)) return '0%';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}
