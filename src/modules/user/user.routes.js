const express = require('express');
const router = express.Router();

// Add user specific routes here in the future
router.use('/auth', require('./auth/auth.routes'));
router.use('/banner', require('./banner/banner.routes'));

module.exports = router;
