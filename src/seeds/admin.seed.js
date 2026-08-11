require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin.model');
const { rootLogger } = require('../config/logger');

const seedSuperAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/doorhelp';
    await mongoose.connect(mongoUri);
    rootLogger.info('Connected to MongoDB for seeding');

    const email = 'superadmin@doorhelp.com';
    const password = 'password123';

    // Check if super admin already exists
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      rootLogger.info(`Super admin with email ${email} already exists.`);
    } else {
      await Admin.create({
        email,
        password,
        role: 'superadmin'
      });
      rootLogger.info(`Successfully created Super admin: ${email}`);
    }
  } catch (error) {
    rootLogger.error(error, 'Error during super admin seeding');
  } finally {
    await mongoose.disconnect();
    rootLogger.info('Disconnected from MongoDB');
    process.exit(0);
  }
};

// seedSuperAdmin();
