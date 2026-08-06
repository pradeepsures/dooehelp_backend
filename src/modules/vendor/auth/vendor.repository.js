const BaseRepository = require('../../../core/BaseRepository');
const Vendor = require('../../../models/Vendor.model');

class VendorRepository extends BaseRepository {
  constructor() {
    super(Vendor, 'vendor');
  }

  async findByPhone(phoneNumber) {
    return this.findOne({ phoneNumber });
  }
}

module.exports = new VendorRepository();
