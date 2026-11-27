// Overlay placement: maximize on the right screen, restore, collapse, resize, survive monitor changes.
const test = require('node:test');
const assert = require('node:assert/strict');
const g = require('../src/window-geometry');

// Laptop 1920x1080 (taskbar 40px) with a 2560x1440 monitor to its right.
const LAPTOP = { workArea: { x: 0, y: 0, width: 1920, height: 1040 } };
const MONITOR = { workArea: { x: 1920, y: 0, width: 2560, height: 1400 } };
const BOTH = [LAPTOP, MONITOR];

test('maximize fills the screen the overlay is on, not always the main one', () => {
  assert.deepEqual(g.maximizedBounds({ x: 100, y: 50, width: 780, height: 520 }, BOTH), LAPTOP.workArea);
  assert.deepEqual(g.maximizedBounds({ x: 2500, y: 300, width: 780, height: 520 }, BOTH), MONITOR.workArea);
  // Straddling both screens: the one holding most of the window wins.
  assert.deepEqual(g.maximizedBounds({ x: 1700, y: 100, width: 780, height: 520 }, BOTH), MONITOR.workArea);
});

test('saved position is kept when it is still on a screen', () => {
  const saved = { x: 2600, y: 400, width: 900, height: 600 };
  assert.deepEqual(g.fitToDisplays(saved, BOTH, LAPTOP), saved);
});

test('saved position on an unplugged monitor comes back to the default spot', () => {
  const onMonitor = { x: 2600, y: 400, width: 900, height: 600 };
  assert.deepEqual(g.fitToDisplays(onMonitor, [LAPTOP], LAPTOP), { x: 570, y: 20, width: 780, height: 520 });
});

test('a window dragged almost fully off-screen is brought back; a sliver is not enough', () => {
  assert.deepEqual(g.fitToDisplays({ x: 1880, y: 10, width: 780, height: 520 }, [LAPTOP], LAPTOP).x, 570);
  assert.deepEqual(g.fitToDisplays({ x: 1700, y: 10, width: 780, height: 520 }, [LAPTOP], LAPTOP).x, 1700);
});

test('garbage or missing saved bounds fall back to the default spot', () => {
  for (const bad of [null, undefined, {}, { x: 'a', y: 0, width: 10, height: 10 }, { x: 0, y: 0, width: -5, height: 10 }]) {
    assert.deepEqual(g.fitToDisplays(bad, BOTH, LAPTOP), { x: 570, y: 20, width: 780, height: 520 });
  }
});

test('saved size bigger than the screen (resolution dropped) is shrunk to fit', () => {
  const b = g.fitToDisplays({ x: 0, y: 0, width: 3000, height: 2000 }, [LAPTOP], LAPTOP);
  assert.equal(b.width, 1920);
  assert.equal(b.height, 1040);
});

test('collapse keeps width and position, shows only the toolbar', () => {
  assert.deepEqual(g.compactBounds({ x: 10, y: 10, width: 780, height: 520 }, { x: 300, y: 200 }),
    { x: 300, y: 200, width: 780, height: g.COMPACT_HEIGHT });
});

test('resize corner: never below the minimum, never past the screen edge', () => {
  const start = { x: 1000, y: 500, width: 780, height: 520 };
  assert.deepEqual(g.resizedBounds(start, 900, 600, BOTH.slice(0, 1)), { x: 1000, y: 500, width: 900, height: 540 });
  assert.deepEqual(g.resizedBounds(start, 100, 50, BOTH), { x: 1000, y: 500, width: g.MIN_SIZE.width, height: g.MIN_SIZE.height });
  assert.equal(g.resizedBounds(start, 1200, 520, [LAPTOP]).width, 920);
});
