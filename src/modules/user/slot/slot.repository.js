const BaseRepository = require('../../../core/BaseRepository');
const Slot = require('../../../models/Slot.model');

class SlotRepository extends BaseRepository {
  constructor() {
    super(Slot, 'slot');
  }
}

module.exports = new SlotRepository();
