const BaseService = require('../../core/BaseService');
const bannerRepository = require('../../modules/user/banner/banner.repository');

class AdminBannerService extends BaseService {
  constructor() {
    super(bannerRepository, 'admin-banner');
  }

  // Any admin-specific banner logic goes here
}

module.exports = new AdminBannerService();
