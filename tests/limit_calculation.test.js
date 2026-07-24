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
