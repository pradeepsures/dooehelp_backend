const BaseRepository = require('../../../core/BaseRepository');
const VendorWalletHistory = require('../../../models/VendorWalletHistory.model');

class VendorWalletRepository extends BaseRepository {
  constructor() {
    super(VendorWalletHistory, 'vendor-wallet');
  }
}

module.exports = new VendorWalletRepository();
