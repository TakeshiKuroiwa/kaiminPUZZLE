import { useState, useCallback, useEffect, useRef } from 'react';
import type { BoardData, Difficulty } from '../types';
import { generateBoard, findMatches, applyGravityAndShift, hasValidMoves, isBoardEmpty, BOARD_ROWS, BOARD_COLS } from '../utils/boardUtils';

export const useBoard = () => {
  const [board, setBoard] = useState<BoardData>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [status, setStatus] = useState<'playing' | 'clear' | 'gameover'>('playing');
  const [isDreamTime, setIsDreamTime] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const comboTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsDreamTime(combo >= 5);

    if (combo > 0) {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = window.setTimeout(() => {
        setCombo(0);
      }, 3000);
    }

    return () => {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, [combo]);

  const getDifficultyMultiplier = (level: Difficulty) => {
    switch (level) {
      case 'veryhard':
        return 2.0;
      case 'hard':
        return 1.5;
      case 'normal':
        return 1.2;
      default:
        return 1.0;
    }
  };

  const startGame = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    setBoard(generateBoard(BOARD_ROWS, BOARD_COLS, newDifficulty));
    setScore(0);
    setCombo(0);
    setStatus('playing');
    setIsDreamTime(false);
  }, []);

  const handleBlockClick = useCallback((x: number, y: number) => {
    if (status !== 'playing') return;

    setBoard((prevBoard) => {
      const matches = findMatches(prevBoard, x, y);
      if (matches.length === 0) return prevBoard;

      let newBoard = prevBoard.map(row => row.map(block => ({ ...block })));
      matches.forEach(pos => {
        newBoard[pos.y][pos.x].isRemoving = true;
      });

      const baseScore = matches.length * matches.length * 10;
      const difficultyMultiplier = getDifficultyMultiplier(difficulty);
      const earnedScore = Math.round(baseScore * difficultyMultiplier * (isDreamTime ? 2 : 1));
      setScore(s => s + earnedScore);
      setCombo(c => c + 1);

      return newBoard;
    });

    setTimeout(() => {
      setBoard((currentBoard) => {
        let boardAfterRemoval = currentBoard.map(row => row.map(block => ({ ...block })));

        for (let r = 0; r < boardAfterRemoval.length; r++) {
          for (let c = 0; c < boardAfterRemoval[r].length; c++) {
            if (boardAfterRemoval[r][c].isRemoving) {
              boardAfterRemoval[r][c] = {
                id: Math.random().toString(36).substring(2, 9),
                type: 'empty',
                color: 'none',
                x: c,
                y: r,
                isFalling: false,
                isRemoving: false,
                isEmpty: true,
              };
            }
          }
        }

        const { newBoard } = applyGravityAndShift(boardAfterRemoval);

        if (isBoardEmpty(newBoard)) {
          setStatus('clear');
          setScore(s => s + Math.round(5000 * getDifficultyMultiplier(difficulty)));
        } else if (!hasValidMoves(newBoard)) {
          setStatus('gameover');
        }

        return newBoard;
      });
    }, 300);
  }, [status, isDreamTime, difficulty]);

  return { board, handleBlockClick, score, combo, isDreamTime, status, startGame, difficulty };
};
