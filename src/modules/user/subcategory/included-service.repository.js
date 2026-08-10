const BaseRepository = require('../../../core/BaseRepository');
const IncludedService = require('../../../models/IncludedService.model');

class IncludedServiceRepository extends BaseRepository {
  constructor() {
    super(IncludedService, 'included-service');
  }
}

module.exports = new IncludedServiceRepository();
