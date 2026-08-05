const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const uploadMiddleware = require('../../middlewares/upload.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

router.post('/register', adminController.register);
router.post('/login', adminController.login);
router.post('/refresh-token', adminController.refreshToken);

// Protected routes
router.use(protect, restrictTo('admin', 'superadmin'));
router.put('/profile', uploadMiddleware.single('profileImage'), adminController.updateProfile);

module.exports = router;
