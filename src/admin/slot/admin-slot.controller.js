const catchAsync = require('../../core/catchAsync');
const adminSlotService = require('./admin-slot.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await adminSlotService.listAll(req.query);
  sendPaginated(res, result.data, result.pagination, 'Slots retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  sendSuccess(res, await adminSlotService.getOne(req.params.id), 'Slot retrieved successfully');
});

const create = catchAsync(async (req, res) => {
  sendCreated(res, await adminSlotService.createSlot(req.body), 'Slot created successfully');
});

const update = catchAsync(async (req, res) => {
  sendSuccess(res, await adminSlotService.updateSlot(req.params.id, req.body), 'Slot updated successfully');
});

const remove = catchAsync(async (req, res) => {
  await adminSlotService.softDelete(req.params.id);
  sendSuccess(res, null, 'Slot deleted successfully');
});

module.exports = { list, getOne, create, update, remove };
