import React, { useState, useEffect } from 'react';
import {
  Lock,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
  Compass,
  Grid,
  Gift,
  Award,
  Navigation,
  Play,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowRight,
  Zap,
  Coins,
  ShieldAlert,
  Flame,
  Check
} from 'lucide-react';
import { useSound } from '../context/SoundContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// 10 Thematic Stages (each stage has 10 levels = 100 levels total)
const STAGES = [
  { id: 0, name: 'Reef Shallows', range: [1, 10], emoji: '🐚', bgClass: 'stage-reef', description: 'Sunlit turquoise sands & coastal coral coves' },
  { id: 1, name: 'Coral Gardens', range: [11, 20], emoji: '🪸', bgClass: 'stage-coral', description: 'Vibrant anemone groves and sea fan forests' },
  { id: 2, name: 'Crystal Lagoon', range: [21, 30], emoji: '💎', bgClass: 'stage-lagoon', description: 'Glowing purple quartz stream & cavern springs' },
  { id: 3, name: 'Sunken Galleon', range: [31, 40], emoji: '🏴‍☠️', bgClass: 'stage-pirate', description: 'Ancient shipwrecks, pirate gold & anchor reefs' },
  { id: 4, name: 'Open Ocean Currents', range: [41, 50], emoji: '🌊', bgClass: 'stage-ocean', description: 'Fast-flowing pelagic blue and manta ray highways' },
  { id: 5, name: 'Electric Shallows', range: [51, 60], emoji: '⚡', bgClass: 'stage-electric', description: 'Bioluminescent reef banks & jelly sanctuaries' },
  { id: 6, name: 'Twilight Depths', range: [61, 70], emoji: '🐙', bgClass: 'stage-twilight', description: 'Shadowy cavern passages and cephalopod dens' },
  { id: 7, name: 'Midnight Trench', range: [71, 80], emoji: '🦑', bgClass: 'stage-trench', description: 'Deep ocean rift expedition into the dark abyss' },
  { id: 8, name: 'Hydrothermal Vents', range: [81, 90], emoji: '🌋', bgClass: 'stage-vents', description: 'Mineral chimney towers & volcanic thermal seas' },
  { id: 9, name: "Ocean Master's Abyss", range: [91, 100], emoji: '👑', bgClass: 'stage-master', description: 'The legendary deep-sea throne of the 100th level' }
];

// Coordinates in percentage (left %, top %) for the 10 levels along the winding river trail
// Matching the reference image flow:
// 1 at bottom right, 2 to the left, 3 curve up, 4 curve right, 5 center, 6 left, 7 far left (crystals), 8 up-center, 9 right, 10 summit
const TRAIL_COORDINATES = [
  { left: 78, top: 84 }, // Level 1 (bottom right)
  { left: 52, top: 85 }, // Level 2 (bottom center-left)
  { left: 59, top: 68 }, // Level 3 (curves up)
  { left: 75, top: 50 }, // Level 4 (curves right by lagoon)
  { left: 48, top: 43 }, // Level 5 (center trail)
  { left: 26, top: 51 }, // Level 6 (left curve)
  { left: 11, top: 35 }, // Level 7 (far left near crystals)
  { left: 30, top: 21 }, // Level 8 (upper left curve)
  { left: 63, top: 17 }, // Level 9 (upper right bend)
  { left: 80, top: 7 }   // Level 10 (stage summit!)
];

/**
 * Curved 3-Star Tray Component
 * Tilted stars in a golden wooden tray underneath the banner, just like the reference image
 */
function StarTray({ stars = 0, isLocked = false }) {
  return (
    <div className={`river-star-tray ${isLocked ? 'tray-locked' : ''}`}>
      {/* Left Star (tilted -16deg) */}
      <span className={`tray-star star-left ${stars >= 1 ? 'earned' : 'empty'}`}>
        ★
      </span>
      {/* Center Star (larger, center) */}
      <span className={`tray-star star-center ${stars >= 2 ? 'earned' : 'empty'}`}>
        ★
      </span>
      {/* Right Star (tilted +16deg) */}
      <span className={`tray-star star-right ${stars >= 3 ? 'earned' : 'empty'}`}>
        ★
      </span>
    </div>
  );
}

/**
 * LevelSignpostNode
 * Exact replica of the reference image signpost:
 * - Wooden crossbar with pegs
 * - Red ribbon banner shield with bold level number
 * - Curved wooden base holding 3 stars
 * - Animated avatar mascot on current level
 * - Interactive hover tooltip card
 */
function LevelSignpostNode({
  levelNum,
  levelData,
  unlockedLevel,
  isCurrent,
  coords,
  avatarEmoji,
  onClick
}) {
  const { playBubblePop, playWrong } = useSound();
  const [shaking, setShaking] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isLocked = levelNum > unlockedLevel;
  const isCompleted = levelData && levelData.stars >= 2;
  const stars = levelData ? levelData.stars : 0;
  const highScore = levelData?.highScore || 0;

  const handleClick = () => {
    if (isLocked) {
      playWrong();
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    playBubblePop();
    onClick(levelNum);
  };

  return (
    <div
      className={`river-level-node ${coords ? 'absolute-pos' : ''} ${isLocked ? 'node-locked' : ''} ${
        isCurrent ? 'node-current' : ''
      } ${isCompleted ? 'node-completed' : ''} ${shaking ? 'node-shaking' : ''}`}
      style={coords ? { left: `${coords.left}%`, top: `${coords.top}%` } : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Current Level Floating Avatar Mascot */}
      {isCurrent && (
        <div className="current-player-pin" title="Your current unlocked level!">
          <div className="avatar-bubble">
            <span className="avatar-emoji-bounce">{avatarEmoji || '🐠'}</span>
          </div>
          <div className="here-tag">HERE!</div>
        </div>
      )}

      {/* Floating Hover Details Tooltip */}
      {hovered && (
        <div className="node-hover-tooltip glassmorphic">
          <div className="tooltip-head">
            <span className="tooltip-title">Level #{levelNum}</span>
            <span className={`tooltip-status-pill ${isLocked ? 'pill-locked' : isCompleted ? 'pill-done' : 'pill-ready'}`}>
              {isLocked ? '🔒 Locked' : isCompleted ? '⭐ Completed' : '⚡ Ready!'}
            </span>
          </div>
          <div className="tooltip-stats">
            <div className="tooltip-stat">
              <span>Stars:</span>
              <strong>{isLocked ? '0 / 3' : `${stars} / 3 ⭐`}</strong>
            </div>
            {highScore > 0 && (
              <div className="tooltip-stat">
                <span>Best:</span>
                <strong>{highScore.toLocaleString()} pts</strong>
              </div>
            )}
          </div>
          {isLocked && (
            <span className="tooltip-unlock-tip">
              Earn at least 2★ in Level {levelNum - 1} to unlock
            </span>
          )}
        </div>
      )}

      {/* The Clickable Signpost Banner */}
      <button
        className="signpost-hitbox"
        onClick={handleClick}
        title={
          isLocked
            ? `Locked! Earn 2+ stars in Level ${levelNum - 1} to unlock`
            : `Dive into Level ${levelNum}!`
        }
      >
        {/* Wooden Top Stake & Pegs */}
        <div className="signpost-wood-top">
          <span className="wood-peg left"></span>
          <span className="wood-beam"></span>
          <span className="wood-peg right"></span>
        </div>

        {/* Main Ribbon / Banner */}
        <div className={`signpost-banner ${isLocked ? 'banner-stone' : 'banner-red'}`}>
          <div className="banner-inner">
            {isLocked ? (
              <Lock size={20} className="banner-lock-icon" />
            ) : (
              <span className="banner-number">{levelNum}</span>
            )}
          </div>
          <div className="banner-tail"></div>
        </div>

        {/* Curved 3-Star Tray Base */}
        <StarTray stars={stars} isLocked={isLocked} />

        {/* High Score Label (if completed) */}
        {!isLocked && highScore > 0 && (
          <div className="node-score-pill">
            {highScore.toLocaleString()}
          </div>
        )}
      </button>
    </div>
  );
}

/**
 * LevelSelectionScreen
 * Visual winding river trail with floating scenery & 100-level stage pagination
 * Interactive Mid-Zone Bonus Chest & Zone Gate summit milestones
 */
export default function LevelSelectionScreen({
  progress,
  refreshProgress,
  onSelectLevel,
  onPlayFreeMode
}) {
  const { playBubblePop, playCorrect, playWrong, playStreak } = useSound();
  const { user } = useAuth();

  const totalStars = progress?.totalStars || 0;
  const completedLevels = progress?.completedLevels || 0;
  const unlockedLevel = progress?.unlockedLevel || 1;

  // Find the initial stage based on the player's unlocked level
  const currentStageIndex = Math.min(9, Math.max(0, Math.floor((unlockedLevel - 1) / 10)));
  const [activeStage, setActiveStage] = useState(currentStageIndex);
  const [viewMode, setViewMode] = useState('trail'); // 'trail' (winding river) or 'grid' (all 100 levels)

  // Modals state for Mid-Zone Bonus & Zone Gate
  const [chestModalOpen, setChestModalOpen] = useState(false);
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [claimingChest, setClaimingChest] = useState(false);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState('');

  // Update stage if unlockedLevel advances into a new stage
  useEffect(() => {
    const stageForUnlocked = Math.min(9, Math.max(0, Math.floor((unlockedLevel - 1) / 10)));
    setActiveStage(stageForUnlocked);
  }, [unlockedLevel]);

  const currentStage = STAGES[activeStage];
  const stageLevels = Array.from(
    { length: currentStage.range[1] - currentStage.range[0] + 1 },
    (_, i) => currentStage.range[0] + i
  );

  const prevStage = () => {
    if (activeStage > 0) {
      playBubblePop();
      setActiveStage(activeStage - 1);
    }
  };

  const nextStage = () => {
    if (activeStage < STAGES.length - 1) {
      playBubblePop();
      setActiveStage(activeStage + 1);
    }
  };

  // Jump to player's current unlocked level's stage
  const jumpToCurrentLevel = () => {
    playBubblePop();
    const targetStage = Math.min(9, Math.max(0, Math.floor((unlockedLevel - 1) / 10)));
    setActiveStage(targetStage);
  };

  // Calculate stars earned in current stage
  const stageStarsEarned = stageLevels.reduce((sum, lvl) => {
    const data = progress?.levels?.[String(lvl)];
    return sum + (data?.stars || 0);
  }, 0);

  const stageCompletedCount = stageLevels.filter((lvl) => {
    const data = progress?.levels?.[String(lvl)];
    return data && data.stars >= 2;
  }).length;

  // Target Levels for Milestones
  const midZoneLevel = currentStage.range[0] + 4; // Level 5, 15, 25, etc.
  const summitLevel = currentStage.range[1];      // Level 10, 20, 30, etc.

  const midZoneData = progress?.levels?.[String(midZoneLevel)];
  const isMidZoneDone = Boolean(midZoneData && midZoneData.stars >= 2);
  const midZoneKey = `zone_${activeStage}_mid_chest`;
  const isChestClaimed = Boolean(progress?.claimedBonuses?.[midZoneKey]);

  const summitData = progress?.levels?.[String(summitLevel)];
  const isSummitDone = Boolean(summitData && summitData.stars >= 2);

  // Claim Mid-Zone Bonus Chest
  const handleClaimChest = async () => {
    if (!isMidZoneDone || isChestClaimed || claimingChest) return;
    try {
      setClaimingChest(true);
      const res = await api.claimLevelBonus({
        bonusKey: midZoneKey,
        stageId: activeStage,
        levelNumber: midZoneLevel
      });

      if (res.success) {
        playStreak();
        setClaimSuccessMsg('+500 Ocean Credits & Expedition Perks Awarded!');
        if (refreshProgress) {
          await refreshProgress();
        }
      } else {
        playWrong();
      }
    } catch (err) {
      console.error('Bonus claim error:', err);
      playWrong();
    } finally {
      setClaimingChest(false);
    }
  };

  // Advance to Next Zone via Zone Gate
  const handleAdvanceToNextZone = () => {
    if (activeStage < STAGES.length - 1) {
      playStreak();
      setActiveStage(activeStage + 1);
      setGateModalOpen(false);
    }
  };

  // Jump directly to level from modal
  const handleJumpToLevel = (lvl) => {
    setChestModalOpen(false);
    setGateModalOpen(false);
    onSelectLevel(lvl);
  };

  return (
    <div className="adventure-map-screen">
      {/* Atmospheric rising bubbles */}
      <div className="bubble b1" /><div className="bubble b2" />
      <div className="bubble b3" /><div className="bubble b4" />
      <div className="bubble b5" /><div className="bubble b6" />

      {/* Floating Decorative Fish in Background */}
      <div className="ambient-fish fish-1">🐠</div>
      <div className="ambient-fish fish-2">🐟</div>
      <div className="ambient-fish fish-3">🐡</div>

      {/* ── TOP STATS & NAVIGATION BAR ─────────────────────────────────────── */}
      <div className="map-topbar glassmorphic">
        <div className="map-title-group">
          <div className="map-icon-halo">🗺️</div>
          <div>
            <h2 className="map-headline">Fish Quest Road Map</h2>
            <p className="map-subhead">100 Underwater Expedition Levels across 10 Tropical Zones</p>
          </div>
        </div>

        <div className="map-stats-cluster">
          {/* Quick Jump to Frontier Button */}
          <button
            className="jump-frontier-btn"
            onClick={jumpToCurrentLevel}
            title={`Jump to your current frontier: Level ${unlockedLevel}`}
          >
            <Navigation size={16} />
            <span>Go to Level {unlockedLevel}</span>
          </button>

          <div className="map-stat-badge gold-badge">
            <span className="badge-icon">⭐</span>
            <div className="badge-details">
              <span className="badge-value">{totalStars} / 300</span>
              <span className="badge-label">TOTAL STARS</span>
            </div>
          </div>

          <div className="map-stat-badge green-badge">
            <span className="badge-icon">🏆</span>
            <div className="badge-details">
              <span className="badge-value">{completedLevels} / 100</span>
              <span className="badge-label">CONQUERED</span>
            </div>
          </div>

          <div className="map-stat-badge cyan-badge">
            <span className="badge-icon">🔓</span>
            <div className="badge-details">
              <span className="badge-value">Level {unlockedLevel}</span>
              <span className="badge-label">DEPTH REACHED</span>
            </div>
          </div>

          {/* Toggle View Mode Button */}
          <button
            className="view-toggle-btn"
            onClick={() => {
              playBubblePop();
              setViewMode(viewMode === 'trail' ? 'grid' : 'trail');
            }}
            title={viewMode === 'trail' ? 'Switch to 100-Grid Overview' : 'Switch to River Road Map'}
          >
            {viewMode === 'trail' ? <Grid size={16} /> : <Compass size={16} />}
            <span>{viewMode === 'trail' ? '100 Grid' : 'Road Map'}</span>
          </button>
        </div>
      </div>

      {/* ── STAGE SELECTOR CARD (10 Levels Per Stage) ────────────────────── */}
      <div className="stage-selector-card glassmorphic">
        <button
          className="stage-nav-arrow"
          onClick={prevStage}
          disabled={activeStage === 0}
          title="Previous Zone"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="stage-info-pill">
          <span className="stage-emoji">{currentStage.emoji}</span>
          <div className="stage-titles">
            <div className="stage-name-row">
              <span className="stage-label">ZONE {currentStage.id + 1} OF 10:</span>
              <h3 className="stage-name">{currentStage.name}</h3>
              <span className="stage-range-tag">Levels {currentStage.range[0]}–{currentStage.range[1]}</span>
            </div>
            <p className="stage-desc">{currentStage.description}</p>
          </div>
        </div>

        {/* Milestone Shortcuts right in Stage Bar */}
        <div className="stage-milestone-shortcuts">
          <button
            type="button"
            className={`stage-shortcut-btn ${
              isChestClaimed ? 'shortcut-claimed' : isMidZoneDone ? 'shortcut-ready' : 'shortcut-locked'
            }`}
            onClick={() => {
              playBubblePop();
              setChestModalOpen(true);
            }}
            title="Open Mid-Zone Bonus Chest"
          >
            <Gift size={15} />
            <span>
              Chest: {isChestClaimed ? 'Claimed ✅' : isMidZoneDone ? 'Ready! 🎁' : `Lvl ${midZoneLevel} 🔒`}
            </span>
          </button>

          <button
            type="button"
            className={`stage-shortcut-btn ${isSummitDone ? 'shortcut-ready' : 'shortcut-locked'}`}
            onClick={() => {
              playBubblePop();
              setGateModalOpen(true);
            }}
            title="Open Zone Gate"
          >
            <Trophy size={15} />
            <span>
              Gate: {isSummitDone ? 'Mastered 🏆' : `Lvl ${summitLevel} 🔒`}
            </span>
          </button>
        </div>

        {/* Stage Progress summary */}
        <div className="stage-star-progress">
          <div className="stage-progress-labels">
            <span className="star-prog-text">
              ⭐ {stageStarsEarned} / 30 Stars
            </span>
            <span className="stage-clear-text">
              {stageCompletedCount}/10 Cleared
            </span>
          </div>
          <div className="star-prog-bar">
            <div
              className="star-prog-fill"
              style={{ width: `${(stageStarsEarned / 30) * 100}%` }}
            ></div>
          </div>
        </div>

        <button
          className="stage-nav-arrow"
          onClick={nextStage}
          disabled={activeStage === STAGES.length - 1}
          title="Next Zone"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* ── 10-ZONE MINI PILLS BAR (Quick Stage Jump) ─────────────────────── */}
      <div className="stages-pills-row">
        {STAGES.map((stg) => {
          const isStgUnlocked = stg.range[0] <= unlockedLevel;
          const isStgCurrent = activeStage === stg.id;
          return (
            <button
              key={stg.id}
              className={`stage-mini-pill ${isStgCurrent ? 'active' : ''} ${!isStgUnlocked ? 'locked' : ''}`}
              onClick={() => {
                playBubblePop();
                setActiveStage(stg.id);
              }}
              title={`${stg.name} (Lvls ${stg.range[0]}-${stg.range[1]})`}
            >
              <span>{stg.emoji}</span>
              <span className="pill-lvl-text">{stg.range[0]}-{stg.range[1]}</span>
              {!isStgUnlocked && <Lock size={10} className="pill-lock" />}
            </button>
          );
        })}
      </div>

      {/* ── MAIN VIEW: WINDING RIVER ROAD MAP ────────────────────────────── */}
      {viewMode === 'trail' ? (
        <div className={`river-adventure-canvas ${currentStage.bgClass}`}>
          {/* LUSH LANDSCAPE PROPS MATCHING THE REFERENCE IMAGE */}
          <div className="landscape-decor crystal-gem top-left" title="Mystic Sea Crystal">🔮</div>
          <div className="landscape-decor palm-tree top-right">🌴</div>
          <div className="landscape-decor palm-tree mid-left">🌴</div>
          <div className="landscape-decor palm-tree bottom-mid">🌴</div>
          <div className="landscape-decor coral-bush mid-right">🪸</div>
          <div className="landscape-decor coral-bush top-mid">🌺</div>
          <div className="landscape-decor coral-bush bottom-left">🌺</div>
          <div className="landscape-decor wood-stump stump-1">🪵</div>
          <div className="landscape-decor wood-stump stump-2">🪵</div>
          <div className="landscape-decor sea-mushroom mush-1">🍄</div>
          <div className="landscape-decor sea-mushroom mush-2">🍄</div>

          {/* Side Lagoon Pool with Shimmer */}
          <div className="landscape-decor water-lagoon right-lagoon">
            <span className="lagoon-fish">🐠</span>
          </div>

          {/* ── MILESTONE 1: INTERACTIVE MID-STAGE BONUS CHEST (At Level 5) ── */}
          <button
            type="button"
            className={`roadmap-milestone milestone-chest-interactive ${
              isChestClaimed
                ? 'chest-claimed'
                : isMidZoneDone
                ? 'chest-ready'
                : 'chest-locked'
            }`}
            style={{ left: '44%', top: '34%' }}
            onClick={() => {
              playBubblePop();
              setChestModalOpen(true);
            }}
            title={
              isChestClaimed
                ? `Mid-Zone Bonus Claimed! (+500 pts)`
                : isMidZoneDone
                ? `🎁 Mid-Zone Treasure Ready to Claim! Click to open!`
                : `🔒 Mid-Zone Bonus: Clear Level ${midZoneLevel} with 2+ stars to unlock!`
            }
          >
            <div className="milestone-icon-wrap">
              {isChestClaimed ? (
                <div className="chest-badge-claimed">
                  <Gift size={24} className="text-emerald" />
                  <span className="chest-check-overlay">✓</span>
                </div>
              ) : isMidZoneDone ? (
                <div className="chest-badge-sparkle">
                  <Gift size={26} className="text-amber-glow animate-bounce" />
                  <Sparkles size={14} className="sparkle-float-icon" />
                </div>
              ) : (
                <div className="chest-badge-locked">
                  <Gift size={22} className="text-slate" />
                  <Lock size={12} className="lock-sub-icon" />
                </div>
              )}
            </div>
            <span className={`milestone-tag ${isChestClaimed ? 'tag-claimed' : isMidZoneDone ? 'tag-ready' : 'tag-locked'}`}>
              {isChestClaimed ? 'Claimed ✅' : isMidZoneDone ? 'Claim Bonus! ✨' : `Mid Bonus (${midZoneLevel})`}
            </span>
          </button>

          {/* ── MILESTONE 2: INTERACTIVE STAGE SUMMIT GATE (At Level 10) ── */}
          <button
            type="button"
            className={`roadmap-milestone milestone-summit-interactive ${
              isSummitDone ? 'summit-cleared' : 'summit-locked'
            }`}
            style={{ left: '88%', top: '3%' }}
            onClick={() => {
              playBubblePop();
              setGateModalOpen(true);
            }}
            title={
              isSummitDone
                ? `🏆 Zone ${activeStage + 1} Conquered! Click to advance to Zone ${activeStage + 2}!`
                : `🔒 Zone Gate: Earn 2★ on Level ${summitLevel} to unlock passage!`
            }
          >
            <div className="milestone-icon-wrap">
              {isSummitDone ? (
                <div className="summit-badge-open">
                  <Trophy size={26} className="text-amber-gold animate-pulse" />
                  <span className="gate-beacon-ray"></span>
                </div>
              ) : (
                <div className="summit-badge-locked">
                  <Trophy size={24} className="text-slate" />
                  <Lock size={12} className="lock-sub-icon" />
                </div>
              )}
            </div>
            <span className={`milestone-tag ${isSummitDone ? 'tag-gate-open' : 'tag-locked'}`}>
              {isSummitDone ? 'Gate Mastered! 🏆' : `Zone Gate (${summitLevel})`}
            </span>
          </button>

          {/* SVG WINDING RIVER PATH (Winding S-Curve Channel) */}
          <svg
            className="winding-river-svg"
            viewBox="0 0 1000 900"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Sandy Riverbank Gradient */}
              <linearGradient id="sandBankGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.65" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0.7" />
              </linearGradient>

              {/* Turquoise River Stream Gradient */}
              <linearGradient id="waterStreamGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0891b2" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#06b6d4" stopOpacity="0.98" />
                <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.98" />
              </linearGradient>

              {/* Cobblestone Trail Marker Pattern */}
              <linearGradient id="steppingStoneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Sandy River Canyon Border (outer bank) */}
            <path
              className="river-path-bank"
              d="M 800,820 
                 C 680,820 540,820 500,800
                 C 450,770 480,720 560,670
                 C 670,600 760,560 760,490
                 C 760,420 620,400 480,410
                 C 320,420 230,470 230,520
                 C 150,520 80,450 110,350
                 C 140,260 250,220 310,210
                 C 450,190 600,210 650,170
                 C 720,120 780,100 810,70"
            />

            {/* Main Flowing Turquoise River Stream */}
            <path
              className="river-path-water"
              d="M 800,820 
                 C 680,820 540,820 500,800
                 C 450,770 480,720 560,670
                 C 670,600 760,560 760,490
                 C 760,420 620,400 480,410
                 C 320,420 230,470 230,520
                 C 150,520 80,450 110,350
                 C 140,260 250,220 310,210
                 C 450,190 600,210 650,170
                 C 720,120 780,100 810,70"
            />

            {/* Stepping Stones / Cobblestone Trail along the path */}
            <path
              className="river-path-stepping-stones"
              d="M 800,820 
                 C 680,820 540,820 500,800
                 C 450,770 480,720 560,670
                 C 670,600 760,560 760,490
                 C 760,420 620,400 480,410
                 C 320,420 230,470 230,520
                 C 150,520 80,450 110,350
                 C 140,260 250,220 310,210
                 C 450,190 600,210 650,170
                 C 720,120 780,100 810,70"
            />

            {/* Animated Flowing Water Ripples */}
            <path
              className="river-path-ripples"
              d="M 800,820 
                 C 680,820 540,820 500,800
                 C 450,770 480,720 560,670
                 C 670,600 760,560 760,490
                 C 760,420 620,400 480,410
                 C 320,420 230,470 230,520
                 C 150,520 80,450 110,350
                 C 140,260 250,220 310,210
                 C 450,190 600,210 650,170
                 C 720,120 780,100 810,70"
            />
          </svg>

          {/* 10 SIGNPOST LEVEL NODES PLACED ALONG THE WINDING RIVER */}
          <div className="river-nodes-layer">
            {stageLevels.map((lvlNum, index) => {
              const coords = TRAIL_COORDINATES[index];
              const levelData = progress?.levels?.[String(lvlNum)];
              const isCurrent = lvlNum === unlockedLevel;

              return (
                <LevelSignpostNode
                  key={lvlNum}
                  levelNum={lvlNum}
                  levelData={levelData}
                  unlockedLevel={unlockedLevel}
                  isCurrent={isCurrent}
                  coords={coords}
                  avatarEmoji={
                    user?.avatar === 'shark'
                      ? '🦈'
                      : user?.avatar === 'octopus'
                      ? '🐙'
                      : user?.avatar === 'dolphin'
                      ? '🐬'
                      : user?.avatar === 'turtle'
                      ? '🐢'
                      : '🐠'
                  }
                  onClick={onSelectLevel}
                />
              );
            })}
          </div>
        </div>
      ) : (
        /* ── ALTERNATIVE: 100-LEVEL ALL STAGES OVERVIEW GRID ── */
        <div className="full-grid-view-container glassmorphic">
          <div className="grid-view-header">
            <h3>Full 100-Level Road Map Overview</h3>
            <p>Direct access to all 100 challenges across all 10 stages</p>
          </div>

          <div className="full-100-grid">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((lvlNum) => {
              const levelData = progress?.levels?.[String(lvlNum)];
              const isCurrent = lvlNum === unlockedLevel;
              return (
                <div key={lvlNum} className="grid-cell-wrap">
                  <LevelSignpostNode
                    levelNum={lvlNum}
                    levelData={levelData}
                    unlockedLevel={unlockedLevel}
                    isCurrent={isCurrent}
                    avatarEmoji="🐠"
                    onClick={onSelectLevel}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FOOTER: QUICK EXPEDITION LINK ─────────────────────────────────── */}
      <div className="adventure-map-footer">
        <button
          className="btn-outline-wide free-play-link"
          onClick={() => {
            playBubblePop();
            onPlayFreeMode();
          }}
        >
          <span>🏊 Or Try Classic Endless Free Mode</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── INTERACTIVE DIALOG 1: MID-ZONE TREASURE CHEST MODAL ───────────── */}
      {chestModalOpen && (
        <div className="modal-backdrop-milestone" onClick={() => setChestModalOpen(false)}>
          <div
            className="milestone-modal-card glassmorphic"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-icon-btn"
              onClick={() => {
                playBubblePop();
                setChestModalOpen(false);
              }}
              title="Close"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="milestone-modal-header">
              <div className={`modal-hero-badge ${isChestClaimed ? 'hero-claimed' : isMidZoneDone ? 'hero-ready' : 'hero-locked'}`}>
                {isChestClaimed ? (
                  <CheckCircle2 size={36} className="text-emerald" />
                ) : isMidZoneDone ? (
                  <Gift size={36} className="text-amber animate-bounce" />
                ) : (
                  <Lock size={36} className="text-slate" />
                )}
              </div>
              <h3 className="milestone-modal-title">
                {isChestClaimed
                  ? 'Mid-Zone Treasure Claimed!'
                  : isMidZoneDone
                  ? '✨ Mid-Zone Treasure Discovered!'
                  : '🔒 Mid-Zone Treasure Locked'}
              </h3>
              <p className="milestone-modal-subtitle">
                Zone {currentStage.id + 1}: {currentStage.name} • Checkpoint at Level {midZoneLevel}
              </p>
            </div>

            {/* Modal Body */}
            <div className="milestone-modal-body">
              {isChestClaimed ? (
                /* State 1: Claimed */
                <div className="milestone-claimed-view">
                  <div className="claimed-badge-pill">
                    <Check size={16} />
                    <span>Reward Collected</span>
                  </div>
                  <p className="claimed-desc">
                    You have unlocked and claimed this checkpoint reward! +500 Ocean Credits and bonus diving perks have been secured in your profile.
                  </p>
                  <div className="reward-summary-box">
                    <div className="reward-item">
                      <span className="reward-emoji">🪙</span>
                      <span className="reward-name">+500 Ocean Credits</span>
                    </div>
                    <div className="reward-item">
                      <span className="reward-emoji">📡</span>
                      <span className="reward-name">+1 Sonar Ping Hint</span>
                    </div>
                    <div className="reward-item">
                      <span className="reward-emoji">🤿</span>
                      <span className="reward-name">+1 Extra Oxygen Reserve</span>
                    </div>
                  </div>
                  <div className="modal-actions-cluster">
                    <button
                      className="btn-modal-primary"
                      onClick={() => setChestModalOpen(false)}
                    >
                      Back to Map
                    </button>
                  </div>
                </div>
              ) : isMidZoneDone ? (
                /* State 2: Unlocked & Ready to Claim */
                <div className="milestone-ready-view">
                  <div className="ready-congrats-banner">
                    <Sparkles size={18} className="text-amber" />
                    <span>Level {midZoneLevel} Completed! Open your chest now!</span>
                  </div>
                  <p className="ready-desc">
                    Great diving! You conquered the midpoint of Zone {currentStage.id + 1}. Claim your treasure chest rewards:
                  </p>
                  <div className="reward-summary-box active-rewards">
                    <div className="reward-item">
                      <span className="reward-emoji">🪙</span>
                      <div className="reward-text">
                        <strong>+500 Ocean Credits</strong>
                        <small>Bonus points added to your score</small>
                      </div>
                    </div>
                    <div className="reward-item">
                      <span className="reward-emoji">📡</span>
                      <div className="reward-text">
                        <strong>+1 Sonar Ping</strong>
                        <small>Tactical hint charge for tough puzzles</small>
                      </div>
                    </div>
                    <div className="reward-item">
                      <span className="reward-emoji">🤿</span>
                      <div className="reward-text">
                        <strong>+1 Oxygen Tank Boost</strong>
                        <small>Extra air reserve for underwater levels</small>
                      </div>
                    </div>
                    <div className="reward-item">
                      <span className="reward-emoji">🏅</span>
                      <div className="reward-text">
                        <strong>Zone {currentStage.id + 1} Midpoint Ribbon</strong>
                        <small>Honors your journey across the reef trail</small>
                      </div>
                    </div>
                  </div>

                  {claimSuccessMsg && (
                    <div className="claim-success-alert">
                      <CheckCircle2 size={18} />
                      <span>{claimSuccessMsg}</span>
                    </div>
                  )}

                  <div className="modal-actions-cluster">
                    <button
                      className="btn-modal-gold-claim"
                      onClick={handleClaimChest}
                      disabled={claimingChest}
                    >
                      <Gift size={20} />
                      <span>{claimingChest ? 'Opening Chest...' : '✨ CLAIM REWARD (+500 PTS) ✨'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* State 3: Locked */
                <div className="milestone-locked-view">
                  <div className="locked-requirement-box">
                    <AlertCircle size={20} className="text-amber" />
                    <div>
                      <strong>Unlock Requirement:</strong>
                      <p>
                        Complete <strong>Level {midZoneLevel}</strong> with at least <strong>2 ⭐ Stars</strong> to unlock this secret chest!
                      </p>
                    </div>
                  </div>

                  <div className="locked-status-stats">
                    <div className="status-stat-row">
                      <span>Level {midZoneLevel} Status:</span>
                      <strong>
                        {midZoneLevel > unlockedLevel
                          ? '🔒 Currently Locked'
                          : `${midZoneData?.stars || 0} / 3 Stars Earned`}
                      </strong>
                    </div>
                    <div className="status-stat-row">
                      <span>Needed Stars:</span>
                      <strong className="text-amber">2 or 3 Stars ⭐</strong>
                    </div>
                  </div>

                  <div className="preview-rewards-box">
                    <span className="preview-label">TREASURE CONTENTS:</span>
                    <div className="preview-pill-list">
                      <span className="preview-pill">🪙 +500 Credits</span>
                      <span className="preview-pill">📡 +1 Sonar Ping</span>
                      <span className="preview-pill">🤿 +1 Air Tank</span>
                    </div>
                  </div>

                  <div className="modal-actions-cluster">
                    <button
                      className="btn-modal-primary"
                      onClick={() => handleJumpToLevel(midZoneLevel)}
                      disabled={midZoneLevel > unlockedLevel}
                      title={midZoneLevel > unlockedLevel ? 'You must reach this level first' : 'Play Level now'}
                    >
                      <Play size={16} />
                      <span>
                        {midZoneLevel > unlockedLevel
                          ? `Reach Level ${midZoneLevel} First`
                          : `Dive into Level ${midZoneLevel}`}
                      </span>
                    </button>
                    <button
                      className="btn-modal-secondary"
                      onClick={() => setChestModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── INTERACTIVE DIALOG 2: ZONE GATE MASTERED MODAL ────────────────── */}
      {gateModalOpen && (
        <div className="modal-backdrop-milestone" onClick={() => setGateModalOpen(false)}>
          <div
            className="milestone-modal-card glassmorphic"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-icon-btn"
              onClick={() => {
                playBubblePop();
                setGateModalOpen(false);
              }}
              title="Close"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="milestone-modal-header">
              <div className={`modal-hero-badge ${isSummitDone ? 'hero-ready' : 'hero-locked'}`}>
                {isSummitDone ? (
                  <Trophy size={38} className="text-amber-gold animate-bounce" />
                ) : (
                  <Lock size={38} className="text-slate" />
                )}
              </div>
              <h3 className="milestone-modal-title">
                {isSummitDone
                  ? `👑 Zone ${currentStage.id + 1} Gate Mastered!`
                  : `🔒 Zone ${currentStage.id + 1} Gate Sealed`}
              </h3>
              <p className="milestone-modal-subtitle">
                {currentStage.name} • Summit Milestone at Level {summitLevel}
              </p>
            </div>

            {/* Modal Body */}
            <div className="milestone-modal-body">
              {isSummitDone ? (
                /* State 1: Gate Cleared / Mastered */
                <div className="milestone-summit-cleared-view">
                  <div className="summit-congrats-banner">
                    <Sparkles size={18} className="text-amber" />
                    <span>Zone Summit Conquered! Passage to the next stage is OPEN!</span>
                  </div>

                  <div className="zone-performance-card">
                    <div className="zone-stat-col">
                      <span className="zone-stat-num">⭐ {stageStarsEarned}/30</span>
                      <span className="zone-stat-sub">Stars in Zone</span>
                    </div>
                    <div className="zone-stat-divider" />
                    <div className="zone-stat-col">
                      <span className="zone-stat-num">🏆 {stageCompletedCount}/10</span>
                      <span className="zone-stat-sub">Levels Cleared</span>
                    </div>
                    <div className="zone-stat-divider" />
                    <div className="zone-stat-col">
                      <span className="zone-stat-num">👑 100%</span>
                      <span className="zone-stat-sub">Gate Status</span>
                    </div>
                  </div>

                  <p className="summit-flow-desc">
                    {activeStage < STAGES.length - 1
                      ? `The deep marine currents are now calm. You may advance through the gate into Zone ${activeStage + 2}: ${STAGES[activeStage + 1].name}!`
                      : `🎉 Extraordinary Expedition! You have mastered all 10 Zones and conquered the 100-Level ocean world!`}
                  </p>

                  <div className="modal-actions-cluster">
                    {activeStage < STAGES.length - 1 ? (
                      <>
                        <button
                          className="btn-modal-gold-claim"
                          onClick={handleAdvanceToNextZone}
                        >
                          <ArrowRight size={20} />
                          <span>ADVANCE TO ZONE {activeStage + 2} ({STAGES[activeStage + 1].name}) ➡️</span>
                        </button>
                        <button
                          className="btn-modal-primary"
                          onClick={() => handleJumpToLevel(currentStage.range[1] + 1)}
                        >
                          <Play size={16} />
                          <span>Play Level {currentStage.range[1] + 1} Directly</span>
                        </button>
                      </>
                    ) : (
                      <div className="abyss-champion-banner">
                        <span>🌟 100-LEVEL SUPREME OCEAN CHAMPION 🌟</span>
                      </div>
                    )}
                    <button
                      className="btn-modal-secondary"
                      onClick={() => setGateModalOpen(false)}
                    >
                      Back to Map
                    </button>
                  </div>
                </div>
              ) : (
                /* State 2: Gate Locked */
                <div className="milestone-summit-locked-view">
                  <div className="locked-requirement-box">
                    <AlertCircle size={20} className="text-amber" />
                    <div>
                      <strong>Passage Barrier:</strong>
                      <p>
                        The underwater current barrier is locked! Complete <strong>Level {summitLevel}</strong> with at least <strong>2 ⭐ Stars</strong> to unseal this Zone Gate.
                      </p>
                    </div>
                  </div>

                  <div className="locked-status-stats">
                    <div className="status-stat-row">
                      <span>Level {summitLevel} Status:</span>
                      <strong>
                        {summitLevel > unlockedLevel
                          ? '🔒 Level Not Reached Yet'
                          : `${summitData?.stars || 0} / 3 Stars Earned`}
                      </strong>
                    </div>
                    <div className="status-stat-row">
                      <span>Zone Progress:</span>
                      <strong>{stageCompletedCount} / 10 Levels Cleared</strong>
                    </div>
                    <div className="status-stat-row">
                      <span>Next Zone:</span>
                      <strong>
                        {activeStage < 9 ? `Zone ${activeStage + 2}: ${STAGES[activeStage + 1].name}` : 'Endgame Throne'}
                      </strong>
                    </div>
                  </div>

                  <div className="modal-actions-cluster">
                    <button
                      className="btn-modal-primary"
                      onClick={() => handleJumpToLevel(summitLevel)}
                      disabled={summitLevel > unlockedLevel}
                      title={summitLevel > unlockedLevel ? 'Unlock previous levels first' : 'Challenge Level now'}
                    >
                      <Play size={16} />
                      <span>
                        {summitLevel > unlockedLevel
                          ? `Reach Level ${summitLevel} First`
                          : `Challenge Level ${summitLevel}`}
                      </span>
                    </button>
                    <button
                      className="btn-modal-secondary"
                      onClick={() => setGateModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
