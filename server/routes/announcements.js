const express = require('express');
const router = express.Router();
const announcementsController = require('../controllers/announcementsController');
const { authenticate, authorize } = require('../middleware/auth');

// 公開路由 - 取得已發布公告
router.get('/published', announcementsController.getPublishedAnnouncements);

// 需要認證的路由
router.use(authenticate);

// 取得公告列表
router.get('/', announcementsController.getAnnouncements);

// 取得單一公告
router.get('/:id', announcementsController.getAnnouncement);

// 建立新公告 (僅限管理員/行政)
router.post('/', authorize('admin', 'staff'), announcementsController.createAnnouncement);

// 更新公告
router.put('/:id', authorize('admin', 'staff'), announcementsController.updateAnnouncement);

// 刪除公告
router.delete('/:id', authorize('admin', 'staff'), announcementsController.deleteAnnouncement);

// 發布定時公告 (系統內部使用)
router.post('/publish-scheduled', authorize('admin'), announcementsController.publishScheduledAnnouncements);

module.exports = router;
