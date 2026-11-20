const express = require('express');
const router = express.Router();

const authController = require('../controller/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Registration
router.post('/register', (req, res) =>
    authController.register(req, res)
);

// Login - username and password
router.post('/login', (req, res) =>
    authController.login(req, res)
);

// Verify login OTP
router.post('/verify-otp', (req, res) =>
    authController.verifyOTP(req, res)
);

// Resend login OTP
router.post('/resend-otp', (req, res) =>
    authController.resendOTP(req, res)
);

// Protected routes
router.get('/profile', verifyToken, (req, res) =>
    authController.getProfile(req, res)
);

router.put('/avatar', verifyToken, (req, res) =>
    authController.updateAvatar(req, res)
);

module.exports = router;
