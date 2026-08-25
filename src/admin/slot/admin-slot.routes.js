const router = require('express').Router();
const controller = require('./admin-slot.controller');
const { validate } = require('../../core/validate');
const { createSlotSchema, updateSlotSchema } = require('./admin-slot.schema');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Protect all admin slot routes
router.use(protect, restrictTo('admin', 'superadmin'));

router.get('/', controller.list);
router.post('/', validate(createSlotSchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', validate(updateSlotSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
