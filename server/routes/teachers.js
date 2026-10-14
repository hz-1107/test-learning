const express = require('express');
const router = express.Router();
const teachersController = require('../controllers/teachersController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有路由都需要認證
router.use(authenticate);

// 教師管理路由
// 教師列表：行政端看完整資料；教師只取得姓名等基本資料（見 getAll）；學生不可存取
router.get('/', authorize('admin', 'staff', 'teacher'), teachersController.getAll);
// 單一教師完整資料（含電話、生日等個資）僅限行政端
router.get('/:id', authorize('admin', 'staff'), teachersController.getOne);
router.post('/', authorize('admin', 'staff'), teachersController.create);
router.put('/:id', authorize('admin', 'staff'), teachersController.update);
router.delete('/:id', authorize('admin', 'staff'), teachersController.delete);

// 教師日誌
router.get('/:id/logs', authorize('admin', 'staff', 'teacher'), teachersController.getLogs);

module.exports = router;
