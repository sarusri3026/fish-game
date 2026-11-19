const { ObjectId } = require('mongodb');

/**
 * Score Model - Handles game records and leaderboard persistence
 * Low Coupling: Decoupled from user authentication and third-party APIs.
 */
class ScoreModel {
  constructor(db) {
    this.collection = db.collection('scores');
  }

  async initIndexes() {
    try {
      await this.collection.createIndex({ score: -1, createdAt: -1 });
      await this.collection.createIndex({ userId: 1, createdAt: -1 });
    } catch (err) {
      console.warn('Score indexes notice:', err.message);
    }
  }

  async recordGame({ userId, username, score, roundReached, timeElapsed, accuracy = 100 }) {
    const record = {
      userId: userId ? new ObjectId(userId) : null,
      username: username || 'Anonymous Sailor',
      score: Number(score) || 0,
      roundReached: Number(roundReached) || 1,
      timeElapsed: Number(timeElapsed) || 0,
      accuracy: Number(accuracy) || 100,
      createdAt: new Date()
    };

    const result = await this.collection.insertOne(record);
    return { _id: result.insertedId, ...record };
  }

  async getLeaderboard(limit = 10) {
    // Return top high scores
    return await this.collection
      .find({})
      .sort({ score: -1, createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  async getUserHistory(userId, limit = 10) {
    if (!userId) return [];
    try {
      return await this.collection
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
    } catch (err) {
      return [];
    }
  }
}

module.exports = ScoreModel;

