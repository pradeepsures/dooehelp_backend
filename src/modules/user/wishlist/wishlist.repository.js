const BaseRepository = require('../../../core/BaseRepository');
const Wishlist = require('../../../models/Wishlist.model');

class WishlistRepository extends BaseRepository {
  constructor() {
    super(Wishlist, 'wishlist');
  }

  async findByUserId(userId) {
    return this.findOne({ userId });
  }
}

module.exports = new WishlistRepository();
