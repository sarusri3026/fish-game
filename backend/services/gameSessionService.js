const crypto = require('crypto');

/**
 * GameSessionService - Server-Side Game Session Tracking & Anti-Cheat Validation
 * Demonstrates Theme 1 (High Cohesion) & Theme 4 (Virtual Identity / Score Integrity)
 *
 * Requirements:
 * - Server tracks session state (current score, lives, round, combo streak).
 * - Client cannot submit arbitrary high scores directly.
 * - Scores are computed and verified on the server side per round.
 */
class GameSessionService {
  constructor() {
    this.sessions = new Map();
    // Prune stale sessions every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000).unref();
  }

  createSession({ userId = null, username = 'Guest Sailor' }) {
    const sessionId = crypto.randomUUID();
    const session = {
      sessionId,
      userId,
      username,
      startedAt: Date.now(),
      score: 0,
      round: 1,
      lives: 3,
      combo: 0,
      highestCombo: 0,
      correctAnswers: 0,
      totalGuesses: 0,
      isFinished: false,
      lastActivity: Date.now()
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    if (!sessionId) return null;
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Updates session state on round completion using server rules
   */
  processRoundAnswer(sessionId, { correct, timeRemaining = 0 }) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { valid: false, error: 'Game session not found or expired.' };
    }

    if (session.isFinished) {
      return { valid: false, error: 'Game session has already ended.' };
    }

    session.lastActivity = Date.now();
    session.totalGuesses += 1;

    let pointsAwarded = 0;

    if (correct) {
      session.correctAnswers += 1;
      session.combo += 1;
      if (session.combo > session.highestCombo) {
        session.highestCombo = session.combo;
      }

      // Calculate score securely on server
      const streakMultiplier = 1 + (session.combo - 1) * 0.25;
      const validTimeRemaining = Math.max(0, Math.min(Number(timeRemaining) || 0, 20));
      const timeBonus = validTimeRemaining * 10;
      pointsAwarded = Math.round((100 + timeBonus) * streakMultiplier);

      session.score += pointsAwarded;
      session.round += 1;
    } else {
      // Incorrect or timeout
      session.combo = 0;
      session.lives = Math.max(0, session.lives - 1);

      if (session.lives <= 0) {
        session.isFinished = true;
      } else {
        session.round += 1;
      }
    }

    return {
      valid: true,
      correct,
      pointsAwarded,
      newTotalScore: session.score,
      round: session.round,
      livesRemaining: session.lives,
      combo: session.combo,
      highestCombo: session.highestCombo,
      isGameOver: session.isFinished
    };
  }

  /**
   * Finalizes a session and returns verified stats to write into MongoDB
   */
  finishSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    session.isFinished = true;
    const timeElapsed = Math.max(1, Math.round((Date.now() - session.startedAt) / 1000));
    const accuracy = session.totalGuesses > 0
      ? Math.round((session.correctAnswers / session.totalGuesses) * 100)
      : 0;

    const validatedSummary = {
      sessionId: session.sessionId,
      userId: session.userId,
      username: session.username,
      score: session.score,
      roundReached: session.round,
      highestCombo: session.highestCombo,
      accuracy,
      timeElapsed,
      finishedAt: new Date()
    };

    // Remove from active map
    this.sessions.delete(sessionId);

    return validatedSummary;
  }

  cleanup() {
    const now = Date.now();
    const MAX_AGE = 60 * 60 * 1000; // 1 hour TTL
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActivity > MAX_AGE) {
        this.sessions.delete(id);
      }
    }
  }
}

module.exports = new GameSessionService();
