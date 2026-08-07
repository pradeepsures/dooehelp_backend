const BaseService = require('../../../core/BaseService');
const categoryRepository = require('./category.repository');
const AppError = require('../../../core/AppError');

class CategoryService extends BaseService {
  constructor() {
    super(categoryRepository, 'category');
  }

  async getActiveCategories(query = {}) {
    this.logger.info('getActiveCategories');
    
    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      sort: { name: 1 }
    };

    return this.getAll({ status: true, isDeleted: false }, options);
  }

  async getActiveCategoryDetails(id) {
    this.logger.info({ categoryId: id }, 'getActiveCategoryDetails');
    const category = await this.getById(id);
    
    if (!category.status || category.isDeleted) {
      throw new AppError('Category not found or inactive', 404, 'NOT_FOUND');
    }
    
    return category;
  }
}

module.exports = new CategoryService();
