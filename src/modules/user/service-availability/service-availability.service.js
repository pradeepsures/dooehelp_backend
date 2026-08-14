const Locality = require('../../../models/Locality.model');
const Pincode = require('../../../models/Pincode.model');
const UserAddress = require('../../../models/UserAddress.model');
const { createLogger } = require('../../../config/logger');

const logger = createLogger('service-availability:service');

class ServiceAvailabilityService {
  async checkAvailability(addressId) {
    logger.info({ addressId }, 'checkAvailability');

    // 1. Fetch the user address by ID
    const savedAddress = await UserAddress.findOne({ _id: addressId, isDeleted: false });
    
    // if not found, or not active, service is not available
    if (!savedAddress) {
      return {
        available: false,
        message: 'Address not found or inactive'
      };
    }

    // 2. Check if locality or pin match active services
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedLocality = escapeRegExp(savedAddress.locality.trim());
    const escapedPin = escapeRegExp(savedAddress.pin.trim());

    const localityMatch = await Locality.findOne({
      name: { $regex: new RegExp("^" + escapedLocality + "$", "i") },
      status: 'active',
      isDeleted: false
    });

    const pincodeMatch = await Pincode.findOne({
      pincode: { $regex: new RegExp("^" + escapedPin + "$", "i") },
      status: 'active',
      isDeleted: false
    });

    if (localityMatch || pincodeMatch) {
      return {
        available: true,
        type: localityMatch ? 'locality' : 'pincode',
        matchedValue: localityMatch ? localityMatch.name : pincodeMatch.pincode,
        details: localityMatch || pincodeMatch
      };
    }

    return {
      available: false,
      message: 'Service is not available in your locality or pincode'
    };
  }
}

module.exports = new ServiceAvailabilityService();
