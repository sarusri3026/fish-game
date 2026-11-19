const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * Authentication & Virtual Identity Routes
 */
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/profile', verifyToken, (req, res) => authController.getProfile(req, res));
router.put('/avatar', verifyToken, (req, res) => authController.updateAvatar(req, res));

module.exports = router;

