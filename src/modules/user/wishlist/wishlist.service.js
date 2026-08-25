const BaseService = require('../../../core/BaseService');
const wishlistRepository = require('./wishlist.repository');
const Subcategory = require('../../../models/Subcategory.model');
const AppError = require('../../../core/AppError');

class WishlistService extends BaseService {
  constructor() {
    super(wishlistRepository, 'wishlist');
  }

  async getWishlist(userId) {
    this.logger.info({ userId }, 'getWishlist');
    let wishlist = await this.repository.findOne({ userId });
    if (!wishlist) {
      wishlist = await this.repository.create({ userId, items: [] });
    }

    const WishlistModel = this.repository.model;
    const populatedWishlist = await WishlistModel.findOne({ userId })
      .populate({
        path: 'items.subcategoryId',
        model: 'Subcategory',
        select: 'name price originalPrice image description categoryId hasVariants'
      })
      .populate({
        path: 'items.variantId',
        model: 'Variant',
        select: 'name price originalPrice image description subCategoryId'
      })
      .lean();

    return populatedWishlist;
  }

  async addToWishlist(userId, subcategoryId, variantId) {
    this.logger.info({ userId, subcategoryId, variantId }, 'addToWishlist');

    const subcategory = await Subcategory.findOne({ _id: subcategoryId, isDeleted: false, status: true });
    if (!subcategory) {
      throw new AppError('Service not found or inactive', 404, 'NOT_FOUND');
    }

    // Validate variant if subcategory has variants
    if (subcategory.hasVariants) {
      if (!variantId) {
        throw new AppError('This service requires a variant selection', 400, 'BAD_REQUEST');
      }
      const Variant = require('../../../models/Variant.model');
      const variant = await Variant.findOne({ _id: variantId, subCategoryId: subcategoryId, isDeleted: false, status: true });
      if (!variant) {
        throw new AppError('Selected variant not found or inactive', 404, 'NOT_FOUND');
      }
    } else {
      variantId = null;
    }

    let wishlist = await this.repository.findOne({ userId });
    if (!wishlist) {
      wishlist = await this.repository.create({ userId, items: [] });
    }

    const itemExists = wishlist.items.some(item => 
      item.subcategoryId.toString() === subcategoryId && 
      (item.variantId ? item.variantId.toString() : null) === (variantId ? variantId.toString() : null)
    );

    if (!itemExists) {
      wishlist.items.push({ subcategoryId, variantId: variantId || null });
      await this.repository.updateById(wishlist._id, { items: wishlist.items });
    }

    return this.getWishlist(userId);
  }

  async removeFromWishlist(userId, subcategoryId, variantId) {
    this.logger.info({ userId, subcategoryId, variantId }, 'removeFromWishlist');

    const wishlist = await this.repository.findOne({ userId });
    if (!wishlist) {
      throw new AppError('Wishlist not found', 404, 'NOT_FOUND');
    }

    const updatedItems = wishlist.items.filter(item => 
      !(item.subcategoryId.toString() === subcategoryId && 
      (item.variantId ? item.variantId.toString() : null) === (variantId ? variantId.toString() : null))
    );
    await this.repository.updateById(wishlist._id, { items: updatedItems });

    return this.getWishlist(userId);
  }
}

module.exports = new WishlistService();
