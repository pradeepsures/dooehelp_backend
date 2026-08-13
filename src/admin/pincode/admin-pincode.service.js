const BaseService = require('../../core/BaseService');
const pincodeRepository = require('./admin-pincode.repository');
const AppError = require('../../core/AppError');

class AdminPincodeService extends BaseService {
  constructor() {
    super(pincodeRepository, 'admin-pincode');
  }

  async listAll(query = {}) {
    const filter = { isDeleted: false };
    if (query.status !== undefined && query.status !== '') {
      filter.status = query.status;
    }
    if (query.search) {
      filter.pincode = { $regex: query.search, $options: 'i' };
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { createdAt: -1 }
    };

    return this.getAll(filter, options);
  }

  async getOne(id) {
    const pincode = await pincodeRepository.findOne({ _id: id, isDeleted: false });
    if (!pincode) throw new AppError('Pincode not found', 404, 'NOT_FOUND');
    return pincode;
  }

  async createPincode(data) {
    const exists = await pincodeRepository.exists({ pincode: data.pincode, isDeleted: false });
    if (exists) {
      throw new AppError('Pincode already exists', 400, 'DUPLICATE_ERROR');
    }
    return this.create(data);
  }

  async updatePincode(id, data) {
    const pincode = await pincodeRepository.findOne({ _id: id, isDeleted: false });
    if (!pincode) throw new AppError('Pincode not found', 404, 'NOT_FOUND');

    if (data.pincode) {
      const exists = await pincodeRepository.exists({
        pincode: data.pincode,
        _id: { $ne: id },
        isDeleted: false
      });
      if (exists) {
        throw new AppError('Pincode already exists', 400, 'DUPLICATE_ERROR');
      }
    }

    return pincodeRepository.updateById(id, data);
  }

  async softDelete(id) {
    const pincode = await pincodeRepository.findOne({ _id: id, isDeleted: false });
    if (!pincode) throw new AppError('Pincode not found', 404, 'NOT_FOUND');

    await pincodeRepository.updateById(id, { isDeleted: true });
    
    // Soft-delete linked localities in cascade
    const Locality = require('../../models/Locality.model');
    await Locality.updateMany({ pincodeId: id }, { isDeleted: true });
  }
}

module.exports = new AdminPincodeService();
