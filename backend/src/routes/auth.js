const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authJwt } = require('../middlewares/auth');

router.get('/captcha', authController.getCaptcha);
router.post('/login', authController.login);
router.get('/me', authJwt, authController.me);
router.post('/change-password', authJwt, authController.changePassword);

module.exports = router;
