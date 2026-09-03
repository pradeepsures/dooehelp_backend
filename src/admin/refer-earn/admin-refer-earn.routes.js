const router = require('express').Router();
const controller = require('./admin-refer-earn.controller');
const { validate } = require('../../core/validate');
const { createReferAndEarnSchema, updateReferAndEarnSchema } = require('./admin-refer-earn.schema');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Protect all admin refer-earn routes
router.use(protect, restrictTo('admin', 'superadmin'));

router.get('/', controller.list);
router.post('/', validate(createReferAndEarnSchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', validate(updateReferAndEarnSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
