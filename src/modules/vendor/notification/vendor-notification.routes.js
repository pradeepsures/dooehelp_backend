const router = require('express').Router();
const controller = require('./vendor-notification.controller');
const { protect, restrictTo } = require('../../../middlewares/auth.middleware');

router.use(protect, restrictTo('vendor'));

router.get('/', controller.getNotifications);
router.get('/read', controller.getReadNotifications);
router.get('/who-has-read', controller.getReadNotifications);
router.get('/read-list', controller.getReadNotifications);
router.get('/:id', controller.getOne);
router.patch('/:id/read', controller.markAsRead);
router.delete('/clear-all', controller.clearAll);
router.delete('/:id', controller.deleteNotification);

module.exports = router;
