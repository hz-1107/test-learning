const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有路由都需要認證
router.use(authenticate);

// 日誌管理路由
router.get('/', logsController.getAll);
router.get('/:id', logsController.getOne);
router.post('/', authorize('admin', 'staff', 'teacher'), logsController.create);
router.put('/:id', authorize('admin', 'staff', 'teacher'), logsController.update);

// 日誌權限
router.put('/:id/permissions', authorize('admin', 'staff'), logsController.updatePermissions);

// 學生記錄
router.put('/:id/students/:student_id', authorize('admin', 'staff', 'teacher'), logsController.updateStudentRecord);

module.exports = router;
