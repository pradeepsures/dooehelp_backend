const BaseRepository = require('../../../core/BaseRepository');
const User = require('../../../models/User.model');

class UserRepository extends BaseRepository {
  constructor() {
    super(User, 'user');
  }

  async findByPhone(phoneNumber) {
    return this.findOne({ phoneNumber });
  }
}

module.exports = new UserRepository();
