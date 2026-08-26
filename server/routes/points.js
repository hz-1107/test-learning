const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/pointsController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有路由都需要認證
router.use(authenticate);

// 批量取得多位學生的點數餘額
router.post('/batch-balances', authorize('admin', 'staff', 'teacher'), pointsController.getBatchBalances);
router.post('/batch', authorize('admin', 'staff', 'teacher'), pointsController.getBatchBalances); // 別名

// 取得單一學生的點數餘額
router.get('/:studentId/balance', pointsController.getBalance);

// 取得單一學生的點數交易紀錄
router.get('/:studentId/history', pointsController.getHistory);
router.get('/:studentId/transactions', pointsController.getHistory); // 別名

// 新增點數交易（增加或扣除）
router.post('/:studentId/transaction', authorize('admin', 'staff', 'teacher'), pointsController.addTransaction);
router.post('/:studentId/transactions', authorize('admin', 'staff', 'teacher'), pointsController.addTransaction); // 別名

module.exports = router;
