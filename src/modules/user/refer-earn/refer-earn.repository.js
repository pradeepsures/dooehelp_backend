const BaseRepository = require('../../../core/BaseRepository');
const ReferAndEarn = require('../../../models/ReferAndEarn.model');

class ReferAndEarnRepository extends BaseRepository {
  constructor() {
    super(ReferAndEarn, 'refer-and-earn');
  }
}

module.exports = new ReferAndEarnRepository();
