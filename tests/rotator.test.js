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
}
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
