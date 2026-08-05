const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./config/database');
const { createLogger } = require('./config/logger');

const logger = createLogger('server');

const startServer = async () => {
  // Connect to the database first
  await connectDB();

  // Start the server
  app.listen(config.PORT, () => {
    logger.info(`Server is running on port ${config.PORT}`);
  });
};

startServer();
