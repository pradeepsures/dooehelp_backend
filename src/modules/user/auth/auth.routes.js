const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const uploadMiddleware = require('../../../middlewares/upload.middleware');

const { validate } = require('../../../core/validate');
const { registerSchema, sendOtpSchema, verifyOtpSchema, updateProfileSchema } = require('./auth.schema');
const { protect, restrictTo } = require('../../../middlewares/auth.middleware');

router.post('/register', uploadMiddleware.single('profileImage'), validate(registerSchema), authController.register);
router.post('/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/refresh-token', authController.refreshToken);

// Profile routes (Protected)
router.use(protect);
router.use(restrictTo('user'));

router.get('/profile', authController.getProfile);
router.put('/profile', uploadMiddleware.single('profileImage'), validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
