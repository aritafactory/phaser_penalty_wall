const COLOR_MAP = {
  R: 0xe74c3c,
  G: 0x27ae60,
  B: 0x3498db,
  Y: 0xf1c40f,
  U: 0x7f8c8d,
};

const BASE_GRID = [
  ['G', 'R', 'B', 'R', 'Y', 'R', 'B', 'G'],
  ['B', 'B', 'B', 'B', 'B', 'B', 'Y', 'G'],
  ['G', 'G', 'R', 'Y', 'Y', 'Y', 'R', 'R'],
  ['G', 'G', 'R', 'G', 'Y', 'Y', 'Y', 'R'],
  ['Y', 'Y', 'R', 'G', 'R', 'G', 'B', 'B'],
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

const model = {
  grid: [],
  score: 0,
  selectedShotColor: 'R',
  shotsLeft: Infinity,
  timerLeft: Infinity,
  gameOver: false,
  levels: [],
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
  const oneComplication = COMPLICATIONS.map((c) => [c]).slice(0, 7);
  const twoComplications = combinations(COMPLICATIONS, 2).slice(0, 7);
  const threeComplications = combinations(COMPLICATIONS, 3).slice(0, 7);
  const packs = [...oneComplication, ...twoComplications, ...threeComplications];

  return packs.map((complications, idx) => ({
    level: idx + 1,
    description: `Встроенный уровень ${idx + 1}`,
    complications,
    maxShots: complications.includes('limited_shots') ? Math.max(10, 22 - idx) : undefined,
    timerSeconds: complications.includes('timer') ? Math.max(50, 100 - idx) : undefined,
    grid: cloneGrid(BASE_GRID),
  }));
}

function populateLevelSelect() {
  ui.levelSelect.innerHTML = '';
  model.levels.forEach((lvl, idx) => {
    const option = document.createElement('option');
    option.value = String(idx);
    option.textContent = `${lvl.level}. ${lvl.description}`;
    ui.levelSelect.appendChild(option);
  });
}

function getBreakableColors(grid) {
  const set = new Set();
  for (const row of grid) {
    for (const cell of row) {
      if (cell && cell !== 'U') set.add(cell);
    }
  }
  return [...set];
}

function isInsideGrid(r, c) {
  return r >= 0 && r < model.grid.length && c >= 0 && c < model.grid[0].length;
}

function findConnected(startR, startC, targetColor) {
  const queue = [[startR, startC]];
  const seen = new Set([`${startR},${startC}`]);
  const group = [];

  while (queue.length) {
    const [r, c] = queue.shift();
    const cell = model.grid[r][c];
    if (!cell || cell !== targetColor) continue;

    group.push([r, c]);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (isInsideGrid(nr, nc) && !seen.has(key)) {
        seen.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  return group;
}

function buildGravityMoves(oldGrid, newGrid) {
  const cols = oldGrid[0].length;
  const rows = oldGrid.length;
  const moves = [];

  for (let c = 0; c < cols; c += 1) {
    const oldRows = [];
    const newRows = [];

    for (let r = 0; r < rows; r += 1) {
      if (oldGrid[r][c]) oldRows.push(r);
      if (newGrid[r][c]) newRows.push(r);
    }

    const count = Math.min(oldRows.length, newRows.length);
    for (let i = 0; i < count; i += 1) {
      const fromR = oldRows[oldRows.length - 1 - i];
      const toR = newRows[newRows.length - 1 - i];
      if (fromR !== toR) {
        moves.push({ from: [fromR, c], to: [toR, c], code: oldGrid[fromR][c] });
      }
    }
  }

  return moves;
}

function applyGravityAndGetMoves() {
  const oldGrid = cloneGrid(model.grid);
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

  return buildGravityMoves(oldGrid, model.grid);
}

function isWin() {
  return model.grid.every((row) => row.every((cell) => !cell || cell === 'U'));
}

function refreshUI() {
  ui.scoreLabel.textContent = `Очки: ${model.score}`;
  ui.shotsLabel.textContent = `Выстрелы: ${Number.isFinite(model.shotsLeft) ? model.shotsLeft : '∞'}`;
  ui.timerLabel.textContent = `Таймер: ${Number.isFinite(model.timerLeft) ? Math.max(0, Math.ceil(model.timerLeft)) : '∞'}`;
  if (!model.gameOver) {
    ui.stateLabel.textContent = `Статус: игра идёт (цвет: ${model.selectedShotColor})`;
  }
}

function buildShotPalette() {
  ui.shotPalette.innerHTML = '';
  const colors = getBreakableColors(model.grid);

  colors.forEach((code) => {
    const btn = document.createElement('button');
    btn.className = 'color-btn';
    btn.textContent = code;
    btn.style.background = `#${COLOR_MAP[code].toString(16).padStart(6, '0')}`;
    btn.style.color = '#111827';
    btn.onclick = () => {
      model.selectedShotColor = code;
      [...ui.shotPalette.children].forEach((el) => (el.style.outline = 'none'));
      btn.style.outline = '3px solid #fff';
      refreshUI();
    };
    if (code === model.selectedShotColor) btn.style.outline = '3px solid #fff';
    ui.shotPalette.appendChild(btn);
  });

  if (!colors.includes(model.selectedShotColor) && colors.length) {
    model.selectedShotColor = colors[0];
    buildShotPalette();
  }
}

class BoardScene extends Phaser.Scene {
  constructor() {
    super('board');
    this.cell = 78;
    this.gridX = 12;
    this.gridY = 12;
    this.playAreaHeight = 620;
    this.blocks = new Map();
    this.animating = false;
    this.shooterX = 0;
    this.shooterY = 0;
    this.shooter = null;
  }

  key(r, c) {
    return `${r},${c}`;
  }

  gridToPixel(r, c) {
    return {
      x: this.gridX + c * this.cell + this.cell / 2,
      y: this.gridY + r * this.cell + this.cell / 2,
    };
  }

  create() {
    this.cameras.main.setBackgroundColor('#1f1f1f');
    this.drawBoardFrame();

    this.shooterX = this.scale.width / 2;
    this.shooterY = this.playAreaHeight - 36;
    this.shooter = this.add.circle(this.shooterX, this.shooterY, 18, COLOR_MAP[model.selectedShotColor]).setStrokeStyle(3, 0xffffff);

    this.renderGridStatic();

    this.input.on('pointerdown', (pointer) => this.handlePointer(pointer));
  }

  drawBoardFrame() {
    const g = this.add.graphics();
    const rows = model.grid.length;
    const cols = model.grid[0].length;
    const w = cols * this.cell;
    const h = rows * this.cell;

    g.fillStyle(0x242424, 1);
    g.fillRect(this.gridX, this.gridY, w, h);

    g.lineStyle(2, 0x000000, 1);
    for (let c = 0; c <= cols; c += 1) {
      const x = this.gridX + c * this.cell;
      g.lineBetween(x, this.gridY, x, this.gridY + h);
    }
    for (let r = 0; r <= rows; r += 1) {
      const y = this.gridY + r * this.cell;
      g.lineBetween(this.gridX, y, this.gridX + w, y);
    }
  }

  renderGridStatic() {
    for (const b of this.blocks.values()) b.destroy();
    this.blocks.clear();

    for (let r = 0; r < model.grid.length; r += 1) {
      for (let c = 0; c < model.grid[0].length; c += 1) {
        const code = model.grid[r][c];
        if (!code) continue;
        const block = this.createBlock(r, c, code);
        this.blocks.set(this.key(r, c), block);
      }
    }

    this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
  }

  createBlock(r, c, code) {
    const { x, y } = this.gridToPixel(r, c);
    return this.add.rectangle(x, y, this.cell - 2, this.cell - 2, COLOR_MAP[code] || 0xffffff).setOrigin(0.5);
  }

  handlePointer(pointer) {
    if (this.animating || model.gameOver) return;

    const cols = model.grid[0].length;
    const rows = model.grid.length;
    const col = Math.floor((pointer.x - this.gridX) / this.cell);
    const row = Math.floor((pointer.y - this.gridY) / this.cell);

    if (col < 0 || row < 0 || col >= cols || row >= rows) return;

    this.shootToCell(row, col);
  }

  shootToCell(row, col) {
    const targetCode = model.grid[row][col];
    if (!targetCode || targetCode === 'U') return;

    if (Number.isFinite(model.shotsLeft)) {
      model.shotsLeft -= 1;
      if (model.shotsLeft < 0) model.shotsLeft = 0;
    }

    const projectile = this.add.circle(this.shooterX, this.shooterY, 14, COLOR_MAP[model.selectedShotColor]).setStrokeStyle(2, 0xffffff);
    const target = this.gridToPixel(row, col);

    this.animating = true;
    this.tweens.add({
      targets: projectile,
      x: target.x,
      y: target.y,
      duration: 260,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        projectile.destroy();
        this.playImpact(target.x, target.y, () => this.resolveHit(row, col));
      },
    });

    refreshUI();
  }

  playImpact(x, y, done) {
    const flash = this.add.circle(x, y, 10, 0xffffff, 0.9);
    this.tweens.add({
      targets: flash,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 180,
      onComplete: () => {
        flash.destroy();
        done();
      },
    });
  }

  resolveHit(row, col) {
    const targetCode = model.grid[row][col];
    if (targetCode !== model.selectedShotColor) {
      this.animating = false;
      if (Number.isFinite(model.shotsLeft) && model.shotsLeft <= 0) {
        model.gameOver = true;
        ui.stateLabel.textContent = 'Статус: поражение (кончились выстрелы)';
      }
      return;
    }

    const group = findConnected(row, col, model.selectedShotColor);
    if (group.length === 0) {
      this.animating = false;
      return;
    }

    const removedKeys = group.map(([r, c]) => this.key(r, c));
    group.forEach(([r, c]) => {
      model.grid[r][c] = null;
    });
    model.score += group.length * 10;

    const gravityMoves = applyGravityAndGetMoves();
    this.animateRemovalAndFall(removedKeys, gravityMoves, () => {
      if (isWin()) {
        model.gameOver = true;
        ui.stateLabel.textContent = 'Статус: победа';
      } else if (Number.isFinite(model.shotsLeft) && model.shotsLeft <= 0) {
        model.gameOver = true;
        ui.stateLabel.textContent = 'Статус: поражение (кончились выстрелы)';
      }

      buildShotPalette();
      refreshUI();
      this.animating = false;
    });
  }

  animateRemovalAndFall(removedKeys, moves, done) {
    const removals = [];
    removedKeys.forEach((k) => {
      const block = this.blocks.get(k);
      if (block) {
        this.blocks.delete(k);
        removals.push(block);
      }
    });

    removals.forEach((b) => {
      this.tweens.add({
        targets: b,
        alpha: 0,
        scaleX: 0.6,
        scaleY: 0.6,
        duration: 140,
        onComplete: () => b.destroy(),
      });
    });

    const pending = moves.length;
    if (pending === 0) {
      setTimeout(() => {
        this.renderGridStatic();
        done();
      }, 160);
      return;
    }

    let finished = 0;
    moves.forEach((move) => {
      const fromKey = this.key(move.from[0], move.from[1]);
      const toKey = this.key(move.to[0], move.to[1]);
      const block = this.blocks.get(fromKey);
      if (!block) {
        finished += 1;
        if (finished === pending) {
          this.renderGridStatic();
          done();
        }
        return;
      }

      this.blocks.delete(fromKey);
      this.blocks.set(toKey, block);
      const target = this.gridToPixel(move.to[0], move.to[1]);

      this.tweens.add({
        targets: block,
        y: target.y,
        duration: 220,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          finished += 1;
          if (finished === pending) {
            this.renderGridStatic();
            done();
          }
        },
      });
    });
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
    width: cols * 78 + 24,
    height: 620,
    scene: [boardScene],
  });
}

function startLevelByIndex(index) {
  const level = model.levels[index];
  model.grid = cloneGrid(level.grid);
  model.score = 0;
  model.gameOver = false;
  model.shotsLeft = Number.isFinite(level.maxShots) ? level.maxShots : Infinity;
  model.timerLeft = Number.isFinite(level.timerSeconds) ? level.timerSeconds : Infinity;
  model.selectedShotColor = getBreakableColors(model.grid)[0] || 'R';

  initPhaser(model.grid.length, model.grid[0].length);
  buildShotPalette();
  refreshUI();
}

model.levels = buildBuiltinLevels();
populateLevelSelect();
ui.startBtn.onclick = () => startLevelByIndex(Number(ui.levelSelect.value));
startLevelByIndex(0);
