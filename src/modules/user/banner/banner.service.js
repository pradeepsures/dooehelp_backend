const BaseService = require('../../../core/BaseService');
const bannerRepository = require('./banner.repository');

class BannerService extends BaseService {
  constructor() {
    super(bannerRepository, 'banner');
  }

  async getActiveBanners(options = {}) {
    this.logger.info('getActiveBanners');
    // For users, return all non-deleted, active banners
    return this.repository.findMany({ status: true, isDeleted: false }, options);
  }
}

module.exports = new BannerService();
