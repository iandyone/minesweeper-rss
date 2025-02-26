import { startGame } from ".";

const audio = new Audio();

export const TILE_STATES = {
  HIDDEN: "hidden",
  NUMBER: "number",
  MARKED: "marked",
  MINE: "mine",
  MARKED_WRONG: "marked-wrong",
};

export const SOUNDS_SOURCES = {
  START: "./assets/sounds/start.mp3",
  CLICK: "./assets/sounds/click.mp3",
  MARK: "./assets/sounds/mark.mp3",
  LOSE: "./assets/sounds/lose.mp3",
  WIN: "./assets/sounds/win.mp3",
};

export const COMPLEXITY = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
};

export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
};

export const GAME_SETTINGS = {
  gameComplexity: COMPLEXITY.EASY,
  currentMode: COMPLEXITY.EASY,
  theme: THEMES.DARK,
  sounds: true,
  minesOnBoard: 10,
  boardSize: 10,
  timerID: 0,
  isFirstMove: true,
  firstMoveTile: { x: -1, y: -1 },
};

export function createBoardElements() {
  // Title
  const title = document.createElement("h1");
  title.classList.add("title");
  title.innerHTML = "💣 Minesweeper 💣";

  // Subtext
  const subtext = document.createElement("div");
  subtext.classList.add("subtext");
  subtext.dataset.mineCount = GAME_SETTINGS.minesOnBoard;
  subtext.innerHTML = `Mines: ${GAME_SETTINGS.minesOnBoard}`;

  // Flags
  const flags = document.createElement("div");
  flags.classList.add("flags-counter");
  flags.innerHTML = 'Flags: <span class="flags">0</span>';

  // Board
  const boardElement = document.createElement("div");
  boardElement.className = `board ${GAME_SETTINGS.gameComplexity}`;
  boardElement.addEventListener("contextmenu", (e) => e.preventDefault());

  // Moves counter
  const moves = document.createElement(`div`);
  moves.classList.add("moves");
  moves.innerHTML = 'Moves: <span class="moves-counter">0</span>';

  // Restart button
  const restartButton = document.createElement("button");
  restartButton.classList.add("restart-button");
  restartButton.innerHTML = "New Game";

  // Complexity button
  const complexityButton = document.createElement("div");
  complexityButton.classList.add("complexity-button");
  complexityButton.innerHTML = `Complexity: <span class="complexity">${GAME_SETTINGS.gameComplexity}</span>`;
  complexityButton.addEventListener("click", setComplexity);

  // Theme button
  const themeButton = document.createElement("div");
  themeButton.classList.add("theme-button");
  themeButton.innerHTML = `Theme: <span class="theme">${GAME_SETTINGS.theme}</span>`;
  themeButton.addEventListener("click", changeTheme);

  // Sounds button
  const soundsButton = document.createElement("div");
  soundsButton.classList.add("sounds-button");
  soundsButton.innerHTML = `Sounds: <span class="sounds">${GAME_SETTINGS.sounds ? "on" : "off"}</span>`;
  soundsButton.addEventListener("click", setSounds);

  // Timer
  const timer = document.createElement("div");
  timer.classList.add("timer");
  timer.innerHTML = 'Time: <span class="time">0</span>';

  // Scores
  const data = createScoreTable();
  const scoreButton = document.createElement("button");
  const scoreTable = document.createElement("div");
  scoreButton.classList.add("score-button");
  scoreTable.classList.add("score-table");
  scoreButton.textContent = "Last 10 results";
  data.map((item) => scoreTable.append(item));

  return { title, subtext, flags, boardElement, moves, restartButton, timer, scoreButton, scoreTable, complexityButton, themeButton, soundsButton };
}

export function createBoard() {
  const board = [];
  const minePositions = getMinePositions(GAME_SETTINGS.boardSize, GAME_SETTINGS.minesOnBoard);

  for (let x = 0; x < GAME_SETTINGS.boardSize; ++x) {
    const row = [];

    for (let y = 0; y < GAME_SETTINGS.boardSize; ++y) {
      const element = document.createElement("div");
      const tile = {
        x,
        y,
        element,
        mine: minePositions.some(isPositionMatch.bind(null, { x, y })),
        get status() {
          return this.element.dataset.status;
        },

        set status(value) {
          this.element.dataset.status = value;
        },
      };

      if (tile.x === GAME_SETTINGS.firstMoveTile.x && tile.y === GAME_SETTINGS.firstMoveTile.y) {
        element.dataset.status = TILE_STATES.NUMBER;
      } else {
        element.dataset.status = TILE_STATES.HIDDEN;
      }

      element.classList.add("tile");
      row.push(tile);
    }

    board.push(row);
  }

  return board;
}

export function setMarkTile(tile, withSound) {
  const flags = document.querySelector(".flags");

  if (tile.status !== TILE_STATES.HIDDEN && tile.status !== TILE_STATES.MARKED) {
    return;
  }

  if (withSound === true) {
    playSound(SOUNDS_SOURCES.MARK);
  }

  if (tile.status === TILE_STATES.HIDDEN) {
    tile.status = TILE_STATES.MARKED;
    if (flags) flags.textContent = +flags.textContent + 1;
    return;
  }

  if (tile.status === TILE_STATES.MARKED) {
    tile.status = TILE_STATES.HIDDEN;
    if (flags) flags.textContent = +flags.textContent - 1;
    return;
  }
}

export function revealTile(board, tile, withSound = false, isLose = false) {
  if (GAME_SETTINGS.isFirstMove && tile.mine) {
    GAME_SETTINGS.firstMoveTile = { x: tile.x, y: tile.y };
    const newBoard = startGame();
    const firstMoveTile = getFitstMoveTile(newBoard);
    const adjacentTiles = countTilesNearby(newBoard, tile);
    const mines = adjacentTiles.filter((t) => t.mine);
    tile.status = TILE_STATES.NUMBER;

    if (mines.length === 0) {
      adjacentTiles.forEach(revealTile.bind(null, newBoard));
    } else {
      updateTileContent(firstMoveTile, mines.length);
    }

    playSound(SOUNDS_SOURCES.CLICK);
    GAME_SETTINGS.isFirstMove = false;
    return;
  }

  if (isLose === true && !tile.mine && tile.status === TILE_STATES.MARKED) {
    const adjacentTiles = countTilesNearby(board, tile);
    const mines = adjacentTiles.filter((t) => t.mine);

    tile.status = TILE_STATES.MARKED_WRONG;
    updateTileContent(tile, mines.length);
    return;
  }

  if (tile.status !== TILE_STATES.HIDDEN || tile.status === TILE_STATES.MARKED) {
    return;
  }

  if (tile.mine) {
    tile.status = TILE_STATES.MINE;
    return;
  }

  const adjacentTiles = countTilesNearby(board, tile);
  const mines = adjacentTiles.filter((t) => t.mine);
  tile.status = TILE_STATES.NUMBER;

  if (mines.length === 0) {
    adjacentTiles.forEach(revealTile.bind(null, board));
  } else {
    updateTileContent(tile, mines.length);
  }

  if (withSound === true) {
    playSound(SOUNDS_SOURCES.CLICK);
  }

  GAME_SETTINGS.isFirstMove = false;
}

export function checkWin(board) {
  return board.every((row) => {
    return row.every((tile) => {
      return tile.status === TILE_STATES.NUMBER || (tile.mine && (tile.status === TILE_STATES.HIDDEN || tile.status === TILE_STATES.MARKED));
    });
  });
}

export function checkLose(board) {
  return board.some((row) => {
    return row.some((tile) => {
      return tile.status === TILE_STATES.MINE;
    });
  });
}

export function createScoreTable() {
  const results = Array.from(JSON.parse(localStorage.getItem("results")) || []);
  const tableData = [];

  results.map((result, index) => {
    const resultItem = document.createElement("pre");
    resultItem.classList.add("result");
    resultItem.innerHTML = `<span>${index + 1}.${index + 1 < 10 ? "  " : " "}Mode: ${result.complexity}</span><span>Time - ${result.time}</span><span>Moves - ${result.moves}</span>`;
    tableData.push(resultItem);
  });

  return tableData;
}

export function playSound(sourse) {
  if(GAME_SETTINGS.sounds) {
    audio.src = sourse;
    audio.play();
  }
}

function getMinePositions() {
  const positions = [];

  while (positions.length < GAME_SETTINGS.minesOnBoard) {
    const position = {
      x: getRandomNumber(GAME_SETTINGS.boardSize),
      y: getRandomNumber(GAME_SETTINGS.boardSize),
    };
    const isFirstMoveLose = GAME_SETTINGS.isFirstMove && GAME_SETTINGS.firstMoveTile.x === position.x && GAME_SETTINGS.firstMoveTile.y === position.y;

    if (!positions.some(isPositionMatch.bind(null, position)) && !isFirstMoveLose) {
      positions.push(position);
    }
  }
  GAME_SETTINGS.isFirstMove = false;
  return positions;
}

function isPositionMatch(a, b) {
  return a.x === b.x && a.y === b.y;
}

function getRandomNumber(size) {
  return Math.floor(Math.random() * size);
}

function countTilesNearby(board, { x, y }) {
  const tiles = [];

  for (let xOffset = -1; xOffset <= 1; xOffset++) {
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      const tile = board[x + xOffset]?.[y + yOffset];

      if (tile) {
        tiles.push(tile);
      }
    }
  }
  return tiles;
}

function setComplexity() {
  const complexity = document.querySelector(".complexity");

  if (complexity.textContent === COMPLEXITY.EASY) {
    complexity.textContent = COMPLEXITY.MEDIUM;
    GAME_SETTINGS.gameComplexity = COMPLEXITY.MEDIUM;
    GAME_SETTINGS.boardSize = 15;
    GAME_SETTINGS.minesOnBoard = 40;
    return;
  }
  if (complexity.textContent === COMPLEXITY.MEDIUM) {
    complexity.textContent = COMPLEXITY.HARD;
    GAME_SETTINGS.gameComplexity = COMPLEXITY.HARD;
    GAME_SETTINGS.boardSize = 25;
    GAME_SETTINGS.minesOnBoard = 99;
    return;
  }
  if (complexity.textContent === COMPLEXITY.HARD) {
    complexity.textContent = COMPLEXITY.EASY;
    GAME_SETTINGS.gameComplexity = COMPLEXITY.EASY;
    GAME_SETTINGS.boardSize = 10;
    GAME_SETTINGS.minesOnBoard = 10;
    return;
  }
}

function updateTileContent(tile, count) {
  if (count) {
    tile.element.textContent = count;
    tile.element.classList.add(`mines-${count}`);
  }
}

function changeTheme() {
  const body = document.body;
  const button = document.querySelector(".theme");
  console.log(1);

  if (GAME_SETTINGS.theme === THEMES.LIGHT) {
    body.classList.remove(THEMES.LIGHT);
    body.classList.add(THEMES.DARK);
    GAME_SETTINGS.theme = THEMES.DARK;
    button.textContent = `${GAME_SETTINGS.theme}`;
    return;
  }

  if (GAME_SETTINGS.theme === THEMES.DARK) {
    body.classList.remove(THEMES.DARK);
    body.classList.add(THEMES.LIGHT);
    GAME_SETTINGS.theme = THEMES.LIGHT;
    button.textContent = `${GAME_SETTINGS.theme}`;
    return;
  }
}

function getFitstMoveTile(board) {
  let firstMoveTile;

  Array.from(board).forEach((row) => {
    row.forEach((tile) => {
      if (tile.x === GAME_SETTINGS.firstMoveTile.x && tile.y === GAME_SETTINGS.firstMoveTile.y) {
        firstMoveTile = tile;
      }
    });
  });

  GAME_SETTINGS.firstMoveTile = { x: -1, y: -1 };

  return firstMoveTile;
}

function setSounds() {
  const soundsButton = document.querySelector(".sounds");
  GAME_SETTINGS.sounds = !GAME_SETTINGS.sounds;

  soundsButton.textContent = GAME_SETTINGS.sounds ? "on" : "off";
}

