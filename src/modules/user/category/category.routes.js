const router = require('express').Router();
const controller = require('./category.controller');

router.get('/', controller.list);
router.get('/:id', controller.getOne);

module.exports = router;
