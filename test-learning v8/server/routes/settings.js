const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有路由都需要認證
router.use(authenticate);

// 系統設定
router.get('/', settingsController.getSettings);
router.put('/', authorize('admin', 'staff'), settingsController.updateSettings);

// 假日設定
router.get('/holidays', settingsController.getHolidays);
router.post('/holidays', authorize('admin', 'staff'), settingsController.createHoliday);
router.post('/holidays/import', authorize('admin', 'staff'), settingsController.importHolidays);
router.put('/holidays/:id', authorize('admin', 'staff'), settingsController.updateHoliday);
router.delete('/holidays/:id', authorize('admin', 'staff'), settingsController.deleteHoliday);

// 通知設定
router.get('/notifications', settingsController.getNotificationSettings);
router.put('/notifications/:type', authorize('admin', 'staff'), settingsController.updateNotificationSetting);

// 教室管理
router.get('/classrooms', settingsController.getClassrooms);
router.post('/classrooms', authorize('admin', 'staff'), settingsController.createClassroom);
router.put('/classrooms/:id', authorize('admin', 'staff'), settingsController.updateClassroom);
router.delete('/classrooms/:id', authorize('admin', 'staff'), settingsController.deleteClassroom);

module.exports = router;
