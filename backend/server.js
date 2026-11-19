const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectToDatabase } = require('./config/db');
const authRoutes = require('./router/authRoutes');
const gameRoutes = require('./router/gameRoutes');
const levelRoutes = require('./router/levelRoutes');
const UserModel = require('./models/User');
const ScoreModel = require('./models/Score');
const LevelProgressModel = require('./models/LevelProgress');

const app = express();

// Cross-Origin Resource Sharing (Interoperability between frontend & backend)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/levels', levelRoutes);

// Health Check & Root
app.get('/', (req, res) => {
  res.json({
    project: 'Fish Quest - MERN Stack Distributed Architecture',
    status: 'Server online and operational',
    version: '1.0.0',
    unit: 'CIS045-3 Distributed Service Architectures',
    endpoints: {
      auth: '/api/auth/register, /api/auth/login, /api/auth/profile',
      game: '/api/game/new-round, /api/game/verify, /api/game/submit-score, /api/game/leaderboard, /api/game/architecture',
      levels: '/api/levels/progress, /api/levels/start, /api/levels/submit'
    }
  });
});

// Centralized error handler (Software Design Principles - High Cohesion)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  if (!process.env.JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET must be defined in the backend environment.');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('[FATAL] MONGODB_URI must be defined in the backend environment.');
    process.exit(1);
  }

  const { client, db } = await connectToDatabase();
  app.locals.db = db;
  console.log(`[DATABASE] MongoDB Atlas connected successfully to '${db.databaseName}'`);

  // Initialize database indexes
  const userModel = new UserModel(db);
  const scoreModel = new ScoreModel(db);
  const levelProgressModel = new LevelProgressModel(db);
  await userModel.initIndexes();
  await scoreModel.initIndexes();
  await levelProgressModel.initIndexes();
  console.log('[DATABASE] Unique indexes verified');

  const server = app.listen(PORT, () => {
    console.log(`[SERVER] Fish Quest backend listening on port ${PORT}`);
    console.log(`[SERVER] URL: http://localhost:${PORT}`);
  });

  const shutdown = () => {
    console.log('\n[SERVER] Gracefully shutting down...');
    server.close(async (error) => {
      if (error) {
        console.error('Error closing HTTP server:', error.message);
      }
      try {
        await client.close();
        console.log('[DATABASE] MongoDB connection closed.');
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError.message);
      }
      process.exit(0);
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

startServer().catch((error) => {
  console.error('[FATAL] Failed to start Fish Quest backend:', error.message);
  process.exit(1);
});
