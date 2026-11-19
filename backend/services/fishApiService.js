const axios = require('axios');
const crypto = require('crypto');

/**
 * FishApiService - Handles Interoperability with Marc Conrad's Fish Game API
 * Demonstrates Theme 3: Interoperability
 *
 * Requirements Met:
 * - Direct REST integration with https://marcconrad.com/uob/fish/api.php?out=json
 * - Response structure matches official docs: { question: string, fish: number, chest: number }
 * - Opaque round IDs: solutions stored server-side in memory; never exposed in client tokens
 * - Genuine API cache pool only (no fabricated backup puzzles)
 * - Clear distinction between live and cached questions
 * - Dedicated Sonar hint calculation on the server
 */
class FishApiService {
  constructor() {
    this.apiUrl = 'https://marcconrad.com/uob/fish/api.php?out=json';
    // Active rounds store: roundId -> { solution, chest, questionUrl, isCached, createdAt, consumed }
    this.activeRounds = new Map();
    // Cache pool storing genuine puzzles fetched from Marc Conrad's API
    this.genuineCachePool = [];

    // Periodic cleanup of expired rounds every 5 minutes (TTL: 10 minutes)
    setInterval(() => this.cleanupExpiredRounds(), 5 * 60 * 1000).unref();
  }

  /**
   * Fetch a new question from Marc Conrad's Fish Game API
   */
  async fetchNewPuzzle() {
    let puzzleData = null;
    let isCached = false;

    try {
      const response = await axios.get(this.apiUrl, { timeout: 7000 });

      if (response.data && response.data.question && response.data.fish !== undefined) {
        puzzleData = {
          questionUrl: response.data.question,
          solution: Number(response.data.fish),
          chest: Number(response.data.chest !== undefined ? response.data.chest : 0),
          fetchedAt: new Date().toISOString()
        };

        // Cache genuine API responses (max 30 items)
        const alreadyCached = this.genuineCachePool.some((p) => p.questionUrl === puzzleData.questionUrl);
        if (!alreadyCached) {
          if (this.genuineCachePool.length >= 30) {
            this.genuineCachePool.shift();
          }
          this.genuineCachePool.push(puzzleData);
        }
      } else {
        throw new Error('Unexpected payload structure from external Fish API');
      }
    } catch (err) {
      console.warn(`[INTEROPERABILITY] Live API request failed (${err.message}). Checking cache pool...`);

      if (this.genuineCachePool.length > 0) {
        // Use a genuinely retrieved cached puzzle
        const randomCached = this.genuineCachePool[Math.floor(Math.random() * this.genuineCachePool.length)];
        puzzleData = { ...randomCached };
        isCached = true;
      } else {
        throw new Error(
          'Fish Game API is currently unreachable and no cached genuine puzzles are available. Please check internet connection.'
        );
      }
    }

    // Generate a secure opaque round ID (no solution encoded in the token!)
    const roundId = crypto.randomUUID();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL

    this.activeRounds.set(roundId, {
      roundId,
      questionUrl: puzzleData.questionUrl,
      solution: puzzleData.solution,
      chest: puzzleData.chest,
      isCached,
      createdAt: Date.now(),
      expiresAt,
      consumed: false
    });

    return {
      roundId,
      questionUrl: puzzleData.questionUrl,
      isCached,
      protocol: isCached ? 'HTTPS/REST (Cached Fallback)' : 'HTTPS/REST (Live JSON)',
      source: isCached ? 'External Cache Pool' : 'https://marcconrad.com/uob/fish/api.php'
    };
  }

  /**
   * Verify player's answer against the server-stored round
   */
  verifyAnswer(roundId, playerAnswer) {
    const round = this.activeRounds.get(roundId);

    if (!round) {
      return {
        valid: false,
        error: 'Round session not found or has expired. Please fetch a new puzzle.'
      };
    }

    if (round.consumed) {
      return {
        valid: false,
        error: 'This round has already been submitted.'
      };
    }

    // Mark round as consumed to prevent replay attacks
    round.consumed = true;

    const isCorrect = Number(playerAnswer) === round.solution;

    return {
      valid: true,
      correct: isCorrect,
      correctSolution: round.solution,
      chestValue: round.chest
    };
  }

  /**
   * Dedicated Sonar hint calculation
   * Returns 5 eliminated wrong digits without revealing the correct solution to the client
   */
  generateSonarHint(roundId) {
    const round = this.activeRounds.get(roundId);

    if (!round) {
      return {
        success: false,
        message: 'Round session not found or expired.'
      };
    }

    if (round.consumed) {
      return {
        success: false,
        message: 'Round has already been answered.'
      };
    }

    const correctSolution = round.solution;
    const allDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const wrongDigits = allDigits.filter((d) => d !== correctSolution);

    // Shuffle wrong digits using crypto random
    for (let i = wrongDigits.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [wrongDigits[i], wrongDigits[j]] = [wrongDigits[j], wrongDigits[i]];
    }

    // Return 5 eliminated digits; never return the solution!
    const eliminatedDigits = wrongDigits.slice(0, 5);

    return {
      success: true,
      eliminatedDigits
    };
  }

  /**
   * Memory management: Prune rounds older than TTL
   */
  cleanupExpiredRounds() {
    const now = Date.now();
    for (const [roundId, round] of this.activeRounds.entries()) {
      if (now > round.expiresAt || (round.consumed && now - round.createdAt > 60000)) {
        this.activeRounds.delete(roundId);
      }
    }
  }
}

module.exports = new FishApiService();
