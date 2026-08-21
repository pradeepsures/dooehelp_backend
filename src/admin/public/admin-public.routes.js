const router = require('express').Router();
const controller = require('./admin-public.controller');

router.post('/delete-account/send-otp', controller.sendOtp);
router.post('/delete-account/verify-otp', controller.verifyOtp);

module.exports = router;
