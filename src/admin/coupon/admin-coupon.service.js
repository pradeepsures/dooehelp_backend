const BaseService = require('../../core/BaseService');
const couponRepository = require('../../modules/user/coupon/coupon.repository');
const AppError = require('../../core/AppError');

class AdminCouponService extends BaseService {
  constructor() {
    super(couponRepository, 'admin-coupon');
  }

  async listAll(query = {}) {
    const filter = { isDeleted: false };
    
    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { code: { $regex: query.search, $options: 'i' } },
        { name: { $regex: query.search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { createdAt: -1 }
    };

    return this.getAll(filter, options);
  }

  async getOne(id) {
    const coupon = await couponRepository.findById(id);
    if (!coupon || coupon.isDeleted) {
      throw new AppError('Coupon not found', 404, 'NOT_FOUND');
    }
    return coupon;
  }

  async createCoupon(data) {
    const exists = await couponRepository.exists({ code: data.code.toUpperCase(), isDeleted: false });
    if (exists) {
      throw new AppError('Coupon code already exists', 400, 'DUPLICATE_ERROR');
    }

    return this.create(data);
  }

  async updateCoupon(id, data) {
    const coupon = await couponRepository.findById(id);
    if (!coupon || coupon.isDeleted) {
      throw new AppError('Coupon not found', 404, 'NOT_FOUND');
    }

    if (data.code) {
      const exists = await couponRepository.exists({
        code: data.code.toUpperCase(),
        _id: { $ne: id },
        isDeleted: false
      });
      if (exists) {
        throw new AppError('Coupon code already exists', 400, 'DUPLICATE_ERROR');
      }
    }

    return couponRepository.updateById(id, data);
  }

  async softDelete(id) {
    const coupon = await couponRepository.findById(id);
    if (!coupon || coupon.isDeleted) {
      throw new AppError('Coupon not found', 404, 'NOT_FOUND');
    }

    await couponRepository.updateById(id, { isDeleted: true });
    this.logger.info({ couponId: id }, 'Coupon soft deleted');
  }
}

module.exports = new AdminCouponService();
