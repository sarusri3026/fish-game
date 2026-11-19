const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function testBonusSystem() {
  console.log('--- TEST 1: Register unique test user for Bonus Testing ---');
  const rand = Math.floor(Math.random() * 1000000);
  const username = `sailor_bonus_${rand}`;
  const password = 'Password123!';

  const regRes = await axios.post(`${BASE_URL}/auth/register`, {
    username,
    email: `${username}@test.com`,
    password
  });
  const token = regRes.data.token;
  console.log('✅ Registered user:', username);

  const authHeaders = { Authorization: `Bearer ${token}` };

  console.log('\n--- TEST 2: Attempt to claim Level 5 bonus when Level 5 is not completed ---');
  try {
    await axios.post(
      `${BASE_URL}/levels/claim-bonus`,
      { bonusKey: 'zone_0_mid_chest', stageId: 0, levelNumber: 5 },
      { headers: authHeaders }
    );
    console.error('❌ Expected error claiming locked bonus, but succeeded!');
    process.exit(1);
  } catch (err) {
    console.log('✅ Correctly blocked unearned bonus claim:', err.response?.data?.message || err.message);
  }

  console.log('\n--- TEST 3: Progress user to Level 5 with >= 2 stars ---');
  // Complete levels 1 through 5
  for (let lvl = 1; lvl <= 5; lvl++) {
    const startRes = await axios.post(
      `${BASE_URL}/levels/start`,
      { levelNumber: lvl },
      { headers: authHeaders }
    );
    const sessionId = startRes.data.levelSessionId;
    const fishImage = startRes.data.puzzle.question;
    // Extract solution from URL
    const match = fishImage.match(/_(\d+)x(\d+)\.png/);
    if (!match) throw new Error('Could not parse fish solution');
    const solution = parseInt(match[2], 10);

    const submitRes = await axios.post(
      `${BASE_URL}/levels/submit`,
      {
        levelSessionId: sessionId,
        playerAnswer: solution,
        timeRemaining: 40
      },
      { headers: authHeaders }
    );
    console.log(`Level ${lvl} result: ${submitRes.data.stars} stars, score: ${submitRes.data.score}`);
  }

  console.log('\n--- TEST 4: Claim Mid-Zone Bonus now that Level 5 is cleared ---');
  const claimRes = await axios.post(
    `${BASE_URL}/levels/claim-bonus`,
    { bonusKey: 'zone_0_mid_chest', stageId: 0, levelNumber: 5 },
    { headers: authHeaders }
  );
  console.log('Claim response:', claimRes.data);
  if (!claimRes.data.success || claimRes.data.alreadyClaimed) {
    console.error('❌ Failed to claim valid bonus');
    process.exit(1);
  }
  console.log('✅ Bonus claimed successfully! Points awarded:', claimRes.data.reward.bonusPoints);

  console.log('\n--- TEST 5: Verify claiming again returns alreadyClaimed ---');
  const claimAgainRes = await axios.post(
    `${BASE_URL}/levels/claim-bonus`,
    { bonusKey: 'zone_0_mid_chest', stageId: 0, levelNumber: 5 },
    { headers: authHeaders }
  );
  console.log('Claim again response:', claimAgainRes.data);
  if (!claimAgainRes.data.alreadyClaimed) {
    console.error('❌ Expected alreadyClaimed=true');
    process.exit(1);
  }
  console.log('✅ Correctly prevented duplicate claiming!');

  console.log('\n--- TEST 6: Verify progress includes claimedBonuses ---');
  const progRes = await axios.get(`${BASE_URL}/levels/progress`, { headers: authHeaders });
  console.log('Claimed bonuses in progress:', progRes.data.claimedBonuses);
  if (!progRes.data.claimedBonuses?.zone_0_mid_chest) {
    console.error('❌ claimedBonuses missing from progress');
    process.exit(1);
  }
  console.log('✅ Verified claimedBonuses is persisted in user progress in MongoDB Atlas!');

  console.log('\n🎉 ALL BONUS TESTS PASSED CLEANLY! 🎉');
}

testBonusSystem().catch((err) => {
  console.error('Test error:', err.response?.data || err.message);
  process.exit(1);
});
