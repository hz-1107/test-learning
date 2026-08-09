const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有路由都需要認證
router.use(authenticate);

// 課程類型
router.get('/types', coursesController.getTypes);

// 課程管理路由
router.get('/', coursesController.getAll);
router.get('/:id', coursesController.getOne);
router.post('/', authorize('admin', 'staff'), coursesController.create);
router.put('/:id', authorize('admin', 'staff'), coursesController.update);
router.delete('/:id', authorize('admin', 'staff'), coursesController.delete);

// 選課/退選
router.post('/:id/enroll', authorize('admin', 'staff'), coursesController.enroll);
router.delete('/:id/enroll/:student_id', authorize('admin', 'staff'), coursesController.unenroll);

module.exports = router;
