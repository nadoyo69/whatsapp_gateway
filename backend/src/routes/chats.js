const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authAny } = require('../middlewares/auth');

router.use(authAny);

router.get('/stats/dashboard', chatController.getDashboardStats);
router.get('/:sessionId', chatController.getChats);
router.get('/:sessionId/:jid/messages', chatController.getMessages);

module.exports = router;
