const BaseService = require('../../../core/BaseService');
const addressRepository = require('./address.repository');
const AppError = require('../../../core/AppError');

class AddressService extends BaseService {
  constructor() {
    super(addressRepository, 'user-address');
  }

  async createAddress(userId, data) {
    const payload = {
      userId,
      ...data
    };
    return this.create(payload);
  }

  async listAddresses(userId, query = {}) {
    const filter = { userId, isDeleted: false };
    
    if (query.status !== undefined && query.status !== '') {
      filter.status = query.status;
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 50,
      sort: { createdAt: -1 }
    };
    return this.repository.findMany(filter, options);
  }

  async getAddress(addressId, userId) {
    const address = await this.repository.findOne({ _id: addressId, userId, isDeleted: false });
    if (!address) {
      throw new AppError('Address not found', 404, 'NOT_FOUND');
    }
    return address;
  }

  async updateAddress(addressId, userId, data) {
    const address = await this.repository.findOne({ _id: addressId, userId, isDeleted: false });
    if (!address) {
      throw new AppError('Address not found', 404, 'NOT_FOUND');
    }
    return this.repository.updateById(addressId, data);
  }

  async deleteAddress(addressId, userId) {
    const address = await this.repository.findOne({ _id: addressId, userId, isDeleted: false });
    if (!address) {
      throw new AppError('Address not found', 404, 'NOT_FOUND');
    }
    // We soft-delete by marking isDeleted: true and status: inactive
    await this.repository.updateById(addressId, { isDeleted: true, status: 'inactive' });
  }
}

module.exports = new AddressService();
