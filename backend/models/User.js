
const { ObjectId } = require('mongodb');
const gameEvents = require('../services/eventService');
const { hashPassword, verifyPassword } = require('../services/passwordService');

/**
 * User Model - Manages Virtual Identity & Authentication
 * Includes Email OTP Two-Factor Authentication (2FA).
 */
class UserModel {
  constructor(db) {
    this.collection = db.collection('users');
  }

  // Ensure unique indexes on username and email
  async initIndexes() {
    try {
      await this.collection.createIndex(
        { username: 1 },
        { unique: true }
      );

      await this.collection.createIndex(
        { email: 1 },
        { unique: true }
      );
    } catch (err) {
      console.warn('User indexes notice:', err.message);
    }
  }

  // Find user by username (case-insensitive)
  async findByUsername(username) {
    return await this.collection.findOne({
      username: {
        $regex: new RegExp(
          `^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        )
      }
    });
  }

  // Find user by email
  async findByEmail(email) {
    return await this.collection.findOne({
      email: email.trim().toLowerCase()
    });
  }

  // Find user by ID (exclude password and OTP)
  async findById(id) {
    try {
      return await this.collection.findOne(
        { _id: new ObjectId(id) },
        {
          projection: {
            password: 0,
            loginOTP: 0
          }
        }
      );
    } catch (err) {
      return null;
    }
  }

  // Create new user
  async create({
    username,
    email,
    password,
    avatar = 'clownfish'
  }) {
    const hashedPassword = await hashPassword(password);

    const newUser = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      avatar,

      stats: {
        totalGames: 0,
        highScore: 0,
        totalScore: 0,
        highestRound: 0,
        badges: ['Novice Angler']
      },

      createdAt: new Date(),
      lastLogin: new Date()
    };

    const result = await this.collection.insertOne(newUser);

    return {
      _id: result.insertedId,
      username: newUser.username,
      email: newUser.email,
      avatar: newUser.avatar,
      stats: newUser.stats,
      createdAt: newUser.createdAt
    };
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return await verifyPassword(plainPassword, hashedPassword);
  }

  // ==========================================
  // EMAIL OTP TWO-FACTOR AUTHENTICATION (2FA)
  // ==========================================

  // Save hashed OTP
  async saveLoginOTP(userId, hashedOTP, expiresAt) {
    return await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          loginOTP: {
            code: hashedOTP,
            expiresAt: expiresAt,
            attempts: 0
          }
        }
      }
    );
  }

  // Retrieve OTP details
  async getLoginOTP(userId) {
    return await this.collection.findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          loginOTP: 1
        }
      }
    );
  }

  // Increment incorrect OTP attempts
  async incrementLoginOTPAttempts(userId) {
    return await this.collection.updateOne(
      {
        _id: new ObjectId(userId),
        'loginOTP': { $exists: true }
      },
      {
        $inc: {
          'loginOTP.attempts': 1
        }
      }
    );
  }

  // Clear OTP after successful verification
  async clearLoginOTP(userId) {
    return await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $unset: {
          loginOTP: ''
        }
      }
    );
  }

  // ==========================================
  // GAME STATISTICS
  // ==========================================

  async updateStats(userId, {
    score,
    roundReached
  }) {
    const user = await this.collection.findOne({
      _id: new ObjectId(userId)
    });

    if (!user) return null;

    const currentStats = user.stats || {
      totalGames: 0,
      highScore: 0,
      totalScore: 0,
      highestRound: 0,
      badges: ['Novice Angler']
    };

    const newHighScore = Math.max(
      currentStats.highScore || 0,
      Number(score) || 0
    );

    const newHighestRound = Math.max(
      currentStats.highestRound || 0,
      Number(roundReached) || 0
    );

    const newTotalScore =
      (currentStats.totalScore || 0) + (Number(score) || 0);

    const newTotalGames =
      (currentStats.totalGames || 0) + 1;

    // Badge system
    const oldBadges = new Set(
      currentStats.badges || ['Novice Angler']
    );

    const badges = new Set(oldBadges);

    if (newHighScore >= 300) badges.add('Reef Explorer');
    if (newHighScore >= 600) badges.add('Deep Sea Diver');
    if (newHighScore >= 1000) badges.add('Ocean Master');
    if (newHighestRound >= 5) badges.add('Sharp Eye');
    if (newHighestRound >= 10) badges.add('Fish Whisperer');
    if (newTotalGames >= 10) badges.add('Aquatic Veteran');

    // Emit badge unlock events
    for (const badge of badges) {
      if (!oldBadges.has(badge)) {
        gameEvents.emit('badge:unlocked', {
          userId: user._id,
          username: user.username,
          badge
        });
      }
    }

    const updatedStats = {
      totalGames: newTotalGames,
      highScore: newHighScore,
      totalScore: newTotalScore,
      highestRound: newHighestRound,
      badges: Array.from(badges)
    };

    await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          stats: updatedStats,
          lastPlayed: new Date()
        }
      }
    );

    return updatedStats;
  }

  // ==========================================
  // AVATAR MANAGEMENT
  // ==========================================

  async updateAvatar(userId, avatar) {
    await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: { avatar }
      }
    );

    return avatar;
  }
}

module.exports = UserModel;
