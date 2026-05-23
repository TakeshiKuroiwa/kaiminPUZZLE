import type { BlockData, BoardData, BlockColor, Difficulty } from '../types';

export const BOARD_ROWS = 12;
export const BOARD_COLS = 10;

const COLORS: BlockColor[] = ['red', 'blue', 'yellow', 'green', 'purple'];

// Random ID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

const isValidPos = (x: number, y: number, rows: number, cols: number) => {
  return x >= 0 && x < cols && y >= 0 && y < rows;
};

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const createEmptyBoard = (rows: number, cols: number): BoardData => {
  const board: BoardData = [];
  for (let y = 0; y < rows; y++) {
    const row: BlockData[] = [];
    for (let x = 0; x < cols; x++) {
      row.push({
        id: generateId(),
        type: 'normal',
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        x,
        y,
        isFalling: false,
        isRemoving: false,
        isEmpty: false,
      });
    }
    board.push(row);
  }
  return board;
};

const assignSpecials = (board: BoardData, type: 'kaimin' | 'rainbow', count: number) => {
  const positions: {x:number;y:number}[] = [];
  const rows = board.length;
  const cols = board[0].length;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      positions.push({x, y});
    }
  }
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let assigned = 0;
  for (const pos of positions) {
    if (assigned >= count) break;
    const block = board[pos.y][pos.x];
    if (block.type === 'normal') {
      block.type = type;
      assigned += 1;
    }
  }
};

const validateMatch = (board: BoardData, matches: {x:number;y:number}[]) => {
  const normalPieces = matches.filter(pos => board[pos.y][pos.x].type !== 'rainbow');
  const hasRainbow = matches.some(pos => board[pos.y][pos.x].type === 'rainbow');

  if (hasRainbow) {
    return normalPieces.length >= 2 && matches.length >= 3;
  }
  return matches.length >= 2;
};

const floodFillMatches = (board: BoardData, startX: number, startY: number, targetColor: BlockColor) => {
  const rows = board.length;
  const cols = board[0].length;
  const visited = new Set<string>();
  const matches: {x:number;y:number}[] = [];
  const queue: {x:number;y:number}[] = [{x: startX, y: startY}];

  visited.add(`${startX},${startY}`);

  while (queue.length > 0) {
    const {x, y} = queue.shift()!;
    const block = board[y][x];
    if (block.isEmpty || block.isRemoving || block.type === 'kaimin') continue;
    if (block.type !== 'rainbow' && block.color !== targetColor) continue;

    matches.push({x, y});

    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (isValidPos(nx, ny, rows, cols) && !visited.has(key)) {
        const neighbor = board[ny][nx];
        if (neighbor.isEmpty || neighbor.isRemoving || neighbor.type === 'kaimin') continue;
        if (neighbor.type === 'rainbow' || neighbor.color === targetColor) {
          visited.add(key);
          queue.push({x: nx, y: ny});
        }
      }
    }
  }

  return matches;
};

export const generateBoard = (
  rows: number = BOARD_ROWS,
  cols: number = BOARD_COLS,
  difficulty: Difficulty = 'easy'
): BoardData => {
  let board = createEmptyBoard(rows, cols);

  const makeBoard = () => {
    board = createEmptyBoard(rows, cols);
    if (difficulty === 'veryhard') {
      return;
    }

    if (difficulty === 'hard') {
      assignSpecials(board, 'kaimin', 1);
      assignSpecials(board, 'rainbow', 1);
      return;
    }

    if (difficulty === 'normal') {
      const kaiminCount = getRandomInt(1, 4);
      const remainingMin = Math.max(1, 6 - kaiminCount);
      const rainbowCount = getRandomInt(remainingMin, Math.min(4, 6 - kaiminCount + 3));
      assignSpecials(board, 'kaimin', kaiminCount);
      assignSpecials(board, 'rainbow', rainbowCount);
      return;
    }

    const kaiminCount = getRandomInt(5, 8);
    const rainbowCount = getRandomInt(5, 8);
    assignSpecials(board, 'kaimin', kaiminCount);
    assignSpecials(board, 'rainbow', rainbowCount);
  };

  makeBoard();

  let attempts = 0;
  while (!hasValidMoves(board) && attempts < 50) {
    makeBoard();
    attempts += 1;
  }

  return board;
};

export const findMatches = (board: BoardData, startX: number, startY: number): {x: number, y: number}[] => {
  const rows = board.length;
  const cols = board[0].length;
  const startBlock = board[startY][startX];

  if (startBlock.isEmpty || startBlock.isRemoving) return [];

  if (startBlock.type === 'kaimin') {
    const matches: {x:number;y:number}[] = [];
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = startX + dx;
        const ny = startY + dy;
        if (!isValidPos(nx, ny, rows, cols)) continue;
        if (dx === 0 && dy === 0) {
          matches.push({x: nx, y: ny});
          continue;
        }
        const neighbor = board[ny][nx];
        if (neighbor.type !== 'kaimin') {
          matches.push({x: nx, y: ny});
        }
      }
    }
    return matches;
  }

  if (startBlock.type === 'rainbow') {
    let bestMatch: {x:number;y:number}[] = [];
    for (const color of COLORS) {
      const group = floodFillMatches(board, startX, startY, color);
      if (validateMatch(board, group) && group.length > bestMatch.length) {
        bestMatch = group;
      }
    }
    return bestMatch;
  }

  const matches = floodFillMatches(board, startX, startY, startBlock.color);
  if (!validateMatch(board, matches)) {
    return [];
  }

  return matches;
};

export const applyGravityAndShift = (board: BoardData): { newBoard: BoardData, hasChanged: boolean } => {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard: BoardData = board.map(row => row.map(block => ({...block})));
  let hasChanged = false;

  for (let x = 0; x < cols; x++) {
    let emptyCount = 0;
    for (let y = rows - 1; y >= 0; y--) {
      if (newBoard[y][x].isEmpty) {
        emptyCount++;
      } else if (emptyCount > 0) {
        newBoard[y + emptyCount][x] = { ...newBoard[y][x], y: y + emptyCount, isFalling: true };
        newBoard[y][x] = {
          id: generateId(), type: 'empty', color: 'none', x, y, isFalling: false, isRemoving: false, isEmpty: true
        };
        hasChanged = true;
      } else {
        newBoard[y][x].isFalling = false;
      }
    }
  }

  let emptyColsShift = 0;
  for (let x = 0; x < cols; x++) {
    let isColEmpty = true;
    for (let y = 0; y < rows; y++) {
      if (!newBoard[y][x].isEmpty) {
        isColEmpty = false;
        break;
      }
    }
    if (isColEmpty) {
      emptyColsShift++;
    } else if (emptyColsShift > 0) {
      for (let y = 0; y < rows; y++) {
        newBoard[y][x - emptyColsShift] = { ...newBoard[y][x], x: x - emptyColsShift, isFalling: true };
        newBoard[y][x] = {
          id: generateId(), type: 'empty', color: 'none', x, y, isFalling: false, isRemoving: false, isEmpty: true
        };
      }
      hasChanged = true;
    }
  }

  return { newBoard, hasChanged };
};

export const hasValidMoves = (board: BoardData): boolean => {
  const rows = board.length;
  const cols = board[0].length;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const block = board[y][x];
      if (block.isEmpty) continue;
      if (block.type === 'kaimin') return true;
      const matches = findMatches(board, x, y);
      if (matches.length > 0) return true;
    }
  }
  return false;
};

export const isBoardEmpty = (board: BoardData): boolean => {
  return board.every(row => row.every(block => block.isEmpty));
};
