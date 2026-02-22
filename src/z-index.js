/** Shared z-index counter for all window systems */
let nextZ = 100;

export function getNextZ() { return ++nextZ; }

export function bringToFront(el) {
  if (el) el.style.zIndex = ++nextZ;
  return nextZ;
}

/** Get all visible mt- windows sorted by z-index */
export function getAllWindows(container) {
  const root = container || document;
  return [...root.querySelectorAll('.mt-win')]
    .filter(el => el.offsetParent !== null)
    .sort((a, b) => (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0));
}

/** Cycle to the next (or previous) window */
export function cycleWindow(container, reverse = false) {
  const wins = getAllWindows(container);
  if (wins.length < 2) return;
  const top = wins[wins.length - 1];
  let target;
  if (reverse) {
    target = wins[wins.length - 2];
  } else {
    top.style.zIndex = 1;
    target = wins[0];
  }
  bringToFront(target);
  const rect = target.getBoundingClientRect();
  if (rect.top < 0) target.style.top = '10px';
  if (rect.left < 0) target.style.left = '10px';
}
