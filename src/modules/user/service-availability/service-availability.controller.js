const catchAsync = require('../../../core/catchAsync');
const serviceAvailabilityService = require('./service-availability.service');
const { sendSuccess } = require('../../../core/response');

const checkAvailability = catchAsync(async (req, res) => {
  const { addressId } = req.params;
  const result = await serviceAvailabilityService.checkAvailability(addressId);
  
  let message = 'Service is available in your area';
  if (!result.available) {
    message = 'Service is not available in your area';
  }
  
  sendSuccess(res, result, message);
});

module.exports = { checkAvailability };
