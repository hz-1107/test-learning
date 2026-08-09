const express = require('express');
const router = express.Router();
const teachersController = require('../controllers/teachersController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有路由都需要認證
router.use(authenticate);

// 教師管理路由
router.get('/', teachersController.getAll);
router.get('/:id', teachersController.getOne);
router.post('/', authorize('admin', 'staff'), teachersController.create);
router.put('/:id', authorize('admin', 'staff'), teachersController.update);
router.delete('/:id', authorize('admin', 'staff'), teachersController.delete);

// 教師日誌
router.get('/:id/logs', teachersController.getLogs);

module.exports = router;
