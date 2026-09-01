const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('game.js', 'utf8').replace(/initApp\(\);\s*$/, '');
const code = `${source}
model.activeLevelSet = 'main';
model.currentLevelIndex = 199;
model.level200Celebrated = false;
assert.strictEqual(shouldShowLevel200Celebration(), true);
model.level200Celebrated = true;
assert.strictEqual(shouldShowLevel200Celebration(), false, 'the sequence must only be eligible once');
model.level200Celebrated = false;
model.activeLevelSet = 'master';
assert.strictEqual(shouldShowLevel200Celebration(), false, 'Master level 200 must not trigger the Main completion');
model.activeLevelSet = 'main';
model.currentLevelIndex = 198;
assert.strictEqual(shouldShowLevel200Celebration(), false);
assert.strictEqual(AUDIO_PATHS.fanfare, 'audio/fanfare.mp3');

model.level200Celebrated = true;
savePersistentState();
assert.strictEqual(localStorage.getItem(STORAGE_KEYS.level200Celebrated), 'true');
console.log('level 200 completion state ok');`;

const storage = new Map();
const sandbox = {
  assert,
  console,
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  },
  document: {
    body: { dataset: {}, classList: { add() {}, remove() {} } },
    getElementById: () => null,
  },
  window: {},
  Phaser: { Scene: class {} },
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
};

vm.createContext(sandbox);
vm.runInContext(code, sandbox);
