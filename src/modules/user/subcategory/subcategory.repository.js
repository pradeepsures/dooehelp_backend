const BaseRepository = require('../../../core/BaseRepository');
const Subcategory = require('../../../models/Subcategory.model');

class SubcategoryRepository extends BaseRepository {
  constructor() {
    super(Subcategory, 'subcategory');
  }
}

module.exports = new SubcategoryRepository();
