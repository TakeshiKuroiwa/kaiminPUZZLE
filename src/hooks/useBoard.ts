import { useState, useCallback, useEffect, useRef } from 'react';
import type { BoardData, ClearFeedback, Difficulty } from '../types';
import { generateBoard, findMatches, applyGravityAndShift, hasValidMoves, isBoardEmpty, BOARD_ROWS, BOARD_COLS } from '../utils/boardUtils';

export const useBoard = () => {
  const [board, setBoard] = useState<BoardData>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [status, setStatus] = useState<'playing' | 'clear' | 'gameover'>('playing');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [clearFeedback, setClearFeedback] = useState<ClearFeedback | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const comboTimerRef = useRef<number | null>(null);
  const isDreamTime = combo >= 5;

  useEffect(() => {
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

  const getFeedbackLabel = (clearedCount: number, nextCombo: number, isKaiminClear: boolean) => {
    if (isKaiminClear) return 'KAIMIN BURST';
    if (clearedCount >= 12) return 'DREAM CRUSH';
    if (clearedCount >= 8) return 'BIG CLEAR';
    if (clearedCount >= 4) return 'NICE CLEAR';
    if (nextCombo >= 3) return 'COMBO UP';
    return 'CLEAR';
  };

  const startGame = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    setBoard(generateBoard(BOARD_ROWS, BOARD_COLS, newDifficulty));
    setScore(0);
    setCombo(0);
    setStatus('playing');
    setClearFeedback(null);
    setIsResolving(false);
  }, []);

  const handleBlockClick = useCallback((x: number, y: number) => {
    if (status !== 'playing' || isResolving) return;

    const matches = findMatches(board, x, y);
    if (matches.length === 0) return;

    const clickedBlock = board[y][x];
    const baseScore = matches.length * matches.length * 10;
    const difficultyMultiplier = getDifficultyMultiplier(difficulty);
    const earnedScore = Math.round(baseScore * difficultyMultiplier * (isDreamTime ? 2 : 1));
    const nextCombo = combo + 1;
    const center = matches.reduce(
      (acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
      { x: 0, y: 0 },
    );
    const isKaiminClear = clickedBlock.type === 'kaimin';

    setIsResolving(true);
    setClearFeedback({
      id: Date.now(),
      clearedCount: matches.length,
      earnedScore,
      combo: nextCombo,
      isDreamTime,
      isKaiminClear,
      label: getFeedbackLabel(matches.length, nextCombo, isKaiminClear),
      xPercent: ((center.x / matches.length) + 0.5) / BOARD_COLS * 100,
      yPercent: ((center.y / matches.length) + 0.5) / BOARD_ROWS * 100,
    });

    setBoard((prevBoard) => {
      const newBoard = prevBoard.map(row => row.map(block => ({ ...block })));
      matches.forEach(pos => {
        newBoard[pos.y][pos.x].isRemoving = true;
      });

      setScore(s => s + earnedScore);
      setCombo(c => c + 1);

      return newBoard;
    });

    setTimeout(() => {
      setBoard((currentBoard) => {
        const boardAfterRemoval = currentBoard.map(row => row.map(block => ({ ...block })));

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

      window.setTimeout(() => {
        setBoard((settledBoard) =>
          settledBoard.map(row => row.map(block => ({ ...block, isFalling: false }))),
        );
        setIsResolving(false);
      }, 260);
    }, 300);
  }, [board, combo, status, isResolving, isDreamTime, difficulty]);

  return { board, handleBlockClick, score, combo, isDreamTime, status, startGame, difficulty, clearFeedback, isResolving };
};
