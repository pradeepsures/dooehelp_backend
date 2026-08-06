const express = require('express');
const router = express.Router();

// Vendor specific routes
router.use('/auth', require('./auth/auth.routes'));

module.exports = router;
