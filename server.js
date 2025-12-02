const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(require('./middleware/logger.middleware'));

// Query parsing
const { parseQuery, formatResponse, validateQuery, logQuery } = require('./middleware/query.middleware');
app.use(parseQuery);
app.use(formatResponse);
app.use(validateQuery);
app.use(logQuery);

// Import Routes
// Mount all routes
app.use('/api', require('./routes'));

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'SEN API - Cultural Heritage Game',
    version: '1.0.0',
    description: 'Backend cho game giáo dục lịch sử văn hóa Việt Nam',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      heritage: '/api/heritage-sites',
      artifacts: '/api/artifacts',
      game: '/api/game',
      ai: '/api/ai',
      learning: '/api/learning',
      quests: '/api/quests'
    }
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sen API is running'
  });
});

// ==================== ERROR HANDLING ====================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    path: req.path,
    method: req.method
  });

  const statusCode = err.status || err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? {
      type: err.name,
      stack: err.stack
    } : undefined
  };

  res.status(statusCode).json(response);
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║   🏛️ Sen Server Started!                                 ║
╠══════════════════════════════════════════════════════════════════╣
║   📍 URL: http://localhost:${PORT}                                  ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                                    ║
║   📊 API Docs: http://localhost:${PORT}/api                         ║
║   ❤️  Health: http://localhost:${PORT}/api/health                    ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;