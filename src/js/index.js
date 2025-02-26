import { createBoardElements, createBoard, setMarkTile, revealTile, checkWin, checkLose, TILE_STATES, playSound, SOUNDS_SOURCES, createScoreTable, GAME_SETTINGS } from "./minesweeper";
import "@css/style.css";

const body = document.body;
startGame();

export function startGame(withSound = false) {
  const { title, subtext, flags, boardElement, restartButton, moves, timer, scoreButton, scoreTable, complexityButton, themeButton, soundsButton } = createBoardElements();
  createMinesweeper({ title, subtext, flags, boardElement, restartButton, moves, timer, scoreButton, scoreTable, complexityButton, themeButton, soundsButton });

  const board = createBoard();
  const movesCounter = document.querySelector(".moves-counter");
  const scoreTableElement = document.querySelector(".score-table");

  movesCounter.textContent = 0;
  clearTimeout(GAME_SETTINGS.timerID);
  GAME_SETTINGS.timerID = 0;
  GAME_SETTINGS.currentMode = GAME_SETTINGS.gameComplexity;
  GAME_SETTINGS.isFirstMove = true;

  boardElement.style.setProperty("--size", GAME_SETTINGS.boardSize);
  board.forEach((row) => {
    row.forEach((tile) => {
      tile.element.addEventListener("click", (e) => {
        if (tile.status === TILE_STATES.HIDDEN) {
          movesCounter.textContent = +movesCounter.textContent + 1;
        }

        if (!GAME_SETTINGS.timerID) {
          startTimer();
        }

        const withSound = true;
        revealTile(board, tile, withSound);
        checkGameEnd(board, boardElement, subtext);
      });
      tile.element.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        setMarkTile(tile, true);
        getRestMinesCount(board, subtext);
      });
      boardElement.append(tile.element);
    });
  });

  restartButton.addEventListener("click", () => startGame(true));
  scoreButton.addEventListener("click", () => scoreTableElement.classList.toggle("active"));

  if (withSound) {
    playSound(SOUNDS_SOURCES.START);
  }

  return board;
}

function getRestMinesCount(board, subtext) {
  const markedTilesCount = board.reduce((count, row) => {
    return count + row.filter((tile) => tile.status === TILE_STATES.MARKED).length;
  }, 0);

  subtext.textContent = `Mines: ${GAME_SETTINGS.minesOnBoard - markedTilesCount}`;
}

function checkGameEnd(board, boardElement) {
  const win = checkWin(board);
  const lose = checkLose(board);
  const counters = document.querySelector(".counters");

  if (win || lose) {
    boardElement.addEventListener("click", stopProp, { capture: true });
    boardElement.addEventListener("contextmenu", stopProp, { capture: true });

    clearTimeout(GAME_SETTINGS.timerID);
  }

  if (win) {
    const time = document.querySelector(".time").textContent;
    const moves = document.querySelector(".moves-counter").textContent;
    const complexity = GAME_SETTINGS.currentMode;
    const stats = { complexity, time, moves };
    saveScore(stats);

    counters.innerHTML = "You Win 🥳";
    setTimeout(() => playSound(SOUNDS_SOURCES.WIN), 100);

    board.forEach((row) => {
      row.forEach((tile) => {
        if (tile.status !== TILE_STATES.HIDDEN) {
          return;
        }
        setMarkTile(tile);
      });
    });
  }

  if (lose) {
    counters.innerHTML = "😈 BOOM 😈";
    playSound(SOUNDS_SOURCES.LOSE);
    board.forEach((row) => {
      row.forEach((tile) => {
        if (tile.status === TILE_STATES.MARKED && !tile.mine) {
          const withSound = false;
          revealTile(board, tile, withSound, lose);
        }

        if (tile.status !== TILE_STATES.HIDDEN) {
          return;
        }

        revealTile(board, tile);
      });
    });
  }
  return win || lose;
}

function stopProp(e) {
  e.stopImmediatePropagation();
}

function startTimer() {
  const time = document.querySelector(".time");

  GAME_SETTINGS.timerID = setTimeout(function tick() {
    time.textContent = +time.textContent + 1;
    GAME_SETTINGS.timerID = setTimeout(tick, 1000);
  }, 1000);
}

function saveScore(score) {
  const scoreTable = Array.from(JSON.parse(localStorage.getItem("results")) || []);
  const scoreTableElement = document.querySelector(".score-table");

  if (scoreTable.length === 10) {
    scoreTable.pop();
  }

  scoreTable.unshift(score);
  localStorage.setItem("results", JSON.stringify(scoreTable));

  const newScores = createScoreTable(createScoreTable);
  scoreTableElement.innerHTML = "";

  newScores.map((item) => scoreTableElement.append(item));
}

function createMinesweeper(elements) {
  const { title, subtext, flags, boardElement, restartButton, moves, timer, scoreButton, scoreTable, complexityButton, themeButton, soundsButton } = elements;
  body.innerHTML = "";

  const counters = document.createElement("div");
  counters.classList.add("counters");
  counters.append(subtext, flags);

  const buttons = document.createElement("div");
  buttons.classList.add("buttons");
  buttons.append(restartButton, complexityButton, scoreButton, themeButton, soundsButton);

  const gameInfo = document.createElement("div");
  gameInfo.classList.add("info");
  gameInfo.append(timer, moves);

  body.append(title, counters, gameInfo, buttons, scoreTable, boardElement);
}
