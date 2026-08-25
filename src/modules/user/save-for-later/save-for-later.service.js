const BaseService = require('../../../core/BaseService');
const saveForLaterRepository = require('./save-for-later.repository');
const Subcategory = require('../../../models/Subcategory.model');
const AppError = require('../../../core/AppError');

class SaveForLaterService extends BaseService {
  constructor() {
    super(saveForLaterRepository, 'save-for-later');
  }

  async getSaveForLater(userId) {
    this.logger.info({ userId }, 'getSaveForLater');
    let saved = await this.repository.findOne({ userId });
    if (!saved) {
      saved = await this.repository.create({ userId, items: [] });
    }

    const SaveForLaterModel = this.repository.model;
    const populatedSaved = await SaveForLaterModel.findOne({ userId })
      .populate({
        path: 'items.subcategoryId',
        model: 'Subcategory',
        select: 'name price originalPrice image description categoryId hasVariants'
      })
      .populate({
        path: 'items.variantId',
        model: 'Variant',
        select: 'name price originalPrice image description subCategoryId'
      })
      .lean();

    return populatedSaved;
  }

  async addToSaveForLater(userId, subcategoryId, variantId) {
    this.logger.info({ userId, subcategoryId, variantId }, 'addToSaveForLater');

    const subcategory = await Subcategory.findOne({ _id: subcategoryId, isDeleted: false, status: true });
    if (!subcategory) {
      throw new AppError('Service not found or inactive', 404, 'NOT_FOUND');
    }

    // Validate variant if subcategory has variants
    if (subcategory.hasVariants) {
      if (!variantId) {
        throw new AppError('This service requires a variant selection', 400, 'BAD_REQUEST');
      }
      const Variant = require('../../../models/Variant.model');
      const variant = await Variant.findOne({ _id: variantId, subCategoryId: subcategoryId, isDeleted: false, status: true });
      if (!variant) {
        throw new AppError('Selected variant not found or inactive', 404, 'NOT_FOUND');
      }
    } else {
      variantId = null;
    }

    let saved = await this.repository.findOne({ userId });
    if (!saved) {
      saved = await this.repository.create({ userId, items: [] });
    }

    const itemExists = saved.items.some(item => 
      item.subcategoryId.toString() === subcategoryId && 
      (item.variantId ? item.variantId.toString() : null) === (variantId ? variantId.toString() : null)
    );

    if (!itemExists) {
      saved.items.push({ subcategoryId, variantId: variantId || null });
      await this.repository.updateById(saved._id, { items: saved.items });
    }

    return this.getSaveForLater(userId);
  }

  async removeFromSaveForLater(userId, subcategoryId, variantId) {
    this.logger.info({ userId, subcategoryId, variantId }, 'removeFromSaveForLater');

    const saved = await this.repository.findOne({ userId });
    if (!saved) {
      throw new AppError('Save-for-later list not found', 404, 'NOT_FOUND');
    }

    const updatedItems = saved.items.filter(item => 
      !(item.subcategoryId.toString() === subcategoryId && 
      (item.variantId ? item.variantId.toString() : null) === (variantId ? variantId.toString() : null))
    );
    await this.repository.updateById(saved._id, { items: updatedItems });

    return this.getSaveForLater(userId);
  }
}

module.exports = new SaveForLaterService();
