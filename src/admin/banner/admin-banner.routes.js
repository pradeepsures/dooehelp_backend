const router = require('express').Router();
const controller = require('./admin-banner.controller');
const { validate } = require('../../core/validate');
const { createBannerSchema, updateBannerSchema } = require('./admin-banner.schema');
const uploadMiddleware = require('../../middlewares/upload.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Protect all admin banner routes
router.use(protect, restrictTo('admin', 'superadmin'));

router.get('/', controller.list);
router.post('/', uploadMiddleware.array('images', 10), validate(createBannerSchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', uploadMiddleware.array('images', 10), validate(updateBannerSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
