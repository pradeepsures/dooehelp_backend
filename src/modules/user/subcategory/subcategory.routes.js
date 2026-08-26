const router = require('express').Router();
const controller = require('./subcategory.controller');

router.get('/', controller.list);
router.get('/category/:categoryId', controller.getByCategory);
router.get('/variants/:id', controller.getVariantDetails);
router.get('/:subCategoryId/variants', controller.getVariantsBySubcategory);
router.get('/:id', controller.getOne);

module.exports = router;
