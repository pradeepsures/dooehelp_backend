const router = require('express').Router();
const controller = require('./subcategory.controller');

router.get('/', controller.list);
router.get('/:id', controller.getOne);

module.exports = router;
