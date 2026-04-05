// ============================================================
// server.js — CampusAssist Main Server Entry Point
// ============================================================
const path = require('path');
require('./config/env');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const db = require('./config/database');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ──────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ── Body Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Static Files ──────────────────────────────────────────────
// ── Health Check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'CampusAssist API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start Server ──────────────────────────────────────────────
async function startServer() {
  const connected = await db.testConnection();
  if (!connected) {
    console.error('❌ Cannot start server: database connection failed.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║       CampusAssist API Server          ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║  🚀 Running on: http://localhost:${PORT}   ║`);
    console.log(`║  📊 Environment: ${process.env.NODE_ENV || 'development'}            ║`);
    console.log('╚════════════════════════════════════════╝\n');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
