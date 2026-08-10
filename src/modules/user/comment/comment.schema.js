const Joi = require('joi');

const createCommentSchema = Joi.object({
  subCategoryId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid Subcategory ID format',
    'any.required': 'Subcategory ID is required'
  }),
  content: Joi.string().trim().required().messages({
    'string.empty': 'Comment content is required',
    'any.required': 'Comment content is required'
  }),
  rating: Joi.number().min(0).max(5).optional().messages({
    'number.min': 'Rating must be at least 0',
    'number.max': 'Rating cannot exceed 5'
  })
});

const updateCommentSchema = Joi.object({
  content: Joi.string().trim().optional(),
  rating: Joi.number().min(0).max(5).optional().messages({
    'number.min': 'Rating must be at least 0',
    'number.max': 'Rating cannot exceed 5'
  })
});

module.exports = {
  createCommentSchema,
  updateCommentSchema
};
