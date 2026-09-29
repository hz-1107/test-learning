const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');

// 確保 uploads 目錄存在
const { UPLOAD_ROOT } = require('../config/uploads');
const uploadsDir = path.join(UPLOAD_ROOT, 'photos');
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

// 檔案過濾器 - 允許圖片，以及部分頁面（如競賽證明文件）UI 上已承諾支援的 PDF / Word 文件
// 注意：圖片格式需涵蓋手機相機常見輸出（如 iPhone 的 HEIC/HEIF），否則會出現
// 「選完照片後上傳被靜默拒絕、畫面立刻恢復成未選檔狀態」的情況，使用者體感像是閃退
const allowedTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/heic', 'image/heif', 'image/bmp', 'image/x-ms-bmp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支援此檔案格式，請上傳 JPG、PNG、HEIC、PDF 或 Word 文件'), false);
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
