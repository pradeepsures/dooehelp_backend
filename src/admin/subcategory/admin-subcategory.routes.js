const router = require('express').Router();
const controller = require('./admin-subcategory.controller');
const { validate } = require('../../core/validate');
const { 
  createSubcategorySchema, 
  updateSubcategorySchema, 
  createIncludedServiceSchema, 
  updateIncludedServiceSchema,
  createVariantSchema,
  updateVariantSchema
} = require('./admin-subcategory.schema');
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
router.get('/variants/:variantId/included-services', controller.listIncluded);
router.post('/variants/:variantId/included-services', uploadMiddleware.single('image'), validate(createIncludedServiceSchema), controller.createIncluded);
router.put('/included-services/:id', uploadMiddleware.single('image'), validate(updateIncludedServiceSchema), controller.updateIncluded);
router.delete('/included-services/:id', controller.removeIncluded);

// Variants Routes
router.get('/:subCategoryId/variants', controller.listVariants);
router.post('/:subCategoryId/variants', uploadMiddleware.single('image'), validate(createVariantSchema), controller.createVariant);
router.get('/variants/:id', controller.getOneVariant);
router.put('/variants/:id', uploadMiddleware.single('image'), validate(updateVariantSchema), controller.updateVariant);
router.delete('/variants/:id', controller.removeVariant);

module.exports = router;
