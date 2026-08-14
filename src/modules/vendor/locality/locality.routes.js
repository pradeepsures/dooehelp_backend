const router = require('express').Router();
const controller = require('./locality.controller');

router.get('/', controller.list);

module.exports = router;
