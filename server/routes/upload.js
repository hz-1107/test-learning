const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');

// 確保 uploads 目錄存在
const uploadsDir = path.join(__dirname, '..', 'uploads', 'photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 設定 multer 儲存
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // 使用時間戳 + 隨機數 + 原始副檔名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// 檔案過濾器 - 只允許圖片
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允許上傳圖片檔案 (JPEG, PNG, GIF, WebP)'), false);
  }
};

// 設定上傳限制
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 上傳單張照片
router.post('/photo', authenticate, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '請選擇要上傳的照片'
      });
    }

    // 返回照片 URL
    const photoUrl = `/uploads/photos/${req.file.filename}`;

    res.json({
      success: true,
      message: '照片上傳成功',
      data: {
        url: photoUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('上傳照片錯誤:', error);
    res.status(500).json({
      success: false,
      message: '上傳失敗'
    });
  }
});

// 上傳多張照片
router.post('/photos', authenticate, upload.array('photos', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請選擇要上傳的照片'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      url: `/uploads/photos/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size
    }));

    res.json({
      success: true,
      message: `成功上傳 ${uploadedFiles.length} 張照片`,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('上傳照片錯誤:', error);
    res.status(500).json({
      success: false,
      message: '上傳失敗'
    });
  }
});

// 錯誤處理
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '檔案大小超過限制 (最大 10MB)'
      });
    }
  }
  res.status(500).json({
    success: false,
    message: error.message || '上傳失敗'
  });
});

module.exports = router;
