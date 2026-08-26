const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

/**
 * AI 相關路由
 */

// 生成學生評語 (需要登入)
router.post('/generate-comment', authenticate, aiController.generateComment);

module.exports = router;
