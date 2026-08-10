const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Public auth routes
router.use('/auth', require('./auth/auth.routes'));

// Protected user routes
router.use(protect, restrictTo('user'));

router.use('/banner', require('./banner/banner.routes'));
router.use('/category', require('./category/category.routes'));
router.use('/subcategory', require('./subcategory/subcategory.routes'));
router.use('/comment', require('./comment/comment.routes'));

module.exports = router;
