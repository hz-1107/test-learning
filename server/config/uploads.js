const os = require('os');
const path = require('path');

// 上傳檔案存放在專案資料夾「之外」：
// 若放在專案內，VS Code Live Server 偵測到新檔案會自動重新整理頁面，
// 導致新增競賽等視窗在選完圖片後直接被關掉。
// 可用 .env 的 UPLOAD_ROOT 自訂位置。
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.join(os.homedir(), 'test-learning-uploads');

// 舊版存放位置（server/uploads），保留供既有圖片讀取
const LEGACY_UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

module.exports = { UPLOAD_ROOT, LEGACY_UPLOAD_ROOT };
