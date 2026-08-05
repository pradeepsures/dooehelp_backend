const router = require('express').Router();
const controller = require('./banner.controller');

router.get('/', controller.list);
router.get('/:id', controller.getOne);

module.exports = router;
