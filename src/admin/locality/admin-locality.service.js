const BaseService = require('../../core/BaseService');
const localityRepository = require('./admin-locality.repository');
const AppError = require('../../core/AppError');

class AdminLocalityService extends BaseService {
  constructor() {
    super(localityRepository, 'admin-locality');
  }

  async listAll(query = {}) {
    const filter = { isDeleted: false };
    
    if (query.status !== undefined && query.status !== '') {
      filter.status = query.status;
    }
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { createdAt: -1 }
    };

    return this.getAll(filter, options);
  }

  async getOne(id) {
    const locality = await localityRepository.findOne({ _id: id, isDeleted: false });
    if (!locality) throw new AppError('Locality not found', 404, 'NOT_FOUND');
    return locality;
  }

  async createLocality(data) {
    const exists = await localityRepository.exists({
      name: data.name,
      isDeleted: false
    });
    if (exists) {
      throw new AppError('Locality name already exists', 400, 'DUPLICATE_ERROR');
    }

    return this.create(data);
  }

  async updateLocality(id, data) {
    const locality = await localityRepository.findOne({ _id: id, isDeleted: false });
    if (!locality) throw new AppError('Locality not found', 404, 'NOT_FOUND');

    if (data.name) {
      const exists = await localityRepository.exists({
        name: data.name,
        _id: { $ne: id },
        isDeleted: false
      });
      if (exists) {
        throw new AppError('Locality name already exists', 400, 'DUPLICATE_ERROR');
      }
    }

    return localityRepository.updateById(id, data);
  }

  async softDelete(id) {
    const locality = await localityRepository.findOne({ _id: id, isDeleted: false });
    if (!locality) throw new AppError('Locality not found', 404, 'NOT_FOUND');

    await localityRepository.updateById(id, { isDeleted: true });
  }
}

module.exports = new AdminLocalityService();
