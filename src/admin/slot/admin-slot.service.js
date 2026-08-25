const BaseService = require('../../core/BaseService');
const slotRepository = require('../../modules/user/slot/slot.repository');
const AppError = require('../../core/AppError');

class AdminSlotService extends BaseService {
  constructor() {
    super(slotRepository, 'admin-slot');
  }

  async listAll(query = {}) {
    const filter = { isDeleted: false };

    if (query.date) {
      const startOfDay = new Date(query.date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (query.slotType) {
      filter.slotType = query.slotType;
    }

    if (query.status !== undefined && query.status !== '') {
      filter.status = query.status === 'true';
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { date: 1, timeSlot: 1 }
    };

    return this.getAll(filter, options);
  }

  async getOne(id) {
    const slot = await slotRepository.findById(id);
    if (!slot || slot.isDeleted) {
      throw new AppError('Slot not found', 404, 'NOT_FOUND');
    }
    return slot;
  }

  async createSlot(data) {
    const startOfDay = new Date(data.date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(data.date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const exists = await slotRepository.exists({
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot: data.timeSlot,
      isDeleted: false
    });

    if (exists) {
      throw new AppError('A slot with the same date and time already exists', 400, 'DUPLICATE_ERROR');
    }

    return this.create(data);
  }

  async updateSlot(id, data) {
    const slot = await slotRepository.findById(id);
    if (!slot || slot.isDeleted) {
      throw new AppError('Slot not found', 404, 'NOT_FOUND');
    }

    const newDate = data.date ? new Date(data.date) : new Date(slot.date);
    const newTimeSlot = data.timeSlot || slot.timeSlot;

    if (data.date || data.timeSlot) {
      const startOfDay = new Date(newDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(newDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const exists = await slotRepository.exists({
        _id: { $ne: id },
        date: { $gte: startOfDay, $lte: endOfDay },
        timeSlot: newTimeSlot,
        isDeleted: false
      });

      if (exists) {
        throw new AppError('A slot with the same date and time already exists', 400, 'DUPLICATE_ERROR');
      }
    }

    return slotRepository.updateById(id, data);
  }

  async softDelete(id) {
    const slot = await slotRepository.findById(id);
    if (!slot || slot.isDeleted) {
      throw new AppError('Slot not found', 404, 'NOT_FOUND');
    }

    await slotRepository.updateById(id, { isDeleted: true });
    this.logger.info({ slotId: id }, 'Slot soft deleted');
  }
}

module.exports = new AdminSlotService();
