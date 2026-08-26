const BaseService = require('../../core/BaseService');
const categoryRepository = require('../../modules/user/category/category.repository');
const subcategoryRepository = require('../../modules/user/subcategory/subcategory.repository');
const AppError = require('../../core/AppError');

class AdminCategoryService extends BaseService {
  constructor() {
    super(categoryRepository, 'admin-category');
  }

  async listAll(query = {}) {
    const filter = { isDeleted: false };
    if (query.status !== undefined) filter.status = query.status;
    
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { createdAt: -1 }
    };

    const result = await this.getAll(filter, options);
    
    // Append subcategoryCount for each category
    const dataWithCount = await Promise.all(
      result.data.map(async (category) => {
        const count = await subcategoryRepository.count({ categoryId: category._id, isDeleted: false });
        return {
          ...category,
          subcategoryCount: count
        };
      })
    );

    return {
      data: dataWithCount,
      pagination: result.pagination
    };
  }

  async getOne(id) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');
    
    const subcategories = await subcategoryRepository.findAll({ categoryId: id, isDeleted: false });
    
    return {
      ...category,
      subcategoryCount: subcategories.length,
      subcategories
    };
  }

  async createCategory(data, file) {
    if (!file) {
      throw new AppError('Category image is required', 400, 'VALIDATION_ERROR');
    }

    // Check if category name already exists (excluding soft deleted ones, or overall)
    const exists = await categoryRepository.exists({ name: data.name, isDeleted: false });
    if (exists) {
      throw new AppError('Category name already exists', 400, 'DUPLICATE_ERROR');
    }

    const payload = { ...data };
    payload.image = `/${file.destination}/${file.filename}`.replace(/\\/g, '/');
    
    return this.create(payload);
  }

  async updateCategory(id, data, file) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');

    if (data.name) {
      const exists = await categoryRepository.exists({ 
        name: data.name, 
        _id: { $ne: id },
        isDeleted: false 
      });
      if (exists) {
        throw new AppError('Category name already exists', 400, 'DUPLICATE_ERROR');
      }
    }

    const payload = { ...data };
    if (file) {
      payload.image = `/${file.destination}/${file.filename}`.replace(/\\/g, '/');
    }

    return categoryRepository.updateById(id, payload);
  }

  async softDelete(id) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');
    
    await categoryRepository.updateById(id, { isDeleted: true });
    
    // Cascade soft delete to subcategories
    await subcategoryRepository.updateMany({ categoryId: id }, { isDeleted: true });

    this.logger.info({ categoryId: id }, 'Category and its subcategories soft deleted');
  }
}

module.exports = new AdminCategoryService();
