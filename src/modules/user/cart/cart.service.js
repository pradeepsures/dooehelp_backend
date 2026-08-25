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
        select: 'name price originalPrice image description categoryId hasVariants'
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
      if (item.subcategoryId) {
        validItems.push(item);
        if (item.variantId) {
          serviceTotal += item.variantId.price * item.quantity;
        } else {
          serviceTotal += item.subcategoryId.price * item.quantity;
        }
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

  async addToCart(userId, subcategoryId, variantId, quantity = 1) {
    this.logger.info({ userId, subcategoryId, variantId, quantity }, 'addToCart');

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
      // If no variants, variantId should be forced to null
      variantId = null;
    }

    let cart = await this.repository.findOne({ userId });
    if (!cart) {
      cart = await this.repository.create({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => 
      item.subcategoryId.toString() === subcategoryId && 
      (item.variantId ? item.variantId.toString() : null) === (variantId ? variantId.toString() : null)
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ subcategoryId, variantId: variantId || null, quantity });
    }

    await this.repository.updateById(cart._id, { items: cart.items });
    return this.getCart(userId);
  }

  async updateCartItem(userId, subcategoryId, variantId, quantity) {
    this.logger.info({ userId, subcategoryId, variantId, quantity }, 'updateCartItem');

    const cart = await this.repository.findOne({ userId });
    if (!cart) {
      throw new AppError('Cart not found', 404, 'NOT_FOUND');
    }

    const itemIndex = cart.items.findIndex(item => 
      item.subcategoryId.toString() === subcategoryId && 
      (item.variantId ? item.variantId.toString() : null) === (variantId ? variantId.toString() : null)
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

  async removeCartItem(userId, subcategoryId, variantId) {
    this.logger.info({ userId, subcategoryId, variantId }, 'removeCartItem');

    const cart = await this.repository.findOne({ userId });
    if (!cart) {
      throw new AppError('Cart not found', 404, 'NOT_FOUND');
    }

    const updatedItems = cart.items.filter(item => 
      !(item.subcategoryId.toString() === subcategoryId && 
      (item.variantId ? item.variantId.toString() : null) === (variantId ? variantId.toString() : null))
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
