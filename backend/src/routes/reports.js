const express = require('express');
const router = express.Router();
const { authJwt } = require('../middlewares/auth');
const {
  getSummary,
  getDeviceReports,
  getApiKeyReports,
  getRecentLogs
} = require('../controllers/reportController');

// All report endpoints are secured with Dashboard JWT
router.use(authJwt);

router.get('/summary', getSummary);
router.get('/devices', getDeviceReports);
router.get('/api-keys', getApiKeyReports);
router.get('/logs', getRecentLogs);

module.exports = router;
