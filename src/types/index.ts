export type BlockType = 'normal' | 'kaimin' | 'rainbow' | 'obstacle' | 'empty';
export type BlockColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'none';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'veryhard';

export interface RankingEntry {
  name: string;
  score: number;
  date: string;
  difficulty: Difficulty;
}

export interface ClearFeedback {
  id: number;
  clearedCount: number;
  earnedScore: number;
  combo: number;
  isDreamTime: boolean;
  isKaiminClear: boolean;
  label: string;
  xPercent: number;
  yPercent: number;
}

export interface BlockData {
  id: string; // Unique identifier for React key (useful for animations)
  type: BlockType;
  color: BlockColor;
  x: number; // Grid X position (column)
  y: number; // Grid Y position (row)
  isFalling: boolean;
  isRemoving: boolean;
  isEmpty: boolean; // Same as type === 'empty', for convenience
}

export type BoardData = BlockData[][]; // 2D array [y][x] or [row][col]

export interface GameState {
  board: BoardData;
  score: number;
  combo: number;
  maxCombo: number;
  isDreamTime: boolean;
  status: 'playing' | 'gameover' | 'clear';
}
