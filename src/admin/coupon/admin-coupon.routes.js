const router = require('express').Router();
const controller = require('./admin-coupon.controller');
const { validate } = require('../../core/validate');
const {
  createCouponSchema,
  updateCouponSchema,
  assignCouponSchema,
  unassignCouponSchema
} = require('./admin-coupon.schema');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Protect all admin coupon routes
router.use(protect, restrictTo('admin', 'superadmin'));

router.get('/', controller.list);
router.post('/', validate(createCouponSchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', validate(updateCouponSchema), controller.update);
router.delete('/:id', controller.remove);

// Coupon assignment to users
router.post('/:id/assign', validate(assignCouponSchema), controller.assign);
router.post('/:id/unassign', validate(unassignCouponSchema), controller.unassign);
router.get('/:id/assigned-users', controller.getAssignedUsers);

module.exports = router;
