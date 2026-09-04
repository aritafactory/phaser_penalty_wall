const assert = require('assert');
const {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  calculateViewportScale,
} = require('../viewport-scale.js');

assert.deepStrictEqual(calculateViewportScale(1920, 1080), {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  designWidth: DESIGN_WIDTH,
  designHeight: DESIGN_HEIGHT,
});

const phone = calculateViewportScale(390, 844);
assert.strictEqual(phone.scale, 390 / 1920);
assert.strictEqual(phone.offsetX, 0);
assert(phone.offsetY > 0, 'portrait viewports should vertically center the scaled game');

const ultrawide = calculateViewportScale(2560, 1080);
assert.strictEqual(ultrawide.scale, 1);
assert.strictEqual(ultrawide.offsetX, 320);
assert.strictEqual(ultrawide.offsetY, 0);

const enlarged = calculateViewportScale(3840, 2160);
assert.strictEqual(enlarged.scale, 2, 'large displays should scale every UI element up consistently');

console.log('viewport scaling calculations ok');
