const router = require('express').Router();
const controller = require('./admin-pincode.controller');
const { validate } = require('../../core/validate');
const { createPincodeSchema, updatePincodeSchema } = require('./admin-pincode.schema');

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', validate(createPincodeSchema), controller.create);
router.put('/:id', validate(updatePincodeSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
