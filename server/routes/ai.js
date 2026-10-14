const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate, authorize } = require('../middleware/auth');

// 評語、大綱、競賽說明僅供教職員使用（學生帳號不得呼叫，避免耗用 AI 額度）
const staffOnly = authorize('admin', 'staff', 'teacher');

/**
 * AI 相關路由
 */

// 生成學生評語 (需要登入)
router.post('/generate-comment', authenticate, staffOnly, aiController.generateComment);

// 生成課程大綱 (需要登入)
router.post('/generate-outline', authenticate, staffOnly, aiController.generateOutline);

// 生成競賽說明 (需要登入)
router.post('/generate-competition-description', authenticate, staffOnly, aiController.generateCompetitionDescription);

// 取得或生成科系推薦及學類介紹 (僅限學生，每次登入只生成一次)
router.post('/generate-department-recommendation', authenticate, aiController.generateDepartmentRecommendation);

// 重新生成科系推薦 (刪除舊紀錄後重新生成)
router.post('/regenerate-department-recommendation', authenticate, aiController.regenerateDepartmentRecommendation);

module.exports = router;
