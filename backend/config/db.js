/**
 * T-RAYO Centralized MongoDB Atlas Cloud Database Connection
 * Optimized for high-throughput, low-latency, and zero-leak connection pooling.
 */
const mongoose = require('mongoose');
const config = require('./env');

const connectDatabase = async () => {
  try {
    const options = {
      maxPoolSize: 20, // Prevents socket exhaustion while handling concurrent global shoppers
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4 for fast DNS resolution
    };

    await mongoose.connect(config.mongoUri, options);
    console.log(`[T-RAYO Central DB] Connected successfully to MongoDB Atlas`);
  } catch (error) {
    console.error('[T-RAYO Central DB] Connection failed:', error.message);
    // Graceful handling without hard crashing in container environments
  }
};

module.exports = connectDatabase;
