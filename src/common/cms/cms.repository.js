const BaseRepository = require('../../core/BaseRepository');
const Cms = require('../../models/Cms.model');

class CmsRepository extends BaseRepository {
  constructor() {
    super(Cms);
  }

  async findByTypeAndPage(type, page) {
    return await this.model.findOne({ type, page }).lean();
  }

  async upsert(type, page, content) {
    return await this.model.findOneAndUpdate(
      { type, page },
      { content },
      { new: true, upsert: true }
    );
  }
}

module.exports = new CmsRepository();
