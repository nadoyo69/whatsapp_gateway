const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authAny } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');
const { apiLogger } = require('../middlewares/apiLogger');

// Support both JWT or API Key for message dispatching
router.use(authAny);
router.use(apiLogger);

router.post('/send-text', messageController.sendText);
router.post('/send-image', upload.single('file'), messageController.sendImage);
router.post('/send-document', upload.single('file'), messageController.sendDocument);
router.post('/send-audio', upload.single('file'), messageController.sendAudio);
router.post('/send-video', upload.single('file'), messageController.sendVideo);
router.post('/send-location', messageController.sendLocation);
router.post('/send-contact', messageController.sendContact);

module.exports = router;
