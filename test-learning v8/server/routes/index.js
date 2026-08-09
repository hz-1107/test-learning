const express = require('express');
const router = express.Router();

// 引入各路由模組
const authRoutes = require('./auth');
const studentsRoutes = require('./students');
const teachersRoutes = require('./teachers');
const coursesRoutes = require('./courses');
const logsRoutes = require('./logs');
const settingsRoutes = require('./settings');
const schedulesRoutes = require('./schedules');
const scheduleCalendarRoutes = require('./scheduleCalendar');

// 註冊路由
router.use('/auth', authRoutes);
router.use('/students', studentsRoutes);
router.use('/teachers', teachersRoutes);
router.use('/courses', coursesRoutes);
router.use('/logs', logsRoutes);
router.use('/settings', settingsRoutes);
router.use('/schedules', schedulesRoutes);
router.use('/schedule-calendar', scheduleCalendarRoutes);

// API 首頁
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '智慧學習歷程系統 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      students: '/api/students',
      teachers: '/api/teachers',
      courses: '/api/courses',
      logs: '/api/logs',
      settings: '/api/settings',
      schedules: '/api/schedules',
      scheduleCalendar: '/api/schedule-calendar'
    }
  });
});

module.exports = router;
