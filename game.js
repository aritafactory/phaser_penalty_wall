const COLOR_MAP = {
  R: 0xe74c3c,
  G: 0x27ae60,
  B: 0x3498db,
  Y: 0xf1c40f,
  P: 0x9b59b6,
  O: 0xe67e22,
  U: 0x999b9b,
};

const BASE_COLORS = ['R', 'G', 'B'];
const ADDITIONAL_COLORS = ['Y', 'P', 'O'];
const COMPLICATION_RATIOS = {
  additional_colors: 0.25,
  unbreakable_blocks: 0.05,
  two_colors_blocks: 0.1,
  flashing_blocks: 0.1,
};

const BASE_GRID = [
  ['G', 'R', 'B', 'R', 'G', 'R', 'B', 'G'],
  ['B', 'B', 'B', 'B', 'B', 'B', 'R', 'G'],
  ['G', 'G', 'R', 'B', 'B', 'B', 'R', 'R'],
  ['G', 'G', 'R', 'G', 'B', 'B', 'B', 'R'],
  ['R', 'R', 'R', 'G', 'R', 'G', 'B', 'B'],
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
  currentLevelIndex: 0,
  highestUnlockedLevel: 1,
  winAwarded: false,
  currentLayerIndex: 0,
  boosters: {},
  activeBooster: null,
  rainbowNextShot: false,
};
const IS_BUILDER_PAGE = document.body?.dataset?.page === 'builder';

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
  startScreen: document.getElementById('startScreen'),
  startPlayBtn: document.getElementById('startPlayBtn'),
  startShopBtn: document.getElementById('startShopBtn'),
  startPlusBtn: document.getElementById('startPlusBtn'),
  startBalanceLabel: document.getElementById('startBalanceLabel'),
  levelsScreen: document.getElementById('levelsScreen'),
  levelsBackBtn: document.getElementById('levelsBackBtn'),
  levelsShopBtn: document.getElementById('levelsShopBtn'),
  levelsPlusBtn: document.getElementById('levelsPlusBtn'),
  levelsBalanceLabel: document.getElementById('levelsBalanceLabel'),
  levelsGrid: document.getElementById('levelsGrid'),
  gameHomeBtn: document.getElementById('gameHomeBtn'),
  gamePlusBtn: document.getElementById('gamePlusBtn'),
  gameBalanceLabel: document.getElementById('gameBalanceLabel'),
  gameLevelLabel: document.getElementById('gameLevelLabel'),
  gameMovesLabel: document.getElementById('gameMovesLabel'),
  failModal: document.getElementById('failModal'),
  failHomeBtn: document.getElementById('failHomeBtn'),
  failShopBtn: document.getElementById('failShopBtn'),
  failRetryBtn: document.getElementById('failRetryBtn'),
  winModal: document.getElementById('winModal'),
  winHomeBtn: document.getElementById('winHomeBtn'),
  winShopBtn: document.getElementById('winShopBtn'),
  winNextBtn: document.getElementById('winNextBtn'),
  winLevelLabel: document.getElementById('winLevelLabel'),
  winMovesLabel: document.getElementById('winMovesLabel'),
  winRewardLabel: document.getElementById('winRewardLabel'),
  builderCols: document.getElementById('builderCols'),
  builderRows: document.getElementById('builderRows'),
  builderGenerateBtn: document.getElementById('builderGenerateBtn'),
  builderPreviewBtn: document.getElementById('builderPreviewBtn'),
  builderGrid: document.getElementById('builderGrid'),
  builderDownloadBtn: document.getElementById('builderDownloadBtn'),
  builderLoadBtn: document.getElementById('builderLoadBtn'),
  builderFileInput: document.getElementById('builderFileInput'),
  cAdditionalColors: document.getElementById('cAdditionalColors'),
  cTimer: document.getElementById('cTimer'),
  builderTimer: document.getElementById('builderTimer'),
  cLimitedShots: document.getElementById('cLimitedShots'),
  builderShots: document.getElementById('builderShots'),
  cUnbreakableBlocks: document.getElementById('cUnbreakableBlocks'),
  cTwoColorsBlocks: document.getElementById('cTwoColorsBlocks'),
  cFlashingBlocks: document.getElementById('cFlashingBlocks'),
  cSeveralLayers: document.getElementById('cSeveralLayers'),
  builderLayers: document.getElementById('builderLayers'),
};

const BASE_BUILDER_COLORS = BASE_COLORS;

const STORAGE_KEYS = {
  totalScore: 'cbb_total_score',
  boosters: 'cbb_boosters',
  highestUnlockedLevel: 'cbb_highest_unlocked_level',
};

const BOOSTER_CATALOG = [
  { key: 'bomb', name: 'Bomb', price: 120, effect: 'Blast away colored balls.' },
  { key: 'mix', name: 'Mix', price: 120, effect: 'Shuffle all balls on screen.' },
  { key: 'fractions', name: 'Fractions', price: 150, effect: 'Split a ball into 3 random balls.' },
  { key: 'minusOneColor', name: '-1 Color', price: 120, effect: 'Remove one ball color.' },
  { key: 'plusFiveShots', name: '+5 Shots', price: 150, effect: 'Add 5 extra shots.' },
  { key: 'rainbow', name: 'Rainbow', price: 200, effect: 'Turn a ball into a rainbow ball.' },
];

let phaserGame;
let boardScene;


function currentLevelMultiplier() {
  return Math.max(1, model.currentLevelIndex + 1);
}

function pointsForRemovedBlocks(count) {
  return count * 10 * currentLevelMultiplier();
}

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

function randomizeGridLayout(grid) {
  const coords = [];
  const values = [];

  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[0].length; c += 1) {
      const cell = grid[r][c];
      if (!cell || cell === 'U') continue;
      coords.push([r, c]);
      values.push(cell);
    }
  }

  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  coords.forEach(([r, c], idx) => {
    grid[r][c] = values[idx];
  });

  return grid;
}

function loadPersistentState() {
  if (IS_BUILDER_PAGE) {
    model.totalScore = 0;
    model.highestUnlockedLevel = Number.MAX_SAFE_INTEGER;
    BOOSTER_CATALOG.forEach((b) => {
      model.boosters[b.key] = Number.MAX_SAFE_INTEGER;
    });
    return;
  }
  const savedTotal = Number(localStorage.getItem(STORAGE_KEYS.totalScore) || '0');
  model.totalScore = Number.isFinite(savedTotal) ? savedTotal : 0;
  const savedUnlocked = Number(localStorage.getItem(STORAGE_KEYS.highestUnlockedLevel) || '1');
  model.highestUnlockedLevel = Number.isFinite(savedUnlocked) && savedUnlocked > 0 ? Math.floor(savedUnlocked) : 1;

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.boosters) || '{}');
    model.boosters = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    model.boosters = {};
  }
}

function savePersistentState() {
  if (IS_BUILDER_PAGE) return;
  localStorage.setItem(STORAGE_KEYS.totalScore, String(model.totalScore));
  localStorage.setItem(STORAGE_KEYS.highestUnlockedLevel, String(model.highestUnlockedLevel));
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
  const next = cloneGrid(grid);
  const points = pickRandomCoords(
    next,
    (cell) => Boolean(cell) && cell !== 'U',
    COMPLICATION_RATIOS.additional_colors
  );
  points.forEach(([r, c], idx) => {
    next[r][c] = ADDITIONAL_COLORS[idx % ADDITIONAL_COLORS.length];
  });
  return next;
}

function pickRandomCoords(grid, predicate, ratio = 0.25) {
  const coords = [];
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[0].length; c += 1) {
      if (predicate(grid[r][c], r, c)) coords.push([r, c]);
    }
  }

  for (let i = coords.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }

  return coords.slice(0, Math.max(1, Math.round(coords.length * ratio)));
}

function getGridPalette(grid) {
  const palette = [...new Set(grid.flat().filter((c) => c && c !== 'U').map((c) => visibleColor(c)))];
  return palette.length ? palette : BASE_COLORS;
}

function regenerateRandomSpecialBlocks(grid, complications) {
  let next = cloneGrid(grid);
  const shouldRegenerateAdditional = complications.includes('additional_colors');
  const shouldRegenerateUnbreakable = complications.includes('unbreakable_blocks');
  const shouldRegenerateTwoColor = complications.includes('two_colors_blocks');
  const shouldRegenerateFlashing = complications.includes('flashing_blocks');

  next = next.map((row) =>
    row.map((cell) => {
      if (shouldRegenerateUnbreakable && cell === 'U') return randomFrom(BASE_COLORS);
      if (shouldRegenerateAdditional && ADDITIONAL_COLORS.includes(visibleColor(cell))) return randomFrom(BASE_COLORS);
      if (shouldRegenerateTwoColor && isTwoColor(cell)) return visibleColor(cell);
      if (shouldRegenerateFlashing && isFlashing(cell)) return visibleColor(cell);
      return cell;
    })
  );

  if (shouldRegenerateUnbreakable) next = withUnbreakableBlocks(next);
  if (shouldRegenerateAdditional) next = withAdditionalColors(next);
  if (shouldRegenerateTwoColor) next = withTwoColorBlocks(next);
  if (shouldRegenerateFlashing) next = withFlashingBlocks(next);

  return next;
}

function withUnbreakableBlocks(grid) {
  const next = cloneGrid(grid);
  const points = pickRandomCoords(
    next,
    (cell) => Boolean(cell) && cell !== 'U',
    COMPLICATION_RATIOS.unbreakable_blocks
  );
  points.forEach(([r, c]) => {
    if (next[r] && next[r][c]) next[r][c] = 'U';
  });
  return next;
}

function withTwoColorBlocks(grid) {
  const next = cloneGrid(grid);
  const points = pickRandomCoords(
    next,
    (cell) => Boolean(cell) && cell !== 'U',
    COMPLICATION_RATIOS.two_colors_blocks
  );
  const levelPalette = [...new Set(next.flat().filter((c) => c && c !== 'U').map((c) => visibleColor(c)))];
  const palette = levelPalette.length ? levelPalette : ['R', 'G', 'B'];
  points.forEach(([r, c]) => {
    if (next[r] && next[r][c] && next[r][c] !== 'U') next[r][c] = `2${randomFrom(palette)}`;
  });
  return next;
}

function withFlashingBlocks(grid) {
  const next = cloneGrid(grid);
  const points = pickRandomCoords(
    next,
    (cell) => Boolean(cell) && cell !== 'U' && !isTwoColor(cell),
    COMPLICATION_RATIOS.flashing_blocks
  );
  const levelPalette = [...new Set(next.flat().filter((c) => c && c !== 'U').map((c) => visibleColor(c)))];
  const fallback = ['R', 'G', 'B'];
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
            ['R', 'B', 'G', 'G', 'R', 'B', 'G', 'G'],
            ['G', 'R', 'R', 'B', 'G', 'R', 'R', 'B'],
            ['B', 'R', 'G', 'G', 'B', 'R', 'G', 'G'],
            ['G', 'G', 'B', 'R', 'G', 'G', 'B', 'R'],
            ['R', 'G', 'G', 'B', 'R', 'G', 'G', 'B'],
          ],
          complications.filter((c) => c !== 'several_layers')
        ),
      ];
      level.grid = level.layers[0];
    }

    return level;
  });
}

async function loadBuiltinLevelsFromFiles() {
  const levels = [];
  for (let idx = 1; idx <= 999; idx += 1) {
    const url = `levels/level_${String(idx).padStart(3, '0')}.json`;
    const response = await fetch(url);
    if (!response.ok) continue;
    const level = await response.json();
    levels.push(level);
  }
  if (!levels.length) {
    throw new Error('Failed to load levels from files');
  }
  return levels.sort((a, b) => Number(a.level) - Number(b.level));
}

function populateLevelSelect() {
  if (!ui.levelSelect) return;
  ui.levelSelect.innerHTML = '';
  model.levels.forEach((lvl, idx) => {
    const option = document.createElement('option');
    option.value = String(idx);
    option.textContent = `${lvl.level}. ${lvl.description} [${lvl.complications.join(', ')}]`;
    ui.levelSelect.appendChild(option);
  });
}

function builderComplicationsFromUI() {
  const complications = [];
  if (ui.cAdditionalColors.checked) complications.push('additional_colors');
  if (ui.cTimer.checked) complications.push('timer');
  if (ui.cLimitedShots.checked) complications.push('limited_shots');
  if (ui.cUnbreakableBlocks.checked) complications.push('unbreakable_blocks');
  if (ui.cTwoColorsBlocks.checked) complications.push('two_colors_blocks');
  if (ui.cFlashingBlocks.checked) complications.push('flashing_blocks');
  if (ui.cSeveralLayers.checked) complications.push('several_layers');
  return complications;
}

function getBuilderBasePalette() {
  const palette = [...BASE_BUILDER_COLORS];
  if (ui.cAdditionalColors?.checked) palette.push('Y', 'P', 'O');
  return palette;
}

function getBuilderDropdownOptions() {
  const options = [...getBuilderBasePalette()];
  if (ui.cUnbreakableBlocks?.checked) options.push('U');
  if (ui.cTwoColorsBlocks?.checked) {
    getBuilderBasePalette().forEach((color) => options.push(`2${color}`));
  }
  if (ui.cFlashingBlocks?.checked) {
    const palette = getBuilderBasePalette();
    for (let i = 0; i < palette.length; i += 1) {
      const c1 = palette[i];
      const c2 = palette[(i + 1) % palette.length];
      options.push(`F:${c1}:${c2}:0`);
    }
  }
  return options;
}

function normalizeBuilderCellValue(value, options) {
  if (options.includes(value)) return value;
  if (typeof value === 'string' && value.startsWith('2')) {
    const fallback = options.find((option) => option.startsWith('2')) || options[0];
    return fallback;
  }
  if (typeof value === 'string' && value.startsWith('F:')) {
    const fallback = options.find((option) => option.startsWith('F:')) || options[0];
    return fallback;
  }
  return options[0] || 'R';
}

function buildGridFromBuilderUI() {
  const rows = Number(ui.builderRows.value);
  const cols = Number(ui.builderCols.value);
  const grid = Array.from({ length: rows }, () => Array(cols).fill('R'));
  const selectors = ui.builderGrid.querySelectorAll('select[data-row][data-col]');
  selectors.forEach((selectEl) => {
    const r = Number(selectEl.dataset.row);
    const c = Number(selectEl.dataset.col);
    if (Number.isFinite(r) && Number.isFinite(c) && grid[r] && typeof grid[r][c] !== 'undefined') {
      grid[r][c] = selectEl.value;
    }
  });
  return grid;
}

function renderBuilderGrid(grid) {
  const options = getBuilderDropdownOptions();
  ui.builderRows.value = grid.length;
  ui.builderCols.value = grid[0].length;
  ui.builderGrid.innerHTML = '';
  ui.builderGrid.style.gridTemplateColumns = `repeat(${grid[0].length}, minmax(48px, 1fr))`;

  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[0].length; c += 1) {
      const select = document.createElement('select');
      select.dataset.row = String(r);
      select.dataset.col = String(c);
      options.forEach((code) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = code.replace(':0', '');
        select.appendChild(option);
      });
      select.value = normalizeBuilderCellValue(grid[r][c], options);
      ui.builderGrid.appendChild(select);
    }
  }
}

function buildLevelFromBuilder() {
  const baseGrid = buildGridFromBuilderUI();
  const complications = builderComplicationsFromUI();
  const layersCount = ui.cSeveralLayers.checked ? Math.max(1, Number(ui.builderLayers.value) || 1) : 1;
  const level = {
    level: 'custom',
    description: 'Builder level',
    complications,
    grid: cloneGrid(baseGrid),
  };

  if (ui.cTimer.checked) level.timerSeconds = Math.max(1, Number(ui.builderTimer.value) || 60);
  if (ui.cLimitedShots.checked) level.maxShots = Math.max(1, Number(ui.builderShots.value) || 10);

  if (layersCount > 1) {
    level.layers = Array.from({ length: layersCount }, () => cloneGrid(baseGrid));
  }

  return level;
}

function startCustomBuilderLevel() {
  const customLevel = buildLevelFromBuilder();
  model.currentLevel = customLevel;
  model.currentLayerIndex = 0;
  // Builder preview restart must restore exactly the form-defined layout
  // (no random reshuffle between restarts).
  model.grid = cloneGrid(customLevel.layers ? customLevel.layers[0] : customLevel.grid);
  model.score = 0;
  model.activeBooster = null;
  model.rainbowNextShot = false;
  model.winAwarded = false;
  closeFailModal();
  closeWinModal();
  model.gameOver = false;
  model.shotsLeft = Number.isFinite(customLevel.maxShots) ? customLevel.maxShots : Infinity;
  model.timerLeft = Number.isFinite(customLevel.timerSeconds) ? customLevel.timerSeconds : Infinity;
  model.selectedShotColor = getBreakableColors(model.grid)[0] || 'R';
  pickNextShotColor();
  initPhaser(model.grid.length, model.grid[0].length);
  renderBoosterInventory();
  refreshUI();
  ui.stateLabel.textContent = 'Статус: preview builder-level';
}

function downloadBuilderLevel() {
  const data = buildLevelFromBuilder();
  const payload = JSON.stringify(data, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const rows = data.grid.length;
  const cols = data.grid[0].length;
  const suffix = data.complications.length ? data.complications.join('_') : 'basic';
  link.download = `${cols}x${rows}_${suffix}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function loadBuilderLevelFromFile(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      const loadedGrid = parsed.layers?.[0] || parsed.grid;
      if (!Array.isArray(loadedGrid) || !Array.isArray(loadedGrid[0])) {
        throw new Error('Invalid grid');
      }
      const setByToken = (token, value = true) => {
        if (token === 'additional_colors') ui.cAdditionalColors.checked = value;
        if (token === 'timer') ui.cTimer.checked = value;
        if (token === 'limited_shots') ui.cLimitedShots.checked = value;
        if (token === 'unbreakable_blocks') ui.cUnbreakableBlocks.checked = value;
        if (token === 'two_colors_blocks') ui.cTwoColorsBlocks.checked = value;
        if (token === 'flashing_blocks') ui.cFlashingBlocks.checked = value;
        if (token === 'several_layers') ui.cSeveralLayers.checked = value;
      };
      [
        'additional_colors',
        'timer',
        'limited_shots',
        'unbreakable_blocks',
        'two_colors_blocks',
        'flashing_blocks',
        'several_layers',
      ].forEach((token) => setByToken(token, false));
      (parsed.complications || []).forEach((token) => setByToken(token, true));
      renderBuilderGrid(loadedGrid);
      ui.builderTimer.value = String(Number(parsed.timerSeconds) || 60);
      ui.builderShots.value = String(Number(parsed.maxShots) || 10);
      ui.builderLayers.value = String(parsed.layers?.length || 1);
      ui.stateLabel.textContent = 'Статус: level loaded into builder';
    } catch {
      ui.stateLabel.textContent = 'Статус: ошибка чтения level JSON';
    } finally {
      ui.builderFileInput.value = '';
    }
  };
  reader.readAsText(file);
}

function generateBuilderGridFromInputs() {
  const rows = Math.max(3, Math.min(10, Number(ui.builderRows.value) || 6));
  const cols = Math.max(3, Math.min(12, Number(ui.builderCols.value) || 8));
  const complications = builderComplicationsFromUI();
  let grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => randomFrom(BASE_COLORS))
  );

  if (complications.includes('unbreakable_blocks')) {
    pickRandomCoords(
      grid,
      (cell) => Boolean(cell) && cell !== 'U',
      COMPLICATION_RATIOS.unbreakable_blocks
    ).forEach(([r, c]) => {
      grid[r][c] = 'U';
    });
  }

  if (complications.includes('additional_colors')) {
    grid = withAdditionalColors(grid);
  }

  const palette = getGridPalette(grid);

  if (complications.includes('two_colors_blocks')) {
    pickRandomCoords(
      grid,
      (cell) => Boolean(cell) && cell !== 'U',
      COMPLICATION_RATIOS.two_colors_blocks
    ).forEach(([r, c]) => {
      grid[r][c] = `2${randomFrom(palette)}`;
    });
  }

  if (complications.includes('flashing_blocks')) {
    pickRandomCoords(
      grid,
      (cell) => Boolean(cell) && cell !== 'U' && !isTwoColor(cell),
      COMPLICATION_RATIOS.flashing_blocks
    ).forEach(([r, c]) => {
      const c1 = randomFrom(palette);
      grid[r][c] = makeFlashing(c1, randomColorDifferentFrom(c1, palette), 0);
    });
  }

  renderBuilderGrid(grid);
}

function refreshBuilderDropdownsFromCurrentGrid() {
  const currentGrid = buildGridFromBuilderUI();
  renderBuilderGrid(currentGrid);
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
  if (ui.startBalanceLabel) ui.startBalanceLabel.textContent = String(model.totalScore);
  if (ui.levelsBalanceLabel) ui.levelsBalanceLabel.textContent = String(model.totalScore);
  if (ui.gameBalanceLabel) ui.gameBalanceLabel.textContent = String(model.totalScore);
  if (ui.gameLevelLabel) ui.gameLevelLabel.textContent = `LEVEL ${model.currentLevelIndex + 1}`;
  if (ui.gameMovesLabel) ui.gameMovesLabel.innerHTML = `<strong>MOVES:</strong> ${Number.isFinite(model.shotsLeft) ? model.shotsLeft : '∞'}`;
  ui.shotsLabel.textContent = `Выстрелы: ${Number.isFinite(model.shotsLeft) ? model.shotsLeft : '∞'}`;
  ui.timerLabel.textContent = `Таймер: ${Number.isFinite(model.timerLeft) ? Math.max(0, Math.ceil(model.timerLeft)) : '∞'}`;
  if (!model.gameOver) {
    ui.stateLabel.textContent = `Статус: игра идёт (цвет: ${model.selectedShotColor})`;
  }
  ui.shopBalanceLabel.textContent = `Баланс: ${model.totalScore}`;
}

function renderBoosterInventory() {
  if (!ui.boosterInventoryList) return;
  ui.boosterInventoryList.innerHTML = '';
  BOOSTER_CATALOG.forEach((booster) => {
    const owned = IS_BUILDER_PAGE ? Number.MAX_SAFE_INTEGER : Number(model.boosters[booster.key] || 0);
    const li = document.createElement('li');
    if (booster.key === 'bomb' || booster.key === 'mix' || booster.key === 'fractions' || booster.key === 'minusOneColor' || booster.key === 'plusFiveShots' || booster.key === 'rainbow') {
      const label = model.activeBooster === booster.key ? 'Armed' : 'Use';
      const disabled = owned <= 0 ? 'disabled' : '';
      const armedStyle = model.activeBooster === booster.key ? 'style="border:1px solid #22c55e;"' : '';
      const amountLabel = IS_BUILDER_PAGE ? '∞' : `x${owned}`;
      const iconMap = { bomb: '💣', mix: '🌪️', fractions: '🧩', minusOneColor: '⛔', plusFiveShots: '+5', rainbow: '🌈' };
      li.innerHTML = `<span class="booster-icon">${iconMap[booster.key] || '✨'}</span><span><span class="booster-name">${booster.name.replace(' color', ' Color').replace('shots', 'Shots')}</span><span class="booster-count">${amountLabel}</span></span><button data-use-booster="${booster.key}" ${disabled} ${armedStyle}>${label.toUpperCase()}</button>`;
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

function boosterIcon(boosterKey) {
  return { bomb: '💣', mix: '🌈', fractions: '🧩', minusOneColor: '-1', plusFiveShots: '+5', rainbow: '🌈' }[boosterKey] || '✨';
}

function renderShopTable() {
  ui.shopTableBody.innerHTML = '';
  BOOSTER_CATALOG.forEach((booster) => {
    const card = document.createElement('article');
    card.className = 'shop-card';
    const owned = Number(model.boosters[booster.key] || 0);
    card.innerHTML = `
      <span class="shop-icon">${boosterIcon(booster.key)}</span>
      <span class="shop-owned">x${owned}</span>
      <div class="shop-name">${booster.name}</div>
      <div class="shop-effect">${booster.effect}</div>
      <div class="shop-buy-row"><span class="shop-price">💎 ${booster.price}</span><button class="shop-buy" data-booster="${booster.key}">BUY</button></div>
    `;
    const buyBtn = card.querySelector('button');
    buyBtn.onclick = () => buyBooster(booster.key);
    ui.shopTableBody.appendChild(card);
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
    const rows = model.grid.length || 1;
    const cols = model.grid[0]?.length || 1;
    const maxBoardWidth = 1060;
    const maxBoardHeight = 620;
    const fitByWidth = Math.floor(maxBoardWidth / cols);
    const fitByHeight = Math.floor(maxBoardHeight / rows);
    this.cell = Math.max(52, Math.min(104, fitByWidth, fitByHeight));
    this.gridX = 12;
    this.gridY = 12;
    this.playAreaHeight = Math.max(760, this.gridY * 2 + rows * this.cell + 160);
    this.blocks = new Map();
    this.animating = false;
    this.shooterX = 0;
    this.shooterY = 0;
    this.shooter = null;
    this.flashAccumulator = 0;
    this.pendingShotColor = null;
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
    if (model.activeBooster === 'minusOneColor') {
      this.useMinusOneColor();
      return;
    }
    if (model.activeBooster === 'plusFiveShots') {
      this.usePlusFiveShots();
      return;
    }

    this.shootToCell(row, col);
  }

  completeAction(removedKeys, gravityMoves) {
    this.animateRemovalAndFall(removedKeys, gravityMoves, () => {
      if (isWin()) {
        if (model.currentLevel?.layers && model.currentLayerIndex < model.currentLevel.layers.length - 1) {
          model.currentLayerIndex += 1;
          model.grid = randomizeGridLayout(
            regenerateRandomSpecialBlocks(
              cloneGrid(model.currentLevel.layers[model.currentLayerIndex]),
              model.currentLevel.complications || []
            )
          );
          this.renderGridStatic();
          ui.stateLabel.textContent = `Статус: слой ${model.currentLayerIndex + 1}/${model.currentLevel.layers.length}`;
        } else {
          model.gameOver = true;
          closeFailModal();
          ui.stateLabel.textContent = 'Статус: победа';
          openWinModal();
        }
      } else if (Number.isFinite(model.shotsLeft) && model.shotsLeft <= 0) {
        failLevel('Статус: поражение (кончились выстрелы)');
      }

      pickNextShotColor();
      model.rainbowNextShot = false;
      this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
      refreshUI();
      this.animating = false;
    });
  }

  useBombAt(row, col) {
    const bombs = Number(model.boosters.bomb || 0);
    if (bombs <= 0) return;

    this.animating = true;
    if (!IS_BUILDER_PAGE) model.boosters.bomb = bombs - 1;
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

    const earned = pointsForRemovedBlocks(removed.length);
    model.score += earned;

    const gravityMoves = applyGravityAndGetMoves();
    this.completeAction(removedKeys, gravityMoves);
  }

  useMix() {
    const mixCount = Number(model.boosters.mix || 0);
    if (mixCount <= 0) return;

    this.animating = true;
    if (!IS_BUILDER_PAGE) model.boosters.mix = mixCount - 1;
    model.activeBooster = null;
    renderBoosterInventory();

    const palette = getBreakableColors(model.grid).filter((c) => c !== 'U');
    const fallbackPalette = ['R', 'G', 'B'];
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


  animateFractionsSplit(row, col, selectedRegions, color, done) {
    const origin = this.gridToPixel(row, col);
    const regionAnchors = selectedRegions
      .map((region) => region.ordinary[0] || region.twos[0])
      .filter(Boolean)
      .map(([r, c]) => this.gridToPixel(r, c));
    const fallbackOffsets = [
      { x: -this.cell, y: -this.cell * 0.7 },
      { x: this.cell, y: -this.cell * 0.7 },
      { x: 0, y: this.cell },
    ];
    const destinations = Array.from({ length: 3 }, (_, idx) => {
      const anchor = regionAnchors[idx] || regionAnchors[regionAnchors.length - 1] || origin;
      if (anchor === origin || (anchor.x === origin.x && anchor.y === origin.y)) {
        const offset = fallbackOffsets[idx];
        return { x: origin.x + offset.x, y: origin.y + offset.y };
      }
      return anchor;
    });

    let finished = 0;
    destinations.forEach((target, idx) => {
      const ball = this.add.circle(origin.x, origin.y, 13, COLOR_MAP[color] || 0xffffff)
        .setStrokeStyle(2, 0xffffff)
        .setDepth(100);
      this.tweens.add({
        targets: ball,
        x: target.x,
        y: target.y,
        scaleX: 1.25,
        scaleY: 1.25,
        alpha: 0.25,
        delay: idx * 70,
        duration: 360,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          ball.destroy();
          finished += 1;
          if (finished === destinations.length) done();
        },
      });
    });
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
    if (!IS_BUILDER_PAGE) model.boosters.fractions = fractionsCount - 1;
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

    const uniqueOrdinary = [...new Set(allOrdinary.map(([r, c]) => `${r},${c}`))].map((k) =>
      k.split(',').map(Number)
    );

    this.animateFractionsSplit(row, col, selectedRegions, targetColor, () => {
      repaintTwoColorCells(allTwos, targetColor);

      const removedKeys = uniqueOrdinary.map(([r, c]) => this.key(r, c));
      uniqueOrdinary.forEach(([r, c]) => {
        model.grid[r][c] = null;
      });

      const earned = pointsForRemovedBlocks(uniqueOrdinary.length);
      model.score += earned;

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
    });
  }

  useMinusOneColor() {
    const count = Number(model.boosters.minusOneColor || 0);
    if (count <= 0) return;

    const palette = getBreakableColors(model.grid).filter((c) => c !== 'U');
    if (palette.length === 0) return;
    const chosenColor = randomFrom(palette);

    this.animating = true;
    if (!IS_BUILDER_PAGE) model.boosters.minusOneColor = count - 1;
    model.activeBooster = null;
    renderBoosterInventory();

    const removed = [];
    for (let r = 0; r < model.grid.length; r += 1) {
      for (let c = 0; c < model.grid[0].length; c += 1) {
        const cell = model.grid[r][c];
        if (!cell || cell === 'U') continue;
        if (visibleColor(cell) !== chosenColor) continue;

        if (isTwoColor(cell)) {
          // 2Color подходит по цвету -> становится обычным блоком другого цвета.
          model.grid[r][c] = randomColorDifferentFrom(chosenColor, palette);
        } else {
          removed.push([r, c]); // Обычные и flashing удаляем.
        }
      }
    }

    const removedKeys = removed.map(([r, c]) => this.key(r, c));
    removed.forEach(([r, c]) => {
      model.grid[r][c] = null;
    });

    const earned = pointsForRemovedBlocks(removed.length);
    model.score += earned;

    ui.stateLabel.textContent = `Статус: -1 color выбрал ${chosenColor}`;

    if (removed.length === 0) {
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

  usePlusFiveShots() {
    const count = Number(model.boosters.plusFiveShots || 0);
    if (count <= 0) return;

    // Бустер работает только на уровнях с ограничением выстрелов.
    if (!Number.isFinite(model.shotsLeft)) {
      model.activeBooster = null;
      ui.stateLabel.textContent = 'Статус: +5 shots работает только при limited shots';
      renderBoosterInventory();
      refreshUI();
      return;
    }

    this.animating = true;
    if (!IS_BUILDER_PAGE) model.boosters.plusFiveShots = count - 1;
    model.activeBooster = null;
    model.shotsLeft += 5;
    savePersistentState();
    renderBoosterInventory();
    refreshUI();
    this.animating = false;
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

    if (model.activeBooster === 'rainbow') {
      const count = Number(model.boosters.rainbow || 0);
      if (count > 0) {
        if (!IS_BUILDER_PAGE) model.boosters.rainbow = count - 1;
        model.activeBooster = null;
        model.rainbowNextShot = true;
        savePersistentState();
        renderBoosterInventory();
      }
    }

    const effectiveShotColor = model.rainbowNextShot ? visibleColor(targetCode) : model.selectedShotColor;
    this.pendingShotColor = effectiveShotColor;

    if (Number.isFinite(model.shotsLeft)) {
      model.shotsLeft -= 1;
      if (model.shotsLeft < 0) model.shotsLeft = 0;
    }

    const projectile = this.add.circle(this.shooterX, this.shooterY, 14, COLOR_MAP[effectiveShotColor]).setStrokeStyle(2, 0xffffff);
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
    const shotColor = this.pendingShotColor || model.selectedShotColor;
    if (visibleColor(targetCode) !== shotColor) {
      pickNextShotColor();
      this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
      model.rainbowNextShot = false;
      refreshUI();
      this.animating = false;
      if (Number.isFinite(model.shotsLeft) && model.shotsLeft <= 0) {
        failLevel('Статус: поражение (кончились выстрелы)');
      }
      return;
    }

    const shotRegion = findShotRegion(row, col, shotColor);
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

    repaintTwoColorCells(twoColorGroup, shotColor);

    const removedKeys = ordinaryGroup.map(([r, c]) => this.key(r, c));
    ordinaryGroup.forEach(([r, c]) => {
      model.grid[r][c] = null;
    });
    const earned = pointsForRemovedBlocks(ordinaryGroup.length);
    model.score += earned;

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
        failLevel('Статус: поражение (время вышло)');
      }
      refreshUI();
    }
  }
}




function openWinModal() {
  if (!ui.winModal) return;
  const movesLeft = Number.isFinite(model.shotsLeft) ? Math.max(0, model.shotsLeft) : 0;
  const moveBonus = movesLeft * 10;
  const totalAward = model.score + moveBonus;
  if (!model.winAwarded) {
    model.totalScore += totalAward;
    model.highestUnlockedLevel = Math.max(model.highestUnlockedLevel, Math.min(model.currentLevelIndex + 2, model.levels.length));
    model.winAwarded = true;
    savePersistentState();
  }
  if (ui.winLevelLabel) ui.winLevelLabel.textContent = `Level ${model.currentLevelIndex + 1} Complete`;
  if (ui.winMovesLabel) ui.winMovesLabel.textContent = `Moves Left: ${movesLeft}`;
  if (ui.winRewardLabel) ui.winRewardLabel.textContent = `💎 +${totalAward}`;
  renderLevelsScreen();
  refreshUI();
  ui.winModal.classList.add('open');
  ui.winModal.setAttribute('aria-hidden', 'false');
}

function closeWinModal() {
  if (!ui.winModal) return;
  ui.winModal.classList.remove('open');
  ui.winModal.setAttribute('aria-hidden', 'true');
}

function goToNextLevel() {
  closeWinModal();
  const nextIndex = Math.min(model.currentLevelIndex + 1, model.levels.length - 1);
  startLevelByIndex(nextIndex);
}

function openFailModal() {
  if (!ui.failModal) return;
  ui.failModal.classList.add('open');
  ui.failModal.setAttribute('aria-hidden', 'false');
}

function closeFailModal() {
  if (!ui.failModal) return;
  ui.failModal.classList.remove('open');
  ui.failModal.setAttribute('aria-hidden', 'true');
}

function failLevel(message = 'Статус: поражение') {
  model.gameOver = true;
  ui.stateLabel.textContent = message;
  refreshUI();
  openFailModal();
}

function retryCurrentLevel() {
  closeFailModal();
  startLevelByIndex(model.currentLevelIndex || 0);
}

function showStartScreen() {
  if (ui.levelsScreen) ui.levelsScreen.hidden = true;
  if (ui.startScreen) ui.startScreen.hidden = false;
  document.body.classList.add('start-active');
}

function showLevelsScreen() {
  if (ui.startScreen) ui.startScreen.hidden = true;
  if (ui.levelsScreen) ui.levelsScreen.hidden = false;
  document.body.classList.add('start-active');
  renderLevelsScreen();
}

function hideMenuScreens() {
  if (ui.startScreen) ui.startScreen.hidden = true;
  if (ui.levelsScreen) ui.levelsScreen.hidden = true;
  document.body.classList.remove('start-active');
}

function renderLevelsScreen() {
  if (!ui.levelsGrid) return;
  const totalSlots = 30;
  const selectedLevel = Math.min(model.currentLevelIndex + 1, totalSlots);
  const unlockedThrough = Math.min(model.highestUnlockedLevel, model.levels.length || 0);
  ui.levelsGrid.innerHTML = '';

  for (let levelNumber = 1; levelNumber <= totalSlots; levelNumber += 1) {
    const isAvailable = levelNumber <= model.levels.length;
    const isUnlocked = isAvailable && levelNumber <= unlockedThrough;
    const isSelected = levelNumber === selectedLevel && isUnlocked;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}${isSelected ? ' selected' : ''}`;
    card.setAttribute('aria-label', isUnlocked ? `Start level ${levelNumber}` : `Level ${levelNumber} locked`);
    card.disabled = !isUnlocked;

    const number = document.createElement('span');
    number.className = 'level-number';
    number.textContent = String(levelNumber);
    card.appendChild(number);

    const meta = document.createElement('span');
    if (isUnlocked) {
      meta.className = 'level-stars';
      meta.textContent = isSelected ? '★★★' : '★★★';
    } else {
      meta.className = 'level-lock';
      meta.textContent = '🔒';
    }
    card.appendChild(meta);

    if (isUnlocked) {
      card.onclick = () => {
        if (ui.levelSelect) ui.levelSelect.value = String(levelNumber - 1);
        hideMenuScreens();
        startLevelByIndex(levelNumber - 1);
      };
    }

    ui.levelsGrid.appendChild(card);
  }
}

function initPhaser(rows, cols) {
  if (phaserGame) phaserGame.destroy(true);
  const maxBoardWidth = 1060;
  const maxBoardHeight = 620;
  const fitByWidth = Math.floor(maxBoardWidth / cols);
  const fitByHeight = Math.floor(maxBoardHeight / rows);
  const cell = Math.max(52, Math.min(104, fitByWidth, fitByHeight));
  const width = cols * cell + 24;
  const height = Math.max(760, 24 + rows * cell + 160);
  boardScene = new BoardScene();

  phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width,
    height,
    scene: [boardScene],
  });
}

function startLevelByIndex(index) {
  const level = model.levels[index];
  model.currentLevelIndex = index;
  model.currentLevel = level;
  model.currentLayerIndex = 0;
  model.grid = randomizeGridLayout(
    regenerateRandomSpecialBlocks(cloneGrid(level.layers ? level.layers[0] : level.grid), level.complications || [])
  );
  model.score = 0;
  model.activeBooster = null;
  model.rainbowNextShot = false;
  model.winAwarded = false;
  closeFailModal();
  closeWinModal();
  model.gameOver = false;
  model.shotsLeft = Number.isFinite(level.maxShots) ? level.maxShots : Infinity;
  model.timerLeft = Number.isFinite(level.timerSeconds) ? level.timerSeconds : Infinity;
  model.selectedShotColor = getBreakableColors(model.grid)[0] || 'R';
  pickNextShotColor();

  initPhaser(model.grid.length, model.grid[0].length);
  renderBoosterInventory();
  refreshUI();
}

async function initApp() {
  loadPersistentState();
  try {
    model.levels = await loadBuiltinLevelsFromFiles();
  } catch {
    model.levels = buildBuiltinLevels();
  }
  populateLevelSelect();
  if (ui.startBtn) ui.startBtn.onclick = () => startLevelByIndex(Number(ui.levelSelect.value));
  if (ui.shopBtn) ui.shopBtn.onclick = () => openShop();
  if (ui.startPlayBtn) {
    ui.startPlayBtn.onclick = () => {
      showLevelsScreen();
    };
  }
  if (ui.startShopBtn) ui.startShopBtn.onclick = () => openShop();
  if (ui.startPlusBtn) ui.startPlusBtn.onclick = () => openShop();
  if (ui.levelsBackBtn) ui.levelsBackBtn.onclick = () => showStartScreen();
  if (ui.levelsShopBtn) ui.levelsShopBtn.onclick = () => openShop();
  if (ui.levelsPlusBtn) ui.levelsPlusBtn.onclick = () => openShop();
  if (ui.gameHomeBtn) ui.gameHomeBtn.onclick = () => showLevelsScreen();
  if (ui.gamePlusBtn) ui.gamePlusBtn.onclick = () => openShop();
  if (ui.failHomeBtn) ui.failHomeBtn.onclick = () => { closeFailModal(); showLevelsScreen(); };
  if (ui.failShopBtn) ui.failShopBtn.onclick = () => { closeFailModal(); openShop(); };
  if (ui.failRetryBtn) ui.failRetryBtn.onclick = () => retryCurrentLevel();
  if (ui.winHomeBtn) ui.winHomeBtn.onclick = () => { closeWinModal(); showLevelsScreen(); };
  if (ui.winShopBtn) ui.winShopBtn.onclick = () => { closeWinModal(); openShop(); };
  if (ui.winNextBtn) ui.winNextBtn.onclick = () => goToNextLevel();
  if (ui.closeShopBtn) ui.closeShopBtn.onclick = () => closeShop();
  if (ui.shopModal) {
    ui.shopModal.onclick = (event) => {
      if (event.target === ui.shopModal) closeShop();
    };
  }
  if (ui.builderGenerateBtn && ui.builderPreviewBtn && ui.builderGrid) {
    generateBuilderGridFromInputs();
    ui.builderGenerateBtn.onclick = () => {
      generateBuilderGridFromInputs();
      startCustomBuilderLevel();
    };
    ui.builderPreviewBtn.onclick = () => startCustomBuilderLevel();
    ui.builderDownloadBtn.onclick = () => downloadBuilderLevel();
    ui.builderLoadBtn.onclick = () => ui.builderFileInput.click();
    ui.builderFileInput.onchange = (event) => loadBuilderLevelFromFile(event);
    [ui.cAdditionalColors, ui.cUnbreakableBlocks, ui.cTwoColorsBlocks, ui.cFlashingBlocks].forEach((checkbox) => {
      checkbox.onchange = () => refreshBuilderDropdownsFromCurrentGrid();
    });
    startCustomBuilderLevel();
  } else if (!ui.startScreen) {
    startLevelByIndex(0);
  } else {
    renderBoosterInventory();
    renderLevelsScreen();
    refreshUI();
  }
}

initApp();
