const router = require('express').Router();
const controller = require('./comment.controller');
const { validate } = require('../../../core/validate');
const { createCommentSchema, updateCommentSchema } = require('./comment.schema');

router.post('/', validate(createCommentSchema), controller.create);
router.get('/subcategory/:subCategoryId', controller.list);
router.put('/:id', validate(updateCommentSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
