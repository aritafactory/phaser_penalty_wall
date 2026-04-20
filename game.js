const COLOR_MAP = {
  R: 0xe74c3c,
  G: 0x27ae60,
  B: 0x3498db,
  Y: 0xf1c40f,
  P: 0x9b59b6,
  O: 0xe67e22,
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
  totalScore: 0,
  selectedShotColor: 'R',
  shotsLeft: Infinity,
  timerLeft: Infinity,
  gameOver: false,
  levels: [],
  currentLevel: null,
  currentLayerIndex: 0,
  boosters: {},
  activeBooster: null,
};

const ui = {
  levelSelect: document.getElementById('levelSelect'),
  startBtn: document.getElementById('startBtn'),
  shopBtn: document.getElementById('shopBtn'),
  scoreLabel: document.getElementById('scoreLabel'),
  totalScoreLabel: document.getElementById('totalScoreLabel'),
  shotsLabel: document.getElementById('shotsLabel'),
  timerLabel: document.getElementById('timerLabel'),
  stateLabel: document.getElementById('stateLabel'),
  shopModal: document.getElementById('shopModal'),
  closeShopBtn: document.getElementById('closeShopBtn'),
  shopBalanceLabel: document.getElementById('shopBalanceLabel'),
  shopTableBody: document.getElementById('shopTableBody'),
  boosterInventoryList: document.getElementById('boosterInventoryList'),
};

const STORAGE_KEYS = {
  totalScore: 'cbb_total_score',
  boosters: 'cbb_boosters',
};

const BOOSTER_CATALOG = [
  { key: 'bomb', name: 'Bomb', price: 100, effect: 'Удаляет область 3×3 вокруг цели, включая special-блоки и U.' },
  { key: 'mix', name: 'Mix', price: 50, effect: 'Перемешивает текущие цвета разрушаемых немигающих блоков.' },
  { key: 'fractions', name: 'Fractions', price: 75, effect: 'Удаляет целевой кластер и до двух случайных кластеров того же цвета.' },
  { key: 'minusOneColor', name: '-1 color', price: 100, effect: 'Удаляет все блоки наименее представленного цвета среди разрушаемых.' },
  { key: 'plusFiveShots', name: '+5 shots', price: 50, effect: 'Добавляет пять выстрелов, если у уровня есть maxShots.' },
  { key: 'rainbow', name: 'Rainbow', price: 75, effect: 'Следующий выстрел игнорирует проверку совпадения цвета шара и цели.' },
];

let phaserGame;
let boardScene;

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

function isTwoColor(cell) {
  return typeof cell === 'string' && cell.startsWith('2') && cell.length >= 2;
}

function isFlashing(cell) {
  return typeof cell === 'string' && cell.startsWith('F:');
}

function parseFlashing(cell) {
  // формат: F:C1:C2:S, где S = 0|1
  const [_f, c1, c2, s] = String(cell).split(':');
  return { c1, c2, state: Number(s || 0) };
}

function makeFlashing(c1, c2, state = 0) {
  return `F:${c1}:${c2}:${state}`;
}

function visibleColor(cell) {
  if (!cell) return null;
  if (cell === 'U') return 'U';
  if (isTwoColor(cell)) return cell[1];
  if (isFlashing(cell)) {
    const { c1, c2, state } = parseFlashing(cell);
    return state === 0 ? c1 : c2;
  }
  return cell;
}

function isRemovableCell(cell) {
  return Boolean(cell) && cell !== 'U' && !isTwoColor(cell);
}

function randomColorDifferentFrom(prev, pool) {
  const candidates = pool.filter((c) => c !== prev);
  if (!candidates.length) return prev;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function randomFrom(pool) {
  if (!pool.length) return 'R';
  return pool[Math.floor(Math.random() * pool.length)];
}

function loadPersistentState() {
  const savedTotal = Number(localStorage.getItem(STORAGE_KEYS.totalScore) || '0');
  model.totalScore = Number.isFinite(savedTotal) ? savedTotal : 0;

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.boosters) || '{}');
    model.boosters = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    model.boosters = {};
  }
}

function savePersistentState() {
  localStorage.setItem(STORAGE_KEYS.totalScore, String(model.totalScore));
  localStorage.setItem(STORAGE_KEYS.boosters, JSON.stringify(model.boosters));
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

function withAdditionalColors(grid) {
  const extra = ['P', 'O'];
  return grid.map((row, r) =>
    row.map((cell, c) => {
      if (cell === 'U') return cell;
      if ((r + c) % 4 === 0) return extra[(r + c) % extra.length];
      return cell;
    })
  );
}

function withUnbreakableBlocks(grid) {
  const next = cloneGrid(grid);
  const points = [[1, 1], [1, 6], [3, 3]];
  points.forEach(([r, c]) => {
    if (next[r] && next[r][c]) next[r][c] = 'U';
  });
  return next;
}

function withTwoColorBlocks(grid) {
  const next = cloneGrid(grid);
  const points = [[0, 2], [2, 4], [4, 6]];
  points.forEach(([r, c]) => {
    if (next[r] && next[r][c] && next[r][c] !== 'U') next[r][c] = `2${next[r][c]}`;
  });
  return next;
}

function withFlashingBlocks(grid) {
  const next = cloneGrid(grid);
  const points = [[0, 0], [2, 2], [4, 4]];
  const levelPalette = [...new Set(next.flat().filter((c) => c && c !== 'U').map((c) => visibleColor(c)))];
  const fallback = ['R', 'G', 'B', 'Y'];
  const palette = levelPalette.length ? levelPalette : fallback;

  points.forEach(([r, c], idx) => {
    const c1 = palette[idx % palette.length];
    const c2 = palette[(idx + 1) % palette.length];
    if (next[r] && next[r][c] && next[r][c] !== 'U') next[r][c] = makeFlashing(c1, c2, 0);
  });
  return next;
}

function applyComplicationsToGrid(baseGrid, complications) {
  let grid = cloneGrid(baseGrid);
  if (complications.includes('additional_colors')) grid = withAdditionalColors(grid);
  if (complications.includes('unbreakable_blocks')) grid = withUnbreakableBlocks(grid);
  if (complications.includes('two_colors_blocks')) grid = withTwoColorBlocks(grid);
  if (complications.includes('flashing_blocks')) grid = withFlashingBlocks(grid);
  return grid;
}

function buildBuiltinLevels() {
  const oneComplication = COMPLICATIONS.map((c) => [c]); // 7 уровней
  const twoComplications = combinations(COMPLICATIONS, 2).slice(0, 8); // уровни 8..15
  const threeComplications = combinations(COMPLICATIONS, 3).slice(0, 8); // уровни 16..23
  const packs = [...oneComplication, ...twoComplications, ...threeComplications];

  return packs.map((complications, idx) => {
    const primaryGrid = applyComplicationsToGrid(BASE_GRID, complications);
    const level = {
      level: idx + 1,
      description: `Встроенный уровень ${idx + 1}`,
      complications,
      maxShots: complications.includes('limited_shots') ? Math.max(10, 22 - idx) : undefined,
      timerSeconds: complications.includes('timer') ? Math.max(50, 100 - idx) : undefined,
      grid: primaryGrid,
    };

    if (complications.includes('several_layers')) {
      level.layers = [
        primaryGrid,
        applyComplicationsToGrid(
          [
            ['R', 'B', 'Y', 'G', 'R', 'B', 'Y', 'G'],
            ['G', 'Y', 'R', 'B', 'G', 'Y', 'R', 'B'],
            ['B', 'R', 'G', 'Y', 'B', 'R', 'G', 'Y'],
            ['Y', 'G', 'B', 'R', 'Y', 'G', 'B', 'R'],
            ['R', 'Y', 'G', 'B', 'R', 'Y', 'G', 'B'],
          ],
          complications.filter((c) => c !== 'several_layers')
        ),
      ];
      level.grid = level.layers[0];
    }

    return level;
  });
}

function populateLevelSelect() {
  ui.levelSelect.innerHTML = '';
  model.levels.forEach((lvl, idx) => {
    const option = document.createElement('option');
    option.value = String(idx);
    option.textContent = `${lvl.level}. ${lvl.description} [${lvl.complications.join(', ')}]`;
    ui.levelSelect.appendChild(option);
  });
}

function getBreakableColors(grid) {
  const set = new Set();
  for (const row of grid) {
    for (const cell of row) {
      const color = visibleColor(cell);
      if (color && color !== 'U') set.add(color);
    }
  }
  return [...set];
}

function isInsideGrid(r, c) {
  return r >= 0 && r < model.grid.length && c >= 0 && c < model.grid[0].length;
}

function findShotRegion(startR, startC, targetColor) {
  const queue = [[startR, startC]];
  const seen = new Set([`${startR},${startC}`]);
  const ordinary = new Set();
  const twos = new Set();

  while (queue.length) {
    const [r, c] = queue.shift();
    const cell = model.grid[r][c];
    if (!cell || cell === 'U' || visibleColor(cell) !== targetColor) continue;

    if (isTwoColor(cell)) twos.add(`${r},${c}`);
    else if (isRemovableCell(cell)) ordinary.add(`${r},${c}`);

    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    dirs.forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (isInsideGrid(nr, nc) && !seen.has(key)) {
        seen.add(key);
        queue.push([nr, nc]);
      }
    });
  }

  return {
    ordinary: [...ordinary].map((k) => k.split(',').map(Number)),
    twos: [...twos].map((k) => k.split(',').map(Number)),
  };
}

function repaintTwoColorCells(twoCells, shotColor) {
  const palette = getBreakableColors(model.grid);
  twoCells.forEach(([r, c]) => {
    const oldColor = visibleColor(model.grid[r][c]);
    const newColor = randomColorDifferentFrom(oldColor, palette);
    model.grid[r][c] = newColor;
  });
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
  ui.scoreLabel.textContent = `Очки (уровень): ${model.score}`;
  ui.totalScoreLabel.textContent = `Очки (всего): ${model.totalScore}`;
  ui.shotsLabel.textContent = `Выстрелы: ${Number.isFinite(model.shotsLeft) ? model.shotsLeft : '∞'}`;
  ui.timerLabel.textContent = `Таймер: ${Number.isFinite(model.timerLeft) ? Math.max(0, Math.ceil(model.timerLeft)) : '∞'}`;
  if (!model.gameOver) {
    ui.stateLabel.textContent = `Статус: игра идёт (цвет: ${model.selectedShotColor})`;
  }
  ui.shopBalanceLabel.textContent = `Баланс: ${model.totalScore}`;
}

function renderBoosterInventory() {
  ui.boosterInventoryList.innerHTML = '';
  BOOSTER_CATALOG.forEach((booster) => {
    const owned = Number(model.boosters[booster.key] || 0);
    const li = document.createElement('li');
    if (booster.key === 'bomb' || booster.key === 'mix' || booster.key === 'fractions') {
      const label = model.activeBooster === booster.key ? 'Armed' : 'Use';
      const disabled = owned <= 0 ? 'disabled' : '';
      const armedStyle = model.activeBooster === booster.key ? 'style="border:1px solid #22c55e;"' : '';
      li.innerHTML = `<span>${booster.name}</span><span><button data-use-booster="${booster.key}" ${disabled} ${armedStyle}>${label}</button> <strong>x${owned}</strong></span>`;
      const btn = li.querySelector('button');
      btn.onclick = () => {
        if (owned <= 0) return;
        model.activeBooster = model.activeBooster === booster.key ? null : booster.key;
        renderBoosterInventory();
        refreshUI();
      };
    } else {
      li.innerHTML = `<span>${booster.name}</span><strong>x${owned}</strong>`;
    }
    ui.boosterInventoryList.appendChild(li);
  });
}

function renderShopTable() {
  ui.shopTableBody.innerHTML = '';
  BOOSTER_CATALOG.forEach((booster) => {
    const tr = document.createElement('tr');
    const owned = Number(model.boosters[booster.key] || 0);
    tr.innerHTML = `
      <td>${booster.name}<br/><small>Куплено: ${owned}</small></td>
      <td>${booster.price}</td>
      <td>${booster.effect}</td>
      <td><button data-booster="${booster.key}">Buy</button></td>
    `;
    const buyBtn = tr.querySelector('button');
    buyBtn.onclick = () => buyBooster(booster.key);
    ui.shopTableBody.appendChild(tr);
  });
}

function buyBooster(boosterKey) {
  const booster = BOOSTER_CATALOG.find((b) => b.key === boosterKey);
  if (!booster) return;
  if (model.totalScore < booster.price) {
    ui.stateLabel.textContent = 'Статус: недостаточно очков для покупки';
    return;
  }
  model.totalScore -= booster.price;
  model.boosters[booster.key] = Number(model.boosters[booster.key] || 0) + 1;
  savePersistentState();
  renderBoosterInventory();
  refreshUI();
  renderShopTable();
}

function openShop() {
  renderShopTable();
  refreshUI();
  ui.shopModal.classList.add('open');
  ui.shopModal.setAttribute('aria-hidden', 'false');
}

function closeShop() {
  ui.shopModal.classList.remove('open');
  ui.shopModal.setAttribute('aria-hidden', 'true');
}

function pickNextShotColor() {
  const colors = getBreakableColors(model.grid);
  if (!colors.length) {
    model.selectedShotColor = 'R';
    return;
  }
  const candidates = colors.filter((c) => c !== model.selectedShotColor);
  if (!candidates.length) return;
  model.selectedShotColor = candidates[Math.floor(Math.random() * candidates.length)];
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
    this.flashAccumulator = 0;
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
    const rect = this.add.rectangle(x, y, this.cell - 2, this.cell - 2, COLOR_MAP[visibleColor(code)] || 0xffffff).setOrigin(0.5);
    if (isTwoColor(code)) rect.setStrokeStyle(3, 0xffffff);
    if (isFlashing(code)) rect.setStrokeStyle(3, 0x111111);
    return rect;
  }

  handlePointer(pointer) {
    if (this.animating || model.gameOver) return;

    const cols = model.grid[0].length;
    const rows = model.grid.length;
    const col = Math.floor((pointer.x - this.gridX) / this.cell);
    const row = Math.floor((pointer.y - this.gridY) / this.cell);

    if (col < 0 || row < 0 || col >= cols || row >= rows) return;

    if (model.activeBooster === 'bomb') {
      this.useBombAt(row, col);
      return;
    }
    if (model.activeBooster === 'mix') {
      this.useMix();
      return;
    }
    if (model.activeBooster === 'fractions') {
      this.useFractions(row, col);
      return;
    }

    this.shootToCell(row, col);
  }

  completeAction(removedKeys, gravityMoves) {
    this.animateRemovalAndFall(removedKeys, gravityMoves, () => {
      if (isWin()) {
        if (model.currentLevel?.layers && model.currentLayerIndex < model.currentLevel.layers.length - 1) {
          model.currentLayerIndex += 1;
          model.grid = cloneGrid(model.currentLevel.layers[model.currentLayerIndex]);
          this.renderGridStatic();
          ui.stateLabel.textContent = `Статус: слой ${model.currentLayerIndex + 1}/${model.currentLevel.layers.length}`;
        } else {
          model.gameOver = true;
          ui.stateLabel.textContent = 'Статус: победа';
        }
      } else if (Number.isFinite(model.shotsLeft) && model.shotsLeft <= 0) {
        model.gameOver = true;
        ui.stateLabel.textContent = 'Статус: поражение (кончились выстрелы)';
      }

      pickNextShotColor();
      this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
      refreshUI();
      this.animating = false;
    });
  }

  useBombAt(row, col) {
    const bombs = Number(model.boosters.bomb || 0);
    if (bombs <= 0) return;

    this.animating = true;
    model.boosters.bomb = bombs - 1;
    model.activeBooster = null;
    savePersistentState();
    renderBoosterInventory();

    const removed = [];
    for (let r = row - 1; r <= row + 1; r += 1) {
      for (let c = col - 1; c <= col + 1; c += 1) {
        if (!isInsideGrid(r, c)) continue;
        if (!model.grid[r][c]) continue;
        removed.push([r, c]);
      }
    }

    if (removed.length === 0) {
      this.animating = false;
      refreshUI();
      return;
    }

    const removedKeys = removed.map(([r, c]) => this.key(r, c));
    removed.forEach(([r, c]) => {
      model.grid[r][c] = null;
    });

    const earned = removed.length * 10;
    model.score += earned;
    model.totalScore += earned;
    savePersistentState();

    const gravityMoves = applyGravityAndGetMoves();
    this.completeAction(removedKeys, gravityMoves);
  }

  useMix() {
    const mixCount = Number(model.boosters.mix || 0);
    if (mixCount <= 0) return;

    this.animating = true;
    model.boosters.mix = mixCount - 1;
    model.activeBooster = null;
    renderBoosterInventory();

    const palette = getBreakableColors(model.grid).filter((c) => c !== 'U');
    const fallbackPalette = ['R', 'G', 'B', 'Y', 'P', 'O'];
    const source = palette.length ? palette : fallbackPalette;

    for (let r = 0; r < model.grid.length; r += 1) {
      for (let c = 0; c < model.grid[0].length; c += 1) {
        const cell = model.grid[r][c];
        if (!cell || cell === 'U') continue;

        if (isTwoColor(cell)) {
          model.grid[r][c] = `2${randomFrom(source)}`;
        } else if (isFlashing(cell)) {
          const { state } = parseFlashing(cell);
          const c1 = randomFrom(source);
          const c2 = randomColorDifferentFrom(c1, source);
          model.grid[r][c] = makeFlashing(c1, c2, state);
        } else {
          model.grid[r][c] = randomFrom(source);
        }
      }
    }

    savePersistentState();
    this.renderGridStatic();
    pickNextShotColor();
    this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
    refreshUI();
    this.animating = false;
  }

  useFractions(row, col) {
    const fractionsCount = Number(model.boosters.fractions || 0);
    if (fractionsCount <= 0) return;
    const targetCell = model.grid[row][col];
    if (!targetCell || targetCell === 'U') return;

    const targetColor = visibleColor(targetCell);
    if (targetColor !== model.selectedShotColor) {
      ui.stateLabel.textContent = `Статус: Fractions ждёт цвет ${model.selectedShotColor}`;
      refreshUI();
      return;
    }

    this.animating = true;
    model.boosters.fractions = fractionsCount - 1;
    model.activeBooster = null;
    renderBoosterInventory();

    const mainRegion = findShotRegion(row, col, targetColor);
    const selectedRegions = [mainRegion];
    const allSameColorRegions = this.collectColorRegions(targetColor);

    const sameRegionKey = JSON.stringify(
      [...mainRegion.ordinary, ...mainRegion.twos]
        .map(([r, c]) => `${r},${c}`)
        .sort()
    );
    const others = allSameColorRegions.filter((region) => {
      const key = JSON.stringify(
        [...region.ordinary, ...region.twos]
          .map(([r, c]) => `${r},${c}`)
          .sort()
      );
      return key !== sameRegionKey;
    });

    // До двух случайных дополнительных кластеров.
    for (let i = 0; i < 2 && others.length > 0; i += 1) {
      const idx = Math.floor(Math.random() * others.length);
      selectedRegions.push(others[idx]);
      others.splice(idx, 1);
    }

    const allOrdinary = [];
    const allTwos = [];
    selectedRegions.forEach((region) => {
      allOrdinary.push(...region.ordinary);
      allTwos.push(...region.twos);
    });

    repaintTwoColorCells(allTwos, targetColor);

    const uniqueOrdinary = [...new Set(allOrdinary.map(([r, c]) => `${r},${c}`))].map((k) =>
      k.split(',').map(Number)
    );
    const removedKeys = uniqueOrdinary.map(([r, c]) => this.key(r, c));
    uniqueOrdinary.forEach(([r, c]) => {
      model.grid[r][c] = null;
    });

    const earned = uniqueOrdinary.length * 10;
    model.score += earned;
    model.totalScore += earned;
    savePersistentState();

    if (uniqueOrdinary.length === 0) {
      this.renderGridStatic();
      pickNextShotColor();
      this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
      refreshUI();
      this.animating = false;
      return;
    }

    const gravityMoves = applyGravityAndGetMoves();
    this.completeAction(removedKeys, gravityMoves);
  }

  collectColorRegions(color) {
    const regions = [];
    const visited = new Set();

    for (let r = 0; r < model.grid.length; r += 1) {
      for (let c = 0; c < model.grid[0].length; c += 1) {
        const cell = model.grid[r][c];
        if (!cell || cell === 'U' || visibleColor(cell) !== color) continue;
        const key = `${r},${c}`;
        if (visited.has(key)) continue;

        const region = findShotRegion(r, c, color);
        const all = [...region.ordinary, ...region.twos];
        all.forEach(([rr, cc]) => visited.add(`${rr},${cc}`));
        regions.push(region);
      }
    }

    return regions;
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
    if (visibleColor(targetCode) !== model.selectedShotColor) {
      pickNextShotColor();
      this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
      refreshUI();
      this.animating = false;
      if (Number.isFinite(model.shotsLeft) && model.shotsLeft <= 0) {
        model.gameOver = true;
        ui.stateLabel.textContent = 'Статус: поражение (кончились выстрелы)';
      }
      return;
    }

    const shotRegion = findShotRegion(row, col, model.selectedShotColor);
    const ordinaryGroup = shotRegion.ordinary;
    const twoColorGroup = shotRegion.twos;

    // Простое правило:
    // 1) Попали в кластер совпадающего цвета -> удаляем обычные блоки кластера.
    // 2) 2Color внутри этого же кластера не удаляем, а перекрашиваем.
    // 3) Если в кластере только 2Color (без обычных), просто перекрашиваем их.
    if (ordinaryGroup.length === 0 && twoColorGroup.length === 0) {
      pickNextShotColor();
      this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
      refreshUI();
      this.animating = false;
      return;
    }

    repaintTwoColorCells(twoColorGroup, model.selectedShotColor);

    const removedKeys = ordinaryGroup.map(([r, c]) => this.key(r, c));
    ordinaryGroup.forEach(([r, c]) => {
      model.grid[r][c] = null;
    });
    const earned = ordinaryGroup.length * 10;
    model.score += earned;
    model.totalScore += earned;
    savePersistentState();

    if (ordinaryGroup.length === 0) {
      // Кластер состоял только из 2Color: поле не падает, просто перерисовываем.
      this.renderGridStatic();
      pickNextShotColor();
      this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
      refreshUI();
      this.animating = false;
      return;
    }

    const gravityMoves = applyGravityAndGetMoves();
    this.completeAction(removedKeys, gravityMoves);
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

    this.flashAccumulator += delta;
    if (this.flashAccumulator >= 800) {
      this.flashAccumulator = 0;
      for (let r = 0; r < model.grid.length; r += 1) {
        for (let c = 0; c < model.grid[0].length; c += 1) {
          const cell = model.grid[r][c];
          if (isFlashing(cell)) {
            const { c1, c2, state } = parseFlashing(cell);
            model.grid[r][c] = makeFlashing(c1, c2, state === 0 ? 1 : 0);
          }
        }
      }
      this.renderGridStatic();
    }

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
  model.currentLevel = level;
  model.currentLayerIndex = 0;
  model.grid = cloneGrid(level.layers ? level.layers[0] : level.grid);
  model.score = 0;
  model.activeBooster = null;
  model.gameOver = false;
  model.shotsLeft = Number.isFinite(level.maxShots) ? level.maxShots : Infinity;
  model.timerLeft = Number.isFinite(level.timerSeconds) ? level.timerSeconds : Infinity;
  model.selectedShotColor = getBreakableColors(model.grid)[0] || 'R';
  pickNextShotColor();

  initPhaser(model.grid.length, model.grid[0].length);
  renderBoosterInventory();
  refreshUI();
}

loadPersistentState();
model.levels = buildBuiltinLevels();
populateLevelSelect();
ui.startBtn.onclick = () => startLevelByIndex(Number(ui.levelSelect.value));
ui.shopBtn.onclick = () => openShop();
ui.closeShopBtn.onclick = () => closeShop();
ui.shopModal.onclick = (event) => {
  if (event.target === ui.shopModal) closeShop();
};
startLevelByIndex(0);
