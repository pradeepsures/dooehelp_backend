const BaseRepository = require('../../../core/BaseRepository');
const Vendor = require('../../../models/Vendor.model');

class VendorRepository extends BaseRepository {
  constructor() {
    super(Vendor, 'vendor');
  }

  async findByPhone(phoneNumber) {
    if (!phoneNumber) return null;
    const raw = String(phoneNumber).trim();
    const withoutPrefix = raw.replace(/^\+91/, '').trim();
    const withPrefix = raw.startsWith('+91') ? raw : `+91${raw}`;

    const vendors = await this.model.find({
      phoneNumber: { $in: [raw, withPrefix, withoutPrefix] },
      isDeleted: false
    }).sort({ isProfileApproved: -1, isVerified: -1, createdAt: 1 });

    return vendors[0] || null;
  }
}

module.exports = new VendorRepository();
