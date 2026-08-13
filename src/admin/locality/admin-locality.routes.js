const router = require('express').Router();
const controller = require('./admin-locality.controller');
const { validate } = require('../../core/validate');
const { createLocalitySchema, updateLocalitySchema } = require('./admin-locality.schema');

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', validate(createLocalitySchema), controller.create);
router.put('/:id', validate(updateLocalitySchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
