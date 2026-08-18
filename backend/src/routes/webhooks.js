const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { authAny } = require('../middlewares/auth');

router.use(authAny);

router.get('/logs', webhookController.getWebhookLogs);
router.post('/test', webhookController.testWebhook);

module.exports = router;
