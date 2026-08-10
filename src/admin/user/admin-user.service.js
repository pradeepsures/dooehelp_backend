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
    return user;
  }
}

module.exports = new AdminUserService();
