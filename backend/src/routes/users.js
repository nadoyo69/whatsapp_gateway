const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authJwt } = require('../middlewares/auth');

router.use(authJwt);

router.get('/', userController.listUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
