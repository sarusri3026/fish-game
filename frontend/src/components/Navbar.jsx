import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { Volume2, VolumeX, Music, Trophy, BookOpen, User, LogOut, Waves } from 'lucide-react';

const AVATARS = {
  clownfish: '🐠',
  shark: '🦈',
  octopus: '🐙',
  dolphin: '🐬',
  turtle: '🐢',
  pufferfish: '🐡',
  whale: '🐳',
  crab: '🦀'
};

export default function Navbar({ onOpenAuth, onOpenProfile, onOpenLeaderboard, onOpenArchitecture, extraButtons }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { soundEnabled, toggleSound, musicEnabled, toggleMusic, playBubblePop } = useSound();

  const handleSoundToggle = () => {
    playBubblePop();
    toggleSound();
  };

  const handleMusicToggle = () => {
    playBubblePop();
    toggleMusic();
  };

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <div className="brand-badge">
          <div className="brand-icon-wrapper">
            <span className="brand-icon">🐠</span>
            <Waves className="waves-icon" size={16} />
          </div>
          <div>
            <h1 className="brand-title">FISH QUEST</h1>
            <span className="brand-sub">Distributed MERN Game</span>
          </div>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Screen Switcher buttons injected from App */}
        {extraButtons && extraButtons}

        {/* Architecture & 4 Themes Guide Button */}
        <button
          className="nav-btn nav-btn-outline"
          onClick={() => {
            playBubblePop();
            onOpenArchitecture();
          }}
          title="Review Software Design, Events, Interoperability & Virtual Identity"
        >
          <BookOpen size={18} />
          <span className="nav-btn-text">4 Themes Guide</span>
          <span className="badge-pill">CIS045-3</span>
        </button>

        {/* Leaderboard Button */}
        <button
          className="nav-btn nav-btn-outline"
          onClick={() => {
            playBubblePop();
            onOpenLeaderboard();
          }}
        >
          <Trophy size={18} className="gold-text" />
          <span className="nav-btn-text">Leaderboard</span>
        </button>

        {/* Background Music Toggle */}
        <button
          className={`nav-btn nav-btn-icon ${musicEnabled ? 'active-audio' : ''}`}
          onClick={handleMusicToggle}
          title={musicEnabled ? 'Mute Background Music' : 'Play Background Music (bg-audio.mp3)'}
        >
          <Music size={18} className={musicEnabled ? 'cyan-text' : 'muted-text'} />
        </button>

        {/* Sound FX Toggle */}
        <button
          className="nav-btn nav-btn-icon"
          onClick={handleSoundToggle}
          title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
        >
          {soundEnabled ? <Volume2 size={18} className="cyan-text" /> : <VolumeX size={18} className="muted-text" />}
        </button>

        {/* Virtual Identity Widget */}
        {isAuthenticated && user ? (
          <div className="user-identity-pill">
            <button
              className="user-profile-trigger"
              onClick={() => {
                playBubblePop();
                onOpenProfile();
              }}
              title="View Virtual Identity & Statistics"
            >
              <span className="user-avatar-emoji">{AVATARS[user.avatar] || '🐠'}</span>
              <div className="user-pill-info">
                <span className="user-name">{user.username}</span>
                <span className="user-hs">High: {user.stats?.highScore || 0} pts</span>
              </div>
            </button>
            <button
              className="logout-icon-btn"
              onClick={() => {
                playBubblePop();
                logout();
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            className="nav-btn nav-btn-primary"
            onClick={() => {
              playBubblePop();
              onOpenAuth();
            }}
          >
            <User size={18} />
            <span>Sign In / Identity</span>
          </button>
        )}
      </div>
    </header>
  );
}

