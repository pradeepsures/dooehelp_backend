const express = require('express');
const router = express.Router();
const cmsController = require('../../common/cms/cms.controller');

// Admin route to update CMS content
router.put('/:type/:page', cmsController.updateCms);

module.exports = router;
