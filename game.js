const COLOR_MAP = {
  R: 0xef4444,
  G: 0x22c55e,
  B: 0x3b82f6,
  Y: 0xeab308,
  P: 0xa855f7,
  O: 0xf97316,
  U: 0x64748b,
};

const BASE_GRID = [
  ['R', 'G', 'B', 'R', 'G', 'B', 'R', 'G'],
  ['G', 'R', 'B', 'G', 'R', 'B', 'G', 'R'],
  ['B', 'B', 'R', 'G', 'R', 'G', 'B', 'R'],
  ['R', 'G', 'U', 'U', 'B', 'G', 'R', 'B'],
  ['G', 'R', 'B', 'R', 'G', 'B', 'G', 'R'],
  ['B', 'G', 'R', 'B', 'G', 'R', 'B', 'G'],
];

const COMPLICATIONS = [
  'additional_colors',
  'timer',
  'limited_shots',
  'unbreakable_blocks',
  'two_colors_blocks',
  'flashing_blocks',
  'several_layers',
];

const TWO_COLOR_GRID = BASE_GRID.map((row, r) =>
  row.map((cell, c) => ((r + c) % 7 === 0 && cell !== 'U' ? `2${cell}` : cell))
);

function withAdditionalColors(grid) {
  return grid.map((row, r) =>
    row.map((cell, c) => {
      if (cell === 'U' || cell.startsWith('2')) return cell;
      if ((r + c) % 5 === 0) return 'Y';
      if ((r + c) % 5 === 1) return 'P';
      if ((r + c) % 5 === 2) return 'O';
      return cell;
    })
  );
}

function makeLevel(levelNumber, activeComplications) {
  let grid = cloneGrid(BASE_GRID);

  if (activeComplications.includes('additional_colors')) grid = withAdditionalColors(grid);
  if (activeComplications.includes('two_colors_blocks')) grid = cloneGrid(TWO_COLOR_GRID);

  const level = {
    level: levelNumber,
    description: `Встроенный уровень ${levelNumber}`,
    complications: activeComplications,
    grid,
    boosters: {},
  };

  if (activeComplications.includes('timer')) level.timerSeconds = Math.max(45, 110 - levelNumber * 2);
  if (activeComplications.includes('limited_shots')) level.maxShots = Math.max(8, 24 - levelNumber);

  return level;
}

function combinations(arr, size) {
  const result = [];
  const path = [];
  function dfs(start) {
    if (path.length === size) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < arr.length; i += 1) {
      path.push(arr[i]);
      dfs(i + 1);
      path.pop();
    }
  }
  dfs(0);
  return result;
}

function buildBuiltinLevels() {
  const levels = [];
  let levelNumber = 1;
  const oneComplication = COMPLICATIONS.map((c) => [c]).slice(0, 7);
  const twoComplications = combinations(COMPLICATIONS, 2).slice(0, 7);
  const threeComplications = combinations(COMPLICATIONS, 3).slice(0, 7);

  [...oneComplication, ...twoComplications, ...threeComplications].forEach((compSet) => {
    levels.push(makeLevel(levelNumber, compSet));
    levelNumber += 1;
  });
  return levels;
}

const BUILTIN_LEVELS = buildBuiltinLevels();

const model = {
  level: null,
  grid: [],
  score: 0,
  selectedShotColor: 'R',
  shotsLeft: Infinity,
  timerLeft: Infinity,
  gameOver: false,
};

const ui = {
  levelSelect: document.getElementById('levelSelect'),
  startBtn: document.getElementById('startBtn'),
  shotPalette: document.getElementById('shotPalette'),
  scoreLabel: document.getElementById('scoreLabel'),
  shotsLabel: document.getElementById('shotsLabel'),
  timerLabel: document.getElementById('timerLabel'),
  stateLabel: document.getElementById('stateLabel'),
};

let phaserGame;
let boardScene;

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

function populateLevelSelect() {
  BUILTIN_LEVELS.forEach((lvl, idx) => {
    const option = document.createElement('option');
    option.value = String(idx);
    option.textContent = `${lvl.level}. ${lvl.description}`;
    ui.levelSelect.appendChild(option);
  });
}

function getBreakableColors(grid) {
  const set = new Set();
  for (const row of grid) {
    for (const rawCode of row) {
      const code = String(rawCode || '');
      if (!code || code === 'U') continue;
      const color = code.startsWith('2') ? code[1] : code;
      if (COLOR_MAP[color]) set.add(color);
    }
  }
  return [...set];
}

function randomDifferentColor(current, available) {
  const variants = available.filter((c) => c !== current);
  return variants[Math.floor(Math.random() * variants.length)] || current;
}

function isInBounds(r, c) {
  return r >= 0 && r < model.grid.length && c >= 0 && c < model.grid[0].length;
}

function isDestructible(code) {
  return code && code !== 'U';
}

function baseColor(code) {
  if (!code) return '';
  if (code.startsWith('2')) return code[1];
  return code;
}

function findConnectedOrdinary(startR, startC, targetColor) {
  const q = [[startR, startC]];
  const seen = new Set([`${startR},${startC}`]);
  const group = [];

  while (q.length) {
    const [r, c] = q.shift();
    const code = model.grid[r][c];
    if (!isDestructible(code) || code.startsWith('2') || baseColor(code) !== targetColor) {
      continue;
    }

    group.push([r, c]);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      const k = `${nr},${nc}`;
      if (isInBounds(nr, nc) && !seen.has(k)) {
        seen.add(k);
        q.push([nr, nc]);
      }
    }
  }

  return group;
}

function repaint2ColorsTouchedByGroup(group, targetColor) {
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const toRepaint = new Set();

  for (const [r, c] of group) {
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (!isInBounds(nr, nc)) continue;
      const code = model.grid[nr][nc];
      if (code && code.startsWith('2') && baseColor(code) === targetColor) {
        toRepaint.add(`${nr},${nc}`);
      }
    }
  }

  const available = getBreakableColors(model.grid);
  for (const key of toRepaint) {
    const [r, c] = key.split(',').map(Number);
    const newColor = randomDifferentColor(targetColor, available.length ? available : ['R','G','B']);
    model.grid[r][c] = newColor; // становится обычным блоком
  }
}

function applyGravity() {
  const rows = model.grid.length;
  const cols = model.grid[0].length;

  for (let c = 0; c < cols; c += 1) {
    const stack = [];
    for (let r = rows - 1; r >= 0; r -= 1) {
      if (model.grid[r][c]) stack.push(model.grid[r][c]);
    }
    for (let r = rows - 1; r >= 0; r -= 1) {
      model.grid[r][c] = stack[rows - 1 - r] || null;
    }
  }
}

function checkWin() {
  return model.grid.every((row) => row.every((cell) => !cell || cell === 'U'));
}

function spendShot() {
  if (Number.isFinite(model.shotsLeft)) {
    model.shotsLeft -= 1;
    if (model.shotsLeft <= 0) {
      model.gameOver = true;
      ui.stateLabel.textContent = 'Статус: поражение (кончились выстрелы)';
    }
  }
}

function onCellClicked(r, c) {
  if (model.gameOver) return;
  const code = model.grid[r][c];
  if (!isDestructible(code)) return;

  spendShot();
  if (model.gameOver) return;

  if (baseColor(code) !== model.selectedShotColor) {
    refreshUI();
    boardScene.renderGrid();
    return;
  }

  const group = findConnectedOrdinary(r, c, model.selectedShotColor);
  if (group.length > 0) {
    repaint2ColorsTouchedByGroup(group, model.selectedShotColor);
    for (const [gr, gc] of group) model.grid[gr][gc] = null;
    model.score += group.length * 10;
    applyGravity();
  } else if (code.startsWith('2')) {
    model.grid[r][c] = randomDifferentColor(model.selectedShotColor, getBreakableColors(model.grid));
  }

  if (checkWin()) {
    model.gameOver = true;
    ui.stateLabel.textContent = 'Статус: победа';
  }

  refreshUI();
  boardScene.renderGrid();
}

function buildShotPalette() {
  ui.shotPalette.innerHTML = '';
  const colors = getBreakableColors(model.grid);
  colors.forEach((colorCode) => {
    const btn = document.createElement('button');
    btn.className = 'color-btn';
    btn.textContent = colorCode;
    btn.style.background = `#${COLOR_MAP[colorCode].toString(16).padStart(6, '0')}`;
    btn.style.color = '#0f172a';
    btn.onclick = () => {
      model.selectedShotColor = colorCode;
      [...ui.shotPalette.children].forEach((el) => (el.style.outline = 'none'));
      btn.style.outline = '3px solid #fff';
    };
    if (colorCode === model.selectedShotColor) btn.style.outline = '3px solid #fff';
    ui.shotPalette.appendChild(btn);
  });
  if (!colors.includes(model.selectedShotColor) && colors.length) {
    model.selectedShotColor = colors[0];
    buildShotPalette();
  }
}

function refreshUI() {
  ui.scoreLabel.textContent = `Очки: ${model.score}`;
  ui.shotsLabel.textContent = `Выстрелы: ${Number.isFinite(model.shotsLeft) ? model.shotsLeft : '∞'}`;
  ui.timerLabel.textContent = `Таймер: ${Number.isFinite(model.timerLeft) ? Math.max(0, Math.ceil(model.timerLeft)) : '∞'}`;
  if (!model.gameOver) ui.stateLabel.textContent = `Статус: игра идёт (цвет выстрела: ${model.selectedShotColor})`;
}

class BoardScene extends Phaser.Scene {
  constructor() {
    super('board');
    this.cellSize = 52;
    this.padding = 10;
    this.graphics = null;
  }

  create() {
    this.graphics = this.add.graphics();
    this.renderGrid();
  }

  renderGrid() {
    this.graphics.clear();
    this.children.removeAll(false);

    const rows = model.grid.length;
    const cols = model.grid[0].length;

    this.cameras.main.setBackgroundColor('#020617');

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const code = model.grid[r][c];
        if (!code) continue;

        const x = this.padding + c * this.cellSize;
        const y = this.padding + r * this.cellSize;
        const color = COLOR_MAP[baseColor(code)] || 0xffffff;

        this.graphics.fillStyle(color, 1);
        this.graphics.fillRoundedRect(x, y, this.cellSize - 4, this.cellSize - 4, 8);
        this.graphics.lineStyle(1, 0x0f172a, 1);
        this.graphics.strokeRoundedRect(x, y, this.cellSize - 4, this.cellSize - 4, 8);

        this.add.text(x + 8, y + 14, code, { fontSize: '18px', color: '#0f172a', fontStyle: 'bold' });

        const hit = this.add.zone(x, y, this.cellSize - 4, this.cellSize - 4).setOrigin(0);
        hit.setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => onCellClicked(r, c));
      }
    }
  }

  update(_time, delta) {
    if (model.gameOver) return;
    if (Number.isFinite(model.timerLeft)) {
      model.timerLeft -= delta / 1000;
      if (model.timerLeft <= 0) {
        model.timerLeft = 0;
        model.gameOver = true;
        ui.stateLabel.textContent = 'Статус: поражение (время вышло)';
      }
      refreshUI();
    }
  }
}

function initPhaser(rows, cols) {
  if (phaserGame) phaserGame.destroy(true);
  boardScene = new BoardScene();

  phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: cols * 52 + 20,
    height: rows * 52 + 20,
    scene: [boardScene],
  });
}

function startLevelByIndex(index) {
  const lvl = BUILTIN_LEVELS[index];
  model.level = lvl;
  model.grid = cloneGrid(lvl.grid);
  model.score = 0;
  model.gameOver = false;
  model.shotsLeft = Number.isFinite(lvl.maxShots) ? lvl.maxShots : Infinity;
  model.timerLeft = Number.isFinite(lvl.timerSeconds) ? lvl.timerSeconds : Infinity;
  model.selectedShotColor = getBreakableColors(model.grid)[0] || 'R';

  initPhaser(model.grid.length, model.grid[0].length);
  buildShotPalette();
  refreshUI();
}

populateLevelSelect();
ui.startBtn.onclick = () => startLevelByIndex(Number(ui.levelSelect.value));
startLevelByIndex(0);
