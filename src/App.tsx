
import { useBoard } from './hooks/useBoard';
import { Board } from './components/Board';

function App() {
  const { board, handleBlockClick, score, combo, isDreamTime, status, resetGame } = useBoard();

  return (
    <div className={`app-container ${isDreamTime ? 'dream-time' : ''}`}>
      <header className="header">
        <h1>kaimin PUZZLE 🐑</h1>
        <div className="score-board">
          <div className="score">Score: {score}</div>
          <div className={`combo ${combo > 0 ? 'active' : ''}`}>Combo: {combo} {isDreamTime && '✨'}</div>
        </div>
      </header>

      <main className="game-area" style={{ position: 'relative' }}>
        {board.length > 0 && (
          <Board board={board} onBlockClick={handleBlockClick} />
        )}
        
        {status === 'gameover' && (
          <div className="overlay">
            <h2>GAME OVER</h2>
            <p>手詰まりです！</p>
            <p>Final Score: {score}</p>
            <button onClick={resetGame}>もう一度遊ぶ</button>
          </div>
        )}

        {status === 'clear' && (
          <div className="overlay clear">
            <h2>PERFECT CLEAR!</h2>
            <p>全消し達成！ +5000 pts</p>
            <p>Final Score: {score}</p>
            <button onClick={resetGame}>もう一度遊ぶ</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
