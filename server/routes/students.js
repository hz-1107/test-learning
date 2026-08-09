const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/studentsController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有路由都需要認證
router.use(authenticate);

// 輔助資料路由
router.get('/course-types', studentsController.getCourseTypes);

// 學生本人自助路由 (必須放在 /:id 之前，避免被吃掉)
router.get('/me', studentsController.getMe);
router.put('/me', studentsController.updateMe);
router.get('/me/records', studentsController.getMyRecords);
router.get('/me/trend', studentsController.getMyTrend);

// 學生管理路由
router.get('/', studentsController.getAll);
router.get('/:id', studentsController.getOne);
router.post('/', authorize('admin', 'staff'), studentsController.create);
router.put('/:id', authorize('admin', 'staff'), studentsController.update);
router.delete('/:id', authorize('admin', 'staff'), studentsController.delete);

// 學生點數
router.get('/:id/points', studentsController.getPoints);

module.exports = router;
