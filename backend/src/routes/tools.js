const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authAny } = require('../middlewares/auth');

router.use(authAny);

router.get('/check-number/:sessionId/:phone', messageController.checkNumber);

module.exports = router;
