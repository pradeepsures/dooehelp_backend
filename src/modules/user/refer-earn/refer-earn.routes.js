const router = require('express').Router();
const controller = require('./refer-earn.controller');

router.get('/', controller.getConfig);

module.exports = router;
