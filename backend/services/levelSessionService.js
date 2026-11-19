const crypto = require('crypto');
const fishApiService = require('./fishApiService');

/**
 * LevelSessionService - Server-Side Level Session Tracking & 3-Star Rating Calculator
 * Demonstrates:
 * - Theme 1: High Cohesion (Manages active level sessions and performance evaluation)
 * - Theme 4: Anti-Cheat & Security (Prevents skipping levels and spoofed star submissions)
 */
class LevelSessionService {
  constructor() {
    this.activeSessions = new Map();
    // Periodic session cleanup (30-minute TTL)
    setInterval(() => this.cleanup(), 15 * 60 * 1000).unref();
  }

  /**
   * Calculates time limit based on level depth
   * Levels 1–25: 20 seconds (Reef Shallows)
   * Levels 26–50: 18 seconds (Coral Depths)
   * Levels 51–75: 15 seconds (Sunken Trenches)
   * Levels 76–100: 12 seconds (Abyssal Zone)
   */
  getTimeLimitForLevel(levelNumber) {
    if (levelNumber <= 25) return 20;
    if (levelNumber <= 50) return 18;
    if (levelNumber <= 75) return 15;
    return 12;
  }

  /**
   * Initializes a verified level session
   */
  async startLevelSession({ userId, username, levelNumber, unlockedLevel }) {
    const lvlNum = Number(levelNumber);

    if (isNaN(lvlNum) || lvlNum < 1 || lvlNum > 100) {
      throw new Error('Invalid level number. Must be between 1 and 100.');
    }

    // Anti-skipping check: Players can only enter levels they have unlocked
    const currentUnlocked = Number(unlockedLevel) || 1;
    if (lvlNum > currentUnlocked) {
      const err = new Error(`Level ${lvlNum} is locked. You must complete Level ${currentUnlocked} with at least 2 stars first.`);
      err.statusCode = 403;
      throw err;
    }

    const timeLimit = this.getTimeLimitForLevel(lvlNum);

    // Retrieve fresh puzzle from Fish API (Theme 3 Interoperability)
    const puzzle = await fishApiService.fetchNewPuzzle();

    const levelSessionId = crypto.randomUUID();
    const session = {
      levelSessionId,
      userId: String(userId),
      username,
      levelNumber: lvlNum,
      roundId: puzzle.roundId,
      timeLimit,
      startedAt: Date.now(),
      isSubmitted: false
    };

    this.activeSessions.set(levelSessionId, session);

    return {
      levelSessionId,
      levelNumber: lvlNum,
      timeLimit,
      puzzle: {
        roundId: puzzle.roundId,
        question: puzzle.questionUrl,   // map questionUrl -> question for frontend
        source: puzzle.source,
        cached: puzzle.isCached         // map isCached -> cached for frontend
      }
    };
  }

  /**
   * Evaluates player answer, computes stars according to assessment rules
   * 3 Stars: Excellent performance (fast & accurate)
   * 2 Stars: Good performance (accurate, reasonable time)
   * 1 Star: Insufficient performance (accurate but slow)
   * 0 Stars: Level failed (wrong answer or timeout)
   */
  submitLevelAnswer(levelSessionId, { playerAnswer, timeRemaining }) {
    const session = this.activeSessions.get(levelSessionId);
    if (!session) {
      return { valid: false, error: 'Level session expired or not found. Please restart the level.' };
    }

    if (session.isSubmitted) {
      return { valid: false, error: 'Level result has already been submitted for this attempt.' };
    }

    session.isSubmitted = true;

    // Verify answer via fishApiService
    const verification = fishApiService.verifyAnswer(session.roundId, Number(playerAnswer));
    if (!verification.valid) {
      return { valid: false, error: verification.error };
    }

    const timeRem = Math.max(0, Math.min(session.timeLimit, Number(timeRemaining) || 0));
    const timeRatio = session.timeLimit > 0 ? timeRem / session.timeLimit : 0;

    let stars = 0;
    let score = 0;
    let rating = 'Failed';
    let message = '';

    if (!verification.correct) {
      // 0 Stars: Level failed
      stars = 0;
      score = 0;
      rating = 'Level Failed';
      message = `Level failed! The correct answer was ${verification.correctSolution}. Try again!`;
    } else {
      // Base points + time bonus
      const basePoints = 100;
      const timeBonus = Math.round(timeRem * 10);
      score = basePoints + timeBonus;

      // Calculate Stars based on performance:
      // >= 55% time left -> 3 Stars (Excellent)
      // 25% - 54% time left -> 2 Stars (Good)
      // < 25% time left -> 1 Star (Insufficient)
      if (timeRatio >= 0.55) {
        stars = 3;
        rating = 'Excellent';
        message = `🌟 Outstanding! 3 Stars earned! Lightning-fast precision! Level ${session.levelNumber + 1 <= 100 ? session.levelNumber + 1 : 100} is unlocked!`;
      } else if (timeRatio >= 0.25) {
        stars = 2;
        rating = 'Good';
        message = `🎉 Great job! 2 Stars earned! Solid dive! Level ${session.levelNumber + 1 <= 100 ? session.levelNumber + 1 : 100} is unlocked!`;
      } else {
        stars = 1;
        rating = 'Insufficient';
        message = `⚠️ Close call! 1 Star earned. You need at least 2 stars to unlock Level ${session.levelNumber + 1}. Retry for a faster time!`;
      }
    }

    // Clean up session
    this.activeSessions.delete(levelSessionId);

    return {
      valid: true,
      levelNumber: session.levelNumber,
      correct: verification.correct,
      correctSolution: verification.correctSolution,
      chestValue: verification.chestValue,
      score,
      stars,
      rating,
      message,
      timeRemaining: timeRem,
      timeLimit: session.timeLimit,
      userId: session.userId,
      username: session.username
    };
  }

  cleanup() {
    const now = Date.now();
    const MAX_AGE = 30 * 60 * 1000;
    for (const [id, s] of this.activeSessions.entries()) {
      if (now - s.startedAt > MAX_AGE) {
        this.activeSessions.delete(id);
      }
    }
  }
}

module.exports = new LevelSessionService();
