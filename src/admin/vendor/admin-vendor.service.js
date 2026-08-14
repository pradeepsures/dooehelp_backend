const BaseService = require('../../core/BaseService');
const vendorRepository = require('../../modules/vendor/auth/vendor.repository');
const AppError = require('../../core/AppError');

class AdminVendorService extends BaseService {
  constructor() {
    super(vendorRepository, 'admin-vendor');
  }

  async listAll(query = {}) {
    const filter = { isDeleted: false };
    if (query.status !== undefined && query.status !== '') filter.status = query.status;
    if (query.isVerified !== undefined && query.isVerified !== '') filter.isVerified = query.isVerified === 'true';

    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { createdAt: -1 },
      populate: ['categories', 'localities']
    };

    return this.getAll(filter, options);
  }

  async getOne(id) {
    const vendor = await this.repository.findOne({ _id: id, isDeleted: false }, { populate: ['categories', 'localities'] });
    if (!vendor) throw new AppError('Vendor not found', 404, 'NOT_FOUND');
    return vendor;
  }

  async approveVendor(id) {
    const vendor = await this.repository.findOne({ _id: id, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', 404, 'NOT_FOUND');

    return this.repository.updateById(id, {
      isVerified: true,
      status: 'active',
      isProfileApproved: true
    });
  }

  async rejectVendor(id) {
    const vendor = await this.repository.findOne({ _id: id, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', 404, 'NOT_FOUND');

    return this.repository.updateById(id, {
      isVerified: false,
      status: 'inactive',
      isProfileApproved: false
    });
  }
}

module.exports = new AdminVendorService();
