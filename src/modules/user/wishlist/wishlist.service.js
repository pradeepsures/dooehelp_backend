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
        path: 'items',
        model: 'Subcategory',
        select: 'name price originalPrice image description'
      })
      .lean();

    return populatedWishlist;
  }

  async addToWishlist(userId, subcategoryId) {
    this.logger.info({ userId, subcategoryId }, 'addToWishlist');

    const subcategory = await Subcategory.findOne({ _id: subcategoryId, isDeleted: false, status: true });
    if (!subcategory) {
      throw new AppError('Service not found or inactive', 404, 'NOT_FOUND');
    }

    let wishlist = await this.repository.findOne({ userId });
    if (!wishlist) {
      wishlist = await this.repository.create({ userId, items: [] });
    }

    const itemExists = wishlist.items.some(id => id.toString() === subcategoryId);
    if (!itemExists) {
      wishlist.items.push(subcategoryId);
      await this.repository.updateById(wishlist._id, { items: wishlist.items });
    }

    return this.getWishlist(userId);
  }

  async removeFromWishlist(userId, subcategoryId) {
    this.logger.info({ userId, subcategoryId }, 'removeFromWishlist');

    const wishlist = await this.repository.findOne({ userId });
    if (!wishlist) {
      throw new AppError('Wishlist not found', 404, 'NOT_FOUND');
    }

    const updatedItems = wishlist.items.filter(id => id.toString() !== subcategoryId);
    await this.repository.updateById(wishlist._id, { items: updatedItems });

    return this.getWishlist(userId);
  }
}

module.exports = new WishlistService();
