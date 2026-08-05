const express = require('express');
const router = express.Router();

const adminAuthRoutes = require('./auth/admin.routes');
const adminBannerRoutes = require('./banner/admin-banner.routes');

router.use('/auth', adminAuthRoutes);
router.use('/banner', adminBannerRoutes);

module.exports = router;
