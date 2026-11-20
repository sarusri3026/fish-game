import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import PasswordInputWithStrength, { checkPasswordStrength } from './PasswordInputWithStrength';
import {
  Waves,
  Play,
  Pause,
  Compass,
  Trophy,
  Star,
  ShieldCheck,
  BookOpen,
  Volume2,
  VolumeX,
  Music,
  Sparkles,
  ChevronRight,
  Map,
  ArrowRight,
  Lock,
  User,
  Mail,
  Gift,
  CheckCircle2,
  Zap,
  HelpCircle,
  Award
} from 'lucide-react';

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

const ZONE_PREVIEWS = [
  { id: 1, name: 'Reef Shallows', range: 'Lvls 1–10', emoji: '🐚', desc: 'Sunlit turquoise sands & coastal coral coves' },
  { id: 2, name: 'Coral Gardens', range: 'Lvls 11–20', emoji: '🪸', desc: 'Vibrant anemone groves and sea fan forests' },
  { id: 3, name: 'Crystal Lagoon', range: 'Lvls 21–30', emoji: '💎', desc: 'Glowing purple quartz stream & cavern springs' },
  { id: 4, name: 'Sunken Galleon', range: 'Lvls 31–40', emoji: '🏴‍☠️', desc: 'Ancient shipwrecks, pirate gold & anchor reefs' },
  { id: 5, name: 'Open Currents', range: 'Lvls 41–50', emoji: '🌊', desc: 'Pelagic blue highways & manta ray paths' },
  { id: 6, name: 'Electric Shallows', range: 'Lvls 51–60', emoji: '⚡', desc: 'Bioluminescent reef banks & jelly sanctuaries' },
  { id: 7, name: 'Twilight Depths', range: 'Lvls 61–70', emoji: '🐙', desc: 'Shadowy cavern passages and cephalopod dens' },
  { id: 8, name: 'Midnight Trench', range: 'Lvls 71–80', emoji: '🦑', desc: 'Deep ocean rift expedition into the dark abyss' },
  { id: 9, name: 'Hydrothermal Vents', range: 'Lvls 81–90', emoji: '🌋', desc: 'Mineral chimney towers & volcanic thermal seas' },
  { id: 10, name: "Ocean Master's Abyss", range: 'Lvls 91–100', emoji: '👑', desc: 'The legendary deep-sea throne at Level 100' }
];

export default function LandingPage({
  onOpenArchitecture,
  onOpenLeaderboard,
  onStartAdventure
}) {
  const { login, register, isAuthenticated } = useAuth();
  const {
    soundEnabled,
    toggleSound,
    musicEnabled,
    toggleMusic,
    playBubblePop,
    playCorrect,
    playWrong
  } = useSound();

  // Background Video State
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  // Auth Form State
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('clownfish');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Toggle Video Play/Pause
  const toggleVideoPlayback = () => {
    playBubblePop();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  // Scroll to section helper
  const scrollToSection = (id) => {
    playBubblePop();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Quick Guest Login (Auto-demo for evaluators & players)
  const handleQuickGuest = async () => {
    playBubblePop();
    setLoading(true);
    setErrorMsg('');
    try {
      const guestUser = `diver_${Math.floor(Math.random() * 89999 + 10000)}`;
      const guestPass = 'Sailor123!';
      const reg = await register(guestUser, `${guestUser}@fishquest.sea`, guestPass, 'clownfish');
      if (reg.success) {
        playCorrect();
        if (onStartAdventure) onStartAdventure();
      } else {
        // Fallback to standard login if already registered
        const log = await login(guestUser, guestPass);
        if (log.success) {
          playCorrect();
          if (onStartAdventure) onStartAdventure();
        } else {
          setErrorMsg('Failed to initialize demo identity.');
        }
      }
    } catch (err) {
      setErrorMsg('Could not establish guest session.');
    } finally {
      setLoading(false);
    }
  };

  // Auth Form Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        const res = await login(username, password);
        if (res.success) {
          playCorrect();
          // If OTP is required, challengeToken is set in AuthContext and OTP page will display
          if (!res.otpRequired && onStartAdventure) {
            onStartAdventure();
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
          if (onStartAdventure) onStartAdventure();
        } else {
          playWrong();
          setErrorMsg(res.message || 'Registration failed.');
        }
      }
    } catch (err) {
      playWrong();
      setErrorMsg('Network error. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page-root">
      {/* ── 1. CINEMATIC UNDERWATER BACKGROUND VIDEO LAYER ──────────────── */}
      <div className="landing-video-container">
        <video
          ref={videoRef}
          className="landing-bg-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/assets/underwater-bg.webm" type="video/webm" />
        </video>
        {/* Soft Oceanic Ambient Gradients for Light Theme */}
        <div className="landing-video-overlay" />
        <div className="landing-video-caustics" />

        {/* Floating Bubble Particles */}
        <div className="landing-bubble b1" />
        <div className="landing-bubble b2" />
        <div className="landing-bubble b3" />
        <div className="landing-bubble b4" />
        <div className="landing-bubble b5" />
      </div>

      {/* ── 2. TOP STICKY NAVBAR ────────────────────────────────────────── */}
      <header className="landing-navbar glassmorphic">
        <div className="landing-nav-brand">
          <div className="brand-icon-wrapper">
            <span className="brand-icon">🐠</span>
            <Waves className="waves-icon" size={16} />
          </div>
          <div>
            <h1 className="landing-brand-title">FISH QUEST</h1>
            <span className="landing-brand-sub">Distributed MERN Game</span>
          </div>
        </div>

        {/* Quick Nav Links */}
        <nav className="landing-nav-links">
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollToSection('features')}
          >
            Features
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollToSection('zones')}
          >
            100 Levels Map
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => {
              playBubblePop();
              if (onOpenArchitecture) onOpenArchitecture();
            }}
          >
            <BookOpen size={15} />
            <span>4 Themes Guide</span>
            <span className="badge-pill">CIS045-3</span>
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => {
              playBubblePop();
              if (onOpenLeaderboard) onOpenLeaderboard();
            }}
          >
            <Trophy size={15} className="gold-text" />
            <span>Hall of Fame</span>
          </button>
        </nav>

        {/* Media Controls & CTA */}
        <div className="landing-nav-actions">
          {/* Video Toggle */}
          <button
            type="button"
            className={`nav-btn nav-btn-icon ${isVideoPlaying ? 'active-audio' : ''}`}
            onClick={toggleVideoPlayback}
            title={isVideoPlaying ? 'Pause Background Video' : 'Play Background Video'}
          >
            {isVideoPlaying ? <Pause size={17} className="cyan-text" /> : <Play size={17} />}
          </button>

          {/* Background Music Toggle */}
          <button
            type="button"
            className={`nav-btn nav-btn-icon ${musicEnabled ? 'active-audio' : ''}`}
            onClick={() => {
              playBubblePop();
              toggleMusic();
            }}
            title={musicEnabled ? 'Mute Background Music' : 'Play Background Music (bg-audio.mp3)'}
          >
            <Music size={17} className={musicEnabled ? 'cyan-text' : 'muted-text'} />
          </button>

          {/* Sound FX Toggle */}
          <button
            type="button"
            className="nav-btn nav-btn-icon"
            onClick={() => {
              playBubblePop();
              toggleSound();
            }}
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
          >
            {soundEnabled ? <Volume2 size={17} className="cyan-text" /> : <VolumeX size={17} className="muted-text" />}
          </button>

          {/* Primary Action Button */}
          {isAuthenticated ? (
            <button
              type="button"
              className="btn-glow-primary landing-cta-btn"
              onClick={() => {
                playBubblePop();
                if (onStartAdventure) onStartAdventure();
              }}
            >
              <span>Resume Road Map</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-glow-primary landing-cta-btn"
              onClick={() => scrollToSection('auth-station')}
            >
              <span>Dive In Now</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </header>

      {/* ── 3. HERO SHOWCASE SECTION ────────────────────────────────────── */}
      <section className="landing-hero-section">
        <div className="landing-hero-content">
          <div className="landing-badge-pill animate-bounce-subtle">
            <Sparkles size={16} className="text-amber" />
            <span>100-Level Coral Expedition & Live Mathematical Puzzles</span>
          </div>

          <h1 className="landing-hero-headline">
            Explore The Living Ocean. <br />
            <span className="gradient-ocean-text">Solve Fish Equations.</span> <br />
            Conquer All 100 Levels.
          </h1>

          <p className="landing-hero-subhead">
            Fish Quest is a cutting-edge distributed MERN stack educational game. Dive through 10 breathtaking tropical ocean zones, unlock secret coral treasure chests, crack live math puzzles from the Marc Conrad Fish API, and climb the global leaderboards with authenticated virtual identities.
          </p>

          <div className="landing-cta-cluster">
            {isAuthenticated ? (
              <button
                type="button"
                className="btn-hero-primary"
                onClick={() => {
                  playBubblePop();
                  if (onStartAdventure) onStartAdventure();
                }}
              >
                <Compass size={20} />
                <span>ENTER LEVEL ROAD MAP</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-hero-primary"
                  onClick={() => scrollToSection('auth-station')}
                >
                  <Play size={20} />
                  <span>START EXPEDITION</span>
                </button>
                <button
                  type="button"
                  className="btn-hero-secondary"
                  onClick={handleQuickGuest}
                  disabled={loading}
                >
                  <Zap size={18} />
                  <span>{loading ? 'Diving In...' : 'Instant 1-Click Guest Dive'}</span>
                </button>
              </>
            )}

            <button
              type="button"
              className="btn-hero-outline"
              onClick={() => scrollToSection('zones')}
            >
              <Map size={18} />
              <span>Explore 10 Zones</span>
            </button>
          </div>

          {/* Quick Stats Banner */}
          <div className="landing-stat-strip glassmorphic">
            <div className="hero-stat-item">
              <span className="stat-number">100</span>
              <span className="stat-label">EXPEDITION LEVELS</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item">
              <span className="stat-number">10</span>
              <span className="stat-label">TROPICAL ZONES</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item">
              <span className="stat-number">300 ⭐</span>
              <span className="stat-label">MAXIMUM STARS</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item">
              <span className="stat-number">4</span>
              <span className="stat-label">DISTRIBUTED THEMES</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. KEY GAMEPLAY FEATURES GRID ───────────────────────────────── */}
      <section id="features" className="landing-features-section">
        <div className="section-title-wrap">
          <span className="section-eyebrow">DISTRIBUTED GAME ENGINE</span>
          <h2 className="section-headline">Engineered For Exploration & Learning</h2>
          <p className="section-subtext">
            Designed to meet the highest academic distributed service standards (CIS045-3) with real-time interoperability and state persistence.
          </p>
        </div>

        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card glassmorphic">
            <div className="feature-icon-halo gold">
              <Star size={26} />
            </div>
            <h3>3-Star Performance Rating</h3>
            <p>
              Complete levels fast to earn up to 3 stars. The next deep-sea level unlocks strictly when you score at least 2 stars (≥25% time remaining).
            </p>
            <div className="feature-tags">
              <span>Dynamic Gauge</span>
              <span>Progression Gating</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="feature-card glassmorphic">
            <div className="feature-icon-halo cyan">
              <Gift size={26} />
            </div>
            <h3>Mid-Zone Chests & Summit Gates</h3>
            <p>
              Unlock animated treasure chests at Level 5 with bonus credits and power-ups. Master Level 10 to breach the Zone Gate and advance into new waters.
            </p>
            <div className="feature-tags">
              <span>Interactive Modals</span>
              <span>+500 Bonus Credits</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="feature-card glassmorphic">
            <div className="feature-icon-halo emerald">
              <Waves size={26} />
            </div>
            <h3>Live Fish API Interoperability</h3>
            <p>
              Communicates with Marc Conrad's external fish puzzle service via HTTPS. Encrypted server-side sessions prevent tampering with solutions.
            </p>
            <div className="feature-tags">
              <span>Theme 3: Interoperability</span>
              <span>Anti-Cheat Token</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="feature-card glassmorphic">
            <div className="feature-icon-halo violet">
              <ShieldCheck size={26} />
            </div>
            <h3>Virtual Identity & Persistence</h3>
            <p>
              Secure player profiles authenticated with Bcrypt salt hashing and JSON Web Tokens (JWT). All progress is stored in MongoDB Atlas cloud database.
            </p>
            <div className="feature-tags">
              <span>Theme 4: Virtual Identity</span>
              <span>MongoDB Atlas</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. 10 OCEANIC ZONES ROAD MAP PREVIEW ─────────────────────────── */}
      <section id="zones" className="landing-zones-section">
        <div className="section-title-wrap">
          <span className="section-eyebrow">THE 100-LEVEL JOURNEY</span>
          <h2 className="section-headline">10 Magnificent Tropical Zones</h2>
          <p className="section-subtext">
            Start at the sunlit surface of Reef Shallows and plunge deep down into the volcanic Hydrothermal Vents and Ocean Master's Abyss.
          </p>
        </div>

        <div className="zones-carousel-strip">
          {ZONE_PREVIEWS.map((z) => (
            <div key={z.id} className="zone-preview-card glassmorphic">
              <div className="zone-card-top">
                <span className="zone-card-emoji">{z.emoji}</span>
                <span className="zone-card-range">{z.range}</span>
              </div>
              <h4 className="zone-card-name">Zone {z.id}: {z.name}</h4>
              <p className="zone-card-desc">{z.desc}</p>
              <div className="zone-card-milestone">
                <span>⭐ 30 Stars Max</span>
                <span>🎁 Mid-Bonus</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. DIVER IDENTITY & SIGN-IN STATION ─────────────────────────── */}
      <section id="auth-station" className="landing-auth-section">
        <div className="auth-station-card glassmorphic">
          <div className="auth-station-header">
            <div className="auth-icon-halo">
              <ShieldCheck size={32} className="cyan-text" />
            </div>
            <h2>{authMode === 'login' ? 'Diver Sign In' : 'Establish Diver Virtual Identity'}</h2>
            <p className="auth-station-subhead">
              {authMode === 'login'
                ? 'Sign in to sync your 100-level road map, claim treasure bonuses, and rank on the global leaderboard.'
                : 'Choose your aquatic avatar and create a secured diver identity registered in MongoDB Atlas.'}
            </p>

            {/* Mode Tabs */}
            <div className="auth-mode-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  playBubblePop();
                  setAuthMode('login');
                  setErrorMsg('');
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  playBubblePop();
                  setAuthMode('register');
                  setErrorMsg('');
                }}
              >
                Create Account
              </button>
            </div>
          </div>

          {errorMsg && <div className="auth-alert error-alert">{errorMsg}</div>}

          <form onSubmit={handleAuthSubmit} className="landing-auth-form">
            <div className="form-group">
              <label>Username</label>
              <div className="input-with-icon">
                <User size={18} className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. CaptainCoral"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {authMode === 'register' && (
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
              isRegister={authMode === 'register'}
              placeholder="Enter your password"
              required
              onGeneratedSound={playBubblePop}
            />

            {authMode === 'register' && (
              <div className="form-group">
                <label>Choose Your Aquatic Avatar</label>
                <div className="avatar-grid-compact">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      className={`avatar-option-btn ${selectedAvatar === av.id ? 'active' : ''}`}
                      onClick={() => {
                        playBubblePop();
                        setSelectedAvatar(av.id);
                      }}
                      title={av.name}
                    >
                      <span className="av-emoji">{av.emoji}</span>
                      <span className="av-name">{av.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-glow-large submit-btn" disabled={loading}>
              <Sparkles size={18} />
              <span>
                {loading
                  ? 'Authenticating...'
                  : authMode === 'login'
                  ? 'Sign In & Enter Ocean Map'
                  : 'Register Virtual Identity'}
              </span>
            </button>
          </form>

          {/* Quick Demo Button for Instant Review */}
          <div className="quick-guest-divider">
            <span>OR TEST INSTANTLY WITHOUT SIGNING UP</span>
          </div>

          <button
            type="button"
            className="btn-quick-guest-wide"
            onClick={handleQuickGuest}
            disabled={loading}
          >
            <Zap size={18} className="text-amber" />
            <span>⚡ Instant Sailor Guest Demo (1-Click Test Dive)</span>
          </button>

          <div className="auth-footer-note">
            🔒 Theme 4: Access is restricted to authenticated virtual identities (Bcrypt + JWT)
          </div>
        </div>
      </section>

      {/* ── 7. FOOTER ───────────────────────────────────────────────────── */}
      <footer className="landing-footer glassmorphic">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-icon">🐠</span>
            <div>
              <h4>FISH QUEST</h4>
              <p>Distributed Service Architecture • CIS045-3</p>
            </div>
          </div>

          <div className="footer-links">
            <button type="button" onClick={() => onOpenArchitecture && onOpenArchitecture()}>
              4 Themes Architecture Guide
            </button>
            <button type="button" onClick={() => onOpenLeaderboard && onOpenLeaderboard()}>
              Global Leaderboard
            </button>
            <button type="button" onClick={() => scrollToSection('features')}>
              Game Mechanics
            </button>
          </div>

          <div className="footer-copy">
            <p>© 2026 Fish Quest. Built for University of Bedfordshire.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
