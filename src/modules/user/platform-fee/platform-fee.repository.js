const BaseRepository = require('../../../core/BaseRepository');
const PlatformFee = require('../../../models/PlatformFee.model');

class PlatformFeeRepository extends BaseRepository {
  constructor() {
    super(PlatformFee, 'platform-fee');
  }
}

module.exports = new PlatformFeeRepository();
