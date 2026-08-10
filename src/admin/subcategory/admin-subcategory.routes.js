const router = require('express').Router();
const controller = require('./admin-subcategory.controller');
const { validate } = require('../../core/validate');
const { createSubcategorySchema, updateSubcategorySchema, createIncludedServiceSchema, updateIncludedServiceSchema } = require('./admin-subcategory.schema');
const uploadMiddleware = require('../../middlewares/upload.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Protect all admin subcategory routes
router.use(protect, restrictTo('admin', 'superadmin'));

router.get('/', controller.list);
router.post('/', uploadMiddleware.single('image'), validate(createSubcategorySchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', uploadMiddleware.single('image'), validate(updateSubcategorySchema), controller.update);
router.delete('/:id', controller.remove);

// Included Services Routes
router.get('/:subCategoryId/included-services', controller.listIncluded);
router.post('/:subCategoryId/included-services', uploadMiddleware.single('image'), validate(createIncludedServiceSchema), controller.createIncluded);
router.put('/included-services/:id', uploadMiddleware.single('image'), validate(updateIncludedServiceSchema), controller.updateIncluded);
router.delete('/included-services/:id', controller.removeIncluded);

module.exports = router;
