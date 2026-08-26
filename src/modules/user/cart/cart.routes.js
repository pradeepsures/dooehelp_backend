const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { validate } = require('../../../core/validate');
const { addToCartSchema, updateCartSchema } = require('./cart.schema');

router.route('/')
  .get(cartController.getCart)
  .post(validate(addToCartSchema), cartController.addToCart)
  .delete(cartController.clearCart);

router.route('/items/:variantId')
  .put(validate(updateCartSchema), cartController.updateCartItem)
  .delete(cartController.removeCartItem);

module.exports = router;
