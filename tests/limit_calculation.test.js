const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const code = `${fs.readFileSync('game.js', 'utf8').replace(/initApp\(\);\s*$/, '')}
const compactLayout = [
  ['R', 'R'],
  ['R', 'R'],
];
const splitLayout = [
  ['R', 'B'],
  ['B', 'R'],
];
const level = { complications: ['limited_shots', 'timer'], grid: compactLayout };
const compactRequired = calculateRequiredShotsForLevel(level, compactLayout);
const splitRequired = calculateRequiredShotsForLevel(level, splitLayout);
assert.notStrictEqual(compactRequired, splitRequired, 'different final layouts should produce different required-shot estimates');
assert.strictEqual(moveLimitForRequiredShots(compactRequired), Math.ceil(compactRequired * 1.1));
assert.strictEqual(timerLimitForRequiredShots(splitRequired), Math.ceil(splitRequired * 2 * 1.1));

const explicitLimits = resolveLevelLimits({
  complications: ['limited_shots', 'timer'],
  grid: compactLayout,
  maxShots: 7,
  timerSeconds: 19,
}, compactLayout);
assert.deepStrictEqual(explicitLimits, { maxShots: 7, timerSeconds: 19 });

const independentLimits = resolveLevelLimits({
  complications: ['limited_shots', 'timer'],
  grid: compactLayout,
  maxShots: 8,
}, compactLayout);
assert.strictEqual(independentLimits.maxShots, 8, 'explicit move limit should be preserved');
assert.strictEqual(
  independentLimits.timerSeconds,
  timerLimitForRequiredShots(compactRequired),
  'missing timer should still be calculated independently'
);

const independentlyCalculatedMoves = resolveLevelLimits({
  complications: ['limited_shots', 'timer'],
  grid: compactLayout,
  timerSeconds: 24,
}, compactLayout);
assert.strictEqual(
  independentlyCalculatedMoves.maxShots,
  moveLimitForRequiredShots(compactRequired),
  'missing move limit should still be calculated independently'
);
assert.strictEqual(independentlyCalculatedMoves.timerSeconds, 24, 'explicit timer should be preserved');

const ignoredLimits = resolveLevelLimits({
  complications: [],
  grid: compactLayout,
  maxShots: 1,
  timerSeconds: 1,
}, compactLayout);
assert.strictEqual(ignoredLimits.maxShots, Infinity, 'maxShots should be ignored without limited_shots');
assert.strictEqual(ignoredLimits.timerSeconds, Infinity, 'timerSeconds should be ignored without timer');

const explicitLevel = {
  complications: ['limited_shots', 'timer'],
  grid: compactLayout,
  maxShots: 9,
  timerSeconds: 21,
};
applyCalculatedLimitsToLevel(explicitLevel, compactLayout);
assert.strictEqual(explicitLevel.maxShots, 9, 'automatic balancing must not overwrite JSON maxShots');
assert.strictEqual(explicitLevel.timerSeconds, 21, 'automatic balancing must not overwrite JSON timerSeconds');
assert.strictEqual(ratingForRemainingResource(4), 3, 'more than three remaining earns three stars');
assert.strictEqual(ratingForRemainingResource(3), 2, 'two or three remaining earns two stars');
assert.strictEqual(ratingForRemainingResource(1), 1, 'zero or one remaining earns one star');
assert.strictEqual(starLabel(0), '☆☆☆');
assert.strictEqual(starLabel(2), '★★☆');
model.shotsLeft = 5;
model.timerLeft = 2.9;
assert.strictEqual(calculateCurrentLevelStars(), 2, 'levels with both limits use the lower rating');
model.levelStars = { main: {}, master: {} };
assert.strictEqual(recordBestLevelStars('master', 0, 3), 3);
assert.strictEqual(recordBestLevelStars('master', 0, 1), 3, 'a replay cannot reduce the saved best rating');
const smallBoardMetrics = boardLayoutMetrics(3, 3);
const largeBoardMetrics = boardLayoutMetrics(10, 12);
assert.strictEqual(smallBoardMetrics.cell, 140, 'small boards should grow to the desktop cell cap');
assert.ok(largeBoardMetrics.cell < smallBoardMetrics.cell, 'large boards should fit the available viewport height');
assert.strictEqual(largeBoardMetrics.width, largeBoardMetrics.cell * 12 + 24);
assert.strictEqual(smallBoardMetrics.shooterGap, 22, 'only a compact gap is reserved above the shooter');
assert.strictEqual(
  smallBoardMetrics.height,
  12 + smallBoardMetrics.cell * 3 + smallBoardMetrics.shooterGap + smallBoardMetrics.launcherRadius * 2 + 12,
  'canvas height should exactly contain the grid, shooter, and margins without a fixed launcher area'
);
const twentyBreakable = { grid: Array.from({ length: 4 }, () => Array(5).fill('R')) };
assert.strictEqual(breakableBlockCountForLevel(twentyBreakable), 20);
assert.strictEqual(rewardForLevelStars(twentyBreakable, 1), 45);
assert.strictEqual(rewardForLevelStars(twentyBreakable, 2), 56);
assert.strictEqual(rewardForLevelStars(twentyBreakable, 3), 68);
const layeredRewardLevel = {
  layers: [
    [['R', 'U', null], ['2G', 'F:R:B:0', 'B']],
    [['U', 'Y', 'P']],
  ],
};
assert.strictEqual(breakableBlockCountForLevel(layeredRewardLevel), 6, 'all layers count nonempty breakable cells only');
assert.strictEqual(rewardForLevelStars({ grid: [Array(322).fill('R')] }, 3), 182);
assert.strictEqual(rewardForLevelStars(twentyBreakable, 3), 68, 'replays receive the full run reward again');
model.activeLevelSet = 'main';
model.currentLevel = twentyBreakable;
assert.strictEqual(currentLevelGoalText(), 'Clear all blocks');
model.activeLevelSet = 'master';
assert.strictEqual(currentLevelGoalText(), 'Complete the shape');
assert.strictEqual(AUDIO_PATHS.shot, 'audio/shot.mp3');
assert.strictEqual(AUDIO_PATHS.background, 'audio/background.mp3');
assert.strictEqual(backgroundMusicRequested, false, 'music must wait for the PLAY action');
applySoundPreference(false, false);
assert.strictEqual(soundEnabled, false, 'shared sound preference should mute all audio');
applySoundPreference(true, false);
assert.strictEqual(soundEnabled, true, 'sound should default back to enabled');
console.log('layout-sensitive limit calculation ok', { compactRequired, splitRequired });
`;

const sandbox = {
  console,
  assert,
  Math,
  Number,
  Array,
  Set,
  Map,
  JSON,
  String,
  Boolean,
  localStorage: { getItem: () => null, setItem: () => {} },
  document: {
    body: { dataset: {}, classList: { add() {}, remove() {} } },
    getElementById: () => null,
    createElement: () => ({}),
  },
  window: { innerWidth: 1200, innerHeight: 800 },
  Phaser: { Scene: class {} },
  fetch: async () => ({ ok: false }),
  setTimeout,
};

vm.createContext(sandbox);
vm.runInContext(code, sandbox);
