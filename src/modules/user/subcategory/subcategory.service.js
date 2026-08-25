const BaseService = require('../../../core/BaseService');
const subcategoryRepository = require('./subcategory.repository');
const categoryRepository = require('../category/category.repository');
const includedServiceRepository = require('./included-service.repository');
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
      const mongoose = require('mongoose');
      const isValidObjectId = mongoose.Types.ObjectId.isValid(query.categoryId);
      if (!isValidObjectId || !activeCategoryIds.includes(query.categoryId.toString())) {
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

    if (query.price !== undefined) {
      const priceVal = Number(query.price);
      if (!isNaN(priceVal)) {
        filter.price = priceVal;
      }
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = filter.price || {};
      if (query.minPrice !== undefined) {
        const minVal = Number(query.minPrice);
        if (!isNaN(minVal)) {
          filter.price.$gte = minVal;
        }
      }
      if (query.maxPrice !== undefined) {
        const maxVal = Number(query.maxPrice);
        if (!isNaN(maxVal)) {
          filter.price.$lte = maxVal;
        }
      }
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      sort: { createdAt: -1 },
      populate: [
        { path: 'categoryId' },
        { path: 'variants', match: { isDeleted: false, status: true } }
      ]
    };

    return this.getAll(filter, options);
  }

  async getActiveSubcategoryDetails(id) {
    this.logger.info({ subcategoryId: id }, 'getActiveSubcategoryDetails');
    const subcategory = await subcategoryRepository.findById(id, {
      populate: [
        { path: 'categoryId' },
        { path: 'variants', match: { isDeleted: false, status: true } }
      ]
    });
    
    if (!subcategory || !subcategory.status || subcategory.isDeleted) {
      throw new AppError('Subcategory not found or inactive', 404, 'NOT_FOUND');
    }

    // Also check if the parent category is active and not deleted
    if (!subcategory.categoryId || !subcategory.categoryId.status || subcategory.categoryId.isDeleted) {
      throw new AppError('Subcategory not found or inactive', 404, 'NOT_FOUND');
    }

    const includedServices = await includedServiceRepository.findAll({
      subCategoryId: id,
      status: true,
      isDeleted: false
    });

    const commentRepository = require('../comment/comment.repository');
    const comments = await commentRepository.findAll(
      { subCategoryId: id, isDeleted: false },
      { 
        populate: [
          {
            path: 'userId',
            select: 'name profileImage email phoneNumber'
          },
          {
            path: 'variantId',
            select: 'name'
          }
        ]
      }
    );
    
    return {
      ...subcategory,
      includedServices,
      comments
    };
  }
}

module.exports = new SubcategoryService();
