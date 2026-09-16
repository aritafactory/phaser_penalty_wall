const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('game.js', 'utf8').replace(/initApp\(\);\s*$/, '');
const timers = new Map();
let nextTimer = 1;
const gameContainer = { clears: 0, replaceChildren() { this.clears += 1; } };

const context = {
  console,
  document: {
    body: { dataset: {}, classList: { add() {}, remove() {} } },
    getElementById: (id) => (id === 'game' ? gameContainer : null),
    querySelector: () => null,
    addEventListener() {},
  },
  window: { addEventListener() {} },
  localStorage: { getItem: () => null, setItem() {} },
  fetch: async () => ({ ok: false }),
  Audio: function Audio() {},
  Phaser: {
    AUTO: 'AUTO',
    Scene: class Scene {},
    Game: class Game {},
  },
  setInterval: () => 1,
  clearInterval() {},
  setTimeout(callback) {
    const id = nextTimer++;
    timers.set(id, callback);
    return id;
  },
  clearTimeout(id) { timers.delete(id); },
};

vm.createContext(context);
vm.runInContext(`${source}
  model.grid = [['R']];
  phaserGame = {};
  let resizeCount = 0;
  initPhaser = () => { resizeCount += 1; };
  handleAdStarted();
  scheduleBoardResize();
  scheduleBoardResize();
  handleAdEnded();
  globalThis.getResizeCount = () => resizeCount;
`, context);

assert.strictEqual(timers.size, 1, 'multiple ad-time resizes should produce one deferred resize');
timers.values().next().value();
assert.strictEqual(context.getResizeCount(), 1, 'the pending resize should run once after the ad');

console.log('board resize ad deferral ok');
