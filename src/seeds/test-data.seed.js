const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category.model');
const Subcategory = require('../models/Subcategory.model');
const Admin = require('../models/Admin.model');
const Vendor = require('../models/Vendor.model');
const User = require('../models/User.model');
const Cart = require('../models/Cart.model');
const Wishlist = require('../models/Wishlist.model');
const Booking = require('../models/Booking.model');
const SaveForLater = require('../models/SaveForLater.model');
const { rootLogger } = require('../config/logger');

const seedTestData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doorhelp';
    await mongoose.connect(mongoUri);
    rootLogger.info('Connected to MongoDB for seeding test data');

    // 1. Clear database
    // await Promise.all([
    //   Category.deleteMany({}),
    //   Subcategory.deleteMany({}),
    //   Admin.deleteMany({}),
    //   Vendor.deleteMany({}),
    //   User.deleteMany({}),
    //   Cart.deleteMany({}),
    //   Wishlist.deleteMany({}),
    //   Booking.deleteMany({}),
    //   SaveForLater.deleteMany({})
    // ]);
    // rootLogger.info('Database cleared of existing records');

    // 2. Seed Admin
    const admin = await Admin.create({
      name: 'System Admin',
      email: 'admin@doorhelp.com',
      password: 'password123',
      role: 'superadmin'
    });
    rootLogger.info(`Admin created: ${admin.email}`);

    // 3. Seed Category
    const category = await Category.create({
      name: 'Cleaning & Repairs',
      image: '/public/uploads/categories/cleaning.png'
    });
    rootLogger.info(`Category created: ${category.name}`);

    // 4. Seed Subcategories
    const deepCleaning = await Subcategory.create({
      categoryId: category._id,
      name: 'Deep Home Cleaning',
      description: 'Kitchen, Bathroom, and Living Area',
      price: 1290,
      originalPrice: 1500,
      image: '/public/uploads/services/cleaning.png',
      status: true
    });

    const sinkRepair = await Subcategory.create({
      categoryId: category._id,
      name: 'Kitchen Sink Repair',
      description: 'Unclogging and Pipe Sealing',
      price: 650,
      image: '/public/uploads/services/repair.png',
      status: true
    });

    const lockInstall = await Subcategory.create({
      categoryId: category._id,
      name: 'Smart Lock Installation',
      description: 'Estimated: 60 - 90 mins',
      price: 85,
      image: '/public/uploads/services/lock.png',
      status: true
    });

    rootLogger.info('Subcategories (services) created');

    // 5. Seed Vendor
    const vendor = await Vendor.create({
      name: 'David Wilson',
      phoneNumber: '+919999999999',
      email: 'david.wilson@doorhelp.com',
      role: 'vendor',
      profileImage: '/public/uploads/vendors/david.png',
      gender: 'male',
      yearOfExperience: 5,
      categories: [category._id],
      status: 'active',
      onlineStatus: 'online',
      isVerified: true,
      city: 'Delhi',
      address: 'Vasant Kunj, New Delhi',
      location: {
        lat: 28.5276,
        long: 77.1512
      },
      otp: '1234',
      otpExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
    rootLogger.info(`Vendor created: ${vendor.name} (${vendor.phoneNumber})`);

    // 6. Seed User
    const user = await User.create({
      name: 'Arjun Sharma',
      phoneNumber: '+918888888888',
      email: 'arjun.sharma@doorhelp.com',
      role: 'user',
      profileImage: '/public/uploads/users/arjun.png',
      address: 'Connaught Place, New Delhi',
      location: {
        lat: 28.6304,
        long: 77.2177
      },
      otp: '1234',
      otpExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
    rootLogger.info(`User created: ${user.name} (${user.phoneNumber})`);

    console.log('\n--- SEEDING COMPLETE ---');
    console.log(`User: ${user.phoneNumber} (OTP: 1234)`);
    console.log(`Vendor/Partner: ${vendor.phoneNumber} (OTP: 1234)`);
    console.log(`Admin: ${admin.email} (Password: password123)`);
    console.log('Subcategories seeded:');
    console.log(`  - ${deepCleaning.name} (ID: ${deepCleaning._id})`);
    console.log(`  - ${sinkRepair.name} (ID: ${sinkRepair._id})`);
    console.log(`  - ${lockInstall.name} (ID: ${lockInstall._id})`);
    console.log('------------------------\n');

  } catch (error) {
    rootLogger.error(error, 'Error during seeding test data');
  } finally {
    await mongoose.disconnect();
    rootLogger.info('Disconnected from MongoDB');
    process.exit(0);
  }
};

// seedTestData();
