import React from 'react';
import type { BoardData } from '../types';
import { Block } from './Block';
import { BOARD_COLS, BOARD_ROWS } from '../utils/boardUtils';

interface BoardProps {
  board: BoardData;
  onBlockClick: (x: number, y: number) => void;
}

export const Board: React.FC<BoardProps> = ({ board, onBlockClick }) => {
  return (
    <div 
      className="board-container" 
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_ROWS}, 1fr)`,
      }}
    >
      {board.map((row) => 
        row.map((block) => (
          <Block 
            key={block.id} 
            block={block} 
            onClick={onBlockClick} 
          />
        ))
      )}
    </div>
  );
};
