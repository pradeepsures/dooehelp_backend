const router = require('express').Router();
const controller = require('./admin-vendor.controller');

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.put('/:id/approve', controller.approve);
router.put('/:id/reject', controller.reject);

module.exports = router;
