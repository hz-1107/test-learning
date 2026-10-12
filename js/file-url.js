/**
 * 上傳檔案網址處理
 *
 * 資料庫存的是相對路徑（如 /uploads/photos/xxx.png），檔案實際由後端伺服器 (3000) 提供。
 * 頁面若由 Live Server (5500) 開啟，相對路徑會指向 5500 而讀不到圖片，
 * 因此顯示前一律補上後端網址。
 */
const FILE_SERVER_BASE = 'http://localhost:3000';

function fileUrl(url) {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  return FILE_SERVER_BASE + (url.startsWith('/') ? url : '/' + url);
}
