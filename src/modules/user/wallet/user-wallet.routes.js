const router = require('express').Router();
const controller = require('./user-wallet.controller');
const { protect, restrictTo } = require('../../../middlewares/auth.middleware');

router.use(protect, restrictTo('user'));

router.get('/', controller.getWalletSummary);
router.get('/history', controller.getWalletHistory);

module.exports = router;
