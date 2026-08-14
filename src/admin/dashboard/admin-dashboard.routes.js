const express = require('express');
const router = express.Router();
const controller = require('./admin-dashboard.controller');

router.get('/stats', controller.getOverviewStats);

module.exports = router;
