const catchAsync = require('../../../core/catchAsync');
const commentService = require('./comment.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../../core/response');

const create = catchAsync(async (req, res) => {
  const comment = await commentService.createComment(req.user._id, req.body);
  sendCreated(res, comment, 'Comment and rating added successfully');
});

const list = catchAsync(async (req, res) => {
  const result = await commentService.listComments(req.params.subCategoryId, req.query);
  sendPaginated(res, result.data, result.pagination, 'Comments retrieved successfully');
});

const update = catchAsync(async (req, res) => {
  const comment = await commentService.updateComment(req.params.id, req.user._id, req.body);
  sendSuccess(res, comment, 'Comment updated successfully');
});

const remove = catchAsync(async (req, res) => {
  await commentService.deleteComment(req.params.id, req.user._id);
  sendSuccess(res, null, 'Comment deleted successfully');
});

module.exports = {
  create,
  list,
  update,
  remove
};
