const express = require('express');
const router = express.Router();
const controller = require('./vendor-wallet.controller');

router.get('/', controller.getWalletSummary);
router.get('/history', controller.getWalletHistory);

module.exports = router;
