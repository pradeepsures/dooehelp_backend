const BaseRepository = require('../../../core/BaseRepository');
const SaveForLater = require('../../../models/SaveForLater.model');

class SaveForLaterRepository extends BaseRepository {
  constructor() {
    super(SaveForLater, 'save-for-later');
  }

  async findByUserId(userId) {
    return this.findOne({ userId });
  }
}

module.exports = new SaveForLaterRepository();
