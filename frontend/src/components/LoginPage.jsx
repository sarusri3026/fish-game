import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { Lock, Mail, User, ShieldCheck, Waves, BookOpen, Volume2, VolumeX, Music, Sparkles } from 'lucide-react';

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

export default function LoginPage({ onOpenArchitecture }) {
  const { login, register } = useAuth();
  const { soundEnabled, toggleSound, musicEnabled, toggleMusic, playBubblePop, playCorrect, playWrong } = useSound();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('clownfish');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(username, password);
        if (res.success) {
          playCorrect();
        } else {
          playWrong();
          setErrorMsg(res.message || 'Login failed. Check your credentials.');
        }
      } else {
        const res = await register(username, email, password, selectedAvatar);
        if (res.success) {
          playCorrect();
        } else {
          playWrong();
          setErrorMsg(res.message || 'Registration failed.');
        }
      }
    } catch (err) {
      playWrong();
      setErrorMsg('Network error. Check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-app-shell login-view-shell">
      {/* Animated Rising Bubbles */}
      <div className="bubble b1"></div>
      <div className="bubble b2"></div>
      <div className="bubble b3"></div>
      <div className="bubble b4"></div>
      <div className="bubble b5"></div>
      <div className="bubble b6"></div>

      {/* Floating Animated Fish */}
      <div className="swimming-fish f1">🐠</div>
      <div className="swimming-fish f2">🐟</div>
      <div className="swimming-fish f3">🐡</div>

      {/* Top Bar on Login Screen */}
      <header className="navbar-container">
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

        <div className="navbar-actions">
          <button
            className="nav-btn nav-btn-outline"
            onClick={() => {
              playBubblePop();
              onOpenArchitecture();
            }}
          >
            <BookOpen size={18} />
            <span className="nav-btn-text">4 Themes Guide</span>
            <span className="badge-pill">CIS045-3</span>
          </button>

          {/* Background Music Toggle */}
          <button
            className={`nav-btn nav-btn-icon ${musicEnabled ? 'active-audio' : ''}`}
            onClick={() => {
              playBubblePop();
              toggleMusic();
            }}
            title={musicEnabled ? 'Mute Background Music' : 'Play Background Music (bg-audio.mp3)'}
          >
            <Music size={18} className={musicEnabled ? 'cyan-text' : 'muted-text'} />
          </button>

          {/* Sound FX Toggle */}
          <button
            className="nav-btn nav-btn-icon"
            onClick={() => {
              playBubblePop();
              toggleSound();
            }}
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
          >
            {soundEnabled ? <Volume2 size={18} className="cyan-text" /> : <VolumeX size={18} className="muted-text" />}
          </button>
        </div>
      </header>

      {/* Main Centered Login Card */}
      <main className="login-main-container">
        <div className="login-card glassmorphic">
          <div className="auth-header">
            <div className="auth-icon-badge">
              <ShieldCheck size={32} className="cyan-text" />
            </div>
            <h2>{mode === 'login' ? 'Virtual Identity Sign In' : 'Establish Virtual Identity'}</h2>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Sign in to access the game arena, save verified high scores, and unlock achievements.'
                : 'Create your digital identity with an avatar stored securely in MongoDB Atlas with Bcrypt & JWT.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active-tab' : ''}`}
              onClick={() => {
                playBubblePop();
                setMode('login');
                setErrorMsg('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'register' ? 'active-tab' : ''}`}
              onClick={() => {
                playBubblePop();
                setMode('register');
                setErrorMsg('');
              }}
            >
              Create Account
            </button>
          </div>

          {errorMsg && <div className="auth-alert error-alert">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Username</label>
              <div className="input-with-icon">
                <User size={18} className="field-icon" />
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="field-icon" />
                  <input
                    type="email"
                    placeholder="diver@ocean.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="field-icon" />
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>Choose Your Aquatic Avatar</label>
                <div className="avatar-grid">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      className={`avatar-option ${selectedAvatar === av.id ? 'avatar-active' : ''}`}
                      onClick={() => {
                        playBubblePop();
                        setSelectedAvatar(av.id);
                      }}
                      title={av.name}
                    >
                      <span className="avatar-emoji">{av.emoji}</span>
                      <span className="avatar-name">{av.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-glow-large submit-btn" disabled={loading}>
              <Sparkles size={18} />
              <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Sign In & Enter Ocean' : 'Register Virtual Identity'}</span>
            </button>
          </form>

          <div className="auth-footer-note">
            🔒 Theme 4: Access is restricted to authenticated virtual identities (Bcrypt + JWT)
          </div>
        </div>
      </main>
    </div>
  );
}
