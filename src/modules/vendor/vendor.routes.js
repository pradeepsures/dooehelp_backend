const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Vendor specific public routes
router.use('/auth', require('./auth/auth.routes'));

// Protected vendor routes
router.use(protect, restrictTo('vendor'));

module.exports = router;
