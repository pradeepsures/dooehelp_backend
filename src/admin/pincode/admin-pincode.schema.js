const Joi = require('joi');

const createPincodeSchema = Joi.object({
  pincode: Joi.string().trim().required().messages({
    'string.empty': 'Pincode is required',
    'any.required': 'Pincode is required'
  }),
  status: Joi.string().valid('active', 'inactive').default('active').optional()
});

const updatePincodeSchema = Joi.object({
  pincode: Joi.string().trim().optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  isDeleted: Joi.boolean().optional()
});

module.exports = {
  createPincodeSchema,
  updatePincodeSchema
};
