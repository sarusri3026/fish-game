import React, { useEffect } from 'react';
import { Star, RotateCcw, ChevronRight, Grid, Trophy } from 'lucide-react';
import { useSound } from '../context/SoundContext';
import confetti from 'canvas-confetti';

/**
 * StarDisplay - Animated star rating display (0-3 stars)
 */
function StarDisplay({ stars }) {
  return (
    <div className="level-complete-stars">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className={`complete-star-wrap ${i <= stars ? 'star-earned' : 'star-unearned'}`}
          style={{ animationDelay: `${(i - 1) * 0.2}s` }}
        >
          <Star
            size={48}
            className={i <= stars ? 'star-filled star-pulse' : 'star-empty'}
            fill={i <= stars ? 'currentColor' : 'none'}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * LevelCompleteModal - Shown after every level attempt.
 * Requirements:
 * - Shows level number, score, stars earned, and performance message
 * - 2–3 stars: "Next Level" + "Level Selection"
 * - 0–1 stars: "Retry Level" + "Level Selection"
 * Theme 2: Event-Driven (fires when level result received)
 * Theme 4: Progress stored in MongoDB on backend
 */
export default function LevelCompleteModal({
  isOpen,
  result,
  onRetry,
  onNextLevel,
  onLevelSelection
}) {
  const { playBubblePop, playCorrect, playWrong } = useSound();

  useEffect(() => {
    if (!isOpen || !result) return;

    if (result.stars >= 3) {
      playCorrect();
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
    } else if (result.stars === 2) {
      playCorrect();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } else if (result.stars === 1) {
      playWrong();
    } else {
      playWrong();
    }
  }, [isOpen, result]); // eslint-disable-line

  if (!isOpen || !result) return null;

  const stars = result.stars || 0;
  const score = result.score || 0;
  const levelNumber = result.levelNumber || '?';
  const unlockedLevel = result.unlockedLevel;
  const unlockedNext = result.unlockedNext;
  const canProceed = stars >= 2;
  const isLastLevel = levelNumber >= 100;

  const headerEmoji = stars === 3 ? '🌟' : stars === 2 ? '🎉' : stars === 1 ? '⚠️' : '❌';
  const headerText = stars === 3 ? 'Outstanding!' : stars === 2 ? 'Level Complete!' : stars === 1 ? 'Not Quite!' : 'Level Failed!';

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog glassmorphic level-complete-card">
        {/* Header */}
        <div className="gameover-header">
          <div className="gameover-icon">{headerEmoji}</div>
          <h2>{headerText}</h2>
          <p className="gameover-sub">
            {result.message || (canProceed ? 'Well done! Keep diving deeper!' : 'You need at least 2 stars to advance.')}
          </p>
        </div>

        {/* Star Rating Display */}
        <StarDisplay stars={stars} />

        {/* Score Badge */}
        <div className="gameover-score-badge">
          <span className="final-score-label">LEVEL {levelNumber} SCORE</span>
          <span className="final-score-val">{score.toLocaleString()}</span>
        </div>

        {/* Stats */}
        <div className="gameover-stats-grid">
          <div className="go-stat-item">
            <Trophy className="cyan-text" size={20} />
            <div>
              <span className="go-stat-val">{stars} / 3</span>
              <span className="go-stat-lbl">Stars Earned</span>
            </div>
          </div>
          <div className="go-stat-item">
            <Star className="amber-text" size={20} fill="currentColor" />
            <div>
              <span className="go-stat-val">{result.totalStars || 0}</span>
              <span className="go-stat-lbl">Total Stars</span>
            </div>
          </div>
          <div className="go-stat-item">
            <span style={{ fontSize: '1.2rem' }}>🔓</span>
            <div>
              <span className="go-stat-val">Lvl {unlockedLevel || levelNumber}</span>
              <span className="go-stat-lbl">Unlocked Up To</span>
            </div>
          </div>
        </div>

        {/* Rating Label */}
        <div className={`level-rating-badge rating-${stars}`}>
          {stars === 3 ? '⭐ EXCELLENT' : stars === 2 ? '✅ GOOD' : stars === 1 ? '⚠️ INSUFFICIENT' : '❌ FAILED'}
        </div>

        {/* Action Buttons */}
        <div className="gameover-actions">
          {canProceed ? (
            <>
              {!isLastLevel && (
                <button
                  className="btn-glow-large"
                  onClick={() => { playBubblePop(); onNextLevel(); }}
                >
                  <ChevronRight size={18} />
                  <span>Next Level</span>
                </button>
              )}
              {isLastLevel && (
                <div className="level-complete-finale">
                  🏆 You've conquered all 100 levels! Incredible!
                </div>
              )}
              <button
                className="btn-outline-wide"
                onClick={() => { playBubblePop(); onLevelSelection(); }}
              >
                <Grid size={18} />
                <span>Level Selection</span>
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-glow-large"
                onClick={() => { playBubblePop(); onRetry(); }}
              >
                <RotateCcw size={18} />
                <span>Retry Level</span>
              </button>
              <button
                className="btn-outline-wide"
                onClick={() => { playBubblePop(); onLevelSelection(); }}
              >
                <Grid size={18} />
                <span>Level Selection</span>
              </button>
            </>
          )}
        </div>

        {/* Unlock notification */}
        {unlockedNext && !isLastLevel && (
          <div className="unlock-notification">
            🔓 Level {unlockedLevel} is now unlocked!
          </div>
        )}
        {!canProceed && (
          <div className="unlock-hint">
            💡 Earn at least <strong>2 stars</strong> to unlock Level {Number(levelNumber) + 1}
          </div>
        )}
      </div>
    </div>
  );
}
