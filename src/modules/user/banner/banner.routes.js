const express = require('express');
const router = express.Router();
const bannerController = require('./banner.controller');

router.get('/', bannerController.getAllBanners);
router.get('/:id', bannerController.getBannerDetails);

module.exports = router;
