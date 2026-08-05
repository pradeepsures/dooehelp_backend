const express = require('express');
const router = express.Router();
const vendorController = require('./vendor.controller');

// Vendor specific routes
router.use('/auth', require('./auth/auth.routes'));

module.exports = router;
