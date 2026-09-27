/**
 * T-RAYO Backend API Server Entry Point
 * 
 * Optimized for Railway cloud deployment, MongoDB Atlas connectivity,
 * and high-concurrency low-latency performance.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const config = require('./config/env');
const connectDatabase = require('./config/db');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorMiddleware');
const rateLimiter = require('./middleware/rateLimiter');

// Import Route Handlers
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const userRoutes = require('./routes/userRoutes');
const syncRoutes = require('./routes/syncRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security & Optimization Middleware
// Cross-Origin Resource Sharing configured to allow Netlify frontend & mobile devices anywhere
app.use(cors({
  origin: true, // Dynamically reflects request origin (Netlify, custom domain, localhost, mobile)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'If-None-Match', 'X-T-RAYO-Version'],
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: false // Allows assets/APIs to be consumed by Netlify
}));
app.use(compression()); // Compresses HTTP response bodies for fast network delivery

app.use(express.json({ limit: '5mb' })); // Allows base64/JSON product payloads
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Global Rate Limiting
app.use(rateLimiter);

// Health check endpoint for Railway container liveness probes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes Mounting
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/admin', adminRoutes);

// Centralized Error Handling
app.use(errorHandler);

// Start Server & Connect Database
const startServer = async () => {
  await connectDatabase();
  const server = app.listen(config.port, () => {
    logger.info(`T-RAYO API running in [${config.env}] mode on port ${config.port}`);
  });

  // Graceful shutdown to prevent resource leaks
  const shutdown = () => {
    logger.info('Received termination signal. Shutting down gracefully...');
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();

module.exports = app;
