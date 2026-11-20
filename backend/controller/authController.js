
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserModel = require('../models/User');
const gameEvents = require('../services/eventService');
const { validatePasswordStrength } = require('../services/passwordService');
const otpService = require('../services/otpService');

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

      const strengthCheck = validatePasswordStrength(password);

      if (!strengthCheck.isValid) {
        return res.status(400).json({
          success: false,
          message: strengthCheck.errors.join(' '),
          errors: strengthCheck.errors
        });
      }

      const secret = process.env.JWT_SECRET;

      if (!secret) {
        return res.status(500).json({
          success: false,
          message: 'JWT_SECRET is not configured.'
        });
      }

      const userModel = new UserModel(req.app.locals.db);

      const existingUser = await userModel.findByUsername(username);

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken.'
        });
      }

      const existingEmail = await userModel.findByEmail(email);

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.'
        });
      }

      const createdUser = await userModel.create({
        username,
        email,
        password,
        avatar
      });

      const token = jwt.sign(
        {
          id: createdUser._id,
          username: createdUser.username,
          email: createdUser.email
        },
        secret,
        { expiresIn: '1d' }
      );

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
        message: 'Server error during registration.'
      });
    }
  }

  // Login - First authentication factor
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
          message: 'JWT_SECRET is not configured.'
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

      const isMatch = await userModel.verifyPassword(
        password,
        user.password
      );

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password.'
        });
      }

      // Generate and email OTP
      try {
        await otpService.sendLoginOTP(req.app.locals.db, user);
      } catch (emailError) {
        console.error('OTP email error:', emailError);

        await userModel.clearLoginOTP(user._id);

        return res.status(503).json({
          success: false,
          message: 'Unable to send verification email. Please try again later.'
        });
      }

      // Temporary token: ONLY for OTP verification
      const challengeToken = jwt.sign(
        {
          id: user._id.toString(),
          purpose: 'login-2fa'
        },
        secret,
        { expiresIn: '5m' }
      );

      return res.status(200).json({
        success: true,
        otpRequired: true,
        challengeToken,
        message: 'Verification code sent to your registered email.'
      });

    } catch (error) {
      console.error('Login error:', error);

      return res.status(500).json({
        success: false,
        message: 'Server error during login.'
      });
    }
  }

  // Verify Email OTP - Second authentication factor
  async verifyOTP(req, res) {
    try {
      const { challengeToken, otp } = req.body;

      if (!challengeToken || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Verification token and OTP are required.'
        });
      }

      if (!/^\d{6}$/.test(String(otp))) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 6-digit OTP.'
        });
      }

      const secret = process.env.JWT_SECRET;

      if (!secret) {
        return res.status(500).json({
          success: false,
          message: 'JWT_SECRET is not configured.'
        });
      }

      // Validate temporary login challenge
      let decoded;

      try {
        decoded = jwt.verify(challengeToken, secret);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Login verification session expired. Please log in again.'
        });
      }

      if (decoded.purpose !== 'login-2fa') {
        return res.status(401).json({
          success: false,
          message: 'Invalid verification session.'
        });
      }

      const userModel = new UserModel(req.app.locals.db);

      const user = await userModel.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found.'
        });
      }

      const otpData = await userModel.getLoginOTP(decoded.id);

      if (!otpData || !otpData.loginOTP) {
        return res.status(400).json({
          success: false,
          message: 'OTP not found. Please request a new verification code.'
        });
      }

      const savedOTP = otpData.loginOTP;

      if (savedOTP.attempts >= 5) {
        await userModel.clearLoginOTP(decoded.id);

        return res.status(429).json({
          success: false,
          message: 'Too many incorrect attempts. Please log in again.'
        });
      }

      if (new Date(savedOTP.expiresAt).getTime() <= Date.now()) {
        await userModel.clearLoginOTP(decoded.id);

        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please log in again.'
        });
      }

      const submittedHash = otpService.hashOTP(String(otp));
      const savedHash = savedOTP.code;

      const hashesMatch =
        typeof savedHash === 'string' &&
        /^[a-f0-9]{64}$/i.test(savedHash) &&
        crypto.timingSafeEqual(
          Buffer.from(submittedHash, 'hex'),
          Buffer.from(savedHash, 'hex')
        );

      if (!hashesMatch) {
        await userModel.incrementLoginOTPAttempts(decoded.id);

        const remainingAttempts = Math.max(
          0,
          4 - savedOTP.attempts
        );

        if (remainingAttempts === 0) {
          await userModel.clearLoginOTP(decoded.id);
        }

        return res.status(401).json({
          success: false,
          message: remainingAttempts === 0
            ? 'Too many incorrect attempts. Please log in again.'
            : `Incorrect OTP. ${remainingAttempts} attempt(s) remaining.`
        });
      }

      // OTP is valid. Remove it before issuing the access token.
      await userModel.clearLoginOTP(decoded.id);

      // Generate FULL JWT only after successful OTP verification
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
          email: user.email
        },
        secret,
        { expiresIn: '1d' }
      );

      gameEvents.emit('user:login', {
        username: user.username,
        ip: req.ip || req.connection?.remoteAddress || 'local'
      });

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

      return res.status(200).json({
        success: true,
        message: 'Two-factor verification successful!',
        token,
        user: safeUser
      });

    } catch (error) {
      console.error('OTP verification error:', error);

      return res.status(500).json({
        success: false,
        message: 'Server error during OTP verification.'
      });
    }
  }

  // Resend OTP
  async resendOTP(req, res) {
    try {
      const { challengeToken } = req.body;
      const secret = process.env.JWT_SECRET;

      if (!challengeToken || !secret) {
        return res.status(400).json({
          success: false,
          message: 'Verification session is required.'
        });
      }

      let decoded;

      try {
        decoded = jwt.verify(challengeToken, secret);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Verification session expired. Please log in again.'
        });
      }

      if (decoded.purpose !== 'login-2fa') {
        return res.status(401).json({
          success: false,
          message: 'Invalid verification session.'
        });
      }

      const userModel = new UserModel(req.app.locals.db);
      const user = await userModel.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found.'
        });
      }

      const existingOTP = await userModel.getLoginOTP(decoded.id);

      if (existingOTP?.loginOTP) {
        const expiresAt = new Date(existingOTP.loginOTP.expiresAt).getTime();
        const createdAt = expiresAt - (5 * 60 * 1000);

        // Enforce a 60-second resend cooldown
        if (Date.now() - createdAt < 60 * 1000) {
          return res.status(429).json({
            success: false,
            message: 'Please wait before requesting another OTP.'
          });
        }
      }

      await otpService.sendLoginOTP(req.app.locals.db, user);

      return res.json({
        success: true,
        message: 'A new OTP has been sent to your email.'
      });

    } catch (error) {
      console.error('Resend OTP error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to resend OTP.'
      });
    }
  }

  // Get current user profile
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
        message: 'Failed to retrieve user profile.'
      });
    }
  }

  // Update avatar
  async updateAvatar(req, res) {
    try {
      const { avatar } = req.body;

      if (!avatar) {
        return res.status(400).json({
          success: false,
          message: 'Avatar selection is required.'
        });
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
        message: 'Failed to update avatar.'
      });
    }
  }
}

module.exports = new AuthController();
