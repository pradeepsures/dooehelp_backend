const router = require('express').Router();
const controller = require('./admin-coupon.controller');
const { validate } = require('../../core/validate');
const { createCouponSchema, updateCouponSchema } = require('./admin-coupon.schema');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Protect all admin coupon routes
router.use(protect, restrictTo('admin', 'superadmin'));

router.get('/', controller.list);
router.post('/', validate(createCouponSchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', validate(updateCouponSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
