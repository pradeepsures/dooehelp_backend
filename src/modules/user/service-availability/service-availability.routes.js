const router = require('express').Router();
const controller = require('./service-availability.controller');
const { validateParams } = require('../../../core/validate');
const { checkAvailabilitySchema } = require('./service-availability.schema');

router.get('/:addressId', validateParams(checkAvailabilitySchema), controller.checkAvailability);

module.exports = router;
