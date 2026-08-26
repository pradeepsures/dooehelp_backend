const catchAsync = require('../../../core/catchAsync');
const wishlistService = require('./wishlist.service');
const { sendSuccess } = require('../../../core/response');

exports.getWishlist = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user._id);
  sendSuccess(res, wishlist, 'Wishlist fetched successfully');
});

exports.addToWishlist = catchAsync(async (req, res) => {
  const { variantId } = req.body;
  const wishlist = await wishlistService.addToWishlist(req.user._id, variantId);
  sendSuccess(res, wishlist, 'Item added to wishlist successfully');
});

exports.removeFromWishlist = catchAsync(async (req, res) => {
  const { variantId } = req.params;
  const wishlist = await wishlistService.removeFromWishlist(req.user._id, variantId);
  sendSuccess(res, wishlist, 'Item removed from wishlist successfully');
});
