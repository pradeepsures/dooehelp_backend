const BaseService = require('../../core/BaseService');
const platformFeeRepository = require('../../modules/user/platform-fee/platform-fee.repository');
const AppError = require('../../core/AppError');

class AdminPlatformFeeService extends BaseService {
  constructor() {
    super(platformFeeRepository, 'admin-platform-fee');
  }

  async listAll(query = {}) {
    const filter = { isDeleted: false };
    
    if (query.status) {
      filter.status = query.status;
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { createdAt: -1 }
    };

    return this.getAll(filter, options);
  }

  async getOne(id) {
    const config = await platformFeeRepository.findById(id);
    if (!config || config.isDeleted) {
      throw new AppError('Platform fee configuration not found', 404, 'NOT_FOUND');
    }
    return config;
  }

  async createPlatformFee(data) {
    const exists = await platformFeeRepository.exists({ isDeleted: false });
    if (exists) {
      throw new AppError(
        'Platform fee configuration already exists. You can only update the existing configuration.',
        400,
        'SINGLETON_VIOLATION'
      );
    }

    return this.create(data);
  }

  async updatePlatformFee(id, data) {
    const config = await platformFeeRepository.findById(id);
    if (!config || config.isDeleted) {
      throw new AppError('Platform fee configuration not found', 404, 'NOT_FOUND');
    }

    return platformFeeRepository.updateById(id, data);
  }

  async softDelete(id) {
    const config = await platformFeeRepository.findById(id);
    if (!config || config.isDeleted) {
      throw new AppError('Platform fee configuration not found', 404, 'NOT_FOUND');
    }

    await platformFeeRepository.updateById(id, { isDeleted: true });
    this.logger.info({ configId: id }, 'Platform fee configuration soft deleted');
  }
}

module.exports = new AdminPlatformFeeService();
