const express = require('express');
const router = express.Router();
const cmsController = require('./cms.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Public route to get CMS content (no token required)
router.get('/:type/:page', cmsController.getCms);

// Protected route for Admin to update CMS content
router.use(protect, restrictTo('admin', 'superadmin'));
router.put('/:type/:page', cmsController.updateCms);

module.exports = router;
