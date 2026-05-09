import { useState, useCallback, useEffect, useRef } from 'react';
import type { BoardData } from '../types';
import { generateBoard, findMatches, applyGravityAndShift, hasValidMoves, isBoardEmpty } from '../utils/boardUtils';

export const useBoard = () => {
  const [board, setBoard] = useState<BoardData>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [status, setStatus] = useState<'playing' | 'clear' | 'gameover'>('playing');
  const [isDreamTime, setIsDreamTime] = useState(false);
  const comboTimerRef = useRef<number | null>(null);

  // Combo expiration timer
  useEffect(() => {
    setIsDreamTime(combo >= 5);

    if (combo > 0) {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = window.setTimeout(() => {
        setCombo(0);
      }, 3000); // 3 seconds to chain combo
    }
    
    return () => {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, [combo]);

  // Initialize board
  useEffect(() => {
    setBoard(generateBoard());
  }, []);

  const handleBlockClick = useCallback((x: number, y: number) => {
    if (status !== 'playing') return;

    setBoard((prevBoard) => {
      // Find matches
      const matches = findMatches(prevBoard, x, y);
      if (matches.length === 0) return prevBoard;

      // Deep copy to mutate
      let newBoard = prevBoard.map(row => row.map(block => ({...block})));

      // Mark as removing (for animation)
      matches.forEach(pos => {
        newBoard[pos.y][pos.x].isRemoving = true;
      });

      // Calculate score based on match count
      const baseScore = matches.length * matches.length * 10;
      // Dream Time multiplier
      const earnedScore = isDreamTime ? baseScore * 2 : baseScore;
      
      setScore(s => s + earnedScore);
      setCombo(c => c + 1);

      return newBoard;
    });

    // Schedule actual removal and gravity after animation delay
    setTimeout(() => {
      setBoard((currentBoard) => {
        let boardAfterRemoval = currentBoard.map(row => row.map(block => ({...block})));
        
        // Actually remove
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
                        isEmpty: true
                    };
                }
            }
        }

        // Apply gravity and shift
        const { newBoard } = applyGravityAndShift(boardAfterRemoval);

        // Check game over / clear conditions
        if (isBoardEmpty(newBoard)) {
            setStatus('clear');
            setScore(s => s + 5000); // Perfect clear bonus
        } else if (!hasValidMoves(newBoard)) {
            setStatus('gameover');
        }

        return newBoard;
      });
    }, 300); // 300ms animation delay

  }, [status, isDreamTime]);

  const resetGame = useCallback(() => {
    setBoard(generateBoard());
    setScore(0);
    setCombo(0);
    setStatus('playing');
    setIsDreamTime(false);
  }, []);

  return { board, handleBlockClick, score, combo, isDreamTime, status, resetGame };
};
