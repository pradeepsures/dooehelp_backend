const catchAsync = require('../../../core/catchAsync');
const cartService = require('./cart.service');
const { sendSuccess } = require('../../../core/response');

exports.getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  sendSuccess(res, cart, 'Cart fetched successfully');
});

exports.addToCart = catchAsync(async (req, res) => {
  const { subcategoryId, variantId, quantity } = req.body;
  const cart = await cartService.addToCart(req.user._id, subcategoryId, variantId, quantity);
  sendSuccess(res, cart, 'Item added to cart successfully');
});

exports.updateCartItem = catchAsync(async (req, res) => {
  const { subcategoryId } = req.params;
  const { quantity, variantId } = req.body;
  const cart = await cartService.updateCartItem(req.user._id, subcategoryId, variantId, quantity);
  sendSuccess(res, cart, 'Cart item updated successfully');
});

exports.removeCartItem = catchAsync(async (req, res) => {
  const { subcategoryId } = req.params;
  const variantId = req.query.variantId || req.body.variantId;
  const cart = await cartService.removeCartItem(req.user._id, subcategoryId, variantId);
  sendSuccess(res, cart, 'Item removed from cart successfully');
});

exports.clearCart = catchAsync(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);
  sendSuccess(res, cart, 'Cart cleared successfully');
});
