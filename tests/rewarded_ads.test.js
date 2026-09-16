const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('game.js', 'utf8').replace(/initApp\(\);\s*$/, '');
const code = `${source}
renderShopTable = () => {};
renderBoosterInventory = () => {};
refreshUI = () => {};
playEffectSound = () => {};
let resizeRuns = 0;
const realInitPhaser = initPhaser;
initPhaser = () => { resizeRuns += 1; };
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

  let slept = 0;
  let woke = 0;
  phaserGame = {
    input: { enabled: true },
    loop: { running: true, sleep: () => { slept += 1; }, wake: () => { woke += 1; } },
  };
  backgroundAudio = { muted: false, paused: false };
  soundEnabled = true;
  model.grid = [['R']];
  scheduleBoardResize();
  assert.strictEqual(pendingTimerCount(), 1, 'a normal resize schedules one Phaser rebuild');
  handleGameDistributionEvent({ detail: { name: 'SDK_GAME_PAUSE' } });
  assert.strictEqual(slept, 1, 'SDK pause sleeps gameplay');
  assert.strictEqual(phaserGame.input.enabled, false, 'SDK pause disables gameplay input');
  assert.strictEqual(backgroundAudio.muted, true, 'SDK pause mutes game audio');
  assert.strictEqual(pendingTimerCount(), 0, 'SDK pause cancels a resize that was already scheduled');
  scheduleBoardResize();
  resumeFromPortraitOrientation();
  assert.strictEqual(woke, 0, 'resizing or orientation changes cannot resume gameplay during an ad');
  assert.strictEqual(boardResizePendingDuringAd, true, 'board resize is deferred while the ad is visible');
  handleGameDistributionEvent({ detail: { name: 'SDK_GAME_START' } });
  assert.strictEqual(woke, 1, 'SDK start restores the previously running game loop');
  assert.strictEqual(phaserGame.input.enabled, true, 'SDK start restores the prior input state');
  assert.strictEqual(backgroundAudio.muted, false, 'SDK start restores the prior sound preference');
  assert.strictEqual(pendingTimerCount(), 1, 'SDK start schedules the deferred resize exactly once');
  runPendingTimers();
  assert.strictEqual(resizeRuns, 1, 'the pending resize rebuilds Phaser once after the ad');

  phaserGame.loop.running = false;
  phaserGame.input.enabled = false;
  handleGameDistributionEvent({ detail: { name: 'SDK_GAME_PAUSE' } });
  handleGameDistributionEvent({ detail: { name: 'SDK_GAME_START' } });
  assert.strictEqual(woke, 1, 'an ad must not wake gameplay that was already paused');
  assert.strictEqual(phaserGame.input.enabled, false, 'an ad preserves previously disabled input');

  let destroyedWithCanvas = false;
  let containerCleared = false;
  phaserGame = { destroy: (removeCanvas) => { destroyedWithCanvas = removeCanvas; } };
  gameContainer.replaceChildren = () => { containerCleared = true; };
  boardLayoutMetrics = () => ({ width: 320, height: 480 });
  Phaser.Game = class {
    constructor(config) {
      this.config = config;
    }
  };
  realInitPhaser(1, 1);
  assert.strictEqual(destroyedWithCanvas, true, 'rebuilding always destroys the old Phaser game and canvas');
  assert.strictEqual(containerCleared, true, 'rebuilding clears stale nodes from the game container');
  assert(phaserGame instanceof Phaser.Game, 'rebuilding creates one fresh Phaser game');
  console.log('rewarded ads ok');
})();`;

const storage = new Map();
const pendingTimers = new Map();
let nextTimerId = 1;
const gameContainer = {};
const sandbox = {
  assert,
  console,
  gameContainer,
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  },
  document: {
    body: { dataset: {}, classList: { add() {}, remove() {} } },
    documentElement: { classList: { add() {}, remove() {} } },
    getElementById: (id) => (id === 'game' ? gameContainer : null),
  },
  window: {},
  Phaser: { Scene: class {} },
  setTimeout: (callback) => {
    const id = nextTimerId;
    nextTimerId += 1;
    pendingTimers.set(id, callback);
    return id;
  },
  clearTimeout: (id) => pendingTimers.delete(id),
  pendingTimerCount: () => pendingTimers.size,
  runPendingTimers: () => {
    const callbacks = [...pendingTimers.values()];
    pendingTimers.clear();
    callbacks.forEach((callback) => callback());
  },
};

vm.createContext(sandbox);
Promise.resolve(vm.runInContext(code, sandbox)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
