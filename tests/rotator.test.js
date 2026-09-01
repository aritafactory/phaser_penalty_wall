const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('game.js', 'utf8').replace(/initApp\(\);\s*$/, '');
const code = `${source}
const grid = [
  ['outside', null, null, null, null],
  [null, 'a', 'b', 'c', null],
  [null, 'h', 'center', 'd', null],
  [null, 'g', 'f', 'e', null],
  [null, null, null, null, null],
];
const beforeCells = grid.flat().filter(Boolean).sort();
assert.strictEqual(rotateRingClockwise(grid, 2, 2), true);
assert.deepStrictEqual(grid.slice(1, 4).map((row) => row.slice(1, 4)), [
  ['h', 'a', 'b'],
  ['g', 'center', 'c'],
  ['f', 'e', 'd'],
]);
assert.strictEqual(grid[0][0], 'outside', 'rotation must not apply gravity or touch cells outside the selected ring');
assert.deepStrictEqual(grid.flat().filter(Boolean).sort(), beforeCells, 'rotation must preserve the exact block multiset');
assert.strictEqual(gridBlockCount(grid), beforeCells.length, 'rendered-block accounting must match the rotated grid');
assert.strictEqual(rotateRingClockwise(grid, 0, 0), false, 'an incomplete 3x3 selection must be rejected');

for (let iteration = 0; iteration < 250; iteration += 1) {
  const randomGrid = Array.from({ length: 8 }, () => Array.from(
    { length: 9 },
    () => Math.random() < 0.35 ? null : ['R', 'G', 'B', 'U', '2R', 'F:R:G:0'][Math.floor(Math.random() * 6)]
  ));
  const before = randomGrid.flat().map((cell) => cell ?? '<empty>').sort();
  const center = randomGrid[4][4];
  rotateRingClockwise(randomGrid, 4, 4);
  assert.strictEqual(randomGrid[4][4], center, 'the center must remain unchanged');
  assert.deepStrictEqual(randomGrid.flat().map((cell) => cell ?? '<empty>').sort(), before, 'no randomized rotation may create or remove a block');
  const countBeforeGravity = gridBlockCount(randomGrid);
  applyGravityToGrid(randomGrid);
  assert.strictEqual(gridBlockCount(randomGrid), countBeforeGravity, 'normal gravity after rotation must preserve block count');
}

model.grid = [[makeFlashing('R', 'G', 0)]];
model.gameOver = false;
model.gameplayActive = true;
model.tutorialOpen = false;
model.timerLeft = Infinity;
const animatedScene = {
  animating: true,
  flashAccumulator: 799,
  updateBombPreview() {},
  renderGridStatic() { throw new Error('flashing blocks must not rerender during an animation'); },
};
BoardScene.prototype.update.call(animatedScene, 0, 10);
assert.strictEqual(animatedScene.flashAccumulator, 799, 'flashing time must pause during Rotator animation');
assert.strictEqual(model.grid[0][0], makeFlashing('R', 'G', 0));

model.grid = [['R', null, 'U'], [null, '2G', null]];
const destroyed = [];
const renderScene = {
  blocks: new Map([['stale-a', { destroy: () => destroyed.push('a') }], ['stale-b', { destroy: () => destroyed.push('b') }]]),
  key: BoardScene.prototype.key,
  createBlock: (row, col, code) => ({ row, col, code, destroy() {} }),
  drawTargetZoneOverlay() {},
  shooter: { setFillStyle() {} },
};
assert.strictEqual(BoardScene.prototype.renderGridStatic.call(renderScene), true);
assert.strictEqual(renderScene.blocks.size, gridBlockCount(model.grid), 'scene resync must render exactly one sprite per grid block');
assert.deepStrictEqual(destroyed.sort(), ['a', 'b'], 'scene resync must destroy stale rendered blocks');
console.log('rotator invariants ok');`;

const sandbox = {
  assert,
  console,
  localStorage: { getItem: () => null, setItem: () => {} },
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
