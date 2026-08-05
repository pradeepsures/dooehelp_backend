const BaseService = require('../../core/BaseService');
const userRepository = require('./user.repository');

class UserService extends BaseService {
  constructor() {
    super(userRepository, 'user');
  }

  // User specific business logic will go here
}

module.exports = new UserService();
