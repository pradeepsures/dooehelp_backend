const BaseService = require('../../../core/BaseService');
const subcategoryRepository = require('./subcategory.repository');
const categoryRepository = require('../category/category.repository');
const AppError = require('../../../core/AppError');

class SubcategoryService extends BaseService {
  constructor() {
    super(subcategoryRepository, 'subcategory');
  }

  async getActiveSubcategories(query = {}) {
    this.logger.info('getActiveSubcategories');
    
    // Get all active category ids first to ensure we don't display subcategories of inactive/deleted categories
    const activeCategories = await categoryRepository.findAll({ status: true, isDeleted: false }, { select: '_id' });
    const activeCategoryIds = activeCategories.map(cat => cat._id.toString());

    const filter = {
      status: true,
      isDeleted: false,
    };

    if (query.categoryId) {
      if (!activeCategoryIds.includes(query.categoryId)) {
        // category is inactive or doesn't exist
        return { 
          data: [], 
          pagination: { 
            page: 1, 
            limit: 10, 
            total: 0, 
            totalPages: 0, 
            hasNextPage: false, 
            hasPrevPage: false 
          } 
        };
      }
      filter.categoryId = query.categoryId;
    } else {
      filter.categoryId = { $in: activeCategoryIds };
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      sort: { createdAt: -1 },
      populate: 'categoryId'
    };

    return this.getAll(filter, options);
  }

  async getActiveSubcategoryDetails(id) {
    this.logger.info({ subcategoryId: id }, 'getActiveSubcategoryDetails');
    const subcategory = await subcategoryRepository.findById(id, { populate: 'categoryId' });
    
    if (!subcategory || !subcategory.status || subcategory.isDeleted) {
      throw new AppError('Subcategory not found or inactive', 404, 'NOT_FOUND');
    }

    // Also check if the parent category is active and not deleted
    if (!subcategory.categoryId || !subcategory.categoryId.status || subcategory.categoryId.isDeleted) {
      throw new AppError('Subcategory not found or inactive', 404, 'NOT_FOUND');
    }
    
    return subcategory;
  }
}

module.exports = new SubcategoryService();
