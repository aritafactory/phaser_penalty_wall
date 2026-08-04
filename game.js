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
  mainLevels: [],
  masterLevels: [],
  activeLevelSet: 'main',
  currentLevel: null,
  currentLevelIndex: 0,
  levelsPage: 0,
  highestUnlockedLevel: 1,
  winAwarded: false,
  ineffectiveShotStreak: 0,
  currentLayerIndex: 0,
  boosters: {},
  levelBoosters: {},
  activeBooster: null,
  rainbowNextShot: false,
  gameplayActive: false,
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
  levelsDots: document.getElementById('levelsDots'),
  mainLevelsTab: document.getElementById('mainLevelsTab'),
  masterLevelsTab: document.getElementById('masterLevelsTab'),
  gameHomeBtn: document.getElementById('gameHomeBtn'),
  gamePlusBtn: document.getElementById('gamePlusBtn'),
  gameBalanceLabel: document.getElementById('gameBalanceLabel'),
  gameLevelLabel: document.getElementById('gameLevelLabel'),
  gameMovesLabel: document.getElementById('gameMovesLabel'),
  gameTimerTopLabel: document.getElementById('gameTimerTopLabel'),
  failModal: document.getElementById('failModal'),
  failHomeBtn: document.getElementById('failHomeBtn'),
  failRetryBtn: document.getElementById('failRetryBtn'),
  winModal: document.getElementById('winModal'),
  winHomeBtn: document.getElementById('winHomeBtn'),
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
  { key: 'plusTenSeconds', name: '+10 Seconds', price: 150, effect: 'Add 10 seconds on timer levels.' },
  { key: 'compressor', name: 'Compressor', price: 180, effect: 'Push each row toward the center.' },
  { key: 'rotator', name: 'Rotator', price: 180, effect: 'Rotate a 3×3 ring clockwise.' },
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

function connectedClusterFromSeed(grid, seed, maxSize, reserved = new Set()) {
  const cluster = [];
  const queue = [seed];
  const seen = new Set([seed.join(',')]);

  while (queue.length && cluster.length < maxSize) {
    const [r, c] = queue.shift();
    const key = `${r},${c}`;
    if (!reserved.has(key) && grid[r]?.[c] && grid[r][c] !== 'U') {
      cluster.push([r, c]);
    }

    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      const nextKey = `${nr},${nc}`;
      if (seen.has(nextKey)) continue;
      if (!grid[nr] || typeof grid[nr][nc] === 'undefined') continue;
      if (!grid[nr][nc] || grid[nr][nc] === 'U' || reserved.has(nextKey)) continue;
      seen.add(nextKey);
      queue.push([nr, nc]);
    }
  }

  return cluster;
}

function shuffleInPlace(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function visibleColorCells(grid, color) {
  const cells = [];
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[0].length; c += 1) {
      if (visibleColor(grid[r][c]) === color) cells.push([r, c]);
    }
  }
  return cells;
}

function areCellsOrthogonallyConnected(cells) {
  if (cells.length <= 1) return true;
  const targets = new Set(cells.map(([r, c]) => `${r},${c}`));
  const queue = [cells[0]];
  const seen = new Set([cells[0].join(',')]);

  while (queue.length) {
    const [r, c] = queue.shift();
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (!targets.has(key) || seen.has(key)) return;
      seen.add(key);
      queue.push([nr, nc]);
    });
  }

  return seen.size === cells.length;
}

function collectConnectedGroupsInGrid(grid, predicate = () => true) {
  const groups = [];
  const visited = new Set();

  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[0].length; c += 1) {
      const cell = grid[r][c];
      const key = `${r},${c}`;
      if (!cell || cell === 'U' || visited.has(key) || !predicate(cell, r, c)) continue;

      const color = visibleColor(cell);
      const group = [];
      const queue = [[r, c]];
      visited.add(key);

      while (queue.length) {
        const [cr, cc] = queue.shift();
        group.push([cr, cc]);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
          const nr = cr + dr;
          const nc = cc + dc;
          const nextKey = `${nr},${nc}`;
          const nextCell = grid[nr]?.[nc];
          if (!nextCell || nextCell === 'U' || visited.has(nextKey) || !predicate(nextCell, nr, nc)) return;
          if (visibleColor(nextCell) !== color) return;
          visited.add(nextKey);
          queue.push([nr, nc]);
        });
      }

      groups.push(group);
    }
  }

  return groups;
}

function applyGravityToGrid(grid) {
  const next = cloneGrid(grid);
  const rows = next.length;
  const cols = next[0].length;

  for (let c = 0; c < cols; c += 1) {
    const stack = [];
    for (let r = rows - 1; r >= 0; r -= 1) {
      if (next[r][c]) stack.push(next[r][c]);
    }
    for (let r = rows - 1; r >= 0; r -= 1) {
      next[r][c] = stack[rows - 1 - r] || null;
    }
  }

  return next;
}

function simulateGroupRemovalWithGravity(grid, group) {
  const next = cloneGrid(grid);
  group.forEach(([r, c]) => {
    next[r][c] = null;
  });
  return applyGravityToGrid(next);
}

function additionalColorCanConnectAfterOneRemoval(grid, color) {
  const originalCells = visibleColorCells(grid, color);
  if (originalCells.length <= 1) return true;

  const removableGroups = collectConnectedGroupsInGrid(
    grid,
    (cell) => visibleColor(cell) !== color
  );

  return removableGroups.some((group) => {
    const simulated = simulateGroupRemovalWithGravity(grid, group);
    const remaining = visibleColorCells(simulated, color);
    return remaining.length === originalCells.length && areCellsOrthogonallyConnected(remaining);
  });
}

function validateAdditionalColorLayout(grid) {
  return ADDITIONAL_COLORS.every((color) => {
    const cells = visibleColorCells(grid, color);
    return cells.length <= 1 || additionalColorCanConnectAfterOneRemoval(grid, color);
  });
}

function eligibleAdditionalColorCells(grid) {
  const cells = [];
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[0].length; c += 1) {
      if (grid[r][c] && grid[r][c] !== 'U') cells.push([r, c]);
    }
  }
  return cells;
}

function paintAdditionalColorGroups(grid, useConnectedClusters) {
  const next = cloneGrid(grid);
  const eligible = shuffleInPlace(eligibleAdditionalColorCells(next));
  if (!eligible.length) return next;

  const targetCount = Math.max(1, Math.round(eligible.length * COMPLICATION_RATIOS.additional_colors));
  const colorCount = Math.min(ADDITIONAL_COLORS.length, targetCount);
  const baseSize = Math.floor(targetCount / colorCount);
  let remainder = targetCount % colorCount;
  const reserved = new Set();

  ADDITIONAL_COLORS.slice(0, colorCount).forEach((color) => {
    const desiredSize = Math.max(1, baseSize + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder -= 1;
    const available = eligible.filter(([r, c]) => !reserved.has(`${r},${c}`));
    if (!available.length) return;
    const cells = useConnectedClusters
      ? connectedClusterFromSeed(next, available[0], desiredSize, reserved)
      : available.slice(0, desiredSize);

    cells.forEach(([r, c]) => {
      next[r][c] = color;
      reserved.add(`${r},${c}`);
    });
  });

  return next;
}

function withAdditionalColors(grid) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const candidate = paintAdditionalColorGroups(grid, true);
    if (validateAdditionalColorLayout(candidate)) return candidate;
  }

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const candidate = paintAdditionalColorGroups(grid, false);
    if (validateAdditionalColorLayout(candidate)) return candidate;
  }

  return paintAdditionalColorGroups(grid, true);
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


function findColorComponentSizeInGrid(grid, startR, startC, color, ignored = new Set()) {
  const queue = [[startR, startC]];
  const seen = new Set([`${startR},${startC}`]);
  let size = 0;

  while (queue.length) {
    const [r, c] = queue.shift();
    const key = `${r},${c}`;
    const cell = grid[r]?.[c];
    if (!cell || cell === 'U' || ignored.has(key) || visibleColor(cell) !== color) continue;
    size += 1;

    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      const nextKey = `${nr},${nc}`;
      if (!grid[nr] || typeof grid[nr][nc] === 'undefined' || seen.has(nextKey)) return;
      seen.add(nextKey);
      queue.push([nr, nc]);
    });
  }

  return size;
}

function largestNeighboringGroupColorInGrid(grid, row, col, fallbackColor, ignored = new Set()) {
  let bestColor = null;
  let bestSize = 0;

  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
    const nr = row + dr;
    const nc = col + dc;
    const key = `${nr},${nc}`;
    const cell = grid[nr]?.[nc];
    if (!cell || cell === 'U' || ignored.has(key)) return;
    const color = visibleColor(cell);
    const size = findColorComponentSizeInGrid(grid, nr, nc, color, ignored);
    if (size > bestSize) {
      bestSize = size;
      bestColor = color;
    }
  });

  return bestColor || fallbackColor;
}

function findShotRegionInGrid(grid, startR, startC, targetColor) {
  const queue = [[startR, startC]];
  const seen = new Set([`${startR},${startC}`]);
  const ordinary = [];
  const twos = [];

  while (queue.length) {
    const [r, c] = queue.shift();
    const cell = grid[r]?.[c];
    if (!cell || cell === 'U' || visibleColor(cell) !== targetColor) continue;

    if (isTwoColor(cell)) twos.push([r, c]);
    else if (isRemovableCell(cell)) ordinary.push([r, c]);

    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (!grid[nr] || typeof grid[nr][nc] === 'undefined' || seen.has(key)) return;
      if (visibleColor(grid[nr][nc]) !== targetColor) return;
      seen.add(key);
      queue.push([nr, nc]);
    });
  }

  return { ordinary, twos };
}

function connectedGroupCountInGrid(grid) {
  return collectConnectedGroupsInGrid(grid).length;
}

function simulateMatchingShotInGrid(grid, row, col) {
  const targetColor = visibleColor(grid[row]?.[col]);
  if (!targetColor || targetColor === 'U') return cloneGrid(grid);

  const next = cloneGrid(grid);
  const region = findShotRegionInGrid(next, row, col, targetColor);
  const ignoredTwos = new Set(region.twos.map(([r, c]) => `${r},${c}`));

  region.ordinary.forEach(([r, c]) => {
    next[r][c] = null;
  });
  region.twos.forEach(([r, c]) => {
    const oldColor = visibleColor(next[r][c]);
    next[r][c] = largestNeighboringGroupColorInGrid(next, r, c, oldColor || targetColor, ignoredTwos);
  });

  return region.ordinary.length > 0 ? applyGravityToGrid(next) : next;
}

function shotCandidatesForGrid(grid) {
  return collectConnectedGroupsInGrid(grid)
    .map((group) => {
      const ordinaryCount = group.filter(([r, c]) => isRemovableCell(grid[r][c])).length;
      const twoColorCount = group.filter(([r, c]) => isTwoColor(grid[r][c])).length;
      return { group, ordinaryCount, twoColorCount, size: group.length };
    })
    .filter((candidate) => candidate.ordinaryCount > 0 || candidate.twoColorCount > 0);
}

function chooseBestSimulatedShot(grid) {
  const candidates = shotCandidatesForGrid(grid);
  if (!candidates.length) return null;

  let best = null;
  candidates.forEach((candidate) => {
    const [row, col] = candidate.group[0];
    const simulatedGrid = simulateMatchingShotInGrid(grid, row, col);
    const remainingGroups = connectedGroupCountInGrid(simulatedGrid);
    const result = { ...candidate, row, col, simulatedGrid, remainingGroups };

    if (!best
      || result.size > best.size
      || (result.size === best.size && result.remainingGroups < best.remainingGroups)) {
      best = result;
    }
  });

  return best;
}

function estimateCompletionShotsForGrid(grid) {
  let simulationGrid = cloneGrid(grid);
  let shots = 0;
  const maxSimulationShots = Math.max(1, grid.length * (grid[0]?.length || 1) * 3);

  while (shots < maxSimulationShots) {
    const nextShot = chooseBestSimulatedShot(simulationGrid);
    if (!nextShot) break;
    simulationGrid = nextShot.simulatedGrid;
    shots += 1;
  }

  return shots;
}

function calculateRequiredShotsForGrid(grid) {
  return Math.max(1, estimateCompletionShotsForGrid(grid));
}

function calculateRequiredShotsForLevel(level, firstGrid = null) {
  const complications = level.complications || [];
  if (!Array.isArray(level.layers) || level.layers.length === 0) {
    return calculateRequiredShotsForGrid(firstGrid || level.grid);
  }

  return level.layers.reduce((total, layerGrid, idx) => {
    const grid = idx === 0 && firstGrid
      ? firstGrid
      : regenerateRandomSpecialBlocks(cloneGrid(layerGrid), complications, true);
    return total + calculateRequiredShotsForGrid(grid);
  }, 0);
}

function moveLimitForRequiredShots(requiredShots) {
  return Math.max(1, Math.ceil(requiredShots * 1.1));
}

function timerLimitForRequiredShots(requiredShots) {
  return Math.max(1, Math.ceil(requiredShots * 2 * 1.1));
}

function applyCalculatedLimitsToLevel(level, firstGrid = null) {
  const complications = level.complications || [];
  const needsMoveLimit = complications.includes('limited_shots') && level.maxShots === undefined;
  const needsTimerLimit = complications.includes('timer') && level.timerSeconds === undefined;
  if (!needsMoveLimit && !needsTimerLimit) return level;

  const requiredShots = calculateRequiredShotsForLevel(level, firstGrid);
  if (needsMoveLimit) level.maxShots = moveLimitForRequiredShots(requiredShots);
  if (needsTimerLimit) level.timerSeconds = timerLimitForRequiredShots(requiredShots);
  return level;
}

function resolveLevelLimits(level, firstGrid = null) {
  const complications = level.complications || [];
  const hasMoveLimit = complications.includes('limited_shots');
  const hasTimerLimit = complications.includes('timer');
  const needsMoveCalculation = hasMoveLimit && level.maxShots === undefined;
  const needsTimerCalculation = hasTimerLimit && level.timerSeconds === undefined;
  const requiredShots = needsMoveCalculation || needsTimerCalculation
    ? calculateRequiredShotsForLevel(level, firstGrid)
    : null;

  return {
    maxShots: hasMoveLimit
      ? (needsMoveCalculation ? moveLimitForRequiredShots(requiredShots) : level.maxShots)
      : Infinity,
    timerSeconds: hasTimerLimit
      ? (needsTimerCalculation ? timerLimitForRequiredShots(requiredShots) : level.timerSeconds)
      : Infinity,
  };
}

function normalizeRegenerableCells(grid, complications) {
  const shouldRegenerateAdditional = complications.includes('additional_colors');
  const shouldRegenerateUnbreakable = complications.includes('unbreakable_blocks');
  const shouldRegenerateTwoColor = complications.includes('two_colors_blocks');
  const shouldRegenerateFlashing = complications.includes('flashing_blocks');

  return grid.map((row) =>
    row.map((cell) => {
      if (shouldRegenerateUnbreakable && cell === 'U') return randomFrom(BASE_COLORS);
      if (shouldRegenerateAdditional && ADDITIONAL_COLORS.includes(visibleColor(cell))) return randomFrom(BASE_COLORS);
      if (shouldRegenerateTwoColor && isTwoColor(cell)) return visibleColor(cell);
      if (shouldRegenerateFlashing && isFlashing(cell)) return visibleColor(cell);
      return cell;
    })
  );
}

function applyRegenerableComplications(grid, complications) {
  let next = cloneGrid(grid);
  if (complications.includes('unbreakable_blocks')) next = withUnbreakableBlocks(next);
  if (complications.includes('additional_colors')) next = withAdditionalColors(next);
  if (complications.includes('two_colors_blocks')) next = withTwoColorBlocks(next);
  if (complications.includes('flashing_blocks')) next = withFlashingBlocks(next);
  return next;
}

function regenerateRandomSpecialBlocks(grid, complications, shouldRandomizeLayout = false) {
  let next = normalizeRegenerableCells(cloneGrid(grid), complications);
  if (shouldRandomizeLayout) next = randomizeGridLayout(next);
  return applyRegenerableComplications(next, complications);
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
    (cell) => Boolean(cell) && cell !== 'U' && !ADDITIONAL_COLORS.includes(visibleColor(cell)),
    COMPLICATION_RATIOS.two_colors_blocks
  );
  const levelPalette = [...new Set(next.flat().filter((c) => c && c !== 'U').map((c) => visibleColor(c)))]
    .filter((color) => !ADDITIONAL_COLORS.includes(color));
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
    (cell) => Boolean(cell) && cell !== 'U' && !isTwoColor(cell) && !ADDITIONAL_COLORS.includes(visibleColor(cell)),
    COMPLICATION_RATIOS.flashing_blocks
  );
  const levelPalette = [...new Set(next.flat().filter((c) => c && c !== 'U').map((c) => visibleColor(c)))]
    .filter((color) => !ADDITIONAL_COLORS.includes(color));
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
  return applyRegenerableComplications(baseGrid, complications);
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

    return applyCalculatedLimitsToLevel(level, primaryGrid);
  });
}

async function loadLevelsFromManifest(manifestUrl) {
  const manifestResponse = await fetch(manifestUrl);
  if (!manifestResponse.ok) {
    throw new Error(`Failed to load levels manifest: ${manifestUrl}`);
  }

  const levelFiles = await manifestResponse.json();
  if (!Array.isArray(levelFiles) || levelFiles.length === 0) {
    throw new Error(`Levels manifest is empty: ${manifestUrl}`);
  }

  const levels = await Promise.all(
    levelFiles.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load level file: ${url}`);
      return response.json();
    })
  );
  return levels.sort((a, b) => Number(a.level) - Number(b.level));
}

async function loadBuiltinLevelsFromFiles() {
  return loadLevelsFromManifest('levels/manifest.json');
}

async function loadMasterLevelsFromFiles() {
  return loadLevelsFromManifest('levels/master_levels/manifest.json');
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

  if (layersCount > 1) {
    level.layers = Array.from({ length: layersCount }, () => cloneGrid(baseGrid));
  }

  return applyCalculatedLimitsToLevel(level, baseGrid);
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
  model.levelBoosters = {};
  model.rainbowNextShot = false;
  model.gameplayActive = true;
  model.ineffectiveShotStreak = 0;
  model.winAwarded = false;
  closeFailModal();
  closeWinModal();
  model.gameOver = false;
  const customLimits = resolveLevelLimits(customLevel, model.grid);
  model.shotsLeft = customLimits.maxShots;
  model.timerLeft = customLimits.timerSeconds;
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

  const palette = getGridPalette(grid).filter((color) => !ADDITIONAL_COLORS.includes(color));

  if (complications.includes('two_colors_blocks')) {
    pickRandomCoords(
      grid,
      (cell) => Boolean(cell) && cell !== 'U' && !ADDITIONAL_COLORS.includes(visibleColor(cell)),
      COMPLICATION_RATIOS.two_colors_blocks
    ).forEach(([r, c]) => {
      grid[r][c] = `2${randomFrom(palette)}`;
    });
  }

  if (complications.includes('flashing_blocks')) {
    pickRandomCoords(
      grid,
      (cell) => Boolean(cell) && cell !== 'U' && !isTwoColor(cell) && !ADDITIONAL_COLORS.includes(visibleColor(cell)),
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

function findColorComponentSize(startR, startC, color, ignored = new Set()) {
  const queue = [[startR, startC]];
  const seen = new Set([`${startR},${startC}`]);
  let size = 0;

  while (queue.length) {
    const [r, c] = queue.shift();
    const key = `${r},${c}`;
    const cell = model.grid[r]?.[c];
    if (!cell || cell === 'U' || ignored.has(key) || visibleColor(cell) !== color) continue;
    size += 1;

    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      const nextKey = `${nr},${nc}`;
      if (!isInsideGrid(nr, nc) || seen.has(nextKey)) return;
      seen.add(nextKey);
      queue.push([nr, nc]);
    });
  }

  return size;
}

function largestNeighboringGroupColor(row, col, fallbackColor, ignored = new Set()) {
  let bestColor = null;
  let bestSize = 0;
  const checked = new Set();

  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
    const nr = row + dr;
    const nc = col + dc;
    const key = `${nr},${nc}`;
    const cell = model.grid[nr]?.[nc];
    if (!isInsideGrid(nr, nc) || !cell || cell === 'U' || ignored.has(key)) return;
    const color = visibleColor(cell);
    const componentKey = `${key}:${color}`;
    if (checked.has(componentKey)) return;
    checked.add(componentKey);
    const size = findColorComponentSize(nr, nc, color, ignored);
    if (size > bestSize) {
      bestSize = size;
      bestColor = color;
    }
  });

  return bestColor || fallbackColor;
}

function repaintTwoColorCells(twoCells, shotColor) {
  const ignored = new Set(twoCells.map(([r, c]) => `${r},${c}`));
  twoCells.forEach(([r, c]) => {
    const oldColor = visibleColor(model.grid[r][c]);
    model.grid[r][c] = largestNeighboringGroupColor(r, c, oldColor || shotColor, ignored);
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
  const shapeCells = model.currentLevel?.shapeGoal?.cells;
  if (Array.isArray(shapeCells) && shapeCells.length) {
    return shapeCells.every(([r, c]) => model.grid[r]?.[c] === 'U');
  }
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
  if (ui.gameTimerTopLabel) ui.gameTimerTopLabel.innerHTML = `<strong>TIMER:</strong> ${Number.isFinite(model.timerLeft) ? Math.max(0, Math.ceil(model.timerLeft)) : '∞'}`;
  ui.shotsLabel.textContent = `Выстрелы: ${Number.isFinite(model.shotsLeft) ? model.shotsLeft : '∞'}`;
  ui.timerLabel.textContent = `Таймер: ${Number.isFinite(model.timerLeft) ? Math.max(0, Math.ceil(model.timerLeft)) : '∞'}`;
  if (!model.gameOver) {
    ui.stateLabel.textContent = `Статус: игра идёт (цвет: ${model.selectedShotColor})`;
  }
  ui.shopBalanceLabel.textContent = `Баланс: ${model.totalScore}`;
}


function boosterCount(boosterKey) {
  if (IS_BUILDER_PAGE) return Number.MAX_SAFE_INTEGER;
  return Number(model.boosters[boosterKey] || 0) + Number(model.levelBoosters[boosterKey] || 0);
}

function consumeBooster(boosterKey) {
  if (IS_BUILDER_PAGE) return;
  if (Number(model.levelBoosters[boosterKey] || 0) > 0) {
    model.levelBoosters[boosterKey] -= 1;
    return;
  }
  model.boosters[boosterKey] = Math.max(0, Number(model.boosters[boosterKey] || 0) - 1);
  savePersistentState();
}

function renderBoosterInventory() {
  if (!ui.boosterInventoryList) return;
  ui.boosterInventoryList.innerHTML = '';
  BOOSTER_CATALOG.forEach((booster) => {
    const owned = boosterCount(booster.key);
    const li = document.createElement('li');
    if (BOOSTER_CATALOG.some((item) => item.key === booster.key)) {
      const label = model.activeBooster === booster.key ? 'Armed' : 'Use';
      const disabled = owned <= 0 ? 'disabled' : '';
      li.classList.toggle('armed', model.activeBooster === booster.key);
      const amountLabel = IS_BUILDER_PAGE ? '∞' : String(owned);
      const iconMap = { bomb: '💣', mix: '🌪️', fractions: '🧩', minusOneColor: '⛔', plusFiveShots: '+5', plusTenSeconds: '+10', compressor: '🗜️', rotator: '🔄', rainbow: '🌈' };
      li.innerHTML = `<span class="booster-icon">${iconMap[booster.key] || '✨'}</span><span><span class="booster-name">${booster.name.replace(' color', ' Color').replace('shots', 'Shots')}</span><span class="booster-count">${amountLabel}</span></span><button data-use-booster="${booster.key}" ${disabled} aria-label="${label} ${booster.name}">${label.toUpperCase()}</button>`;
      const btn = li.querySelector('button');
      btn.onclick = () => {
        if (owned <= 0) return;
        if (booster.key === 'plusTenSeconds' && boardScene) {
          boardScene.usePlusTenSeconds();
          return;
        }
        if (booster.key === 'compressor' && boardScene) {
          boardScene.useCompressor();
          return;
        }
        if (booster.key === 'minusOneColor' && boardScene) {
          boardScene.useMinusOneColor();
          return;
        }
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
  return { bomb: '💣', mix: '🌈', fractions: '🧩', minusOneColor: '-1', plusFiveShots: '+5', plusTenSeconds: '+10', compressor: '🗜️', rotator: '🔄', rainbow: '🌈' }[boosterKey] || '✨';
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

function cancelActiveGameplay() {
  if (!model.gameplayActive) return;
  model.gameplayActive = false;
  model.gameOver = true;
  model.timerLeft = Infinity;
  model.activeBooster = null;
  if (boardScene) boardScene.animating = false;
  closeFailModal();
}

function openShop() {
  cancelActiveGameplay();
  renderShopTable();
  refreshUI();
  ui.shopModal.classList.add('open');
  ui.shopModal.setAttribute('aria-hidden', 'false');
}

function closeShop() {
  ui.shopModal.classList.remove('open');
  ui.shopModal.setAttribute('aria-hidden', 'true');
}

function getColorGroupStats() {
  const seen = new Set();
  const stats = new Map();
  const rows = model.grid.length;
  const cols = model.grid[0]?.length || 0;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const key = `${r},${c}`;
      if (seen.has(key)) continue;
      const color = visibleColor(model.grid[r][c]);
      if (!color || color === 'U') {
        seen.add(key);
        continue;
      }

      const queue = [[r, c]];
      seen.add(key);
      let size = 0;
      while (queue.length) {
        const [cr, cc] = queue.shift();
        const cellColor = visibleColor(model.grid[cr][cc]);
        if (cellColor !== color) continue;
        size += 1;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
          const nr = cr + dr;
          const nc = cc + dc;
          const nKey = `${nr},${nc}`;
          if (isInsideGrid(nr, nc) && !seen.has(nKey) && visibleColor(model.grid[nr][nc]) === color) {
            seen.add(nKey);
            queue.push([nr, nc]);
          }
        });
      }

      const current = stats.get(color) || { color, largestGroup: 0, groupCount: 0 };
      current.largestGroup = Math.max(current.largestGroup, size);
      current.groupCount += 1;
      stats.set(color, current);
    }
  }

  return [...stats.values()];
}

function weightedPick(stats) {
  const totalWeight = stats.reduce((sum, item) => sum + item.largestGroup, 0);
  if (totalWeight <= 0) return randomFrom(stats.map((item) => item.color));
  let roll = Math.random() * totalWeight;
  for (const item of stats) {
    roll -= item.largestGroup;
    if (roll <= 0) return item.color;
  }
  return stats[stats.length - 1].color;
}

function strongestColorStats(stats) {
  const sorted = [...stats].sort((a, b) => b.largestGroup - a.largestGroup);
  const maxGroup = sorted[0]?.largestGroup || 0;
  return sorted.filter((item, idx) => idx < 3 && item.largestGroup >= Math.max(1, maxGroup * 0.75));
}

function pickNextShotColor() {
  const stats = getColorGroupStats();
  if (!stats.length) {
    model.selectedShotColor = 'R';
    return;
  }

  const previousColor = model.selectedShotColor;
  const usefulStats = stats.some((item) => item.largestGroup >= 2)
    ? stats.filter((item) => item.largestGroup >= 2)
    : stats;
  let availableStats = usefulStats.length > 1 ? usefulStats.filter((item) => item.color !== previousColor) : usefulStats;

  // Prefer repeating a useful color over switching to a color whose visible blocks are all isolated.
  if (!availableStats.length) availableStats = usefulStats;

  const strongStats = strongestColorStats(availableStats);
  const forceStrong = model.ineffectiveShotStreak >= 2;
  const shouldPickStrong = forceStrong || Math.random() < 0.7;
  const pickPool = shouldPickStrong && strongStats.length ? strongStats : availableStats;

  model.selectedShotColor = shouldPickStrong
    ? weightedPick(pickPool)
    : randomFrom(availableStats.map((item) => item.color));
}

function recordNormalShotOutcome(ordinaryRemoved) {
  if (ordinaryRemoved >= 2) {
    model.ineffectiveShotStreak = 0;
  } else {
    model.ineffectiveShotStreak += 1;
  }
}

class BoardScene extends Phaser.Scene {
  constructor() {
    super('board');
    const rows = model.grid.length || 1;
    const cols = model.grid[0]?.length || 1;
    const viewportWidth = window.innerWidth || 1200;
    const viewportHeight = window.innerHeight || 800;
    const maxBoardWidth = Math.min(1060, Math.max(280, viewportWidth - (viewportWidth <= 1400 ? 80 : 520)));
    const maxBoardHeight = Math.max(260, viewportHeight - 300);
    const fitByWidth = Math.floor(maxBoardWidth / cols);
    const fitByHeight = Math.floor(maxBoardHeight / rows);
    const minCell = viewportWidth < 600 ? 28 : 40;
    this.cell = Math.max(minCell, Math.min(104, fitByWidth, fitByHeight));
    this.gridX = 12;
    this.gridY = 12;
    this.playAreaHeight = Math.max(360, this.gridY * 2 + rows * this.cell + 150);
    this.blocks = new Map();
    this.animating = false;
    this.shooterX = 0;
    this.shooterY = 0;
    this.shooter = null;
    this.flashAccumulator = 0;
    this.pendingShotColor = null;
    this.pendingShotUsedBooster = false;
    this.targetZoneGraphics = null;
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

    this.drawTargetZoneOverlay();
    this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
  }

  drawTargetZoneOverlay() {
    if (this.targetZoneGraphics) this.targetZoneGraphics.destroy();
    const cells = model.currentLevel?.shapeGoal?.cells;
    if (!Array.isArray(cells) || !cells.length) return;

    const graphics = this.add.graphics().setDepth(80);
    graphics.lineStyle(3, 0xffffff, 0.95);
    cells.forEach(([r, c]) => {
      if (!Number.isInteger(r) || !Number.isInteger(c) || !model.grid[r] || typeof model.grid[r][c] === 'undefined') return;
      const x = this.gridX + c * this.cell;
      const y = this.gridY + r * this.cell;
      this.strokeDottedRect(graphics, x + 5, y + 5, this.cell - 10, this.cell - 10, 8, 6);
    });
    this.targetZoneGraphics = graphics;
  }

  strokeDottedRect(graphics, x, y, width, height, dash = 8, gap = 6) {
    const drawDottedLine = (x1, y1, x2, y2) => {
      const length = Phaser.Math.Distance.Between(x1, y1, x2, y2);
      const dx = (x2 - x1) / length;
      const dy = (y2 - y1) / length;
      for (let pos = 0; pos < length; pos += dash + gap) {
        const end = Math.min(pos + dash, length);
        graphics.lineBetween(x1 + dx * pos, y1 + dy * pos, x1 + dx * end, y1 + dy * end);
      }
    };
    drawDottedLine(x, y, x + width, y);
    drawDottedLine(x + width, y, x + width, y + height);
    drawDottedLine(x + width, y + height, x, y + height);
    drawDottedLine(x, y + height, x, y);
  }

  createBlock(r, c, code) {
    const { x, y } = this.gridToPixel(r, c);
    const rect = this.add.rectangle(x, y, this.cell - 2, this.cell - 2, COLOR_MAP[visibleColor(code)] || 0xffffff).setOrigin(0.5);
    if (isTwoColor(code)) rect.setStrokeStyle(3, 0xffffff);
    if (isFlashing(code)) rect.setStrokeStyle(3, 0x111111);
    return rect;
  }

  handlePointer(pointer) {
    if (this.animating || model.gameOver || !model.gameplayActive) return;

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
    if (model.activeBooster === 'rotator') {
      this.useRotator(row, col);
      return;
    }

    this.shootToCell(row, col);
  }

  finishResolvedBoardAction() {
    if (!model.gameplayActive || model.gameOver) return;

    if (isWin()) {
      if (model.currentLevel?.layers && model.currentLayerIndex < model.currentLevel.layers.length - 1) {
        model.currentLayerIndex += 1;
        model.grid = regenerateRandomSpecialBlocks(
          cloneGrid(model.currentLevel.layers[model.currentLayerIndex]),
          model.currentLevel.complications || [],
          true
        );
        this.renderGridStatic();
        ui.stateLabel.textContent = `Статус: слой ${model.currentLayerIndex + 1}/${model.currentLevel.layers.length}`;
      } else {
        model.gameOver = true;
        model.gameplayActive = false;
        closeFailModal();
        ui.stateLabel.textContent = 'Статус: победа';
        openWinModal();
      }
    } else if (Number.isFinite(model.shotsLeft) && model.shotsLeft <= 0) {
      failLevel('Статус: поражение (кончились выстрелы)');
    }

    if (!model.gameOver) {
      pickNextShotColor();
      model.rainbowNextShot = false;
      this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
    }
    refreshUI();
  }

  completeAction(removedKeys, gravityMoves) {
    this.animateRemovalAndFall(removedKeys, gravityMoves, () => {
      this.finishResolvedBoardAction();
      this.animating = false;
    });
  }

  useBombAt(row, col) {
    const bombs = boosterCount('bomb');
    if (bombs <= 0) return;

    this.animating = true;
    consumeBooster('bomb');
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
    const mixCount = boosterCount('mix');
    if (mixCount <= 0) return;

    this.animating = true;
    consumeBooster('mix');
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
    this.finishResolvedBoardAction();
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
    const fractionsCount = boosterCount('fractions');
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
    consumeBooster('fractions');
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
        this.finishResolvedBoardAction();
        this.animating = false;
        return;
      }

      const gravityMoves = applyGravityAndGetMoves();
      this.completeAction(removedKeys, gravityMoves);
    });
  }


  usePlusTenSeconds() {
    const count = boosterCount('plusTenSeconds');
    if (count <= 0) return;
    if (!Number.isFinite(model.timerLeft)) {
      ui.stateLabel.textContent = 'Статус: +10 Seconds доступен только на уровнях с таймером';
      refreshUI();
      return;
    }

    consumeBooster('plusTenSeconds');
    model.activeBooster = null;
    model.timerLeft += 10;
    savePersistentState();
    renderBoosterInventory();
    refreshUI();
  }

  useCompressor() {
    const count = boosterCount('compressor');
    if (count <= 0) return;
    const cols = model.grid[0].length;

    model.grid = model.grid.map((row) => {
      const blocks = row.filter(Boolean);
      const next = Array(cols).fill(null);
      const start = Math.floor((cols - blocks.length) / 2);
      blocks.forEach((cell, index) => {
        next[start + index] = cell;
      });
      return next;
    });

    consumeBooster('compressor');
    model.activeBooster = null;
    savePersistentState();
    this.renderGridStatic();
    renderBoosterInventory();
    this.finishResolvedBoardAction();
  }

  useRotator(row, col) {
    const count = boosterCount('rotator');
    if (count <= 0) return;
    if (row <= 0 || col <= 0 || row >= model.grid.length - 1 || col >= model.grid[0].length - 1) {
      ui.stateLabel.textContent = 'Статус: Rotator нужен полный квадрат 3×3';
      refreshUI();
      return;
    }

    const ring = [
      [row - 1, col - 1], [row - 1, col], [row - 1, col + 1], [row, col + 1],
      [row + 1, col + 1], [row + 1, col], [row + 1, col - 1], [row, col - 1],
    ];
    const values = ring.map(([r, c]) => model.grid[r][c]);
    ring.forEach(([r, c], idx) => {
      model.grid[r][c] = values[(idx + values.length - 1) % values.length];
    });

    this.animating = true;
    consumeBooster('rotator');
    model.activeBooster = null;
    savePersistentState();
    const gravityMoves = applyGravityAndGetMoves();
    this.animateRemovalAndFall([], gravityMoves, () => {
      renderBoosterInventory();
      this.finishResolvedBoardAction();
      this.animating = false;
    });
  }

  useMinusOneColor() {
    const count = boosterCount('minusOneColor');
    if (count <= 0) return;

    const chosenColor = model.selectedShotColor;
    if (!chosenColor) return;

    const removed = [];
    for (let r = 0; r < model.grid.length; r += 1) {
      for (let c = 0; c < model.grid[0].length; c += 1) {
        const cell = model.grid[r][c];
        if (!cell || cell === 'U') continue;
        if (visibleColor(cell) === chosenColor) removed.push([r, c]);
      }
    }
    if (removed.length === 0) {
      model.activeBooster = null;
      ui.stateLabel.textContent = `Статус: на поле нет блоков цвета ${chosenColor}`;
      renderBoosterInventory();
      refreshUI();
      return;
    }

    this.animating = true;
    consumeBooster('minusOneColor');
    model.activeBooster = null;
    renderBoosterInventory();

    const removedKeys = removed.map(([r, c]) => this.key(r, c));
    removed.forEach(([r, c]) => {
      model.grid[r][c] = null;
    });

    const earned = pointsForRemovedBlocks(removed.length);
    model.score += earned;

    ui.stateLabel.textContent = `Статус: -1 color удалил ${chosenColor}`;
    const gravityMoves = applyGravityAndGetMoves();
    this.completeAction(removedKeys, gravityMoves);
  }

  usePlusFiveShots() {
    const count = boosterCount('plusFiveShots');
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
    consumeBooster('plusFiveShots');
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
    if (!targetCode || targetCode === 'U') {
      if (!model.activeBooster) {
        if (Number.isFinite(model.shotsLeft)) {
          model.shotsLeft -= 1;
          if (model.shotsLeft < 0) model.shotsLeft = 0;
        }
        recordNormalShotOutcome(0);
        pickNextShotColor();
        this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
        refreshUI();
        if (Number.isFinite(model.shotsLeft) && model.shotsLeft <= 0) {
          failLevel('Статус: поражение (кончились выстрелы)');
        }
      }
      return;
    }

    if (model.activeBooster === 'rainbow') {
      const count = boosterCount('rainbow');
      if (count > 0) {
        consumeBooster('rainbow');
        model.activeBooster = null;
        model.rainbowNextShot = true;
        savePersistentState();
        renderBoosterInventory();
      }
    }

    const effectiveShotColor = model.rainbowNextShot ? visibleColor(targetCode) : model.selectedShotColor;
    this.pendingShotColor = effectiveShotColor;
    this.pendingShotUsedBooster = model.rainbowNextShot;

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
    if (!model.gameplayActive || model.gameOver) {
      this.animating = false;
      return;
    }

    const targetCode = model.grid[row][col];
    const shotColor = this.pendingShotColor || model.selectedShotColor;
    if (visibleColor(targetCode) !== shotColor) {
      if (!this.pendingShotUsedBooster) recordNormalShotOutcome(0);
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
      if (!this.pendingShotUsedBooster) recordNormalShotOutcome(0);
      pickNextShotColor();
      this.shooter.setFillStyle(COLOR_MAP[model.selectedShotColor]);
      refreshUI();
      this.animating = false;
      return;
    }

    if (!this.pendingShotUsedBooster) recordNormalShotOutcome(ordinaryGroup.length);

    const removedKeys = ordinaryGroup.map(([r, c]) => this.key(r, c));
    ordinaryGroup.forEach(([r, c]) => {
      model.grid[r][c] = null;
    });
    repaintTwoColorCells(twoColorGroup, shotColor);
    const earned = pointsForRemovedBlocks(ordinaryGroup.length);
    model.score += earned;

    if (ordinaryGroup.length === 0) {
      // Кластер состоял только из 2Color: поле не падает, просто перерисовываем.
      this.renderGridStatic();
      this.finishResolvedBoardAction();
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
    if (model.gameOver || !model.gameplayActive) return;

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
    if (model.activeLevelSet === 'main') {
      model.highestUnlockedLevel = Math.max(model.highestUnlockedLevel, Math.min(model.currentLevelIndex + 2, model.mainLevels.length));
    }
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
  if (!model.gameplayActive) return;
  model.gameplayActive = false;
  model.gameOver = true;
  ui.stateLabel.textContent = message;
  refreshUI();
  openFailModal();
}

function retryCurrentLevel() {
  closeFailModal();
  startLevelByIndex(model.currentLevelIndex || 0);
}

function setActiveLevelSet(levelSet) {
  model.activeLevelSet = levelSet === 'master' ? 'master' : 'main';
  model.levels = model.activeLevelSet === 'master' ? model.masterLevels : model.mainLevels;
  model.currentLevelIndex = Math.min(model.currentLevelIndex, Math.max(0, model.levels.length - 1));
  model.levelsPage = 0;
  populateLevelSelect();
  renderLevelsScreen();
}

function showStartScreen() {
  cancelActiveGameplay();
  if (ui.levelsScreen) ui.levelsScreen.hidden = true;
  if (ui.startScreen) ui.startScreen.hidden = false;
  document.body.classList.add('start-active');
}

function showLevelsScreen() {
  cancelActiveGameplay();
  model.levelsPage = Math.floor(Math.max(0, model.currentLevelIndex) / LEVELS_PER_PAGE);
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

const LEVELS_PER_PAGE = 40;

function renderLevelPagination(pageCount) {
  if (!ui.levelsDots) return;
  ui.levelsDots.innerHTML = '';
  if (pageCount <= 1) return;

  for (let page = 0; page < pageCount; page += 1) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `levels-dot${page === model.levelsPage ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Show levels page ${page + 1}`);
    dot.setAttribute('aria-current', page === model.levelsPage ? 'page' : 'false');
    dot.onclick = () => {
      model.levelsPage = page;
      renderLevelsScreen();
    };
    ui.levelsDots.appendChild(dot);
  }
}

function renderLevelsScreen() {
  if (!ui.levelsGrid) return;
  const isMaster = model.activeLevelSet === 'master';
  const totalSlots = isMaster ? model.masterLevels.length : 100;
  const pageCount = Math.max(1, Math.ceil(totalSlots / LEVELS_PER_PAGE));
  model.levelsPage = Math.min(Math.max(0, model.levelsPage || 0), pageCount - 1);
  const selectedLevel = Math.min(model.currentLevelIndex + 1, Math.max(1, totalSlots));
  const unlockedThrough = isMaster ? model.masterLevels.length : Math.min(model.highestUnlockedLevel, model.mainLevels.length || 0);
  const pageStart = model.levelsPage * LEVELS_PER_PAGE + 1;
  const pageEnd = Math.min(totalSlots, pageStart + LEVELS_PER_PAGE - 1);

  if (ui.mainLevelsTab) {
    ui.mainLevelsTab.classList.toggle('active', !isMaster);
    ui.mainLevelsTab.setAttribute('aria-selected', String(!isMaster));
  }
  if (ui.masterLevelsTab) {
    ui.masterLevelsTab.classList.toggle('active', isMaster);
    ui.masterLevelsTab.setAttribute('aria-selected', String(isMaster));
  }

  ui.levelsGrid.innerHTML = '';

  for (let levelNumber = pageStart; levelNumber <= pageEnd; levelNumber += 1) {
    const isAvailable = levelNumber <= model.levels.length;
    const isUnlocked = isAvailable && levelNumber <= unlockedThrough;
    const isSelected = levelNumber === selectedLevel && isUnlocked;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}${isSelected ? ' selected' : ''}`;
    card.setAttribute('aria-label', isUnlocked ? `Start ${isMaster ? 'master ' : ''}level ${levelNumber}` : `Level ${levelNumber} locked`);
    card.disabled = !isUnlocked;

    const number = document.createElement('span');
    number.className = 'level-number';
    number.textContent = String(levelNumber);
    card.appendChild(number);

    const meta = document.createElement('span');
    if (isUnlocked) {
      meta.className = 'level-stars';
      meta.textContent = '★★★';
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

  renderLevelPagination(pageCount);
}

function initPhaser(rows, cols) {
  if (phaserGame) phaserGame.destroy(true);
  const viewportWidth = window.innerWidth || 1200;
  const viewportHeight = window.innerHeight || 800;
  const maxBoardWidth = Math.min(1060, Math.max(280, viewportWidth - (viewportWidth <= 1400 ? 80 : 520)));
  const maxBoardHeight = Math.max(260, viewportHeight - 300);
  const fitByWidth = Math.floor(maxBoardWidth / cols);
  const fitByHeight = Math.floor(maxBoardHeight / rows);
  const minCell = viewportWidth < 600 ? 28 : 40;
  const cell = Math.max(minCell, Math.min(104, fitByWidth, fitByHeight));
  const width = cols * cell + 24;
  const height = Math.max(360, 24 + rows * cell + 150);
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
  const sourceGrid = cloneGrid(level.layers ? level.layers[0] : level.grid);
  model.grid = level.randomize === false
    ? sourceGrid
    : regenerateRandomSpecialBlocks(sourceGrid, level.complications || [], true);
  model.score = 0;
  model.activeBooster = null;
  model.levelBoosters = { ...(level.startingBoosters || {}) };
  model.rainbowNextShot = false;
  model.gameplayActive = true;
  model.ineffectiveShotStreak = 0;
  model.winAwarded = false;
  closeFailModal();
  closeWinModal();
  model.gameOver = false;
  const limits = resolveLevelLimits(level, model.grid);
  model.shotsLeft = limits.maxShots;
  model.timerLeft = limits.timerSeconds;
  model.selectedShotColor = getBreakableColors(model.grid)[0] || 'R';
  pickNextShotColor();

  initPhaser(model.grid.length, model.grid[0].length);
  renderBoosterInventory();
  refreshUI();
}

async function initApp() {
  loadPersistentState();
  try {
    model.mainLevels = await loadBuiltinLevelsFromFiles();
  } catch {
    model.mainLevels = buildBuiltinLevels();
  }
  try {
    model.masterLevels = await loadMasterLevelsFromFiles();
  } catch {
    model.masterLevels = [];
  }
  model.levels = model.mainLevels;
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
  if (ui.mainLevelsTab) ui.mainLevelsTab.onclick = () => setActiveLevelSet('main');
  if (ui.masterLevelsTab) ui.masterLevelsTab.onclick = () => setActiveLevelSet('master');
  if (ui.levelsShopBtn) ui.levelsShopBtn.onclick = () => openShop();
  if (ui.levelsPlusBtn) ui.levelsPlusBtn.onclick = () => openShop();
  if (ui.gameHomeBtn) ui.gameHomeBtn.onclick = () => showLevelsScreen();
  if (ui.gamePlusBtn) ui.gamePlusBtn.onclick = () => openShop();
  if (ui.failHomeBtn) ui.failHomeBtn.onclick = () => { closeFailModal(); showLevelsScreen(); };
  if (ui.failRetryBtn) ui.failRetryBtn.onclick = () => retryCurrentLevel();
  if (ui.winHomeBtn) ui.winHomeBtn.onclick = () => { closeWinModal(); showLevelsScreen(); };
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
