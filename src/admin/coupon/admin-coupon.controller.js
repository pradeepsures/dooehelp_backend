const catchAsync = require('../../core/catchAsync');
const adminCouponService = require('./admin-coupon.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await adminCouponService.listAll(req.query);
  sendPaginated(res, result.data, result.pagination, 'Coupons retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  sendSuccess(res, await adminCouponService.getOne(req.params.id), 'Coupon retrieved successfully');
});

const create = catchAsync(async (req, res) => {
  sendCreated(res, await adminCouponService.createCoupon(req.body), 'Coupon created successfully');
});

const update = catchAsync(async (req, res) => {
  sendSuccess(res, await adminCouponService.updateCoupon(req.params.id, req.body), 'Coupon updated successfully');
});

const remove = catchAsync(async (req, res) => {
  await adminCouponService.softDelete(req.params.id);
  sendSuccess(res, null, 'Coupon deleted successfully');
});

module.exports = { list, getOne, create, update, remove };
