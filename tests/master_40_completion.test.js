const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('game.js', 'utf8').replace(/initApp\(\);\s*$/, '');
const code = `${source}
model.activeLevelSet = 'master';
model.currentLevelIndex = 39;
model.master40Celebrated = false;
assert.strictEqual(shouldShowMaster40Celebration(), true);
model.master40Celebrated = true;
assert.strictEqual(shouldShowMaster40Celebration(), false, 'the Master 40 sequence must only be eligible once');
model.master40Celebrated = false;
model.activeLevelSet = 'main';
assert.strictEqual(shouldShowMaster40Celebration(), false, 'Main level 40 must not trigger the Master completion');
model.activeLevelSet = 'master';
model.currentLevelIndex = 38;
assert.strictEqual(shouldShowMaster40Celebration(), false);

model.master40Celebrated = true;
savePersistentState();
assert.strictEqual(localStorage.getItem(STORAGE_KEYS.master40Celebrated), 'true');
assert.ok(boosterIcon('mix').includes('icons/mix.png'));
assert.ok(boosterIcon('plusTenSeconds').includes('icons/plusTenSeconds.png'));
console.log('master level 40 completion state ok');`;

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
