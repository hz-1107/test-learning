const express = require('express');
const router = express.Router();
const scheduleCalendarController = require('../controllers/scheduleCalendarController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有路由都需要認證
router.use(authenticate);

// 課表查詢
router.get('/weekly', scheduleCalendarController.getWeeklySchedule);
router.get('/daily', scheduleCalendarController.getDailyScheduleByTeacher);

// 調課管理
router.get('/adjustments', scheduleCalendarController.getAdjustments);
router.post('/adjustments', authorize('admin', 'staff'), scheduleCalendarController.createAdjustment);
router.put('/adjustments/:id', authorize('admin', 'staff'), scheduleCalendarController.updateAdjustment);
router.delete('/adjustments/:id', authorize('admin', 'staff'), scheduleCalendarController.deleteAdjustment);

module.exports = router;
