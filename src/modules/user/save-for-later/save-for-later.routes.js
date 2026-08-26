const express = require('express');
const router = express.Router();
const saveForLaterController = require('./save-for-later.controller');
const { validate } = require('../../../core/validate');
const { addToSaveForLaterSchema } = require('./save-for-later.schema');

router.route('/')
  .get(saveForLaterController.getSaveForLater)
  .post(validate(addToSaveForLaterSchema), saveForLaterController.addToSaveForLater);

router.route('/items/:variantId')
  .delete(saveForLaterController.removeFromSaveForLater);

module.exports = router;
