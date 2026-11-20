const assert = require('assert');
const { hashPassword, verifyPassword, validatePasswordStrength } = require('../services/passwordService');

async function runTests() {
  console.log('--- Testing Password Security & Hashing ---');

  // Test 1: validatePasswordStrength rejects weak passwords
  console.log('Test 1: Validate weak password rejection...');
  const weak1 = validatePasswordStrength('short');
  assert.strictEqual(weak1.isValid, false);
  assert.ok(weak1.errors.some(e => e.includes('at least 8 characters')));

  const weakNoUpper = validatePasswordStrength('lowercase123!');
  assert.strictEqual(weakNoUpper.isValid, false);
  assert.ok(weakNoUpper.errors.some(e => e.includes('uppercase')));

  const weakNoLower = validatePasswordStrength('UPPERCASE123!');
  assert.strictEqual(weakNoLower.isValid, false);
  assert.ok(weakNoLower.errors.some(e => e.includes('lowercase')));

  const weakNoNumber = validatePasswordStrength('NoNumbersHere!');
  assert.strictEqual(weakNoNumber.isValid, false);
  assert.ok(weakNoNumber.errors.some(e => e.includes('number')));

  const weakNoSpecial = validatePasswordStrength('NoSpecialChars123');
  assert.strictEqual(weakNoSpecial.isValid, false);
  assert.ok(weakNoSpecial.errors.some(e => e.includes('special')));

  console.log('✓ All weak password cases rejected as expected');

  // Test 2: validatePasswordStrength accepts strong password
  console.log('Test 2: Validate strong password acceptance...');
  const strong = validatePasswordStrength('OceanExplorer99!');
  assert.strictEqual(strong.isValid, true);
  assert.strictEqual(strong.errors.length, 0);
  assert.strictEqual(strong.score, 5);
  console.log('✓ Strong password accepted with score 5/5');

  // Test 3: Password Hashing with bcrypt
  console.log('Test 3: Hashing plain password...');
  const plain = 'OceanExplorer99!';
  const hash = await hashPassword(plain);
  console.log('  Plaintext:', plain);
  console.log('  Hashed:', hash);
  assert.notStrictEqual(plain, hash);
  assert.ok(hash.startsWith('$2')); // bcrypt prefix ($2a$, $2b$, etc.)

  // Test 4: Password Verification
  console.log('Test 4: Verifying hash against correct and incorrect passwords...');
  const isMatchCorrect = await verifyPassword(plain, hash);
  assert.strictEqual(isMatchCorrect, true);
  console.log('✓ Correct password verified successfully');

  const isMatchWrong = await verifyPassword('WrongPassword123!', hash);
  assert.strictEqual(isMatchWrong, false);
  console.log('✓ Incorrect password rejected successfully');

  console.log('\n✅ All Password Security & Hashing Tests Passed!\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
