const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 公開路由
router.post('/login', authController.login);
router.post('/register', authController.register);

// 需要認證的路由
router.get('/profile', authenticate, authController.getProfile);
router.put('/password', authenticate, authController.updatePassword);

module.exports = router;
