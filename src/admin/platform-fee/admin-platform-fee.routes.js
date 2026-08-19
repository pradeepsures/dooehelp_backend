const router = require('express').Router();
const controller = require('./admin-platform-fee.controller');
const { validate } = require('../../core/validate');
const { createPlatformFeeSchema, updatePlatformFeeSchema } = require('./admin-platform-fee.schema');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Protect all admin platform-fee routes
router.use(protect, restrictTo('admin', 'superadmin'));

router.get('/', controller.list);
router.post('/', validate(createPlatformFeeSchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', validate(updatePlatformFeeSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
