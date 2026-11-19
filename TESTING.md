# CIS045-3 Coursework: Automated Testing & Verification Documentation

This document outlines the testing strategy, test scripts, and verified results for the **Fish Quest** MERN application in accordance with the CIS045-3 coursework assessment requirements.

---

## 📋 Test Suite Overview

| Test Script | Purpose | Execution Command |
| :--- | :--- | :--- |
| [`backend/tests/verify_suite.js`](file:///c:/Users/MEDION/Desktop/demo%20game/backend/tests/verify_suite.js) | Full 11-step automated verification suite covering MongoDB Atlas, JWT, Fish API, and events. | `node backend/tests/verify_suite.js` |
| [`backend/tests/test_level_progression.js`](file:///c:/Users/MEDION/Desktop/demo%20game/backend/tests/test_level_progression.js) | 9-step test of 100-Level progression, 3-star rating, anti-skipping, unlocking rules, and MongoDB persistence. | `node backend/tests/test_level_progression.js` |
| [`backend/tests/test_game_mechanics.js`](file:///c:/Users/MEDION/Desktop/demo%20game/backend/tests/test_game_mechanics.js) | Targeted verification of game loop rules: 20s timers, 3 lives, combo multipliers, oxygen power-up, sonar hint, and restart. | `node backend/tests/test_game_mechanics.js` |
| [`backend/tests/test_event_system.js`](file:///c:/Users/MEDION/Desktop/demo%20game/backend/tests/test_event_system.js) | Targeted test of Node.js `EventEmitter` in-process pub/sub, verifying all 5 events and audit buffer. | `node backend/tests/test_event_system.js` |
| [`backend/tests/test_full_match_simulation.js`](file:///c:/Users/MEDION/Desktop/demo%20game/backend/tests/test_full_match_simulation.js) | End-to-end player simulation from registration to game-over and leaderboard update. | `node backend/tests/test_full_match_simulation.js` |

---

## 🧪 Detailed Verification Results

### 1. MongoDB Atlas Direct Connectivity & Indexes
- **Test:** Direct connection to MongoDB Atlas database `'test'`.
- **Expected:** Successful connection; verification of unique indexes on `users` (`username`, `email`) and `scores` (`score`, `userId`).
- **Result:** **PASSED**
```text
✓ Connected to MongoDB Atlas database: 'test'
✓ Unique indexes verified
```

### 2. User Registration, Hashing & Duplicate Rejection
- **Test:** Register a new user with `bcryptjs` password hashing; attempt duplicate registration with the same username.
- **Expected:** First registration succeeds with HTTP 201; second registration fails with HTTP 409 Conflict.
- **Result:** **PASSED**
```text
✓ Registered new Virtual Identity: 'Diver_068383'
✓ Duplicate registration successfully rejected with HTTP 409
```

### 3. Authentication, Protected Routes & Sanitization
- **Test:** Authenticate with credentials, obtain JWT, access `/api/auth/profile`, and inspect returned fields.
- **Expected:** Valid token allows access; password hash is stripped via MongoDB projection (`projection: { password: 0 }`).
- **Result:** **PASSED**
```text
✓ Login successful; JWT issued.
✓ Protected route /auth/profile accessed for 'Diver_068383'
✓ Verified: Password hash is never exposed to the client
```

### 4. Official Marc Conrad Fish Game API Integration
- **Test:** Direct HTTP GET request to `https://marcconrad.com/uob/fish/api.php?out=json`.
- **Expected:** Status 200; payload contains `question` (URL), `fish` (integer), and `chest` (integer).
- **Result:** **PASSED**
```text
✓ Successfully communicated with official API: https://www.sanfoh.com/uob/fish/data/...
✓ Verified structure: question (string), fish (1), chest (7)
```

### 5. Opaque Round Token Generation (Anti-Cheat)
- **Test:** Call `GET /api/game/new-round` through backend proxy.
- **Expected:** Receives opaque `roundId` UUID; no solution or chest fields present in the response.
- **Result:** **PASSED**
```text
✓ Received roundId: 'fa9f9b0b-d6fd-4c06-bcb9-9ba01ea85f9f'
✓ Verified: Solution is completely hidden from client response
```

### 6. Dedicated Sonar Hint Endpoint
- **Test:** Call `POST /api/game/sonar-hint` with `{ roundId }`.
- **Expected:** Receives 5 eliminated wrong digits; the correct solution is never included in the array or response payload.
- **Result:** **PASSED**
```text
✓ Sonar Hint returned 5 eliminated digits: [1, 6, 9, 3, 0]
✓ Verified: Sonar hint eliminates wrong digits without exposing the answer
```

### 7. Answer Verification & Replay Attack Prevention
- **Test:** Submit guess for active round; attempt to re-submit the same round token again.
- **Expected:** First check evaluates correctness; subsequent submission fails with HTTP 400 (`round.consumed = true`).
- **Result:** **PASSED**
```text
✓ Incorrect guess correctly identified as false
✓ Verified: Consumed round cannot be replayed (anti-tampering verified)
```

### 8. Server-Side Game Session Tracking & Scoring
- **Test:** Initialize session via `POST /api/game/start-session`; submit round answer with remaining time.
- **Expected:** Server updates session score, streak multiplier, and round count internally.
- **Result:** **PASSED**
```text
✓ Initialized server session: '27e31cbb-9132-4065-a274-ce4beebdf13d' with 3 lives
✓ Server-side score calculated: 0 pts | Streak: 0x
```

### 9. Score Persistence in MongoDB Atlas
- **Test:** Finalize match via `POST /api/game/submit-score` with `{ sessionId }`.
- **Expected:** Record written to `scores` collection; user lifetime stats (`totalGames`, `highScore`) updated in `users` collection.
- **Result:** **PASSED**
```text
✓ Match record stored in 'scores' collection. Record ID: 6afe7d1e6fd4921cf393ba94
✓ Updated user stats: HighScore: 0 | Badges: [Novice Angler]
```

### 10. Global Leaderboard Retrieval
- **Test:** Retrieve top scores via `GET /api/game/leaderboard?limit=5`.
- **Expected:** Returns array of verified scores sorted in descending order.
- **Result:** **PASSED**
```text
✓ Leaderboard retrieved 5 top rankings from MongoDB:
  #1 saru - 1200 pts (Round 9)
  #2 saru - 1200 pts (Round 9)
  #3 saru - 1038 pts (Round 8)
```

### 11. Architectural Reflection Endpoint
- **Test:** Call `GET /api/game/architecture`.
- **Expected:** Returns structured mapping of the 4 unit themes with implementation details.
- **Result:** **PASSED**
```text
✓ Architecture endpoint verified: 'Fish Quest - MERN Stack Distributed Architecture'
✓ Themes 1, 2, 3, 4 fully documented
```

### 12. 100-Level Progressive Unlocking & 3-Star Rating System
- **Test:** Run automated suite [`backend/tests/test_level_progression.js`](file:///c:/Users/MEDION/Desktop/demo%20game/backend/tests/test_level_progression.js).
- **Sub-Tests:**
  1. Initial level progress: Level 1 unlocked, Levels 2–100 locked, 0 stars.
  2. Anti-skipping security: Calling `/api/levels/start` for Level 2 or Level 50 returns HTTP 403 Forbidden.
  3. Start Level 1 session: Receives opaque round identifier and puzzle image without exposed answer.
  4. Submit incorrect answer: Yields 0 stars (Level Failed), Level 2 remains locked.
  5. Submit slow answer (<25% time remaining): Yields 1 star (Insufficient), Level 2 remains locked.
  6. Submit fast answer (>=55% time remaining): Yields 3 stars (Excellent), Level 2 is UNLOCKED (`unlockedNext: true`).
  7. Enter newly unlocked Level 2: Session created successfully.
  8. Complete Level 2 with moderate time (25%–54% time): Yields 2 stars (Good), Level 3 is UNLOCKED.
  9. MongoDB Atlas persistence: Verifies that unlocked level, earned stars, and high scores persist across sessions.
- **Result:** **ALL 9 TESTS PASSED**

---

## 🏆 Overall Test Summary
- **Main Verification Suite:** 11 / 11 PASSED (100%)
- **Level Progression Suite:** 9 / 9 PASSED (100%)
- **System Readiness:** Production Ready for CIS045-3 Video Demonstration
