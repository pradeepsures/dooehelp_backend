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
        select: 'name image description categoryId startingPrice'
      })
      .populate({
        path: 'items.variantId',
        model: 'Variant',
        select: 'name price originalPrice image description subCategoryId'
      })
      .lean();

    return populatedSaved;
  }

  async addToSaveForLater(userId, variantId) {
    this.logger.info({ userId, variantId }, 'addToSaveForLater');

    const Variant = require('../../../models/Variant.model');
    const variant = await Variant.findOne({ _id: variantId, isDeleted: false, status: true })
      .populate('subCategoryId');
    
    if (!variant) {
      throw new AppError('Selected variant not found or inactive', 404, 'NOT_FOUND');
    }

    const subcategoryId = variant.subCategoryId._id || variant.subCategoryId;
    const subcategory = await Subcategory.findOne({ _id: subcategoryId, isDeleted: false, status: true });
    if (!subcategory) {
      throw new AppError('Parent service not found or inactive', 404, 'NOT_FOUND');
    }

    let saved = await this.repository.findOne({ userId });
    if (!saved) {
      saved = await this.repository.create({ userId, items: [] });
    } else {
      saved.items = saved.items.filter(item => item.variantId);
    }

    const itemExists = saved.items.some(item => 
      item.variantId && item.variantId.toString() === variantId
    );

    if (!itemExists) {
      saved.items.push({ subcategoryId, variantId });
      await this.repository.updateById(saved._id, { items: saved.items });
    }

    return this.getSaveForLater(userId);
  }

  async removeFromSaveForLater(userId, variantId) {
    this.logger.info({ userId, variantId }, 'removeFromSaveForLater');

    const saved = await this.repository.findOne({ userId });
    if (!saved) {
      throw new AppError('Save-for-later list not found', 404, 'NOT_FOUND');
    }

    const updatedItems = saved.items.filter(item => 
      item.variantId && item.variantId.toString() !== variantId
    );
    await this.repository.updateById(saved._id, { items: updatedItems });

    return this.getSaveForLater(userId);
  }
}

module.exports = new SaveForLaterService();
