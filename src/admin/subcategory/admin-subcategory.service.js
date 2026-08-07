const BaseService = require('../../core/BaseService');
const subcategoryRepository = require('../../modules/user/subcategory/subcategory.repository');
const categoryRepository = require('../../modules/user/category/category.repository');
const AppError = require('../../core/AppError');

class AdminSubcategoryService extends BaseService {
  constructor() {
    super(subcategoryRepository, 'admin-subcategory');
  }

  async listAll(query = {}) {
    const filter = {};
    if (query.status !== undefined) filter.status = query.status;
    if (query.isDeleted !== undefined) filter.isDeleted = query.isDeleted;
    if (query.categoryId) filter.categoryId = query.categoryId;
    
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { createdAt: -1 },
      populate: 'categoryId'
    };

    return this.getAll(filter, options);
  }

  async getOne(id) {
    const subcategory = await subcategoryRepository.findById(id, { populate: 'categoryId' });
    if (!subcategory) throw new AppError('Subcategory not found', 404, 'NOT_FOUND');
    return subcategory;
  }

  async createSubcategory(data, file) {
    if (!file) {
      throw new AppError('Subcategory image is required', 400, 'VALIDATION_ERROR');
    }

    // Verify Category exists and is active
    const category = await categoryRepository.findById(data.categoryId);
    if (!category || category.isDeleted) {
      throw new AppError('Invalid category ID provided', 400, 'VALIDATION_ERROR');
    }

    const payload = { ...data };
    payload.image = `/${file.destination}/${file.filename}`.replace(/\\/g, '/');
    
    return this.create(payload);
  }

  async updateSubcategory(id, data, file) {
    const subcategory = await subcategoryRepository.findById(id);
    if (!subcategory) throw new AppError('Subcategory not found', 404, 'NOT_FOUND');

    if (data.categoryId) {
      const category = await categoryRepository.findById(data.categoryId);
      if (!category || category.isDeleted) {
        throw new AppError('Invalid category ID provided', 400, 'VALIDATION_ERROR');
      }
    }

    const payload = { ...data };
    if (file) {
      payload.image = `/${file.destination}/${file.filename}`.replace(/\\/g, '/');
    }

    return subcategoryRepository.updateById(id, payload);
  }

  async softDelete(id) {
    const subcategory = await subcategoryRepository.findById(id);
    if (!subcategory) throw new AppError('Subcategory not found', 404, 'NOT_FOUND');
    
    await subcategoryRepository.updateById(id, { isDeleted: true });
    this.logger.info({ subcategoryId: id }, 'Subcategory soft deleted');
  }
}

module.exports = new AdminSubcategoryService();
