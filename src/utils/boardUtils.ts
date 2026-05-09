import type { BlockData, BoardData, BlockColor } from '../types';

export const BOARD_ROWS = 12;
export const BOARD_COLS = 10;

const COLORS: BlockColor[] = ['red', 'blue', 'yellow', 'green', 'purple'];

// Random ID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

export const generateBoard = (rows: number = BOARD_ROWS, cols: number = BOARD_COLS): BoardData => {
  const board: BoardData = [];
  for (let y = 0; y < rows; y++) {
    const row: BlockData[] = [];
    for (let x = 0; x < cols; x++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      // Determine type based on probability
      let type: BlockType = 'normal';
      const rand = Math.random();
      if (rand < 0.03) {
        type = 'kaimin'; // 3% chance
      } else if (rand < 0.05) {
        type = 'rainbow'; // 2% chance
      }

      row.push({
        id: generateId(),
        type,
        color,
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

// Check if coordinates are valid
const isValidPos = (x: number, y: number, rows: number, cols: number) => {
  return x >= 0 && x < cols && y >= 0 && y < rows;
};

// Flood fill to find adjacent blocks of the same color
export const findMatches = (board: BoardData, startX: number, startY: number): {x: number, y: number}[] => {
  const rows = board.length;
  const cols = board[0].length;
  const startBlock = board[startY][startX];

  if (startBlock.isEmpty || startBlock.isRemoving) return [];

  const targetColor = startBlock.color;
  // If we clicked a kaimin block, return surrounding area or special effect
  if (startBlock.type === 'kaimin') {
      // Example: 3x3 explosion
      const matches: {x:number, y:number}[] = [];
      for(let dy=-1; dy<=1; dy++) {
          for(let dx=-1; dx<=1; dx++) {
              if (isValidPos(startX+dx, startY+dy, rows, cols)) {
                  matches.push({x: startX+dx, y: startY+dy});
              }
          }
      }
      return matches;
  }

  // Normal flood fill for Match-2
  const visited = new Set<string>();
  const matches: {x: number, y: number}[] = [];
  const queue: {x: number, y: number}[] = [{x: startX, y: startY}];

  visited.add(`${startX},${startY}`);

  while (queue.length > 0) {
    const {x, y} = queue.shift()!;
    matches.push({x, y});

    // Check 4 directions
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;

      if (isValidPos(nx, ny, rows, cols)) {
        const neighbor = board[ny][nx];
        const key = `${nx},${ny}`;
        if (!visited.has(key) && !neighbor.isEmpty && !neighbor.isRemoving) {
           if (neighbor.color === targetColor || neighbor.type === 'rainbow') {
               visited.add(key);
               queue.push({x: nx, y: ny});
           }
        }
      }
    }
  }

  // Return empty if only 1 block is matched (Match-2 rule)
  if (matches.length < 2 && startBlock.type === 'normal') {
      return [];
  }

  return matches;
};

export const applyGravityAndShift = (board: BoardData): { newBoard: BoardData, hasChanged: boolean } => {
  const rows = board.length;
  const cols = board[0].length;
  // Deep copy the board to avoid mutating the original directly in react state transitions
  const newBoard: BoardData = board.map(row => row.map(block => ({...block})));
  let hasChanged = false;

  // 1. Gravity: Pull blocks down
  for (let x = 0; x < cols; x++) {
    let emptyCount = 0;
    // Iterate from bottom to top
    for (let y = rows - 1; y >= 0; y--) {
      if (newBoard[y][x].isEmpty) {
        emptyCount++;
      } else if (emptyCount > 0) {
        // Move block down by emptyCount
        newBoard[y + emptyCount][x] = { ...newBoard[y][x], y: y + emptyCount, isFalling: true };
        // Empty the old position
        newBoard[y][x] = {
            id: generateId(), type: 'empty', color: 'none', x, y, isFalling: false, isRemoving: false, isEmpty: true
        };
        hasChanged = true;
      } else {
         newBoard[y][x].isFalling = false;
      }
    }
  }

  // 2. Shift columns to left if there's an empty column
  let emptyColsShift = 0;
  for (let x = 0; x < cols; x++) {
      // Check if current column is completely empty
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
          // Shift this entire column to the left by emptyColsShift
          for(let y = 0; y < rows; y++) {
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
      
      // kaimin blocks can always be clicked
      if (block.type === 'kaimin') return true;

      // Check right and down for matches (sufficient to find any pair)
      if (x < cols - 1) {
        const rightBlock = board[y][x + 1];
        if (!rightBlock.isEmpty && 
           (block.color === rightBlock.color || block.type === 'rainbow' || rightBlock.type === 'rainbow')) {
          return true;
        }
      }
      if (y < rows - 1) {
        const downBlock = board[y + 1][x];
        if (!downBlock.isEmpty && 
           (block.color === downBlock.color || block.type === 'rainbow' || downBlock.type === 'rainbow')) {
          return true;
        }
      }
    }
  }
  return false;
};

export const isBoardEmpty = (board: BoardData): boolean => {
  return board.every(row => row.every(block => block.isEmpty));
};
