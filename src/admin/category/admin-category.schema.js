const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Category name is required',
    'any.required': 'Category name is required'
  }),
  status: Joi.boolean().default(true)
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().optional(),
  status: Joi.boolean().optional(),
  isDeleted: Joi.boolean().optional()
});

module.exports = {
  createCategorySchema,
  updateCategorySchema
};
