const BaseService = require('../../../core/BaseService');
const bannerRepository = require('./banner.repository');
const AppError = require('../../../core/AppError');

class BannerService extends BaseService {
  constructor() {
    super(bannerRepository, 'banner');
  }

  async getActiveBanners(query = {}) {
    this.logger.info('getActiveBanners');
    
    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { createdAt: -1 }
    };

    // For users, return all non-deleted, active banners
    return this.getAll({ status: true, isDeleted: false }, options);
  }

  async getActiveBannerDetails(id) {
    this.logger.info({ bannerId: id }, 'getActiveBannerDetails');
    const banner = await this.getById(id);
    
    if (!banner.status || banner.isDeleted) {
      throw new AppError('Banner not found or inactive', 404, 'NOT_FOUND');
    }
    
    return banner;
  }
}

module.exports = new BannerService();
