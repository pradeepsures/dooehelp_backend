const router = require('express').Router();
const controller = require('./admin-user.controller');

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/:id/wallet/adjust', controller.adjustWalletBalance);
router.get('/:id/wallet-history', controller.getWalletHistory);

module.exports = router;
