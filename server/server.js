require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const routes = require('./routes');
const logsController = require('./controllers/logsController');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================
// 中介軟體設定
// =====================

// CORS 設定
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析 JSON 請求
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 靜態檔案服務 (上傳的檔案)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 靜態檔案服務 (前端網頁)
app.use(express.static(path.join(__dirname, '..')));

// 請求日誌
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// =====================
// API 路由
// =====================

app.use('/api', routes);

// =====================
// 錯誤處理
// =====================

// 404 處理
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: '找不到此 API 端點'
  });
});

// 全域錯誤處理
app.use((err, req, res, next) => {
  console.error('伺服器錯誤:', err);

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? '伺服器內部錯誤'
      : err.message
  });
});

// =====================
// 啟動伺服器
// =====================

// =====================
// 排程任務：自動建立日誌
// =====================

let autoCreateInterval = null;

function startAutoCreateScheduler() {
  // 每 30 分鐘執行一次自動建立日誌
  const intervalMinutes = 30;
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`⏰ 自動建立日誌排程已啟動 (每 ${intervalMinutes} 分鐘執行)`);

  // 伺服器啟動後延遲 10 秒執行第一次（確保資料庫連接完成）
  setTimeout(async () => {
    console.log('📋 執行初始日誌檢查...');
    await logsController.autoCreatePendingLogs();
  }, 10000);

  // 設定定期執行
  autoCreateInterval = setInterval(async () => {
    await logsController.autoCreatePendingLogs();
  }, intervalMs);
}

function stopAutoCreateScheduler() {
  if (autoCreateInterval) {
    clearInterval(autoCreateInterval);
    autoCreateInterval = null;
    console.log('⏰ 自動建立日誌排程已停止');
  }
}

// =====================
// 啟動伺服器
// =====================

async function startServer() {
  // 測試資料庫連接
  const dbConnected = await db.testConnection();

  if (!dbConnected) {
    console.error('⚠️  資料庫連接失敗，請檢查設定');
    console.log('💡 提示: 請確認 .env 檔案中的資料庫設定是否正確');
  } else {
    // 資料庫連接成功，啟動自動建立日誌排程
    startAutoCreateScheduler();
  }

  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 智慧學習歷程系統 API 伺服器已啟動');
    console.log(`📍 伺服器位址: http://localhost:${PORT}`);
    console.log(`📍 API 端點: http://localhost:${PORT}/api`);
    console.log(`🔧 環境: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    console.log('可用的 API 端點:');
    console.log('  POST   /api/auth/login          - 登入');
    console.log('  POST   /api/auth/register       - 註冊');
    console.log('  GET    /api/students            - 取得學生列表');
    console.log('  GET    /api/teachers            - 取得教師列表');
    console.log('  GET    /api/courses             - 取得課程列表');
    console.log('  GET    /api/logs                - 取得日誌列表');
    console.log('  GET    /api/settings            - 取得系統設定');
    console.log('');
  });
}

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉伺服器...');
  stopAutoCreateScheduler();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信號，正在關閉伺服器...');
  stopAutoCreateScheduler();
  process.exit(0);
});

startServer();
