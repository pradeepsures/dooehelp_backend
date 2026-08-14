const BaseService = require('../../../core/BaseService');
const localityRepository = require('./locality.repository');

class VendorLocalityService extends BaseService {
  constructor() {
    super(localityRepository, 'vendor-locality');
  }

  async getActiveLocalities(query = {}) {
    this.logger.info({ query }, 'getActiveLocalities');
    const filter = { isDeleted: false, status: 'active' };
    
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      sort: { name: 1 }
    };

    return this.getAll(filter, options);
  }
}

module.exports = new VendorLocalityService();
