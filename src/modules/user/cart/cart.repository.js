const BaseRepository = require('../../../core/BaseRepository');
const Cart = require('../../../models/Cart.model');

class CartRepository extends BaseRepository {
  constructor() {
    super(Cart, 'cart');
  }

  async findByUserId(userId) {
    return this.findOne({ userId });
  }
}

module.exports = new CartRepository();
