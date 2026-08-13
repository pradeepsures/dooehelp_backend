const Joi = require('joi');

const createAddressSchema = Joi.object({
  name: Joi.string().trim().optional(),
  mobile: Joi.string().trim().optional(),
  houseFlat: Joi.string().trim().required().messages({
    'any.required': 'House/Flat is required',
    'string.empty': 'House/Flat cannot be empty',
  }),
  locality: Joi.string().trim().required().messages({
    'any.required': 'Locality is required',
    'string.empty': 'Locality cannot be empty',
  }),
  landmark: Joi.string().trim().allow('').optional(),
  city: Joi.string().trim().required().messages({
    'any.required': 'City is required',
    'string.empty': 'City cannot be empty',
  }),
  state: Joi.string().trim().required().messages({
    'any.required': 'State is required',
    'string.empty': 'State cannot be empty',
  }),
  pin: Joi.string().trim().required().messages({
    'any.required': 'PIN is required',
    'string.empty': 'PIN cannot be empty',
  }),
  country: Joi.string().trim().default('India').optional(),
  address: Joi.string().trim().required().messages({
    'any.required': 'Address is required',
    'string.empty': 'Address cannot be empty',
  }),
  location: Joi.object({
    lat: Joi.number().allow(null).optional(),
    long: Joi.number().allow(null).optional()
  }).optional(),
  status: Joi.string().valid('active', 'inactive').default('active').optional(),
});

const updateAddressSchema = Joi.object({
  name: Joi.string().trim().optional(),
  mobile: Joi.string().trim().optional(),
  houseFlat: Joi.string().trim().optional(),
  locality: Joi.string().trim().optional(),
  landmark: Joi.string().trim().allow('').optional(),
  city: Joi.string().trim().optional(),
  state: Joi.string().trim().optional(),
  pin: Joi.string().trim().optional(),
  country: Joi.string().trim().optional(),
  address: Joi.string().trim().optional(),
  location: Joi.object({
    lat: Joi.number().allow(null).optional(),
    long: Joi.number().allow(null).optional()
  }).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
});

module.exports = {
  createAddressSchema,
  updateAddressSchema,
};
