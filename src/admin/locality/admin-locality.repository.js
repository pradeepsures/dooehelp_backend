const BaseRepository = require('../../core/BaseRepository');
const Locality = require('../../models/Locality.model');

class AdminLocalityRepository extends BaseRepository {
  constructor() {
    super(Locality, 'admin-locality');
  }
}

module.exports = new AdminLocalityRepository();
