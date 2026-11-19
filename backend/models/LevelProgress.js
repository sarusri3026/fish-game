const { ObjectId } = require('mongodb');
const gameEvents = require('../services/eventService');

/**
 * LevelProgressModel - Persists player progression across 100 levels and 3-star ratings.
 * Demonstrates:
 * - Theme 1: High Cohesion (Dedicated exclusively to level progression and star tracking)
 * - Theme 4: Virtual Identity (Isolated per authenticated user in MongoDB Atlas)
 */
class LevelProgressModel {
  constructor(db) {
    this.collection = db.collection('level_progress');
  }

  async initIndexes() {
    try {
      await this.collection.createIndex({ userId: 1 }, { unique: true });
    } catch (err) {
      console.warn('LevelProgress index notice:', err.message);
    }
  }

  /**
   * Retrieves user's progress or initializes a new record with Level 1 unlocked.
   */
  async getOrCreateProgress(userId, username = 'Sailor') {
    if (!userId) return null;

    const query = { userId: new ObjectId(userId) };
    let progress = await this.collection.findOne(query);

    if (!progress) {
      progress = {
        userId: new ObjectId(userId),
        username,
        unlockedLevel: 1, // Level 1 is unlocked automatically
        totalStars: 0,
        completedLevels: 0,
        claimedBonuses: {},
        levels: {
          // Keyed by level number string '1'..'100'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.collection.insertOne(progress);
    }

    return progress;
  }

  /**
   * Records level completion result and handles unlocking rule:
   * Next level unlocks ONLY if stars >= 2.
   */
  async recordLevelResult(userId, { levelNumber, stars, score, username }) {
    if (!userId) return null;

    const progress = await this.getOrCreateProgress(userId, username);
    const lvlNum = Number(levelNumber);

    if (lvlNum < 1 || lvlNum > 100) {
      throw new Error('Invalid level number: Must be between 1 and 100.');
    }

    const lvlKey = String(lvlNum);
    const existingLvl = (progress.levels && progress.levels[lvlKey]) || {
      stars: 0,
      highScore: 0,
      attempts: 0,
      completed: false
    };

    const earnedStars = Math.max(0, Math.min(3, Number(stars) || 0));
    const finalScore = Math.max(0, Number(score) || 0);

    // Keep highest earned stars and high score
    const newBestStars = Math.max(existingLvl.stars || 0, earnedStars);
    const newBestScore = Math.max(existingLvl.highScore || 0, finalScore);
    const isCompleted = newBestStars >= 2;

    const updatedLevels = { ...(progress.levels || {}) };
    updatedLevels[lvlKey] = {
      stars: newBestStars,
      highScore: newBestScore,
      attempts: (existingLvl.attempts || 0) + 1,
      completed: isCompleted,
      lastPlayedAt: new Date(),
      lastEarnedStars: earnedStars,
      lastScore: finalScore
    };

    // Level Unlocking Rule:
    // The next level unlocks ONLY when the player earns at least 2 stars in the current level.
    let newUnlockedLevel = progress.unlockedLevel || 1;
    let unlockedNext = false;

    if (earnedStars >= 2) {
      if (lvlNum >= newUnlockedLevel && lvlNum < 100) {
        newUnlockedLevel = lvlNum + 1;
        unlockedNext = true;
      }
    }

    // Recalculate total stars and completed levels
    let totalStars = 0;
    let completedCount = 0;
    for (const [k, data] of Object.entries(updatedLevels)) {
      totalStars += (data.stars || 0);
      if (data.stars >= 2) {
        completedCount += 1;
      }
    }

    const updateDoc = {
      $set: {
        levels: updatedLevels,
        unlockedLevel: newUnlockedLevel,
        totalStars,
        completedLevels: completedCount,
        updatedAt: new Date()
      }
    };

    if (username) {
      updateDoc.$set.username = username;
    }

    await this.collection.updateOne({ userId: new ObjectId(userId) }, updateDoc);

    // Fire in-process events (Theme 2)
    gameEvents.emit('level:completed', {
      userId,
      username: progress.username || username,
      levelNumber: lvlNum,
      stars: earnedStars,
      score: finalScore,
      unlockedNext,
      unlockedLevel: newUnlockedLevel,
      totalStars
    });

    return {
      levelNumber: lvlNum,
      stars: earnedStars,
      bestStars: newBestStars,
      score: finalScore,
      highScore: newBestScore,
      unlockedNext,
      unlockedLevel: newUnlockedLevel,
      totalStars,
      completedLevels: completedCount
    };
  }

  /**
   * Claims a mid-zone bonus chest or milestone bonus.
   * Ensures the required level is cleared with >= 2 stars,
   * prevents duplicate claiming, and records the reward.
   */
  async claimBonus(userId, { bonusKey, stageId, levelNumber, username }) {
    if (!userId || !bonusKey) {
      throw new Error('userId and bonusKey are required.');
    }

    const progress = await this.getOrCreateProgress(userId, username);
    const claimed = progress.claimedBonuses || {};

    if (claimed[bonusKey]) {
      return {
        success: true,
        alreadyClaimed: true,
        bonusKey,
        claimedBonuses: claimed,
        message: 'This bonus has already been claimed.'
      };
    }

    // Verify qualification: target level must have >= 2 stars
    const lvlKey = String(levelNumber);
    const lvlData = progress.levels && progress.levels[lvlKey];
    if (!lvlData || (lvlData.stars || 0) < 2) {
      throw new Error(`Level ${levelNumber} must be completed with at least 2 stars to claim this bonus.`);
    }

    const reward = {
      bonusPoints: 500,
      sonarPings: 1,
      oxygenBoost: 1,
      claimedAt: new Date(),
      stageId: Number(stageId),
      levelNumber: Number(levelNumber)
    };

    const updatedClaimed = {
      ...claimed,
      [bonusKey]: reward
    };

    await this.collection.updateOne(
      { userId: new ObjectId(userId) },
      {
        $set: {
          claimedBonuses: updatedClaimed,
          updatedAt: new Date()
        }
      }
    );

    gameEvents.emit('bonus:claimed', {
      userId,
      username: progress.username || username,
      bonusKey,
      reward
    });

    return {
      success: true,
      alreadyClaimed: false,
      bonusKey,
      reward,
      claimedBonuses: updatedClaimed,
      message: 'Bonus chest opened successfully! +500 Ocean Credits awarded.'
    };
  }
}

module.exports = LevelProgressModel;
