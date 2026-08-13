const BaseRepository = require('../../core/BaseRepository');
const Pincode = require('../../models/Pincode.model');

class AdminPincodeRepository extends BaseRepository {
  constructor() {
    super(Pincode, 'admin-pincode');
  }
}

module.exports = new AdminPincodeRepository();
