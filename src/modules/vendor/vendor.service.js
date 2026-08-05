const BaseService = require('../../core/BaseService');
const vendorRepository = require('./vendor.repository');

class VendorService extends BaseService {
  constructor() {
    super(vendorRepository, 'vendor');
  }

  // Vendor specific business logic will go here
}

module.exports = new VendorService();
