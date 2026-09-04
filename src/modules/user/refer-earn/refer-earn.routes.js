const router = require('express').Router();
const controller = require('./refer-earn.controller');
const { protect, restrictTo } = require('../../../middlewares/auth.middleware');

const { validate } = require('../../../core/validate');
const { applyReferralSchema } = require('./refer-earn.schema');

// Public routes
router.get('/', controller.getConfig);
router.get('/validate/:code', controller.validateCode);

// Protected routes (for logged-in user)
router.get('/my-referral', protect, restrictTo('user'), controller.getMyReferral);
router.post('/apply', protect, restrictTo('user'), validate(applyReferralSchema), controller.applyCode);

module.exports = router;
