import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSound } from '../context/SoundContext';
import { X, Trophy, Medal, RefreshCw } from 'lucide-react';

export default function LeaderboardModal({ isOpen, onClose }) {
  const { playBubblePop } = useSound();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchScores = () => {
    setLoading(true);
    api.getLeaderboard(15)
      .then((res) => {
        if (res.success && res.leaderboard) {
          setLeaderboard(res.leaderboard);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchScores();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog glassmorphic">
        <button
          className="modal-close-btn"
          onClick={() => {
            playBubblePop();
            onClose();
          }}
        >
          <X size={20} />
        </button>

        <div className="modal-header-centered">
          <div className="trophy-badge">
            <Trophy size={32} className="gold-text" />
          </div>
          <h2>Global Ocean Leaderboard</h2>
          <p className="modal-sub">
            Persisted in MongoDB Atlas across all player sessions.
          </p>
        </div>

        <div className="leaderboard-actions">
          <button className="refresh-mini-btn" onClick={fetchScores} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh Ranks</span>
          </button>
        </div>

        <div className="leaderboard-list">
          {loading ? (
            <div className="py-8 text-center text-gray">
              <RefreshCw className="spin-icon mx-auto mb-2" size={24} />
              Loading ocean records...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-8 text-center text-gray">
              No high scores recorded yet. Be the first to claim #1!
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const rank = index + 1;
              let rankBadge = `#${rank}`;
              let rankClass = '';
              if (rank === 1) {
                rankBadge = '🥇';
                rankClass = 'rank-gold';
              } else if (rank === 2) {
                rankBadge = '🥈';
                rankClass = 'rank-silver';
              } else if (rank === 3) {
                rankBadge = '🥉';
                rankClass = 'rank-bronze';
              }

              return (
                <div key={entry._id || index} className={`leaderboard-row ${rankClass}`}>
                  <div className="rank-indicator">{rankBadge}</div>
                  <div className="player-meta">
                    <span className="player-name">{entry.username || 'Anonymous'}</span>
                    <span className="player-sub">
                      Round #{entry.roundReached || 1} • {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="player-score">
                    {(entry.score || 0).toLocaleString()} <span className="score-unit">pts</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

