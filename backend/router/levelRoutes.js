const express = require('express');
const router = express.Router();
const levelController = require('../controller/levelController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * Level Routes - Endpoints for 100-Level progression and 3-Star Rating
 * Demonstrates:
 * - Theme 1: Routing Cohesion
 * - Theme 4: Virtual Identity (All progression endpoints require JWT verification)
 */

// 1. Get player's 100-level progress
router.get('/progress', verifyToken, (req, res) => levelController.getProgress(req, res));

// 2. Start a level session (verifies level is unlocked)
router.post('/start', verifyToken, (req, res) => levelController.startLevel(req, res));

// 3. Submit level answer (server evaluates stars, updates MongoDB progress)
router.post('/submit', verifyToken, (req, res) => levelController.submitLevel(req, res));

// 4. Claim mid-zone chest or milestone bonus
router.post('/claim-bonus', verifyToken, (req, res) => levelController.claimBonus(req, res));

module.exports = router;
