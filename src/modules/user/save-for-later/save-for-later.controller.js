const catchAsync = require('../../../core/catchAsync');
const saveForLaterService = require('./save-for-later.service');
const { sendSuccess } = require('../../../core/response');

exports.getSaveForLater = catchAsync(async (req, res) => {
  const list = await saveForLaterService.getSaveForLater(req.user._id);
  sendSuccess(res, list, 'Save-for-later list fetched successfully');
});

exports.addToSaveForLater = catchAsync(async (req, res) => {
  const { subcategoryId } = req.body;
  const list = await saveForLaterService.addToSaveForLater(req.user._id, subcategoryId);
  sendSuccess(res, list, 'Item saved for later successfully');
});

exports.removeFromSaveForLater = catchAsync(async (req, res) => {
  const { subcategoryId } = req.params;
  const list = await saveForLaterService.removeFromSaveForLater(req.user._id, subcategoryId);
  sendSuccess(res, list, 'Item removed from save-for-later list successfully');
});
