const BaseService = require('../../core/BaseService');
const referAndEarnRepository = require('../../modules/user/refer-earn/refer-earn.repository');
const AppError = require('../../core/AppError');

class AdminReferAndEarnService extends BaseService {
  constructor() {
    super(referAndEarnRepository, 'admin-refer-earn');
  }

  async listAll(query = {}) {
    const filter = { isDeleted: false };

    if (query.status) {
      filter.status = query.status;
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { createdAt: -1 },
    };

    return this.getAll(filter, options);
  }

  async getOne(id) {
    const config = await referAndEarnRepository.findById(id);
    if (!config || config.isDeleted) {
      throw new AppError('Refer and Earn configuration not found', 404, 'NOT_FOUND');
    }
    return config;
  }

  async createReferAndEarn(data) {
    const exists = await referAndEarnRepository.exists({ isDeleted: false });
    if (exists) {
      throw new AppError(
        'Refer and Earn configuration already exists. You can only update the existing configuration.',
        400,
        'SINGLETON_VIOLATION'
      );
    }

    return this.create(data);
  }

  async updateReferAndEarn(id, data) {
    const config = await referAndEarnRepository.findById(id);
    if (!config || config.isDeleted) {
      throw new AppError('Refer and Earn configuration not found', 404, 'NOT_FOUND');
    }

    return referAndEarnRepository.updateById(id, data);
  }

  async softDelete(id) {
    const config = await referAndEarnRepository.findById(id);
    if (!config || config.isDeleted) {
      throw new AppError('Refer and Earn configuration not found', 404, 'NOT_FOUND');
    }

    await referAndEarnRepository.updateById(id, { isDeleted: true });
    this.logger.info({ configId: id }, 'Refer and Earn configuration soft deleted');
  }
}

module.exports = new AdminReferAndEarnService();
