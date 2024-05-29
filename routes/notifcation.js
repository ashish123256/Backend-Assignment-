const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationController.js');
const authenticateToken = require('../middleware/auth.js');

router.get('/', authenticateToken, notificationsController.getNotifications);
router.post('/mark-read', authenticateToken, notificationsController.markRead);

module.exports = router;
