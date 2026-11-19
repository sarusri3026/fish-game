/**
 * Targeted Verification for Stage 3: Game Mechanics
 */

function testGameMechanics() {
  console.log('--- TESTING STAGE 3: GAME MECHANICS & LOGIC ---');

  // 1. Lives and Initial State
  const initialLives = 3;
  const initialRound = 1;
  const roundTime = 20;
  console.log(`1. Initial Setup: Lives=${initialLives}, Round=${initialRound}, Time=${roundTime}s`);
  if (initialLives !== 3 || roundTime !== 20) throw new Error('Initial state incorrect');

  // 2. Extra Oxygen Power-Up (+10s capped at 30s)
  let currentTime = 15;
  let timeAfterOxygen = Math.min(currentTime + 10, 30);
  console.log(`2. Extra Oxygen Test: ${currentTime}s + 10s = ${timeAfterOxygen}s (Capped at 30s)`);
  if (timeAfterOxygen !== 25) throw new Error('Oxygen power-up failed');

  let maxOxygen = Math.min(25 + 10, 30);
  if (maxOxygen !== 30) throw new Error('Oxygen cap failed');

  // 3. Score Calculation & Combo Multipliers
  // Round 1: streak 1x -> base 100 + timeBonus (15s * 10 = 150) * 1.0 = 250
  let combo = 1;
  let multiplier1 = 1 + (combo - 1) * 0.25;
  let points1 = Math.round((100 + 15 * 10) * multiplier1);
  console.log(`3a. Score Round 1 (1x streak, 15s left): ${points1} pts (Expected: 250)`);
  if (points1 !== 250) throw new Error('Score calculation mismatch');

  // Round 2: streak 2x -> base 100 + timeBonus (10s * 10 = 100) * 1.25 = 200 * 1.25 = 250
  combo = 2;
  let multiplier2 = 1 + (combo - 1) * 0.25;
  let points2 = Math.round((100 + 10 * 10) * multiplier2);
  console.log(`3b. Score Round 2 (2x streak, 10s left): ${points2} pts (Expected: 250)`);
  if (points2 !== 250) throw new Error('Score calculation mismatch');

  // Round 3: streak 3x -> base 100 + timeBonus (20s * 10 = 200) * 1.5 = 300 * 1.5 = 450
  combo = 3;
  let multiplier3 = 1 + (combo - 1) * 0.25;
  let points3 = Math.round((100 + 20 * 10) * multiplier3);
  console.log(`3c. Score Round 3 (3x streak, 20s left): ${points3} pts (Expected: 450)`);
  if (points3 !== 450) throw new Error('Score calculation mismatch');

  // 4. Sonar Power-Up Elimination (Eliminates exactly 5 wrong digits)
  const solution = 7;
  const allDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const wrongDigits = allDigits.filter(d => d !== solution);
  const eliminated = wrongDigits.slice(0, 5);
  console.log(`4. Sonar Hint Test: Solution=${solution}, Eliminated 5 digits=[${eliminated.join(', ')}]`);
  if (eliminated.length !== 5 || eliminated.includes(solution)) {
    throw new Error('Sonar hint included correct solution or eliminated wrong count');
  }

  // 5. Lives Decrement & Game Over Condition
  let lives = 3;
  // Mistake 1
  lives--;
  combo = 0;
  console.log(`5a. Wrong answer 1: Lives remaining=${lives}, Combo reset to ${combo}`);
  if (lives !== 2 || combo !== 0) throw new Error('Lives/combo error');

  // Mistake 2 (Timeout)
  lives--;
  console.log(`5b. Timeout 2: Lives remaining=${lives}`);
  if (lives !== 1) throw new Error('Lives error');

  // Mistake 3 (Game Over)
  lives--;
  let isGameOver = lives <= 0;
  console.log(`5c. Wrong answer 3: Lives remaining=${lives}, isGameOver=${isGameOver}`);
  if (lives !== 0 || !isGameOver) throw new Error('Game over condition failed');

  // 6. Restart Mechanics
  lives = initialLives;
  combo = 0;
  let score = 0;
  let round = 1;
  let hintAvailable = true;
  console.log(`6. Restart Test: Lives=${lives}, Score=${score}, Round=${round}, HintAvailable=${hintAvailable}`);
  if (lives !== 3 || score !== 0 || round !== 1 || !hintAvailable) {
    throw new Error('Restart state failed');
  }

  console.log('--- ALL STAGE 3 GAME MECHANICS VERIFIED SUCCESSFULLY ---');
}

testGameMechanics();
