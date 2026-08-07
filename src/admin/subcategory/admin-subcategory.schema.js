const Joi = require('joi');

const createSubcategorySchema = Joi.object({
  categoryId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid Category ID format',
    'any.required': 'Category ID is required'
  }),
  name: Joi.string().trim().required().messages({
    'string.empty': 'Subcategory name is required',
    'any.required': 'Subcategory name is required'
  }),
  description: Joi.string().trim().optional(),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required'
  }),
  originalPrice: Joi.number().min(0).optional().messages({
    'number.base': 'Original price must be a number',
    'number.min': 'Original price cannot be negative'
  }),
  status: Joi.boolean().default(true)
});

const updateSubcategorySchema = Joi.object({
  categoryId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  name: Joi.string().trim().optional(),
  description: Joi.string().trim().optional(),
  price: Joi.number().min(0).optional(),
  originalPrice: Joi.number().min(0).optional(),
  status: Joi.boolean().optional(),
  isDeleted: Joi.boolean().optional()
});

module.exports = {
  createSubcategorySchema,
  updateSubcategorySchema
};
