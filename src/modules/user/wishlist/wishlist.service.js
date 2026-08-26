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
        select: 'name image description categoryId startingPrice'
      })
      .populate({
        path: 'items.variantId',
        model: 'Variant',
        select: 'name price originalPrice image description subCategoryId'
      })
      .lean();

    return populatedWishlist;
  }

  async addToWishlist(userId, variantId) {
    this.logger.info({ userId, variantId }, 'addToWishlist');

    const Variant = require('../../../models/Variant.model');
    const variant = await Variant.findOne({ _id: variantId, isDeleted: false, status: true })
      .populate('subCategoryId');
    
    if (!variant) {
      throw new AppError('Selected variant not found or inactive', 404, 'NOT_FOUND');
    }

    const subcategoryId = variant.subCategoryId._id || variant.subCategoryId;
    const subcategory = await Subcategory.findOne({ _id: subcategoryId, isDeleted: false, status: true });
    if (!subcategory) {
      throw new AppError('Parent service not found or inactive', 404, 'NOT_FOUND');
    }

    let wishlist = await this.repository.findOne({ userId });
    if (!wishlist) {
      wishlist = await this.repository.create({ userId, items: [] });
    } else {
      wishlist.items = wishlist.items.filter(item => item.variantId);
    }

    const itemExists = wishlist.items.some(item => 
      item.variantId && item.variantId.toString() === variantId
    );

    if (!itemExists) {
      wishlist.items.push({ subcategoryId, variantId });
      await this.repository.updateById(wishlist._id, { items: wishlist.items });
    }

    return this.getWishlist(userId);
  }

  async removeFromWishlist(userId, variantId) {
    this.logger.info({ userId, variantId }, 'removeFromWishlist');

    const wishlist = await this.repository.findOne({ userId });
    if (!wishlist) {
      throw new AppError('Wishlist not found', 404, 'NOT_FOUND');
    }

    const updatedItems = wishlist.items.filter(item => 
      item.variantId && item.variantId.toString() !== variantId
    );
    await this.repository.updateById(wishlist._id, { items: updatedItems });

    return this.getWishlist(userId);
  }
}

module.exports = new WishlistService();
