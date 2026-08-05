const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const uploadMiddleware = require('../../../middlewares/upload.middleware');

router.post('/register', uploadMiddleware.single('profileImage'), authController.register);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
