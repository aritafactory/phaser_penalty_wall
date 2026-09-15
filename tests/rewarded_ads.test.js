const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('game.js', 'utf8').replace(/initApp\(\);\s*$/, '');
const code = `${source}
renderShopTable = () => {};
renderBoosterInventory = () => {};
refreshUI = () => {};
playEffectSound = () => {};
model.boosters = {};
(async () => {
  window.gdsdk = { showAd: async (type) => { assert.strictEqual(type, 'rewarded'); } };
  assert.strictEqual(await requestRewardedBooster('bomb'), true);
  assert.strictEqual(model.boosters.bomb, 1, 'a completed rewarded ad grants exactly one booster');

  window.gdsdk.showAd = async () => { throw new Error('ad skipped'); };
  assert.strictEqual(await requestRewardedBooster('mix'), false);
  assert.strictEqual(model.boosters.mix, undefined, 'a skipped rewarded ad must not grant a booster');

  model.currentLevelIndex = 19;
  model.gameplayActive = true;
  model.gameOver = false;
  assert.strictEqual(model.currentLevelIndex >= 20, false, 'gameplay ads stay locked before level 21');
  model.currentLevelIndex = 20;
  assert.strictEqual(model.currentLevelIndex >= 20, true, 'gameplay ads unlock at level 21');
  console.log('rewarded ads ok');
})();`;

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
Promise.resolve(vm.runInContext(code, sandbox)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
