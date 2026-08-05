const express = require('express');
const router = express.Router();
const userController = require('./user.controller');

const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const uploadMiddleware = require('../../middlewares/upload.middleware');

// Add user specific routes here in the future
router.use('/auth', require('./auth/auth.routes'));
router.use('/banner', require('./banner/banner.routes'));

// Profile routes (Protected)
router.use(protect);
router.use(restrictTo('user'));

router.get('/profile', userController.getProfile);
router.put('/profile', uploadMiddleware.single('profileImage'), userController.updateProfile);

module.exports = router;
