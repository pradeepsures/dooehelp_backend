const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');

router.post('/register', adminController.register);
router.post('/login', adminController.login);
router.post('/refresh-token', adminController.refreshToken);

module.exports = router;
