import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import PasswordInputWithStrength, { checkPasswordStrength } from './PasswordInputWithStrength';
import OtpVerificationPage from './OtpVerificationPage';
import { X, Lock, Mail, User, ShieldCheck } from 'lucide-react';

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

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, challengeToken } = useAuth();
  const { playBubblePop, playCorrect, playWrong } = useSound();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('clownfish');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  if (challengeToken) {
    return (
      <div className="modal-backdrop">
        <div className="modal-dialog glassmorphic" style={{ maxWidth: '520px', padding: '0.8rem' }}>
          <OtpVerificationPage
            isStandalone={false}
            onSuccess={() => onClose()}
            onCancel={() => {
              setErrorMsg('');
              onClose();
            }}
          />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(username, password);
        if (res.success) {
          playCorrect();
          if (!res.otpRequired) {
            onClose();
          }
        } else {
          playWrong();
          setErrorMsg(res.message || 'Login failed. Check your credentials.');
        }
      } else {
        const strength = checkPasswordStrength(password);
        if (!strength.isStrong) {
          playWrong();
          setErrorMsg('Please choose a strong password meeting all 5 security criteria before registering.');
          setLoading(false);
          return;
        }
        const res = await register(username, email, password, selectedAvatar);
        if (res.success) {
          playCorrect();
          onClose();
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

        <div className="auth-header">
          <div className="auth-icon-badge">
            <ShieldCheck size={28} className="cyan-text" />
          </div>
          <h2>{mode === 'login' ? 'Virtual Identity Sign In' : 'Establish Virtual Identity'}</h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Access your saved high scores, achievements, and persistent underwater stats.'
              : 'Create a secure player profile stored in MongoDB Atlas with Bcrypt & JWT.'}
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
            Create New Account
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

          <PasswordInputWithStrength
            value={password}
            onChange={setPassword}
            isRegister={mode === 'register'}
            placeholder="Enter your password"
            required
            onGeneratedSound={playBubblePop}
          />

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
            {loading ? 'Processing...' : mode === 'login' ? 'Dive In' : 'Register Identity'}
          </button>
        </form>

        <div className="auth-footer-note">
          🔒 Secure authentication powered by Bcrypt hashing & JSON Web Tokens (Theme 4)
        </div>
      </div>
    </div>
  );
}

