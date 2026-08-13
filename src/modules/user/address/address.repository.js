const BaseRepository = require('../../../core/BaseRepository');
const UserAddress = require('../../../models/UserAddress.model');

class AddressRepository extends BaseRepository {
  constructor() {
    super(UserAddress, 'user-address');
  }
}

module.exports = new AddressRepository();
