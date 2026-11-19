const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const gameEvents = require('../services/eventService');

/**
 * Auth Controller - Handles Virtual Identity lifecycle
 * Demonstrates Theme 4: Virtual Identity (Password hashing, JWT generation, User profile)
 */
class AuthController {
  // Register a new player
  async register(req, res) {
    try {
      const { username, email, password, avatar } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required.'
        });
      }

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Username must be between 3 and 20 characters.'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.'
        });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).json({
          success: false,
          message: 'Server security configuration error: JWT_SECRET is not configured.'
        });
      }

      const userModel = new UserModel(req.app.locals.db);

      // Check existing username (case-insensitive)
      const existingUser = await userModel.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken. Please choose another.'
        });
      }

      // Check existing email
      const existingEmail = await userModel.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.'
        });
      }

      const createdUser = await userModel.create({ username, email, password, avatar });

      // Generate JWT for Virtual Identity
      const token = jwt.sign(
        { id: createdUser._id, username: createdUser.username, email: createdUser.email },
        secret,
        { expiresIn: '7d' }
      );

      // Fire decoupled in-process event
      gameEvents.emit('user:registered', {
        username: createdUser.username,
        email: createdUser.email
      });

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully!',
        token,
        user: createdUser
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during registration.',
        error: error.message
      });
    }
  }

  // Login player
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both username and password.'
        });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).json({
          success: false,
          message: 'Server security configuration error: JWT_SECRET is not configured.'
        });
      }

      const userModel = new UserModel(req.app.locals.db);
      const user = await userModel.findByUsername(username);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password.'
        });
      }

      const isMatch = await userModel.verifyPassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password.'
        });
      }

      const token = jwt.sign(
        { id: user._id, username: user.username, email: user.email },
        secret,
        { expiresIn: '7d' }
      );

      // Trigger Login in-process event
      gameEvents.emit('user:login', {
        username: user.username,
        ip: req.ip || req.connection?.remoteAddress || 'local'
      });

      // Sanitized user object without password hash
      const safeUser = {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || 'clownfish',
        stats: user.stats || {
          totalGames: 0,
          highScore: 0,
          totalScore: 0,
          highestRound: 0,
          badges: ['Novice Angler']
        },
        createdAt: user.createdAt
      };

      return res.json({
        success: true,
        message: `Welcome back, ${user.username}!`,
        token,
        user: safeUser
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during login.',
        error: error.message
      });
    }
  }

  // Get current user profile (Virtual Identity inspection)
  async getProfile(req, res) {
    try {
      const userModel = new UserModel(req.app.locals.db);
      const user = await userModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found.'
        });
      }

      return res.json({
        success: true,
        user
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user profile.',
        error: error.message
      });
    }
  }

  // Update avatar
  async updateAvatar(req, res) {
    try {
      const { avatar } = req.body;
      if (!avatar) {
        return res.status(400).json({ success: false, message: 'Avatar selection is required.' });
      }

      const userModel = new UserModel(req.app.locals.db);
      await userModel.updateAvatar(req.user.id, avatar);

      return res.json({
        success: true,
        message: 'Avatar updated successfully!',
        avatar
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update avatar.',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();
