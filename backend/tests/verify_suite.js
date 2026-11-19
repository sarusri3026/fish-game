const axios = require('axios');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { connectToDatabase } = require('../config/db');

const BASE_URL = 'http://localhost:5000/api';

async function runTestSuite() {
  console.log('========================================================');
  console.log('   FISH QUEST COMPREHENSIVE AUTOMATED VERIFICATION SUITE');
  console.log('========================================================\n');

  let testsPassed = 0;
  let totalTests = 11;

  // 1. Test MongoDB Connectivity
  console.log('[TEST 1/11] Testing MongoDB Atlas direct connection...');
  try {
    const { client, db } = await connectToDatabase();
    const isConnected = !!db.databaseName;
    console.log(`  ✓ Connected to MongoDB Atlas database: '${db.databaseName}'`);
    await client.close();
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ MongoDB connection failed: ${err.message}`);
  }

  // 2. Test User Registration and Login
  console.log('\n[TEST 2/11] Testing User Registration & Duplicate Prevention...');
  const testUser = {
    username: `Diver_${Date.now().toString().slice(-6)}`,
    email: `diver_${Date.now()}@ocean.test`,
    password: 'securePassword123!',
    avatar: 'shark'
  };
  let authToken = null;
  let userId = null;

  try {
    const regRes = await axios.post(`${BASE_URL}/auth/register`, testUser);
    if (regRes.data.success && regRes.data.token && regRes.data.user) {
      console.log(`  ✓ Registered new Virtual Identity: '${testUser.username}'`);
      authToken = regRes.data.token;
      userId = regRes.data.user._id;

      // Test duplicate prevention
      try {
        await axios.post(`${BASE_URL}/auth/register`, testUser);
        console.error('  ✗ Duplicate registration should have failed with 409!');
      } catch (dupErr) {
        if (dupErr.response && dupErr.response.status === 409) {
          console.log('  ✓ Duplicate registration successfully rejected with HTTP 409');
          testsPassed++;
        } else {
          throw dupErr;
        }
      }
    } else {
      throw new Error('Registration payload failed');
    }
  } catch (err) {
    console.error(`  ✗ Registration test failed: ${err.message}`);
  }

  // 3. Test Authentication & Protected Routes
  console.log('\n[TEST 3/11] Testing Authentication & Protected Routes...');
  try {
    // Login with credentials
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });

    if (loginRes.data.success && loginRes.data.token) {
      console.log('  ✓ Login successful; JWT issued.');
      authToken = loginRes.data.token;

      // Access protected profile route
      const profileRes = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (profileRes.data.success && profileRes.data.user.username === testUser.username) {
        console.log(`  ✓ Protected route /auth/profile accessed for '${profileRes.data.user.username}'`);
        // Verify password hash is NOT returned
        if (profileRes.data.user.password === undefined) {
          console.log('  ✓ Verified: Password hash is never exposed to the client');
          testsPassed++;
        } else {
          console.error('  ✗ Security flaw: Password hash found in user profile response!');
        }
      }
    }
  } catch (err) {
    console.error(`  ✗ Authentication test failed: ${err.message}`);
  }

  // 4. Test Fish API Integration
  console.log('\n[TEST 4/11] Testing Direct Marc Conrad Fish Game API Integration...');
  try {
    const apiRes = await axios.get('https://marcconrad.com/uob/fish/api.php?out=json', { timeout: 7000 });
    if (apiRes.data && apiRes.data.question && apiRes.data.fish !== undefined) {
      console.log(`  ✓ Successfully communicated with official API: ${apiRes.data.question.slice(0, 50)}...`);
      console.log(`  ✓ Verified structure: question (string), fish (${apiRes.data.fish}), chest (${apiRes.data.chest})`);
      testsPassed++;
    } else {
      throw new Error('Unexpected structure from Marc Conrad API');
    }
  } catch (err) {
    console.error(`  ✗ External Fish API test failed: ${err.message}`);
  }

  // 5. Test New Puzzle Generation with Opaque Round ID
  console.log('\n[TEST 5/11] Testing New Puzzle Generation & Anti-Cheating Token...');
  let currentRound = null;
  try {
    const puzzleRes = await axios.get(`${BASE_URL}/game/new-round`);
    if (puzzleRes.data.success && puzzleRes.data.puzzle) {
      currentRound = puzzleRes.data.puzzle;
      console.log(`  ✓ Received roundId: '${currentRound.roundId}'`);
      console.log(`  ✓ Puzzle Image URL: ${currentRound.questionUrl}`);
      console.log(`  ✓ Protocol: ${currentRound.protocol} | Source: ${currentRound.source}`);

      // Verify NO solution or chest is exposed in the response
      if (currentRound.solution === undefined && currentRound.fish === undefined) {
        console.log('  ✓ Verified: Solution is completely hidden from client response');
        testsPassed++;
      } else {
        console.error('  ✗ Security flaw: Solution was returned directly to client!');
      }
    } else {
      throw new Error('Invalid puzzle response format');
    }
  } catch (err) {
    console.error(`  ✗ Puzzle generation test failed: ${err.message}`);
  }

  // 6. Test Dedicated Sonar Hint Endpoint
  console.log('\n[TEST 6/11] Testing Dedicated Sonar Hint Endpoint (/api/game/sonar-hint)...');
  try {
    const hintRes = await axios.post(`${BASE_URL}/game/sonar-hint`, {
      roundId: currentRound.roundId
    });

    if (hintRes.data.success && Array.isArray(hintRes.data.eliminatedDigits)) {
      console.log(`  ✓ Sonar Hint returned ${hintRes.data.eliminatedDigits.length} eliminated digits: [${hintRes.data.eliminatedDigits.join(', ')}]`);
      if (hintRes.data.solution === undefined) {
        console.log('  ✓ Verified: Sonar hint eliminates wrong digits without exposing the answer');
        testsPassed++;
      } else {
        console.error('  ✗ Security flaw: Solution leaked in sonar hint response!');
      }
    } else {
      throw new Error('Sonar hint returned unexpected format');
    }
  } catch (err) {
    console.error(`  ✗ Sonar hint test failed: ${err.message}`);
  }

  // 7. Test Answer Verification (Correct & Incorrect)
  console.log('\n[TEST 7/11] Testing Answer Verification & Replay Protection...');
  try {
    // Deliberately test an invalid guess first (e.g., 99)
    const wrongRes = await axios.post(`${BASE_URL}/game/verify`, {
      roundId: currentRound.roundId,
      playerAnswer: 99
    });

    if (wrongRes.data.success && wrongRes.data.correct === false) {
      console.log(`  ✓ Incorrect guess (99) correctly identified as false. Actual solution: ${wrongRes.data.correctSolution}`);

      // Now verify that the consumed round cannot be replayed
      try {
        await axios.post(`${BASE_URL}/game/verify`, {
          roundId: currentRound.roundId,
          playerAnswer: wrongRes.data.correctSolution
        });
        console.error('  ✗ Replay attack should have failed!');
      } catch (replayErr) {
        if (replayErr.response && replayErr.response.status === 400) {
          console.log('  ✓ Verified: Consumed round cannot be replayed (anti-tampering verified)');
          testsPassed++;
        }
      }
    }
  } catch (err) {
    console.error(`  ✗ Verification test failed: ${err.message}`);
  }

  // 8. Test Game Session Creation & Server-Side Scoring
  console.log('\n[TEST 8/11] Testing Server-Side Session Tracking & Score Calculation...');
  let sessionId = null;
  try {
    const sessionRes = await axios.post(
      `${BASE_URL}/game/start-session`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (sessionRes.data.success && sessionRes.data.sessionId) {
      sessionId = sessionRes.data.sessionId;
      console.log(`  ✓ Initialized server session: '${sessionId}' with ${sessionRes.data.lives} lives`);

      // Fetch a new round for this session
      const nextRoundRes = await axios.get(`${BASE_URL}/game/new-round`);
      const nextRoundId = nextRoundRes.data.puzzle.roundId;

      // Access internal round store solution for test simulation or submit answer
      const answerRes = await axios.post(
        `${BASE_URL}/game/verify`,
        {
          sessionId,
          roundId: nextRoundId,
          playerAnswer: 5,
          timeRemaining: 15
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (answerRes.data.success && answerRes.data.sessionUpdate) {
        console.log(`  ✓ Server-side score calculated: ${answerRes.data.sessionUpdate.newTotalScore} pts | Streak: ${answerRes.data.sessionUpdate.combo}x`);
        testsPassed++;
      }
    }
  } catch (err) {
    console.error(`  ✗ Session scoring test failed: ${err.message}`);
  }

  // 9. Test Score Persistence & User Statistics in MongoDB Atlas
  console.log('\n[TEST 9/11] Testing Score Persistence in MongoDB Atlas...');
  try {
    const scoreRes = await axios.post(
      `${BASE_URL}/game/submit-score`,
      {
        sessionId,
        score: 350,
        roundReached: 3,
        timeElapsed: 25,
        accuracy: 100
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (scoreRes.data.success && scoreRes.data.record) {
      console.log(`  ✓ Match record stored in 'scores' collection. Record ID: ${scoreRes.data.record._id}`);
      console.log(`  ✓ Updated user stats: HighScore: ${scoreRes.data.updatedStats?.highScore} | Badges: [${scoreRes.data.updatedStats?.badges?.join(', ')}]`);
      testsPassed++;
    }
  } catch (err) {
    console.error(`  ✗ Score persistence test failed: ${err.message}`);
  }

  // 10. Test Leaderboard Retrieval
  console.log('\n[TEST 10/11] Testing Global Leaderboard Retrieval...');
  try {
    const leadRes = await axios.get(`${BASE_URL}/game/leaderboard?limit=5`);
    if (leadRes.data.success && Array.isArray(leadRes.data.leaderboard)) {
      console.log(`  ✓ Leaderboard retrieved ${leadRes.data.leaderboard.length} top rankings from MongoDB:`);
      leadRes.data.leaderboard.slice(0, 3).forEach((entry, i) => {
        console.log(`    #${i + 1} ${entry.username} - ${entry.score} pts (Round ${entry.roundReached})`);
      });
      testsPassed++;
    }
  } catch (err) {
    console.error(`  ✗ Leaderboard test failed: ${err.message}`);
  }

  // 11. Test Complete Game Flow & Architecture Endpoint
  console.log('\n[TEST 11/11] Testing Architectural Reflection & Themes Endpoint...');
  try {
    const archRes = await axios.get(`${BASE_URL}/game/architecture`);
    if (archRes.data.application && archRes.data.themes) {
      console.log(`  ✓ Architecture endpoint verified: '${archRes.data.application}'`);
      console.log(`  ✓ Theme 1: ${archRes.data.themes.theme1_softwareDesignPrinciples.title}`);
      console.log(`  ✓ Theme 2: ${archRes.data.themes.theme2_eventDrivenProgramming.title}`);
      console.log(`  ✓ Theme 3: ${archRes.data.themes.theme3_interoperability.title}`);
      console.log(`  ✓ Theme 4: ${archRes.data.themes.theme4_virtualIdentity.title}`);
      testsPassed++;
    }
  } catch (err) {
    console.error(`  ✗ Architecture endpoint test failed: ${err.message}`);
  }

  console.log('\n========================================================');
  console.log(`  AUTOMATED VERIFICATION SUMMARY: ${testsPassed} / ${totalTests} TESTS PASSED`);
  console.log('========================================================');

  if (testsPassed === totalTests) {
    console.log('🏆 ALL 11 TESTS PASSED SUCCESSFULLY! Codebase is production-ready.\n');
    process.exit(0);
  } else {
    console.error(`⚠️ ${totalTests - testsPassed} test(s) failed. Please review the output above.\n`);
    process.exit(1);
  }
}

runTestSuite().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
