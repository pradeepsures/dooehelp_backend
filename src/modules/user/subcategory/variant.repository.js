const BaseRepository = require('../../../core/BaseRepository');
const Variant = require('../../../models/Variant.model');

class VariantRepository extends BaseRepository {
  constructor() {
    super(Variant, 'variant');
  }
}

module.exports = new VariantRepository();
