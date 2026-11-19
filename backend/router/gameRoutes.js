const express = require('express');
const router = express.Router();
const gameController = require('../controller/gameController');
const { verifyToken, optionalToken } = require('../middleware/authMiddleware');

/**
 * Game Routes
 * Demonstrates Theme 1 (Routing Cohesion) & Theme 3 (Interoperability)
 */

// 1. Initialize server-side session (Anti-cheat)
router.post('/start-session', optionalToken, (req, res) => gameController.startSession(req, res));

// 2. Fetch new round puzzle from Fish API (Interoperability with opaque roundId)
router.get('/new-round', optionalToken, (req, res) => gameController.getNewRound(req, res));

// 3. Sonar Hint calculation (Does not leak solution)
router.post('/sonar-hint', optionalToken, (req, res) => gameController.getSonarHint(req, res));

// 4. Verify round answer (Event generation & server session update)
router.post('/verify', optionalToken, (req, res) => gameController.verifyRound(req, res));

// 5. Submit game score (Validated via server session)
router.post('/submit-score', optionalToken, (req, res) => gameController.submitScore(req, res));

// 6. Global Leaderboard
router.get('/leaderboard', (req, res) => gameController.getLeaderboard(req, res));

// 7. User game history (Protected route requiring Virtual Identity)
router.get('/history', verifyToken, (req, res) => gameController.getUserHistory(req, res));

// 8. Architecture & Four Themes explanation summary
router.get('/architecture', (req, res) => gameController.getArchitectureSummary(req, res));

// 9. In-Process Event Audit Log (Theme 2)
router.get('/events-audit', (req, res) => gameController.getEventsAudit(req, res));

module.exports = router;
