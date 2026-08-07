const BaseRepository = require('../../../core/BaseRepository');
const Category = require('../../../models/Category.model');

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category, 'category');
  }
}

module.exports = new CategoryRepository();
