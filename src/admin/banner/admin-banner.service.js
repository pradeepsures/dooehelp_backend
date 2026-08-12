const BaseService = require('../../core/BaseService');
const bannerRepository = require('../../modules/user/banner/banner.repository');
const AppError = require('../../core/AppError');

class AdminBannerService extends BaseService {
  constructor() {
    super(bannerRepository, 'admin-banner');
  }

  async listAll(query = {}) {
    const filter = { isDeleted: false };
    if (query.status !== undefined) filter.status = query.status;
    if (query.isDeleted !== undefined) filter.isDeleted = query.isDeleted;
    
    if (query.search) {
      filter.title = { $regex: query.search, $options: 'i' };
    }

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

  async createBanner(data, files) {
    if (!files || files.length === 0) {
      throw new AppError('At least one banner image is required', 400, 'VALIDATION_ERROR');
    }

    const payload = { ...data };
    payload.images = files.map(file => `/${file.destination}/${file.filename}`.replace(/\\/g, '/'));
    
    return this.create(payload);
  }

  async updateBanner(id, data, files) {
    const banner = await bannerRepository.findById(id);
    if (!banner) throw new AppError('Banner not found', 404, 'NOT_FOUND');

    const payload = { ...data };
    if (files && files.length > 0) {
      payload.images = files.map(file => `/${file.destination}/${file.filename}`.replace(/\\/g, '/'));
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
