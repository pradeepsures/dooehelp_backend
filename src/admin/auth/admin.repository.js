const BaseRepository = require('../../core/BaseRepository');
const Admin = require('../../models/Admin.model');

class AdminRepository extends BaseRepository {
  constructor() {
    super(Admin, 'admin');
  }

  async findByEmail(email) {
    return this.findOne({ email });
  }
}

module.exports = new AdminRepository();
