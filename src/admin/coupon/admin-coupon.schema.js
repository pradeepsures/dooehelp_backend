const Joi = require('joi');

const createCouponSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Coupon title is required',
    'any.required': 'Coupon title is required'
  }),
  code: Joi.string().trim().uppercase().required().messages({
    'string.empty': 'Coupon code is required',
    'any.required': 'Coupon code is required'
  }),
  discountType: Joi.string().valid('percentage', 'flat').required().messages({
    'any.only': 'Discount type must be either percentage or flat',
    'any.required': 'Discount type is required'
  }),
  discountValue: Joi.number().positive().required().messages({
    'number.positive': 'Discount value must be greater than zero',
    'any.required': 'Discount value is required'
  }),
  startDate: Joi.date().optional(),
  expiryDate: Joi.date().required().messages({
    'any.required': 'Expiry date is required'
  }),
  usageLimit: Joi.number().integer().min(1).optional().allow(null).default(null),
  status: Joi.string().valid('active', 'inactive').optional().default('active')
});

const updateCouponSchema = Joi.object({
  name: Joi.string().trim().optional(),
  code: Joi.string().trim().uppercase().optional(),
  discountType: Joi.string().valid('percentage', 'flat').optional(),
  discountValue: Joi.number().positive().optional(),
  startDate: Joi.date().optional(),
  expiryDate: Joi.date().optional(),
  usageLimit: Joi.number().integer().min(1).optional().allow(null),
  status: Joi.string().valid('active', 'inactive').optional(),
  isDeleted: Joi.boolean().optional(),
  isForAllUsers: Joi.boolean().optional(),
  assignedUsers: Joi.array().items(Joi.string().hex().length(24)).optional()
});

const assignCouponSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().hex().length(24)).min(1).optional(),
  userId: Joi.string().hex().length(24).optional(),
  mode: Joi.string().valid('add', 'replace').default('add'),
  sendNotification: Joi.boolean().default(true)
}).or('userIds', 'userId');

const unassignCouponSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().hex().length(24)).min(1).optional(),
  userId: Joi.string().hex().length(24).optional()
}).or('userIds', 'userId');

module.exports = {
  createCouponSchema,
  updateCouponSchema,
  assignCouponSchema,
  unassignCouponSchema
};
