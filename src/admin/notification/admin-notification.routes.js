const router = require('express').Router();
const controller = require('./admin-notification.controller');

// Get list of users / vendors who have read notifications
router.get('/who-has-read', controller.getWhoHasRead);
router.get('/read-list', controller.getWhoHasRead);
router.get('/', controller.listAll);

module.exports = router;
