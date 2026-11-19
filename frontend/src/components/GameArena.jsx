import React, { useEffect } from 'react';
import { Heart, Clock, Zap, Sparkles, Wind, RefreshCw, Send, HelpCircle } from 'lucide-react';
import { useSound } from '../context/SoundContext';

export default function GameArena({ game }) {
  const { playBubblePop } = useSound();
  const {
    gameState,
    round,
    score,
    lives,
    combo,
    timeLeft,
    currentPuzzle,
    selectedAnswer,
    setSelectedAnswer,
    feedback,
    hintAvailable,
    disabledDigits,
    startGame,
    submitAnswer,
    useSonarHint,
    useExtraAir
  } = game;

  // Keyboard Event Listener (Theme 2: Event-Driven Programming)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'PLAYING') return;

      if (e.key >= '0' && e.key <= '9') {
        const digit = Number(e.key);
        if (!disabledDigits.includes(digit)) {
          playBubblePop();
          setSelectedAnswer(String(digit));
        }
      } else if (e.key === 'Enter') {
        if (selectedAnswer !== '') {
          submitAnswer(selectedAnswer);
        }
      } else if (e.key === 'Backspace' || e.key === 'Escape') {
        setSelectedAnswer('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedAnswer, disabledDigits, playBubblePop, submitAnswer, setSelectedAnswer]);

  const handleDigitClick = (digit) => {
    if (disabledDigits.includes(digit) || gameState !== 'PLAYING') return;
    playBubblePop();
    setSelectedAnswer(String(digit));
  };

  const timerPercent = Math.max(0, (timeLeft / 20) * 100);
  const isTimeCritical = timeLeft <= 5;

  return (
    <div className="aquarium-arena">
      {/* Animated Rising Bubbles */}
      <div className="bubble b1"></div>
      <div className="bubble b2"></div>
      <div className="bubble b3"></div>
      <div className="bubble b4"></div>
      <div className="bubble b5"></div>
      <div className="bubble b6"></div>

      {/* Floating Animated Fish in Background */}
      <div className="swimming-fish f1">🐠</div>
      <div className="swimming-fish f2">🐟</div>
      <div className="swimming-fish f3">🐡</div>

      {gameState === 'IDLE' ? (
        <div className="lobby-card glassmorphic">
          <div className="lobby-icon">🌊</div>
          <h2 className="lobby-title">Welcome to the Deep Reef!</h2>
          <p className="lobby-desc">
            Test your perception in this distributed underwater challenge.
            Count the fish in each puzzle image retrieved directly from Marc Conrad's external API.
          </p>

          <div className="lobby-features">
            <div className="feature-item">
              <span className="feat-emoji">⏱️</span>
              <div>
                <strong>20s per Round</strong>
                <span>Faster answers give time bonuses!</span>
              </div>
            </div>
            <div className="feature-item">
              <span className="feat-emoji">🔥</span>
              <div>
                <strong>Combo Multiplier</strong>
                <span>Stack streaks up to 2x bonus points</span>
              </div>
            </div>
            <div className="feature-item">
              <span className="feat-emoji">📡</span>
              <div>
                <strong>Sonar & Oxygen Hints</strong>
                <span>Eliminate wrong answers or add time</span>
              </div>
            </div>
          </div>

          <button className="btn-glow-large" onClick={startGame}>
            Dive In & Play Now 🏊‍♂️
          </button>
        </div>
      ) : (
        <div className="gameplay-container">
          {/* Top Status Bar: Round, Lives, Timer, Combo, Score */}
          <div className="status-bar glassmorphic">
            <div className="status-item">
              <span className="status-label">ROUND</span>
              <span className="status-value round-val">#{round}</span>
            </div>

            <div className="status-item">
              <span className="status-label">LIVES</span>
              <div className="lives-container">
                {[1, 2, 3].map((heartIndex) => (
                  <Heart
                    key={heartIndex}
                    size={22}
                    className={`heart-icon ${heartIndex <= lives ? 'heart-full' : 'heart-empty'}`}
                  />
                ))}
              </div>
            </div>

            <div className="status-item timer-status">
              <div className="timer-header">
                <Clock size={16} className={isTimeCritical ? 'pulse-red' : ''} />
                <span className={`timer-seconds ${isTimeCritical ? 'text-red' : ''}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="timer-bar-track">
                <div
                  className={`timer-bar-fill ${isTimeCritical ? 'bar-critical' : ''}`}
                  style={{ width: `${timerPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="status-item">
              <span className="status-label">STREAK</span>
              <div className="streak-badge">
                <Zap size={16} className={combo > 0 ? 'text-amber' : 'text-gray'} />
                <span className="streak-value">{combo}x</span>
              </div>
            </div>

            <div className="status-item">
              <span className="status-label">SCORE</span>
              <span className="status-value score-val">{score.toLocaleString()}</span>
            </div>
          </div>

          {/* Main Puzzle Showcase & Controls */}
          <div className="arena-grid">
            {/* Left: Underwater Puzzle Card */}
            <div className="puzzle-showcase glassmorphic">
              <div className="puzzle-header">
                <span className={`puzzle-badge ${currentPuzzle?.isCached ? 'badge-cached' : 'badge-live'}`}>
                  <Sparkles size={14} /> {currentPuzzle?.isCached ? 'Genuine Cached Puzzle' : 'Live Fish API (Marc Conrad)'}
                </span>
                <span className="puzzle-instruction">Count the fish in the image:</span>
              </div>

              <div className="puzzle-viewport">
                {gameState === 'LOADING' ? (
                  <div className="puzzle-loading">
                    <RefreshCw className="spin-icon" size={40} />
                    <p>Contacting Fish Game API Service...</p>
                    <span className="sub-load-text">Fetching image & initializing opaque round session</span>
                  </div>
                ) : currentPuzzle ? (
                  <div className="image-wrapper">
                    <img
                      src={currentPuzzle.questionUrl}
                      alt="Fish Puzzle Challenge"
                      className="puzzle-image"
                      onLoad={() => playBubblePop()}
                    />
                  </div>
                ) : (
                  <div className="puzzle-error">Failed to load challenge</div>
                )}

                {/* Round Feedback Overlay */}
                {feedback && (
                  <div className={`feedback-overlay overlay-${feedback.type}`}>
                    <div className="feedback-content">
                      <div className="feedback-emoji">
                        {feedback.type === 'correct' ? '🎉' : feedback.type === 'timeout' ? '⏰' : '❌'}
                      </div>
                      <h3>{feedback.type === 'correct' ? 'Correct!' : feedback.type === 'timeout' ? "Time's Up!" : 'Incorrect!'}</h3>
                      <p>{feedback.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Power-up Hints Bar */}
              <div className="hints-bar">
                <button
                  className={`hint-btn ${!hintAvailable || gameState !== 'PLAYING' ? 'hint-disabled' : ''}`}
                  onClick={useSonarHint}
                  disabled={!hintAvailable || gameState !== 'PLAYING'}
                  title="Eliminates 5 wrong numbers from the keypad"
                >
                  <HelpCircle size={16} />
                  <span>Sonar Ping {hintAvailable ? '(1 Left)' : '(Used)'}</span>
                </button>

                <button
                  className="hint-btn"
                  onClick={useExtraAir}
                  disabled={gameState !== 'PLAYING'}
                  title="Adds +10 seconds of oxygen to the timer"
                >
                  <Wind size={16} />
                  <span>+10s Oxygen</span>
                </button>
              </div>
            </div>

            {/* Right: Keypad & Input Console */}
            <div className="controls-console glassmorphic">
              <div className="input-preview-card">
                <span className="preview-label">Your Guess:</span>
                <div className="preview-display">
                  {selectedAnswer !== '' ? selectedAnswer : <span className="preview-placeholder">_</span>}
                </div>
              </div>

              {/* Number Keypad 0 to 9 */}
              <div className="keypad-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => {
                  const isDisabled = disabledDigits.includes(num);
                  const isSelected = selectedAnswer === String(num);

                  return (
                    <button
                      key={num}
                      className={`keypad-btn ${isSelected ? 'key-selected' : ''} ${
                        isDisabled ? 'key-disabled' : ''
                      }`}
                      onClick={() => handleDigitClick(num)}
                      disabled={isDisabled || gameState !== 'PLAYING'}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <div className="action-buttons-row">
                <button
                  className="action-btn btn-clear"
                  onClick={() => {
                    playBubblePop();
                    setSelectedAnswer('');
                  }}
                  disabled={selectedAnswer === '' || gameState !== 'PLAYING'}
                >
                  Clear
                </button>

                <button
                  className="action-btn btn-submit"
                  onClick={() => submitAnswer()}
                  disabled={selectedAnswer === '' || gameState !== 'PLAYING'}
                >
                  <Send size={18} />
                  <span>Submit</span>
                </button>
              </div>

              <div className="keyboard-hint-pill">
                💡 Tip: You can also press <strong>0-9</strong> on your physical keyboard & hit <strong>Enter</strong>!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

