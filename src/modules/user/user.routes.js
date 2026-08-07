const express = require('express');
const router = express.Router();

// Add user specific routes here in the future
router.use('/auth', require('./auth/auth.routes'));
router.use('/banner', require('./banner/banner.routes'));
router.use('/category', require('./category/category.routes'));
router.use('/subcategory', require('./subcategory/subcategory.routes'));

module.exports = router;
