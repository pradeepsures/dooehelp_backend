const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect, restrictTo } = require('../../../middlewares/auth.middleware');
const uploadMiddleware = require('../../../middlewares/upload.middleware');
const { validate } = require('../../../core/validate');
const { sendOtpSchema, verifyOtpSchema, updateProfileSchema } = require('./auth.schema');

router.post('/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/refresh-token', authController.refreshToken);

// Profile routes (Protected)
router.use(protect);
router.use(restrictTo('vendor'));

router.get('/profile', authController.getProfile);
router.put('/profile', uploadMiddleware.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'adharFront', maxCount: 1 },
  { name: 'adharBack', maxCount: 1 },
  { name: 'panFront', maxCount: 1 },
  { name: 'panBack', maxCount: 1 },
  { name: 'passBookPhoto', maxCount: 1 },
  { name: 'professionalCertificate', maxCount: 6 }
]), validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
