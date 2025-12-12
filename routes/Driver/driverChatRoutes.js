const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/Driver/driverChatController');
const { authenticateDriver, isDriver } = require('../../middleware/authMiddleware');


router.get('/conversations', authenticateDriver, isDriver, chatController.getDriverConversations);
router.get('/messages/:conversationId', authenticateDriver, isDriver, chatController.getDriverMessages);
router.post('/send', authenticateDriver, isDriver, chatController.sendMessageFromDriver);

module.exports = router;