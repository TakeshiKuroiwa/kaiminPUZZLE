
import { useEffect, useMemo, useState } from 'react';
import { useBoard } from './hooks/useBoard';
import { Board } from './components/Board';
import type { Difficulty, RankingEntry } from './types';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'EASY',
  normal: 'NORMAL',
  hard: 'HARD',
  veryhard: 'VERY HARD',
};

const TOTAL_STAGES = 20;
const SAVE_KEY = 'kaimin-campaign-v1';
type Progress = { stage: number; total: number; difficulty: Difficulty };

function loadProgress(): Progress | null {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (data && Number.isInteger(data.stage) && data.stage >= 1 && data.stage <= TOTAL_STAGES && Number.isFinite(data.total) && data.total >= 0 && DIFFICULTIES.includes(data.difficulty)) return data;
  } catch { /* Storage may be unavailable or corrupt. */ }
  return null;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'veryhard'];

function App() {
  const { board, handleBlockClick, score, combo, isDreamTime, status, startGame, difficulty, clearFeedback, isResolving } = useBoard();
  const [screen, setScreen] = useState<'title' | 'playing' | 'stage' | 'result'>('title');
  const [progress, setProgress] = useState<Progress | null>(loadProgress);
  const [stage, setStage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [playerName, setPlayerName] = useState('');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rankingError, setRankingError] = useState('');

  useEffect(() => {
    const level = screen === 'result' ? difficulty : selectedDifficulty;
    const controller = new AbortController();

    const loadRanking = async () => {
      try {
        setRankingError('');
        const response = await fetch(`/api/rankings?mode=campaign&difficulty=${level}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to load rankings');
        }

        const data = await response.json();
        setRanking(Array.isArray(data.rankings) ? data.rankings : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setRanking([]);
        setRankingError('ランキングを取得できませんでした');
      }
    };

    void loadRanking();

    return () => controller.abort();
  }, [selectedDifficulty, difficulty, screen]);

  useEffect(() => {
    if (status !== 'playing' && screen === 'playing') {
      const timeoutId = window.setTimeout(() => {
        setScreen('stage');
        setPlayerName('');
        setSaved(false);
        setSkipped(false);
        setRankingError('');
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [status, screen]);

  const finalScore = useMemo(() => {
    if (status === 'playing') return score;
    const remaining = board.flat().filter(block => !block.isEmpty).length;
    const deducted = Math.max(0, score - remaining * 200);
    return status === 'clear' ? deducted * 2 : deducted;
  }, [board, score, status]);

  const saveRanking = async (entry: RankingEntry) => {
    setIsSaving(true);
    setRankingError('');

    try {
      const response = await fetch('/api/rankings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...entry, mode: 'campaign' }),
      });

      if (!response.ok) {
        throw new Error('Failed to save ranking');
      }

      const data = await response.json();
      setRanking(Array.isArray(data.rankings) ? data.rankings : []);
      setSaved(true);
    } catch {
      setRankingError('ランキングに登録できませんでした');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStart = () => {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* Continue without saved progress. */ }
    setProgress(null);
    setStage(1);
    setTotal(0);
    startGame(selectedDifficulty);
    setScreen('playing');
    setPlayerName('');
    setSaved(false);
    setSkipped(false);
    setRankingError('');
  };

  const handleSaveResult = async () => {
    const trimmed = playerName.trim();
    if (!trimmed || saved || skipped || isSaving) return;
    await saveRanking({
      name: trimmed.substring(0, 12),
      score: total + finalScore,
      date: new Date().toLocaleDateString(),
      difficulty,
    });
  };

  const handleNext = () => {
    const nextTotal = total + finalScore;
    if (stage === TOTAL_STAGES) {
      try { localStorage.removeItem(SAVE_KEY); } catch { /* Storage is optional. */ }
      setProgress(null);
      setScreen('result');
      return;
    }
    const next = { stage: stage + 1, total: nextTotal, difficulty };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); setProgress(next); } catch { /* Play can continue without saved progress. */ }
    setStage(next.stage);
    setTotal(next.total);
    startGame(difficulty);
    setScreen('playing');
  };

  const handleSuspend = () => {
    const next = { stage: stage + 1, total: total + finalScore, difficulty };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(next));
      setProgress(next);
      setScreen('title');
    } catch {
      setRankingError('保存できませんでした。ブラウザの保存設定をご確認ください。');
    }
  };

  const handleResume = () => {
    if (!progress) return;
    setStage(progress.stage);
    setTotal(progress.total);
    setSelectedDifficulty(progress.difficulty);
    startGame(progress.difficulty);
    setScreen('playing');
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
    setRankingError('');
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
            {progress && <button className="start-button primary" onClick={handleResume}>つづきから（ステージ {progress.stage} / {TOTAL_STAGES}）</button>}
            <button className="start-button primary" onClick={handleStart}>
              {progress ? '最初から（保存した続きは削除）' : 'START'}
            </button>
          </div>
        </div>
      )}

      {screen === 'playing' && (
        <>
          <header className="header">
            <h1>kaimin PUZZLE 🐑</h1>
            <div className="score-board">
              <div className="score">ステージ {stage} / {TOTAL_STAGES} / 累計: {total + score}</div>
              <div className={`combo ${combo > 0 ? 'active' : ''}`}>
                Combo: {combo} {isDreamTime && '✨'}
                {combo > 0 && <span key={clearFeedback?.id ?? combo} className="combo-window" />}
              </div>
            </div>
            <div className={`dream-meter${isDreamTime ? ' active' : ''}`}>
              <span className="dream-meter-label">
                {isDreamTime ? 'DREAM TIME' : `Dream Time ${Math.min(combo, 5)}/5`}
              </span>
              <span className="dream-meter-track">
                <span style={{ width: `${Math.min(combo, 5) / 5 * 100}%` }} />
              </span>
            </div>
          </header>
          <main className="game-area" style={{ position: 'relative' }}>
            {board.length > 0 && (
              <Board
                board={board}
                onBlockClick={handleBlockClick}
                feedback={clearFeedback}
                isDreamTime={isDreamTime}
                isResolving={isResolving}
              />
            )}
          </main>
        </>
      )}

      {screen === 'stage' && (
        <div className={`result-screen${status === 'clear' ? ' clear' : ''}`}>
          <div className="result-hero-copy">
            <span className="brand-pill">kaimin</span>
            <h2>{status === 'clear' ? 'PERFECT CLEAR' : 'STAGE END'}</h2>
            <p className="title-sub">ステージ {stage} / {TOTAL_STAGES} 終了</p>
          </div>
          <div className="result-summary">
            <p>ステージスコア: {finalScore}</p>
            <p className="final-score">累計スコア: {total + finalScore}</p>
          </div>
          {rankingError && <p className="skip-text">{rankingError}</p>}
          <div className="result-buttons">
            <button className="start-button primary" onClick={handleNext}>{stage === TOTAL_STAGES ? '最終結果へ' : '次のステージへ'}</button>
            {stage < TOTAL_STAGES && <button className="start-button" onClick={handleSuspend}>中断する</button>}
          </div>
        </div>
      )}

      {screen === 'result' && (
        <div className={`result-screen${status === 'clear' ? ' clear' : ''}`}>
          <div className="result-hero-copy">
            <span className="brand-pill">kaimin</span>
            <h2>{status === 'clear' ? 'PERFECT CLEAR' : 'GAME OVER'}</h2>
            <p className="title-sub">スコアを確認して、ランキングに登録しよう</p>
          </div>
          <div className="result-summary">
            <p className="final-score">Final Score: {total + finalScore}</p>
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
                <button onClick={handleSaveResult} disabled={!playerName.trim() || isSaving}>
                  {isSaving ? '登録中...' : '登録する'}
                </button>
                <button onClick={handleSkip}>スキップ</button>
              </div>
            </div>
          )}

          {saved && <p className="saved-text">ランキングに登録しました！</p>}
          {skipped && <p className="skip-text">スキップしました。ランキングには登録されません。</p>}
          {rankingError && <p className="skip-text">{rankingError}</p>}

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
