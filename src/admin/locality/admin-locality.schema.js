const Joi = require('joi');

const createLocalitySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Locality name is required',
    'any.required': 'Locality name is required'
  }),
  status: Joi.string().valid('active', 'inactive').default('active').optional()
});

const updateLocalitySchema = Joi.object({
  name: Joi.string().trim().optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  isDeleted: Joi.boolean().optional()
});

module.exports = {
  createLocalitySchema,
  updateLocalitySchema
};
