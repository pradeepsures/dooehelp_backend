const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('./logger');
const logger = createLogger('firebase');

try {
  if (!admin.apps.length) {
    const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      logger.info('Firebase Admin SDK initialized successfully');
    } else {
      logger.warn('firebase-service-account.json not found. Push notifications will be disabled.');
    }
  }
} catch (error) {
  logger.error({ err: error }, 'Failed to initialize Firebase Admin SDK');
}

module.exports = admin;
