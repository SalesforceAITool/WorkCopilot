// Window placement maths for the overlay: no Electron imports, so it is unit-tested directly.
// A "display" here is { workArea: {x, y, width, height} } — the screen minus the taskbar.

const DEFAULT_SIZE = { width: 780, height: 520 };
const MIN_SIZE = { width: 460, height: 200 };
const COMPACT_HEIGHT = 58;         // toolbar only
const MIN_VISIBLE = { width: 120, height: 40 }; // this much must stay on some screen

function isRect(b) {
  return b && ['x', 'y', 'width', 'height'].every(k => Number.isFinite(b[k])) && b.width > 0 && b.height > 0;
}

function overlap(a, b) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? { width: w, height: h } : { width: 0, height: 0 };
}

// The screen the window is mostly on (or nearest to, if it is off every screen).
function displayFor(bounds, displays) {
  let best = displays[0];
  let bestArea = -1;
  for (const d of displays) {
    const o = overlap(bounds, d.workArea);
    const area = o.width * o.height;
    if (area > bestArea) { best = d; bestArea = area; }
  }
  if (bestArea > 0) return best;
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  let nearest = displays[0];
  let dist = Infinity;
  for (const d of displays) {
    const w = d.workArea;
    const dx = Math.max(w.x - cx, 0, cx - (w.x + w.width));
    const dy = Math.max(w.y - cy, 0, cy - (w.y + w.height));
    const dd = dx * dx + dy * dy;
    if (dd < dist) { nearest = d; dist = dd; }
  }
  return nearest;
}

function defaultBounds(primary) {
  const w = primary.workArea;
  const width = Math.min(DEFAULT_SIZE.width, w.width);
  const height = Math.min(DEFAULT_SIZE.height, w.height);
  return { x: Math.round(w.x + (w.width - width) / 2), y: w.y + 20, width, height };
}

// Saved bounds are kept if enough of the window is on a screen that still exists
// (monitor unplugged, resolution changed…); otherwise the window comes back to the default spot.
function fitToDisplays(bounds, displays, primary) {
  if (!isRect(bounds) || !displays.length) return defaultBounds(primary || displays[0]);
  const visible = displays.some(d => {
    const o = overlap(bounds, d.workArea);
    return o.width >= MIN_VISIBLE.width && o.height >= MIN_VISIBLE.height;
  });
  if (!visible) return defaultBounds(primary || displays[0]);
  const w = displayFor(bounds, displays).workArea;
  return {
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width: Math.round(Math.max(MIN_SIZE.width, Math.min(bounds.width, w.width))),
    height: Math.round(Math.max(COMPACT_HEIGHT, Math.min(bounds.height, w.height)))
  };
}

function maximizedBounds(current, displays) {
  return { ...displayFor(current, displays).workArea };
}

function compactBounds(normal, at) {
  return { x: at.x, y: at.y, width: normal.width, height: COMPACT_HEIGHT };
}

// Resize from the bottom-right corner: top-left stays put, size never below the minimum
// or beyond the screen the window is on.
function resizedBounds(start, width, height, displays) {
  const w = displayFor(start, displays).workArea;
  return {
    x: start.x,
    y: start.y,
    width: Math.round(Math.max(MIN_SIZE.width, Math.min(width, w.x + w.width - start.x))),
    height: Math.round(Math.max(MIN_SIZE.height, Math.min(height, w.y + w.height - start.y)))
  };
}

module.exports = {
  DEFAULT_SIZE, MIN_SIZE, COMPACT_HEIGHT,
  displayFor, defaultBounds, fitToDisplays, maximizedBounds, compactBounds, resizedBounds
};
