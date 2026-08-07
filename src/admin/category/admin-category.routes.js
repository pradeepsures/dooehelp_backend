const router = require('express').Router();
const controller = require('./admin-category.controller');
const { validate } = require('../../core/validate');
const { createCategorySchema, updateCategorySchema } = require('./admin-category.schema');
const uploadMiddleware = require('../../middlewares/upload.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Protect all admin category routes
router.use(protect, restrictTo('admin', 'superadmin'));

router.get('/', controller.list);
router.post('/', uploadMiddleware.single('image'), validate(createCategorySchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', uploadMiddleware.single('image'), validate(updateCategorySchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
