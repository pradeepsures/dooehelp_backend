const catchAsync = require('../../../core/catchAsync');
const localityService = require('./locality.service');
const { sendPaginated } = require('../../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await localityService.getActiveLocalities(req.query);
  sendPaginated(res, result.data, result.pagination, 'Localities retrieved successfully');
});

module.exports = { list };
