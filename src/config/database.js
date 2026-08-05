const mongoose = require('mongoose');
const config = require('./env');
const { createLogger } = require('./logger');

const logger = createLogger('database');

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error({ err }, 'Error connecting to MongoDB');
    process.exit(1);
  }
};

mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

module.exports = { connectDB };
