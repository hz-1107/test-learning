const express = require('express');
const router = express.Router();
const competitionsController = require('../controllers/competitionsController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有路由都需要認證
router.use(authenticate);

// 學生取得自己的競賽記錄
router.get('/me', competitionsController.getMyCompetitions);

// 取得指定學生的競賽記錄 (管理員/職員)
router.get('/student/:studentId', authorize('admin', 'staff', 'teacher'), competitionsController.getStudentCompetitions);

// 新增競賽記錄 (管理員/職員)
router.post('/', authorize('admin', 'staff', 'teacher'), competitionsController.create);

// 更新競賽記錄 (管理員/職員)
router.put('/:id', authorize('admin', 'staff', 'teacher'), competitionsController.update);

// 刪除競賽記錄 (管理員/職員)
router.delete('/:id', authorize('admin', 'staff', 'teacher'), competitionsController.delete);

module.exports = router;
