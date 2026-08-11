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
        path: 'items',
        model: 'Subcategory',
        select: 'name price originalPrice image description'
      })
      .lean();

    return populatedSaved;
  }

  async addToSaveForLater(userId, subcategoryId) {
    this.logger.info({ userId, subcategoryId }, 'addToSaveForLater');

    const subcategory = await Subcategory.findOne({ _id: subcategoryId, isDeleted: false, status: true });
    if (!subcategory) {
      throw new AppError('Service not found or inactive', 404, 'NOT_FOUND');
    }

    let saved = await this.repository.findOne({ userId });
    if (!saved) {
      saved = await this.repository.create({ userId, items: [] });
    }

    const itemExists = saved.items.some(id => id.toString() === subcategoryId);
    if (!itemExists) {
      saved.items.push(subcategoryId);
      await this.repository.updateById(saved._id, { items: saved.items });
    }

    return this.getSaveForLater(userId);
  }

  async removeFromSaveForLater(userId, subcategoryId) {
    this.logger.info({ userId, subcategoryId }, 'removeFromSaveForLater');

    const saved = await this.repository.findOne({ userId });
    if (!saved) {
      throw new AppError('Save-for-later list not found', 404, 'NOT_FOUND');
    }

    const updatedItems = saved.items.filter(id => id.toString() !== subcategoryId);
    await this.repository.updateById(saved._id, { items: updatedItems });

    return this.getSaveForLater(userId);
  }
}

module.exports = new SaveForLaterService();
