const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { parseQuery, formatResponse, validateQuery, logQuery } = require('./middleware/query.middleware');

// Apply query parsing to all routes
app.use(parseQuery);
app.use(formatResponse);
app.use(validateQuery);
app.use(logQuery);

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const heritageSiteRoutes = require('./routes/heritage_site.routes');
const artifactRoutes = require('./routes/artifact.routes');
const exhibitionRoutes = require('./routes/exhibition.routes');
const categoryRoutes = require('./routes/category.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const reviewRoutes = require('./routes/review.routes');
const notificationRoutes = require('./routes/notification.routes');

// ==================== ROUTES ====================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/heritage-sites', heritageSiteRoutes);
app.use('/api/artifacts', artifactRoutes);
app.use('/api/exhibitions', exhibitionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);

// ==================== UTILITIES ====================

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    message: '🏛️ CultureVault API v1.0 - Di Sản Văn hóa Platform',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: [
      'Authentication (JWT)',
      'Heritage Sites Management',
      'Artifacts & Collections',
      'Virtual Exhibitions',
      'GPS-based Discovery',
      'Timeline & History',
      'Community Reviews & Ratings',
      'Favorite Collections',
      'Notification System'
    ],
    documentation: {
      api_docs: '/docs/API_ENDPOINTS.md',
      status: '/api/health'
    }
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CultureVault API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
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
║   🏛️ CultureVault Server Started!                               ║
╠══════════════════════════════════════════════════════════════════╣
║   📍 URL: http://localhost:${PORT}                                  ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                                    ║
║   📊 API Docs: http://localhost:${PORT}/api                         ║
║   ❤️  Health: http://localhost:${PORT}/api/health                    ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;