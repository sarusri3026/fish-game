const EventEmitter = require('events');

/**
 * GameEventEmitter - Demonstrates Theme 2: Event-Driven Programming
 *
 * NOTE ON ARCHITECTURE:
 * Node.js EventEmitter is an asynchronous IN-PROCESS event mechanism (publish/subscribe pattern),
 * not an external distributed message broker (such as Apache Kafka or RabbitMQ).
 * It enables loose coupling inside the monolith backend by decoupling core request-handling logic
 * from auxiliary side-effects like audit logging, metrics tracking, and badge notifications.
 */
class GameEventEmitter extends EventEmitter {
  constructor() {
    super();
    // In-memory audit ring buffer (stores last 50 events for debugging and system status)
    this.auditLog = [];
  }

  logEvent(type, payload) {
    const entry = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    this.auditLog.unshift(entry);
    if (this.auditLog.length > 50) {
      this.auditLog.pop();
    }
  }

  getAuditLog() {
    return this.auditLog;
  }
}

const gameEvents = new GameEventEmitter();

// Event Listener 1: user:registered
// Responsibility: Audit logging when new virtual identity is established
gameEvents.on('user:registered', (data) => {
  gameEvents.logEvent('user:registered', data);
  console.log(`[EVENT: user:registered] New account created for '${data.username}' (${data.email})`);
});

// Event Listener 2: user:login
// Responsibility: Tracks user login activity and IP access patterns
gameEvents.on('user:login', (data) => {
  gameEvents.logEvent('user:login', data);
  console.log(`[EVENT: user:login] User '${data.username}' authenticated from ${data.ip || 'local'}`);
});

// Event Listener 3: round:completed
// Responsibility: Records individual round performance, telemetry, and answer validity
gameEvents.on('round:completed', (data) => {
  gameEvents.logEvent('round:completed', data);
  console.log(
    `[EVENT: round:completed] Player '${data.username}' completed Round ${data.round} - Correct: ${data.correct}`
  );
});

// Event Listener 4: game:finished
// Responsibility: Records match conclusion, final score metrics, and leaderboard update triggers
gameEvents.on('game:finished', (data) => {
  gameEvents.logEvent('game:finished', data);
  console.log(
    `[EVENT: game:finished] Match concluded for '${data.username}' | Verified Score: ${data.score} | Rounds: ${data.roundReached}`
  );
});

// Event Listener 5: badge:unlocked
// Responsibility: Celebrates achievement milestones and triggers badge awards
gameEvents.on('badge:unlocked', (data) => {
  gameEvents.logEvent('badge:unlocked', data);
  console.log(`[EVENT: badge:unlocked] 🏆 Achievement Awarded! '${data.username}' unlocked '${data.badge}'`);
});

// Event Listener 6: level:completed
// Responsibility: Tracks 100-Level progression, 3-star rating achievements, and level unlocking
gameEvents.on('level:completed', (data) => {
  gameEvents.logEvent('level:completed', data);
  const unlockMsg = data.unlockedNext ? ` -> Unlocked Level ${data.unlockedLevel}! 🔓` : ' (Next level remains locked)';
  console.log(
    `[EVENT: level:completed] Player '${data.username}' completed Level ${data.levelNumber} with ${data.stars}⭐ (${data.score} pts)${unlockMsg}`
  );
});

module.exports = gameEvents;
