const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authAny } = require('../middlewares/auth');

// All session management routes support either JWT (dashboard) or API Key
router.use(authAny);

router.get('/', sessionController.listSessions);
router.post('/create', sessionController.createSession);
router.get('/:sessionId/status', sessionController.getSessionStatus);
router.get('/:sessionId/qr', sessionController.getSessionQRRoute);
router.post('/:sessionId/pairing-code', sessionController.requestPairingCodeRoute);
router.post('/:sessionId/restart', sessionController.restartSessionRoute);
router.post('/:sessionId/logout', sessionController.logoutSessionRoute);
router.put('/:sessionId/settings', sessionController.updateSessionSettings);
router.delete('/:sessionId', sessionController.deleteSession);

module.exports = router;
