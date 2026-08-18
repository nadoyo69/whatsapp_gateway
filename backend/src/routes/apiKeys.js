const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');
const { authJwt } = require('../middlewares/auth');

router.use(authJwt);

router.get('/', apiKeyController.listApiKeys);
router.post('/', apiKeyController.createApiKey);
router.patch('/:id/toggle', apiKeyController.toggleApiKey);
router.delete('/:id', apiKeyController.deleteApiKey);

module.exports = router;
