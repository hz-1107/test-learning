const express = require('express');
const router = express.Router();
const schedulesController = require('../controllers/schedulesController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有路由都需要認證
router.use(authenticate);

// 取得教室列表
router.get('/classrooms', schedulesController.getClassrooms);

// 取得已刪除的班級（垃圾桶）
router.get('/deleted', schedulesController.getDeleted);

// 班級時段管理路由
router.get('/', schedulesController.getAll);
router.get('/:id', schedulesController.getOne);
router.post('/', authorize('admin', 'staff'), schedulesController.create);
router.put('/:id', authorize('admin', 'staff'), schedulesController.update);
router.delete('/:id', authorize('admin', 'staff'), schedulesController.delete);

// 還原班級
router.post('/:id/restore', authorize('admin', 'staff'), schedulesController.restore);

// 永久刪除班級
router.delete('/:id/permanent', authorize('admin', 'staff'), schedulesController.permanentDelete);

// 學生管理
router.get('/:id/students', schedulesController.getStudents);
router.get('/:id/available-students', schedulesController.getAvailableStudents);
router.post('/:id/students', authorize('admin', 'staff'), schedulesController.enrollStudents);
router.delete('/:id/students/:student_id', authorize('admin', 'staff'), schedulesController.removeStudent);

module.exports = router;
