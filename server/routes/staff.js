const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有路由都需要認證，且僅限行政／管理員
router.use(authenticate);
router.use(authorize('admin', 'staff'));

// 行政人員管理路由
router.get('/', staffController.getAll);
router.get('/:id', staffController.getOne);
router.post('/', staffController.create);
router.put('/:id', staffController.update);
router.delete('/:id', staffController.delete);

module.exports = router;
