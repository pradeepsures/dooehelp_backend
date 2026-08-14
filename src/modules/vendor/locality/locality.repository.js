const BaseRepository = require('../../../core/BaseRepository');
const Locality = require('../../../models/Locality.model');

class VendorLocalityRepository extends BaseRepository {
  constructor() {
    super(Locality, 'vendor-locality');
  }
}

module.exports = new VendorLocalityRepository();
