const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlist.controller');
const { validate } = require('../../../core/validate');
const { addToWishlistSchema } = require('./wishlist.schema');

router.route('/')
  .get(wishlistController.getWishlist)
  .post(validate(addToWishlistSchema), wishlistController.addToWishlist);

router.route('/items/:variantId')
  .delete(wishlistController.removeFromWishlist);

module.exports = router;
