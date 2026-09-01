const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('game.js', 'utf8').replace(/initApp\(\);\s*$/, '');
const code = `${source}
model.boosters = {};
model.returnRewardDay = 0;
model.lastReturnRewardDate = '';
const first = claimReturnReward(new Date(2026, 0, 1));
assert.deepStrictEqual(first, { boosterKey: 'mix', day: 1 });
assert.strictEqual(model.boosters.mix, 1);
assert.strictEqual(claimReturnReward(new Date(2026, 0, 1)), null, 'only one reward may be claimed per local day');
const second = claimReturnReward(new Date(2026, 0, 9));
assert.deepStrictEqual(second, { boosterKey: 'rotator', day: 2 }, 'missed dates must not reset or skip progress');
model.returnRewardDay = 8;
model.lastReturnRewardDate = '2026-01-09';
const ninth = claimReturnReward(new Date(2026, 0, 10));
assert.deepStrictEqual(ninth, { boosterKey: 'minusOneColor', day: 9 });
assert.strictEqual(model.returnRewardDay, 0, 'the nine-return cycle repeats after its rarest reward');
console.log('return reward cycle ok');`;

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
};

vm.createContext(sandbox);
vm.runInContext(code, sandbox);
