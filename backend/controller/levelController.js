const LevelProgressModel = require('../models/LevelProgress');
const levelSessionService = require('../services/levelSessionService');

/**
 * Level Controller - Manages 100-Level progressive unlocking and 3-star rating operations.
 * Demonstrates:
 * - Theme 1: High Cohesion & Low Coupling (Encapsulates level logic)
 * - Theme 4: Virtual Identity (Authenticated endpoints, server-verified unlocks)
 */
class LevelController {
  // 1. Get player's 100-level progress
  async getProgress(req, res) {
    try {
      const userId = req.user.id;
      const username = req.user.username;
      const levelModel = new LevelProgressModel(req.app.locals.db);

      const progress = await levelModel.getOrCreateProgress(userId, username);

      return res.json({
        success: true,
        unlockedLevel: progress.unlockedLevel || 1,
        totalStars: progress.totalStars || 0,
        completedLevels: progress.completedLevels || 0,
        claimedBonuses: progress.claimedBonuses || {},
        levels: progress.levels || {}
      });
    } catch (error) {
      console.error('Error fetching level progress:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve level progress.',
        error: error.message
      });
    }
  }

  // 2. Start a level session (validates level is unlocked)
  async startLevel(req, res) {
    try {
      const userId = req.user.id;
      const username = req.user.username;
      const { levelNumber } = req.body;

      const lvlNum = Number(levelNumber);
      if (isNaN(lvlNum) || lvlNum < 1 || lvlNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid level number. Must be between 1 and 100.'
        });
      }

      // Check player's current unlocked level
      const levelModel = new LevelProgressModel(req.app.locals.db);
      const progress = await levelModel.getOrCreateProgress(userId, username);

      const currentUnlocked = progress.unlockedLevel || 1;
      if (lvlNum > currentUnlocked) {
        return res.status(403).json({
          success: false,
          message: `Level ${lvlNum} is locked. You must earn at least 2 stars in Level ${currentUnlocked} to unlock it.`
        });
      }

      const sessionData = await levelSessionService.startLevelSession({
        userId,
        username,
        levelNumber: lvlNum,
        unlockedLevel: currentUnlocked
      });

      return res.json({
        success: true,
        ...sessionData
      });
    } catch (error) {
      console.error('Error starting level session:', error);
      const status = error.statusCode || 500;
      return res.status(status).json({
        success: false,
        message: error.message || 'Failed to start level session.'
      });
    }
  }

  // 3. Submit level answer, evaluate stars & update MongoDB
  async submitLevel(req, res) {
    try {
      const userId = req.user.id;
      const username = req.user.username;
      const { levelSessionId, playerAnswer, timeRemaining } = req.body;

      if (!levelSessionId || playerAnswer === undefined || playerAnswer === null) {
        return res.status(400).json({
          success: false,
          message: 'levelSessionId and playerAnswer are required.'
        });
      }

      // Evaluate server-side session
      const evaluation = levelSessionService.submitLevelAnswer(levelSessionId, {
        playerAnswer,
        timeRemaining
      });

      if (!evaluation.valid) {
        return res.status(400).json({
          success: false,
          message: evaluation.error
        });
      }

      // Record result in MongoDB Atlas
      const levelModel = new LevelProgressModel(req.app.locals.db);
      const saveResult = await levelModel.recordLevelResult(userId, {
        levelNumber: evaluation.levelNumber,
        stars: evaluation.stars,
        score: evaluation.score,
        username
      });

      return res.json({
        success: true,
        levelNumber: evaluation.levelNumber,
        correct: evaluation.correct,
        correctSolution: evaluation.correctSolution,
        chestValue: evaluation.chestValue,
        score: evaluation.score,
        stars: evaluation.stars,
        rating: evaluation.rating,
        message: evaluation.message,
        timeRemaining: evaluation.timeRemaining,
        unlockedNext: saveResult.unlockedNext,
        unlockedLevel: saveResult.unlockedLevel,
        bestStars: saveResult.bestStars,
        highScore: saveResult.highScore,
        totalStars: saveResult.totalStars,
        completedLevels: saveResult.completedLevels,
        claimedBonuses: saveResult.claimedBonuses || {}
      });
    } catch (error) {
      console.error('Error submitting level answer:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process level completion.',
        error: error.message
      });
    }
  }

  // 4. Claim mid-zone chest or milestone bonus
  async claimBonus(req, res) {
    try {
      const userId = req.user.id;
      const username = req.user.username;
      const { bonusKey, stageId, levelNumber } = req.body;

      if (!bonusKey || levelNumber === undefined) {
        return res.status(400).json({
          success: false,
          message: 'bonusKey and levelNumber are required.'
        });
      }

      const levelModel = new LevelProgressModel(req.app.locals.db);
      const result = await levelModel.claimBonus(userId, {
        bonusKey,
        stageId,
        levelNumber: Number(levelNumber),
        username
      });

      return res.json(result);
    } catch (error) {
      console.error('Error claiming bonus:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to claim bonus.'
      });
    }
  }
}

module.exports = new LevelController();
