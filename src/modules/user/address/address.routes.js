const router = require('express').Router();
const controller = require('./address.controller');
const { validate } = require('../../../core/validate');
const { createAddressSchema, updateAddressSchema } = require('./address.schema');

router.post('/', validate(createAddressSchema), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.put('/:id', validate(updateAddressSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
