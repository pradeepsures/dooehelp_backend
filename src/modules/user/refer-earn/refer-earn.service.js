const referAndEarnRepository = require('./refer-earn.repository');

class UserReferAndEarnService {
  async getActiveConfig() {
    return referAndEarnRepository.findOne({ status: 'active', isDeleted: false });
  }
}

module.exports = new UserReferAndEarnService();
