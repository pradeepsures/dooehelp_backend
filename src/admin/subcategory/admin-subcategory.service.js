const BaseService = require('../../core/BaseService');
const subcategoryRepository = require('../../modules/user/subcategory/subcategory.repository');
const categoryRepository = require('../../modules/user/category/category.repository');
const includedServiceRepository = require('../../modules/user/subcategory/included-service.repository');
const AppError = require('../../core/AppError');

function parseArrayField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Not a JSON string, fallback below
    }
    return field.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
}

class AdminSubcategoryService extends BaseService {
  constructor() {
    super(subcategoryRepository, 'admin-subcategory');
  }

  async listAll(query = {}) {
    const filter = { isDeleted: false };
    if (query.status !== undefined) filter.status = query.status;
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
    
    const includedServices = await includedServiceRepository.findAll({
      subCategoryId: id,
      isDeleted: false
    });
    
    return {
      ...subcategory,
      includedServices
    };
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
    payload.userRequirements = parseArrayField(payload.userRequirements);
    payload.equipments = parseArrayField(payload.equipments);
    
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
    
    if (data.userRequirements !== undefined) {
      payload.userRequirements = parseArrayField(data.userRequirements);
    }
    if (data.equipments !== undefined) {
      payload.equipments = parseArrayField(data.equipments);
    }

    return subcategoryRepository.updateById(id, payload);
  }

  async softDelete(id) {
    const subcategory = await subcategoryRepository.findById(id);
    if (!subcategory) throw new AppError('Subcategory not found', 404, 'NOT_FOUND');
    
    await subcategoryRepository.updateById(id, { isDeleted: true });
    this.logger.info({ subcategoryId: id }, 'Subcategory soft deleted');
  }

  async listIncludedServices(subCategoryId, query = {}) {
    const filter = { subCategoryId, isDeleted: false };
    if (query.status !== undefined) filter.status = query.status;

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 100,
      sort: { createdAt: -1 }
    };
    return includedServiceRepository.findMany(filter, options);
  }

  async createIncludedService(subCategoryId, data, file) {
    if (!file) {
      throw new AppError('Included service image is required', 400, 'VALIDATION_ERROR');
    }

    // Verify subcategory exists
    const subcategory = await subcategoryRepository.findById(subCategoryId);
    if (!subcategory || subcategory.isDeleted) {
      throw new AppError('Subcategory not found', 404, 'NOT_FOUND');
    }

    const payload = { 
      ...data,
      subCategoryId,
      image: `/${file.destination}/${file.filename}`.replace(/\\/g, '/')
    };
    
    return includedServiceRepository.create(payload);
  }

  async updateIncludedService(id, data, file) {
    const includedService = await includedServiceRepository.findById(id);
    if (!includedService || includedService.isDeleted) {
      throw new AppError('Included service not found', 404, 'NOT_FOUND');
    }

    const payload = { ...data };
    if (file) {
      payload.image = `/${file.destination}/${file.filename}`.replace(/\\/g, '/');
    }

    return includedServiceRepository.updateById(id, payload);
  }

  async softDeleteIncludedService(id) {
    const includedService = await includedServiceRepository.findById(id);
    if (!includedService || includedService.isDeleted) {
      throw new AppError('Included service not found', 404, 'NOT_FOUND');
    }

    await includedServiceRepository.updateById(id, { isDeleted: true });
  }
}

module.exports = new AdminSubcategoryService();
