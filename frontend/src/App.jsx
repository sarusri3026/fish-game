import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';
import { useFishGame } from './hooks/useFishGame';
import { useLevelProgress, useLevelGame } from './hooks/useLevelSystem';
import Navbar from './components/Navbar';
import GameArena from './components/GameArena';
import LoginPage from './components/LoginPage';
import UserProfileModal from './components/UserProfileModal';
import LeaderboardModal from './components/LeaderboardModal';
import ArchitectureModal from './components/ArchitectureModal';
import GameOverModal from './components/GameOverModal';
import LevelSelectionScreen from './components/LevelSelectionScreen';
import LevelPlayScreen from './components/LevelPlayScreen';
import LevelCompleteModal from './components/LevelCompleteModal';
import LandingPage from './components/LandingPage';
import OtpVerificationPage from './components/OtpVerificationPage';
import { RefreshCw, Grid, Gamepad2, Waves } from 'lucide-react';
import './App.css';

// App screen names
// 'landing' | 'level-select' | 'level-play' | 'free-play'
const SCREEN = {
  LANDING: 'landing',
  LEVEL_SELECT: 'level-select',
  LEVEL_PLAY: 'level-play',
  FREE_PLAY: 'free-play'
};

function MainApp() {
  const { isAuthenticated, loading, challengeToken } = useAuth();

  // Screen state: start at Level Selection
  const [screen, setScreen] = useState(SCREEN.LEVEL_SELECT);
  const [levelCompleteResult, setLevelCompleteResult] = useState(null);
  const [showLevelComplete, setShowLevelComplete] = useState(false);

  // Modal visibility
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);

  // Free play game hook (existing endless mode)
  const game = useFishGame();

  // Level progress from MongoDB (100-level system)
  const { progress, refreshProgress } = useLevelProgress();

  // Level complete callback
  const handleLevelComplete = useCallback((result) => {
    setLevelCompleteResult(result);
    setShowLevelComplete(true);
    refreshProgress();
  }, [refreshProgress]);

  // Level game hook
  const levelGame = useLevelGame({ onLevelComplete: handleLevelComplete });

  // ── Handlers (Defined before conditional returns to avoid TDZ ReferenceError) ──
  const handleSelectLevel = (levelNum) => {
    setShowLevelComplete(false);
    setLevelCompleteResult(null);
    setScreen(SCREEN.LEVEL_PLAY);
    levelGame.startLevel(levelNum);
  };

  const handleGoToLevelSelect = () => {
    setShowLevelComplete(false);
    setLevelCompleteResult(null);
    setScreen(SCREEN.LEVEL_SELECT);
  };

  const handleNextLevel = () => {
    if (!levelCompleteResult) return;
    const nextLvl = (levelCompleteResult.levelNumber || 1) + 1;
    if (nextLvl <= 100) {
      setShowLevelComplete(false);
      setLevelCompleteResult(null);
      levelGame.startLevel(nextLvl);
    }
  };

  const handleRetryLevel = () => {
    if (!levelCompleteResult) return;
    const lvl = levelCompleteResult.levelNumber || 1;
    setShowLevelComplete(false);
    setLevelCompleteResult(null);
    levelGame.startLevel(lvl);
  };

  const handlePlayFreeMode = () => {
    setScreen(SCREEN.FREE_PLAY);
  };

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="identity-loading-screen">
        <div className="loading-card glassmorphic">
          <RefreshCw className="spin-icon text-cyan" size={48} />
          <h2>Verifying Virtual Identity...</h2>
          <p>Connecting to distributed session service</p>
        </div>
      </div>
    );
  }

  // ── Authentication Gate (Landing Page or OTP Verification Page) ─────────────
  if (!isAuthenticated) {
    if (challengeToken) {
      return (
        <OtpVerificationPage
          isStandalone={true}
          onSuccess={handleGoToLevelSelect}
          onCancel={() => {}}
        />
      );
    }

    return (
      <>
        <LandingPage
          onOpenArchitecture={() => setArchitectureModalOpen(true)}
          onOpenLeaderboard={() => setLeaderboardModalOpen(true)}
          onStartAdventure={handleGoToLevelSelect}
        />
        <ArchitectureModal
          isOpen={architectureModalOpen}
          onClose={() => setArchitectureModalOpen(false)}
        />
        <LeaderboardModal
          isOpen={leaderboardModalOpen}
          onClose={() => setLeaderboardModalOpen(false)}
        />
      </>
    );
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="game-app-shell">
      {/* Top Navigation */}
      <Navbar
        onOpenAuth={() => {}}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenLeaderboard={() => setLeaderboardModalOpen(true)}
        onOpenArchitecture={() => setArchitectureModalOpen(true)}
        extraButtons={
          <div className="nav-screen-switcher">
            <button
              className={`nav-btn nav-btn-outline ${screen === SCREEN.LANDING ? 'active' : ''}`}
              onClick={() => setScreen(SCREEN.LANDING)}
              title="Return to Landing Page with Underwater Video"
            >
              <Waves size={16} /> Home / Video
            </button>
            <button
              className={`nav-screen-btn ${screen === SCREEN.LEVEL_SELECT ? 'active' : ''}`}
              onClick={handleGoToLevelSelect}
              title="Level Selection"
            >
              <Grid size={16} /> Levels
            </button>
            <button
              className={`nav-screen-btn ${screen === SCREEN.FREE_PLAY ? 'active' : ''}`}
              onClick={handlePlayFreeMode}
              title="Free Play (Classic Endless)"
            >
              <Gamepad2 size={16} /> Free Play
            </button>
          </div>
        }
      />

      {/* Main Content */}
      <main className="main-content">
        {screen === SCREEN.LANDING && (
          <LandingPage
            onOpenArchitecture={() => setArchitectureModalOpen(true)}
            onOpenLeaderboard={() => setLeaderboardModalOpen(true)}
            onStartAdventure={handleGoToLevelSelect}
          />
        )}

        {screen === SCREEN.LEVEL_SELECT && (
          <LevelSelectionScreen
            progress={progress}
            refreshProgress={refreshProgress}
            onSelectLevel={handleSelectLevel}
            onPlayFreeMode={handlePlayFreeMode}
          />
        )}

        {screen === SCREEN.LEVEL_PLAY && (
          <LevelPlayScreen
            levelGame={levelGame}
            onBackToSelection={handleGoToLevelSelect}
          />
        )}

        {screen === SCREEN.FREE_PLAY && (
          <GameArena game={game} />
        )}
      </main>

      {/* Footer */}
      <footer className="footer-bar">
        <div className="footer-content">
          <span>CIS045-3 Distributed Service Architectures • Protected Virtual Identity Mode</span>
          <button
            className="footer-arch-link"
            onClick={() => setArchitectureModalOpen(true)}
          >
            Review 4 Themes & 10-Min Video Script 📜
          </button>
        </div>
      </footer>

      {/* ── Modals ── */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
      <LeaderboardModal
        isOpen={leaderboardModalOpen}
        onClose={() => setLeaderboardModalOpen(false)}
      />
      <ArchitectureModal
        isOpen={architectureModalOpen}
        onClose={() => setArchitectureModalOpen(false)}
      />

      {/* Free-play Game Over Modal */}
      <GameOverModal
        isOpen={screen === SCREEN.FREE_PLAY && game.gameState === 'GAME_OVER'}
        score={game.score}
        round={game.round}
        stats={game.stats}
        onRestart={game.startGame}
        onViewLeaderboard={() => setLeaderboardModalOpen(true)}
      />

      {/* Level Complete Modal */}
      <LevelCompleteModal
        isOpen={showLevelComplete}
        result={levelCompleteResult}
        onRetry={handleRetryLevel}
        onNextLevel={handleNextLevel}
        onLevelSelection={handleGoToLevelSelect}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SoundProvider>
        <MainApp />
      </SoundProvider>
    </AuthProvider>
  );
}
