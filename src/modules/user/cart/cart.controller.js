const catchAsync = require('../../../core/catchAsync');
const cartService = require('./cart.service');
const { sendSuccess } = require('../../../core/response');

exports.getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  sendSuccess(res, cart, 'Cart fetched successfully');
});

exports.addToCart = catchAsync(async (req, res) => {
  const { variantId, quantity } = req.body;
  const cart = await cartService.addToCart(req.user._id, variantId, quantity);
  sendSuccess(res, cart, 'Item added to cart successfully');
});

exports.updateCartItem = catchAsync(async (req, res) => {
  const { variantId } = req.params;
  const { quantity } = req.body;
  const cart = await cartService.updateCartItem(req.user._id, variantId, quantity);
  sendSuccess(res, cart, 'Cart item updated successfully');
});

exports.removeCartItem = catchAsync(async (req, res) => {
  const { variantId } = req.params;
  const cart = await cartService.removeCartItem(req.user._id, variantId);
  sendSuccess(res, cart, 'Item removed from cart successfully');
});

exports.clearCart = catchAsync(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);
  sendSuccess(res, cart, 'Cart cleared successfully');
});
