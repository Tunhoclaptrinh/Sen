const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { parseQuery, formatResponse, validateQuery, logQuery } = require('./middleware/query.middleware');
app.use(parseQuery);
app.use(formatResponse);
app.use(validateQuery);
app.use(logQuery);

// Import Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const heritageSiteRoutes = require('./routes/heritage_site.routes');
const artifactRoutes = require('./routes/artifact.routes');
const questRoutes = require('./routes/quest.routes');
const learningRoutes = require('./routes/learning.routes');
const exhibitionRoutes = require('./routes/exhibition.routes');
const collectionRoutes = require('./routes/collection.routes');
const reviewRoutes = require('./routes/review.routes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/heritage-sites', heritageSiteRoutes);
app.use('/api/artifacts', artifactRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/exhibitions', exhibitionRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/reviews', reviewRoutes);

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    message: '🏛️ CultureVault API v3.0',
    version: '3.0.0',
    endpoints: {
      heritage_sites: '/api/heritage-sites',
      artifacts: '/api/artifacts',
      quests: '/api/quests',
      learning: '/api/learning',
      exhibitions: '/api/exhibitions',
      collections: '/api/collections',
      reviews: '/api/reviews',
      auth: '/api/auth',
      users: '/api/users'
    }
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CultureVault API is running'
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
║   🏛️ CultureVault Server Started!                                 ║
╠══════════════════════════════════════════════════════════════════╣
║   📍 URL: http://localhost:${PORT}                                  ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                                    ║
║   📊 API Docs: http://localhost:${PORT}/api                         ║
║   ❤️  Health: http://localhost:${PORT}/api/health                    ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;