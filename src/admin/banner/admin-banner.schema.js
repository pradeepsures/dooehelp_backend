const Joi = require('joi');

const createBannerSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    'string.empty': 'Title is required',
    'any.required': 'Title is required'
  }),
  status: Joi.boolean().default(true)
});

const updateBannerSchema = Joi.object({
  title: Joi.string().trim().optional(),
  status: Joi.boolean().optional(),
  isDeleted: Joi.boolean().optional()
});

module.exports = {
  createBannerSchema,
  updateBannerSchema
};
