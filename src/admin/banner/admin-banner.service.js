const BaseService = require('../../core/BaseService');
const bannerRepository = require('../../modules/user/banner/banner.repository');
const AppError = require('../../core/AppError');

class AdminBannerService extends BaseService {
  constructor() {
    super(bannerRepository, 'admin-banner');
  }

  async listAll(query = {}) {
    const filter = {};
    if (query.status !== undefined) filter.status = query.status;
    if (query.isDeleted !== undefined) filter.isDeleted = query.isDeleted;

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { createdAt: -1 }
    };

    return this.getAll(filter, options);
  }

  async getOne(id) {
    const banner = await bannerRepository.findById(id);
    if (!banner) throw new AppError('Banner not found', 404, 'NOT_FOUND');
    return banner;
  }

  async createBanner(data, file) {
    if (!file) {
      throw new AppError('Banner image is required', 400, 'VALIDATION_ERROR');
    }

    const payload = { ...data };
    payload.image = `/${file.destination}/${file.filename}`.replace(/\\/g, '/');
    
    return this.create(payload);
  }

  async updateBanner(id, data, file) {
    const banner = await bannerRepository.findById(id);
    if (!banner) throw new AppError('Banner not found', 404, 'NOT_FOUND');

    const payload = { ...data };
    if (file) {
      payload.image = `/${file.destination}/${file.filename}`.replace(/\\/g, '/');
    }

    return bannerRepository.updateById(id, payload);
  }

  async softDelete(id) {
    const banner = await bannerRepository.findById(id);
    if (!banner) throw new AppError('Banner not found', 404, 'NOT_FOUND');
    
    await bannerRepository.updateById(id, { isDeleted: true });
    this.logger.info({ bannerId: id }, 'Banner soft deleted');
  }
}

module.exports = new AdminBannerService();
