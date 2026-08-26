const BaseService = require('../../../core/BaseService');
const commentRepository = require('./comment.repository');
const subcategoryRepository = require('../subcategory/subcategory.repository');
const AppError = require('../../../core/AppError');

class CommentService extends BaseService {
  constructor() {
    super(commentRepository, 'comment');
  }

  async createComment(userId, data) {
    if (!data.variantId) {
      throw new AppError('Variant ID is required to write a review', 400, 'BAD_REQUEST');
    }

    const Variant = require('../../../models/Variant.model');
    const variant = await Variant.findOne({ _id: data.variantId, isDeleted: false });
    if (!variant) {
      throw new AppError('Variant not found', 404, 'NOT_FOUND');
    }
    const subCategoryId = data.subCategoryId || variant.subCategoryId;

    const subcategory = await subcategoryRepository.findById(subCategoryId);
    if (!subcategory || subcategory.isDeleted) {
      throw new AppError('Subcategory not found', 404, 'NOT_FOUND');
    }

    // Verify purchase: Check if there is a completed booking containing this variant
    const Booking = require('../../../models/Booking.model');
    const bookingFilter = {
      userId,
      bookingStatus: 'completed',
      'items.subcategoryId': subCategoryId,
      'items.variantId': data.variantId
    };

    const hasBooked = await Booking.exists(bookingFilter);
    if (!hasBooked) {
      throw new AppError('You can only review services that you have booked and completed', 400, 'BAD_REQUEST');
    }

    const payload = {
      userId,
      subCategoryId,
      variantId: data.variantId,
      content: data.content,
      rating: data.rating !== undefined ? Number(data.rating) : null
    };

    return this.create(payload);
  }

  async listComments(subCategoryId, query = {}) {
    const filter = { subCategoryId, isDeleted: false };
    if (query.variantId) {
      filter.variantId = query.variantId;
    }
    
    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'userId',
          select: 'name profileImage email phoneNumber'
        },
        {
          path: 'variantId',
          select: 'name'
        }
      ]
    };

    return commentRepository.findMany(filter, options);
  }

  async updateComment(commentId, userId, data) {
    const comment = await commentRepository.findById(commentId);
    if (!comment || comment.isDeleted) {
      throw new AppError('Comment not found', 404, 'NOT_FOUND');
    }

    if (comment.userId.toString() !== userId.toString()) {
      throw new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN');
    }

    const payload = {};
    if (data.content !== undefined) payload.content = data.content;
    if (data.rating !== undefined) payload.rating = data.rating !== null ? Number(data.rating) : null;

    return commentRepository.updateById(commentId, payload);
  }

  async deleteComment(commentId, userId) {
    const comment = await commentRepository.findById(commentId);
    if (!comment || comment.isDeleted) {
      throw new AppError('Comment not found', 404, 'NOT_FOUND');
    }

    if (comment.userId.toString() !== userId.toString()) {
      throw new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN');
    }

    await commentRepository.updateById(commentId, { isDeleted: true });
  }
}

module.exports = new CommentService();
