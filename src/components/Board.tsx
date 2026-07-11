import React from 'react';
import type { BoardData, ClearFeedback } from '../types';
import { Block } from './Block';
import { BOARD_COLS, BOARD_ROWS } from '../utils/boardUtils';

interface BoardProps {
  board: BoardData;
  onBlockClick: (x: number, y: number) => void;
  feedback: ClearFeedback | null;
  isDreamTime: boolean;
  isResolving: boolean;
}

const particleOffsets = [
  [-34, -22],
  [30, -28],
  [-40, 16],
  [36, 20],
  [-10, -38],
  [8, 36],
];

export const Board: React.FC<BoardProps> = ({ board, onBlockClick, feedback, isDreamTime, isResolving }) => {
  return (
    <div
      className={`board-container${feedback && feedback.clearedCount >= 8 ? ' board-shake' : ''}${isDreamTime ? ' dream-board' : ''}${isResolving ? ' resolving' : ''}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_ROWS}, 1fr)`,
      }}
    >
      {board.map((row, y) => 
        row.map((block, x) => (
          <Block 
            key={block.id} 
            block={block} 
            onClick={() => onBlockClick(x, y)} 
          />
        ))
      )}
      {feedback && (
        <div
          key={feedback.id}
          className={`clear-feedback${feedback.isKaiminClear ? ' kaimin-feedback' : ''}`}
          style={{
            left: `${feedback.xPercent}%`,
            top: `${feedback.yPercent}%`,
          }}
        >
          <span className="feedback-label">{feedback.label}</span>
          <span className="feedback-score">+{feedback.earnedScore}</span>
          <span className="feedback-meta">
            {feedback.clearedCount} CLEAR / {feedback.combo} COMBO
          </span>
          {particleOffsets.map(([x, y], index) => (
            <i
              key={index}
              className="feedback-particle"
              style={{
                '--particle-x': `${x}px`,
                '--particle-y': `${y}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </div>
  );
};
