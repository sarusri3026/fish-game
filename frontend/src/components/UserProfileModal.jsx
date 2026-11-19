import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { api } from '../services/api';
import { X, Award, Gamepad2, TrendingUp, History, Check } from 'lucide-react';

const AVATAR_OPTIONS = [
  { id: 'clownfish', emoji: '🐠', name: 'Clownfish' },
  { id: 'shark', emoji: '🦈', name: 'Shark' },
  { id: 'octopus', emoji: '🐙', name: 'Octopus' },
  { id: 'dolphin', emoji: '🐬', name: 'Dolphin' },
  { id: 'turtle', emoji: '🐢', name: 'Turtle' },
  { id: 'pufferfish', emoji: '🐡', name: 'Pufferfish' },
  { id: 'whale', emoji: '🐳', name: 'Whale' },
  { id: 'crab', emoji: '🦀', name: 'Crab' }
];

const ALL_BADGES = [
  { name: 'Novice Angler', desc: 'Started your first game', icon: '🎣' },
  { name: 'Sharp Eye', desc: 'Reached Round 5 or higher', icon: '👁️' },
  { name: 'Reef Explorer', desc: 'Scored 300+ points', icon: '🤿' },
  { name: 'Deep Sea Diver', desc: 'Scored 600+ points', icon: '⚓' },
  { name: 'Ocean Master', desc: 'Scored 1,000+ points', icon: '🔱' },
  { name: 'Fish Whisperer', desc: 'Reached Round 10 or higher', icon: '🐋' },
  { name: 'Aquatic Veteran', desc: 'Completed 10 matches', icon: '🎖️' }
];

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, updateAvatar } = useAuth();
  const { playBubblePop, playCorrect } = useSound();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' or 'history'

  useEffect(() => {
    if (isOpen && user) {
      setLoadingHistory(true);
      api.getUserHistory()
        .then((res) => {
          if (res.success && res.history) {
            setHistory(res.history);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingHistory(false));
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const currentAvatarEmoji = AVATAR_OPTIONS.find((a) => a.id === user.avatar)?.emoji || '🐠';
  const userBadges = user.stats?.badges || ['Novice Angler'];

  const handleAvatarChange = async (avatarId) => {
    playBubblePop();
    const res = await updateAvatar(avatarId);
    if (res.success) {
      playCorrect();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-wide glassmorphic">
        <button
          className="modal-close-btn"
          onClick={() => {
            playBubblePop();
            onClose();
          }}
        >
          <X size={20} />
        </button>

        {/* Identity Header */}
        <div className="profile-identity-banner">
          <div className="profile-avatar-large">
            <span className="avatar-big-emoji">{currentAvatarEmoji}</span>
          </div>
          <div className="profile-details">
            <div className="profile-badge-row">
              <span className="identity-tag">Virtual Identity Verified</span>
              <span className="identity-role">Explorer</span>
            </div>
            <h2 className="profile-username">{user.username}</h2>
            <span className="profile-email">{user.email}</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="auth-tabs mt-4">
          <button
            className={`auth-tab ${activeTab === 'stats' ? 'active-tab' : ''}`}
            onClick={() => {
              playBubblePop();
              setActiveTab('stats');
            }}
          >
            <TrendingUp size={16} /> Lifetime Stats & Badges
          </button>
          <button
            className={`auth-tab ${activeTab === 'history' ? 'active-tab' : ''}`}
            onClick={() => {
              playBubblePop();
              setActiveTab('history');
            }}
          >
            <History size={16} /> Match History ({history.length})
          </button>
        </div>

        {activeTab === 'stats' ? (
          <div className="profile-body">
            {/* Stat Cards */}
            <div className="stats-metric-grid">
              <div className="metric-card glassmorphic">
                <span className="metric-icon">🏆</span>
                <span className="metric-title">High Score</span>
                <span className="metric-val">{user.stats?.highScore || 0}</span>
              </div>
              <div className="metric-card glassmorphic">
                <span className="metric-icon">🌊</span>
                <span className="metric-title">Deepest Round</span>
                <span className="metric-val">Round #{user.stats?.highestRound || 0}</span>
              </div>
              <div className="metric-card glassmorphic">
                <span className="metric-icon">🎮</span>
                <span className="metric-title">Games Played</span>
                <span className="metric-val">{user.stats?.totalGames || 0}</span>
              </div>
              <div className="metric-card glassmorphic">
                <span className="metric-icon">✨</span>
                <span className="metric-title">Total Points</span>
                <span className="metric-val">{(user.stats?.totalScore || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Badges Shelf */}
            <div className="badges-section">
              <h3 className="section-title">
                <Award size={18} className="gold-text" /> Unlocked Aquatic Achievements
              </h3>
              <div className="badges-grid">
                {ALL_BADGES.map((b) => {
                  const isUnlocked = userBadges.includes(b.name);
                  return (
                    <div
                      key={b.name}
                      className={`badge-card ${isUnlocked ? 'badge-unlocked' : 'badge-locked'}`}
                      title={b.desc}
                    >
                      <span className="badge-icon">{b.icon}</span>
                      <div className="badge-meta">
                        <strong className="badge-title">{b.name}</strong>
                        <span className="badge-desc">{b.desc}</span>
                      </div>
                      {isUnlocked && <Check size={16} className="badge-check" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Change Avatar */}
            <div className="avatar-changer-section">
              <h3 className="section-title">Customize Virtual Identity Avatar</h3>
              <div className="avatar-mini-row">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av.id}
                    className={`avatar-mini-btn ${user.avatar === av.id ? 'avatar-mini-active' : ''}`}
                    onClick={() => handleAvatarChange(av.id)}
                    title={av.name}
                  >
                    <span>{av.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="history-table-container">
            {loadingHistory ? (
              <div className="py-8 text-center text-gray">Loading player history...</div>
            ) : history.length === 0 ? (
              <div className="empty-history text-center py-8">
                <Gamepad2 size={36} className="text-gray mb-2" />
                <p>No games recorded yet. Dive in and complete a run!</p>
              </div>
            ) : (
              <table className="ocean-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Round</th>
                    <th>Accuracy</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((game, i) => (
                    <tr key={game._id || i}>
                      <td>{new Date(game.createdAt).toLocaleDateString()} {new Date(game.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="gold-text font-bold">{game.score.toLocaleString()}</td>
                      <td>Round #{game.roundReached}</td>
                      <td>{game.accuracy || 100}%</td>
                      <td>{game.timeElapsed || 0}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

