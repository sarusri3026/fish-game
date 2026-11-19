import React, { useEffect } from 'react';
import { useSound } from '../context/SoundContext';
import { Trophy, RotateCcw, Target, Award, ListFilter } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GameOverModal({ isOpen, score, round, stats, onRestart, onViewLeaderboard }) {
  const { playBubblePop } = useSound();

  useEffect(() => {
    if (isOpen && score > 200) {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen, score]);

  if (!isOpen) return null;

  const accuracy = stats.totalGuesses > 0 ? Math.round((stats.correctAnswers / stats.totalGuesses) * 100) : 0;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog glassmorphic gameover-card">
        <div className="gameover-header">
          <div className="gameover-icon">🌊</div>
          <h2>Game Completed!</h2>
          <p className="gameover-sub">
            Your underwater expedition has concluded. Your score has been submitted to the global database.
          </p>
        </div>

        <div className="gameover-score-badge">
          <span className="final-score-label">FINAL SCORE</span>
          <span className="final-score-val">{score.toLocaleString()}</span>
        </div>

        <div className="gameover-stats-grid">
          <div className="go-stat-item">
            <Award className="cyan-text" size={20} />
            <div>
              <span className="go-stat-val">Round #{round}</span>
              <span className="go-stat-lbl">Deepest Level</span>
            </div>
          </div>

          <div className="go-stat-item">
            <Target className="amber-text" size={20} />
            <div>
              <span className="go-stat-val">{accuracy}%</span>
              <span className="go-stat-lbl">Accuracy</span>
            </div>
          </div>

          <div className="go-stat-item">
            <Trophy className="gold-text" size={20} />
            <div>
              <span className="go-stat-val">{stats.highestCombo || 0}x</span>
              <span className="go-stat-lbl">Max Streak</span>
            </div>
          </div>
        </div>

        <div className="gameover-actions">
          <button
            className="btn-glow-large"
            onClick={() => {
              playBubblePop();
              onRestart();
            }}
          >
            <RotateCcw size={18} />
            <span>Play Again</span>
          </button>

          <button
            className="btn-outline-wide"
            onClick={() => {
              playBubblePop();
              onViewLeaderboard();
            }}
          >
            <ListFilter size={18} />
            <span>Check Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

