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

    if (query.price !== undefined || query.minPrice !== undefined || query.maxPrice !== undefined) {
      const variantFilter = { isDeleted: false, status: true };
      if (query.price !== undefined) {
        const priceVal = Number(query.price);
        if (!isNaN(priceVal)) variantFilter.price = priceVal;
      }
      if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        variantFilter.price = variantFilter.price || {};
        if (query.minPrice !== undefined) {
          const minVal = Number(query.minPrice);
          if (!isNaN(minVal)) variantFilter.price.$gte = minVal;
        }
        if (query.maxPrice !== undefined) {
          const maxVal = Number(query.maxPrice);
          if (!isNaN(maxVal)) variantFilter.price.$lte = maxVal;
        }
      }
      const Variant = require('../../../models/Variant.model');
      const matchingVariants = await Variant.find(variantFilter, 'subCategoryId');
      const matchingSubCategoryIds = [...new Set(matchingVariants.map(v => v.subCategoryId.toString()))];
      filter._id = { $in: matchingSubCategoryIds };
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      sort: { createdAt: -1 }
    };

    if (query.categoryId) {
      options.select = 'name description image startingPrice categoryId status isDeleted createdAt updatedAt';
    } else {
      options.populate = [
        { path: 'categoryId' },
        { 
          path: 'variants', 
          match: { isDeleted: false, status: true },
          populate: { path: 'includedServices', match: { isDeleted: false, status: true } }
        }
      ];
    }

    return this.getAll(filter, options);
  }

  async getActiveSubcategoryDetails(id) {
    this.logger.info({ subcategoryId: id }, 'getActiveSubcategoryDetails');
    const subcategory = await subcategoryRepository.findById(id, {
      populate: [
        { path: 'categoryId' },
        { 
          path: 'variants', 
          match: { isDeleted: false, status: true },
          populate: { path: 'includedServices', match: { isDeleted: false, status: true } }
        }
      ]
    });
    
    if (!subcategory || !subcategory.status || subcategory.isDeleted) {
      throw new AppError('Subcategory not found or inactive', 404, 'NOT_FOUND');
    }

    // Also check if the parent category is active and not deleted
    if (!subcategory.categoryId || !subcategory.categoryId.status || subcategory.categoryId.isDeleted) {
      throw new AppError('Subcategory not found or inactive', 404, 'NOT_FOUND');
    }

    const variantsList = subcategory.variants || [];
    const flatIncludedServices = [];
    for (const v of variantsList) {
      if (v.includedServices) {
        flatIncludedServices.push(...v.includedServices);
      }
    }

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
      includedServices: flatIncludedServices,
      comments
    };
  }

  /**
   * Get all active variants with pagination, price range filters (minPrice, maxPrice), search, and sorting
   */
  async getAllActiveVariants(query = {}) {
    this.logger.info({ query }, 'getAllActiveVariants');
    const Variant = require('../../../models/Variant.model');

    const filter = {
      status: true,
      isDeleted: false
    };

    if (query.subCategoryId) {
      filter.subCategoryId = query.subCategoryId;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined && query.minPrice !== '') {
        const min = Number(query.minPrice);
        if (!isNaN(min)) filter.price.$gte = min;
      }
      if (query.maxPrice !== undefined && query.maxPrice !== '') {
        const max = Number(query.maxPrice);
        if (!isNaN(max)) filter.price.$lte = max;
      }
      if (Object.keys(filter.price).length === 0) {
        delete filter.price;
      }
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } }
      ];
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    let sort = { createdAt: -1 };
    if (query.sortBy === 'price_asc' || query.sort === 'price_asc') {
      sort = { price: 1 };
    } else if (query.sortBy === 'price_desc' || query.sort === 'price_desc') {
      sort = { price: -1 };
    } else if (query.sortBy === 'name_asc') {
      sort = { name: 1 };
    }

    const [total, variants] = await Promise.all([
      Variant.countDocuments(filter),
      Variant.find(filter)
        .populate({
          path: 'subCategoryId',
          select: 'name image startingPrice categoryId status isDeleted'
        })
        .populate({
          path: 'includedServices',
          match: { status: true, isDeleted: false }
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      variants,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get active variants for a specific subcategory with price range filter (minPrice, maxPrice) and pagination
   */
  async getActiveVariantsBySubcategory(subCategoryId, query = {}) {
    this.logger.info({ subCategoryId, query }, 'getActiveVariantsBySubcategory');
    
    const subcategory = await subcategoryRepository.findById(subCategoryId);
    if (!subcategory || !subcategory.status || subcategory.isDeleted) {
      throw new AppError('Subcategory not found or inactive', 404, 'NOT_FOUND');
    }

    const Variant = require('../../../models/Variant.model');
    const filter = {
      subCategoryId,
      status: true,
      isDeleted: false
    };

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined && query.minPrice !== '') {
        const min = Number(query.minPrice);
        if (!isNaN(min)) filter.price.$gte = min;
      }
      if (query.maxPrice !== undefined && query.maxPrice !== '') {
        const max = Number(query.maxPrice);
        if (!isNaN(max)) filter.price.$lte = max;
      }
      if (Object.keys(filter.price).length === 0) {
        delete filter.price;
      }
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } }
      ];
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    let sort = { price: 1, createdAt: -1 };
    if (query.sortBy === 'price_asc' || query.sort === 'price_asc') {
      sort = { price: 1 };
    } else if (query.sortBy === 'price_desc' || query.sort === 'price_desc') {
      sort = { price: -1 };
    }

    const [total, variants] = await Promise.all([
      Variant.countDocuments(filter),
      Variant.find(filter)
        .populate({
          path: 'includedServices',
          match: { status: true, isDeleted: false }
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const cleanVariants = variants.map(v => ({
      _id: v._id,
      name: v.name,
      price: v.price,
      originalPrice: v.originalPrice,
      duration: v.duration,
      image: v.image,
      description: v.description,
      userRequirements: v.userRequirements || [],
      equipments: v.equipments || [],
      includedServices: v.includedServices || []
    }));

    return {
      subcategory: {
        _id: subcategory._id,
        name: subcategory.name,
        image: subcategory.image,
        startingPrice: subcategory.startingPrice
      },
      variants: cleanVariants,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  async getActiveVariantDetails(id) {
    this.logger.info({ variantId: id }, 'getActiveVariantDetails');

    const Variant = require('../../../models/Variant.model');
    const variant = await Variant.findOne({
      _id: id,
      status: true,
      isDeleted: false
    }).populate({
      path: 'includedServices',
      match: { status: true, isDeleted: false }
    }).lean();

    if (!variant) {
      throw new AppError('Variant not found or inactive', 404, 'NOT_FOUND');
    }

    const subcategory = await subcategoryRepository.findById(variant.subCategoryId);
    variant.subcategory = subcategory;

    return variant;
  }
}

module.exports = new SubcategoryService();
