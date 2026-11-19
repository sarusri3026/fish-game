import React, { useEffect, useState } from 'react';
import {
  Clock,
  HelpCircle,
  Wind,
  RefreshCw,
  Send,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Star,
  Zap,
  ZoomIn
} from 'lucide-react';
import { useSound } from '../context/SoundContext';

/**
 * LevelPlayScreen - Premium Underwater Porthole Level Gameplay UI
 * Features:
 * - Live 3-Star Countdown Gauge with real-time performance tier indicators
 * - Red ribbon signpost level header matching the map aesthetics
 * - Golden Submarine Porthole puzzle viewport
 * - Tactical sonar & oxygen power-up controls
 * - Tactile 3D keypad console with responsive keyboard binding
 */
export default function LevelPlayScreen({ levelGame, onBackToSelection }) {
  const { playBubblePop, playCorrect, playWrong } = useSound();
  const [zoomedImage, setZoomedImage] = useState(false);

  const {
    levelGameState,
    currentLevel,
    timeLeft,
    timeLimit,
    timerPercent,
    isTimeCritical,
    puzzle,
    selectedAnswer,
    setSelectedAnswer,
    hintAvailable,
    disabledDigits,
    errorMsg,
    startLevel,
    submitAnswer,
    useSonarHint,
    useExtraAir
  } = levelGame;

  // Keyboard Event Listener (Theme 2: Event-Driven Programming)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (levelGameState !== 'PLAYING') return;

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
        playBubblePop();
        setSelectedAnswer('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [levelGameState, selectedAnswer, disabledDigits, playBubblePop, setSelectedAnswer, submitAnswer]);

  const handleDigitClick = (digit) => {
    if (disabledDigits.includes(digit) || levelGameState !== 'PLAYING') return;
    playBubblePop();
    setSelectedAnswer(String(digit));
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    if (selectedAnswer === '' || levelGameState !== 'PLAYING') return;
    submitAnswer(selectedAnswer);
  };

  // Zone info helper
  const getZoneLabel = (lvl) => {
    if (lvl <= 10) return { name: 'Reef Shallows', emoji: '🐚', color: '#10b981' };
    if (lvl <= 20) return { name: 'Coral Gardens', emoji: '🪸', color: '#f97316' };
    if (lvl <= 30) return { name: 'Crystal Lagoon', emoji: '💎', color: '#8b5cf6' };
    if (lvl <= 40) return { name: 'Sunken Galleon', emoji: '🏴‍☠️', color: '#eab308' };
    if (lvl <= 50) return { name: 'Open Ocean', emoji: '🌊', color: '#0ea5e9' };
    if (lvl <= 60) return { name: 'Electric Shallows', emoji: '⚡', color: '#6366f1' };
    if (lvl <= 70) return { name: 'Twilight Depths', emoji: '🐙', color: '#3b82f6' };
    if (lvl <= 80) return { name: 'Midnight Trench', emoji: '🦑', color: '#1d4ed8' };
    if (lvl <= 90) return { name: 'Hydrothermal Vents', emoji: '🌋', color: '#ef4444' };
    return { name: "Ocean Master's Abyss", emoji: '👑', color: '#d97706' };
  };

  const zoneInfo = getZoneLabel(currentLevel || 1);

  // Live Star Tier Calculation based on timeRatio
  const timeRatio = timeLimit > 0 ? timeLeft / timeLimit : 0;
  const currentPotentialStars = timeRatio >= 0.55 ? 3 : timeRatio >= 0.25 ? 2 : 1;

  // Star threshold positions on the 100% timer bar
  const star3ThresholdPercent = 55;
  const star2ThresholdPercent = 25;

  const isSubmitting = levelGameState === 'SUBMITTING';
  const isPlaying = levelGameState === 'PLAYING';

  // If IDLE without a puzzle, show start level card
  if (levelGameState === 'IDLE' && !puzzle) {
    return (
      <div className="aquarium-arena level-play-arena">
        <div className="bubble b1" /><div className="bubble b2" /><div className="bubble b3" />
        <div className="lobby-card glassmorphic">
          <div className="lobby-icon">🎯</div>
          <h2 className="lobby-title">Level #{currentLevel || 1}</h2>
          <p className="lobby-desc">
            {zoneInfo.emoji} {zoneInfo.name} &bull; Solve the fish puzzle before time runs out to earn up to 3 stars!
          </p>
          {errorMsg && <p className="level-error-text">{errorMsg}</p>}
          <div className="gameover-actions" style={{ marginTop: '1.2rem' }}>
            <button
              className="btn-glow-large"
              onClick={() => currentLevel && startLevel(currentLevel)}
            >
              <RefreshCw size={18} /> Start Challenge
            </button>
            <button className="btn-outline-wide" onClick={onBackToSelection}>
              <ArrowLeft size={18} /> River Trail Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aquarium-arena level-play-arena">
      {/* Background aquatic ambient particles */}
      <div className="bubble b1" /><div className="bubble b2" />
      <div className="bubble b3" /><div className="bubble b4" />
      <div className="bubble b5" /><div className="bubble b6" />
      <div className="swimming-fish f1">🐠</div>
      <div className="swimming-fish f2">🐟</div>
      <div className="swimming-fish f3">🐡</div>

      {/* Main Container */}
      <div className="level-play-container">
        {/* ── TOP HUD HEADER ──────────────────────────────────────────────── */}
        <div className="level-hud-header glassmorphic">
          {/* Back Button */}
          <button
            className="hud-back-btn"
            onClick={() => {
              playBubblePop();
              onBackToSelection();
            }}
            title="Return to River Map"
          >
            <ArrowLeft size={18} />
            <span>Map</span>
          </button>

          {/* Center Stage Shield Badge (Matches River Signpost Theme) */}
          <div className="hud-stage-shield">
            <div className="shield-wood-beam"></div>
            <div className="shield-banner">
              <span className="shield-lvl-prefix">LEVEL</span>
              <span className="shield-lvl-num">{currentLevel}</span>
            </div>
            <div className="shield-zone-tag">
              <span>{zoneInfo.emoji} {zoneInfo.name}</span>
            </div>
          </div>

          {/* Live Potential Star Indicator */}
          <div className="hud-star-meter">
            <div className="star-meter-header">
              <span className="star-meter-label">PERFORMANCE TIER</span>
              <span className={`star-meter-tier tier-${currentPotentialStars}`}>
                {currentPotentialStars === 3
                  ? '🌟 3-Star Pace'
                  : currentPotentialStars === 2
                  ? '⭐ 2-Star Pace'
                  : '⚠️ 1-Star Pace'}
              </span>
            </div>

            {/* Visual 3-Star Live Display */}
            <div className="hud-live-stars-row">
              <Star
                size={22}
                className={currentPotentialStars >= 1 ? 'hud-star-earned' : 'hud-star-empty'}
                fill={currentPotentialStars >= 1 ? 'currentColor' : 'none'}
              />
              <Star
                size={26}
                className={currentPotentialStars >= 2 ? 'hud-star-earned pulse-star' : 'hud-star-empty'}
                fill={currentPotentialStars >= 2 ? 'currentColor' : 'none'}
              />
              <Star
                size={22}
                className={currentPotentialStars >= 3 ? 'hud-star-earned pulse-star' : 'hud-star-empty'}
                fill={currentPotentialStars >= 3 ? 'currentColor' : 'none'}
              />
            </div>
          </div>
        </div>

        {/* ── LIVE TIMER & STAR THRESHOLD GAUGE BAR ────────────────────────── */}
        <div className="star-threshold-gauge glassmorphic">
          <div className="gauge-header">
            <div className="gauge-time-left">
              <Clock size={16} className={isTimeCritical ? 'pulse-red' : 'text-cyan'} />
              <span className={`gauge-seconds ${isTimeCritical ? 'text-red' : ''}`}>
                {timeLeft}s <em>remaining</em>
              </span>
            </div>
            <div className="gauge-speed-tip">
              {currentPotentialStars >= 2 ? (
                <span className="tip-pass">✅ Unlocks Next Level</span>
              ) : (
                <span className="tip-warn">⚠️ Need 2★ to Unlock Next</span>
              )}
            </div>
          </div>

          {/* Multi-tier Progress Bar with Marker Thresholds */}
          <div className="gauge-track">
            {/* 3-Star Threshold Marker (at 55%) */}
            <div
              className="gauge-threshold-marker marker-3star"
              style={{ left: `${star3ThresholdPercent}%` }}
              title="Maintain >55% time for 3 Stars"
            >
              <span className="marker-flag">3★</span>
            </div>

            {/* 2-Star Threshold Marker (at 25%) */}
            <div
              className="gauge-threshold-marker marker-2star"
              style={{ left: `${star2ThresholdPercent}%` }}
              title="Maintain >25% time for 2 Stars"
            >
              <span className="marker-flag">2★</span>
            </div>

            {/* The Animated Fill */}
            <div
              className={`gauge-fill ${
                currentPotentialStars === 3
                  ? 'fill-3star'
                  : currentPotentialStars === 2
                  ? 'fill-2star'
                  : 'fill-1star'
              } ${isTimeCritical ? 'fill-critical' : ''}`}
              style={{ width: `${timerPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Error Notification Banner if any */}
        {errorMsg && (
          <div className="level-error-banner glassmorphic">
            <AlertCircle size={18} className="text-red" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── ARENA MAIN GRID: PORTHOLE PUZZLE + TACTICAL KEYPAD ────────── */}
        <div className="level-grid-main">
          {/* LEFT: SUBMERSIBLE PORTHOLE PUZZLE FRAME */}
          <div className="porthole-card glassmorphic">
            {/* Frame Top Meta */}
            <div className="porthole-top-bar">
              <div className="api-badge-pill">
                <span className="live-dot pulse-green"></span>
                <span className="api-badge-text">
                  {puzzle?.cached ? 'Genuine Cached Puzzle' : 'Live Marc Conrad API'}
                </span>
              </div>
              <span className="porthole-mission-label">
                Count the fish in the porthole:
              </span>
            </div>

            {/* Porthole Viewport Frame */}
            <div className="porthole-viewport-wrapper">
              <div className="porthole-brass-rim">
                {/* Brass Rivet Screws */}
                <span className="rivet r-tl"></span>
                <span className="rivet r-tr"></span>
                <span className="rivet r-bl"></span>
                <span className="rivet r-br"></span>
                <span className="rivet r-tc"></span>
                <span className="rivet r-bc"></span>

                <div className="porthole-glass-inner">
                  {levelGameState === 'LOADING' ? (
                    <div className="porthole-loading">
                      <RefreshCw className="spin-icon text-cyan" size={48} />
                      <h4>Loading Level #{currentLevel}...</h4>
                      <p>Establishing encrypted round session with Fish API</p>
                    </div>
                  ) : puzzle?.question ? (
                    <div className="porthole-img-container">
                      <img
                        src={puzzle.question}
                        alt={`Level ${currentLevel} Fish Challenge`}
                        className={`porthole-fish-img ${zoomedImage ? 'img-zoomed' : ''}`}
                        onClick={() => setZoomedImage(!zoomedImage)}
                        title="Click to toggle zoom"
                      />
                      <button
                        className="zoom-toggle-pill"
                        onClick={() => setZoomedImage(!zoomedImage)}
                        title="Zoom Image"
                      >
                        <ZoomIn size={14} />
                        <span>{zoomedImage ? 'Normal' : 'Zoom'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="porthole-error">
                      <p>Unable to load fish puzzle image.</p>
                      <button
                        className="btn-outline-wide"
                        onClick={() => startLevel(currentLevel)}
                      >
                        <RefreshCw size={16} /> Reconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Underwater Power-Ups Bar */}
            <div className="porthole-powerups-row">
              <button
                className={`powerup-tactical-btn sonar-btn ${!hintAvailable || !isPlaying ? 'powerup-disabled' : ''}`}
                onClick={useSonarHint}
                disabled={!hintAvailable || !isPlaying}
                title="Eliminates 5 wrong numbers from the keypad"
              >
                <div className="powerup-icon-wrap">
                  <HelpCircle size={20} />
                </div>
                <div className="powerup-text-wrap">
                  <strong>Sonar Ping</strong>
                  <span>{hintAvailable ? 'Eliminates 5 Wrong Digits' : 'Used This Round'}</span>
                </div>
                <span className="powerup-count-pill">{hintAvailable ? '1' : '0'}</span>
              </button>

              <button
                className={`powerup-tactical-btn oxygen-btn ${!isPlaying ? 'powerup-disabled' : ''}`}
                onClick={useExtraAir}
                disabled={!isPlaying}
                title="Adds +10 seconds of breathing oxygen to the timer"
              >
                <div className="powerup-icon-wrap">
                  <Wind size={20} />
                </div>
                <div className="powerup-text-wrap">
                  <strong>+10s Oxygen Tank</strong>
                  <span>Extend Dive Time</span>
                </div>
                <span className="powerup-count-pill">+10s</span>
              </button>
            </div>
          </div>

          {/* RIGHT: TACTICAL DIVER CONSOLE & KEYPAD */}
          <div className="diver-console-card glassmorphic">
            {/* Digital Guess Readout Screen */}
            <div className="console-screen-card">
              <span className="console-screen-label">ENTER FISH COUNT</span>
              <div className="console-screen-display">
                {selectedAnswer !== '' ? (
                  <span className="console-display-digit">{selectedAnswer}</span>
                ) : (
                  <span className="console-display-placeholder">_</span>
                )}
              </div>
              <span className="console-screen-status">
                {selectedAnswer !== ''
                  ? 'Target Locked • Hit Submit Below'
                  : 'Select a number from the keypad'}
              </span>
            </div>

            {/* 3D Tactile Keypad (1 to 9, then 0) */}
            <div className="diver-keypad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => {
                const isDisabled = disabledDigits.includes(num);
                const isSelected = selectedAnswer === String(num);

                return (
                  <button
                    key={num}
                    type="button"
                    className={`diver-key-btn ${isSelected ? 'key-active' : ''} ${
                      isDisabled ? 'key-sonar-disabled' : ''
                    }`}
                    onClick={() => handleDigitClick(num)}
                    disabled={isDisabled || !isPlaying}
                  >
                    <span className="key-num">{num}</span>
                    {isDisabled && <span className="key-sonar-cross">✕</span>}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons: Clear & Big Glowing Submit */}
            <div className="diver-actions-group">
              <button
                type="button"
                className="diver-btn-clear"
                onClick={() => {
                  playBubblePop();
                  setSelectedAnswer('');
                }}
                disabled={selectedAnswer === '' || !isPlaying}
              >
                Clear
              </button>

              <button
                type="button"
                className={`diver-btn-submit ${
                  selectedAnswer !== '' && isPlaying ? 'submit-ready' : ''
                }`}
                onClick={handleSubmitClick}
                disabled={selectedAnswer === '' || !isPlaying || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={20} className="spin-icon" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Confirm Guess</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Keyboard Helper Pill */}
            <div className="diver-keyboard-hint">
              <Zap size={14} className="text-amber" />
              <span>Keyboard support: Press <strong>0–9</strong> & hit <strong>Enter</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
