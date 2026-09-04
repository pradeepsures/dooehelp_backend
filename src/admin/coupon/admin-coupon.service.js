const BaseService = require('../../core/BaseService');
const couponRepository = require('../../modules/user/coupon/coupon.repository');
const AppError = require('../../core/AppError');
const Coupon = require('../../models/Coupon.model');
const User = require('../../models/User.model');

class AdminCouponService extends BaseService {
  constructor() {
    super(couponRepository, 'admin-coupon');
  }

  async listAll(query = {}) {
    const filter = { isDeleted: false };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.isForAllUsers !== undefined) {
      filter.isForAllUsers = query.isForAllUsers === 'true' || query.isForAllUsers === true;
    }

    if (query.search) {
      filter.$or = [
        { code: { $regex: query.search, $options: 'i' } },
        { name: { $regex: query.search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(query.page, 10) || 1,
      limit: parseInt(query.limit, 10) || 10,
      sort: { createdAt: -1 }
    };

    const result = await this.getAll(filter, options);
    const dataWithCount = result.data.map((c) => {
      const doc = c.toObject ? c.toObject() : { ...c };
      doc.assignedUsersCount = Array.isArray(doc.assignedUsers) ? doc.assignedUsers.length : 0;
      return doc;
    });

    return { data: dataWithCount, pagination: result.pagination };
  }

  async getOne(id) {
    const coupon = await Coupon.findOne({ _id: id, isDeleted: false })
      .populate({
        path: 'assignedUsers',
        select: 'name phoneNumber email profileImage status walletBalance createdAt'
      })
      .lean();

    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'NOT_FOUND');
    }

    coupon.assignedUsersCount = Array.isArray(coupon.assignedUsers) ? coupon.assignedUsers.length : 0;
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

  /**
   * Assign coupon to individual or multiple users
   */
  async assignToUsers(couponId, { userIds = [], userId = null, mode = 'add', sendNotification = true }) {
    const notificationService = require('../../services/notification.service');

    const coupon = await Coupon.findOne({ _id: couponId, isDeleted: false });
    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'NOT_FOUND');
    }

    // Normalize IDs to an array
    let targetIds = Array.isArray(userIds) ? [...userIds] : [];
    if (userId && !targetIds.includes(userId)) {
      targetIds.push(userId);
    }

    if (!targetIds.length) {
      throw new AppError('Please provide at least one user ID to assign', 400, 'VALIDATION_ERROR');
    }

    // Verify users exist and are active/not deleted
    const validUsers = await User.find({
      _id: { $in: targetIds },
      isDeleted: { $ne: true }
    }).select('_id name phoneNumber');

    if (!validUsers.length) {
      throw new AppError('No valid users found for the provided IDs', 400, 'USER_NOT_FOUND');
    }

    const validUserIds = validUsers.map((u) => u._id.toString());

    let updatedAssigned = [];
    if (mode === 'replace') {
      updatedAssigned = validUserIds;
    } else {
      // mode === 'add': preserve existing and add new unique ones
      const existing = (coupon.assignedUsers || []).map((id) => id.toString());
      const set = new Set([...existing, ...validUserIds]);
      updatedAssigned = Array.from(set);
    }

    coupon.assignedUsers = updatedAssigned;
    coupon.isForAllUsers = false;
    await coupon.save();

    // Optionally dispatch push notification
    if (sendNotification) {
      const discountText =
        coupon.discountType === 'percentage'
          ? `${coupon.discountValue}% OFF`
          : `₹${coupon.discountValue} OFF`;

      for (const u of validUsers) {
        notificationService
          .sendToUser(u._id, {
            title: 'Special Coupon Just For You! 🎉',
            body: `Use code ${coupon.code} to get ${discountText} on your next service!`,
            data: {
              type: 'coupon_assigned',
              couponId: coupon._id.toString(),
              couponCode: coupon.code
            }
          })
          .catch((err) => {
            this.logger.warn({ userId: u._id, err: err.message }, 'Failed to send coupon notification');
          });
      }
    }

    this.logger.info(
      { couponId, assignedCount: updatedAssigned.length, newlyAssignedCount: validUsers.length },
      'Coupon assigned to users successfully'
    );

    const updated = await Coupon.findById(couponId)
      .populate({
        path: 'assignedUsers',
        select: 'name phoneNumber email profileImage status walletBalance createdAt'
      })
      .lean();

    if (updated) {
      updated.assignedUsersCount = Array.isArray(updated.assignedUsers) ? updated.assignedUsers.length : 0;
    }

    return {
      coupon: updated,
      assignedCount: updatedAssigned.length,
      newlyAssignedCount: validUsers.length
    };
  }

  /**
   * Unassign coupon from users
   */
  async unassignFromUsers(couponId, { userIds = [], userId = null }) {
    const coupon = await Coupon.findOne({ _id: couponId, isDeleted: false });
    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'NOT_FOUND');
    }

    let removeIds = Array.isArray(userIds) ? [...userIds] : [];
    if (userId && !removeIds.includes(userId)) {
      removeIds.push(userId);
    }

    const removeSet = new Set(removeIds.map((id) => id.toString()));
    const existing = (coupon.assignedUsers || []).map((id) => id.toString());
    const remaining = existing.filter((id) => !removeSet.has(id));

    coupon.assignedUsers = remaining;
    await coupon.save();

    return {
      message: 'Users unassigned successfully',
      assignedCount: remaining.length,
      removedCount: existing.length - remaining.length
    };
  }

  /**
   * Get assigned users with pagination and search
   */
  async getAssignedUsers(couponId, query = {}) {
    const coupon = await Coupon.findOne({ _id: couponId, isDeleted: false });
    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'NOT_FOUND');
    }

    const assignedIds = coupon.assignedUsers || [];
    if (!assignedIds.length) {
      return {
        users: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      _id: { $in: assignedIds },
      isDeleted: { $ne: true }
    };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phoneNumber: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } }
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('name phoneNumber email profileImage status walletBalance createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new AdminCouponService();
