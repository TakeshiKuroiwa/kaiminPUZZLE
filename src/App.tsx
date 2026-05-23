
import { useEffect, useMemo, useState } from 'react';
import { useBoard } from './hooks/useBoard';
import { Board } from './components/Board';
import type { Difficulty, RankingEntry } from './types';

const RANKING_KEY = 'kaiminPuzzleRanking';
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'EASY',
  normal: 'NORMAL',
  hard: 'HARD',
  veryhard: 'VERY HARD',
};

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'veryhard'];

function App() {
  const { board, handleBlockClick, score, combo, isDreamTime, status, startGame, difficulty } = useBoard();
  const [screen, setScreen] = useState<'title' | 'playing' | 'result'>('title');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [playerName, setPlayerName] = useState('');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(RANKING_KEY);
    if (stored) {
      try {
        setRanking(JSON.parse(stored));
      } catch {
        setRanking([]);
      }
    }
  }, []);

  useEffect(() => {
    if (status !== 'playing' && screen === 'playing') {
      setScreen('result');
      setPlayerName('');
      setSaved(false);
      setSkipped(false);
    }
  }, [status, screen]);

  const finalScore = useMemo(() => {
    if (status === 'playing') return score;
    const remaining = board.flat().filter(block => !block.isEmpty).length;
    const deducted = Math.max(0, score - remaining * 200);
    return status === 'clear' ? deducted * 2 : deducted;
  }, [board, score, status]);

  const saveRanking = (entry: RankingEntry) => {
    const next = [entry, ...ranking]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    window.localStorage.setItem(RANKING_KEY, JSON.stringify(next));
    setRanking(next);
    setSaved(true);
  };

  const handleStart = () => {
    startGame(selectedDifficulty);
    setScreen('playing');
    setPlayerName('');
    setSaved(false);
    setSkipped(false);
  };

  const handleSaveResult = () => {
    const trimmed = playerName.trim();
    if (!trimmed || saved || skipped) return;
    saveRanking({
      name: trimmed.substring(0, 12),
      score: finalScore,
      date: new Date().toLocaleDateString(),
      difficulty,
    });
  };

  const handleSkip = () => {
    setSkipped(true);
    setSaved(false);
  };

  const handleBackToTitle = () => {
    setScreen('title');
    setPlayerName('');
    setSaved(false);
    setSkipped(false);
  };

  return (
    <div className={`app-container ${isDreamTime ? 'dream-time' : ''}`}>
      {screen === 'title' && (
        <div className="title-screen">
          <div className="title-hero-copy">
            <span className="brand-pill">kaimin</span>
            <h1>PUZZLE</h1>
            <p className="title-sub">深いオーブリジャンの世界観でパズルを始めよう</p>
          </div>
          <div className="difficulty-panel">
            <p className="panel-label">難易度を選択</p>
            <div className="difficulty-buttons">
              {DIFFICULTIES.map((level) => (
                <button
                  key={level}
                  className={selectedDifficulty === level ? 'active' : ''}
                  onClick={() => setSelectedDifficulty(level)}
                >
                  {DIFFICULTY_LABELS[level]}
                </button>
              ))}
            </div>
            <button className="start-button primary" onClick={handleStart}>
              START
            </button>
          </div>
        </div>
      )}

      {screen === 'playing' && (
        <>
          <header className="header">
            <h1>kaimin PUZZLE 🐑</h1>
            <div className="score-board">
              <div className="score">Score: {score}</div>
              <div className={`combo ${combo > 0 ? 'active' : ''}`}>
                Combo: {combo} {isDreamTime && '✨'}
              </div>
            </div>
          </header>
          <main className="game-area" style={{ position: 'relative' }}>
            {board.length > 0 && <Board board={board} onBlockClick={handleBlockClick} />}
          </main>
        </>
      )}

      {screen === 'result' && (
        <div className={`result-screen${status === 'clear' ? ' clear' : ''}`}>
          <div className="result-hero-copy">
            <span className="brand-pill">kaimin</span>
            <h2>{status === 'clear' ? 'PERFECT CLEAR' : 'GAME OVER'}</h2>
            <p className="title-sub">スコアを確認して、ランキングに登録しよう</p>
          </div>
          <div className="result-summary">
            <p className="final-score">Final Score: {finalScore}</p>
            {status === 'clear' && (
              <div className="dance-zone">
                <span className="dance-sheep">🐑</span>
                <span>kaimin is dancing!</span>
              </div>
            )}
          </div>

          {!saved && !skipped && (
            <div className="result-input">
              <label>プレイヤーネーム</label>
              <input
                type="text"
                value={playerName}
                maxLength={12}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="名前を入力"
              />
              <div className="result-buttons">
                <button onClick={handleSaveResult} disabled={!playerName.trim()}>
                  登録する
                </button>
                <button onClick={handleSkip}>スキップ</button>
              </div>
            </div>
          )}

          {saved && <p className="saved-text">ランキングに登録しました！</p>}
          {skipped && <p className="skip-text">スキップしました。ランキングには登録されません。</p>}

          <div className="ranking-box">
            <h3>ランキング TOP 10</h3>
            <ol>
              {ranking.length === 0 ? (
                <li>まだ記録がありません</li>
              ) : (
                ranking.map((entry, index) => (
                  <li key={`${entry.name}-${entry.date}-${index}`}>
                    <span className="rank-name">{entry.name}</span>
                    <span className="rank-score">{entry.score}</span>
                    <span className="rank-diff">{DIFFICULTY_LABELS[entry.difficulty]}</span>
                  </li>
                ))
              )}
            </ol>
          </div>

          <button className="start-button" onClick={handleBackToTitle}>
            スタートに戻る
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
