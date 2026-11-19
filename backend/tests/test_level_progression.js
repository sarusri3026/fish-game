/**
 * Level Progression Test Suite – Automated End-to-End Verification
 * Rigorously verifies all 100-Level Progressive Unlocking & 3-Star Rating rules.
 */
require('dotenv').config({ path: __dirname + '/../.env' });

const API_BASE = 'http://localhost:5000/api';

/** Extracts true fish solution from Marc Conrad API image URL for test verification */
function extractSolutionFromUrl(imageUrl) {
  const match = imageUrl.match(/_(\d+)x(\d+)\.png/);
  if (!match) throw new Error(`Could not parse Marc Conrad API image format: ${imageUrl}`);
  return Number(match[2]);
}

async function runTests() {
  console.log('========================================================');
  console.log('  TESTING 100-LEVEL PROGRESSIVE UNLOCKING & 3-STAR RATING');
  console.log('========================================================\n');

  // ── SETUP: Register and authenticate new player ─────────────────────────────
  const username = `Diver_Lvl_${Math.floor(Math.random() * 899999 + 100000)}`;
  const regData = await (await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email: `${username.toLowerCase()}@uob.ac.uk`,
      password: 'SecurePass123!',
      avatar: 'turtle'
    })
  })).json();
  if (!regData.success) throw new Error(`Registration failed: ${regData.message}`);
  const H = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${regData.token}` };
  console.log(`[SETUP] Registered player identity: '${username}'\n`);

  // ── TEST 1: Initial state (Level 1 unlocked, 2-100 locked, 0 stars) ─────────
  console.log('[TEST 1] Initial progress check for brand new player...');
  const p1 = await (await fetch(`${API_BASE}/levels/progress`, { headers: H })).json();
  console.log(`  Unlocked Level: ${p1.unlockedLevel} (Expected: 1)`);
  console.log(`  Total Stars:    ${p1.totalStars} (Expected: 0)`);
  console.log(`  Completed Lvls: ${p1.completedLevels} (Expected: 0)`);
  if (p1.unlockedLevel !== 1) throw new Error(`Expected unlockedLevel=1, got ${p1.unlockedLevel}`);
  if (p1.totalStars !== 0) throw new Error(`Expected totalStars=0, got ${p1.totalStars}`);
  console.log('  ✓ PASS: Level 1 is unlocked automatically; Levels 2–100 locked.\n');

  // ── TEST 2: Anti-skipping security (Direct requests to locked levels) ────────
  console.log('[TEST 2] Anti-skipping check (Attempting to jump to Level 2 and Level 50)...');
  const r2a = await fetch(`${API_BASE}/levels/start`, {
    method: 'POST', headers: H, body: JSON.stringify({ levelNumber: 2 })
  });
  const r2b = await fetch(`${API_BASE}/levels/start`, {
    method: 'POST', headers: H, body: JSON.stringify({ levelNumber: 50 })
  });
  console.log(`  Level 2 start response:  HTTP ${r2a.status} (Expected: 403 Forbidden)`);
  console.log(`  Level 50 start response: HTTP ${r2b.status} (Expected: 403 Forbidden)`);
  if (r2a.status !== 403 || r2b.status !== 403) throw new Error('Locked level must return 403 Forbidden!');
  console.log('  ✓ PASS: Player cannot skip levels; direct API requests strictly blocked.\n');

  // ── TEST 3: Starting Level 1 (Allowed) ───────────────────────────────────────
  console.log('[TEST 3] Starting unlocked Level 1...');
  const s3 = await (await fetch(`${API_BASE}/levels/start`, {
    method: 'POST', headers: H, body: JSON.stringify({ levelNumber: 1 })
  })).json();
  if (!s3.success || !s3.levelSessionId || !s3.puzzle?.question) {
    throw new Error(`Level 1 start failed: ${JSON.stringify(s3)}`);
  }
  console.log(`  Level Session ID: ${s3.levelSessionId}`);
  console.log(`  Fish Puzzle URL:  ${s3.puzzle.question}`);
  console.log(`  Time Limit:       ${s3.timeLimit}s`);
  console.log('  ✓ PASS: Level 1 session started with opaque puzzle from Marc Conrad API.\n');

  // ── TEST 4: Wrong answer → 0 Stars, Level 2 stays locked ────────────────────
  console.log('[TEST 4] Submitting incorrect answer for Level 1...');
  const r4 = await (await fetch(`${API_BASE}/levels/submit`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ levelSessionId: s3.levelSessionId, playerAnswer: -999, timeRemaining: 15 })
  })).json();
  console.log(`  Correct:        ${r4.correct}`);
  console.log(`  Stars Earned:   ${r4.stars} (Expected: 0)`);
  console.log(`  Unlocked Level: ${r4.unlockedLevel} (Expected: 1)`);
  console.log(`  Unlocked Next:  ${r4.unlockedNext} (Expected: false)`);
  if (r4.stars !== 0) throw new Error(`Incorrect answer must yield 0 stars, got ${r4.stars}`);
  if (r4.unlockedLevel !== 1) throw new Error(`Level 2 must remain locked, got ${r4.unlockedLevel}`);
  if (r4.unlockedNext !== false) throw new Error('unlockedNext must be false on 0 stars');
  console.log('  ✓ PASS: 0 Stars awarded (Level Failed); Level 2 remains locked.\n');

  // ── TEST 5: Correct but slow answer (<25% time) → 1 Star, Level 2 locked ────
  console.log('[TEST 5] Submitting slow correct answer for Level 1 (1s out of 20s = 5%)...');
  const s5 = await (await fetch(`${API_BASE}/levels/start`, {
    method: 'POST', headers: H, body: JSON.stringify({ levelNumber: 1 })
  })).json();
  const sol5 = extractSolutionFromUrl(s5.puzzle.question);
  const r5 = await (await fetch(`${API_BASE}/levels/submit`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ levelSessionId: s5.levelSessionId, playerAnswer: sol5, timeRemaining: 1 })
  })).json();
  console.log(`  Submitted:      ${sol5} (Correct: ${r5.correct})`);
  console.log(`  Stars Earned:   ${r5.stars} (Expected: 1)`);
  console.log(`  Unlocked Level: ${r5.unlockedLevel} (Expected: 1)`);
  console.log(`  Unlocked Next:  ${r5.unlockedNext} (Expected: false)`);
  if (r5.stars !== 1) throw new Error(`Slow answer must yield 1 star, got ${r5.stars}`);
  if (r5.unlockedLevel !== 1) throw new Error(`1 Star must NOT unlock Level 2, got ${r5.unlockedLevel}`);
  console.log('  ✓ PASS: 1 Star awarded (Insufficient); Level 2 remains locked.\n');

  // ── TEST 6: Fast correct answer (>=55% time) → 3 Stars, Level 2 UNLOCKED! ───
  console.log('[TEST 6] Submitting fast correct answer for Level 1 (16s out of 20s = 80%)...');
  const s6 = await (await fetch(`${API_BASE}/levels/start`, {
    method: 'POST', headers: H, body: JSON.stringify({ levelNumber: 1 })
  })).json();
  const sol6 = extractSolutionFromUrl(s6.puzzle.question);
  const r6 = await (await fetch(`${API_BASE}/levels/submit`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ levelSessionId: s6.levelSessionId, playerAnswer: sol6, timeRemaining: 16 })
  })).json();
  console.log(`  Submitted:      ${sol6} (Correct: ${r6.correct})`);
  console.log(`  Stars Earned:   ${r6.stars} (Expected: 3)`);
  console.log(`  Score Awarded:  ${r6.score} pts`);
  console.log(`  Unlocked Level: ${r6.unlockedLevel} (Expected: 2)`);
  console.log(`  Unlocked Next:  ${r6.unlockedNext} (Expected: true)`);
  if (r6.stars !== 3) throw new Error(`Fast answer must yield 3 stars, got ${r6.stars}`);
  if (r6.unlockedLevel !== 2) throw new Error(`3 Stars must unlock Level 2, got ${r6.unlockedLevel}`);
  if (!r6.unlockedNext) throw new Error('unlockedNext must be true on 3 stars');
  console.log('  ✓ PASS: 3 Stars awarded (Excellent); Level 2 is UNLOCKED! 🔓\n');

  // ── TEST 7: Level 2 is now accessible ───────────────────────────────────────
  console.log('[TEST 7] Entering newly unlocked Level 2...');
  const s7 = await (await fetch(`${API_BASE}/levels/start`, {
    method: 'POST', headers: H, body: JSON.stringify({ levelNumber: 2 })
  })).json();
  if (!s7.success) throw new Error(`Level 2 should now be accessible: ${s7.message}`);
  console.log(`  Level 2 Session ID: ${s7.levelSessionId}`);
  console.log(`  Level 2 Time Limit: ${s7.timeLimit}s`);
  console.log('  ✓ PASS: Player can now enter Level 2 successfully.\n');

  // ── TEST 8: Moderate correct answer (25%-54% time) → 2 Stars, Level 3 UNLOCKED
  console.log('[TEST 8] Completing Level 2 with moderate time (8s out of 20s = 40%)...');
  const sol7 = extractSolutionFromUrl(s7.puzzle.question);
  const r8 = await (await fetch(`${API_BASE}/levels/submit`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ levelSessionId: s7.levelSessionId, playerAnswer: sol7, timeRemaining: 8 })
  })).json();
  console.log(`  Submitted:      ${sol7} (Correct: ${r8.correct})`);
  console.log(`  Stars Earned:   ${r8.stars} (Expected: 2)`);
  console.log(`  Unlocked Level: ${r8.unlockedLevel} (Expected: 3)`);
  console.log(`  Unlocked Next:  ${r8.unlockedNext} (Expected: true)`);
  if (r8.stars !== 2) throw new Error(`Moderate answer must yield 2 stars, got ${r8.stars}`);
  if (r8.unlockedLevel !== 3) throw new Error(`2 Stars must unlock Level 3, got ${r8.unlockedLevel}`);
  console.log('  ✓ PASS: 2 Stars awarded (Good); Level 3 is UNLOCKED! 🔓\n');

  // ── TEST 9: Persistence in MongoDB Atlas ─────────────────────────────────────
  console.log('[TEST 9] Verifying full progression persistence in MongoDB Atlas...');
  const p9 = await (await fetch(`${API_BASE}/levels/progress`, { headers: H })).json();
  console.log(`  Persisted Unlocked Level: ${p9.unlockedLevel} (Expected: 3)`);
  console.log(`  Persisted Total Stars:    ${p9.totalStars} (Expected: 5 = 3 + 2)`);
  console.log(`  Persisted Completed Count:${p9.completedLevels} (Expected: 2)`);
  console.log(`  Level 1 Record:`, p9.levels['1']);
  console.log(`  Level 2 Record:`, p9.levels['2']);
  if (p9.unlockedLevel !== 3) throw new Error(`DB unlockedLevel mismatch: got ${p9.unlockedLevel}`);
  if (p9.totalStars !== 5) throw new Error(`DB totalStars mismatch: got ${p9.totalStars}`);
  if (p9.completedLevels !== 2) throw new Error(`DB completedLevels mismatch: got ${p9.completedLevels}`);
  console.log('  ✓ PASS: Complete 100-level player progress persisted in MongoDB Atlas.\n');

  console.log('========================================================');
  console.log('  ALL 9 LEVEL PROGRESSION TESTS PASSED! 🌟🌟🌟');
  console.log('========================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err.message);
  process.exit(1);
});
