const BaseService = require('../../core/BaseService');
const userRepository = require('../../modules/user/auth/user.repository');
const AppError = require('../../core/AppError');

class AdminUserService extends BaseService {
  constructor() {
    super(userRepository, 'admin-user');
  }

  async listAll(query = {}) {
    const filter = {};

    if (query.isDeleted !== undefined && query.isDeleted !== "") {
      filter.isDeleted = query.isDeleted === "true";
    } else {
      filter.isDeleted = { $ne: true };
    }

    if (query.status !== undefined && query.status !== "") {
      filter.status = query.status === "true";
    }
    
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phoneNumber: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } }
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
    const user = await this.repository.findById(id);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const Booking = require('../../models/Booking.model');
    const bookings = await Booking.find({ userId: id })
      .populate({
        path: 'vendorId',
        model: 'Vendor',
        select: 'name phoneNumber profileImage location tools skills status'
      })
      .populate({
        path: 'items.subcategoryId',
        model: 'Subcategory',
        select: 'name price image originalPrice description'
      })
      .populate({
        path: 'items.variantId',
        model: 'Variant',
        select: 'name price image originalPrice description'
      })
      .populate({
        path: 'items.categoryId',
        model: 'Category',
        select: 'name'
      })
      .populate({
        path: 'address',
        model: 'UserAddress'
      })
      .sort({ createdAt: -1 })
      .lean();

    return {
      ...user,
      bookings
    };
  }
}

module.exports = new AdminUserService();
