const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

/**
 * AI 相關路由
 */

// 生成學生評語 (需要登入)
router.post('/generate-comment', authenticate, aiController.generateComment);

// 生成課程大綱 (需要登入)
router.post('/generate-outline', authenticate, aiController.generateOutline);

// 生成競賽說明 (需要登入)
router.post('/generate-competition-description', authenticate, aiController.generateCompetitionDescription);

module.exports = router;
