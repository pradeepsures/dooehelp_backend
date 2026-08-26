const BaseService = require('../../../core/BaseService');
const cartRepository = require('./cart.repository');
const Subcategory = require('../../../models/Subcategory.model');
const AppError = require('../../../core/AppError');

class CartService extends BaseService {
  constructor() {
    super(cartRepository, 'cart');
  }

  async getCart(userId) {
    this.logger.info({ userId }, 'getCart');
    let cart = await this.repository.findOne({ userId });
    if (!cart) {
      cart = await this.repository.create({ userId, items: [] });
    }

    const CartModel = this.repository.model;
    const populatedCart = await CartModel.findOne({ userId })
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

    if (!populatedCart) {
      return { userId, items: [], billDetails: { serviceTotal: 0, taxAndFees: 0, deliveryFee: 0, grandTotal: 0 } };
    }

    let serviceTotal = 0;
    const validItems = [];

    for (const item of populatedCart.items) {
      if (item.variantId) {
        validItems.push(item);
        serviceTotal += item.variantId.price * item.quantity;
      }
    }

    const taxAndFees = 0;
    const deliveryFee = 0; // FREE
    const grandTotal = serviceTotal + taxAndFees + deliveryFee;

    return {
      _id: populatedCart._id,
      userId: populatedCart.userId,
      items: validItems,
      billDetails: {
        serviceTotal,
        taxAndFees,
        deliveryFee,
        grandTotal
      }
    };
  }

  async addToCart(userId, variantId, quantity = 1) {
    this.logger.info({ userId, variantId, quantity }, 'addToCart');

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

    let cart = await this.repository.findOne({ userId });
    if (!cart) {
      cart = await this.repository.create({ userId, items: [] });
    } else {
      // Filter out any legacy cart items that do not have a variantId (since they are invalid now)
      cart.items = cart.items.filter(item => item.variantId);
    }

    const itemIndex = cart.items.findIndex(item => 
      item.variantId && item.variantId.toString() === variantId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ subcategoryId, variantId, quantity });
    }

    await this.repository.updateById(cart._id, { items: cart.items });
    return this.getCart(userId);
  }

  async updateCartItem(userId, variantId, quantity) {
    this.logger.info({ userId, variantId, quantity }, 'updateCartItem');

    const cart = await this.repository.findOne({ userId });
    if (!cart) {
      throw new AppError('Cart not found', 404, 'NOT_FOUND');
    }
    // Filter out legacy cart items missing variantId
    cart.items = cart.items.filter(item => item.variantId);

    const itemIndex = cart.items.findIndex(item => 
      item.variantId && item.variantId.toString() === variantId
    );
    if (itemIndex === -1) {
      throw new AppError('Item not found in cart', 404, 'NOT_FOUND');
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
    }

    await this.repository.updateById(cart._id, { items: cart.items });
    return this.getCart(userId);
  }

  async removeCartItem(userId, variantId) {
    this.logger.info({ userId, variantId }, 'removeCartItem');

    const cart = await this.repository.findOne({ userId });
    if (!cart) {
      throw new AppError('Cart not found', 404, 'NOT_FOUND');
    }

    // Filter out legacy cart items missing variantId, and remove the requested item
    const updatedItems = cart.items.filter(item => 
      item.variantId && item.variantId.toString() !== variantId
    );
    await this.repository.updateById(cart._id, { items: updatedItems });

    return this.getCart(userId);
  }

  async clearCart(userId) {
    this.logger.info({ userId }, 'clearCart');

    const cart = await this.repository.findOne({ userId });
    if (!cart) {
      return null;
    }

    await this.repository.updateById(cart._id, { items: [] });
    return this.getCart(userId);
  }
}

module.exports = new CartService();
