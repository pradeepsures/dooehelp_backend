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
        select: 'name price originalPrice image description categoryId'
      })
      .lean();

    if (!populatedCart) {
      return { userId, items: [], billDetails: { serviceTotal: 0, taxAndFees: 0, deliveryFee: 0, grandTotal: 0 } };
    }

    let serviceTotal = 0;
    const validItems = [];

    for (const item of populatedCart.items) {
      if (item.subcategoryId) {
        validItems.push(item);
        serviceTotal += item.subcategoryId.price * item.quantity;
      }
    }

    const taxAndFees = Math.round(serviceTotal * 0.05);
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

  async addToCart(userId, subcategoryId, quantity = 1) {
    this.logger.info({ userId, subcategoryId, quantity }, 'addToCart');

    const subcategory = await Subcategory.findOne({ _id: subcategoryId, isDeleted: false, status: true });
    if (!subcategory) {
      throw new AppError('Service not found or inactive', 404, 'NOT_FOUND');
    }

    let cart = await this.repository.findOne({ userId });
    if (!cart) {
      cart = await this.repository.create({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.subcategoryId.toString() === subcategoryId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ subcategoryId, quantity });
    }

    await this.repository.updateById(cart._id, { items: cart.items });
    return this.getCart(userId);
  }

  async updateCartItem(userId, subcategoryId, quantity) {
    this.logger.info({ userId, subcategoryId, quantity }, 'updateCartItem');

    const cart = await this.repository.findOne({ userId });
    if (!cart) {
      throw new AppError('Cart not found', 404, 'NOT_FOUND');
    }

    const itemIndex = cart.items.findIndex(item => item.subcategoryId.toString() === subcategoryId);
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

  async removeCartItem(userId, subcategoryId) {
    this.logger.info({ userId, subcategoryId }, 'removeCartItem');

    const cart = await this.repository.findOne({ userId });
    if (!cart) {
      throw new AppError('Cart not found', 404, 'NOT_FOUND');
    }

    const updatedItems = cart.items.filter(item => item.subcategoryId.toString() !== subcategoryId);
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
