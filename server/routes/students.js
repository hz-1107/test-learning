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
// 以下為查看他人資料的端點，學生帳號一律只能透過 /me 系列取得本人資料
const staffOnly = authorize('admin', 'staff', 'teacher');
router.get('/', staffOnly, studentsController.getAll);
router.get('/:id', staffOnly, studentsController.getOne);
router.post('/', authorize('admin', 'staff'), studentsController.create);
router.put('/:id', authorize('admin', 'staff'), studentsController.update);
// 教師端可編輯學生的個人／家長資訊（僅限這些欄位）
router.put('/:id/profile', authorize('admin', 'staff', 'teacher'), studentsController.updateProfile);
router.delete('/:id', authorize('admin', 'staff'), studentsController.delete);

// 學生點數
router.get('/:id/points', staffOnly, studentsController.getPoints);

// 學生課程紀錄 (教職員查看指定學生的學習成就用)
router.get('/:id/records', staffOnly, studentsController.getStudentRecords);

// 學生技能平均分數
router.get('/:id/skill-averages', staffOnly, studentsController.getSkillAverages);

module.exports = router;
