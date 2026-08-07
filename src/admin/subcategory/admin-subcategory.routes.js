const router = require('express').Router();
const controller = require('./admin-subcategory.controller');
const { validate } = require('../../core/validate');
const { createSubcategorySchema, updateSubcategorySchema } = require('./admin-subcategory.schema');
const uploadMiddleware = require('../../middlewares/upload.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Protect all admin subcategory routes
router.use(protect, restrictTo('admin', 'superadmin'));

router.get('/', controller.list);
router.post('/', uploadMiddleware.single('image'), validate(createSubcategorySchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', uploadMiddleware.single('image'), validate(updateSubcategorySchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
