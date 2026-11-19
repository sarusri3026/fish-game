/**
 * Targeted Verification for Stage 4: Event-Driven Programming
 */
const gameEvents = require('../services/eventService');

function testEventSystem() {
  console.log('--- TESTING STAGE 4: EVENT-DRIVEN PROGRAMMING & EMITTER ---');

  const capturedEvents = [];

  // Temporarily attach spy listener to verify event dispatch
  const eventTypes = [
    'user:registered',
    'user:login',
    'round:completed',
    'game:finished',
    'badge:unlocked'
  ];

  eventTypes.forEach((type) => {
    gameEvents.on(type, (payload) => {
      capturedEvents.push({ type, payload });
    });
  });

  // 1. Emit user:registered
  console.log('1. Dispatching event: user:registered');
  gameEvents.emit('user:registered', {
    username: 'CaptainAhab',
    email: 'ahab@pequod.sea'
  });

  // 2. Emit user:login
  console.log('2. Dispatching event: user:login');
  gameEvents.emit('user:login', {
    username: 'CaptainAhab',
    ip: '192.168.1.42'
  });

  // 3. Emit round:completed
  console.log('3. Dispatching event: round:completed');
  gameEvents.emit('round:completed', {
    username: 'CaptainAhab',
    round: 1,
    correct: true
  });

  // 4. Emit badge:unlocked
  console.log('4. Dispatching event: badge:unlocked');
  gameEvents.emit('badge:unlocked', {
    userId: 'mock_user_123',
    username: 'CaptainAhab',
    badge: 'Reef Explorer'
  });

  // 5. Emit game:finished
  console.log('5. Dispatching event: game:finished');
  gameEvents.emit('game:finished', {
    userId: 'mock_user_123',
    username: 'CaptainAhab',
    score: 450,
    roundReached: 3
  });

  // Verify all 5 events were captured
  console.log('\n--- VERIFYING CAPTURED EVENTS & AUDIT LOG ---');
  console.log(`Total events captured: ${capturedEvents.length} / 5`);

  if (capturedEvents.length !== 5) {
    throw new Error(`Expected 5 events, but captured ${capturedEvents.length}`);
  }

  const auditLog = gameEvents.getAuditLog();
  console.log(`Audit log buffer depth: ${auditLog.length} entries`);

  eventTypes.forEach((expectedType) => {
    const found = auditLog.some((entry) => entry.type === expectedType);
    if (!found) {
      throw new Error(`Audit log is missing expected event: ${expectedType}`);
    }
    console.log(`  ✓ Audit buffer contains: '${expectedType}' with timestamp`);
  });

  console.log('--- ALL STAGE 4 EVENT-DRIVEN TESTS PASSED SUCCESSFULLY ---');
}

testEventSystem();
